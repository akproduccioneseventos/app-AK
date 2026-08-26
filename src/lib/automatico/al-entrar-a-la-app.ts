import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import {
  intentarAdquirirLock,
  liberarLock,
  type OrigenDisparo,
} from '@/lib/automatico/control-concurrencia';

/**
 * Las tareas que se ponen al dia desatendidas (despertador, visitas publicas o ingreso a la app).
 *
 * **Por que existe.** Las tareas automaticas necesitan que algo de afuera las
 * llame a cierta hora. Con el despertador en Google Cloud Functions y la red de seguridad
 * en las visitas de la web publica, la app corre sola sin depender de que nadie entre.
 *
 * ## Lo que NO entra aca, y es a proposito
 *
 * **Nada de esto le manda un mensaje a nadie.** Los recordatorios de cuota
 * **preparan** la lista de a quien reclamarle y la dejan en la bandeja de salida;
 * el mensaje sale cuando una persona lo toca, desde su propio WhatsApp. El dueno
 * usa su WhatsApp personal: **ningun bot contesta ni escribe solo**, y eso no
 * cambia.
 *
 * ## Por que es seguro repetirlas
 *
 * - El guardado de metricas **no guarda dos veces el mismo dia**.
 * - Los posteos programados sacan **solo los que ya vencieron**, con tope de tres
 *   por corrida.
 * - Las notas del blog respetan el intervalo de cadencia (1 nota cada 2 dias).
 * - **El candado de concurrencia se toma ANTES de trabajar**: si dos llamadas llegan
 *   a la vez, la segunda se retira inmediatamente sin duplicar trabajo ni gasto.
 */

const ESTADO_FILE = 'tareas-al-entrar-estado.json';

/** Cada cuanto se vuelve a intentar cada tarea, en milisegundos. */
const CADA_CUANTO = {
  metricas: 24 * 60 * 60 * 1000,
  posteos: 15 * 60 * 1000,
  blog: 48 * 60 * 60 * 1000,
  recordatorios: 24 * 60 * 60 * 1000,
  posicionamiento: 24 * 60 * 60 * 1000,
} as const;

export type NombreDeTarea = keyof typeof CADA_CUANTO;

const MAPA_CRON_IDS: Record<NombreDeTarea, string> = {
  metricas: 'metricas-de-redes',
  posteos: 'publicar-programados',
  blog: 'generate-blog-post',
  recordatorios: 'recordatorios-de-pago',
  posicionamiento: 'posicionamiento-diario',
};

interface EstadoDeTareas {
  ultimaCorrida?: Partial<Record<NombreDeTarea, string>>;
}

export interface ResultadoAlEntrar {
  corrio: NombreDeTarea[];
  omitidas: NombreDeTarea[];
  fallaron: Array<{ tarea: NombreDeTarea; error: string }>;
  omitidoPorConcurrencia?: boolean;
}

function leTocaCorrer(ultima: string | undefined, cadaCuantoMs: number, ahoraMs: number): boolean {
  if (!ultima) return true;
  const anterior = new Date(ultima).getTime();
  if (!Number.isFinite(anterior)) return true;
  return ahoraMs - anterior >= cadaCuantoMs;
}

/**
 * Pone al dia lo que este vencido.
 * Protegido con candado atómico para que múltiples visitas o llamadas concurrentes
 * ejecuten una sola vez.
 *
 * **Nunca tira un error hacia afuera**: si una tarea falla, se anota y se sigue
 * con la otra. Que falle poner al dia una metrica no puede romperle la pantalla a
 * nadie.
 */
export async function ponerAlDiaAlEntrar(
  ahora: Date = new Date(),
  origen: OrigenDisparo = 'app',
): Promise<ResultadoAlEntrar> {
  const lockAdquirido = await intentarAdquirirLock(origen);
  if (!lockAdquirido) {
    return {
      corrio: [],
      omitidas: [],
      fallaron: [],
      omitidoPorConcurrencia: true,
    };
  }

  try {
    const ahoraMs = ahora.getTime();
    const estado = await readData<EstadoDeTareas>(ESTADO_FILE, {});
    const ultimaCorrida = { ...(estado.ultimaCorrida || {}) };

    const resultado: ResultadoAlEntrar = { corrio: [], omitidas: [], fallaron: [] };

    const tareas: Array<{
      nombre: NombreDeTarea;
      correr: () => Promise<unknown>;
    }> = [
      {
        nombre: 'metricas',
        correr: async () => {
          const { guardarMetricasDelDia } = await import('@/lib/presencia-digital/guardado-diario');
          const { syncCommentsFromNetworks } = await import('@/lib/social-media/comments-backfill');
          return Promise.all([
            guardarMetricasDelDia().catch(() => null),
            syncCommentsFromNetworks().catch(() => null),
          ]);
        },
      },
      {
        nombre: 'posteos',
        correr: async () => {
          const { procesarPosteosProgramados } = await import('@/lib/presencia-digital/publicador');
          return procesarPosteosProgramados();
        },
      },
      {
        nombre: 'blog',
        correr: async () => {
          const { runMarketingAutomation } = await import('@/lib/marketing-automation');
          return runMarketingAutomation({ includeRecontacto: false });
        },
      },
      {
        nombre: 'recordatorios',
        correr: async () => {
          // 1. Deja los avisos de cuota vencida en la bandeja de salida. No manda nada.
          const { ejecutarEscaneoDeRecordatorios } = await import('@/app/actions/invoices');
          // 2. Revisa agenda de reuniones para avisar al equipo (1 hora antes / hoy)
          const { checkAndCreateReunionReminders } = await import('@/app/actions/notifications');
          const { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } = await import('@/lib/whatsapp/internal-token');
          return Promise.all([
            ejecutarEscaneoDeRecordatorios().catch(() => null),
            checkAndCreateReunionReminders(WHATSAPP_AUTOMATION_INTERNAL_TOKEN).catch(() => null),
          ]);
        },
      },
      {
        nombre: 'posicionamiento',
        correr: async () => {
          const { ejecutarRevisionPosicionamiento } = await import('@/lib/automatico/posicionamiento-diario');
          return ejecutarRevisionPosicionamiento(ahora, origen);
        },
      },
    ];

    for (const tarea of tareas) {
      if (!leTocaCorrer(ultimaCorrida[tarea.nombre], CADA_CUANTO[tarea.nombre], ahoraMs)) {
        resultado.omitidas.push(tarea.nombre);
        continue;
      }

      try {
        await tarea.correr();
        ultimaCorrida[tarea.nombre] = ahora.toISOString();
        resultado.corrio.push(tarea.nombre);
        await marcarCorrida(MAPA_CRON_IDS[tarea.nombre], ahora, origen);
      } catch (error: any) {
        // Se anota el intento igual: si algo esta roto, que no lo reintente en cada
        // peticion continua.
        ultimaCorrida[tarea.nombre] = ahora.toISOString();
        resultado.fallaron.push({
          tarea: tarea.nombre,
          error: error?.message || 'No se pudo completar la tarea.',
        });
      }
    }

    if (resultado.corrio.length > 0 || resultado.fallaron.length > 0) {
      await writeData(
        ESTADO_FILE,
        { ultimaCorrida },
        undefined,
        { skipAutoBackup: true },
      );
    }

    return resultado;
  } finally {
    await liberarLock();
  }
}

