import 'server-only';

import { readData, writeData } from '@/lib/data-service';

/**
 * Las tareas que se ponen al dia cuando alguien del equipo entra a la app.
 *
 * **Por que existe.** Las tareas automaticas necesitan que algo de afuera las
 * llame a cierta hora. Mientras ese despertador de afuera no este prendido, no
 * corren nunca: el dueno vio meses sin numeros de redes guardados y sin posteos
 * programados saliendo.
 *
 * El blog ya se ponia al dia asi desde hace tiempo, y funciona. Esto extiende el
 * mismo camino a las otras dos que se pueden repetir sin hacer dano.
 *
 * **No reemplaza al despertador de afuera, y no pretende hacerlo.** Si nadie abre
 * la app en tres dias, estas tareas no corren en tres dias. Pero es la diferencia
 * entre "cada vez que el equipo trabaja" y "nunca".
 *
 * ## Lo que NO entra aca, y es a proposito
 *
 * **Nada de esto le manda un mensaje a nadie.** Los recordatorios de cuota
 * **preparan** la lista de a quien reclamarle y la dejan en la bandeja de salida;
 * el mensaje sale cuando una persona lo toca, desde su propio WhatsApp. El dueno
 * usa su WhatsApp personal: **ningun bot contesta ni escribe solo**, y eso no
 * cambia.
 *
 * La linea es esa: **preparar si, mandar no.** Si alguna vez una de estas tareas
 * manda sola, sale de aca el mismo dia.
 *
 * ## Por que es seguro repetirlas
 *
 * Las dos tienen su propio freno adentro:
 *
 * - El guardado de metricas **no guarda dos veces el mismo dia**.
 * - Los posteos programados sacan **solo los que ya vencieron**, con tope de tres
 *   por corrida.
 *
 * Ademas, aca arriba hay un control de "¿me toca?" para no repetir el intento
 * cada vez que alguien abre una pantalla.
 */

const ESTADO_FILE = 'tareas-al-entrar-estado.json';

/** Cada cuanto se vuelve a intentar cada tarea, en milisegundos. */
const CADA_CUANTO = {
  metricas: 12 * 60 * 60 * 1000,
  posteos: 15 * 60 * 1000,
  recordatorios: 12 * 60 * 60 * 1000,
} as const;

type NombreDeTarea = keyof typeof CADA_CUANTO;

interface EstadoDeTareas {
  ultimaCorrida?: Partial<Record<NombreDeTarea, string>>;
}

export interface ResultadoAlEntrar {
  corrio: NombreDeTarea[];
  omitidas: NombreDeTarea[];
  fallaron: Array<{ tarea: NombreDeTarea; error: string }>;
}

function leTocaCorrer(ultima: string | undefined, cadaCuantoMs: number, ahoraMs: number): boolean {
  if (!ultima) return true;
  const anterior = new Date(ultima).getTime();
  if (!Number.isFinite(anterior)) return true;
  return ahoraMs - anterior >= cadaCuantoMs;
}

/**
 * Pone al dia lo que este vencido. Se llama cuando un administrador abre la app.
 *
 * **Nunca tira un error hacia afuera**: si una tarea falla, se anota y se sigue
 * con la otra. Que falle poner al dia una metrica no puede romperle la pantalla a
 * nadie.
 */
export async function ponerAlDiaAlEntrar(ahora: Date = new Date()): Promise<ResultadoAlEntrar> {
  const ahoraMs = ahora.getTime();
  const estado = await readData<EstadoDeTareas>(ESTADO_FILE, {});
  const ultimaCorrida = { ...(estado.ultimaCorrida || {}) };

  const resultado: ResultadoAlEntrar = { corrio: [], omitidas: [], fallaron: [] };

  const tareas: Array<{ nombre: NombreDeTarea; correr: () => Promise<unknown> }> = [
    {
      nombre: 'metricas',
      correr: async () => {
        const { guardarMetricasDelDia } = await import('@/lib/presencia-digital/guardado-diario');
        return guardarMetricasDelDia();
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
      nombre: 'recordatorios',
      correr: async () => {
        // Deja los avisos de cuota vencida en la bandeja de salida. No manda nada.
        const { ejecutarEscaneoDeRecordatorios } = await import('@/app/actions/invoices');
        return ejecutarEscaneoDeRecordatorios();
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
    } catch (error: any) {
      // Se anota el intento igual: si algo esta roto, que no lo reintente en cada
      // clic del equipo.
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
}
