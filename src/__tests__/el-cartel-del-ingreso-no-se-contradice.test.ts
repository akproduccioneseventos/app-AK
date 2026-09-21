/**
 * MATAFUEGO — Cuando el acceso esta pausado, la pantalla de ingreso lo DICE, y no
 * manda a recuperar la contrasena.
 *
 * Aparecio el 21 de septiembre de 2026, con el dueño sin poder entrar a la app.
 *
 * Al quinto intento fallido el acceso queda pausado quince minutos. La linea roja lo
 * avisaba bien, pero el cartel de abajo —el que explica que pasa— contestaba
 * **"el correo o la clave no coinciden, toca Olvide mi contraseña"**. La misma pantalla
 * decia dos cosas distintas, y la que se lee mas manda por el camino equivocado: quien
 * esta pausado no tiene nada que recuperar, su clave esta bien.
 *
 * Lo que queda: existe el aviso `pausado`, dice cuantos minutos faltan, y ofrece el
 * unico camino que de verdad sirve en ese momento —entrar con Google, que no pasa por
 * la pausa y ademas la levanta—.
 *
 * Se probo rompiendolo a proposito: sacando el paso de la pausa del diagnostico, las
 * dos primeras comprobaciones se ponen en rojo.
 */

const docFalso = { get: jest.fn() };
const coleccionFalsa = {
  doc: jest.fn(() => docFalso),
  limit: jest.fn(() => ({ get: jest.fn(async () => ({ empty: false, docs: [{}] })) })),
};

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: { collection: jest.fn(() => coleccionFalsa) },
}));

jest.mock('@/lib/auth/session-token', () => ({
  hasPrivateSessionSecret: () => true,
}));

import { diagnosticarAcceso } from '@/lib/auth/diagnostico-acceso';

/** Deja el documento de acceso con —o sin— una pausa activa. */
function conPausaHasta(hasta: string | undefined) {
  docFalso.get.mockResolvedValue({
    exists: true,
    data: () => ({ passwordHash: 'x', loginLockedUntil: hasta }),
  });
}

describe('El cartel del ingreso no se contradice', () => {
  beforeEach(() => jest.clearAllMocks());

  it('con el acceso pausado avisa la pausa, no que la clave este mal', async () => {
    conPausaHasta(new Date(Date.now() + 12 * 60000).toISOString());
    const d = await diagnosticarAcceso();
    expect(d.codigo).toBe('pausado');
    expect(d.causa).toMatch(/minuto/i);
    expect(d.queHacer).not.toMatch(/olvid/i);
  });

  it('con el acceso pausado ofrece entrar con Google, que es lo unico que sirve ahi', async () => {
    conPausaHasta(new Date(Date.now() + 3 * 60000).toISOString());
    const d = await diagnosticarAcceso();
    expect(d.queHacer).toMatch(/Google/);
  });

  it('sin pausa sigue contestando lo de siempre', async () => {
    conPausaHasta(undefined);
    expect((await diagnosticarAcceso()).codigo).toBe('credenciales');
  });

  it('una pausa ya vencida no se cuenta como pausa', async () => {
    conPausaHasta(new Date(Date.now() - 60000).toISOString());
    expect((await diagnosticarAcceso()).codigo).toBe('credenciales');
  });
});
