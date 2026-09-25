/**
 * MATAFUEGO — La descarga del Video de Vida no entrega fotos de menos sin avisar (VID03).
 *
 * Lo encontró Codex el 19 de septiembre de 2026 y **volvió a encontrarlo el 25**: el bloque se
 * había agregado a una orden ya cumplida sin su comprobación y nadie lo programó. Una foto que
 * no bajaba se salteaba en silencio, y si fallaban todas se entregaba un archivo vacío con 200.
 *
 * Se lee el archivo comprimido DE VERDAD con JSZip, no se mira la forma del código.
 * Se probó rompiéndolo: con el `if (!res.ok) continue;` de antes, "una bien y una con 404" y
 * "las dos fallan" se ponen en rojo.
 */
import JSZip from 'jszip';

// El entorno de las pruebas no trae los objetos de la web: alcanza con uno que guarde y devuelva.
if (typeof (global as any).Headers === 'undefined') {
  (global as any).Headers = class {
    private m = new Map<string, string>();
    set(k: string, v: string) { this.m.set(k.toLowerCase(), v); }
    get(k: string) { return this.m.get(k.toLowerCase()) ?? null; }
  };
}

let fotos: string[] = [];
let sesion = true;
jest.mock('@/app/actions/fiesta/video-vida.actions', () => ({ getLifeStoryVideoPhotos: jest.fn(async () => fotos) }));
jest.mock('@/lib/auth/require-session', () => ({ hasAppSession: jest.fn(async () => sesion) }));
jest.mock('next/server', () => ({
  NextResponse: class {
    status: number; headers: Headers; body: any;
    constructor(body: any, init?: { status?: number; headers?: Headers }) {
      this.body = body; this.status = init?.status ?? 200; this.headers = init?.headers ?? new Headers();
    }
    static json(data: any, init?: { status?: number }) {
      const r: any = new (this as any)(JSON.stringify(data), init);
      r.json = async () => data;
      return r;
    }
  },
}));

import { GET } from '@/app/api/video-vida-photos/[fiestaId]/download/route';

const BASE = 'https://firebasestorage.googleapis.com/v0/b/ak/o/fiestas%2Ff1%2F';
const respuestas: Record<string, number | 'red'> = {};
beforeEach(() => {
  sesion = true;
  for (const k of Object.keys(respuestas)) delete respuestas[k];
  (global as any).fetch = jest.fn(async (url: string) => {
    const r = respuestas[url] ?? 200;
    if (r === 'red') throw new Error('se cortó la red');
    return { ok: r === 200, status: r, arrayBuffer: async () => Uint8Array.from(Buffer.from(`foto ${url}`)).buffer };
  });
});

const pedir = () => GET({} as any, { params: Promise.resolve({ fiestaId: 'f1' }) }) as Promise<any>;
const abrir = async (r: any) => JSZip.loadAsync(r.body);

describe('La descarga del Video de Vida avisa lo que falta', () => {
  it('dos fotos bien: las dos adentro y sin lista de faltantes', async () => {
    fotos = [`${BASE}a.jpg?token=secreto`, `${BASE}b.jpg?token=secreto`];
    const r = await pedir();
    expect(r.status).toBe(200);
    const zip = await abrir(r);
    expect(Object.keys(zip.files).sort()).toEqual(['a.jpg', 'b.jpg']);
    expect(r.headers.get('X-Fotos-Fallidas')).toBe('0');
  });

  it('una bien y una con 404: entra una, la lista nombra la que falta sin la dirección, y avisa', async () => {
    fotos = [`${BASE}a.jpg?token=secreto`, `${BASE}b.jpg?token=secreto`];
    respuestas[fotos[1]] = 404;
    const r = await pedir();
    expect(r.status).toBe(200);
    const zip = await abrir(r);
    expect(zip.files['a.jpg']).toBeDefined();
    expect(zip.files['b.jpg']).toBeUndefined();
    const lista = await zip.files['FALTAN_FOTOS.txt'].async('string');
    expect(lista).toContain('b.jpg');
    expect(lista).not.toContain('https://');
    expect(lista).not.toContain('secreto');
    expect(r.headers.get('X-Fotos-Fallidas')).toBe('1');
    expect(r.headers.get('X-Fotos-Incluidas')).toBe('1');
  });

  it('las dos fallan (500 y la red cortada): no se entrega un archivo vacío', async () => {
    fotos = [`${BASE}a.jpg`, `${BASE}b.jpg`];
    respuestas[fotos[0]] = 500;
    respuestas[fotos[1]] = 'red';
    const r = await pedir();
    expect(r.status).toBe(502);
    expect((await r.json()).error).toMatch(/ninguna foto/);
  });

  it('dos fotos con el mismo nombre: quedan las dos', async () => {
    fotos = [`${BASE}a.jpg?v=1`, `${BASE}a.jpg?v=2`];
    const zip = await abrir(await pedir());
    expect(Object.keys(zip.files).sort()).toEqual(['a-2.jpg', 'a.jpg']);
  });

  it('una ruta local afuera de la app no se lee', async () => {
    fotos = ['/etc/passwd', `${BASE}a.jpg`];
    const r = await pedir();
    const zip = await abrir(r);
    expect(Object.keys(zip.files)).not.toContain('passwd');
    expect(r.headers.get('X-Fotos-Fallidas')).toBe('1');
  });

  it('sin sesión del equipo: 401 y no baja nada', async () => {
    sesion = false;
    fotos = [`${BASE}a.jpg`];
    const r = await pedir();
    expect(r.status).toBe(401);
    expect((global as any).fetch).not.toHaveBeenCalled();
  });
});
