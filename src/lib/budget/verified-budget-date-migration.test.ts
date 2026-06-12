import type { Presupuesto } from '@/types/presupuesto';
import { migrateVerifiedBudgetDates } from './verified-budget-date-migration';

const eventDates = [
  '2026-08-08', '2026-09-12', '2026-09-18', '2026-10-03', '2026-10-10',
  '2026-11-05', '2026-11-07', '2026-11-28', '2026-11-29', '2026-12-05',
  '2026-12-12', '2026-12-19', '2027-01-02', '2027-02-13', '2027-02-19',
  '2027-04-17', '2027-05-22', '2027-05-29', '2027-07-03', '2027-08-14',
  '2027-08-21', '2027-09-18', '2028-01-08', '2028-03-04', '2028-03-18',
  '2028-09-30', '2029-05-05', '2029-06-23', '2029-07-28',
];

function budget(overrides: Partial<Presupuesto>): Presupuesto {
  return {
    id: 'pres_verified_test',
    clienteNombre: 'Cliente',
    eventoTipo: 'Otro',
    eventoFecha: '2026-08-08T12:00:00.000Z',
    invitadosCantidad: 1,
    salonFiestas: '',
    itemsPresupuestados: [],
    costoTotalEstimado: 0,
    timestamp: '2026-06-05T12:00:00.000Z',
    estado: 'Aceptado',
    ...overrides,
  };
}

describe('migrateVerifiedBudgetDates', () => {
  it('corrige los 29 presupuestos importados usando su fecha documental', () => {
    const imported = eventDates.map((eventDate, index) => budget({
      id: `pres_verified_${index}`,
      eventoFecha: `${eventDate}T12:00:00.000Z`,
    }));

    const result = migrateVerifiedBudgetDates(imported);

    expect(result.changedCount).toBe(29);
    expect(result.budgets[0].timestamp).toBe('2025-08-26T12:00:00.000Z');
    expect(result.budgets[13].timestamp).toBe('2026-05-13T12:00:00.000Z');
    expect(result.budgets[28].timestamp).toBe('2025-06-23T12:00:00.000Z');
  });

  it('no modifica presupuestos manuales ni fechas ya corregidas', () => {
    const manual = budget({ id: 'pres_manual', source: 'manual' });
    const corrected = budget({ timestamp: '2025-08-26T12:00:00.000Z' });

    const result = migrateVerifiedBudgetDates([manual, corrected]);

    expect(result.changedCount).toBe(0);
    expect(result.budgets).toEqual([manual, corrected]);
  });
});
