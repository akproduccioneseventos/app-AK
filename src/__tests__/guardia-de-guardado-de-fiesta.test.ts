/**
 * @fileOverview Guardia de Guardado de Fiesta:
 * Comprueba que nadie desde internet pueda marcar invitados como "llegó",
 * modificar datos o guardar en una fiesta sin la debida sesión y autorización.
 */

import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { checkInGuest, submitPublicRsvp } from '@/app/actions/fiesta/invitados.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

let sesionActiva = false;
let fiestaEnMemoria: FiestaEnPlanificacion;

jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(async () => sesionActiva),
  requireAppSession: jest.fn(async () => {
    if (!sesionActiva) throw new Error('No autorizado.');
  }),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => false),
}));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null, authAdmin: null }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => ({ success: true })) }));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn(async () => ({ success: true, sentCount: 1, failureCount: 0 })) }));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => {}),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (path: string, vacio: any, mutador: any) => {
    const res = await mutador(JSON.parse(JSON.stringify(fiestaEnMemoria)));
    if (res) fiestaEnMemoria = JSON.parse(JSON.stringify(res));
    return res;
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => JSON.parse(JSON.stringify(fiestaEnMemoria))),
  writeData: jest.fn(async (p, data) => {
    fiestaEnMemoria = JSON.parse(JSON.stringify(data));
    return true;
  }),
}));

describe('Guardia de guardado y permisos de fiesta', () => {
  const FIESTA_ID = 'fiesta-seguridad-123';

  beforeEach(() => {
    sesionActiva = false;
    fiestaEnMemoria = {
      id: FIESTA_ID,
      nombre: '15 de Valentina',
      configuracion: { nombreEvento: '15 de Valentina', fechaEvento: '2026-12-15' },
      invitados: [
        {
          id: 'inv-val-1',
          nombre: 'Carlos Gómez',
          checkedIn: false,
          rsvp: 'Pendiente',
        },
      ],
    } as any;
  });

  test('un usuario anónimo sin sesión es RECHAZADO al intentar hacer check-in', async () => {
    sesionActiva = false;
    const res = await checkInGuest(FIESTA_ID, 'inv-val-1');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No autorizado/i);
    expect(fiestaEnMemoria.invitados[0].checkedIn).toBe(false);
  });

  test('un usuario del equipo con sesión SÍ puede hacer check-in', async () => {
    sesionActiva = true;
    const res = await checkInGuest(FIESTA_ID, 'inv-val-1');
    expect(res.success).toBe(true);
    expect(res.invitado?.checkedIn).toBe(true);
    expect(fiestaEnMemoria.invitados[0].checkedIn).toBe(true);
  });

  test('actualizarFiesta sin publicRsvp RECHAZA cambios si no hay sesión', async () => {
    sesionActiva = false;
    const res = await actualizarFiesta(FIESTA_ID, (data) => ({
      ...data,
      nombre: 'Hackeado',
    }));
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No autorizado/i);
    expect(fiestaEnMemoria.nombre).toBe('15 de Valentina');
  });

  test('submitPublicRsvp SÍ permite confirmar asistencia desde la invitación pública con publicRsvp: true', async () => {
    sesionActiva = false;
    const res = await submitPublicRsvp(FIESTA_ID, {
      nombre: 'Carlos Gómez',
      asistencia: 'Confirmado',
      dietaryRestriction: 'Ninguna',
      cancionesDJ: [],
    });
    expect(res.success).toBe(true);
    expect(res.invitado?.rsvp).toBe('Confirmado');
    expect(fiestaEnMemoria.invitados[0].rsvp).toBe('Confirmado');
  });
});
