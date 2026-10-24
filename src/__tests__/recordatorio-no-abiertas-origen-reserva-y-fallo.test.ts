/**
 * @jest-environment node
 */
/**
 * MATAFUEGO — Codex 249 (orden 217), R1, 22/10/2026: sin CRON_SECRET, cualquiera de afuera disparaba
 * el recordatorio a los invitados que no abrieron la invitación, y ese recordatorio MANDA (WhatsApp y
 * Gmail). La puerta lo dejaba pasar porque figuraba entre "las que no hacen daño".
 *
 * R2, R3 y R4: fecha reprogramada, envío y respaldo fallidos reintentables vs inciertos, y reserva fallida
 * que no anota éxito.
 */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
const correr = jest.fn(async () => ({ corrio: true, enviados: 0, fallados: 0 }));
jest.mock('@/lib/invitaciones/recordatorio-no-abiertas', () => {
  const actual = jest.requireActual('@/lib/invitaciones/recordatorio-no-abiertas');
  return {
    ...actual,
    correrTareaRecordarInvitacionNoAbierta: correr,
  };
});
const marcarCorridaMock = jest.fn(async () => undefined);
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: marcarCorridaMock }));

let mockParty: any;
let beforeReserveFn: ((p: any) => void) | null = null;
let mockMails: any[] = [];
let rejectMailMode: '403' | 'no-response' | 'none' = 'none';
let fallbackFails = false;
let reserveFails = false;

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => {
    if (file === 'fiestas.json') return mockParty ? [JSON.parse(JSON.stringify(mockParty))] : [];
    if (file === 'ajustes-recordatorio-invitacion.json') return { activo: true };
    if (file === '_google-workspace-accounts.json') {
      return [{ id: 'company', kind: 'company', status: 'connected', accessToken: 'mock-token' }];
    }
    return def;
  }),
  writeData: jest.fn(async () => undefined),
}));

jest.mock('@/lib/google-workspace', () => ({
  sendGoogleGmailMessage: jest.fn(async (...args: any[]) => {
    mockMails.push(args);
    if (rejectMailMode === '403') {
      const err: any = new Error('QA249_GMAIL_HTTP403_REJECTED');
      err.status = 403;
      throw err;
    }
    if (rejectMailMode === '503-qa403') {
      const err: any = new Error('HTTP 503 upstream unavailable; trace qa403');
      err.status = 503;
      throw err;
    }
    if (rejectMailMode === '403-forbidden') {
      const err: any = new Error('forbidden');
      err.status = 403;
      throw err;
    }
    if (rejectMailMode === 'no-response') {
      throw new Error('ETIMEDOUT: connection timed out without response');
    }
    return { id: 'mock-email-id', enviado: true };
  }),
  ensureFreshGoogleAccount: jest.fn(async (acc) => acc),
  hasServiceAccountKey: jest.fn(() => false),
  getServiceAccountAccessToken: jest.fn(async () => null),
  GOOGLE_WORKSPACE_SCOPES: [],
}));

jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: jest.fn(async () => {
    if (fallbackFails) return { success: false, error: 'FALLBACK_FAILED' };
    return { success: true };
  }),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, fn: any) => {
    if (beforeReserveFn) {
      const mutate = beforeReserveFn;
      beforeReserveFn = null;
      mutate(mockParty);
    }
    if (reserveFails) return { success: false, error: 'RESERVE_FAILED' };
    mockParty = await fn(JSON.parse(JSON.stringify(mockParty)));
    return { success: true, updatedFiesta: JSON.parse(JSON.stringify(mockParty)) };
  }),
}));

import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';

const pedido = (clave?: string) =>
  new Request('https://ak.test/api/cron/recordar-invitacion-no-abierta', clave ? { headers: { Authorization: `Bearer ${clave}` } } : {});

describe('R1: el recordatorio que manda no se dispara desde afuera sin clave', () => {
  const antes = process.env.CRON_SECRET;
  afterEach(() => {
    if (antes === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = antes;
    correr.mockClear();
    marcarCorridaMock.mockClear();
  });

  it('sin clave configurada, la puerta lo frena (503)', async () => {
    delete process.env.CRON_SECRET;
    const r = await abrirPuertaDeLaTarea(pedido(), 'recordar-invitacion-no-abierta');
    expect(r.permitido).toBe(false);
    expect(r.estado).toBe(503);
  });

  it('las tareas que sólo preparan siguen corriendo sin clave', async () => {
    delete process.env.CRON_SECRET;
    expect((await abrirPuertaDeLaTarea(pedido(), 'recordatorio-a-los-invitados')).permitido).toBe(true);
    expect((await abrirPuertaDeLaTarea(pedido(), 'avisos-al-cliente')).permitido).toBe(true);
  });

  it('con clave configurada: sin ella 401, con ella pasa', async () => {
    process.env.CRON_SECRET = 'secreto';
    expect((await abrirPuertaDeLaTarea(pedido(), 'recordar-invitacion-no-abierta')).estado).toBe(401);
    expect((await abrirPuertaDeLaTarea(pedido('secreto'), 'recordar-invitacion-no-abierta')).permitido).toBe(true);
  });

  it('la ruta, sin clave configurada, no llega a correr el motor', async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import('@/app/api/cron/recordar-invitacion-no-abierta/route');
    const res = await GET(pedido() as any);
    expect(res.status).toBe(503);
    expect(correr).not.toHaveBeenCalled();
  });
});

describe('R2, R3, R4: motor y ruta con reprogramación, fallos y reserva', () => {
  const actualMotor = jest.requireActual('@/lib/invitaciones/recordatorio-no-abiertas');
  const now = new Date('2026-10-01T15:00:00Z');

  beforeEach(() => {
    mockParty = {
      id: 'party-1',
      configuracion: { nombreEvento: 'Fiesta Test', fechaEvento: '2026-10-11' },
      invitados: [
        {
          id: 'inv-1',
          nombre: 'Juan Perez',
          contacto: 'juan@test.invalid',
          guestAccessToken: 'token-juan',
          rsvp: 'Pendiente',
        },
      ],
    };
    mockMails = [];
    rejectMailMode = 'none';
    fallbackFails = false;
    reserveFails = false;
    beforeReserveFn = null;
    marcarCorridaMock.mockClear();
    process.env.CRON_SECRET = 'secreto';
  });

  it('R2: fecha cambiada a 2 meses entre la lista y la reserva -> 0 envíos', async () => {
    beforeReserveFn = (p) => {
      p.configuracion.fechaEvento = '2026-12-01';
    };
    const res = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(res.enviados).toBe(0);
    expect(mockMails.length).toBe(0);
  });

  it('R3: 403 del proveedor y respaldo fallido -> la segunda corrida del mismo día lo reintenta (2 intentos)', async () => {
    rejectMailMode = '403';
    fallbackFails = true;

    const res1 = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(res1.fallados).toBe(1);
    expect(mockMails.length).toBe(1);

    // Como la reserva del día se liberó por error definitivo, la 2da corrida vuelve a intentar
    const res2 = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(mockMails.length).toBe(2);
  });

  it('R3: sin respuesta del proveedor -> 1 intento y revisarEnvio', async () => {
    rejectMailMode = 'no-response';
    fallbackFails = true;

    const res1 = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(res1.fallados).toBe(1);
    expect(mockMails.length).toBe(1);
    expect(mockParty.invitados[0].revisarEnvio).toBe(true);

    // No se reintenta a ciegas en la 2da corrida
    const res2 = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(mockMails.length).toBe(1);
  });

  it('R4: reserva fallida en motor -> corrio: false y reservasFallidas > 0', async () => {
    reserveFails = true;
    const res = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(res.corrio).toBe(false);
    expect(res.reservasFallidas).toBeGreaterThan(0);
  });

  it('R4: reserva fallida en ruta -> marcarCorrida no se llama', async () => {
    correr.mockResolvedValueOnce({
      corrio: false,
      reservasFallidas: 1,
      totalFiestas: 1,
      totalInvitadosEvaluados: 1,
      enviados: 0,
      fallados: 0,
      omitidos: 0,
    });
    const { GET } = await import('@/app/api/cron/recordar-invitacion-no-abierta/route');
    const res = await GET(pedido('secreto') as any);
    expect(res.status).toBe(200);
    expect(marcarCorridaMock).not.toHaveBeenCalled();
  });

  it('Orden 225: 503 con "trace qa403" en mensaje no es tomado como rechazo -> 1 solo intento y revisarEnvio: true', async () => {
    rejectMailMode = '503-qa403';
    fallbackFails = true;

    const res1 = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(res1.fallados).toBe(1);
    expect(mockMails.length).toBe(1);
    expect(mockParty.invitados[0].revisarEnvio).toBe(true);

    // En la 2da corrida seguida, el remitente se llama una sola vez
    const res2 = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(mockMails.length).toBe(1);
  });

  it('Orden 225: 403 con mensaje "forbidden" es rechazo -> la reserva se libera sin revisarEnvio', async () => {
    rejectMailMode = '403-forbidden';
    fallbackFails = true;

    const res1 = await actualMotor.correrTareaRecordarInvitacionNoAbierta(now);
    expect(res1.fallados).toBe(1);
    expect(mockMails.length).toBe(1);
    expect(mockParty.invitados[0].revisarEnvio).toBeFalsy();
  });
});