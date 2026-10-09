/** @jest-environment node */
/**
 * Codex, auditoría 81 (retest): dos corridas autorizadas del recordatorio al invitado el mismo
 * día creaban dos mensajes. Ahora cada recordatorio tiene un id estable (fiesta, invitado,
 * momento, día) y la base rechaza crearlo dos veces, también desde dos servidores a la vez.
 * Sonda original de Codex: docs/evidencias/81-invitados-reintento.test.ts. Dio rojo con el
 * código viejo (2 creaciones).
 */
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

test('dos servidores a la vez: la base rechaza el segundo y no se cuenta como preparado', async () => {
  const ds = jest.requireMock('@/lib/data-service');
  ds.readData.mockImplementation(async (_f: string, d: any) => d);
  ds.createDataItem.mockImplementationOnce(async () => {
    const e: any = new Error('6 ALREADY_EXISTS: Document already exists');
    e.code = 6;
    throw e;
  });
  const previous = process.env.AK_USE_LOCAL_JSON_ONLY;
  process.env.AK_USE_LOCAL_JSON_ONLY = 'false';
  try {
    const res = await GET(new Request('http://localhost/api/cron/recordatorio-a-los-invitados'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.mensajesPreparados).toBe(0);
  } finally {
    if (previous === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = previous;
  }
});
