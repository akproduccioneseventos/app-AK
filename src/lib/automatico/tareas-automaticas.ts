import { readData, writeData } from '@/lib/data-service';

/**
 * Las cosas que la app promete hacer SOLA, y cuando paso cada una por ultima vez.
 *
 * **Por que existe este archivo.** El 20 de agosto de 2026 el dueno pregunto por
 * que el blog no publicaba. Aparecio que habia cuatro tareas automaticas escritas
 * y **ninguna tenia quien la disparara**: ni el blog, ni el guardado diario de los
 * numeros de las redes, ni la publicacion de los posteos programados, ni los
 * recordatorios de cuota vencida. Las cuatro compilaban, tenian pruebas en verde,
 * y no habian corrido nunca.
 *
 * Las auditorias no lo agarraron porque preguntaban **"esta programado?"**, y la
 * respuesta era si. Nunca preguntaron **"esto paso alguna vez?"**.
 *
 * Este archivo cambia la pregunta. Cada tarea se anota aca, y cada vez que corre
 * de verdad deja su marca. Si una dice "nunca corrio", esta rota, por mas lindo
 * que este el codigo.
 *
 * **Regla: no se agrega una tarea automatica sin agregarla a esta lista.** Hay una
 * prueba que recorre `src/app/api/cron/` y falla si aparece una que no este.
 */

const ARCHIVO = 'tareas-automaticas.json';

export interface TareaAutomatica {
  /** El nombre de la carpeta en `src/app/api/cron/`. */
  id: string;
  /** Como se llama para el dueno, sin jerga. */
  nombre: string;
  /** Que deja de pasar si no corre. En criollo, y concreto. */
  siNoCorre: string;
  /** Cada cuantas horas deberia correr. Sirve para saber si esta atrasada. */
  cadaHoras: number;
}

export const TAREAS_AUTOMATICAS: TareaAutomatica[] = [
  {
    id: 'generate-blog-post',
    nombre: 'Escribir las notas del blog',
    siNoCorre: 'No se publica ninguna nota nueva, y la web deja de sumar paginas por las que la gente la encuentra.',
    cadaHoras: 56, // 3 veces por semana (Lunes, Miercoles y Viernes)
  },
  {
    id: 'metricas-de-redes',
    nombre: 'Guardar los numeros de las redes',
    siNoCorre: 'Se pierde para siempre el historial de seguidores y alcance de esos dias: las plataformas no lo entregan hacia atras.',
    cadaHoras: 24,
  },
  {
    id: 'publicar-programados',
    nombre: 'Publicar los posteos programados',
    siNoCorre: 'Los posteos que se dejaron listos para una fecha no salen nunca.',
    cadaHoras: 1,
  },
  {
    id: 'recordatorios-de-pago',
    nombre: 'Avisar de las cuotas por vencer',
    siNoCorre: 'El cliente con una cuota vencida no recibe ningun aviso, y hay que perseguirlo a mano.',
    cadaHoras: 24,
  },
];

import type { OrigenDisparo } from '@/lib/automatico/control-concurrencia';

export interface DetalleMarcaCorrida {
  fecha: string;
  origen?: OrigenDisparo;
}

type Marcas = Record<string, string | DetalleMarcaCorrida>;

/** Deja la marca de que la tarea corrio de verdad y quien la disparo. Se llama al terminar bien. */
export async function marcarCorrida(
  id: string,
  ahora: Date = new Date(),
  origen: OrigenDisparo = 'despertador',
): Promise<void> {
  try {
    const marcas = await readData<Marcas>(ARCHIVO, {});
    marcas[id] = {
      fecha: ahora.toISOString(),
      origen,
    };
    await writeData(ARCHIVO, marcas, undefined, { skipAutoBackup: true });
  } catch {
    // Que falle la marca no puede tumbar la tarea que si corrio.
  }
}

export interface EstadoDeTarea extends TareaAutomatica {
  ultimaCorrida: string | null;
  disparadoPor?: OrigenDisparo | null;
  /** `nunca` es la que importa: quiere decir que esta escrita y no se ejecuta. */
  estado: 'nunca' | 'atrasada' | 'al-dia';
  horasDesdeLaUltima: number | null;
}

export async function estadoDeLasTareas(ahora: Date = new Date()): Promise<EstadoDeTarea[]> {
  const marcas = await readData<Marcas>(ARCHIVO, {}).catch(() => ({} as Marcas));

  return TAREAS_AUTOMATICAS.map((tarea) => {
    const registro = marcas[tarea.id];
    if (!registro) {
      return {
        ...tarea,
        ultimaCorrida: null,
        disparadoPor: null,
        estado: 'nunca' as const,
        horasDesdeLaUltima: null,
      };
    }

    const marca = typeof registro === 'string' ? registro : registro.fecha;
    const disparadoPor = typeof registro === 'object' && registro.origen ? registro.origen : 'despertador';

    if (!marca) {
      return {
        ...tarea,
        ultimaCorrida: null,
        disparadoPor: null,
        estado: 'nunca' as const,
        horasDesdeLaUltima: null,
      };
    }

    const horas = (ahora.getTime() - new Date(marca).getTime()) / 3_600_000;
    // Se le da el doble del intervalo antes de marcarla atrasada: una corrida que
    // se salteo por un reinicio no es una tarea rota.
    const estado = horas > tarea.cadaHoras * 2 ? ('atrasada' as const) : ('al-dia' as const);

    return {
      ...tarea,
      ultimaCorrida: marca,
      disparadoPor,
      estado,
      horasDesdeLaUltima: Math.round(horas),
    };
  });
}

