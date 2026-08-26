import 'server-only';

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

/**
 * Quien puede disparar cada tarea programada.
 *
 * ## El problema que resuelve
 *
 * Las cuatro tareas pedian una contrasena en la cabecera del pedido. El dueno no
 * programa: configurar esa cabecera en el servicio que las llama, y ademas cargar
 * la misma contrasena en la consola del servidor, no es algo que pueda hacer. El
 * resultado real fue que **las tareas no corrieron nunca**, con el codigo
 * impecable.
 *
 * ## La decision
 *
 * **Con contrasena configurada, se exige. Sin contrasena configurada, las tareas
 * que no pueden hacer dano corren igual**, con freno por si alguien las descubre.
 *
 * No es aflojar un control por comodidad: es que **el control que importa ya vive
 * adentro de cada tarea**, y no en la puerta.
 *
 * - Guardar los numeros de las redes **no guarda dos veces el mismo dia**.
 * - Los posteos programados sacan **solo los que una persona dejo programados y ya
 *   vencieron**, con tope de tres por corrida.
 * - Las notas del blog corren **una vez por semana** y pasan por el contador de
 *   gasto.
 *
 * Llamarlas mil veces hace exactamente lo mismo que llamarlas una: adelantar algo
 * que igual iba a pasar. Lo unico que se gana atacandolas es gastar ancho de
 * banda, y para eso esta el freno.
 *
 * ## Lo que NO se abre nunca
 *
 * **Lo que sigue sin abrirse nunca: mandar.** Ninguna de estas tareas le escribe a
 * un cliente. Los recordatorios de cuota **preparan** la lista de a quien
 * reclamarle y la dejan en la bandeja de salida; el mensaje sale cuando una
 * persona lo toca, desde su propio WhatsApp.
 *
 * Si algun dia alguien hace que una tarea mande sola, **sale de esta lista el
 * mismo dia**. La linea es esa: preparar si, mandar no.
 */

export type NombreDeTareaProgramada =
  | 'metricas-de-redes'
  | 'publicar-programados'
  | 'generate-blog-post'
  | 'recordatorios-de-pago'
  | 'posicionamiento-diario';

/**
 * Las que pueden correr sin contrasena cuando no hay ninguna configurada.
 * **Se agrega una tarea aca solo si repetirla no le hace nada a nadie.**
 */
const TAREAS_QUE_NO_HACEN_DANO: ReadonlySet<NombreDeTareaProgramada> = new Set([
  'metricas-de-redes',
  'publicar-programados',
  'generate-blog-post',
  'posicionamiento-diario',
  // Los recordatorios entraron el 20 de agosto, despues de comprobar que **no le
  // escriben a nadie**: dejan el mensaje en la bandeja de salida con estado
  // pendiente, y una persona lo manda con un toque desde su propio WhatsApp.
  // Preparar la lista de a quien reclamarle no le llega a ningun cliente.
  'recordatorios-de-pago',
]);

export interface ResultadoDeLaPuerta {
  /** Si puede seguir adelante. */
  permitido: boolean;
  /** Si llego con la contrasena correcta. Sin ella, la respuesta va recortada. */
  conClave: boolean;
  /** Que contestar cuando no se permite. */
  estado?: number;
  mensaje?: string;
}

function claveDelPedido(request: Request): string | undefined {
  const enCabecera = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')?.trim();
  if (enCabecera) return enCabecera;

  // Tambien por direccion, porque hay servicios de tareas programadas donde poner
  // una cabecera es un tramite y pegar una direccion no.
  try {
    const enDireccion = new URL(request.url).searchParams.get('clave')?.trim();
    return enDireccion || undefined;
  } catch {
    return undefined;
  }
}

export async function abrirPuertaDeLaTarea(
  request: Request,
  tarea: NombreDeTareaProgramada,
): Promise<ResultadoDeLaPuerta> {
  const claveEsperada = process.env.CRON_SECRET?.trim();
  const claveRecibida = claveDelPedido(request);

  if (claveEsperada) {
    if (claveRecibida === claveEsperada) {
      return { permitido: true, conClave: true };
    }
    return {
      permitido: false,
      conClave: false,
      estado: 401,
      mensaje: 'Unauthorized',
    };
  }

  // Sin contrasena configurada.
  if (!TAREAS_QUE_NO_HACEN_DANO.has(tarea)) {
    return {
      permitido: false,
      conClave: false,
      estado: 503,
      mensaje: 'Esta tarea le escribe a un cliente: no corre hasta que se configure la clave.',
    };
  }

  try {
    await enforcePublicRateLimit({
      scope: `tarea-${tarea}`,
      limit: 12,
      windowMs: 5 * 60_000,
    });
  } catch {
    return {
      permitido: false,
      conClave: false,
      estado: 429,
      mensaje: 'Demasiados pedidos seguidos para esta tarea. Probá en unos minutos.',
    };
  }

  return { permitido: true, conClave: false };
}
