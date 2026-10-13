import type { ResumenDePlanilla } from '@/lib/invitados/leer-planilla';

/**
 * Despues de una importacion a medias: deja en la pantalla SOLO las filas que no se guardaron,
 * con su linea original completa (mesa, categoria, restriccion, acompanantes) y el encabezado
 * de la planilla para que se vuelvan a leer igual.
 *
 * Las filas fallidas se identifican por NUMERO DE FILA, no por nombre: dos invitados homonimos
 * (dos "Juan Perez") quedaban los dos pendientes aunque uno ya se hubiera guardado, y se
 * duplicaba.
 */
export function prepararReintentoDePlanilla(
  resumen: ResumenDePlanilla,
  filasFallidas: Set<number>,
): { resumen: ResumenDePlanilla; texto: string } {
  const pendientes = resumen.filas.filter((f) => filasFallidas.has(f.filaNum));
  const lineas = pendientes.map((f) => f.lineaOriginal || f.nombre);
  const texto = [resumen.encabezado, ...lineas].filter(Boolean).join('\n');
  return {
    resumen: { ...resumen, filas: pendientes, validos: pendientes.length, repetidos: 0 },
    texto,
  };
}
