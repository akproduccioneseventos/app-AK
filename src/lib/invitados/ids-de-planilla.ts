import type { ResumenDePlanilla } from '@/lib/invitados/leer-planilla';

/**
 * Pregunta 58 (13 de octubre de 2026): cada fila de la planilla lleva un id de intento que se arma
 * UNA vez al leerla. Si el servidor guardó la fila pero la respuesta se perdió, el reintento de las
 * "fallidas" manda el mismo id y el servidor no crea otro invitado.
 *
 * `memoria` recuerda el id por línea (más su orden entre líneas idénticas), así releer el mismo
 * texto no cambia los ids. Se vacía cuando la importación termina completa.
 */
export function ponerIdsDeIntentoAFilas(
  resumen: ResumenDePlanilla,
  memoria: Map<string, string>,
  nuevoId: () => string,
): ResumenDePlanilla {
  const vistas = new Map<string, number>();
  const filas = resumen.filas.map((fila) => {
    const base = fila.lineaOriginal || fila.nombre;
    const orden = vistas.get(base) ?? 0;
    vistas.set(base, orden + 1);
    const clave = `${base}#${orden}`;
    let id = memoria.get(clave);
    if (!id) {
      id = nuevoId();
      memoria.set(clave, id);
    }
    return { ...fila, idIntento: id };
  });
  return { ...resumen, filas };
}
