/**
 * Dos puertas que estaban abiertas y no se ven desde ninguna pantalla.
 *
 * 1. Anotar un aparato para recibir avisos no pedia sesion, y ademas dejaba
 *    elegir a nombre de QUIEN quedaba anotado. Hoy nada manda avisos desde esa
 *    lista, asi que no habia nada filtrandose; el dia que se enchufen, un
 *    extrano habria recibido los del equipo.
 * 2. Anotarse en el sorteo de redes no tenia ningun freno. El control de
 *    repetidos mira nombre + red, asi que con nombres inventados se cargaba la
 *    lista entera y el premio se lo llevaba cualquiera.
 */
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: { collection: jest.fn() },
}));

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: { firestore: { FieldValue: { serverTimestamp: () => 'ahora' } } },
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

import { saveFcmToken } from '@/app/actions/fcm-tokens';
import { enforceSocialInteractionRateLimit } from '@/lib/commercial/social-interaction-rate-limit';

const { verifySession } = require('@/lib/auth/session-token');
const { dbAdmin } = require('@/lib/firebase/server');
const { enforcePublicRateLimit } = require('@/lib/commercial/public-rate-limit');

describe('Anotar un aparato para recibir avisos', () => {
  let anotado: any;

  beforeEach(() => {
    jest.clearAllMocks();
    anotado = jest.fn(async () => undefined);
    dbAdmin.collection.mockReturnValue({ doc: () => ({ set: anotado }) });
  });

  it('sin sesión no se anota nada', async () => {
    verifySession.mockResolvedValue({ success: false });

    const res = await saveFcmToken('token-de-un-extrano', 'admin');

    expect(res.success).toBe(false);
    expect(anotado).not.toHaveBeenCalled();
  });

  it('con sesión se anota a nombre de quien entró, no del que manda el pedido', async () => {
    verifySession.mockResolvedValue({
      success: true,
      user: { userId: 'empleado_7', email: 'a@b.com', role: 'operador' },
    });

    const res = await saveFcmToken('token-propio', 'admin');

    expect(res.success).toBe(true);
    expect(anotado).toHaveBeenCalledTimes(1);
    // Aunque el pedido decia "admin", queda anotado el que realmente entro.
    expect(anotado.mock.calls[0][0].userId).toBe('empleado_7');
  });
});

describe('El freno del sorteo de redes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('el tope por fiesta no depende del nombre, así que cambiarlo no lo esquiva', async () => {
    await enforceSocialInteractionRateLimit({
      scope: 'social-follow-click',
      fiestaId: 'fiesta_1',
      participantIdentity: 'Nombre Inventado 42',
      participantLimit: 3,
      eventLimit: 300,
      windowMs: 1000,
    });

    const llamadas = enforcePublicRateLimit.mock.calls.map((c: any[]) => c[0]);
    expect(llamadas).toHaveLength(2);
    // El primero cuenta por fiesta y no lleva el nombre adentro: cambiar de
    // nombre no da usos nuevos.
    expect(llamadas[0].identity).toBe('fiesta_1');
    expect(llamadas[0].identity).not.toContain('Nombre Inventado');
    // El segundo es el tope mas bajo, por persona.
    expect(llamadas[1].identity).toContain('fiesta_1');
    expect(llamadas[1].limit).toBe(3);
  });
});
