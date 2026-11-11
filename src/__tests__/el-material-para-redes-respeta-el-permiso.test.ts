import JSZip from 'jszip';

if (typeof (global as any).Headers === 'undefined') {
  (global as any).Headers = class {
    private m = new Map<string, string>();
    set(k: string, v: string) { this.m.set(k.toLowerCase(), v); }
    get(k: string) { return this.m.get(k.toLowerCase()) ?? null; }
  };
}

let permisoCRM = true;
let permisoPromocional = false;
let fotosMock: Array<{
  id: string;
  eventId: string;
  url: string;
  tipoFiesta: string;
  sourceModule?: string;
  mediaType?: 'image' | 'video';
}> = [];

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => {
    if (!permisoCRM) {
      return { ok: false, error: 'Tu perfil no tiene acceso al CRM.' };
    }
    return { ok: true, user: { email: 'crm@akproducciones.com', rol: 'operador' } };
  }),
}));

jest.mock('@/lib/asistente/comercial-borrador', () => ({
  tienePermisoPromocional: jest.fn(async () => permisoPromocional),
  fotosPromocionalesDeFiesta: jest.fn(async () => fotosMock),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: jest.fn(async (id: string) => ({
    id,
    configuracion: {
      nombreEvento: '15 de Sofía',
      tipoCelebracion: 'XV Años',
      fechaEvento: '2026-12-15',
      protagonista1Nombre: 'Sofía',
    },
    invitacionDigital: {
      plantilla: 'Allegria',
      cabecera: {
        protagonista1: 'Sofía',
        paletaColores: { primary: '#ff007f', secondary: '#ffffff', accent: '#gold' },
      },
    },
  })),
}));

jest.mock('next/server', () => ({
  NextResponse: class {
    status: number;
    headers: Headers;
    body: any;
    constructor(body: any, init?: { status?: number; headers?: Headers }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = init?.headers ?? new Headers();
    }
    static json(data: any, init?: { status?: number }) {
      const r: any = new (this as any)(JSON.stringify(data), init);
      r.json = async () => data;
      return r;
    }
  },
}));

import { GET } from '@/app/api/fiestas/[id]/material-redes/route';

const pedirMaterial = (id: string) =>
  GET({} as any, { params: Promise.resolve({ id }) }) as Promise<any>;

describe('Orden 275 - El material para redes respeta el permiso de promoción', () => {
  beforeEach(() => {
    permisoCRM = true;
    permisoPromocional = false;
    fotosMock = [];
    (global as any).fetch = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => Uint8Array.from(Buffer.from(`contenido de ${url}`)).buffer,
    }));
  });

  it('una fiesta sin permiso de promoción no baja nada y devuelve 403 con el mensaje exacto', async () => {
    permisoPromocional = false;
    const res = await pedirMaterial('fiesta-sin-permiso');
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Esta fiesta no tiene permiso para usar las fotos en redes');
  });

  it('el personal sin permiso de CRM no baja nada', async () => {
    permisoCRM = false;
    permisoPromocional = true;
    const res = await pedirMaterial('fiesta-con-permiso');
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('CRM');
  });

  it('una con permiso baja sólo sus fotos autorizadas, en la carpeta de su estación y con estilo.json', async () => {
    permisoPromocional = true;
    fotosMock = [
      {
        id: 'foto-1',
        eventId: 'fiesta-con-permiso',
        url: 'https://storage.googleapis.com/ak/foto1.jpg',
        tipoFiesta: 'XV Años',
        sourceModule: 'fotocabina',
        mediaType: 'image',
      },
      {
        id: 'video-360',
        eventId: 'fiesta-con-permiso',
        url: 'https://storage.googleapis.com/ak/video1.mp4',
        tipoFiesta: 'XV Años',
        sourceModule: 'plataforma360',
        mediaType: 'video',
      },
      {
        id: 'foto-vogue',
        eventId: 'fiesta-con-permiso',
        url: 'https://storage.googleapis.com/ak/vogue1.jpg',
        tipoFiesta: 'XV Años',
        sourceModule: 'vogue',
        mediaType: 'image',
      },
      {
        id: 'foto-espejo',
        eventId: 'fiesta-con-permiso',
        url: 'https://storage.googleapis.com/ak/espejo1.jpg',
        tipoFiesta: 'XV Años',
        sourceModule: 'espejoMagico',
        mediaType: 'image',
      },
      {
        id: 'foto-barra',
        eventId: 'fiesta-con-permiso',
        url: 'https://storage.googleapis.com/ak/trago1.jpg',
        tipoFiesta: 'XV Años',
        sourceModule: 'barra',
        mediaType: 'image',
      },
    ];

    const res = await pedirMaterial('fiesta-con-permiso');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/zip');
    expect(res.headers.get('X-Fotos-Incluidas')).toBe('5');

    const zip = await JSZip.loadAsync(res.body);
    const filenames = Object.keys(zip.files);

    // Debe contener las carpetas por estación correspondientes
    expect(filenames.some((f) => f.startsWith('fotocabina/'))).toBe(true);
    expect(filenames.some((f) => f.startsWith('plataforma-360/'))).toBe(true);
    expect(filenames.some((f) => f.startsWith('vogue/'))).toBe(true);
    expect(filenames.some((f) => f.startsWith('espejo/'))).toBe(true);
    expect(filenames.some((f) => f.startsWith('barra/'))).toBe(true);

    // Debe incluir estilo.json
    expect(zip.file('estilo.json')).not.toBeNull();
    const estiloRaw = await zip.file('estilo.json')!.async('string');
    const estilo = JSON.parse(estiloRaw);
    expect(estilo.plantilla).toBe('Allegria');
    expect(estilo.protagonista1).toBe('Sofía');
    expect(estilo.fechaEvento).toBe('2026-12-15');
    expect(estilo.paletaColores).toEqual({
      primary: '#ff007f',
      secondary: '#ffffff',
      accent: '#gold',
    });
  });
});
