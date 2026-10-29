/** @jest-environment node */
/**
 * Bloque 1 - Orden 247:
 * Una pantalla vieja del dueño no pisa cuotas cobradas concurrentemente,
 * mover estado con actualizarFiesta preserva planDePagos y no permite mover a Seña.
 */
const almacen: Record<string, any> = {};
const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

const DUENO = {
  userId: 'dueno-1',
  email: 'dueno@akproducciones.com',
  role: 'admin',
  perfil: 'dueno',
};

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) =>
    almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo])
  ),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = copia(datos);
  }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => {
    almacen[archivo] = { ...almacen[archivo], ...copia(parcial) };
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
  verifySession: jest.fn(async () => ({
    success: true,
    user: DUENO,
  })),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => [copia(almacen['fiestas/f1.json'])]),
  leerHistorialCrudo: jest.fn(async () => []),
}));

import { saveFiesta, getFiestas, actualizarFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { marcarItemLectura, CLAVE_DE_LA_MARCA } from '@/lib/marca-de-lectura';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const cuota = (extra: any = {}) => ({
  id: 'c1',
  descripcion: 'Cuota 1',
  monto: 15000,
  montoPagado: 0,
  fechaVencimiento: '2026-11-15',
  estado: 'pendiente' as const,
  pagado: false,
  ...extra,
});

const FIESTA_BASE: FiestaEnPlanificacion = {
  id: 'f1',
  estado: 'Cotizado',
  configuracion: {
    nombreEvento: 'Cumpleaños de 15 de Sofía',
    fechaEvento: '2026-12-01',
    presupuestoEstimado: 60000,
    invitadosEstimados: 80,
  } as any,
  clientPortalSettings: { enabled: true, accessKey: 'clave123' } as any,
  personalAsignado: [],
  contratoFirmaInfo: { isSigned: false } as any,
  planDePagos: {
    id: 'plan-1',
    fiestaId: 'f1',
    cuotas: [cuota()],
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  } as any,
  musica: { preferencias: 'Cumbia y Pop' } as any,
  estadosCompra: [],
  programa: [],
} as any;

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['fiestas/f1.json'] = copia(FIESTA_BASE);
});

describe('Una pantalla vieja del dueño no pisa cuotas', () => {
  it('el dueño lee la fiesta por getFiestas, se cobra una cuota en la base, y saveFiesta no pisa el cobro', async () => {
    // a) El dueño lee la fiesta (marcada con marcaDeLectura / getFiestas)
    const fiestas = await getFiestas(true);
    const leida = fiestas.find((f) => f.id === 'f1')!;
    expect(leida).toBeDefined();
    expect((leida as any)[CLAVE_DE_LA_MARCA]).toBeDefined();
    expect((leida as any)[CLAVE_DE_LA_MARCA].plata?.planDePagos).toBeDefined();

    // b) Otra persona/proceso registra el cobro de una cuota en la base
    almacen['fiestas/f1.json'].planDePagos.cuotas[0].pagado = true;
    almacen['fiestas/f1.json'].planDePagos.cuotas[0].estado = 'pagado';
    almacen['fiestas/f1.json'].planDePagos.cuotas[0].montoPagado = 15000;

    // c) El dueño con su pantalla vieja guarda la fiesta por saveFiesta (modificando sólo nombreEvento)
    const pantallaVieja = {
      ...leida,
      configuracion: {
        ...leida.configuracion,
        nombreEvento: 'XV de Sofía - Confirmado',
      },
    };
    const saveRes = await saveFiesta(pantallaVieja);
    expect(saveRes.success).toBe(true);

    // d) Se verifica que la cuota cobrada NO se pisó (permanece pagada en la base)
    const fiestaEnBase = almacen['fiestas/f1.json'];
    expect(fiestaEnBase.configuracion.nombreEvento).toBe('XV de Sofía - Confirmado');
    expect(fiestaEnBase.planDePagos.cuotas[0].pagado).toBe(true);
    expect(fiestaEnBase.planDePagos.cuotas[0].estado).toBe('pagado');
    expect(fiestaEnBase.planDePagos.cuotas[0].montoPagado).toBe(15000);
  });

  it('el dueño con pantalla marcada por marcarItemLectura modifica la música y saveFiesta no pisa la cuota cobrada', async () => {
    // a) Fiesta marcada con marcarItemLectura
    const leida = marcarItemLectura(copia(almacen['fiestas/f1.json']), 'v1', ['planDePagos', 'estado']);

    // b) Cobro registrado en la base
    almacen['fiestas/f1.json'].planDePagos.cuotas[0].pagado = true;
    almacen['fiestas/f1.json'].planDePagos.cuotas[0].estado = 'pagado';

    // c) El dueño modifica sólo música
    const pantallaVieja = {
      ...leida,
      musica: { ...leida.musica, preferencias: 'Rock y Electrónica' },
    };
    const saveRes = await saveFiesta(pantallaVieja);
    expect(saveRes.success).toBe(true);

    // d) Verifica que la cuota cobrada permanece pagada
    const fiestaEnBase = almacen['fiestas/f1.json'];
    expect(fiestaEnBase.musica?.preferencias).toBe('Rock y Electrónica');
    expect(fiestaEnBase.planDePagos.cuotas[0].pagado).toBe(true);
    expect(fiestaEnBase.planDePagos.cuotas[0].estado).toBe('pagado');
  });

  it('mover de "Cotizado" a "Reunión" con actualizarFiesta no toca el planDePagos', async () => {
    // e) Mover de 'Cotizado' a 'Reunión' con actualizarFiesta no toca el planDePagos
    almacen['fiestas/f1.json'].planDePagos.cuotas[0].pagado = true;
    almacen['fiestas/f1.json'].planDePagos.cuotas[0].estado = 'pagado';
    almacen['fiestas/f1.json'].planDePagos.cuotas[0].montoPagado = 15000;

    const res = await actualizarFiesta('f1', { estado: 'Reunión' });
    expect(res.success).toBe(true);
    expect(res.updatedFiesta?.estado).toBe('Reunión');

    const fiestaEnBase = almacen['fiestas/f1.json'];
    expect(fiestaEnBase.estado).toBe('Reunión');
    expect(fiestaEnBase.planDePagos.cuotas[0].pagado).toBe(true);
    expect(fiestaEnBase.planDePagos.cuotas[0].estado).toBe('pagado');
    expect(fiestaEnBase.planDePagos.cuotas[0].montoPagado).toBe(15000);
  });

  it('intentar mover a "Seña" con actualizarFiesta devuelve error ("No se puede mover a Seña.")', async () => {
    // f) Intentar mover a 'Seña' con actualizarFiesta devuelve error ('No se puede mover a Seña.')
    const res = await actualizarFiesta('f1', { estado: 'Seña' });
    expect(res.success).toBe(false);
    expect(res.error).toBe('No se puede mover a Seña.');

    const resFn = await actualizarFiesta('f1', (f) => ({ ...f, estado: 'Seña' }));
    expect(resFn.success).toBe(false);
    expect(resFn.error).toBe('No se puede mover a Seña.');

    // Estado en base sin modificar
    expect(almacen['fiestas/f1.json'].estado).toBe('Cotizado');
  });
});
