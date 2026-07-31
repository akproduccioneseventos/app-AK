
'use server';

import type { CrmLead, CrmStage, NewCrmLeadData, CrmTimelineItem } from '@/types/crm';
import { readData, writeData } from '@/lib/data-service';
import { saveCustomer, getCustomers } from '@/app/actions/customers'; 
import { getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';
import { saveFiesta, syncFiestaFromBudget, getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceById, saveInvoice } from '@/app/actions/invoices';
import { createNotification } from '@/lib/notifications/create-notification';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto, PagoCliente, MetodoPago } from '@/types/presupuesto';
import { initialFiestaActualData, defaultModulosContratados } from '@/lib/fiesta-defaults';
import * as logger from '@/lib/logger';
import { normalizePresupuestoFinancials, roundMoney, validatePaymentAgainstBudget, parseCleanMoney } from '@/lib/budget/financial-guardrails';
import { verifySession } from '@/lib/auth/session-token';
import { requireAppSession } from '@/lib/auth/require-session';
import type { CommercialAttribution, CommercialSource } from '@/lib/commercial/acquisition';
import { sanitizeCommercialAttribution } from '@/lib/commercial/acquisition';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { DEFAULT_CRM_STAGES } from '@/lib/crm/default-stages';

const LEADS_FILE = 'crm-leads.json';
const STAGES_FILE = 'crm-stages.json';
const TRASH_NAMES = ['test', 'prueba', 'asdf', 'qwerty', 'xxx', 'zzz', 'aaa', 'bbb', 'admin', 'usuario', 'user', 'nombre'];

/** Normalizes a phone number: removes spaces, dashes, parens and keeps the last 9 digits. */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().+]/g, '').replace(/\D/g, '').slice(-9);
}

/** Normalizes a name for comparison: lowercase, trim, collapse spaces. */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function cleanCrmLeadForFirestore(lead: CrmLead): CrmLead {
  return JSON.parse(JSON.stringify(lead)) as CrmLead;
}

async function createCrmLeadDocument(newLead: CrmLead, knownLeads?: CrmLead[]): Promise<void> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (dbAdmin) {
    await dbAdmin.collection('prospectos').doc(newLead.id).create({
      ...cleanCrmLeadForFirestore(newLead),
      _syncedAt: new Date().toISOString(),
    });
    return;
  }
  const leads = knownLeads ?? await readData<CrmLead[]>(LEADS_FILE, []);
  await writeData(LEADS_FILE, [...leads, newLead]);
}

async function mutateCrmLeadDocument(
  leadId: string,
  mutate: (lead: CrmLead) => CrmLead,
): Promise<CrmLead | null> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (dbAdmin) {
    let updated: CrmLead | null = null;
    const ref = dbAdmin.collection('prospectos').doc(leadId);
    await dbAdmin.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return;
      const data = { ...snapshot.data() } as CrmLead & { _syncedAt?: string };
      delete data._syncedAt;
      updated = cleanCrmLeadForFirestore(mutate(data));
      transaction.set(ref, {
        ...updated,
        _syncedAt: new Date().toISOString(),
      });
    });
    return updated;
  }

  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  const index = leads.findIndex((lead) => lead.id === leadId);
  if (index === -1) return null;
  leads[index] = mutate(leads[index]);
  await writeData(LEADS_FILE, leads);
  return leads[index];
}

async function deleteCrmLeadDocument(leadId: string): Promise<boolean> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (dbAdmin) {
    const ref = dbAdmin.collection('prospectos').doc(leadId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return false;
    await ref.delete();
    return true;
  }
  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  const next = leads.filter((lead) => lead.id !== leadId);
  if (next.length === leads.length) return false;
  await writeData(LEADS_FILE, next);
  return true;
}

const MIN_NAME_LENGTH_FOR_PARTIAL_MATCH = 6;
const getBudgetSourceLabel = (source?: string) => {
  if (source === 'simulator_assistant') return 'Simulador con asistente';
  if (source === 'simulator_common') return 'Simulador común';
  if (source === 'portal_led') return 'Portal LED';
  if (source === 'simulator') return 'Simulador';
  return 'Manual';
};

function namesAreSimilar(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  if (na.length >= MIN_NAME_LENGTH_FOR_PARTIAL_MATCH && nb.includes(na)) return true;
  if (nb.length >= MIN_NAME_LENGTH_FOR_PARTIAL_MATCH && na.includes(nb)) return true;
  return false;
}

function toTitleCase(name: string): string {
  return name.toLowerCase().split(' ').map(word =>
    word ? word.charAt(0).toUpperCase() + word.slice(1) : word
  ).join(' ');
}

export async function getCrmStages(): Promise<CrmStage[]> {
  const stages = await readData<CrmStage[]>(STAGES_FILE, DEFAULT_CRM_STAGES);
  return stages.length > 0 ? stages : DEFAULT_CRM_STAGES;
}

export async function getCrmLeads(page?: number, limit = 50): Promise<CrmLead[]> {
  const auth = await verifySession();
  if (!auth.success) throw new Error('No autorizado');
  const allLeads = await readData<CrmLead[]>(LEADS_FILE, []);
  const decoratedLeads = await (async () => {
    try {
      const fiestas = await getFiestas(true);
      const latestContractByPresupuesto = new Map<string, { tipo?: string; fecha?: string; plantillaId?: string }>();
      for (const fiesta of fiestas) {
        if (!fiesta.presupuestoId || !fiesta.contratoGenerado?.tipo) continue;
        const current = latestContractByPresupuesto.get(fiesta.presupuestoId);
        if (!current || (fiesta.contratoGenerado.fecha || '') > (current.fecha || '')) {
          latestContractByPresupuesto.set(fiesta.presupuestoId, fiesta.contratoGenerado);
        }
      }
      return allLeads.map((lead) => {
        const contract = lead.presupuestoId ? latestContractByPresupuesto.get(lead.presupuestoId) : undefined;
        if (!contract?.tipo) return lead;
        return {
          ...lead,
          contractGeneratedType: contract.tipo,
          contractGeneratedAt: contract.fecha,
          contractTemplateId: contract.plantillaId,
        };
      });
    } catch {
      return allLeads;
    }
  })();

  if (page === undefined) return decoratedLeads;
  const start = page * limit;
  return decoratedLeads.slice(start, start + limit);
}

export async function getCrmLeadsForDashboard(): Promise<CrmLead[]> {
  const auth = await verifySession();
  if (!auth.success) throw new Error('No autorizado');
  return readData<CrmLead[]>(LEADS_FILE, []);
}

export type CrmAgendaEntry = Pick<CrmLead, 'id' | 'name' | 'phone' | 'followUpDate'>;
export type CrmLeadOption = Pick<CrmLead, 'id' | 'name'>;

export async function getCrmAgendaEntries(): Promise<CrmAgendaEntry[]> {
  const auth = await verifySession();
  if (!auth.success) throw new Error('No autorizado');
  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  return leads
    .filter((lead) => Boolean(lead.followUpDate) && !Number.isNaN(new Date(lead.followUpDate!).getTime()))
    .map(({ id, name, phone, followUpDate }) => ({ id, name, phone, followUpDate }))
    .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());
}

export async function getCrmLeadOptions(): Promise<CrmLeadOption[]> {
  const auth = await verifySession();
  if (!auth.success) throw new Error('No autorizado');
  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  return leads
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addCrmLead(leadData: NewCrmLeadData): Promise<{ success: boolean; lead?: CrmLead; error?: string; duplicate?: CrmLead }> {
  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error };
  const nameCleaned = (leadData.name || '').trim().replace(/\s+/g, ' ');
  const nameOnlyLetters = nameCleaned.replace(/\p{Emoji}/gu, '').replace(/\d/g, '').trim();
  if (nameCleaned.length < 3) {
    return { success: false, error: 'El nombre es demasiado corto (mínimo 3 caracteres).' };
  }
  if (nameOnlyLetters.length < 2) {
    return { success: false, error: 'El nombre debe contener al menos 2 letras reales.' };
  }
  if (/^\d+$/.test(nameCleaned)) {
    return { success: false, error: 'El nombre no puede ser solo números.' };
  }
  if (TRASH_NAMES.includes(nameCleaned.toLowerCase())) {
    return { success: false, error: 'El nombre no es válido.' };
  }

  // Sanitize other fields
  const nameNormalized = toTitleCase(nameCleaned);
  const phoneNormalized = leadData.phone ? leadData.phone.replace(/[\s\-().]/g, '') : leadData.phone;
  const notesSanitized = leadData.notes ? leadData.notes.slice(0, 1000) : leadData.notes;

  const sanitizedData: NewCrmLeadData = {
    ...leadData,
    name: nameNormalized,
    phone: phoneNormalized,
    notes: notesSanitized,
  };

  const leads = await getCrmLeads();
  const stages = await getCrmStages();
  const now = new Date().toISOString();

  // Duplicate detection by phone
  if (sanitizedData.phone) {
    const normalizedPhone = normalizePhone(sanitizedData.phone);
    const duplicate = leads.find((l) => {
      if (!l.phone || normalizePhone(l.phone) !== normalizedPhone) return false;
      if (sanitizedData.presupuestoId && l.presupuestoId === sanitizedData.presupuestoId) return false;
      return true;
    });
    if (duplicate) {
      logger.warn('[CRM] Duplicado detectado por teléfono:', { existing: duplicate.name, incoming: nameNormalized });
      return { success: false, error: `Ya existe un prospecto con este teléfono: "${duplicate.name}".`, duplicate };
    }
  }

  // Duplicate detection by similar name + same event type
  const partyType = sanitizedData.partyType;
  const duplicateByName = leads.find(l => {
    const sameEventType = !partyType || !l.partyType || l.partyType === partyType;
    return namesAreSimilar(l.name, nameNormalized) && sameEventType;
  });
  if (duplicateByName) {
    logger.warn('[CRM] Duplicado detectado por nombre:', { existing: duplicateByName.name, incoming: nameNormalized });
    return { success: false, error: `Ya existe un prospecto con un nombre similar: "${duplicateByName.name}".`, duplicate: duplicateByName };
  }

  const newLead: CrmLead = {
    ...sanitizedData,
    id: `lead_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    currentStageId: sanitizedData.currentStageId || stages[0].id,
    timeline: [
      {
        id: `tl_${Date.now()}`,
        type: 'lead_created',
        timestamp: now,
        description: 'Prospecto creado',
      },
    ],
  };
  await createCrmLeadDocument(newLead, leads);

  // Notificación de negocio: nuevo prospecto/lead ingresado
  createNotification({
    titulo: 'Nuevo Prospecto',
    mensaje: `Nuevo lead registrado: ${newLead.name}${newLead.partyType ? ` (${newLead.partyType})` : ''}.`,
    href: `/contabilidad/crm`,
    icono: 'MessageSquareText',
    tipo: 'aviso',
    entidadRelacionadaId: newLead.id,
    rolDestino: 'admin',
  }).catch(err => console.warn('Error creating lead notification:', err));

  logger.info('[CRM] Nuevo prospecto registrado:', { id: newLead.id, name: newLead.name, partyType: newLead.partyType });

  return { success: true, lead: newLead };
}

export async function moveCrmLead(leadId: string, newStageId: string, meetingDate?: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error };
  const lead = await mutateCrmLeadDocument(leadId, (current) => ({
    ...current,
    currentStageId: newStageId,
    updatedAt: new Date().toISOString(),
    ...(meetingDate ? { followUpDate: meetingDate } : {}),
  }));
  return lead ? { success: true, lead } : { success: false, error: 'No encontrado' };
}

export async function scheduleCrmMeeting(leadId: string, date: string, title?: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const parsedDate = new Date(date);
    if (!date || Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: 'La fecha de la reunión no es válida.' };
    }
    const normalizedDate = parsedDate.toISOString();
    const lead = await mutateCrmLeadDocument(leadId, (current) => {
      const existingNotes = current.notes || '';
      const now = new Date().toISOString();
      const meetingTitle = title?.trim() || 'Reunión de seguimiento';
      return {
        ...current,
        followUpDate: normalizedDate,
        updatedAt: now,
        ...(title ? { notes: `${existingNotes}\n[REUNIÓN AGENDADA: ${meetingTitle} para el ${parsedDate.toLocaleString('es-ES')}]`.trim() } : {}),
        timeline: [
          ...(current.timeline || []),
          {
            id: `tl_meeting_${Date.now()}`,
            type: 'meeting_scheduled',
            timestamp: now,
            description: `${meetingTitle}: ${parsedDate.toLocaleString('es-ES')}`,
          },
        ],
      };
    });
    return lead ? { success: true, lead } : { success: false, error: 'Prospecto no encontrado' };
}

export async function deleteCrmLead(leadId: string): Promise<{ success: boolean; error?: string }> {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    return await deleteCrmLeadDocument(leadId)
      ? { success: true }
      : { success: false, error: 'No encontrado' };
}

/**
 * Resets the CRM by deleting all leads from Firestore. Stages are preserved.
 * This is a destructive admin-only operation and requires explicit confirmation in the UI.
 */
export async function resetCrm(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
        const auth = await verifySession();
        if (!auth.success) return { success: false, error: auth.error };
        if (auth.user?.role !== 'admin') {
            return { success: false, error: 'Acceso restringido a administradores.' };
        }
        const leads = await getCrmLeads();
        const deletedCount = leads.length;

        const { dbAdmin } = await import('@/lib/firebase/server');
        if (dbAdmin) {
            const snapshot = await dbAdmin.collection('prospectos').get();
            const batchSize = 450;
            const docs = snapshot.docs;
            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = dbAdmin.batch();
                docs.slice(i, i + batchSize).forEach((doc: { ref: any }) => batch.delete(doc.ref));
                await batch.commit();
            }
        }

        // writeData clears persisted leads in the active storage backend (Firestore).
        await writeData(LEADS_FILE, []);
        // Keep the local JSON mirror in sync as an explicit fallback/source for local tooling.
        const fs = await import('fs/promises');
        const path = await import('path');
        const localLeadsPath = path.join(process.cwd(), 'src', 'data', LEADS_FILE);
        try {
            await fs.writeFile(localLeadsPath, JSON.stringify([], null, 2), 'utf-8');
        } catch (localWriteError) {
            logger.warn('[CRM] No se pudo limpiar espejo local de leads tras reset:', localWriteError);
        }

        logger.info('[CRM] CRM reiniciado por admin. Prospectos eliminados:', { deletedCount });
        return { success: true, deletedCount };
    } catch (error: any) {
        logger.error('[CRM] Error al reiniciar CRM:', error);
        return { success: false, error: error.message || 'Error al reiniciar el CRM.' };
    }
}

export async function recordWhatsAppOpened(leadId: string, message: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const now = new Date().toISOString();
    const noteEntry = `[WhatsApp abierto ${new Date(now).toLocaleString('es-ES')}]: ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`;
    const timelineEntry: CrmTimelineItem = {
        id: `tl_${Date.now()}`,
        type: 'whatsapp_opened',
        timestamp: now,
        description: `WhatsApp abierto con mensaje preparado: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`,
    };
    const lead = await mutateCrmLeadDocument(leadId, (current) => ({
      ...current,
      updatedAt: now,
      notes: current.notes ? `${current.notes}\n${noteEntry}` : noteEntry,
      timeline: [...(current.timeline || []), timelineEntry],
    }));
    return lead ? { success: true, lead } : { success: false, error: 'Prospecto no encontrado' };
}

export async function updateCrmLeadField(
    leadId: string,
    fields: Partial<Pick<CrmLead, 'assignedTo' | 'notes' | 'followUpDate'>>
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const lead = await mutateCrmLeadDocument(leadId, (current) => ({
      ...current,
      ...fields,
      updatedAt: new Date().toISOString(),
    }));
    return lead ? { success: true, lead } : { success: false, error: 'Prospecto no encontrado' };
}

export async function checkDuplicatePhone(phone: string): Promise<{ duplicate: CrmLead | null }> {
    const auth = await verifySession();
    if (!auth.success) throw new Error('No autorizado');
    if (!phone) return { duplicate: null };
    const leads = await getCrmLeads();
    const normalized = normalizePhone(phone);
    const found = leads.find(l => l.phone && normalizePhone(l.phone) === normalized) ?? null;
    return { duplicate: found };
}

export async function registerContractDeposit(params: {
  presupuesto: Presupuesto;
  monto: number;
  referencia?: string;
  // TODO(Fase 3): accept metodoPago from form when the booking flow collects it.
  metodoPago?: MetodoPago;
}): Promise<{ updatedPresupuesto: Presupuesto; pagoId: string }> {
  const { presupuesto, monto, referencia, metodoPago } = params;
  const paymentValidation = validatePaymentAgainstBudget(presupuesto, monto, { includePendingForLimit: true });
  if (!paymentValidation.ok) {
    throw new Error(paymentValidation.error);
  }

  const normalizedAmount = roundMoney(monto);
  const now = new Date().toISOString();
  const pagoId = `pago_senia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const newPago: PagoCliente = {
    id: pagoId,
    fecha: now,
    monto: normalizedAmount,
    metodoPago: metodoPago ?? 'Efectivo',
    referencia: referencia ?? 'Seña registrada al firmar contrato',
    estadoPago: 'confirmado',
  };

  const updatedPagosCliente = [...(presupuesto.pagosCliente ?? []), newPago];

  const updatedPresupuesto: Presupuesto = normalizePresupuestoFinancials({
    ...presupuesto,
    pagosCliente: updatedPagosCliente,
    senia: roundMoney((presupuesto.senia ?? 0) + normalizedAmount),
  }, { preserveStoredTotal: true });

  // Sync invoice payments if invoice exists
  if (presupuesto.invoiceId) {
    try {
      const invoice = await getInvoiceById(presupuesto.invoiceId);
      if (invoice) {
        const metodoStr = newPago.metodoPago as string;
        const invoiceMethod: 'Transferencia' | 'Efectivo' | 'Tarjeta' | 'Otro' =
          (metodoStr === 'Transferencia Bancaria' || metodoStr === 'Transferencia') ? 'Transferencia'
          : metodoStr === 'Tarjeta' ? 'Tarjeta'
          : metodoStr === 'Efectivo' ? 'Efectivo'
          : 'Otro';
        const invoicePayment = {
          id: pagoId,
          paymentDate: now,
          amount: normalizedAmount,
          method: invoiceMethod,
          notes: referencia ?? 'Seña registrada al firmar contrato',
        };
        const updatedInvoice = {
          ...invoice,
          payments: [...(invoice.payments ?? []), invoicePayment],
        };
        await saveInvoice(updatedInvoice);
      }
    } catch (e) {
      logger.warn('[registerContractDeposit] Error syncing invoice payments', e);
    }
  }

  return { updatedPresupuesto, pagoId };
}

export async function confirmBookingWithContract(formData: FormData): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const leadId = formData.get('leadId') as string;
    const presupuestoId = formData.get('presupuestoId') as string;
    const contractFile = formData.get('contract') as File | null;
    const archiveLead = formData.get('archiveLead') === 'true';

    // Datos finales del formulario (prioridad sobre los datos stale del lead/presupuesto)
    const formName = (formData.get('name') as string)?.trim() || undefined;
    const formPhone = (formData.get('phone') as string)?.trim() || undefined;
    const ci = (formData.get('ci') as string)?.trim() || undefined;
    const address = (formData.get('address') as string)?.trim() || undefined;
    const formSalon = (formData.get('salon') as string)?.trim() || undefined;
    const formFechaEvento = (formData.get('eventoFecha') as string)?.trim() || undefined;
    const rawMontoSenia = formData.get('montoSenia') as string | undefined;
    const formMontoSenia = rawMontoSenia ? parseCleanMoney(rawMontoSenia) : undefined;
    const formMetodoPago = (formData.get('metodoPago') as MetodoPago | null) ?? undefined;
    const formCompanyName = (formData.get('companyName') as string)?.trim() || undefined;
    const formTaxId = (formData.get('taxId') as string)?.trim() || undefined;

    if (!leadId || !presupuestoId) throw new Error('Datos incompletos.');

    // Validate file only if one was provided
    const hasFile = contractFile && contractFile.size > 0;
    if (hasFile && contractFile.type !== 'application/pdf') {
      throw new Error('El archivo de contrato debe ser un PDF.');
    }

    const [leads, presupuesto, stages, customersList, fiestas] = await Promise.all([
      getCrmLeads(),
      getPresupuestoById(presupuestoId),
      getCrmStages(),
      getCustomers(),
      getFiestas(true)
    ]);

    const lead = leads.find(l => l.id === leadId);
    if (!lead || !presupuesto) throw new Error('Datos no encontrados');

    // Idempotency: Check if a Fiesta for this budget already exists
    const existingFiesta = fiestas.find(f => f.presupuestoId === presupuestoId);
    if (existingFiesta) {
      logger.info(`[CRM] Reservación ya confirmada para presupuestoId ${presupuestoId}. Retornando fiesta existente: ${existingFiesta.id}`);
      return { success: true, fiestaId: existingFiesta.id };
    }

    const conversionStage = stages.find(s => s.isConversionStage);

    // Usar datos del formulario cuando estén disponibles; fallback a los datos del lead/presupuesto
    const finalName = formName || lead.name;
    const finalPhone = formPhone || lead.phone;
    const finalSalon = formSalon || presupuesto.salonFiestas;
    const finalFechaEvento = formFechaEvento || presupuesto.eventoFecha;
    const finalCompanyName = formCompanyName || (lead as any).companyName || (presupuesto as any).clienteEmpresa;
    const finalTaxId = formTaxId || (lead as any).taxId;

    let contractFileName: string | undefined;

    // 1. Save contract file if provided
    if (hasFile) {
      const { uploadToStorage } = await import('@/lib/firebase/storage');
      const sanitizedLeadName = finalName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const storageName = `contrato_${sanitizedLeadName}_${Date.now()}.pdf`;
      const storagePath = `contracts/${storageName}`;
      const arrayBuffer = await contractFile!.arrayBuffer();
      contractFileName = await uploadToStorage(Buffer.from(arrayBuffer), storagePath, 'application/pdf', false);
    }

    // 2. Create Customer with overridden form data
    const existingCustomer = customersList.find(c => c.presupuestoId === presupuestoId);
    let customerId = existingCustomer?.id;

    if (!customerId) {
      const customerResult = await saveCustomer({
        name: finalName,
        phone: finalPhone,
        companyName: finalCompanyName || undefined,
        taxId: finalTaxId || undefined,
        ci,
        address,
        estadoCliente: 'Actual',
        partyDate: finalFechaEvento,
        partyType: presupuesto.eventoTipo,
        venueName: finalSalon,
        guestCount: presupuesto.invitadosCantidad,
        ...(contractFileName ? { contractFileName } : {}),
        presupuestoId: presupuesto.id,
      } as any, { skipFiestaCreation: true });

      if (!customerResult.success || !customerResult.id) throw new Error(customerResult.error);
      customerId = customerResult.id;
    }

    // 3. Construir info de firma del contrato
    const now = new Date().toISOString();

    const contratoFirmaInfo = {
      isSigned: true,
      method: 'physical' as const,
      signedAt: now,
      signedBy: finalName,
      notes: `Firma registrada al confirmar contratación. CI: ${ci || 'N/D'}. Domicilio: ${address || 'N/D'}.`,
    };

    // 3. Update Presupuesto FIRST with form data, set estado='Aceptado'
    const presupuestoWithFormData: Presupuesto = {
      ...presupuesto,
      estado: 'Aceptado',
      clienteNombre: finalName,
      clienteContacto: finalPhone || presupuesto.clienteContacto,
      salonFiestas: finalSalon,
      eventoFecha: finalFechaEvento || presupuesto.eventoFecha,
      fechaFirmaContrato: now,
    };

    // 4. Register deposit via registerContractDeposit
    let finalPresupuesto = presupuestoWithFormData;
    if (formMontoSenia !== undefined && formMontoSenia > 0) {
      const { updatedPresupuesto } = await registerContractDeposit({
        presupuesto: presupuestoWithFormData,
        monto: formMontoSenia,
        referencia: 'Seña registrada al firmar contrato',
        metodoPago: formMetodoPago,
      });
      finalPresupuesto = updatedPresupuesto;
    }

    // 5. Save the fully updated presupuesto
    await updatePresupuesto(finalPresupuesto);

    // 6. Create Fiesta using updated presupuesto data
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      estado: 'Contratada',
      presupuestoId: presupuesto.id,
      contratoFirmaInfo,
      configuracion: {
        ...initialFiestaActualData.configuracion,
        clienteId: customerId,
        nombreEvento: `${presupuesto.eventoTipo} de ${finalName}`,
        fechaEvento: finalFechaEvento,
        nombreLugar: finalSalon,
        invitadosEstimados: presupuesto.invitadosCantidad,
        presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
      }
    };
    newFiesta.modulosContratados = { ...defaultModulosContratados };
    await saveFiesta(newFiesta);

    // 7. Sync from budget (now uses fresh data)
    await syncFiestaFromBudget(newFiesta.id);

    // 8. Update lead: move to conversion stage, add timeline events, link contract
    {
      const timelineItems: CrmTimelineItem[] = [
          {
            id: `tl_contract_${Date.now()}`,
            type: 'contract_signed',
            timestamp: now,
            description: `Contrato firmado. CI: ${ci || 'N/D'}. Salón: ${finalSalon || 'N/D'}.`,
          },
      ];
      if (formMontoSenia !== undefined && formMontoSenia > 0) {
        timelineItems.push({
          id: `tl_deposit_${Date.now()}`,
          type: 'deposit_registered',
          timestamp: now,
          description: `Seña registrada: $${formMontoSenia.toLocaleString('es-UY')} UYU.`,
          meta: { monto: formMontoSenia },
        });
      }
      timelineItems.push({
          id: `tl_event_${Date.now()}`,
          type: 'event_created',
          timestamp: now,
          description: `Evento creado: ${newFiesta.configuracion.nombreEvento} (ID: ${newFiesta.id}).`,
      });
      await mutateCrmLeadDocument(leadId, (current) => ({
        ...current,
        ...(archiveLead && conversionStage ? { currentStageId: conversionStage.id } : {}),
        ...(contractFileName ? { contractFileName } : {}),
        timeline: [
          ...(current.timeline || []),
          ...timelineItems,
        ],
        updatedAt: now,
      } as CrmLead));
    }

    await createNotification({
      mensaje: `¡Contratación Confirmada! ${finalName} es ahora cliente. ${contractFileName ? 'Contrato vinculado.' : 'El borrador del contrato está listo para revisar.'}`,
      href: `/fiestas/nueva?fiestaId=${newFiesta.id}`,
      icono: 'PartyPopper'
    });

    return { success: true, fiestaId: newFiesta.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function confirmBooking(leadId: string, presupuestoId: string, archiveLead = false): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const [leads, presupuesto, stages, customersList, fiestas] = await Promise.all([
      getCrmLeads(),
      getPresupuestoById(presupuestoId),
      getCrmStages(),
      getCustomers(),
      getFiestas(true)
    ]);

    const lead = leads.find(l => l.id === leadId);
    if (!lead || !presupuesto) throw new Error("Datos no encontrados");

    // Idempotency: Check if a Fiesta for this budget already exists
    const existingFiesta = fiestas.find(f => f.presupuestoId === presupuestoId);
    if (existingFiesta) {
      logger.info(`[CRM] Reservación ya confirmada para presupuestoId ${presupuestoId}. Retornando fiesta existente: ${existingFiesta.id}`);
      return { success: true, fiestaId: existingFiesta.id };
    }

    const conversionStage = stages.find(s => s.isConversionStage);

    // 1. Crear Cliente con datos completos del presupuesto y lead
    //    Skip automatic fiesta creation - we create the fiesta manually below with budget data
    const existingCustomer = customersList.find(c => c.presupuestoId === presupuestoId);
    let customerId = existingCustomer?.id;

    if (!customerId) {
      const customerResult = await saveCustomer({
        name: lead.name,
        phone: lead.phone,
        companyName: (lead as any).companyName || (presupuesto as any).clienteEmpresa || undefined,
        taxId: (lead as any).taxId || undefined,
        estadoCliente: 'Actual',
        partyDate: presupuesto.eventoFecha,
        partyType: presupuesto.eventoTipo,
        venueName: presupuesto.salonFiestas,
        guestCount: presupuesto.invitadosCantidad,
        presupuestoId: presupuesto.id,
      } as any, { skipFiestaCreation: true });

      if (!customerResult.success || !customerResult.id) throw new Error(customerResult.error);
      customerId = customerResult.id;
    }

    // 2. Crear Fiesta
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      estado: 'Contratada',
      presupuestoId: presupuesto.id,
      configuracion: {
        ...initialFiestaActualData.configuracion,
        clienteId: customerId,
        nombreEvento: `${presupuesto.eventoTipo} de ${lead.name}`,
        fechaEvento: presupuesto.eventoFecha,
        nombreLugar: presupuesto.salonFiestas,
        invitadosEstimados: presupuesto.invitadosCantidad,
        presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
      }
    };
    
    newFiesta.modulosContratados = { ...defaultModulosContratados };

    await saveFiesta(newFiesta);

    // 3. Disparar Sincronización Maestra (Personal, Lavadero, etc.)
    await syncFiestaFromBudget(newFiesta.id);

    // 4. Actualizar Presupuesto
    await updatePresupuesto({ ...presupuesto, estado: 'Aceptado' });

    // 5. Mover Lead a conversión solo si el usuario lo solicitó explícitamente
    if (archiveLead && conversionStage) {
      await moveCrmLead(lead.id, conversionStage.id);
    }

    await createNotification({
      mensaje: `¡Contratación Confirmada! ${lead.name} es ahora cliente.`,
      href: `/fiestas/nueva?fiestaId=${newFiesta.id}`,
      icono: 'PartyPopper'
    });

    return { success: true, fiestaId: newFiesta.id };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCrmKpiData() {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const [leads, presupuestos] = await Promise.all([getCrmLeads(), readData<any[]>('presupuestos.json', []).catch(() => [])]);
    const activeLeads = leads.filter(l => l.currentStageId !== 's4' && l.currentStageId !== 's5');
    const pipelineValue = (presupuestos || [])
        .filter(p => activeLeads.some(l => l.presupuestoId === p.id))
        .reduce((sum, p) => sum + (p.totalConDescuento ?? p.costoTotalEstimado), 0);

    const wonCount = leads.filter(l => l.currentStageId === 's4').length;
    const lostCount = leads.filter(l => l.currentStageId === 's5').length;
    const totalFinished = wonCount + lostCount;

    return {
        success: true,
        data: {
            activeLeads: activeLeads.length,
            pipelineValue,
            conversionRate: totalFinished > 0 ? (wonCount / totalFinished) * 100 : 0,
            wonLeads: wonCount,
            lostLeads: lostCount
        }
    };
}

export async function getCrmBoardData(): Promise<{
    success: boolean;
    data?: { stages: CrmStage[]; leads: CrmLead[]; kpis: any };
    error?: string;
}> {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    try {
        const [stages, leads, presupuestos] = await Promise.all([
            getCrmStages(),
            getCrmLeads(),
            readData<any[]>('presupuestos.json', []).catch(() => []),
        ]);
        const activeLeads = leads.filter(lead => lead.currentStageId !== 's4' && lead.currentStageId !== 's5');
        const pipelineValue = presupuestos
            .filter(presupuesto => activeLeads.some(lead => lead.presupuestoId === presupuesto.id))
            .reduce((sum, presupuesto) => sum + (presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado ?? 0), 0);
        const wonLeads = leads.filter(lead => lead.currentStageId === 's4').length;
        const lostLeads = leads.filter(lead => lead.currentStageId === 's5').length;
        const totalFinished = wonLeads + lostLeads;
        return {
            success: true,
            data: {
                stages,
                leads,
                kpis: {
                    activeLeads: activeLeads.length,
                    pipelineValue,
                    conversionRate: totalFinished > 0 ? (wonLeads / totalFinished) * 100 : 0,
                    wonLeads,
                    lostLeads,
                },
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message || 'No se pudo cargar el tablero comercial.' };
    }
}

export async function findLeadByBudgetOrCreate(presupuesto: any) {
    await requireAppSession();
    const leads = await getCrmLeads();
    const stages = await getCrmStages();
    const budgetSource = presupuesto.source || 'manual';
    const budgetTimestamp = presupuesto.timestamp || new Date().toISOString();
    
    // Normalizar datos de búsqueda para evitar duplicados
    const searchName = presupuesto.clienteNombre?.toLowerCase().trim().replace(/\s+/g, ' ');
    const searchPhone = presupuesto.clienteContacto ? normalizePhone(presupuesto.clienteContacto) : undefined;

    // 1. Intentar encontrar por ID vinculada o ID de presupuesto
    let leadIndex = leads.findIndex(l => 
        (presupuesto.leadId && l.id === presupuesto.leadId) || 
        (l.presupuestoId === presupuesto.id)
    );
    
    // 2. Intentar encontrar por Nombre o Teléfono Normalizado (Evita duplicados)
    if (leadIndex === -1 && (searchName || searchPhone)) {
        leadIndex = leads.findIndex(l => {
            const leadName = l.name?.toLowerCase().trim().replace(/\s+/g, ' ');
            const leadPhone = l.phone ? normalizePhone(l.phone) : undefined;
            return (searchName && leadName === searchName) || 
                   (searchPhone && leadPhone && leadPhone === searchPhone);
        });
    }

    if (leadIndex === -1) {
        // Crear nuevo si no se encuentra nada
        const res = await addCrmLead({
            name: presupuesto.clienteNombre,
            phone: presupuesto.clienteContacto,
            presupuestoId: presupuesto.id,
            presupuestoEstado: presupuesto.estado,
            partyType: presupuesto.eventoTipo,
            venueName: presupuesto.salonFiestas,
            guestCount: presupuesto.invitadosCantidad,
            budgetSource,
            lastBudgetAt: budgetTimestamp,
            currentStageId: stages[0].id
        } as NewCrmLeadData);
        return { lead: res.lead!, isNew: true };
    } else {
        const leadId = leads[leadIndex].id;
        const updatedLead = await mutateCrmLeadDocument(leadId, (current) => {
          let currentStageId = current.currentStageId;
          if (presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado') {
            currentStageId = stages.find((stage) => stage.isConversionStage)?.id || currentStageId;
          } else if (presupuesto.estado === 'Enviado' && (currentStageId === stages[0].id || currentStageId === 's1')) {
            currentStageId = stages.find((stage) => stage.name.toLowerCase().includes('presupuesto'))?.id || currentStageId;
          }
          return {
            ...current,
            presupuestoId: presupuesto.id,
            presupuestoEstado: presupuesto.estado,
            ...(presupuesto.invoiceId ? { invoiceId: presupuesto.invoiceId } : {}),
            ...(presupuesto.clienteContacto ? { phone: presupuesto.clienteContacto } : {}),
            ...(presupuesto.eventoTipo ? { partyType: presupuesto.eventoTipo } : {}),
            ...(presupuesto.salonFiestas ? { venueName: presupuesto.salonFiestas } : {}),
            ...(presupuesto.invitadosCantidad ? { guestCount: presupuesto.invitadosCantidad } : {}),
            budgetSource,
            lastBudgetAt: budgetTimestamp,
            currentStageId,
            timeline: [
              ...(current.timeline || []),
              {
                id: `tl_${Date.now()}`,
                type: 'presupuesto_created',
                timestamp: budgetTimestamp,
                description: `Presupuesto ${presupuesto.numero ? `#${presupuesto.numero}` : ''} registrado desde ${getBudgetSourceLabel(budgetSource)}`.trim(),
                meta: { source: budgetSource },
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        });
        return { lead: updatedLead || leads[leadIndex], isNew: false };
    }
}

export interface LandingLeadData {
  nombre: string;
  telefono: string;
  email?: string;
  tipoEvento?: string;
  fechaEstimada?: string;
  invitados?: number;
  mensaje?: string;
  fuente: CommercialSource | 'promo-widget' | 'landing-bodas' | 'landing-xv' | 'landing-eventos' | 'landing-quince' | 'landing-cumpleanos';
  acquisition?: CommercialAttribution;
}

export async function saveLead(data: LandingLeadData): Promise<{ success: boolean; error?: string }> {
  try {
    const phone = normalizeUruguayPhone(data.telefono);
    if (data.nombre.trim().length < 3) {
      return { success: false, error: 'Ingresa un nombre valido.' };
    }
    if (!/^09\d{7}$/.test(phone)) {
      return { success: false, error: 'Ingresa un celular uruguayo valido.' };
    }
    await enforcePublicRateLimit({
      scope: 'landing-lead',
      identity: phone,
      limit: 4,
      windowMs: 60 * 60 * 1000,
    });
    const source: CommercialSource = data.fuente === 'promo-widget'
      ? 'campaign'
      : data.fuente === 'landing-bodas'
        ? 'landing_bodas'
        : (data.fuente === 'landing-xv' || data.fuente === 'landing-quince')
          ? 'landing_xv'
          : (data.fuente === 'landing-eventos' || data.fuente === 'landing-cumpleanos')
            ? 'landing_eventos'
            : data.fuente;
    const acquisition = sanitizeCommercialAttribution({
      ...data.acquisition,
      source,
      entryPath: data.acquisition?.entryPath || '/landing',
    }, 'landing');
    await upsertPublicCommercialLead({
      name: data.nombre,
      phone,
      email: data.email,
      partyType: data.tipoEvento,
      eventDate: data.fechaEstimada,
      guestCount: data.invitados,
      notes: [
        data.mensaje ? `Mensaje: ${data.mensaje}` : '',
        `Fuente declarada: ${data.fuente}`,
      ].filter(Boolean).join('\n'),
      budgetSource: 'manual',
      acquisition,
      marketingConsent: true,
      marketingConsentSource: 'formulario-landing',
    });

    // Disparo asíncrono de evento de conversión CAPI a Meta Ads para optimizar algoritmo
    try {
      const { trackMetaConversionEvent } = await import('@/lib/marketing/meta-ads');
      void trackMetaConversionEvent({
        eventName: 'Lead',
        email: data.email,
        phone,
        source: data.fuente,
      });
    } catch {
      // Ignorar si falla el rastreo CAPI
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
