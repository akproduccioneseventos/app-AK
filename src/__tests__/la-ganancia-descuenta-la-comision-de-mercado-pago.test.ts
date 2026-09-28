/**
 * La ganancia de cada fiesta descuenta lo que se quedó Mercado Pago (28/09/2026).
 * La comisión sale del informe del propio Mercado Pago (`fee_details`): nunca se
 * estima un porcentaje. El recargo por cuotas que pagó el cliente suma.
 */
import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';
import { comisionDeMercadoPago, reconcileMercadoPagoBudget } from '@/lib/payments/mercadopago-core';
import type { GestionCostosData } from '@/types/fiesta';
import type { PagoCliente, Presupuesto } from '@/types/presupuesto';

const costos = { ingresosTotalesEstimados: 100000, costosItems: [] } as unknown as GestionCostosData;

const cobroMp = (extra: Partial<PagoCliente>): PagoCliente => ({
  id: 'p1', fecha: '2026-09-01', monto: 50000, metodoPago: 'MercadoPago',
  estadoPago: 'confirmado', proveedorPago: 'mercadopago', ...extra,
} as PagoCliente);

describe('la comisión de Mercado Pago', () => {
  it('se lee del informe de Mercado Pago y no cuenta lo que paga el cliente', () => {
    expect(comisionDeMercadoPago({ id: 1, fee_details: [
      { type: 'mercadopago_fee', amount: 2900, fee_payer: 'collector' },
      { type: 'financing_fee', amount: 500, fee_payer: 'payer' },
    ] })).toBe(2900);
    expect(comisionDeMercadoPago({ id: 1 })).toBeUndefined();
  });

  it('queda guardada en el cobro al conciliar', () => {
    const presupuesto = { id: 'b1', pagosCliente: [], total: 100000 } as unknown as Presupuesto;
    const r = reconcileMercadoPagoBudget({
      presupuesto, sessionId: 's1', amount: 50000, chargedAmount: 55000,
      payment: { id: 9, status: 'approved', transaction_amount: 55000,
        fee_details: [{ amount: 3100, fee_payer: 'collector' }] },
    });
    const cobro = (r.presupuesto.pagosCliente ?? [])[0];
    expect(cobro?.comisionProveedor).toBe(3100);
    expect(cobro?.recargoFinanciero).toBe(5000);
  });

  it('la ganancia resta la comisión y suma el recargo', () => {
    const sin = calcularGananciaDeEvento(costos, []);
    const con = calcularGananciaDeEvento(costos, [], [cobroMp({ comisionProveedor: 3100, recargoFinanciero: 5000 })]);
    expect(con.gananciaReal).toBe(sin.gananciaReal - 3100 + 5000);
    expect(con.comisionesMercadoPago).toBe(3100);
  });

  it('un cobro sin comisión informada no suma su recargo y se avisa', () => {
    const r = calcularGananciaDeEvento(costos, [], [cobroMp({ recargoFinanciero: 5000 })]);
    expect(r.recargosCobrados).toBe(0);
    expect(r.cobrosSinComisionInformada).toBe(1);
  });

  it('un cobro rechazado no cuenta', () => {
    const r = calcularGananciaDeEvento(costos, [], [cobroMp({ estadoPago: 'rechazado', comisionProveedor: 3100 })]);
    expect(r.comisionesMercadoPago).toBe(0);
  });
});
