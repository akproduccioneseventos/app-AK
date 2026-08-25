import { buscarGemeloCargadoAMano, esEspejoDeFactura } from '@/lib/budget/pago-duplicado';
import type { PagoCliente } from '@/types/presupuesto';

const pago = (parcial: Partial<PagoCliente>): PagoCliente => ({
  id: parcial.id ?? 'p1',
  fecha: parcial.fecha ?? '2026-08-25T14:00:00.000Z',
  monto: parcial.monto ?? 10000,
  metodoPago: parcial.metodoPago ?? 'Efectivo',
  referencia: parcial.referencia,
  estadoPago: parcial.estadoPago,
});

/**
 * Un mismo cobro no puede aparecer dos veces en lo que se ve cobrado.
 *
 * Pasaba de verdad: alguien cobra la cuota y la carga a mano, y despues alguien carga
 * ese mismo cobro en la factura. La factura copia su pago al presupuesto y quedaban los
 * dos, porque el control comparaba la referencia y no coincidian. El dueno veia el
 * doble de lo cobrado en el panel contable.
 */
describe('Un cobro no se cuenta dos veces', () => {
  it('la copia de la factura encuentra el pago que se cargo a mano', () => {
    const pagos = [pago({ id: 'manual', referencia: 'Efectivo' })];

    const indice = buscarGemeloCargadoAMano(pagos, {
      monto: 10000,
      fecha: '2026-08-25T19:30:00.000Z', // el mismo dia, otra hora
    });

    expect(indice).toBe(0);
  });

  it('no confunde un cobro de otro dia', () => {
    const pagos = [pago({ id: 'manual', referencia: 'Efectivo', fecha: '2026-08-24T14:00:00.000Z' })];

    expect(buscarGemeloCargadoAMano(pagos, { monto: 10000, fecha: '2026-08-25T14:00:00.000Z' })).toBe(-1);
  });

  it('no confunde un cobro de otro importe', () => {
    const pagos = [pago({ id: 'manual', referencia: 'Efectivo', monto: 9000 })];

    expect(buscarGemeloCargadoAMano(pagos, { monto: 10000, fecha: '2026-08-25T14:00:00.000Z' })).toBe(-1);
  });

  it('no vuelve a agarrar un pago que ya es copia de una factura', () => {
    // Si el cliente pago dos veces el mismo importe el mismo dia, cada copia tiene que
    // llevarse un gemelo distinto: si no, se perderia un cobro de verdad.
    const pagos = [
      pago({ id: 'ya-tomado', referencia: 'AK_SYNC:invoice:1:payment:1' }),
      pago({ id: 'manual', referencia: 'Efectivo' }),
    ];

    expect(buscarGemeloCargadoAMano(pagos, { monto: 10000, fecha: '2026-08-25T14:00:00.000Z' })).toBe(1);
  });

  it('ignora un pago rechazado', () => {
    const pagos = [pago({ id: 'manual', referencia: 'Efectivo', estadoPago: 'rechazado' })];

    expect(buscarGemeloCargadoAMano(pagos, { monto: 10000, fecha: '2026-08-25T14:00:00.000Z' })).toBe(-1);
  });

  it('reconoce cual es una copia de factura y cual se cargo a mano', () => {
    expect(esEspejoDeFactura('AK_SYNC:invoice:7:payment:3')).toBe(true);
    expect(esEspejoDeFactura('Efectivo')).toBe(false);
    expect(esEspejoDeFactura(undefined)).toBe(false);
  });
});
