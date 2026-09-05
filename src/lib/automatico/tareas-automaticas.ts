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
  {
    id: 'posicionamiento-diario',
    nombre: 'Revisar la salud de la web en Google',
    siNoCorre: 'Si una página pública queda rota o sin título, Google no la muestra y nadie se entera hasta que bajan las visitas.',
    cadaHoras: 24,
  },
  {
    id: 'fiesta-proxima-revision',
    nombre: 'Revisar pendientes de las fiestas próximas',
    siNoCorre: 'Las fiestas de las próximas semanas quedan sin verificar y no nos enteramos si falta mozos, menú o salón hasta el día del evento.',
    cadaHoras: 24,
  },
  {
    id: 'prospectos-seguimiento',
    nombre: 'Seguimiento de prospectos y presupuestos',
    siNoCorre: 'Los clientes que pidieron presupuesto no reciben seguimiento y se pierden ventas por falta de respuesta a tiempo.',
    cadaHoras: 24,
  },
  {
    id: 'recordatorio-a-los-invitados',
    nombre: 'Recordarle al invitado antes de la fiesta',
    siNoCorre: 'Los invitados confirmados no reciben la dirección, hora ni enlace a su invitación dos días antes ni el día de la fiesta.',
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

export interface EstadoDespertador {
  ultimoToque: string | null;
  estado: 'activo' | 'nunca' | 'atrasado';
  minutosDesdeUltimoToque: number | null;
  mensaje: string;
}

/** Deja constancia de que el despertador externo/Google toco la puerta del despachador. */
export async function marcarToqueDespertador(ahora: Date = new Date()): Promise<void> {
  try {
    const marcas = await readData<Marcas>(ARCHIVO, {});
    marcas['__despertador_toque__'] = {
      fecha: ahora.toISOString(),
      origen: 'despertador',
    };
    await writeData(ARCHIVO, marcas, undefined, { skipAutoBackup: true });
  } catch {
    // Si falla el guardado de la marca, no frena la ejecucion.
  }
}

/** Consulta cuando fue la ultima vez que el despertador toco la puerta. */
export async function estadoDelDespertador(ahora: Date = new Date()): Promise<EstadoDespertador> {
  try {
    const marcas = await readData<Marcas>(ARCHIVO, {}).catch(() => ({} as Marcas));
    const registro = marcas['__despertador_toque__'];
    const ultimoToque = typeof registro === 'string' ? registro : registro?.fecha || null;
    if (!ultimoToque) {
      return {
        ultimoToque: null,
        estado: 'nunca',
        minutosDesdeUltimoToque: null,
        mensaje: 'El despertador no está funcionando: nunca tocó la puerta.',
      };
    }

    const diffMinutos = Math.round((ahora.getTime() - new Date(ultimoToque).getTime()) / 60_000);
    // El despertador corre cada 15 min. Si pasan mas de 45 min (3 ciclos), se marca atrasado.
    if (diffMinutos > 45) {
      return {
        ultimoToque,
        estado: 'atrasado',
        minutosDesdeUltimoToque: diffMinutos,
        mensaje: `El despertador no está funcionando: no toca la puerta hace ${diffMinutos} minutos.`,
      };
    }

    return {
      ultimoToque,
      estado: 'activo',
      minutosDesdeUltimoToque: diffMinutos,
      mensaje: `El despertador está funcionando (último toque hace ${diffMinutos} min).`,
    };
  } catch {
    return {
      ultimoToque: null,
      estado: 'nunca',
      minutosDesdeUltimoToque: null,
      mensaje: 'El despertador no está funcionando: nunca tocó la puerta.',
    };
  }
}


