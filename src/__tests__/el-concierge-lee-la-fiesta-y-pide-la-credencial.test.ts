/**
 * El concierge del invitado lee la fiesta ENTERA (con la marca interna) para validar la
 * credencial del invitado, y sin credencial válida no contesta nada.
 *
 * Por qué: desde el 25 de septiembre de 2026 `getFiestaById` le recorta la credencial de los
 * invitados a quien no es del equipo. Si el concierge leyera sin la marca, nunca encontraría la
 * credencial y ningún invitado podría preguntar nada.
 * Se probó rompiéndolo: sacando `LECTURA_COMPLETA`, la primera se pone en rojo.
 */
const leer = jest.fn();
jest.mock('@/app/actions/fiesta-actual', () => ({ getFiestaById: (...a: any[]) => leer(...a) }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/concierge/concierge-engine', () => ({ answerConciergeQuestion: jest.fn(async () => ({ answer: 'A las 21 hs' })) }));
jest.mock('@/lib/guest-portal-public-data', () => ({
  buildPublicGuestPortalData: jest.fn((fiesta: any, guestId: string, token: string) => {
    const g = fiesta.invitados.find((i: any) => i.id === guestId);
    return g && g.guestAccessToken === token ? { fiesta } : null;
  }),
}));

import { askConcierge } from '@/app/actions/concierge.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';

const FIESTA = { id: 'f1', invitados: [{ id: 'g1', guestAccessToken: 'tok' }] };

beforeEach(() => {
  leer.mockReset();
  leer.mockImplementation(async (_id: string, lectura?: symbol) =>
    lectura === LECTURA_COMPLETA ? FIESTA : { ...FIESTA, invitados: [{ id: 'g1' }] });
});

describe('El concierge del invitado', () => {
  it('con la credencial correcta contesta, leyendo la fiesta entera', async () => {
    await expect(askConcierge('f1', 'g1', 'tok', '¿A qué hora es?')).resolves.toEqual({ answer: 'A las 21 hs' });
    expect(leer).toHaveBeenCalledWith('f1', LECTURA_COMPLETA);
  });

  it('con una credencial que no es la suya no contesta', async () => {
    await expect(askConcierge('f1', 'g1', 'otra', '¿A qué hora es?')).rejects.toThrow('Acceso no autorizado.');
  });
});
