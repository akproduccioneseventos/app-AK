import type { Invoice } from '@/types/invoice';
import type { Presupuesto } from '@/types/presupuesto';

/**
 * COBROS DE FACTURA QUE NO LLEGARON AL PRESUPUESTO (25 de septiembre de 2026, pregunta 25).
 *
 * Cobrar una factura que viene de un presupuesto son dos pasos: el cobro en la factura y el mismo
 * cobro en el presupuesto (con la referencia `AK_SYNC:invoice:<factura>:payment:<cobro>`). Si el
 * servidor se corta entre los dos, la factura queda cobrada y el presupuesto no: su saldo sigue
 * mostrando deuda y al cliente le puede llegar un recordatorio de cuota que ya pagó.
 *
 * Esto los encuentra. No los pasa solo: lo hace una persona con un toque
 * (`pasarCobrosPendientesAlPresupuesto`), porque es plata.
 */
export type CobroSinPasar = {
  presupuestoId: string;
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string;
  fecha: string;
  monto: number;
  metodo: string;
  referencia: string;
};

export const referenciaDelCobro = (invoiceId: string, paymentId: string) =>
  `AK_SYNC:invoice:${invoiceId}:payment:${paymentId}`;

export function cobrosDeFacturaSinPasarAlPresupuesto(
  facturas: Invoice[],
  presupuestos: Presupuesto[],
): CobroSinPasar[] {
  const porId = new Map(presupuestos.map((p) => [p.id, p]));
  const salida: CobroSinPasar[] = [];
  for (const factura of facturas) {
    if (!factura.sourcePresupuestoId) continue;
    const presupuesto = porId.get(factura.sourcePresupuestoId);
    if (!presupuesto) continue;
    const referenciasYaPasadas = new Set(
      (presupuesto.pagosCliente || []).map((p) => String(p.referencia || '').trim()).filter(Boolean),
    );
    for (const pago of factura.payments || []) {
      // Sólo los que se anotaron como "todavía no pasado". Los cobros viejos o de otros caminos
      // (la seña va al revés, del presupuesto a la factura) no tienen la marca y no se tocan:
      // mirarlos por referencia daba falsas alarmas y podía duplicar plata.
      if (pago.pasadoAlPresupuesto !== false) continue;
      if (!(Number(pago.amount) > 0)) continue;
      const referencia = referenciaDelCobro(factura.id, pago.id);
      if (referenciasYaPasadas.has(referencia)) continue;
      salida.push({
        presupuestoId: presupuesto.id,
        invoiceId: factura.id,
        invoiceNumber: factura.invoiceNumber,
        paymentId: pago.id,
        fecha: pago.paymentDate,
        monto: Number(pago.amount),
        metodo: String(pago.method || 'Transferencia'),
        referencia,
      });
    }
  }
  return salida;
}
