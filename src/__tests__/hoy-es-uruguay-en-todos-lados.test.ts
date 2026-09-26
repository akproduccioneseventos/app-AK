/**
 * MATAFUEGO — "Hoy" es el día de Uruguay en todos lados (orden 67 bloque 2, orden 88 bloque 1).
 *
 * A las 23:30 de Uruguay ya son las 02:30 del día siguiente en Greenwich.
 * Con `toISOString().split('T')[0]` el parte de la mañana y la revisión diaria de
 * presencia digital usaban la fecha de mañana antes de medianoche.
 * Con el código de antes, al fijar el reloj en 2026-09-26T02:30:00Z, este test se pone en rojo.
 */
import { hoyEnUruguay } from '@/lib/utils';
import { calcularParteDeLaManana } from '@/lib/automatico/parte-manana';
import { buildDigitalPresenceDailyReview } from '@/lib/presencia-digital/revision-diaria';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(false),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

describe('Hoy es el día de Uruguay en todos lados', () => {
  const horaNocheUruguay = new Date('2026-09-26T02:30:00Z'); // 23:30 del 25 en Uruguay

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(horaNocheUruguay);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('hoyEnUruguay da 2026-09-25 a las 23:30', () => {
    expect(hoyEnUruguay()).toBe('2026-09-25');
  });

  it('el parte de la mañana usa el día 25', async () => {
    const parte = await calcularParteDeLaManana();
    expect(parte.fecha).toBe('2026-09-25');
  });

  it('la revisión diaria de presencia digital usa el día 25', async () => {
    const review = await buildDigitalPresenceDailyReview({
      posts: [],
      connections: [],
    });
    expect(review.date).toBe('2026-09-25');
  });
});
