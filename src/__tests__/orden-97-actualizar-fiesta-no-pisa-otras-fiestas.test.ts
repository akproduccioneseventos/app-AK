/**
 * Orden 97 — Comprobación de que actualizar una fiesta individual NO pisa
 * los cambios concurrentes de otra fiesta (ej. cobros, cuotas o invitados).
 */

import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

let storage: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: unknown) => {
    const normal = archivo.replace(/\\/g, '/');
    if (normal in storage) {
      return copia(storage[normal]);
    }
    return copia(porDefecto);
  }),
  writeData: jest.fn(async (archivo: string, datos: unknown) => {
    const normal = archivo.replace(/\\/g, '/');
    storage[normal] = copia(datos);
  }),
}));

describe('Orden 97: actualizarFiesta no reescribe la lista entera ni pisa otra fiesta', () => {
  beforeEach(() => {
    storage = {};
    jest.clearAllMocks();
  });

  it('mientras se actualiza la fiesta A, otra operación agrega un cobro a la fiesta B y se conserva', async () => {
    const fiestaA: FiestaEnPlanificacion = {
      id: 'fiesta-A',
      configuracion: {
        nombreEvento: 'Boda Ana y Carlos',
        fechaEvento: '2026-12-01',
        tipoCelebracion: 'Boda',
        horaInicio: '21:00',
        horaFin: '05:00',
        nombreLugar: 'Salón A',
        invitadosEstimados: 100,
        presupuestoEstimado: 200000,
        notesAdicionales: '',
      },
      invitados: [
        { id: 'inv-1', nombre: 'Juan', rsvp: 'Pendiente' },
      ],
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    const fiestaB: FiestaEnPlanificacion = {
      id: 'fiesta-B',
      configuracion: {
        nombreEvento: '15 de Belén',
        fechaEvento: '2026-12-15',
        tipoCelebracion: '15 Años',
        horaInicio: '21:00',
        horaFin: '05:00',
        nombreLugar: 'Salón B',
        invitadosEstimados: 80,
        presupuestoEstimado: 150000,
        notesAdicionales: '',
      },
      pagos: [],
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    storage['fiestas/fiesta-A.json'] = fiestaA;
    storage['fiestas/fiesta-B.json'] = fiestaB;
    storage['fiestas.json'] = [fiestaA, fiestaB];

    // Operación 1: tarea sobre Fiesta A que agrega un recordatorio/aviso
    const pA = actualizarFiesta('fiesta-A', async (fA) => {
      // Simula pequeña demora de red
      await new Promise((r) => setTimeout(r, 25));
      return {
        ...fA,
        invitados: (fA.invitados || []).map((i) => ({
          ...i,
          recordatoriosApertura: ['2026-10-01'],
        })),
      };
    }, { publicRsvp: true });

    // Operación 2: en el medio, alguien registra un cobro de $25.000 en la Fiesta B
    const pB = (async () => {
      await new Promise((r) => setTimeout(r, 5));
      return actualizarFiesta('fiesta-B', async (fB) => {
        return {
          ...fB,
          pagos: [
            ...(fB.pagos || []),
            {
              id: 'pago-b-1',
              monto: 25000,
              fecha: '2026-10-01T12:00:00Z',
              concepto: 'Seña inicial',
            } as any,
          ],
        };
      }, { publicRsvp: true });
    })();

    const [resA, resB] = await Promise.all([pA, pB]);

    expect(resA.success).toBe(true);
    expect(resB.success).toBe(true);

    // Verificamos que la fiesta B conserva su cobro
    const fiestaBGuardada = storage['fiestas/fiesta-B.json'] as FiestaEnPlanificacion;
    expect(fiestaBGuardada.pagos).toHaveLength(1);
    expect(fiestaBGuardada.pagos?.[0].monto).toBe(25000);

    // Verificamos que la fiesta A conserva su actualización
    const fiestaAGuardada = storage['fiestas/fiesta-A.json'] as FiestaEnPlanificacion;
    expect(fiestaAGuardada.invitados?.[0].recordatoriosApertura).toEqual(['2026-10-01']);
  });
});
