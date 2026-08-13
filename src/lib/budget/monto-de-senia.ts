/**
 * Cuánta seña le corresponde pagar a este cliente.
 *
 * **El problema que resuelve.** El botón de "Pagar seña" de Mercado Pago cobraba
 * siempre $5.000, un valor fijo pensado como último recurso, sin mirar la seña que
 * se había acordado con ese cliente. En un casamiento grande, el cliente apretaba
 * "Pagar seña", pagaba cinco mil pesos, y la aplicación mostraba la seña como
 * cobrada. La diferencia aparecía mucho después, cuando ya había que ir a pedirle
 * el resto: justo en el momento en que la reserva se sostiene sola.
 *
 * Y la aplicación **ya sabía** el número correcto: el resumen que se le muestra al
 * cliente antes de firmar usa la seña acordada, o el 20% del total. Eran dos
 * lugares distintos diciendo cosas distintas sobre la misma plata.
 *
 * El orden es este, y el porqué de cada paso:
 *
 * 1. **La seña acordada** con ese cliente. Si está cargada en el presupuesto,
 *    manda: es lo que se habló con esa persona.
 * 2. **El monto general**, que hoy son $5.000 para todos. **Decisión del dueño del
 *    12 de agosto de 2026:** la seña es un monto fijo, no un porcentaje del evento.
 *    Antes había un cálculo de 20% del total dando vueltas en la pantalla previa a
 *    la firma; eso no es lo que él cobra.
 *
 * El monto general se edita desde Ajustes, así que si mañana sube no hay que tocar
 * el código.
 *
 * Nunca se cobra más que el saldo pendiente: de eso se ocupa quien llama.
 */

/** Lo que se cobra de seña cuando no hay una acordada, si nadie lo configuró. */
export const SENIA_POR_DEFECTO = 5000;

export interface DatosParaLaSenia {
  /** Lo acordado con el cliente, si se cargó. */
  seniaAcordada?: number;
  /** El monto general configurado en Ajustes. */
  porDefecto?: number;
}

function aNumero(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

export function montoDeSenia({ seniaAcordada, porDefecto }: DatosParaLaSenia): number {
  const acordada = aNumero(seniaAcordada);
  if (acordada > 0) return Math.round(acordada);

  const general = aNumero(porDefecto);
  if (general > 0) return Math.round(general);

  return SENIA_POR_DEFECTO;
}
