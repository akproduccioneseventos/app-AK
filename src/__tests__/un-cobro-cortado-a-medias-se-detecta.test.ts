/**
 * MATAFUEGO — Un cobro de factura cortado entre la factura y el presupuesto deja rastro y se
 * pasa una sola vez (25 de septiembre de 2026, pregunta 25).
 *
 * Se probo rompiendolo: detectando por referencia en vez de por la marca, la seña (que va del
 * presupuesto a la factura) aparece como pendiente y se pone en rojo la segunda.
 */
import { cobrosDeFacturaSinPasarAlPresupuesto } from '@/lib/commercial-flow/cobros-sin-pasar-al-presupuesto';

const presupuesto = (pagos: any[] = []) => ({ id: 'pre1', pagosCliente: pagos }) as any;
const factura = (payments: any[]) => ({ id: 'inv1', invoiceNumber: 'A-1', sourcePresupuestoId: 'pre1', payments }) as any;

describe('Un cobro cortado a medias se detecta', () => {
  it('un cobro marcado como no pasado y sin espejo en el presupuesto aparece', () => {
    const r = cobrosDeFacturaSinPasarAlPresupuesto(
      [factura([{ id: 'pay1', amount: 5000, paymentDate: '2026-09-01', method: 'Efectivo', pasadoAlPresupuesto: false }])],
      [presupuesto()],
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ presupuestoId: 'pre1', monto: 5000, referencia: 'AK_SYNC:invoice:inv1:payment:pay1' });
  });

  it('cobros viejos o de la seña (sin marca) no aparecen: no se duplica plata', () => {
    const r = cobrosDeFacturaSinPasarAlPresupuesto(
      [factura([{ id: 'sena', amount: 10000, paymentDate: '2026-09-01' }])],
      [presupuesto([{ id: 'x', referencia: 'Seña registrada al firmar contrato', monto: 10000 }])],
    );
    expect(r).toHaveLength(0);
  });

  it('si el espejo ya está en el presupuesto, no aparece aunque la marca haya quedado vieja', () => {
    const r = cobrosDeFacturaSinPasarAlPresupuesto(
      [factura([{ id: 'pay1', amount: 5000, paymentDate: '2026-09-01', pasadoAlPresupuesto: false }])],
      [presupuesto([{ id: 'y', referencia: 'AK_SYNC:invoice:inv1:payment:pay1', monto: 5000 }])],
    );
    expect(r).toHaveLength(0);
  });

  it('un cobro ya pasado no aparece', () => {
    const r = cobrosDeFacturaSinPasarAlPresupuesto(
      [factura([{ id: 'pay1', amount: 5000, paymentDate: '2026-09-01', pasadoAlPresupuesto: true }])],
      [presupuesto()],
    );
    expect(r).toHaveLength(0);
  });
});
