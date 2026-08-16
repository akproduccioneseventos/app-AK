import { idsDeEtapasTerminadas } from '@/lib/crm/etapas-finales';
import type { CrmLead, CrmStage } from '@/types/crm';
import type { UnbookedLeadRemarketingCandidate } from '@/lib/marketing/whatsapp-remarketing';

/**
 * A quién se le escribe el mensaje automático de recontacto, y a quién no.
 *
 * El caso: alguien pide un presupuesto, no seña, y nadie lo vuelve a llamar. Ese
 * es el agujero por donde se va la plata. El mensaje automático a las 48 horas ya
 * estaba escrito en el proyecto pero nunca se llamaba desde ningún lado.
 *
 * Escribirle a un cliente por WhatsApp sin que lo pida es lo más fácil de hacer
 * mal, y un error acá no se puede deshacer: el mensaje ya salió. Por eso la
 * selección vive acá, separada del envío, y está probada aparte. Las reglas:
 *
 * 1. **Tiene que haber pasado el tiempo de espera** (48 horas por defecto).
 *    Escribirle a los diez minutos de que pidió el presupuesto es acoso.
 * 2. **Tiene que haber dado permiso de marketing.** Sin permiso, no se le escribe.
 * 3. **Una sola vez en la vida.** Si ya se le mandó, no se le manda más.
 * 4. **Nunca a quien ya contrató**, ni a quien está en una etapa terminada del
 *    embudo (firmó, o no contrató). Escribirle "¿te quedó alguna duda?" a alguien
 *    que ya firmó queda pésimo.
 * 5. **Tiene que tener teléfono**, obvio.
 */

/** Cuánto se espera desde que el prospecto entró, antes de escribirle. */
export const ESPERA_RECONTACTO_MS = 48 * 60 * 60 * 1000;

/** Presupuestos que significan que la persona ya es cliente: no se la molesta. */
const YA_ES_CLIENTE = new Set(['Aceptado', 'Facturado']);

export interface MotivoDescartado {
  leadId: string;
  motivo: string;
}

export interface SeleccionDeRecontacto {
  candidatos: UnbookedLeadRemarketingCandidate[];
  descartados: MotivoDescartado[];
}

function motivoParaDescartar(
  lead: CrmLead,
  etapasTerminadas: Set<string>,
  ahoraMs: number,
  esperaMs: number,
): string | null {
  if (!lead.phone?.trim()) return 'sin telefono';
  if (lead.marketingConsent !== true) return 'no dio permiso de marketing';
  if (lead.recontactoAutomaticoAt) return 'ya se le escribio antes';
  if (lead.presupuestoEstado && YA_ES_CLIENTE.has(lead.presupuestoEstado)) return 'ya contrato';
  if (lead.invoiceId) return 'ya contrato';
  if (lead.currentStageId && etapasTerminadas.has(lead.currentStageId)) {
    return 'esta en una etapa terminada del embudo';
  }

  const creado = new Date(lead.createdAt).getTime();
  if (!Number.isFinite(creado)) return 'sin fecha de alta valida';
  if (ahoraMs - creado < esperaMs) return 'todavia no pasaron las 48 horas';

  return null;
}

export function elegirCandidatosDeRecontacto(
  leads: CrmLead[],
  stages: CrmStage[],
  ahora: Date = new Date(),
  esperaMs: number = ESPERA_RECONTACTO_MS,
): SeleccionDeRecontacto {
  const etapasTerminadas = idsDeEtapasTerminadas(stages);
  const ahoraMs = ahora.getTime();

  const candidatos: UnbookedLeadRemarketingCandidate[] = [];
  const descartados: MotivoDescartado[] = [];

  for (const lead of leads ?? []) {
    const motivo = motivoParaDescartar(lead, etapasTerminadas, ahoraMs, esperaMs);
    if (motivo) {
      descartados.push({ leadId: lead.id, motivo });
      continue;
    }

    candidatos.push({
      id: lead.id,
      name: lead.name,
      phone: lead.phone!.trim(),
      eventType: lead.partyType,
      createdAt: lead.createdAt,
    });
  }

  return { candidatos, descartados };
}
