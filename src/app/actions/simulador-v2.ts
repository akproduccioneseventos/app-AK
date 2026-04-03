'use server';

import { readData } from '@/lib/data-service';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { generateBudgetAndLeadFromSimulator } from '@/app/actions/armado-rapido';
import type { SimV2DuplicateCheck, SimV2DateCheck, SimV2State } from '@/types/simulador-v2';
import type { Presupuesto } from '@/types/presupuesto';
import type { CrmLead } from '@/types/crm';
import {
  SIM_V2_BASE_RATES,
  SIM_V2_PACKAGE_MULTIPLIERS,
  SIM_V2_DISCOUNT_PERCENTAGE,
} from '@/lib/simulador-v2-constants';

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
  try {
    const fullName = normalizeName(`${nombre} ${apellido}`);
    const normalizedPhone = normalizePhone(telefono);

    // Check CRM leads
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

    // Check presupuestos
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

    // Find 3 nearest available Fri/Sat/Sun after the requested date
    const suggestions: string[] = [];
    const candidate = new Date(requestedDate);
    candidate.setDate(candidate.getDate() + 1);

    while (suggestions.length < 3) {
      const day = candidate.getDay(); // 0=Sun, 5=Fri, 6=Sat
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
  try {
    const tipoEvento = state.tipoEvento || 'Cumpleaños';
    const paquete = state.paquete || 'Intermedio';
    const totalGuests = (state.adultos || 0) + (state.adolescentes || 0);
    const rates = SIM_V2_BASE_RATES[tipoEvento] || SIM_V2_BASE_RATES['Cumpleaños'];
    const multiplier = SIM_V2_PACKAGE_MULTIPLIERS[paquete] || 1.0;
    // subtotal = pre-discount "list price"; costoEstimado = after-discount final price
    const subtotal = (rates.perPerson * totalGuests + rates.base) * multiplier;
    const costoEstimado = subtotal * (1 - SIM_V2_DISCOUNT_PERCENTAGE / 100);

    const serviciosActivados = state.serviciosActivados || [];

    const items: Omit<import('@/types/presupuesto').ItemPresupuestado, 'costoTotalItem'>[] = [
      {
        idServicioCatalogo: `sim_v2_paquete_${paquete.toLowerCase()}`,
        nombreServicio: `Paquete ${paquete} — ${tipoEvento}`,
        calculationMethod: 'fijo' as const,
        cantidad: 1,
        precioUnitario: costoEstimado,
        precioUnitarioPresupuesto: costoEstimado,
        esRegalo: false,
        descripcionServicio: `Paquete ${paquete} para ${tipoEvento}. ${totalGuests} invitados.`,
      },
      ...serviciosActivados.map(sId => ({
        idServicioCatalogo: sId,
        nombreServicio: sId,
        calculationMethod: 'fijo' as const,
        cantidad: 1,
        precioUnitario: 0,
        precioUnitarioPresupuesto: 0,
        esRegalo: false,
      })),
    ];

    const salonInfo = state.tieneSalon
      ? state.salonNombre || 'Salón propio'
      : state.incluirClubUruguay
        ? 'Club Uruguay'
        : 'A definir';

    const duracionLabel = state.duracion === 'mas4' ? 'Más de 4 horas' : 'Hasta 4 horas';

    const result = await generateBudgetAndLeadFromSimulator({
      clienteNombre: `${state.nombre} ${state.apellido}`.trim(),
      clienteContacto: state.telefono,
      eventoFecha: state.fechaEvento,
      adultos: state.adultos || 0,
      ninos: state.adolescentes || 0,
      subtotal,
      costoEstimado,
      descuentoGeneral: SIM_V2_DISCOUNT_PERCENTAGE,
      serviciosIncluidos: serviciosActivados,
      paqueteNombre: `${paquete} — ${tipoEvento} — ${salonInfo} — ${duracionLabel}`,
      items,
    });

    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: msg };
  }
}
