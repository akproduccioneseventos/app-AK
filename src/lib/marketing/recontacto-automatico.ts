import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import { DEFAULT_CRM_STAGES } from '@/lib/crm/default-stages';
import {
  elegirCandidatosDeRecontacto,
  type PasoRecontactoConfig,
} from '@/lib/marketing/candidatos-recontacto';
import { processUnbookedLeadsRemarketing } from '@/lib/marketing/whatsapp-remarketing';
import type { CrmLead, CrmStage } from '@/types/crm';

export type { PasoRecontactoConfig };

const LEADS_FILE = 'crm-leads.json';
const STAGES_FILE = 'crm-stages.json';
const AJUSTES_FILE = 'marketing-recontacto.json';

export interface AjustesDeRecontacto {
  /** Apagado de fábrica. Sólo lo prende el dueño desde Ajustes. */
  activo: boolean;
  pasos?: PasoRecontactoConfig[];
  actualizadoAt?: string;
}

const AJUSTES_POR_DEFECTO: AjustesDeRecontacto = { activo: false };

export async function getAjustesDeRecontacto(): Promise<AjustesDeRecontacto> {
  const guardados = await readData<AjustesDeRecontacto>(AJUSTES_FILE, AJUSTES_POR_DEFECTO);
  // `activo` sólo es verdadero si está guardado explícitamente como verdadero: un
  // archivo a medio escribir no puede terminar mandando mensajes.
  return { ...guardados, activo: guardados?.activo === true };
}

export async function setAjustesDeRecontacto(
  activo: boolean,
  pasos?: PasoRecontactoConfig[],
): Promise<AjustesDeRecontacto> {
  const ajustes: AjustesDeRecontacto = {
    activo,
    ...(pasos ? { pasos } : {}),
    actualizadoAt: new Date().toISOString(),
  };
  await writeData(AJUSTES_FILE, ajustes);
  return ajustes;
}

export interface ResultadoDeRecontacto {
  corrio: boolean;
  motivo?: string;
  elegidos: number;
  enviados: number;
  fallados: number;
  descartados: number;
}

export async function correrRecontactoAutomatico(
  ahora: Date = new Date(),
): Promise<ResultadoDeRecontacto> {
  const vacio: ResultadoDeRecontacto = {
    corrio: false,
    elegidos: 0,
    enviados: 0,
    fallados: 0,
    descartados: 0,
  };

  const ajustes = await getAjustesDeRecontacto();
  if (!ajustes.activo) {
    return { ...vacio, motivo: 'el recontacto automatico esta apagado' };
  }

  const [leads, stagesGuardadas] = await Promise.all([
    readData<CrmLead[]>(LEADS_FILE, []),
    readData<CrmStage[]>(STAGES_FILE, DEFAULT_CRM_STAGES),
  ]);
  const stages = stagesGuardadas.length > 0 ? stagesGuardadas : DEFAULT_CRM_STAGES;

  const { candidatos, descartados } = elegirCandidatosDeRecontacto(
    leads,
    stages,
    ahora,
    undefined,
    ajustes.pasos,
  );
  if (candidatos.length === 0) {
    return { ...vacio, corrio: true, descartados: descartados.length, motivo: 'no hay a quien escribirle' };
  }

  const resultado = await processUnbookedLeadsRemarketing(candidatos);

  // Se anota SOLO a los que recibieron el mensaje de verdad. Si el envío falló, el
  // prospecto queda disponible para el próximo intento en vez de perderse.
  const enviadosOk = new Set(
    resultado.details.filter((detalle) => detalle.success).map((detalle) => detalle.leadId),
  );

  if (enviadosOk.size > 0) {
    const marcaDeTiempo = ahora.toISOString();
    const candidatosPorId = new Map(candidatos.map((c: any) => [c.id, c]));
    const actualizados = leads.map((lead) => {
      if (!enviadosOk.has(lead.id)) return lead;

      const cand = candidatosPorId.get(lead.id);
      const pasoEnviado = cand?.paso ?? 1;
      const recontactosEnviados = [...(lead.recontactosEnviados || [])];
      if (lead.recontactoAutomaticoAt && !recontactosEnviados.some((r) => r.paso === 1)) {
        recontactosEnviados.push({ paso: 1, at: lead.recontactoAutomaticoAt });
      }
      recontactosEnviados.push({ paso: pasoEnviado, at: marcaDeTiempo });

      return {
        ...lead,
        recontactosEnviados,
        recontactoAutomaticoAt:
          pasoEnviado === 1 ? marcaDeTiempo : (lead.recontactoAutomaticoAt ?? marcaDeTiempo),
        lastContactedAt: marcaDeTiempo,
        lastContactMethod: 'whatsapp' as const,
        updatedAt: marcaDeTiempo,
      };
    });
    await writeData(LEADS_FILE, actualizados);
  }

  return {
    corrio: true,
    elegidos: candidatos.length,
    enviados: resultado.sentCount,
    fallados: resultado.failedCount,
    descartados: descartados.length,
  };
}
