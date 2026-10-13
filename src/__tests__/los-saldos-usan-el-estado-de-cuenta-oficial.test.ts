/** @jest-environment node */
/**
 * Saldos que ignoraban los cobros del presupuesto (12/10/2026).
 *
 * - El recibo de pago sumaba solo `invoice.payments`; el panel "en vivo" restaba lo de las facturas
 *   del presupuesto estimado; la liquidacion de una fiesta suspendida sumaba las cuotas del plan y
 *   usaba el estimado sin el ajuste anual. Los tres ahora usan el estado de cuenta oficial.
 */
import fs from 'fs';
import path from 'path';
import { calcularLiquidacionSuspension } from '@/lib/fiesta/revisar-fiestas';
import { calcularEstadoDeCuenta } from '@/lib/budget/saldo-con-ajuste';

const leer = (...p: string[]) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');

const fiesta: any = {
  id: 'f1',
  configuracion: { presupuestoEstimado: 10000 },
  planDePagos: { cuotas: [{ id: 'c1', monto: 1000, estado: 'pagado', montoPagado: 1000 }] }, // el plan solo conoce $1000
};

describe('liquidacion de una fiesta suspendida', () => {
  it('usa el total vigente (con ajuste) y lo cobrado del presupuesto, no las cuotas del plan', () => {
    const l = calcularLiquidacionSuspension(fiesta, 11500, 4000);
    expect(l.totalPresupuesto).toBe(11500);
    expect(l.penalidad30).toBe(3450);
    expect(l.totalCobrado).toBe(4000);
    expect(l.saldoAFavor).toBe(550);
    expect(l.diferenciaACobrar).toBe(0);
  });

  it('si el presupuesto no esta disponible, sigue como antes (cuotas del plan)', () => {
    const l = calcularLiquidacionSuspension(fiesta, 10000);
    expect(l.totalCobrado).toBe(1000);
    expect(l.diferenciaACobrar).toBe(2000);
  });

  it('cobrado cero del presupuesto cuenta como cero (no cae a las cuotas)', () => {
    expect(calcularLiquidacionSuspension(fiesta, 10000, 0).totalCobrado).toBe(0);
  });

  it('las dos llamadoras le pasan el total y lo cobrado del estado de cuenta oficial', () => {
    expect(leer('app', 'actions', 'fiesta', 'fiesta.actions.ts')).toMatch(/calcularLiquidacionSuspension\(suspendida, totalVigente, cobrado\)/);
    expect(leer('app', '(app)', 'fiestas', 'nueva', 'page.tsx')).toMatch(/calcularLiquidacionSuspension\(fiesta, cuentaPresupuesto\?\.total, cuentaPresupuesto\?\.pagado\)/);
  });
});

describe('el estado de cuenta ve los cobros anotados en el presupuesto', () => {
  const presupuesto: any = {
    id: 'p1', estado: 'Aceptado', eventoFecha: '2026-12-10', timestamp: '2026-09-01T00:00:00.000Z',
    itemsPresupuestados: [], costoTotalEstimado: 10000, totalConDescuento: 10000,
    pagosCliente: [
      { id: 'a', monto: 3000, fecha: '2026-09-02', metodoPago: 'Efectivo' },
      { id: 'b', monto: 1000, fecha: '2026-09-03', metodoPago: 'Efectivo', estadoPago: 'pendiente_confirmacion' },
    ],
  };
  it('cuenta lo confirmado y deja afuera lo pendiente', () => {
    const c = calcularEstadoDeCuenta(presupuesto);
    expect(c.pagado).toBe(3000);
    expect(c.saldo).toBe(7000);
  });
  it('el recibo y el panel en vivo salen de ese estado de cuenta', () => {
    const recibo = leer('app', '(app)', 'fiestas', 'nueva', 'gestion-documental', 'recibo-pago', 'page.tsx');
    expect(recibo).toContain('estadoDeCuenta.pagado');
    expect(recibo).toContain('estadoDeCuenta.saldo');
    const enVivo = leer('app', '(app)', 'fiestas', 'nueva', 'en-vivo', 'page.tsx');
    expect(enVivo).toContain('calcularEstadoDeCuenta(presupuesto).saldo');
    expect(enVivo).not.toContain('presupuestoEstimado || 0');
  });
});
