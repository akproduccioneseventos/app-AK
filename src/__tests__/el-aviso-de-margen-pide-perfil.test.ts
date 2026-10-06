/** @jest-environment node */
/**
 * El aviso de margen (cuánto se pasó de lo estimado en fiestas parecidas) es plata del negocio:
 * contabilidad o CRM, no cualquier sesión (revisión de plata, 6/10/2026). Se probó rompiéndolo:
 * volviendo a `requireAppSession`, el personal recibe el aviso y la primera prueba da rojo.
 */
let perfil = 'personal';
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', perfil } })),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestas: jest.fn(async () => []) }));
jest.mock('@/lib/costos/aviso-margen-historico', () => ({
  calcularAvisoMargenHistorico: jest.fn(() => ({ mensaje: 'En fiestas parecidas se gastó 12% más' })),
}));

import { getAvisoMargenParaPresupuesto } from '@/app/actions/aviso-margen';

describe('El aviso de margen pide el perfil', () => {
  it('el personal y el operador no lo reciben', async () => {
    for (const p of ['personal', 'operador']) {
      perfil = p;
      await expect(getAvisoMargenParaPresupuesto({ tipoEvento: 'Quince' })).rejects.toThrow();
    }
  });

  it('la secretaria lo recibe con el cálculo del historial', async () => {
    perfil = 'secretaria';
    await expect(getAvisoMargenParaPresupuesto({ tipoEvento: 'Quince' })).resolves.toEqual({ mensaje: 'En fiestas parecidas se gastó 12% más' });
  });
});
