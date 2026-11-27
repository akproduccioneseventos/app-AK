import { armarPonerAlDia } from '@/lib/contabilidad/poner-al-dia';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';

describe('Orden 372 B5.1 — Poner al día incluye ajuste anual cuando ajusteAnualActivo es indefinido', () => {
  const fiesta = (id: string, presupuestoId: string, fecha: string): FiestaEnPlanificacion =>
    ({
      id,
      presupuestoId,
      estado: 'En Planificación',
      configuracion: { nombreEvento: `Fiesta ${id}`, fechaEvento: fecha },
    } as unknown as FiestaEnPlanificacion);

  it('contrato aceptado en 2025 para fiesta de 2026 sin ajusteAnualActivo definido cobra el 15% de ajuste', () => {
    const p = {
      id: 'p_indef',
      clienteNombre: 'Lucía Pérez',
      estado: 'Aceptado',
      eventoFecha: '2026-08-08T00:00:00.000Z',
      fechaFirmaContrato: '2025-06-01T12:00:00.000Z',
      totalConDescuento: 200000,
      costoTotalEstimado: 200000,
      itemsPresupuestados: [],
      pagosCliente: [],
    } as unknown as Presupuesto;

    const r = armarPonerAlDia([p], [fiesta('f1', 'p_indef', '2026-08-08')], '2026-10-09');
    expect(r.cobros).toHaveLength(1);
    expect(r.cobros[0].total).toBe(230000);
    expect(r.cobros[0].saldo).toBe(230000);
  });

  it('si pagó sólo la base sin el ajuste, figura con el saldo del 15% pendiente', () => {
    const p = {
      id: 'p_parcial',
      clienteNombre: 'Carlos Gómez',
      estado: 'Aceptado',
      eventoFecha: '2026-08-08T00:00:00.000Z',
      fechaFirmaContrato: '2025-06-01T12:00:00.000Z',
      totalConDescuento: 200000,
      costoTotalEstimado: 200000,
      itemsPresupuestados: [],
      pagosCliente: [{ id: 'pg1', fecha: '2025-07-01', monto: 200000, metodoPago: 'Transferencia', estadoPago: 'confirmado' }],
    } as unknown as Presupuesto;

    const r = armarPonerAlDia([p], [fiesta('f2', 'p_parcial', '2026-08-08')], '2026-10-09');
    expect(r.cobros).toHaveLength(1);
    expect(r.cobros[0].total).toBe(230000);
    expect(r.cobros[0].cobrado).toBe(200000);
    expect(r.cobros[0].saldo).toBe(30000);
  });

  it('respeta cuando ajusteAnualActivo fue apagado explícitamente en false', () => {
    const p = {
      id: 'p_sin_ajuste',
      clienteNombre: 'Marta Silva',
      estado: 'Aceptado',
      ajusteAnualActivo: false,
      eventoFecha: '2026-08-08T00:00:00.000Z',
      fechaFirmaContrato: '2025-06-01T12:00:00.000Z',
      totalConDescuento: 200000,
      costoTotalEstimado: 200000,
      itemsPresupuestados: [],
      pagosCliente: [],
    } as unknown as Presupuesto;

    const r = armarPonerAlDia([p], [fiesta('f3', 'p_sin_ajuste', '2026-08-08')], '2026-10-09');
    expect(r.cobros).toHaveLength(1);
    expect(r.cobros[0].total).toBe(200000);
    expect(r.cobros[0].saldo).toBe(200000);
  });
});
