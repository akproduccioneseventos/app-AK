/**
 * El total del presupuesto después de cancelar servicios desde el portal (orden 210, Codex 195).
 *
 * Una sola cuenta para tres cosas que tienen que dar lo mismo: lo que se guarda, el documento de
 * cancelación y lo que la pantalla le dice al cliente. Antes eran tres cuentas distintas:
 * - la segunda cancelación calculaba la devolución sólo con su propia multa y olvidaba la anterior;
 * - la cancelación total le restaba otra vez el descuento fijo a la multa, que ya salía del total
 *   con descuento.
 *
 * La regla: los servicios que quedan llevan su descuento (el porcentaje sobre lo que queda; el fijo,
 * hasta lo que queda), y las multas se suman enteras, sin descuento.
 */
type Item = { idServicioCatalogo?: string; costoTotalItem?: number; esRegalo?: boolean };

export function esMultaDeCancelacion(item: Item): boolean {
  return String(item.idServicioCatalogo ?? '').startsWith('multa_cancelacion');
}

export function totalTrasCancelar(
  items: Item[],
  descuentoTipo?: string | null,
  descuentoValor?: number | null,
): number {
  const valor = (i: Item) => Number(i.costoTotalItem) || 0;
  const servicios = items.filter((i) => !i.esRegalo && !esMultaDeCancelacion(i)).reduce((s, i) => s + valor(i), 0);
  const multas = items.filter((i) => !i.esRegalo && esMultaDeCancelacion(i)).reduce((s, i) => s + valor(i), 0);
  let descuento = 0;
  if (descuentoTipo && descuentoValor) {
    descuento = descuentoTipo === 'porcentaje'
      ? Math.round((servicios * Number(descuentoValor)) / 100)
      : Math.min(servicios, Number(descuentoValor) || 0);
  }
  return Math.max(0, servicios - descuento) + multas;
}
