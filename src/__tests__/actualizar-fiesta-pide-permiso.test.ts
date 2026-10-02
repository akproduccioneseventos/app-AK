/**
 * @fileOverview Prueba de seguridad de permisos al actualizar fiesta (Orden 107, Punto 1).
 * Comprueba que:
 * 1. Sin sesión, checkInGuest y updateGuestExperience no escriben y devuelven error.
 * 2. Con publicRsvp: true (ej. submitPublicRsvp) sí se puede escribir sin sesión.
 * 3. Los secretos de la fiesta (claves del portal) se preservan después de guardar.
 */

import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import { checkInGuest, updateGuestExperience, submitPublicRsvp } from '@/app/actions/fiesta/invitados.actions';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';

let fiestaEnMemoria: FiestaEnPlanificacion;

function clonar<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

let sesionActiva = false;

jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(async () => sesionActiva),
  requireAppSession: jest.fn(async () => {
    if (!sesionActiva) throw new Error('No autorizado para modificar este evento.');
  }),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => undefined),
  })),
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
    if (file.includes('fiesta-permisos-test')) {
      return clonar(fiestaEnMemoria);
    }
    return clonar(fallback);
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file.includes('fiesta-permisos-test')) {
      fiestaEnMemoria = clonar(data);
    }
    return true;
  }),
}));

describe('actualizarFiesta y permisos de modificación', () => {
  const FIESTA_ID = 'fiesta-permisos-test';
  const CLAVE_PORTAL_SECRETA = 'clave-secreta-portal-12345';

  beforeEach(() => {
    sesionActiva = false;
    fiestaEnMemoria = {
      id: FIESTA_ID,
      nombre: 'Fiesta de 15 de Morena',
      estado: 'planificacion',
      fechaEvento: '2026-12-15',
      clientPortalSettings: {
        enabled: true,
        accessKey: CLAVE_PORTAL_SECRETA,
      },
      invitados: [
        {
          id: 'inv-1',
          nombre: 'Juan Perez',
          partySize: 1,
          rsvp: 'Confirmado',
          checkedIn: false,
        } as Invitado,
      ],
    } as unknown as FiestaEnPlanificacion;
  });

  it('sin sesión, checkInGuest falla y NO escribe', async () => {
    sesionActiva = false;
    const res = await checkInGuest(FIESTA_ID, 'inv-1');

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No autorizado/i);
    expect(fiestaEnMemoria.invitados![0].checkedIn).toBe(false);
  });

  it('sin sesión, updateGuestExperience falla y NO escribe', async () => {
    sesionActiva = false;
    const res = await updateGuestExperience(FIESTA_ID, 'inv-1', {
      mensaje: 'Mensaje no autorizado',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No autorizado/i);
    expect(fiestaEnMemoria.invitados![0].mensaje).toBeUndefined();
  });

  it('con publicRsvp: true, la confirmación pública sí escribe sin sesión', async () => {
    sesionActiva = false;
    const res = await submitPublicRsvp(FIESTA_ID, {
      nombre: 'Juan Perez',
      asistencia: 'Confirmado',
      dietaryRestriction: 'Ninguna',
      cancionesDJ: [],
      mensaje: '¡Ahí estaré!',
    });

    expect(res.success).toBe(true);
    expect(fiestaEnMemoria.invitados![0].mensaje).toBe('¡Ahí estaré!');
  });

  it('al guardar con actualizarFiesta, los secretos de la fiesta siguen existiendo', async () => {
    sesionActiva = true;
    const res = await actualizarFiesta(FIESTA_ID, (fiesta) => {
      // Intentamos o dejamos los datos como vengan
      const copia = { ...fiesta };
      delete (copia as any).clientPortalSettings; // simulamos que se omitieron secretos
      return copia;
    });

    expect(res.success).toBe(true);
    expect(fiestaEnMemoria.clientPortalSettings?.accessKey).toBe(CLAVE_PORTAL_SECRETA);
  });
});
