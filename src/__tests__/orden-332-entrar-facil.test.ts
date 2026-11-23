/** @jest-environment node */

const almacen: Record<string, any> = {};
const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

const DUENO = {
  userId: 'dueno-1',
  email: 'dueno@akproducciones.com',
  role: 'admin',
  perfil: 'dueno',
};

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => new Map([['x-forwarded-for', '190.10.20.30']])),
  cookies: jest.fn(async () => ({ get: jest.fn(), set: jest.fn() })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) =>
    almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
  ),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => ({
    valor: almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
    huboFalla: false,
  })),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = copia(datos);
  }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => {
    almacen[archivo] = { ...(almacen[archivo] || {}), ...copia(parcial) };
  }),
  createDataItem: jest.fn(async (archivo: string, _col: string, id: string, item: any) => {
    const lista = Array.isArray(almacen[archivo]) ? almacen[archivo] : [];
    if (lista.some((x: any) => x.id === id)) {
      throw new Error('already exists');
    }
    almacen[archivo] = [...lista, copia(item)];
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (path: string, _vacio: any, cambiar: (a: any) => any) => {
    const actual = almacen[path] !== undefined ? copia(almacen[path]) : null;
    const nuevo = await cambiar(actual);
    if (nuevo === null) return null;
    almacen[path] = copia(nuevo);
    return copia(nuevo);
  }),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: DUENO })),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () =>
    Object.entries(almacen)
      .filter(([k]) => k.startsWith('fiestas/'))
      .map(([, v]) => copia(v)),
  ),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/lib/ia/reglas-de-la-ia', () => ({
  getReglaParaTarea: jest.fn(async () => 'preguntar'),
}));

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    hoyEnUruguay: jest.fn(() => '2026-11-21'),
  };
});

import { entrarComoInvitado } from '@/app/actions/entrar-como-invitado';
import { saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { generarCodigoFiestaUnico } from '@/lib/fiesta/codigo-fiesta';
import { autoGenerarBorradoresSemanales } from '@/lib/presencia-digital/autogenerador-semanal';
import { AK_PLAY_STORE_URL } from '@/lib/public-contact';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function crearFiesta(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'fiesta-1',
    estado: 'Confirmada',
    codigoFiesta: 'K7P4QX',
    configuracion: {
      nombreEvento: 'Los 15 de Valentina',
      fechaEvento: '2026-11-25',
      presupuestoEstimado: 150000,
      invitadosEstimados: 100,
    } as any,
    gestionCostos: {
      totalIngresos: 150000,
      costosItems: [{ id: 'c1', concepto: 'Sonido', monto: 40000 }],
    } as any,
    personalAsignado: [{ empleadoId: 'emp-1', rolId: 'dj', eventSalary: 9500 }] as any,
    clientPortalSettings: { enabled: true, accessKey: 'clave-secreta-cliente' } as any,
    invitados: [
      {
        id: 'inv-1',
        nombre: 'Sofía Rodríguez',
        contacto: '+59899123456',
        rsvp: 'Confirmado',
        tableNumber: '4',
      },
      {
        id: 'inv-2',
        nombre: 'Martín Gómez',
        contacto: '098765432',
        rsvp: 'Pendiente',
        guestAccessToken: 'tok-otro-invitado',
      },
    ],
    ...overrides,
  } as FiestaEnPlanificacion;
}

describe('Orden 332 — La app de Play Store recibe a cada uno fácil', () => {
  const prevLocalOnly = process.env.AK_USE_LOCAL_JSON_ONLY;

  beforeAll(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
  });

  afterAll(() => {
    if (prevLocalOnly === undefined) {
      delete process.env.AK_USE_LOCAL_JSON_ONLY;
    } else {
      process.env.AK_USE_LOCAL_JSON_ONLY = prevLocalOnly;
    }
  });

  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
  });

  describe('Bloque 2 — entrarComoInvitado', () => {
    it('acepta celular en formato local (099 123 456) contra +59899123456 y devuelve sólo credencial y su invitado', async () => {
      almacen['fiestas/fiesta-1.json'] = crearFiesta();

      const res = await entrarComoInvitado({ telefono: '099 123 456' });

      expect(res.status).toBe('ok');
      if (res.status !== 'ok') return;
      expect(res.fiestaId).toBe('fiesta-1');
      expect(res.guestId).toBe('inv-1');
      expect(typeof res.token).toBe('string');
      expect(res.token.length).toBeGreaterThan(10);
      expect(res.invitado).toEqual({
        id: 'inv-1',
        nombre: 'Sofía Rodríguez',
        rsvp: 'Confirmado',
        tableNumber: '4',
        categoria: undefined,
      });

      const serializado = JSON.stringify(res);
      expect(serializado).not.toContain('Martín Gómez');
      expect(serializado).not.toContain('tok-otro-invitado');
      expect(serializado).not.toContain('gestionCostos');
      expect(serializado).not.toContain('40000');
      expect(serializado).not.toContain('clave-secreta-cliente');
      expect(serializado).not.toContain('personalAsignado');
      expect(res as any).not.toHaveProperty('invitados');
      expect(res as any).not.toHaveProperty('costos');

      // El token generado se persiste en la fiesta
      const guardada = almacen['fiestas/fiesta-1.json'] as FiestaEnPlanificacion;
      expect(guardada.invitados?.find((i) => i.id === 'inv-1')?.guestAccessToken).toBe(res.token);
    });

    it('celular que no está devuelve el cartel amigable', async () => {
      almacen['fiestas/fiesta-1.json'] = crearFiesta();

      const res = await entrarComoInvitado({ telefono: '091 000 999' });

      expect(res).toEqual({
        status: 'no_encontrado',
        error: 'No te encontramos. Probá con el código de la fiesta, que está en tu invitación.',
      });
    });

    it('mismo celular en dos fiestas devuelve las opciones sin credenciales y permite elegir una', async () => {
      almacen['fiestas/fiesta-1.json'] = crearFiesta({
        id: 'fiesta-1',
        configuracion: { nombreEvento: 'Los 15 de Valentina', fechaEvento: '2026-11-25' } as any,
        invitados: [{ id: 'inv-a', nombre: 'Ana López', contacto: '099222333', rsvp: 'Confirmado' }],
      });
      almacen['fiestas/fiesta-2.json'] = crearFiesta({
        id: 'fiesta-2',
        codigoFiesta: 'M8R3TY',
        configuracion: { nombreEvento: 'Boda de Lucas y Caro', fechaEvento: '2026-12-05' } as any,
        invitados: [{ id: 'inv-b', nombre: 'Ana López', contacto: '+59899222333', rsvp: 'Confirmado', guestAccessToken: 'tok-b' }],
      });

      const res = await entrarComoInvitado({ telefono: '099 222 333' });
      expect(res.status).toBe('multiple');
      if (res.status !== 'multiple') return;

      expect(res.opciones).toEqual([
        { fiestaId: 'fiesta-1', nombreEvento: 'Los 15 de Valentina', fechaEvento: '2026-11-25' },
        { fiestaId: 'fiesta-2', nombreEvento: 'Boda de Lucas y Caro', fechaEvento: '2026-12-05' },
      ]);
      expect(JSON.stringify(res)).not.toContain('tok-b');
      expect((res as any).token).toBeUndefined();
      expect((res as any).guestId).toBeUndefined();

      const elegida = await entrarComoInvitado({
        telefono: '099 222 333',
        fiestaIdElegida: 'fiesta-2',
      });
      expect(elegida.status).toBe('ok');
      if (elegida.status !== 'ok') return;
      expect(elegida.fiestaId).toBe('fiesta-2');
      expect(elegida.guestId).toBe('inv-b');
      expect(elegida.token).toBe('tok-b');
    });

    it('código válido + nombre exacto (sin mayúsculas ni acentos) entra, y nombre ausente manda a /invitacion/<id>', async () => {
      almacen['fiestas/fiesta-1.json'] = crearFiesta({ codigoFiesta: 'K7P4QX' });

      const ok = await entrarComoInvitado({
        codigoFiesta: 'k7p4qx',
        nombre: 'sofia rodriguez',
      });
      expect(ok.status).toBe('ok');
      if (ok.status === 'ok') {
        expect(ok.fiestaId).toBe('fiesta-1');
        expect(ok.guestId).toBe('inv-1');
      }

      const noEsta = await entrarComoInvitado({
        codigoFiesta: 'K7P4QX',
        nombre: 'Persona Que No Esta',
      });
      expect(noEsta).toEqual({
        status: 'ir_a_invitacion',
        fiestaId: 'fiesta-1',
        url: '/invitacion/fiesta-1',
      });
    });

    it('una fiesta cerrada, finalizada, archivada o de más de 2 días atrás no aparece', async () => {
      almacen['fiestas/f-cerrada.json'] = crearFiesta({
        id: 'f-cerrada',
        estado: 'cerrada',
        invitados: [{ id: 'i1', nombre: 'Inv', contacto: '099444555', rsvp: 'Confirmado' }],
      });
      almacen['fiestas/f-finalizada.json'] = crearFiesta({
        id: 'f-finalizada',
        estado: 'finalizada',
        invitados: [{ id: 'i2', nombre: 'Inv', contacto: '099444555', rsvp: 'Confirmado' }],
      });
      almacen['fiestas/f-vieja.json'] = crearFiesta({
        id: 'f-vieja',
        estado: 'Confirmada',
        configuracion: { nombreEvento: 'Pasada', fechaEvento: '2026-11-18' } as any,
        invitados: [{ id: 'i3', nombre: 'Inv', contacto: '099444555', rsvp: 'Confirmado' }],
      });

      const res = await entrarComoInvitado({ telefono: '099444555' });
      expect(res.status).toBe('no_encontrado');
    });

    it('frena el 6º intento en 15 minutos con el tope por identidad y dirección', async () => {
      almacen['fiestas/fiesta-1.json'] = crearFiesta();

      for (let i = 0; i < 5; i++) {
        const intento = await entrarComoInvitado({ telefono: '099777888' });
        expect(intento.status).toBe('no_encontrado');
      }

      const sexto = await entrarComoInvitado({ telefono: '099777888' });
      expect(sexto.status).toBe('no_encontrado');
      if (sexto.status === 'no_encontrado') {
        expect(sexto.error).toMatch(/demasiados intentos/i);
      }
    });
  });

  describe('Bloque 3 — Generación y persistencia de codigoFiesta', () => {
    it('genera 500 códigos de 6 caracteres sin 0, O, 1, I ni L y sin repetidos', () => {
      const generados: string[] = [];
      for (let i = 0; i < 500; i++) {
        const codigo = generarCodigoFiestaUnico(generados);
        expect(codigo).toHaveLength(6);
        expect(codigo).not.toMatch(/[0O1IL]/);
        expect(codigo).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
        generados.push(codigo);
      }
      expect(new Set(generados).size).toBe(500);
    });

    it('saveFiesta genera codigoFiesta si falta y preserva un código existente sin cambiarlo nunca', async () => {
      const nueva = crearFiesta({ id: 'fiesta-nueva', codigoFiesta: undefined });
      const resCrear = await saveFiesta(nueva);
      expect(resCrear.success).toBe(true);
      const codigoInicial = almacen['fiestas/fiesta-nueva.json'].codigoFiesta;
      expect(codigoInicial).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);

      const resGuardar = await saveFiesta({
        ...almacen['fiestas/fiesta-nueva.json'],
        codigoFiesta: 'OTRO99',
      });
      expect(resGuardar.success).toBe(true);
      expect(almacen['fiestas/fiesta-nueva.json'].codigoFiesta).toBe(codigoInicial);
    });
  });

  describe('Bloque 5 — Autogenerador semanal del anuncio de la app', () => {
    it('crea el borrador de la app una única vez y marca anuncioAppCreado en ajustes', async () => {
      almacen['presencia-digital-ajustes.json'] = { activo: true };
      almacen['social-posts.json'] = [];

      const primera = await autoGenerarBorradoresSemanales();
      expect(primera.success).toBe(true);
      expect(primera.createdCount).toBe(1);

      const posts = almacen['social-posts.json'] as any[];
      expect(posts).toHaveLength(1);
      expect(posts[0].status).toBe('Borrador');
      expect(posts[0].text).toContain('¡Ya tenemos app!');
      expect(posts[0].text).toContain(AK_PLAY_STORE_URL);
      expect(posts[0].text.toLowerCase()).not.toContain('garantía');
      expect(posts[0].text.toLowerCase()).not.toContain('garantia');
      expect(almacen['presencia-digital-ajustes.json'].anuncioAppCreado).toBe(true);

      const segunda = await autoGenerarBorradoresSemanales();
      expect(segunda.createdCount).toBe(0);
      expect(almacen['social-posts.json']).toHaveLength(1);
    });
  });
});
