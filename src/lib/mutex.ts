/**
 * Turnos para que dos guardados no se pisen.
 *
 * Sirve para esto: si el contador y el organizador guardan la misma factura en el
 * mismo instante, sin turnos el segundo pisa al primero y un cambio se pierde.
 * Con turnos, el segundo espera y trabaja sobre el dato ya actualizado.
 *
 * Dos limites que hay que tener presentes:
 *
 * 1. **Vale dentro de un mismo servidor.** Si la aplicacion corre en mas de una
 *    instancia, cada una tiene su propio turno y dos guardados simultaneos en
 *    instancias distintas se siguen pudiendo pisar. Para cubrir ese caso hace
 *    falta que la escritura sea una transaccion en la base, no un candado en
 *    memoria.
 * 2. **No se puede reentrar.** Si el codigo que corre adentro de un turno vuelve
 *    a pedir el mismo turno, espera para siempre y la pantalla queda colgada.
 *    Antes de llamar a otra funcion desde adentro, revisar que esa funcion no use
 *    el mismo candado.
 */
export class AsyncMutex {
  private mutex = Promise.resolve();

  async runExclusive<T>(callback: () => Promise<T> | T): Promise<T> {
    let resolve: () => void;
    const next = new Promise<void>((res) => {
      resolve = res;
    });

    const curr = this.mutex;
    this.mutex = curr.then(() => next);

    return curr.then(async () => {
      try {
        return await callback();
      } finally {
        resolve!();
      }
    });
  }
}
