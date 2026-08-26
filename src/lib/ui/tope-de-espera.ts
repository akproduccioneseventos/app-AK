export const TOPE_DE_ESPERA_MS = 25_000;

/**
 * El aviso que ve el operador cuando el servidor no contesta a tiempo.
 *
 * Dice que **no se guardo nada** a proposito: lo peor que le puede pasar a alguien que
 * aprieta "cobrar" es quedarse sin saber si el pago entro o no.
 */
export class TopeDeEsperaError extends Error {
  constructor() {
    super('El servidor esta tardando en contestar. No se guardo nada: probá de nuevo en un momento.');
    this.name = 'TopeDeEsperaError';
  }
}

/**
 * Le pone tope a una accion del servidor, para que un boton nunca quede girando para
 * siempre.
 *
 * **Por que existe.** El boton de ingreso quedaba en "Ingresando..." sin fin, sin error y
 * sin poder reintentar. No era un error de programacion: todos los caminos de error
 * existian, pero **ninguno se alcanzaba nunca**, porque la llamada al servidor no tenia
 * tope. Si el servidor esta despertandose o la conexion se corta sin avisar, la promesa
 * no se resuelve ni falla: se queda. Y con ella, el `finally` que devolvia el boton a la
 * normalidad.
 *
 * Los 25 segundos son largos a proposito: cortar antes dejaria afuera al servidor que se
 * esta despertando, que es normal en la primera operacion del dia.
 *
 * > **La regla que sale de esto: una pantalla que "no hace nada" casi nunca esta rota.
 * > Esta esperando algo que no tiene tope.**
 */
export async function conTopeDeEspera<T>(
  tarea: Promise<T>,
  topeMs: number = TOPE_DE_ESPERA_MS,
): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      tarea,
      new Promise<never>((_, rechazar) => {
        temporizador = setTimeout(() => rechazar(new TopeDeEsperaError()), topeMs);
      }),
    ]);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}
