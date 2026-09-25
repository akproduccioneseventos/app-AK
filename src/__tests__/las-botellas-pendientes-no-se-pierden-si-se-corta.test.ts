/**
 * MATAFUEGO — Las botellas por devolver no se pierden si el servidor se corta en el medio.
 *
 * Lo marco Codex el 25 de septiembre de 2026 (BAR01): `reintentarDevolucionesPendientes`
 * vaciaba la lista de botellas por devolver en una operacion y las devolvia en OTRA. Si el
 * servidor se reiniciaba entre las dos, la lista ya estaba vacia y el stock sin devolver: la
 * devolucion se perdia sin rastro.
 *
 * Ahora las dos cosas van en UNA transaccion de la base: o pasan las dos, o ninguna.
 *
 * La base de mentira de esta prueba confirma cada transaccion recien cuando termina, como la
 * de verdad, y las pasa de a una (la base de verdad repite la que choca). Para simular el
 * corte, la operacion que toca el stock se queda colgada para siempre: lo que ya se confirmo
 * queda, lo demas no.
 *
 * Se probo rompiendolo: con el codigo de antes (vaciar y despues devolver), la primera
 * comprobacion se pone en rojo: la lista queda vacia y el stock sin devolver.
 */
type Doc = Record<string, any>;
const confirmados: Record<string, Doc> = {};
let colgarAlDevolverStock = false;
let turno: Promise<unknown> = Promise.resolve();
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function ref(path: string) {
  return {
    path,
    id: path.split('/').pop(),
    // Lectura suelta, fuera de transaccion: ve lo confirmado.
    get: async () => ({ exists: confirmados[path] !== undefined, data: () => copia(confirmados[path]) }),
  };
}

const fakeDb = {
  collection: (nombre: string) => ({ doc: (id: string) => ref(`${nombre}/${id}`) }),
  runTransaction: (fn: (tx: any) => Promise<any>) => {
    const corrida = turno.then(async () => {
      const escrituras: Array<[string, Doc, boolean]> = [];
      const snap = (r: { path: string }) => ({
        exists: confirmados[r.path] !== undefined,
        data: () => copia(confirmados[r.path]),
        ref: r,
      });
      const tx = {
        get: async (r: any) => snap(r),
        getAll: async (...rs: any[]) => rs.map(snap),
        set: (r: any, datos: Doc) => { escrituras.push([r.path, datos, false]); },
        update: (r: any, datos: Doc) => { escrituras.push([r.path, datos, true]); },
      };
      const resultado = await fn(tx);
      if (colgarAlDevolverStock && escrituras.some(([p]) => p.startsWith('insumos/'))) {
        await new Promise(() => {}); // el servidor se corto: esto no se confirma nunca
      }
      for (const [p, datos, esUpdate] of escrituras) {
        confirmados[p] = esUpdate ? { ...(confirmados[p] || {}), ...copia(datos) } : copia(datos);
      }
      return resultado;
    });
    turno = corrida.catch(() => undefined);
    return corrida;
  },
};

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: fakeDb }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => { throw new Error('Sesion no autorizada.'); }) }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f) }));
jest.mock('@/lib/carta-tragos/leer-carta-master', () => ({ leerCartaTragosMaster: jest.fn(async () => []) }));
jest.mock('@/app/actions/carta-tragos-master.actions', () => ({ getCartaTragosMaster: jest.fn() }));
jest.mock('@/app/actions/social-gallery', () => ({ createSocialMediaPostFromUrlForStation: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(async (_f: string, d: any) => d), writeData: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => ({
    id,
    invitados: [],
    cartaTragos: { items: [{ id: 'gin-tonic', nombre: 'Gin Tonic', recetaIngredientes: [{ insumoId: 'gin', cantidad: 2 }], stockDisponible: 5 }] },
    others: { barraTecnologica: { settings: { enabled: true, openingTime: '', closingTime: '' }, orders: [] } },
  })),
  saveFiesta: jest.fn(),
}));

import { createBarDrinkOrder } from '@/app/actions/fiesta/barra-tecnologica.actions';

const PENDIENTES = `json_documents/${encodeURIComponent('barra-devoluciones-pendientes.json')}`;
const GIN = 'insumos/gin';

function preparar() {
  for (const k of Object.keys(confirmados)) delete confirmados[k];
  colgarAlDevolverStock = false;
  turno = Promise.resolve();
  confirmados[GIN] = { cantidadDisponible: 10 };
  confirmados[PENDIENTES] = {
    _filePath: 'barra-devoluciones-pendientes.json',
    _arrayData: [{ pedido: 'bar_1', movimientos: [{ insumoId: 'gin', cantidad: 3 }], anotadaEn: '2026-09-25T00:00:00.000Z' }],
  };
}

// Un pedido de un trago que no existe: corre la devolucion de pendientes y se va.
const pedirAlgo = () => createBarDrinkOrder({ fiestaId: 'f1', drinkId: 'no-existe', guestName: 'X' } as any);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Las botellas pendientes no se pierden si el servidor se corta', () => {
  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    preparar();
  });

  it('si se corta al devolver, la devolucion sigue anotada (no queda la lista vacia y el stock sin volver)', async () => {
    colgarAlDevolverStock = true;
    void pedirAlgo();
    await esperar(80);
    const pendientes = confirmados[PENDIENTES]._arrayData;
    const stock = confirmados[GIN].cantidadDisponible;
    const devueltas = stock === 13;
    const siguenAnotadas = pendientes.length === 1;
    expect(devueltas || siguenAnotadas).toBe(true);
  });

  it('sin cortes, devuelve las botellas y vacia la lista', async () => {
    await pedirAlgo();
    expect(confirmados[GIN].cantidadDisponible).toBe(13);
    expect(confirmados[PENDIENTES]._arrayData).toEqual([]);
  });

  it('dos pedidos a la vez devuelven las botellas una sola vez', async () => {
    await Promise.all([pedirAlgo(), pedirAlgo()]);
    expect(confirmados[GIN].cantidadDisponible).toBe(13);
    expect(confirmados[PENDIENTES]._arrayData).toEqual([]);
  });
});

// Pregunta 25 tambien para el pedido: descontar y guardar van juntos.
const pedirGin = (req: string) => createBarDrinkOrder({ fiestaId: 'f1', drinkId: 'gin-tonic', guestName: 'Ana', clientRequestId: req } as any);

describe('El pedido y sus botellas van juntos', () => {
  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    preparar();
    confirmados[PENDIENTES]._arrayData = [];
  });

  it('si se corta al guardar, no quedan botellas descontadas sin pedido', async () => {
    colgarAlDevolverStock = true;
    void pedirGin('corte');
    await esperar(80);
    const pedido = confirmados['bar_drink_orders/bar_corte'];
    const stock = confirmados[GIN].cantidadDisponible;
    // O las dos cosas pasaron, o ninguna.
    expect(Boolean(pedido)).toBe(stock === 8);
  });

  it('sin cortes, descuenta las botellas y guarda el pedido con sus movimientos', async () => {
    const r = await pedirGin('ok');
    expect(r.success).toBe(true);
    expect(confirmados[GIN].cantidadDisponible).toBe(8);
    expect(confirmados['bar_drink_orders/bar_ok'].stockMovements).toEqual([{ insumoId: 'gin', cantidad: 2 }]);
  });

  it('el mismo pedido tocado dos veces a la vez descuenta una sola vez', async () => {
    const [a, b] = await Promise.all([pedirGin('doble'), pedirGin('doble')]);
    expect(a.success && b.success).toBe(true);
    expect(confirmados[GIN].cantidadDisponible).toBe(8);
  });
});
