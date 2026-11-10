/**
 * MATAFUEGO — Los saludos del buzón (videos y audios de los invitados) no se leen sin sesión.
 *
 * La entrega de la orden 270 le agregó a `getBuzonMessagesConDetalle` un parámetro "permitir sin sesión"
 * para contar los saludos en el portal. Es una acción del servidor que se llama desde el navegador: con
 * ese parámetro, cualquiera se bajaba los mensajes de cualquier fiesta. El portal ahora usa
 * `contarSaludosDelBuzonParaElPortal`, que pide la sesión del portal de ESA fiesta y devuelve sólo el número.
 * Se probó rompiéndola: devolviendo el parámetro, la primera prueba se pone en rojo.
 */

const requireAppSession = jest.fn();
const verifyPortalSession = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: (...a: any[]) => requireAppSession(...a),
}));
jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: (...a: any[]) => verifyPortalSession(...a),
}));
jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: () => ({
      where: () => ({ get: async () => ({ docs: [{ data: () => ({ id: 'm1', timestamp: '2026-11-10T22:00:00Z' }) }, { data: () => ({ id: 'm2', timestamp: '2026-11-10T22:01:00Z' }) }] }) }),
    }),
  },
}));

import { getBuzonMessagesConDetalle, contarSaludosDelBuzonParaElPortal } from '@/app/actions/buzon';

describe('El buzón no se abre sin sesión', () => {
  beforeEach(() => {
    requireAppSession.mockReset();
    verifyPortalSession.mockReset();
  });

  it('sin sesión del equipo, leer los mensajes falla aunque se le pase un segundo argumento', async () => {
    requireAppSession.mockRejectedValue(new Error('No autorizado'));
    await expect((getBuzonMessagesConDetalle as any)('fiesta_1', true)).rejects.toThrow('No autorizado');
  });

  it('el portal sólo recibe el número, y sólo con su sesión', async () => {
    verifyPortalSession.mockResolvedValue(false);
    expect(await contarSaludosDelBuzonParaElPortal('fiesta_1')).toBeNull();
    verifyPortalSession.mockResolvedValue(true);
    expect(await contarSaludosDelBuzonParaElPortal('fiesta_1')).toBe(2);
  });
});
