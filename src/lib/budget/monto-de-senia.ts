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
 * 1. **La seña acordada** con ese cliente. Si está cargada, manda: es lo que se
 *    habló y lo que figura en el presupuesto.
 * 2. **El 20% del total**, con el ajuste anual ya aplicado. Es la regla de la casa
 *    cuando no se cargó una seña puntual, y sigue al total: si el evento es más
 *    grande, la seña también.
 * 3. **El valor de último recurso**, sólo si no hay ni total. No debería usarse
 *    nunca en un presupuesto real.
 *
 * Nunca se cobra más que el saldo pendiente: de eso se ocupa quien llama.
 */

/** La parte del total que se pide de seña cuando no hay una acordada. */
export const PORCENTAJE_DE_SENIA = 0.2;

export interface DatosParaLaSenia {
  /** Lo acordado con el cliente, si se cargó. */
  seniaAcordada?: number;
  /** El total del presupuesto con el ajuste anual ya adentro. */
  totalConAjuste?: number;
  /** Sólo se usa si no hay nada mejor. */
  porDefecto: number;
}

function aNumero(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

export function montoDeSenia({
  seniaAcordada,
  totalConAjuste,
  porDefecto,
}: DatosParaLaSenia): number {
  const acordada = aNumero(seniaAcordada);
  if (acordada > 0) return Math.round(acordada);

  const total = aNumero(totalConAjuste);
  if (total > 0) return Math.round(total * PORCENTAJE_DE_SENIA);

  return Math.max(0, Math.round(aNumero(porDefecto)));
}
