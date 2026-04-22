
'use server';

import type { CrmLead, CrmStage, NewCrmLeadData, CrmTimelineItem } from '@/types/crm';
import { readData, writeData } from '@/lib/data-service';
import { saveCustomer } from '@/app/actions/customers'; 
import { getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';
import { saveFiesta, syncFiestaFromBudget, getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { createNotification } from './notifications';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { initialFiestaActualData, defaultModulosContratados } from '@/lib/fiesta-defaults';
import * as logger from '@/lib/logger';

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

const defaultStages: CrmStage[] = [
  { id: 's1', name: 'Consultó', order: 1, headerBgColor: "bg-sky-500", headerTextColor: 'text-sky-50', bgColor: 'bg-sky-100', borderColor: 'border-sky-500', textColor: 'text-sky-700' },
  { id: 's2', name: 'Agendó entrevista', order: 2, headerBgColor: "bg-teal-500", headerTextColor: 'text-teal-50', bgColor: 'bg-teal-100', borderColor: 'border-teal-500', textColor: 'text-teal-700' },
  { id: 's3', name: 'Con presupuesto', order: 3, headerBgColor: "bg-amber-500", headerTextColor: 'text-amber-900', bgColor: 'bg-amber-100', borderColor: 'border-amber-500', textColor: 'text-amber-700' },
  { id: 's4', name: 'Firmó contrato', order: 4, headerBgColor: "bg-emerald-500", headerTextColor: 'text-emerald-50', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-500', textColor: 'text-emerald-700', isConversionStage: true },
  { id: 's5', name: 'No contrató', order: 5, headerBgColor: "bg-rose-500", headerTextColor: 'text-rose-50', bgColor: 'bg-rose-100', borderColor: 'border-rose-500', textColor: 'text-rose-700' },
];

export async function getCrmStages(): Promise<CrmStage[]> {
  return readData<CrmStage[]>(STAGES_FILE, defaultStages);
}

export async function getCrmLeads(page?: number, limit = 50): Promise<CrmLead[]> {
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

export async function addCrmLead(leadData: NewCrmLeadData): Promise<{ success: boolean; lead?: CrmLead; error?: string; duplicate?: CrmLead }> {
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
  leads.push(newLead);
  await writeData(LEADS_FILE, leads);

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
  let leads = await getCrmLeads();
  const index = leads.findIndex(l => l.id === leadId);
  if (index === -1) return { success: false, error: "No encontrado" };
  
  leads[index].currentStageId = newStageId;
  leads[index].updatedAt = new Date().toISOString();
  if (meetingDate) leads[index].followUpDate = meetingDate;

  await writeData(LEADS_FILE, leads);
  return { success: true, lead: leads[index] };
}

export async function scheduleCrmMeeting(leadId: string, date: string, title?: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    let leads = await getCrmLeads();
    const index = leads.findIndex(l => l.id === leadId);
    if (index === -1) return { success: false, error: "Prospecto no encontrado" };

    leads[index].followUpDate = date;
    leads[index].updatedAt = new Date().toISOString();
    if (title) {
        const existingNotes = leads[index].notes || '';
        leads[index].notes = `${existingNotes}\n[REUNIÓN AGENDADA: ${title} para el ${new Date(date).toLocaleString('es-ES')}]`.trim();
    }

    await writeData(LEADS_FILE, leads);
    return { success: true, lead: leads[index] };
}

export async function deleteCrmLead(leadId: string): Promise<{ success: boolean; error?: string }> {
    let leads = await getCrmLeads();
    const initialLength = leads.length;
    leads = leads.filter(l => l.id !== leadId);
    if (leads.length === initialLength) return { success: false, error: "No encontrado" };
    await writeData(LEADS_FILE, leads);
    return { success: true };
}

/**
 * Resets the CRM by deleting all leads from Firestore. Stages are preserved.
 * This is a destructive admin-only operation and requires explicit confirmation in the UI.
 */
export async function resetCrm(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
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

export async function recordWhatsAppContact(leadId: string, message: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    const leads = await getCrmLeads();
    const index = leads.findIndex(l => l.id === leadId);
    if (index === -1) return { success: false, error: "Prospecto no encontrado" };

    const now = new Date().toISOString();
    leads[index].lastContactedAt = now;
    leads[index].lastContactMethod = 'whatsapp';
    leads[index].updatedAt = now;

    const noteEntry = `[WhatsApp ${new Date(now).toLocaleString('es-ES')}]: ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`;
    const existingNotes = leads[index].notes || '';
    leads[index].notes = existingNotes ? `${existingNotes}\n${noteEntry}` : noteEntry;

    const timelineEntry: CrmTimelineItem = {
        id: `tl_${Date.now()}`,
        type: 'whatsapp_sent',
        timestamp: now,
        description: `WhatsApp enviado: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`,
    };
    leads[index].timeline = [...(leads[index].timeline || []), timelineEntry];

    await writeData(LEADS_FILE, leads);
    return { success: true, lead: leads[index] };
}

export async function updateCrmLeadField(
    leadId: string,
    fields: Partial<Pick<CrmLead, 'assignedTo' | 'notes' | 'followUpDate'>>
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    const leads = await getCrmLeads();
    const index = leads.findIndex(l => l.id === leadId);
    if (index === -1) return { success: false, error: "Prospecto no encontrado" };

    Object.assign(leads[index], fields, { updatedAt: new Date().toISOString() });
    await writeData(LEADS_FILE, leads);
    return { success: true, lead: leads[index] };
}

export async function checkDuplicatePhone(phone: string): Promise<{ duplicate: CrmLead | null }> {
    if (!phone) return { duplicate: null };
    const leads = await getCrmLeads();
    const normalized = normalizePhone(phone);
    const found = leads.find(l => l.phone && normalizePhone(l.phone) === normalized) ?? null;
    return { duplicate: found };
}

export async function confirmBookingWithContract(formData: FormData): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  try {
    const leadId = formData.get('leadId') as string;
    const presupuestoId = formData.get('presupuestoId') as string;
    const contractFile = formData.get('contract') as File | null;
    const archiveLead = formData.get('archiveLead') === 'true';
    const ci = formData.get('ci') as string || undefined;
    const address = formData.get('address') as string || undefined;

    if (!leadId || !presupuestoId) throw new Error('Datos incompletos.');

    // Validate file only if one was provided
    const hasFile = contractFile && contractFile.size > 0;
    if (hasFile && contractFile.type !== 'application/pdf') {
      throw new Error('El archivo de contrato debe ser un PDF.');
    }

    const [leads, presupuesto, stages] = await Promise.all([
      getCrmLeads(),
      getPresupuestoById(presupuestoId),
      getCrmStages()
    ]);

    const lead = leads.find(l => l.id === leadId);
    if (!lead || !presupuesto) throw new Error('Datos no encontrados');
    const conversionStage = stages.find(s => s.isConversionStage);

    let contractFileName: string | undefined;

    // 1. Save contract file if provided
    if (hasFile) {
      const { uploadToStorage } = await import('@/lib/firebase/storage');
      const sanitizedLeadName = lead.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const storageName = `contrato_${sanitizedLeadName}_${Date.now()}.pdf`;
      const storagePath = `contracts/${storageName}`;
      const arrayBuffer = await contractFile!.arrayBuffer();
      contractFileName = await uploadToStorage(Buffer.from(arrayBuffer), storagePath, 'application/pdf', false);
    }

    // 2. Create Customer with full data from lead + budget
    //    Skip automatic fiesta creation - we create the fiesta manually below with budget data
    const customerResult = await saveCustomer({
      name: lead.name,
      phone: formData.get('phone') as string || lead.phone,
      companyName: formData.get('companyName') as string || (lead as any).companyName || (presupuesto as any).clienteEmpresa || undefined,
      taxId: formData.get('taxId') as string || (lead as any).taxId || undefined,
      ci,
      address,
      estadoCliente: 'Actual',
      partyDate: presupuesto.eventoFecha,
      partyType: presupuesto.eventoTipo,
      venueName: presupuesto.salonFiestas,
      guestCount: presupuesto.invitadosCantidad,
      ...(contractFileName ? { contractFileName } : {}),
      presupuestoId: presupuesto.id,
    } as any, { skipFiestaCreation: true });

    if (!customerResult.success || !customerResult.id) throw new Error(customerResult.error);

    // 3. Create Fiesta
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      estado: 'Contratada',
      presupuestoId: presupuesto.id,
      configuracion: {
        ...initialFiestaActualData.configuracion,
        clienteId: customerResult.id,
        nombreEvento: `${presupuesto.eventoTipo} de ${lead.name}`,
        fechaEvento: presupuesto.eventoFecha,
        nombreLugar: presupuesto.salonFiestas,
        invitadosEstimados: presupuesto.invitadosCantidad,
        presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
      }
    };
    newFiesta.modulosContratados = { ...defaultModulosContratados };
    await saveFiesta(newFiesta);

    // 4. Sync from budget
    await syncFiestaFromBudget(newFiesta.id);

    // 5. Update Presupuesto
    await updatePresupuesto({ ...presupuesto, estado: 'Aceptado' });

    // 6. Update lead: optionally link contract file and move to conversion stage
    {
      const currentLeads = await getCrmLeads();
      const leadIdx = currentLeads.findIndex(l => l.id === leadId);
      if (leadIdx !== -1) {
        if (archiveLead && conversionStage) {
          currentLeads[leadIdx].currentStageId = conversionStage.id;
        }
        if (contractFileName) {
          (currentLeads[leadIdx] as any).contractFileName = contractFileName;
        }
        currentLeads[leadIdx].updatedAt = new Date().toISOString();
        await writeData(LEADS_FILE, currentLeads);
      }
    }

    await createNotification({
      mensaje: `¡Contratación Confirmada! ${lead.name} es ahora cliente. ${contractFileName ? 'Contrato vinculado.' : 'El borrador del contrato está listo para revisar.'}`,
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
    const [leads, presupuesto, stages] = await Promise.all([
      getCrmLeads(),
      getPresupuestoById(presupuestoId),
      getCrmStages()
    ]);

    const lead = leads.find(l => l.id === leadId);
    if (!lead || !presupuesto) throw new Error("Datos no encontrados");

    const conversionStage = stages.find(s => s.isConversionStage);

    // 1. Crear Cliente con datos completos del presupuesto y lead
    //    Skip automatic fiesta creation - we create the fiesta manually below with budget data
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

    // 2. Crear Fiesta
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      estado: 'Contratada',
      presupuestoId: presupuesto.id,
      configuracion: {
        ...initialFiestaActualData.configuracion,
        clienteId: customerResult.id,
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

export async function findLeadByBudgetOrCreate(presupuesto: any) {
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
        // Actualizar datos del lead existente (Sincronización Inteligente)
        const lead = leads[leadIndex];
        lead.presupuestoId = presupuesto.id;
        lead.presupuestoEstado = presupuesto.estado;
        if (presupuesto.invoiceId) lead.invoiceId = presupuesto.invoiceId;
        
        // Sincronizar campos siempre con la información más reciente del presupuesto
        if (presupuesto.clienteContacto) lead.phone = presupuesto.clienteContacto;
        if (presupuesto.eventoTipo) lead.partyType = presupuesto.eventoTipo;
        if (presupuesto.salonFiestas) lead.venueName = presupuesto.salonFiestas;
        if (presupuesto.invitadosCantidad) lead.guestCount = presupuesto.invitadosCantidad;
        lead.budgetSource = budgetSource;
        lead.lastBudgetAt = budgetTimestamp;
        lead.timeline = [
          ...(lead.timeline || []),
          {
            id: `tl_${Date.now()}`,
            type: 'presupuesto_created',
            timestamp: budgetTimestamp,
            description: `Presupuesto ${presupuesto.numero ? `#${presupuesto.numero}` : ''} registrado desde ${getBudgetSourceLabel(budgetSource)}`.trim(),
            meta: { source: budgetSource },
          },
        ];
        
        // Progresión automática de etapas
        if ((presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado')) {
            const conversionStage = stages.find(s => s.isConversionStage);
            if (conversionStage) lead.currentStageId = conversionStage.id;
        } else if (presupuesto.estado === 'Enviado' && (lead.currentStageId === stages[0].id || lead.currentStageId === 's1')) {
            const budgetStage = stages.find(s => s.name.toLowerCase().includes('presupuesto'));
            if (budgetStage) lead.currentStageId = budgetStage.id;
        }

        lead.updatedAt = new Date().toISOString();
        await writeData(LEADS_FILE, leads);
        return { lead, isNew: false };
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
  fuente: 'landing-bodas' | 'landing-xv' | 'landing-eventos' | 'promo-widget' | 'landing';
}

export async function saveLead(data: LandingLeadData): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await addCrmLead({
      name: data.nombre,
      phone: data.telefono,
      email: data.email,
      partyType: data.tipoEvento,
      followUpDate: data.fechaEstimada,
      guestCount: data.invitados,
      notes: [
        data.mensaje ? `Mensaje: ${data.mensaje}` : '',
        `Fuente: ${data.fuente}`,
      ].filter(Boolean).join('\n'),
      budgetSource: 'manual',
    });
    return { success: res.success, error: res.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
