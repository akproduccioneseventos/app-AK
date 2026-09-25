import type { CrmLead } from '@/types/crm';
import { readData, writeData, mutateDataItem } from '@/lib/data-service';
import { AsyncMutex } from '@/lib/mutex';

const crmMutex = new AsyncMutex();
const LEADS_FILE = 'crm-leads.json';
const CRM_LEADS_COLLECTION = 'prospectos';

const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

function cleanCrmLeadForFirestore(lead: CrmLead): CrmLead {
  return JSON.parse(JSON.stringify(lead)) as CrmLead;
}

export async function mutateCrmLeadDocument(
  leadId: string,
  mutate: (lead: CrmLead) => CrmLead,
): Promise<CrmLead | null> {
  if (!SIN_BASE()) {
    return mutateDataItem<CrmLead>(LEADS_FILE, CRM_LEADS_COLLECTION, leadId, (actual) => {
      return cleanCrmLeadForFirestore(mutate(actual));
    });
  }

  return crmMutex.runExclusive(async () => {
    const leads = await readData<CrmLead[]>(LEADS_FILE, []);
    const index = leads.findIndex((lead) => lead.id === leadId);
    if (index === -1) return null;
    leads[index] = mutate(leads[index]);
    await writeData(LEADS_FILE, leads);
    return leads[index];
  });
}

/**
 * Registra una reunión agendada en la ficha del prospecto.
 * Función pura en `src/lib/` sin guardia de sesión para que tanto las pantallas
 * públicas del simulador como las acciones privadas del equipo puedan persistir
 * la cita sin bloqueos ni fallos silenciosos.
 */
export async function scheduleCrmMeetingInternal(
  leadId: string,
  date: string,
  title?: string,
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
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
      ...(title ? { notes: `${existingNotes}\n[REUNIÓN AGENDADA: ${meetingTitle} para el ${parsedDate.toLocaleString('es-ES', { timeZone: 'America/Montevideo' })}]`.trim() } : {}),
      timeline: [
        ...(current.timeline || []),
        {
          id: `tl_meeting_${Date.now()}`,
          type: 'meeting_scheduled',
          timestamp: now,
          description: `${meetingTitle}: ${parsedDate.toLocaleString('es-ES', { timeZone: 'America/Montevideo' })}`,
        },
      ],
    };
  });
  return lead ? { success: true, lead } : { success: false, error: 'Prospecto no encontrado' };
}
