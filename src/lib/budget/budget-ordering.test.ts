import type { Presupuesto } from '@/types/presupuesto';
import { organizeBudgets, sortBudgets } from './budget-ordering';

function budget(id: string, overrides: Partial<Presupuesto>): Presupuesto {
  return {
    id,
    clienteNombre: id,
    eventoTipo: 'Otro',
    eventoFecha: '2027-01-01T12:00:00.000Z',
    invitadosCantidad: 1,
    salonFiestas: '',
    itemsPresupuestados: [],
    costoTotalEstimado: 0,
    timestamp: '2026-01-01T12:00:00.000Z',
    estado: 'Enviado',
    ...overrides,
  };
}

describe('budget ordering', () => {
  it('separa contratados, prospectos y archivados con el orden operativo', () => {
    const result = organizeBudgets([
      budget('prospecto-viejo', { timestamp: '2025-01-01T12:00:00.000Z' }),
      budget('contratado-lejano', { estado: 'Aceptado', eventoFecha: '2028-01-01T12:00:00.000Z' }),
      budget('prospecto-nuevo', { timestamp: '2026-02-01T12:00:00.000Z' }),
      budget('contratado-proximo', { estado: 'Facturado', eventoFecha: '2027-02-01T12:00:00.000Z' }),
      budget('archivado', { archived: true }),
    ]);

    expect(result.contracted.map(item => item.id)).toEqual(['contratado-proximo', 'contratado-lejano']);
    expect(result.prospects.map(item => item.id)).toEqual(['prospecto-nuevo', 'prospecto-viejo']);
    expect(result.archived.map(item => item.id)).toEqual(['archivado']);
  });

  it('permite ordenar alfabeticamente sin mutar el arreglo original', () => {
    const original = [
      budget('b', { clienteNombre: 'Zulema' }),
      budget('a', { clienteNombre: 'Ana' }),
    ];

    expect(sortBudgets(original, 'client').map(item => item.clienteNombre)).toEqual(['Ana', 'Zulema']);
    expect(original.map(item => item.clienteNombre)).toEqual(['Zulema', 'Ana']);
  });
});
