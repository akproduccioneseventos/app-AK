import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { dedupeImportedEventCopies, sortPastEvents, sortUpcomingEvents } from './event-ordering';

function event(id: string, fechaEvento?: string): FiestaEnPlanificacion {
  return {
    id,
    configuracion: {
      nombreEvento: id,
      tipoCelebracion: 'Otro',
      fechaEvento,
      horaInicio: '',
      horaFin: '',
      nombreLugar: '',
      invitadosEstimados: 0,
      presupuestoEstimado: 0,
      notesAdicionales: '',
    },
    personalAsignado: [],
  };
}

describe('event ordering', () => {
  it('prefiere la fiesta verificada y conserva eventos que no son duplicados importados', () => {
    const events = [
      { ...event('fiesta_doc_cliente_2028_03_04', '2028-03-04T12:00:00.000Z') },
      { ...event('fiesta_verified_cliente_2027_08_21', '2027-08-21T12:00:00.000Z') },
      { ...event('evento_manual', '2028-03-04T12:00:00.000Z') },
      { ...event('fiesta_doc_solo_2029_01_01', '2029-01-01T12:00:00.000Z') },
    ];

    expect(dedupeImportedEventCopies(events).map(item => item.id)).toEqual([
      'fiesta_verified_cliente_2027_08_21',
      'evento_manual',
      'fiesta_doc_solo_2029_01_01',
    ]);
  });

  it('ordena eventos activos por la fiesta mas proxima y deja los que no tienen fecha al final', () => {
    const sorted = sortUpcomingEvents([
      event('sin-fecha'),
      event('lejano', '2028-01-01T12:00:00.000Z'),
      event('proximo', '2027-01-01T12:00:00.000Z'),
    ]);

    expect(sorted.map(item => item.id)).toEqual(['proximo', 'lejano', 'sin-fecha']);
  });

  it('ordena el historial desde el evento mas reciente', () => {
    const sorted = sortPastEvents([
      event('antiguo', '2024-01-01T12:00:00.000Z'),
      event('reciente', '2025-01-01T12:00:00.000Z'),
    ]);

    expect(sorted.map(item => item.id)).toEqual(['reciente', 'antiguo']);
  });
});
