/**
 * Codex, auditoría 92 (ACC92-REVOCACION): con el lector de la puerta abierto, se cambiaba la
 * credencial de un invitado y el QR VIEJO seguía entrando, porque el lector la comparaba con la
 * fiesta que tenía en memoria y el servidor no la miraba. Ahora la compara el servidor, adentro
 * del guardado, con la vigente. La entrada manual (sin QR) sigue igual.
 *
 * Probado rompiéndolo: sin la comparación en checkInGuest, el QR viejo entra y se pone en rojo.
 */
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';

// Base de datos simulada en memoria
let fiestaEnMemoria: FiestaEnPlanificacion;

function clonar<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

let sesionAutorizada = true;

// Desde la auditoría 69 "el equipo" es quien tiene algún permiso: la sesión lleva perfil.
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => (sesionAutorizada ? { success: true, user: { userId: 'u1', perfil: 'secretaria' } } : { success: false })),
}));
jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(async () => sesionAutorizada),
  requireAppSession: jest.fn(async () => {
    if (!sesionAutorizada) throw new Error('No autorizado.');
  }),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => false),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => {}),
}));

jest.mock('@/lib/firebase/server-messaging', () => ({
  sendPushNotificationToAll: jest.fn(async () => ({ success: true, sentCount: 1, failureCount: 0 })),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file.includes('fiesta-concurrencia')) {
      return clonar(fiestaEnMemoria);
    }
    return clonar(fallback);
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file.includes('fiesta-concurrencia')) {
      fiestaEnMemoria = clonar(data);
    }
    return true;
  }),
}));

const mutexTest = {
  queue: Promise.resolve(),
  run: async <T>(fn: () => Promise<T>): Promise<T> => {
    const prev = mutexTest.queue;
    let resolver: () => void;
    mutexTest.queue = new Promise<void>((r) => {
      resolver = r;
    });
    await prev;
    try {
      return await fn();
    } finally {
      resolver!();
    }
  },
};

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async <T>(path: string, vacio: T, cambiar: (actual: T) => Promise<T | null>) => {
    return await mutexTest.run(async () => {
      const actual = clonar(fiestaEnMemoria) as unknown as T;
      const nuevo = await cambiar(actual);
      if (nuevo) {
        fiestaEnMemoria = clonar(nuevo) as unknown as FiestaEnPlanificacion;
      }
      return nuevo;
    });
  }),
}));

import { checkInGuest } from '@/app/actions/fiesta/invitados.actions';

const invitado = (extra: Partial<Invitado> = {}) => ({
  id: 'g1', nombre: 'Ana', rsvp: 'Confirmado', guestAccessToken: 'nuevo', ...extra,
}) as unknown as Invitado;

beforeEach(() => {
  sesionAutorizada = true;
  fiestaEnMemoria = { id: 'fiesta-concurrencia', invitados: [invitado(), { ...invitado({ id: 'g2', guestAccessToken: 'otro' }) }] } as unknown as FiestaEnPlanificacion;
});

describe('la entrada por QR mira la credencial vigente', () => {
  it('el QR viejo (credencial cambiada) no entra y no marca la llegada', async () => {
    const r = await checkInGuest('fiesta-concurrencia', 'g1', { token: 'viejo' });
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/ya no es válido/);
    expect(fiestaEnMemoria.invitados?.find((i) => i.id === 'g1')?.checkedIn).toBeFalsy();
  });

  it('sin credencial, o con la de otro invitado, tampoco', async () => {
    expect((await checkInGuest('fiesta-concurrencia', 'g1', { token: null })).success).toBe(false);
    expect((await checkInGuest('fiesta-concurrencia', 'g1', { token: 'otro' })).success).toBe(false);
    expect(fiestaEnMemoria.invitados?.find((i) => i.id === 'g1')?.checkedIn).toBeFalsy();
  });

  it('con la credencial vigente entra, y la segunda lectura no cambia la hora', async () => {
    const a = await checkInGuest('fiesta-concurrencia', 'g1', { token: 'nuevo' });
    expect(a.success).toBe(true);
    const hora = fiestaEnMemoria.invitados?.find((i) => i.id === 'g1')?.checkInTimestamp;
    expect(hora).toBeTruthy();
    const b = await checkInGuest('fiesta-concurrencia', 'g1', { token: 'nuevo' });
    expect(b.success).toBe(true);
    expect(fiestaEnMemoria.invitados?.find((i) => i.id === 'g1')?.checkInTimestamp).toBe(hora);
  });

  it('la entrada manual de recepción (sin QR) sigue andando', async () => {
    expect((await checkInGuest('fiesta-concurrencia', 'g1')).success).toBe(true);
  });

  it('sin sesión del equipo no entra nadie', async () => {
    sesionAutorizada = false;
    expect((await checkInGuest('fiesta-concurrencia', 'g1', { token: 'nuevo' })).success).toBe(false);
  });
});

describe('los tres lectores de QR le pasan la credencial al servidor', () => {
  const fs = require('fs') as typeof import('fs');
  const leer = (p: string) => fs.readFileSync(require('path').join(process.cwd(), p), 'utf8');
  it('la puerta, el lector del equipo (/fiestas/nueva/invitados/checkin-scanner) y la página de llegada', () => {
    expect(leer('src/app/evento/accesos/[fiestaId]/page.tsx')).toMatch(/checkInGuest\(fiestaId, resolvedGuestId, \{ token \}\)/);
    expect(leer('src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx')).toMatch(/processCheckIn\(scannedGuestId, \{ token: scannedToken \}\)/);
    expect(leer('src/app/evento/actual/checkin/page.tsx')).toMatch(/checkInGuestFiestaActual\(fiestaId, guestId, \{ token \}\)/);
  });
});
