/**
 * MATAFUEGO — La noche de la fiesta sigue siendo "hoy" (12 de octubre de 2026).
 *
 * El servidor corre en hora de Greenwich: desde las 21:00 de Uruguay "hoy" ya era mañana. Los
 * tótems y la 360 dejaban de encontrar la fiesta justo en pleno evento, y los avisos de "ya
 * pasó" salían con la fiesta de esta noche. Se probó rompiendo cada arreglo.
 */
import * as fs from 'fs';
import * as path from 'path';

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  __esModule: true,
  getFiestas: jest.fn(),
}));
jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
  requireAppSession: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
  createDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
}));

const FiestaModule = jest.requireMock('@/app/actions/fiesta/fiesta.actions');
const { readData } = jest.requireMock('@/lib/data-service');

describe('La noche de la fiesta sigue siendo hoy (12/10 22:30 en Uruguay)', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-13T01:30:00Z'));
  });
  afterAll(() => jest.useRealTimers());

  it('getFiestaActivaDeHoy encuentra la fiesta del 2026-10-12', async () => {
    FiestaModule.getFiestas.mockResolvedValue([
      { id: 'ayer', configuracion: { fechaEvento: '2026-10-11' } },
      { id: 'hoy', configuracion: { fechaEvento: '2026-10-12' } },
      { id: 'manana', configuracion: { fechaEvento: '2026-10-13' } },
    ]);
    const { getFiestaActivaDeHoy } = await import('@/app/actions/fiesta-actual');
    const r = await getFiestaActivaDeHoy();
    expect(r).toEqual({ success: true, fiestaId: 'hoy' });
  });

  it('yaPaso: el mismo día no cuenta como pasado, el anterior sí', async () => {
    const { yaPaso } = await import('@/lib/commercial-flow/puesta-al-dia');
    const ahora = new Date();
    expect(yaPaso('2026-10-12', ahora)).toBe(false);
    expect(yaPaso('2026-10-11', ahora)).toBe(true);
    expect(yaPaso('2026-10-13', ahora)).toBe(false);
  });

  it('diasHastaEnUruguay cuenta días de calendario de Uruguay', async () => {
    const { diasHastaEnUruguay } = await import('@/lib/utils');
    expect(diasHastaEnUruguay('2026-10-12')).toBe(0);
    expect(diasHastaEnUruguay('2026-10-13')).toBe(1);
    expect(diasHastaEnUruguay('2026-10-11')).toBe(-1);
    // una fecha con hora, escrita en Uruguay, del día de hoy
    expect(diasHastaEnUruguay(new Date('2026-10-12T20:00:00-03:00'))).toBe(0);
  });

  it('un mensaje programado para mañana no sale como "para hoy"', async () => {
    readData.mockResolvedValue([
      { id: 'a', status: 'pendiente', scheduledAt: '2026-10-13T15:00:00-03:00' },
      { id: 'b', status: 'pendiente', scheduledAt: '2026-10-12T21:00:00-03:00' },
      { id: 'c', status: 'reprogramado', scheduledAt: '2026-10-10T09:00:00-03:00' },
    ]);
    const { getPendingMessagesForToday } = await import('@/app/actions/scheduled-messages');
    const ids = (await getPendingMessagesForToday()).map((m: any) => m.id);
    expect(ids).toEqual(['b', 'c']);
  });
});

describe('Las pantallas con ?fiestaId= lo leen de la dirección', () => {
  const base = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva');
  const leen = ['servicios-contratados', 'centro-total', 'mission-control', 'centro'];
  it.each(leen)('%s mira fiestaId y pide esa fiesta', (d) => {
    const src = fs.readFileSync(path.join(base, d, 'page.tsx'), 'utf8');
    expect(src).toMatch(/fiestaId/);
    expect(src).toMatch(/getFiestaById\(/);
    expect(src).toMatch(/earchParams/);
  });
});

describe('Nadie vuelve a calcular "hoy" con la hora del servidor', () => {
  const leer = (r: string) => fs.readFileSync(path.join(process.cwd(), r), 'utf8');
  it('el tope diario de búsquedas del asistente usa el día de Uruguay', () => {
    expect(leer('src/app/actions/multiagent.ts')).not.toMatch(/const hoyStr = new Date\(\)\.toISOString/);
  });
  it.each(['control-tower', 'smart-automations', 'commercial-intelligence', 'post-event-intelligence'])(
    '%s cuenta los días con diasHastaEnUruguay',
    (f) => {
      const src = leer(`src/app/actions/${f}.ts`);
      expect(src).toMatch(/diasHastaEnUruguay\(/);
      expect(src).not.toMatch(/today\.setHours\(0, 0, 0, 0\)/);
    },
  );
});
