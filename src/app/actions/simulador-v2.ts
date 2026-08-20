'use server';

import { readData } from '@/lib/data-service';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { generateBudgetAndLeadFromSimulator, getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import type { SimV2DuplicateCheck, SimV2DateCheck, SimV2State } from '@/types/simulador-v2';
import type { Presupuesto } from '@/types/presupuesto';
import type { CrmLead } from '@/types/crm';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

import { requireAppSession } from '@/lib/auth/require-session';
const PRESUPUESTOS_FILE = 'presupuestos.json';
const CRM_LEADS_FILE = 'crm-leads.json';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-9);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function checkDuplicateClient(
  nombre: string,
  apellido: string,
  telefono: string
): Promise<SimV2DuplicateCheck> {
  await requireAppSession();
  try {
    const fullName = normalizeName(`${nombre} ${apellido}`);
    const normalizedPhone = normalizePhone(telefono);

    const leads = await readData<CrmLead[]>(CRM_LEADS_FILE, []);
    const matchingLead = leads.find(lead => {
      const leadPhone = lead.phone ? normalizePhone(lead.phone) : '';
      const leadName = normalizeName(lead.name || '');
      return (
        (normalizedPhone && leadPhone === normalizedPhone) ||
        (fullName.length > 3 && leadName === fullName)
      );
    });

    if (matchingLead) {
      return {
        isDuplicate: true,
        existingLeadId: matchingLead.id,
        existingPresupuestoId: matchingLead.presupuestoId,
        existingClientName: matchingLead.name,
      };
    }

    const presupuestos = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
    const matchingPresupuesto = presupuestos.find(p => {
      const pPhone = p.clienteContacto ? normalizePhone(p.clienteContacto) : '';
      const pName = normalizeName(p.clienteNombre || '');
      return (
        (normalizedPhone && pPhone === normalizedPhone) ||
        (fullName.length > 3 && pName === fullName)
      );
    });

    if (matchingPresupuesto) {
      return {
        isDuplicate: true,
        existingPresupuestoId: matchingPresupuesto.id,
        existingClientName: matchingPresupuesto.clienteNombre,
      };
    }

    return { isDuplicate: false };
  } catch {
    return { isDuplicate: false };
  }
}

export async function checkDateAvailability(fechaISO: string): Promise<SimV2DateCheck> {
  try {
    const requestedDate = new Date(fechaISO);
    const requestedDateStr = requestedDate.toISOString().split('T')[0];

    const fiestas = await getFiestas(false);
    const occupiedDates = new Set(
      fiestas
        .map(f => f.configuracion?.fechaEvento)
        .filter(Boolean)
        .map(d => new Date(d!).toISOString().split('T')[0])
    );

    const isOccupied = occupiedDates.has(requestedDateStr);

    if (!isOccupied) {
      return { isOccupied: false };
    }

    const suggestions: string[] = [];
    const candidate = new Date(requestedDate);
    candidate.setDate(candidate.getDate() + 1);

    while (suggestions.length < 3) {
      const day = candidate.getDay();
      if (day === 0 || day === 5 || day === 6) {
        const candidateStr = candidate.toISOString().split('T')[0];
        if (!occupiedDates.has(candidateStr)) {
          suggestions.push(candidateStr);
        }
      }
      candidate.setDate(candidate.getDate() + 1);
    }

    return { isOccupied: true, suggestions };
  } catch {
    return { isOccupied: false };
  }
}

export async function saveSimuladorV2Lead(state: SimV2State): Promise<{
  success: boolean;
  leadId?: string;
  presupuestoId?: string;
  error?: string;
}> {
  // Es publica a proposito: la usa el simulador que contesta un desconocido desde
  // la web, sin cuenta. Pero guarda un prospecto Y un presupuesto, y no tenia
  // freno: un robot podia llenar el CRM de presupuestos falsos hasta volverlo
  // inservible. El formulario de la portada si tenia freno; este no.
  //
  // Cuatro por hora y por telefono, igual que el otro.
  const telefonoDelFreno = String((state as { telefono?: string })?.telefono || '').trim();
  if (telefonoDelFreno) {
    try {
      await enforcePublicRateLimit({
        scope: 'simulador-v2-lead',
        identity: telefonoDelFreno,
        limit: 4,
        windowMs: 60 * 60 * 1000,
      });
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Espera un momento antes de volver a enviar.',
      };
    }
  }

  try {
    const tipoEvento = state.tipoEvento || 'Cumpleaños';
    const paquete = state.paquete || 'Intermedio';
    const config = await getArmadoRapidoConfig();
    const normalizedPackageName = paquete.trim().toLowerCase();
    const selectedPackage = config.paquetes.find((item) =>
      item.id === paquete || item.nombre.trim().toLowerCase().includes(normalizedPackageName)
    );
    if (!selectedPackage) {
      return { success: false, error: 'El paquete elegido no existe en la configuracion actual.' };
    }
    const serviciosActivados = state.serviciosActivados || [];

    const salonInfo = state.tieneSalon
      ? state.salonNombre || 'Salón propio'
      : state.incluirClubUruguay
        ? 'Club Uruguay'
        : 'A definir';

    const duracionLabel = state.duracion === 'mas4' ? 'Más de 4 horas' : 'Hasta 4 horas';

    const result = await generateBudgetAndLeadFromSimulator({
      submissionId: `simv2_${normalizePhone(state.telefono)}_${state.fechaEvento || tipoEvento}`,
      clienteNombre: `${state.nombre} ${state.apellido}`.trim(),
      clienteContacto: state.telefono,
      eventoFecha: state.fechaEvento,
      adultos: state.adultos || 0,
      adolescentes: state.adolescentes || 0,
      ninos: 0,
      subtotal: 0,
      costoEstimado: 0,
      serviciosIncluidos: serviciosActivados,
      selectedServiceIds: serviciosActivados,
      paqueteId: selectedPackage.id,
      paqueteNombre: `${selectedPackage.nombre} — ${tipoEvento} — ${salonInfo} — ${duracionLabel}`,
      includeClubUruguay: Boolean(state.incluirClubUruguay),
    }, {
      source: 'simulator_common',
      eventoTipo: tipoEvento,
      salonFiestas: salonInfo,
    });

    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: msg };
  }
}
