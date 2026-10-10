/**
 * MATAFUEGO — Video de Vida: el cierre de la carga y el reemplazo de un recuadro (orden 137).
 *
 * Qué se rompía:
 * - VID87-CIERRE: la pantalla pública se abría con la carga habilitada; el equipo la apagaba, y
 *   esa pantalla seguía guardando fotos en Storage porque el servidor no volvía a mirar.
 * - VID87-REEMPLAZO: reemplazar el recuadro 01 (PNG) con un JPG dejaba 01.png y 01.jpg; la lista
 *   y el ZIP consumían las dos.
 *
 * El Storage de mentira es un mapa en memoria con fecha de creación por objeto (devuelve copias).
 * Probado rompiéndolo: sin la lectura de `galleryEnabled` en `saveLifeStoryVideoPhoto` los casos
 * "apagada" y "fiesta inexistente" se ponen en rojo; sin `quitarFotosAnterioresDelRecuadro`
 * quedan dos archivos y "PNG -> JPG" se pone en rojo; si borra sin mirar la fecha, el caso de
 * "dos reemplazos a la vez" deja cero.
 */
process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

const objetos = new Map<string, { contentType: string; creado: number }>();
let reloj = 1000;
let fiesta: any = null;
let sesion = false;
const uploadMock = jest.fn(async (_buf: Buffer, ruta: string, tipo: string) => {
  objetos.set(ruta, { contentType: tipo, creado: (reloj += 10) });
  return `https://storage.test/${ruta}`;
});

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: (...a: any[]) => (uploadMock as any)(...a),
  deleteFromStorage: jest.fn(),
}));
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: jest.fn(async () => fiesta),
  getFiestaActual: jest.fn(),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  saveFiesta: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => {
    if (!sesion) throw new Error('sin sesion');
    return { user: { id: 'u1' } };
  }),
}));
jest.mock('firebase-admin', () => {
  const archivo = (name: string) => ({
    name,
    getMetadata: async () => [{ timeCreated: new Date(objetos.get(name)!.creado).toISOString() }],
    delete: async () => { objetos.delete(name); },
  });
  const bucket = {
    getFiles: async ({ prefix }: { prefix: string }) => [
      [...objetos.keys()].filter((k) => k.startsWith(prefix)).map(archivo),
    ],
  };
  return { __esModule: true, default: { apps: [{ name: '[DEFAULT]' }], storage: () => ({ bucket: () => bucket }) } };
});

import { saveLifeStoryVideoPhoto } from '@/app/actions/fiesta/video-vida.actions';

function subida(fiestaId: string, numero: number, nombre: string, tipo: string): FormData {
  // jsdom no trae File.arrayBuffer: alcanza un objeto con lo que el servidor lee.
  const campos: Record<string, unknown> = {
    file: { name: nombre, type: tipo, arrayBuffer: async () => new ArrayBuffer(1) },
    fiestaId,
    photoNumber: String(numero),
  };
  return { get: (k: string) => campos[k] ?? null } as unknown as FormData;
}
const nombresDe = (id: string) => [...objetos.keys()].filter((k) => k.includes(`/${id}/`)).sort();

describe('Video de Vida: cierre de la carga y un solo archivo por recuadro', () => {
  beforeEach(() => {
    objetos.clear();
    uploadMock.mockClear();
    sesion = false;
    fiesta = { id: 'f1', videoVida: { galleryEnabled: true, photosUploaded: true, photoCount: 50 } };
  });

  it('habilitada: el cliente sin sesión sube', async () => {
    const r = await saveLifeStoryVideoPhoto(subida('f1', 1, 'a.png', 'image/png'));
    expect(r.success).toBe(true);
    expect(nombresDe('f1')).toEqual(['video-vida-photos/f1/01.png']);
  });

  it('apagada después de abrir la pantalla: el servidor rechaza y no escribe en Storage', async () => {
    fiesta.videoVida.galleryEnabled = false;
    const r = await saveLifeStoryVideoPhoto(subida('f1', 1, 'a.png', 'image/png'));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/habilitada/);
    expect(uploadMock).not.toHaveBeenCalled();
    expect(objetos.size).toBe(0);
  });

  it('fiesta inexistente: rechaza sin escribir', async () => {
    fiesta = null;
    const r = await saveLifeStoryVideoPhoto(subida('nada', 1, 'a.png', 'image/png'));
    expect(r.success).toBe(false);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('número mayor al permitido por ESA fiesta: rechaza sin escribir', async () => {
    fiesta.videoVida.photoCount = 10;
    const r = await saveLifeStoryVideoPhoto(subida('f1', 11, 'a.png', 'image/png'));
    expect(r.success).toBe(false);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('el equipo con sesión sigue pudiendo cargar aunque esté apagada para el cliente', async () => {
    fiesta.videoVida.galleryEnabled = false;
    sesion = true;
    const r = await saveLifeStoryVideoPhoto(subida('f1', 2, 'a.jpg', 'image/jpeg'));
    expect(r.success).toBe(true);
  });

  it('PNG -> JPG en el mismo recuadro deja un solo archivo, y otro recuadro queda intacto', async () => {
    await saveLifeStoryVideoPhoto(subida('f1', 2, 'otra.png', 'image/png'));
    await saveLifeStoryVideoPhoto(subida('f1', 1, 'a.png', 'image/png'));
    const r = await saveLifeStoryVideoPhoto(subida('f1', 1, 'b.jpg', 'image/jpeg'));
    expect(r.success).toBe(true);
    expect(nombresDe('f1')).toEqual(['video-vida-photos/f1/01.jpg', 'video-vida-photos/f1/02.png']);
    expect(objetos.get('video-vida-photos/f1/01.jpg')?.contentType).toBe('image/jpeg');
  });

  it('JPG -> PNG también deja uno solo', async () => {
    await saveLifeStoryVideoPhoto(subida('f1', 1, 'a.jpg', 'image/jpeg'));
    await saveLifeStoryVideoPhoto(subida('f1', 1, 'b.png', 'image/png'));
    expect(nombresDe('f1')).toEqual(['video-vida-photos/f1/01.png']);
  });

  it('si la subida nueva falla, la foto vigente se conserva', async () => {
    await saveLifeStoryVideoPhoto(subida('f1', 1, 'a.png', 'image/png'));
    uploadMock.mockRejectedValueOnce(new Error('corte'));
    const r = await saveLifeStoryVideoPhoto(subida('f1', 1, 'b.jpg', 'image/jpeg'));
    expect(r.success).toBe(false);
    expect(nombresDe('f1')).toEqual(['video-vida-photos/f1/01.png']);
  });

  it('dos reemplazos a la vez: sobrevive la más nueva, nunca quedan cero', async () => {
    await Promise.all([
      saveLifeStoryVideoPhoto(subida('f1', 1, 'a.png', 'image/png')),
      saveLifeStoryVideoPhoto(subida('f1', 1, 'b.jpg', 'image/jpeg')),
    ]);
    const quedan = nombresDe('f1');
    expect(quedan.length).toBeGreaterThanOrEqual(1);
    expect(quedan.length).toBeLessThanOrEqual(2);
    // una repetición ordenada converge a uno solo
    await saveLifeStoryVideoPhoto(subida('f1', 1, 'c.webp', 'image/webp'));
    expect(nombresDe('f1')).toEqual(['video-vida-photos/f1/01.webp']);
  });
});
