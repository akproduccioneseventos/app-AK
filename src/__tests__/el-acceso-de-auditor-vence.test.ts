/** @jest-environment node */

import {
  createSignedSessionToken,
  verifySession,
} from '@/lib/auth/session-token';
import {
  loginUser,
  abrirAccesoAuditor,
  cerrarAccesoAuditor,
  createUser,
  updateUserModules,
  chequearAvisoAuditor14Dias,
  obtenerEstadoAuditor,
  listUsers,
} from '@/app/actions/auth';

let currentCookieToken: string | undefined = undefined;

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name: string) => {
      if (name === 'ak_session' && currentCookieToken !== undefined) {
        return { name: 'ak_session', value: currentCookieToken };
      }
      return undefined;
    }),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

const mockUsers: Record<string, any> = {};

jest.mock('@/lib/firebase/server', () => {
  const { wrapFirestoreWithReadOnlyLock } = jest.requireActual('@/lib/firebase/server');
  const makeQuery = (docsList: Array<[string, any]>) => {
    const toDocs = () => docsList.map(([id, data]) => ({
      id,
      data: () => data,
      ref: { update: jest.fn(async (patch) => Object.assign(mockUsers[id] || {}, patch)) },
    }));
    return {
      limit: () => makeQuery(docsList),
      orderBy: () => makeQuery(docsList),
      get: jest.fn(async () => ({
        empty: docsList.length === 0,
        docs: toDocs(),
      })),
    };
  };

  const rawDb = {
    collection: (col: string) => {
      const allDocs = () => Object.entries(mockUsers);
      return {
        limit: () => makeQuery(allDocs()),
        orderBy: () => makeQuery(allDocs()),
        where: (field: string, op: string, val: any) => {
          const filtered = allDocs().filter(([_, u]) => (field === 'email' ? u.email === val : u.perfil === val));
          return makeQuery(filtered);
        },
        doc: (id: string) => ({
          get: jest.fn(async () => {
            const d = mockUsers[id];
            return { exists: Boolean(d), data: () => d };
          }),
          update: jest.fn(async (patch: any) => {
            if (mockUsers[id]) Object.assign(mockUsers[id], patch);
          }),
          delete: jest.fn(async () => {
            delete mockUsers[id];
          }),
          set: jest.fn(async (item: any) => {
            mockUsers[id] = item;
          }),
        }),
        add: jest.fn(async (item: any) => {
          const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          mockUsers[id] = item;
          return { id };
        }),
        get: jest.fn(async () => ({
          empty: allDocs().length === 0,
          docs: allDocs().map(([id, data]) => ({
            id,
            data: () => data,
            ref: { update: jest.fn(async (patch) => Object.assign(mockUsers[id] || {}, patch)) },
          })),
        })),
      };
    },
    runTransaction: jest.fn(async (fn: any) => fn({})),
    batch: jest.fn(() => ({ commit: jest.fn() })),
  };
  return {
    dbAdmin: wrapFirestoreWithReadOnlyLock(rawDb),
    wrapFirestoreWithReadOnlyLock,
  };
});

describe('Orden 276: Ciclo de vida y límites del acceso de auditor', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'secret-para-tests-ciclo-vida-auditor-32-chars';
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AK_SESSION_SECRET;
    } else {
      process.env.AK_SESSION_SECRET = originalSecret;
    }
    const fs = require('node:fs');
    const path = require('node:path');
    for (const dir of ['data', 'src/data']) {
      const p = path.join(process.cwd(), dir, 'auditores-historial.json');
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch {}
      }
    }
  });

  beforeEach(() => {
    currentCookieToken = undefined;
    for (const k of Object.keys(mockUsers)) delete mockUsers[k];
  });

  it('el dueño con una cuenta vieja (rol admin sin perfil guardado) también puede abrir el acceso', async () => {
    // 12/11/2026: la cuenta del dueño es de antes de los perfiles; con "perfil !== dueno" quedaba afuera.
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-dueno-viejo',
      email: 'dueno@akproducciones.com',
      role: 'admin',
    } as any);
    const res = await abrirAccesoAuditor({ email: 'auditor-viejo@externo.com' });
    expect(res.error).toBeUndefined();
    expect(res.success).toBe(true);
  });

  it('la cuenta del dueño que quedó convertida en auditor vuelve a ser del dueño sólo con la clave del dueño', async () => {
    mockUsers['auth'] = { password: 'clave-del-duenio' };
    mockUsers['usr-convertida'] = {
      email: 'duenio-diario@akproducciones.com',
      perfil: 'auditor',
      role: 'user',
      activo: true,
      cerradoEl: null,
      createdAt: '2026-03-01T10:00:00.000Z',
      abiertoEl: '2026-11-12T12:40:00.000Z',
      passwordHash: 'scrypt:00:00',
      versionDeSesion: 3,
    };
    // Con una clave que no es la del dueño (la del auditor) no se repara.
    await loginUser('duenio-diario@akproducciones.com', 'Auditor-AAAAAA-BBBBBB');
    expect(mockUsers['usr-convertida'].perfil).toBe('auditor');

    const res = await loginUser('duenio-diario@akproducciones.com', 'clave-del-duenio');
    expect(res.success).toBe(true);
    expect(mockUsers['usr-convertida'].perfil).toBe('dueno');
    expect(mockUsers['usr-convertida'].role).toBe('admin');
    expect(mockUsers['usr-convertida'].versionDeSesion).toBe(4);
  });

  it('un auditor de verdad (creado al abrir el acceso) no se convierte en dueño', async () => {
    mockUsers['auth'] = { password: 'clave-del-duenio' };
    mockUsers['usr-auditor-real'] = {
      email: 'auditor-real@externo.com',
      perfil: 'auditor',
      role: 'user',
      activo: true,
      cerradoEl: null,
      createdAt: '2026-11-12T12:40:00.000Z',
      abiertoEl: '2026-11-12T12:40:00.000Z',
      passwordHash: 'scrypt:00:00',
    };
    await loginUser('auditor-real@externo.com', 'clave-del-duenio');
    expect(mockUsers['usr-auditor-real'].perfil).toBe('auditor');
  });

  it('el auditor ve la lista de usuarios sin claves, y no puede crear uno', async () => {
    mockUsers['usr-x'] = { email: 'x@ak.com', perfil: 'secretaria', role: 'user', passwordHash: 'scrypt:secreto', createdAt: '2026-01-01' };
    currentCookieToken = await createSignedSessionToken({ userId: 'usr-aud', email: 'aud@ext.com', role: 'user', perfil: 'auditor' });
    mockUsers['usr-aud'] = { email: 'aud@ext.com', perfil: 'auditor', role: 'user', activo: true, cerradoEl: null };
    const lista = await listUsers();
    expect(lista.success).toBe(true);
    expect(JSON.stringify(lista.users)).not.toContain('scrypt:secreto');
    const crear = await createUser({ email: 'nuevo@ak.com', password: 'Clave-1234', perfil: 'secretaria' } as any);
    expect(crear.success).toBe(false);
  });

  it('el correo de alguien del equipo no se convierte en auditor', async () => {
    mockUsers['usr-equipo'] = {
      email: 'equipo@akproducciones.com',
      perfil: 'secretaria',
      role: 'user',
      passwordHash: 'clave-vieja',
      activo: true,
    };
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-dueno',
      email: 'dueno@akproducciones.com',
      role: 'admin',
      perfil: 'dueno',
    });
    const res = await abrirAccesoAuditor({ email: 'equipo@akproducciones.com' });
    expect(res.success).toBe(false);
    expect(res.password).toBeUndefined();
    expect(mockUsers['usr-equipo'].perfil).toBe('secretaria');
    expect(mockUsers['usr-equipo'].passwordHash).toBe('clave-vieja');
  });

  it('la tarjeta del auditor aparece para el dueño con cuenta vieja, y no para la secretaria', async () => {
    // 12/11/2026: el dueño no veía la tarjeta en Usuarios. Ahora el estado se pide con el mismo
    // control que abrir y cerrar, y ante una falla la tarjeta se muestra con el motivo.
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-dueno-viejo',
      email: 'dueno@akproducciones.com',
      role: 'admin',
    } as any);
    const delDueno = await obtenerEstadoAuditor();
    expect(delDueno.error).toBeUndefined();
    expect(delDueno.success).toBe(true);
    expect(delDueno.esDueno).toBe(true);

    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-secretaria',
      email: 'secretaria@akproducciones.com',
      role: 'user',
      perfil: 'secretaria',
    });
    const deLaSecretaria = await obtenerEstadoAuditor();
    expect(deLaSecretaria.success).toBe(false);
    expect(deLaSecretaria.esDueno).toBeFalsy();
  });

  it('con el acceso cerrado no entra, y una sesión ya abierta queda afuera en el próximo clic', async () => {
    // 1. Dueño abre acceso
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-dueno',
      email: 'dueno@akproducciones.com',
      role: 'admin',
      perfil: 'dueno',
    });

    const resAbrir = await abrirAccesoAuditor({ email: 'auditor@externo.com' });
    expect(resAbrir.success).toBe(true);
    expect(resAbrir.password).toBeDefined();

    // 2. Auditor tiene sesión activa
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-auditor-token',
      email: 'auditor@externo.com',
      role: 'user',
      perfil: 'auditor',
    });

    const sesionAntes = await verifySession();
    expect(sesionAntes.success).toBe(true);

    // 3. Dueño cierra el acceso
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-dueno',
      email: 'dueno@akproducciones.com',
      role: 'admin',
      perfil: 'dueno',
    });
    const resCerrar = await cerrarAccesoAuditor('auditor@externo.com');
    expect(resCerrar.success).toBe(true);

    // 4. Intentar login con acceso cerrado falla
    const resLogin = await loginUser('auditor@externo.com', resAbrir.password!);
    expect(resLogin.success).toBe(false);
    expect(resLogin.error).toMatch(/cerrado/i);

    // 5. La sesión que ya estaba abierta queda afuera en el próximo clic
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-auditor-token',
      email: 'auditor@externo.com',
      role: 'user',
      perfil: 'auditor',
    });
    const sesionDespues = await verifySession();
    expect(sesionDespues.success).toBe(false);
    expect(sesionDespues.error).toMatch(/cerrado/i);
  });

  it('abrirlo de nuevo da una clave nueva y la vieja no sirve', async () => {
    // 1. Dueño abre el acceso por primera vez
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-dueno',
      email: 'dueno@akproducciones.com',
      role: 'admin',
      perfil: 'dueno',
    });
    const primerAcceso = await abrirAccesoAuditor({ email: 'auditor@externo.com' });
    const primeraClave = primerAcceso.password!;

    // Dueño lo cierra
    await cerrarAccesoAuditor('auditor@externo.com');

    // Dueño lo abre de nuevo
    const segundoAcceso = await abrirAccesoAuditor({ email: 'auditor@externo.com' });
    const segundaClave = segundoAcceso.password!;

    expect(segundaClave).not.toEqual(primeraClave);

    // La clave vieja no sirve
    const loginViejo = await loginUser('auditor@externo.com', primeraClave);
    expect(loginViejo.success).toBe(false);

    // La nueva clave sí sirve
    const loginNuevo = await loginUser('auditor@externo.com', segundaClave);
    expect(loginNuevo.success).toBe(true);
  });

  it('el auditor no puede crear otro auditor, abrir ni cerrar accesos, ni cambiar perfiles', async () => {
    // Sesión activa de auditor
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-auditor-activo',
      email: 'auditor@externo.com',
      role: 'user',
      perfil: 'auditor',
    });

    // No puede abrir accesos
    const resAbrir = await abrirAccesoAuditor({ email: 'otro@externo.com' });
    expect(resAbrir.success).toBe(false);

    // No puede cerrar accesos
    const resCerrar = await cerrarAccesoAuditor('auditor@externo.com');
    expect(resCerrar.success).toBe(false);

    // No puede crear usuarios
    const resCrear = await createUser({
      email: 'infiltrado@test.com',
      password: 'Password1234!',
      role: 'admin',
      perfil: 'dueno',
      modules: ['all'],
    });
    expect(resCrear.success).toBe(false);

    // No puede cambiar perfiles
    mockUsers['user-colaborador'] = { email: 'colaborador@ak.com', role: 'user', perfil: 'operador' };
    const resModificar = await updateUserModules('user-colaborador', ['all'], 'admin', 'dueno');
    expect(resModificar.success).toBe(false);
  });

  it('a los 14 días abierto aparece el aviso al dueño, y el acceso sigue abierto', async () => {
    // Simulamos un auditor creado hace exactamente 14 días
    const hace14Dias = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    mockUsers['usr-auditor-14d'] = {
      email: 'auditor@externo.com',
      perfil: 'auditor',
      activo: true,
      abiertoEl: hace14Dias,
      cerradoEl: null,
    };

    const aviso = await chequearAvisoAuditor14Dias(new Date());
    expect(aviso.debeAvisar).toBe(true);
    expect(aviso.mensaje).toMatch(/El acceso de auditor sigue abierto desde el .+: ¿lo cierro\?/);
    expect(aviso.activo).toBe(true);

    // El acceso no se cierra solo: sigue activo en la base
    expect(mockUsers['usr-auditor-14d'].activo).toBe(true);
    expect(mockUsers['usr-auditor-14d'].cerradoEl).toBeNull();
  });
});
