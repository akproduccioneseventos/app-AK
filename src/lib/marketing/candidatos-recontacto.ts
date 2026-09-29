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

export interface PasoRecontactoConfig {
  dias: number;
  plantilla?: string;
}

export const PASOS_RECONTACTO_DEFAULT: PasoRecontactoConfig[] = [
  {
    dias: 2,
    plantilla: 'Hola {{NOMBRE}}, ¿pudiste ver la propuesta que te armamos para {{EVENTO}}? Contanos cualquier duda.',
  },
  {
    dias: 7,
    plantilla: 'Hola {{NOMBRE}}, ¿cómo estás? Te consultamos si querés que te guardemos la fecha de tu evento para que no se reserve con otro cliente.',
  },
  {
    dias: 15,
    plantilla: 'Hola {{NOMBRE}}, queríamos saber si seguís con la idea de festejar tu evento con nosotros o si preferís que liberemos la fecha. ¡A las órdenes!',
  },
];

function evaluarPasoParaLead(
  lead: CrmLead,
  etapasTerminadas: Set<string>,
  ahoraMs: number,
  pasos: PasoRecontactoConfig[],
): { paso?: number; plantilla?: string; motivo?: string } {
  if (!lead.phone?.trim()) return { motivo: 'sin telefono' };
  if (lead.marketingConsent !== true) return { motivo: 'no dio permiso de marketing' };
  if (lead.presupuestoEstado && YA_ES_CLIENTE.has(lead.presupuestoEstado)) return { motivo: 'ya contrato' };
  if (lead.invoiceId) return { motivo: 'ya contrato' };
  if (lead.currentStageId && etapasTerminadas.has(lead.currentStageId)) {
    return { motivo: 'esta en una etapa terminada del embudo' };
  }

  const creado = new Date(lead.createdAt).getTime();
  if (!Number.isFinite(creado)) return { motivo: 'sin fecha de alta valida' };

  // Si contestó en el medio, la secuencia se corta inmediatamente
  if (lead.lastInboundAt) {
    const respondio = new Date(lead.lastInboundAt).getTime();
    if (Number.isFinite(respondio) && respondio >= creado) {
      return { motivo: 'el prospecto ya respondio' };
    }
  }

  const diasTranscurridos = (ahoraMs - creado) / (24 * 60 * 60 * 1000);

  // Registro de qué pasos ya se enviaron
  const pasosEnviados = new Set<number>();
  if (lead.recontactoAutomaticoAt) {
    pasosEnviados.add(1);
  }
  if (lead.recontactosEnviados && Array.isArray(lead.recontactosEnviados)) {
    for (const r of lead.recontactosEnviados) {
      pasosEnviados.add(r.paso);
    }
  }

  // Ordenamos los pasos por días ascendentes
  const pasosOrdenados = [...pasos].sort((a, b) => a.dias - b.dias);

  // Primer paso mínimo requerido
  const primerPaso = pasosOrdenados[0];
  if (primerPaso && diasTranscurridos < primerPaso.dias) {
    return { motivo: primerPaso.dias === 2 ? 'todavia no pasaron las 48 horas' : `todavia no pasaron los ${primerPaso.dias} dias` };
  }

  // Encontrar el paso más avanzado que ya corresponde por días
  let pasoCandidato: { numero: number; config: PasoRecontactoConfig } | null = null;
  for (let i = 0; i < pasosOrdenados.length; i++) {
    const p = pasosOrdenados[i];
    const numeroPaso = i + 1;
    if (diasTranscurridos >= p.dias) {
      if (!pasosEnviados.has(numeroPaso)) {
        pasoCandidato = { numero: numeroPaso, config: p };
        break; // Toca este paso
      }
    }
  }

  if (!pasoCandidato) {
    if (pasosEnviados.size > 0) {
      return { motivo: 'ya se le escribio antes' };
    }
    return { motivo: 'no cumple criterio de pasos' };
  }

  return {
    paso: pasoCandidato.numero,
    plantilla: pasoCandidato.config.plantilla,
  };
}

export function elegirCandidatosDeRecontacto(
  leads: CrmLead[],
  stages: CrmStage[],
  ahora: Date = new Date(),
  esperaMs: number = ESPERA_RECONTACTO_MS,
  pasosConfigurados?: PasoRecontactoConfig[],
): SeleccionDeRecontacto {
  const etapasTerminadas = idsDeEtapasTerminadas(stages);
  const ahoraMs = ahora.getTime();
  const pasos = pasosConfigurados && pasosConfigurados.length > 0 ? pasosConfigurados : PASOS_RECONTACTO_DEFAULT;

  const candidatos: UnbookedLeadRemarketingCandidate[] = [];
  const descartados: MotivoDescartado[] = [];

  for (const lead of leads ?? []) {
    const evaluacion = evaluarPasoParaLead(lead, etapasTerminadas, ahoraMs, pasos);
    if (evaluacion.motivo) {
      descartados.push({ leadId: lead.id, motivo: evaluacion.motivo });
      continue;
    }

    candidatos.push({
      id: lead.id,
      name: lead.name,
      phone: lead.phone!.trim(),
      eventType: lead.partyType,
      createdAt: lead.createdAt,
      paso: evaluacion.paso,
      plantilla: evaluacion.plantilla,
    });
  }

  return { candidatos, descartados };
}
