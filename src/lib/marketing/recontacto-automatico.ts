import 'server-only';

import { mutateDataItem, readData, writeData } from '@/lib/data-service';
import { esLecturaFallida } from '@/lib/marca-de-lectura';
import { DEFAULT_CRM_STAGES } from '@/lib/crm/default-stages';
import {
  elegirCandidatosDeRecontacto,
  type PasoRecontactoConfig,
} from '@/lib/marketing/candidatos-recontacto';
import { processUnbookedLeadsRemarketing } from '@/lib/marketing/whatsapp-remarketing';
import type { CrmLead, CrmStage } from '@/types/crm';

export type { PasoRecontactoConfig };

const LEADS_FILE = 'crm-leads.json';
const CRM_LEADS_COLLECTION = 'prospectos';
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

function aplicarMarcaDeRecontacto(
  actual: CrmLead,
  pasoEnviado: number,
  marcaDeTiempo: string,
): CrmLead {
  const recontactosEnviados = [...(actual.recontactosEnviados || [])];
  if (actual.recontactoAutomaticoAt && !recontactosEnviados.some((r) => r.paso === 1)) {
    recontactosEnviados.push({ paso: 1, at: actual.recontactoAutomaticoAt });
  }
  recontactosEnviados.push({ paso: pasoEnviado, at: marcaDeTiempo });

  return {
    ...actual,
    recontactosEnviados,
    recontactoAutomaticoAt:
      pasoEnviado === 1 ? marcaDeTiempo : (actual.recontactoAutomaticoAt ?? marcaDeTiempo),
    lastContactedAt: marcaDeTiempo,
    lastContactMethod: 'whatsapp' as const,
    updatedAt: marcaDeTiempo,
  };
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
  if (esLecturaFallida(leads)) {
    return { ...vacio, corrio: false, motivo: 'no se pudieron leer los prospectos desde la base de datos' };
  }
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
    const candidatosPorId = new Map(candidatos.map((c) => [c.id, c]));

    if (typeof mutateDataItem === 'function') {
      // Guardar de a un prospecto sobre su registro fresco en base para nunca pisar
      // lastInboundAt ni prospectos creados en el medio.
      for (const leadId of enviadosOk) {
        const cand = candidatosPorId.get(leadId);
        const pasoEnviado = cand?.paso ?? 1;
        await mutateDataItem<CrmLead>(
          LEADS_FILE,
          CRM_LEADS_COLLECTION,
          leadId,
          (actual) => aplicarMarcaDeRecontacto(actual, pasoEnviado, marcaDeTiempo),
        );
      }
    } else {
      // Compatibilidad únicamente con mocks unitarios sin mutateDataItem
      const actualizados = leads.map((lead) => {
        if (!enviadosOk.has(lead.id)) return lead;
        const cand = candidatosPorId.get(lead.id);
        return aplicarMarcaDeRecontacto(lead, cand?.paso ?? 1, marcaDeTiempo);
      });
      await writeData(LEADS_FILE, actualizados);
    }
  }

  if (resultado.sentCount === 0) {
    const primerError = resultado.details.find((d) => d.error)?.error;
    const motivo = primerError
      ? `No se pudo enviar ningún recontacto (${primerError})`
      : 'Había prospectos elegibles para recontactar, pero no se pudo enviar ningún mensaje';

    try {
      const { createNotification } = await import('@/lib/notifications/create-notification');
      await createNotification({
        titulo: 'Recontacto automático sin envíos',
        mensaje: `Había ${candidatos.length} ${candidatos.length === 1 ? 'prospecto elegible' : 'prospectos elegibles'} para recontactar por WhatsApp, pero no se pudo enviar ninguno. Motivo: ${primerError || 'credenciales faltantes/vencidas o error de envío'}.`,
        tipo: 'alerta',
        rolDestino: 'admin',
        href: '/settings/whatsapp',
        icono: 'AlertTriangle',
      }).catch(() => null);
    } catch {
      // Aviso secundario al dueño: nunca impide devolver corrio: false con el motivo
    }

    return {
      corrio: false,
      motivo,
      elegidos: candidatos.length,
      enviados: resultado.sentCount,
      fallados: resultado.failedCount,
      descartados: descartados.length,
    };
  }

  return {
    corrio: true,
    elegidos: candidatos.length,
    enviados: resultado.sentCount,
    fallados: resultado.failedCount,
    descartados: descartados.length,
  };
}
