const mockStore: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
}));
jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (fiestaId: string, updater: (f: any) => any) => {
    const copia = JSON.parse(JSON.stringify(mockStore[fiestaId]));
    const actualizada = updater(copia);
    mockStore[fiestaId] = JSON.parse(JSON.stringify(actualizada));
    return { success: true, updatedFiesta: actualizada };
  }),
}));

import { submitPublicRsvp } from '@/app/actions/fiesta/invitados.actions';

describe('Orden 360: confirmar sin enlace no borra al celíaco ni restricciones previas', () => {
  beforeEach(() => {
    mockStore['f_360'] = {
      id: 'f_360',
      invitacionConfig: { rsvpActivo: true },
      invitados: [
        {
          id: 'inv_cel',
          nombre: 'Lucía Fernández',
          categoria: 'Adulto',
          rsvp: 'Pendiente',
          partySize: 1,
          dietaryRestriction: 'Celiaco',
          isCeliac: true,
          guestAccessToken: 'tok_lucia',
        },
      ],
    };
  });

  it('sin enlace personal, confirmar con "Ninguna" conserva isCeliac: true y dietaryRestriction Celiaco', async () => {
    const res = await submitPublicRsvp('f_360', {
      nombre: 'Lucía Fernández',
      asistencia: 'Confirmado',
      partySize: 1,
      dietaryRestriction: 'Ninguna',
      cancionesDJ: [],
    });

    expect(res.success).toBe(true);
    expect(mockStore['f_360'].invitados[0].isCeliac).toBe(true);
    expect(mockStore['f_360'].invitados[0].dietaryRestriction).toBe('Celiaco');
  });

  it('sin enlace personal, mandar Vegetariano suma la segunda restricción sin borrar Celiaco', async () => {
    const res = await submitPublicRsvp('f_360', {
      nombre: 'Lucía Fernández',
      asistencia: 'Confirmado',
      partySize: 1,
      dietaryRestriction: 'Vegetariano',
      cancionesDJ: [],
    });

    expect(res.success).toBe(true);
    expect(mockStore['f_360'].invitados[0].isCeliac).toBe(true);
    expect(mockStore['f_360'].invitados[0].dietaryRestriction).toBe('Celiaco');
    expect(mockStore['f_360'].invitados[0].alergiasEspecificas).toContain('Vegetariano');
  });

  it('con su enlace personal, el propio invitado sí puede cambiar su restricción', async () => {
    const res = await submitPublicRsvp('f_360', {
      guestId: 'inv_cel',
      guestAccessToken: 'tok_lucia',
      nombre: 'Lucía Fernández',
      asistencia: 'Confirmado',
      partySize: 1,
      dietaryRestriction: 'Ninguna',
      cancionesDJ: [],
    });

    expect(res.success).toBe(true);
    expect(mockStore['f_360'].invitados[0].isCeliac).toBe(false);
    expect(mockStore['f_360'].invitados[0].dietaryRestriction).toBe('Ninguna');
  });
});
