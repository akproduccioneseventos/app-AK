/** @jest-environment node */

/**
 * Barrido de la pregunta 35 (21/10/2026). `activateUltimateEventSystem` marca como contratados todos
 * los módulos de una fiesta y pedía sólo sesión: cualquiera del equipo le regalaba al cliente lo que
 * no pagó. Ahora es del dueño (ADMINISTRACION).
 */
let permitido = false;
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ userId: 'u1' })),
  requirePermiso: jest.fn(async () => (permitido ? { ok: true, user: { userId: 'd1' } } : { ok: false, error: 'Sin permiso.' })),
}));

const saveFiesta = jest.fn(async (f: unknown) => ({ success: true, fiesta: f }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({ id: 'f1', configuracion: { nombreEvento: 'Quince de Ana', fechaEvento: '2027-08-08' }, modulosContratados: {} })),
  saveFiesta: (f: unknown) => saveFiesta(f),
}));

import { activateUltimateEventSystem } from '@/app/actions/experience-total';

describe('activar todo el sistema es del dueño', () => {
  beforeEach(() => saveFiesta.mockClear());

  it('sin permiso de administración no toca la fiesta', async () => {
    permitido = false;
    const r = await activateUltimateEventSystem('f1');
    expect(r.success).toBe(false);
    expect(saveFiesta).not.toHaveBeenCalled();
  });

  it('el dueño sí la activa, con el portal contratado', async () => {
    permitido = true;
    await activateUltimateEventSystem('f1').catch(() => undefined);
    expect(saveFiesta).toHaveBeenCalled();
    expect((saveFiesta.mock.calls[0][0] as { modulosContratados: Record<string, boolean> }).modulosContratados.portalCliente).toBe(true);
  });
});
