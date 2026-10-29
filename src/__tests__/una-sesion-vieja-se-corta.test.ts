/** @jest-environment node */

import crypto from 'crypto';
import { createSignedSessionToken, verifySignedSessionToken } from '@/lib/auth/session-token';
import { requireSession, requirePermiso, clearSessionCache } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';

let cookieToken: string | undefined = undefined;

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name: string) => {
      if (name === 'ak_session' && cookieToken !== undefined) {
        return { name: 'ak_session', value: cookieToken };
      }
      return undefined;
    }),
  })),
}));

const mockUsersDb: Record<string, any> = {};
let dbFails = false;

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: (col: string) => {
      if (col === 'users') {
        return {
          doc: (id: string) => ({
            get: jest.fn(async () => {
              if (dbFails) {
                throw new Error('Firestore UNAVAILABLE: connection timed out');
              }
              if (!mockUsersDb[id]) {
                return { exists: false, data: () => undefined };
              }
              return { exists: true, data: () => mockUsersDb[id] };
            }),
          }),
        };
      }
      return {
        doc: () => ({ get: jest.fn(async () => ({ exists: false })) }),
        add: jest.fn(async () => ({ id: 'new-id' })),
      };
    },
  },
}));

describe('Bloque 3: Sesiones y versionDeSesion', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'secret-para-tests-sesiones-version-32-chars-long';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AK_SESSION_SECRET;
    } else {
      process.env.AK_SESSION_SECRET = originalSecret;
    }
  });

  beforeEach(() => {
    cookieToken = undefined;
    dbFails = false;
    clearSessionCache();
    for (const key of Object.keys(mockUsersDb)) {
      delete mockUsersDb[key];
    }
  });

  it('1. borrar un usuario y usar su cookie se rechaza', async () => {
    mockUsersDb['user-borrado'] = {
      email: 'borrado@akproducciones.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    };

    cookieToken = await createSignedSessionToken({
      userId: 'user-borrado',
      email: 'borrado@akproducciones.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    });

    // Con el usuario en base entra bien
    const resInicial = await requireSession();
    expect(resInicial.ok).toBe(true);

    // Borramos el usuario de la base de datos
    delete mockUsersDb['user-borrado'];
    clearSessionCache(); // Pasada la memoria o invalidado

    // Ahora la misma cookie se rechaza
    const resFinal = await requireSession();
    expect(resFinal.ok).toBe(false);
    if (!resFinal.ok) {
      expect(resFinal.error).toBe('Tu sesión se cerró. Volvé a entrar.');
    }
  });

  it('2. bajar a personal a una secretaria le saca CONTABILIDAD en el pedido siguiente pasada la memoria de 60s', async () => {
    let fakeNow = 1000000;
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => fakeNow);

    try {
      mockUsersDb['sec-1'] = {
        email: 'secretaria@akproducciones.uy',
        role: 'user',
        perfil: 'secretaria',
        versionDeSesion: 1,
      };

      cookieToken = await createSignedSessionToken({
        userId: 'sec-1',
        email: 'secretaria@akproducciones.uy',
        role: 'user',
        perfil: 'secretaria',
        versionDeSesion: 1,
      });

      // Primer pedido: la secretaria tiene CONTABILIDAD
      const inicial = await requirePermiso(PERMISOS.CONTABILIDAD);
      expect(inicial.ok).toBe(true);

      // En la base se baja a personal y se sube versionDeSesion
      mockUsersDb['sec-1'] = {
        email: 'secretaria@akproducciones.uy',
        role: 'user',
        perfil: 'personal',
        versionDeSesion: 2,
      };

      // Durante los primeros 60 segundos se lee de memoria
      fakeNow += 30000; // 30s después
      const duranteMemoria = await requirePermiso(PERMISOS.CONTABILIDAD);
      expect(duranteMemoria.ok).toBe(true);

      // Pasada la memoria de 60s
      fakeNow += 35000; // 65s después del primer pedido
      const posterior = await requirePermiso(PERMISOS.CONTABILIDAD);
      expect(posterior.ok).toBe(false);
    } finally {
      dateSpy.mockRestore();
    }
  });

  it('3. con la base caída la sesión sigue', async () => {
    mockUsersDb['user-caida'] = {
      email: 'dueno@akproducciones.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    };

    cookieToken = await createSignedSessionToken({
      userId: 'user-caida',
      email: 'dueno@akproducciones.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    });

    // Se cae la base de datos
    dbFails = true;
    clearSessionCache();

    // La sesión sigue funcionando usando el respaldo de la cookie firmada
    const res = await requireSession();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user.email).toBe('dueno@akproducciones.uy');
      expect(res.user.perfil).toBe('dueno');
    }

    const permisoRes = await requirePermiso(PERMISOS.ADMINISTRACION);
    expect(permisoRes.ok).toBe(true);
  });

  it('4. un token de 4 partes ya no entra', async () => {
    const version = 'v1';
    const expiresAt = Date.now() + 600000;
    const nonce = crypto.randomUUID();
    const payload = `${version}.${expiresAt}.${nonce}`;
    const hmac = crypto.createHmac('sha256', process.env.AK_SESSION_SECRET!).update(payload).digest('hex');
    const legacyToken = `${payload}.${hmac}`;

    // verifySignedSessionToken rechaza tokens de 4 partes
    const verificacion = await verifySignedSessionToken(legacyToken);
    expect(verificacion.isValid).toBe(false);

    // Y tampoco pasa la guardia de sesión
    cookieToken = legacyToken;
    const res = await requireSession();
    expect(res.ok).toBe(false);
  });
});
