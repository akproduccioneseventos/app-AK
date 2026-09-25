/**
 * EL MENSAJE DEL PEDIDO AL PROVEEDOR (lista de compras de la fiesta).
 *
 * 25 de septiembre de 2026: el pedido que salía por WhatsApp usaba `cantidadNecesaria` —lo que
 * pide la receta para toda la fiesta— y no `cantidadAComprar` —lo que falta después de mirar el
 * depósito—. Se le pedía al proveedor todo de nuevo aunque hubiera stock: plata tirada. Además
 * iban renglones que no hacía falta comprar. Ahora va sólo lo que falta.
 */
export type RenglonDelPedido = { nombre: string; unit: string; cantidadAComprar: number };

const SON_UNIDADES = new Set(['u', 'un', 'unidad', 'unidades']);

export function armarPedidoAlProveedor(opciones: {
  nombreEvento: string;
  fechaEvento?: string;
  proveedor: string;
  renglones: RenglonDelPedido[];
}): string {
  let msg = `*Pedido de Insumos - AK Producciones*\n`;
  msg += `🎉 *Evento:* ${opciones.nombreEvento}${opciones.fechaEvento ? ` (${opciones.fechaEvento})` : ''}\n`;
  msg += `📦 *Proveedor:* ${opciones.proveedor}\n\n`;
  msg += `*Detalle del pedido:*\n`;
  for (const r of opciones.renglones) {
    const cantidad = Number(r.cantidadAComprar || 0);
    if (!(cantidad > 0)) continue;
    const enUnidades = SON_UNIDADES.has(String(r.unit || '').toLowerCase());
    const qty = enUnidades ? Math.ceil(cantidad) : Number(cantidad.toFixed(2));
    msg += `• ${r.nombre}: ${qty} ${r.unit}\n`;
  }
  msg += `\nPor favor confirmar disponibilidad y fecha de entrega. ¡Muchas gracias!`;
  return msg;
}
