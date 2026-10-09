/** @jest-environment node */
import { GET } from '@/app/api/cron/recordatorio-a-los-invitados/route';
import { createDataItem } from '@/lib/data-service';

jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({
  abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true, conClave: true })),
}));
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({ ok: false, error: 'No team session' })),
  requireAppSession: jest.fn(async () => ({ ok: false, error: 'No team session' })),
}));
jest.mock('@/lib/google-workspace', () => ({ sendGoogleGmailMessage: jest.fn(), ensureFreshGoogleAccount: jest.fn() }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => {
    const date = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return [{ id: 'audit81-guest-retry', configuracion: {
      fechaEvento: `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`,
      nombreEvento: 'Audit fixture',
    }, invitados: [{ id: 'guest81', nombre: 'Fake guest', rsvp: 'Confirmado', contacto: '099123456' }] }];
  }),
}));
jest.mock('@/lib/data-service', () => {
  const rows: any[] = [];
  return {
    readData: jest.fn(async (_file: string, fallback: any) => rows.length ? JSON.parse(JSON.stringify(rows)) : fallback),
    writeData: jest.fn(), mutateDataItem: jest.fn(),
    createDataItem: jest.fn(async (_file: string, _collection: string, _id: string, item: any) => {
      rows.push(JSON.parse(JSON.stringify(item)));
    }),
  };
});

test('two authorized cron runs on the same day queue one reminder per guest', async () => {
  const previous = process.env.AK_USE_LOCAL_JSON_ONLY;
  process.env.AK_USE_LOCAL_JSON_ONLY = 'false';
  try {
    const first = await GET(new Request('http://localhost/api/cron/recordatorio-a-los-invitados'));
    const second = await GET(new Request('http://localhost/api/cron/recordatorio-a-los-invitados'));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(createDataItem).toHaveBeenCalledTimes(1);
  } finally {
    if (previous === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = previous;
  }
});
