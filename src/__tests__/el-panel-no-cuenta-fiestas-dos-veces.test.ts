import { dedupeImportedEventCopies } from '@/lib/events/event-ordering';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function crearFiesta(id: string, nombreEvento: string, fechaEvento: string): FiestaEnPlanificacion {
  return {
    id,
    configuracion: {
      nombreEvento,
      tipoCelebracion: '15_anos',
      fechaEvento,
      horaInicio: '21:00',
      horaFin: '05:00',
      nombreLugar: 'Club Uruguay',
      invitadosEstimados: 120,
      presupuestoEstimado: 150000,
      notesAdicionales: '',
    },
    personalAsignado: [],
    invitados: [{ id: 'inv-1', nombre: 'Invitado 1', confirmado: true }],
  };
}

describe('El panel no cuenta fiestas dos veces (Orden 288, Bloque 6)', () => {
  it('con una fiesta_doc_X y una fiesta_verified_X del mismo nombre y fecha, el conteo del dashboard da 1', () => {
    const fiestaDoc = crearFiesta(
      'fiesta_doc_valentina_2028_11_15',
      'Mis 15 Valentina',
      '2028-11-15T21:00:00.000Z',
    );
    const fiestaVerified = crearFiesta(
      'fiesta_verified_valentina_2028_11_15',
      'Mis 15 Valentina',
      '2028-11-15T21:00:00.000Z',
    );

    const listaCruda = [fiestaDoc, fiestaVerified];
    expect(listaCruda.length).toBe(2);

    const listaDeduplicada = dedupeImportedEventCopies(listaCruda);

    // El conteo final para el dashboard debe ser 1
    expect(listaDeduplicada.length).toBe(1);
    // Debe conservar la copia verified y descartar la copia doc
    expect(listaDeduplicada[0].id).toBe('fiesta_verified_valentina_2028_11_15');
  });

  it('no afecta a eventos legítimos con distintos nombres o identificadores manuales', () => {
    const fiesta1 = crearFiesta(
      'fiesta_verified_lucia_2028_09_10',
      'Mis 15 Lucía',
      '2028-09-10T21:00:00.000Z',
    );
    const fiesta2 = crearFiesta(
      'fiesta_doc_camila_2028_10_12',
      'Boda Camila',
      '2028-10-12T21:00:00.000Z',
    );
    const fiestaManual = crearFiesta(
      'fiesta_manual_123',
      'Cumpleaños Andrés',
      '2028-12-01T21:00:00.000Z',
    );

    const lista = [fiesta1, fiesta2, fiestaManual];
    const resultado = dedupeImportedEventCopies(lista);

    expect(resultado.length).toBe(3);
  });
});
