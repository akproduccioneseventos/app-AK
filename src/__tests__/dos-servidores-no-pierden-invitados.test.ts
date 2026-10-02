/**
 * @fileOverview Pruebas para la Orden 106 Bloque 4:
 * Confirmar asistencia y entrada al salón sin perder a nadie con dos servidores concurrentes.
 */

import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';

// Base de datos simulada en memoria
let fiestaEnMemoria: FiestaEnPlanificacion;

function clonar<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

let sesionAutorizada = true;

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

import { submitPublicRsvp, checkInGuest } from '@/app/actions/fiesta/invitados.actions';

describe('106 — Dos servidores no pierden invitados', () => {
  const FIESTA_ID = 'fiesta-concurrencia';

  beforeEach(() => {
    fiestaEnMemoria = {
      id: FIESTA_ID,
      nombre: '15 de Sofía',
      fechaEvento: '2026-11-20',
      clienteNombre: 'Familia Gómez',
      invitados: [
        {
          id: 'inv-1',
          nombre: 'Juan Pérez',
          partySize: 1,
          adultsCount: 1,
          kidsCount: 0,
          rsvp: 'Pendiente',
          checkedIn: false,
          categoria: 'amigos',
          dietaryRestriction: 'ninguna',
          cancionesDJ: [],
        },
        {
          id: 'inv-2',
          nombre: 'Ana López',
          partySize: 1,
          adultsCount: 1,
          kidsCount: 0,
          rsvp: 'Pendiente',
          checkedIn: false,
          categoria: 'familia',
          dietaryRestriction: 'ninguna',
          cancionesDJ: [],
        },
      ],
    } as any;
  });

  test('dos confirmaciones de invitados distintos al mismo tiempo dejan las dos', async () => {
    // Simular que dos servidores reciben confirmaciones concurrentes
    const p1 = submitPublicRsvp(FIESTA_ID, {
      nombre: 'Juan Pérez',
      asistencia: 'Confirmado',
      dietaryRestriction: 'ninguna',
      cancionesDJ: [],
    });

    const p2 = submitPublicRsvp(FIESTA_ID, {
      nombre: 'Ana López',
      asistencia: 'Confirmado',
      dietaryRestriction: 'ninguna',
      cancionesDJ: [],
    });

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    // Ambas deben estar confirmadas en la base
    const inv1 = fiestaEnMemoria.invitados.find((i) => i.id === 'inv-1');
    const inv2 = fiestaEnMemoria.invitados.find((i) => i.id === 'inv-2');

    expect(inv1?.rsvp).toBe('Confirmado');
    expect(inv2?.rsvp).toBe('Confirmado');
  });

  test('dos escaneos del mismo QR cuentan una sola llegada', async () => {
    const scan1 = checkInGuest(FIESTA_ID, 'inv-1');
    const scan2 = checkInGuest(FIESTA_ID, 'inv-1');

    const [r1, r2] = await Promise.all([scan1, scan2]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    const inv1 = fiestaEnMemoria.invitados.find((i) => i.id === 'inv-1');
    expect(inv1?.checkedIn).toBe(true);

    // Conteo total de checked-in en la fiesta debe ser exactamente 1
    const totalCheckedIn = fiestaEnMemoria.invitados.filter((i) => i.checkedIn).length;
    expect(totalCheckedIn).toBe(1);
  });

  test('confirmar y después anular deja "no viene" (Rechazado) y los confirmados bajan', async () => {
    // 1. Confirma
    const resConfirma = await submitPublicRsvp(FIESTA_ID, {
      nombre: 'Juan Pérez',
      asistencia: 'Confirmado',
      dietaryRestriction: 'ninguna',
      cancionesDJ: [],
    });
    expect(resConfirma.success).toBe(true);

    let inv1 = fiestaEnMemoria.invitados.find((i) => i.id === 'inv-1');
    expect(inv1?.rsvp).toBe('Confirmado');

    // 2. Anula
    const resAnula = await submitPublicRsvp(FIESTA_ID, {
      nombre: 'Juan Pérez',
      asistencia: 'Rechazado',
      dietaryRestriction: 'ninguna',
      cancionesDJ: [],
    });
    expect(resAnula.success).toBe(true);

    inv1 = fiestaEnMemoria.invitados.find((i) => i.id === 'inv-1');
    expect(inv1?.rsvp).toBe('Rechazado');

    // Conteo de confirmados
    const confirmados = fiestaEnMemoria.invitados.filter((i) => i.rsvp === 'Confirmado').length;
    expect(confirmados).toBe(0);
  });

  test('un usuario anónimo sin permisos no puede marcar check-in ni modificar datos', async () => {
    sesionAutorizada = false;
    const res = await checkInGuest(FIESTA_ID, 'inv-1');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No autorizado/i);

    // El invitado NO debe haber quedado marcado como ingresado
    const inv1 = fiestaEnMemoria.invitados.find((i) => i.id === 'inv-1');
    expect(inv1?.checkedIn).toBe(false);
  });

  test('actualizarFiesta sin publicRsvp exige permisos y frena a cualquiera de afuera', async () => {
    sesionAutorizada = false;
    const { actualizarFiesta } = await import('@/lib/fiesta/actualizar-fiesta');
    const res = await actualizarFiesta(FIESTA_ID, (f) => ({
      ...f,
      nombre: 'Nombre hackeado',
    }));
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No autorizado/i);

    // Los datos no se alteran
    expect(fiestaEnMemoria.nombre).toBe('15 de Sofía');
  });
});

