/** @jest-environment node */
/**
 * Orden 148 (Video de Vida) y su barrido: una lectura que FALLA no puede volver como lista vacía.
 * Si vuelve [] la pantalla dice "todavía no hay fotos / canciones / chat", "portal no encontrado"
 * o "ninguna fecha ocupada" cuando en realidad se cortó la lectura (y hasta se podía vender una
 * fecha tomada). Las lecturas tienen que LANZAR; "no existe" sigue siendo vacío/null.
 *
 * Probado rompiendo: devolviendo `[]` / `null` de nuevo en cada catch, cada caso de abajo se pone en
 * rojo. La base simulada falla de verdad (lanza), no devuelve vacío.
 */
let leerFalla = true;
let fiestasCrudas: any[] = [];

jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: () => true,
  hayEmuladorDeBase: () => false,
  hayEmuladorDeArchivos: () => false,
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => {
    if (leerFalla) throw new Error('lectura caída');
    return [];
  }),
  writeData: jest.fn(),
}));
// Base "real" simulada: toda consulta se cae.
jest.mock('@/lib/firebase/server', () => {
  const consulta: any = {
    where: () => consulta,
    select: () => consulta,
    limit: () => consulta,
    get: async () => { throw new Error('base caída'); },
  };
  return { dbAdmin: { collection: () => consulta } };
});
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({ id: 'f1', socialGallerySettings: {}, invitados: [] })),
  getFiestas: jest.fn(async () => { throw new Error('lectura de fiestas caída'); }),
  saveFiesta: jest.fn(),
}));
jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(async () => true),
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true })),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => undefined),
}));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => {
    if (leerFalla) throw new Error('lectura de fiestas caída');
    return fiestasCrudas;
  }),
}));

import { getSocialPosts, getChatMessages } from '@/app/actions/social-gallery';
import { getDedications, getSongRequests } from '@/app/actions/social-interactive';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import { getOcupiedDates } from '@/app/actions/agenda';

const ANTES = process.env.AK_USE_LOCAL_JSON_ONLY;
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  leerFalla = true;
  fiestasCrudas = [];
  process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
});
afterAll(() => {
  if (ANTES === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
  else process.env.AK_USE_LOCAL_JSON_ONLY = ANTES;
});

describe('una lectura que falla lanza, no devuelve vacío', () => {
  it('(a) getSocialPosts lanza cuando falla la lectura de las fotos', async () => {
    await expect(getSocialPosts('f1')).rejects.toThrow('lectura caída');
  });

  it('(a) y sigue devolviendo [] cuando la lectura anda y simplemente no hay fotos', async () => {
    leerFalla = false;
    await expect(getSocialPosts('f1')).resolves.toEqual([]);
  });

  it('(b) getChatMessages, getSongRequests y getDedications lanzan cuando la base falla', async () => {
    await expect(getChatMessages('f1')).rejects.toThrow('base caída');
    await expect(getSongRequests('f1')).rejects.toThrow('base caída');
    await expect(getDedications('f1')).rejects.toThrow('base caída');
  });

  it('(c) getFiestaByAccessKey lanza si falló la lectura y devuelve null si no existe', async () => {
    await expect(getFiestaByAccessKey('clave-x')).rejects.toThrow('lectura de fiestas caída');
    leerFalla = false;
    await expect(getFiestaByAccessKey('clave-que-no-existe')).resolves.toBeNull();
  });

  it('(d) getOcupiedDates lanza cuando no se pueden leer las fiestas', async () => {
    await expect(getOcupiedDates()).rejects.toThrow('lectura de fiestas caída');
  });
});

describe('(e) las descargas responden error si la lectura falla', () => {
  const cargarRuta = (ruta: string, mocks: Record<string, any>) => {
    let modulo: any;
    jest.isolateModules(() => {
      for (const [nombre, fabrica] of Object.entries(mocks)) jest.doMock(nombre, () => fabrica);
      modulo = require(ruta);
    });
    return modulo;
  };
  const jsonDe = (r: Response) => r.json();

  it('download-recuerdos responde 502 con un mensaje en castellano, no un ZIP vacío', async () => {
    const ruta = cargarRuta('@/app/api/fiestas/[fiestaId]/download-recuerdos/route', {
      '@/app/actions/social-gallery': { getSocialPosts: jest.fn(async () => { throw new Error('lectura caída'); }) },
      '@/app/actions/social-interactive': { getDedications: jest.fn(async () => []) },
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res: Response = await ruta.GET(
      new Request('http://localhost/api/fiestas/f1/download-recuerdos'),
      { params: Promise.resolve({ fiestaId: 'f1' }) },
    );
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.headers.get('content-type')).not.toMatch(/zip/);
    expect((await jsonDe(res)).error).toMatch(/No pudimos leer las fotos/);
  });

  it('descarga del muro responde 502 (no 404 "no hay fotos") si falla la lectura', async () => {
    const ruta = cargarRuta('@/app/api/social-gallery/[fiestaId]/download/route', {
      '@/app/actions/social-gallery': { getPhotoFilePathsForZip: jest.fn(async () => { throw new Error('lectura caída'); }) },
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res: Response = await ruta.GET(
      new Request('http://localhost/api/social-gallery/f1/download'),
      { params: Promise.resolve({ fiestaId: 'f1' }) },
    );
    expect(res.status).toBe(502);
  });
});
