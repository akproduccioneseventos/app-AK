/**
 * Orden 292 — Bloque 5: Volver a "Ninguna" saca la celiaquía.
 *
 * isCeliac debe calcularse únicamente a partir de la restricción nueva (=== 'Celiaco'),
 * sin '|| inv.isCeliac'. Si la respuesta no incluye restricción, se conservan ambos intactos.
 * Celíaco -> Ninguna deja isCeliac: false.
 * Celíaco -> (sin campo) deja los dos como estaban.
 * Y la hoja de cocina cuenta 0 celíacos cuando el invitado volvió a Ninguna.
 */

import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';

let fiestaMemoria: FiestaEnPlanificacion = {
  id: 'fiesta_celiaco_01',
  nombre: 'Boda Camila & Mateo',
  invitados: [
    {
      id: 'inv_01',
      nombre: 'Gastón Rodríguez',
      rsvp: 'Confirmado',
      dietaryRestriction: 'Celiaco',
      isCeliac: true,
      partySize: 1,
    } as Invitado,
  ],
} as any;

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (fiestaId: string, mutar: (f: FiestaEnPlanificacion) => FiestaEnPlanificacion | Promise<FiestaEnPlanificacion>) => {
    const actualizada = await mutar(JSON.parse(JSON.stringify(fiestaMemoria)));
    fiestaMemoria = JSON.parse(JSON.stringify(actualizada));
    return { success: true, updatedFiesta: actualizada };
  }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(fiestaMemoria))),
  saveFiesta: jest.fn(async (f: any) => { fiestaMemoria = JSON.parse(JSON.stringify(f)); return { success: true }; }),
  requireFiestaWriteAccess: jest.fn(async () => {}),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => {}),
  requirePermiso: jest.fn(async () => {}),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => {}),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => {}),
}));

import { updateInvitado, submitPublicRsvp } from '@/app/actions/fiesta/invitados.actions';
import { armarHojaDeCocina } from '@/lib/catering/hoja-de-cocina';

describe('Bloque 5 — Volver a "Ninguna" saca la celiaquía', () => {
  beforeEach(() => {
    fiestaMemoria = {
      id: 'fiesta_celiaco_01',
      nombre: 'Boda Camila & Mateo',
      invitados: [
        {
          id: 'inv_01',
          nombre: 'Gastón Rodríguez',
          rsvp: 'Confirmado',
          dietaryRestriction: 'Celiaco',
          isCeliac: true,
          partySize: 1,
          guestAccessToken: 'tok_cel_01',
        } as Invitado,
      ],
    } as any;
  });

  it('cambiar de Celíaco a Ninguna en updateInvitado deja isCeliac en false', async () => {
    const res = await updateInvitado('fiesta_celiaco_01', {
      id: 'inv_01',
      nombre: 'Gastón Rodríguez',
      rsvp: 'Confirmado',
      dietaryRestriction: 'Ninguna',
    } as Invitado);

    expect(res.success).toBe(true);
    expect(res.invitado?.dietaryRestriction).toBe('Ninguna');
    expect(res.invitado?.isCeliac).toBe(false);

    // En la base en memoria
    const invEnBase = fiestaMemoria.invitados?.find(i => i.id === 'inv_01');
    expect(invEnBase?.dietaryRestriction).toBe('Ninguna');
    expect(invEnBase?.isCeliac).toBe(false);

    // La hoja de cocina cuenta 0 celíacos
    const hoja = armarHojaDeCocina(fiestaMemoria, [], { adultos: 1, chicos: 0 });
    const celiaquia = hoja.especiales.find(p => p.restriccion.toLowerCase().includes('celiac'));
    expect(celiaquia).toBeUndefined();
  });

  it('cambiar de Celíaco a Ninguna en submitPublicRsvp con su credencial deja isCeliac en false', async () => {
    const res = await submitPublicRsvp('fiesta_celiaco_01', {
      guestId: 'inv_01',
      guestAccessToken: 'tok_cel_01',
      nombre: 'Gastón Rodríguez',
      asistencia: 'Confirmado',
      dietaryRestriction: 'Ninguna',
      cancionesDJ: [],
    });

    expect(res.success).toBe(true);
    expect(res.invitado?.dietaryRestriction).toBe('Ninguna');
    expect(res.invitado?.isCeliac).toBe(false);

    const invEnBase = fiestaMemoria.invitados?.find(i => i.id === 'inv_01');
    expect(invEnBase?.isCeliac).toBe(false);
  });

  it('una actualización sin campo de restricción conserva los valores anteriores intactos', async () => {
    // Si viene sin dietaryRestriction, mantiene isCeliac: true y dietaryRestriction: 'Celiaco'
    const res = await updateInvitado('fiesta_celiaco_01', {
      id: 'inv_01',
      nombre: 'Gastón Rodríguez',
      rsvp: 'Confirmado',
      companionNames: ['Acompañante 1'],
    } as Invitado);

    expect(res.success).toBe(true);
    expect(res.invitado?.dietaryRestriction).toBe('Celiaco');
    expect(res.invitado?.isCeliac).toBe(true);

    const invEnBase = fiestaMemoria.invitados?.find(i => i.id === 'inv_01');
    expect(invEnBase?.dietaryRestriction).toBe('Celiaco');
    expect(invEnBase?.isCeliac).toBe(true);
  });
});
