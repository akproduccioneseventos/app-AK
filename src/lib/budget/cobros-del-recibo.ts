import type { Invoice, Payment } from '@/types/invoice';
import type { Presupuesto } from '@/types/presupuesto';
import { isConfirmedClientPayment } from '@/lib/budget/financial-guardrails';

export type CobroDelRecibo = Payment & { invoiceNumber: string };

/**
 * El detalle de cobros del recibo, de la MISMA fuente que el total.
 *
 * Antes el total venía de los cobros del presupuesto y el detalle sólo de las facturas: un cobro anotado en el
 * presupuesto sin factura daba "$40.410 abonados" junto a "No se han registrado pagos" (auditoría del 18/11/2026,
 * A18-03). Con presupuesto, el detalle son sus cobros confirmados (que ya incluyen los que pasan por una factura, así
 * no se cuentan dos veces); sin presupuesto, los de las facturas. Ordenados por fecha.
 */
export function cobrosDelRecibo(presupuesto: Presupuesto | null | undefined, facturas: Invoice[]): CobroDelRecibo[] {
  const cobros: CobroDelRecibo[] = [];
  if (presupuesto) {
    (presupuesto.pagosCliente ?? []).filter(isConfirmedClientPayment).forEach((p, idx) => {
      cobros.push({
        id: p.id || `pago-${idx}`,
        paymentDate: p.fecha,
        amount: Number(p.monto) || 0,
        method: p.metodoPago as Payment['method'],
        notes: p.referencia,
        invoiceNumber: '',
      });
    });
  } else {
    facturas.forEach((inv) => {
      (inv.payments || []).forEach((p) => cobros.push({ ...p, invoiceNumber: inv.invoiceNumber }));
    });
  }
  return cobros.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
}
