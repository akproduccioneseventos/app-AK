/**
 * MATAFUEGO — Cuando el ingreso con Google falla, la pantalla DICE QUE PASO.
 *
 * El 21 de setiembre de 2026 el dueno toco "Ingresar con Google" y la pantalla contesto
 * *"No se pudo completar el ingreso con Google"*, que era lo que se decia para **cualquier
 * falla que no estuviera en la lista**. Esa frase no distingue entre el navegador
 * bloqueando el guardado que Google necesita, la cuenta deshabilitada, o Google sin
 * contestar: son tres problemas distintos con tres salidas distintas, y ademas averiguar
 * cual era costaba un viaje entero de ida y vuelta.
 *
 * Lo que queda: las fallas que de verdad pasan tienen su frase, y **lo que no esta en la
 * lista se muestra con su codigo**, para resolverlo en un mensaje y no en una sesion.
 *
 * Se probo rompiendolo a proposito: volviendo la respuesta por defecto a la frase pelada,
 * las dos ultimas comprobaciones se ponen en rojo.
 */
// La biblioteca de Google trae su version de servidor al cargarse fuera del navegador y
// revienta. Aca se mira solo la traduccion del error, que no la necesita.
jest.mock('firebase/auth', () => ({
  browserSessionPersistence: {},
  getAuth: jest.fn(),
  getRedirectResult: jest.fn(),
  GoogleAuthProvider: class { addScope() {} setCustomParameters() {} },
  setPersistence: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('@/lib/firebase/config', () => ({ app: {} }));

import { getGoogleAuthErrorMessage } from '@/lib/firebase/google-auth-client';

const conCodigo = (code: string) => getGoogleAuthErrorMessage({ code });

describe('El ingreso con Google dice que paso', () => {
  it('el navegador que bloquea el guardado ofrece la salida que si funciona', () => {
    const msg = conCodigo('auth/web-storage-unsupported');
    expect(msg).toMatch(/navegador/i);
    expect(msg).toMatch(/contrasena/i);
  });

  it('cada falla conocida tiene su propia frase, no la generica', () => {
    const codigos = [
      'auth/web-storage-unsupported',
      'auth/account-exists-with-different-credential',
      'auth/user-disabled',
      'auth/timeout',
      'auth/too-many-requests',
      'auth/internal-error',
      'auth/invalid-api-key',
      'auth/unauthorized-domain',
      'auth/operation-not-allowed',
      'auth/network-request-failed',
    ];
    for (const code of codigos) {
      expect(conCodigo(code)).not.toMatch(/No se pudo completar el ingreso con Google/);
    }
    // Y ninguna se repite: si dos dijeran lo mismo, no servirian para distinguir.
    expect(new Set(codigos.map(conCodigo)).size).toBe(codigos.length);
  });

  it('una falla desconocida se muestra CON su codigo', () => {
    const msg = conCodigo('auth/algo-que-nadie-vio');
    expect(msg).toContain('auth/algo-que-nadie-vio');
  });

  it('sin codigo no se inventa ninguno', () => {
    const msg = getGoogleAuthErrorMessage(new Error('vaya a saber'));
    expect(msg).toMatch(/No se pudo completar el ingreso con Google/);
    expect(msg).not.toContain('(');
  });
});
