import { BACKUP_COLLECTIONS } from '@/lib/backup/backup-registry';

type Stored = Record<string, Record<string, any>>;
const store: Stored = {};
let readFailure: Error | null = null;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function collection(name: string) {
  store[name] ||= {};
  const reference = (id: string) => ({ collection: name, id });
  const docs = () => Object.entries(store[name]).map(([id, value]) => ({
    id,
    ref: reference(id),
    data: () => clone(value),
  }));
  return {
    doc: (id: string) => ({
      ...reference(id),
      get: async () => ({
        exists: Object.hasOwn(store[name], id),
        data: () => clone(store[name][id]),
      }),
      set: async (value: any, options?: { merge?: boolean }) => {
        store[name][id] = options?.merge
          ? { ...(store[name][id] || {}), ...clone(value) }
          : clone(value);
      },
      delete: async () => { delete store[name][id]; },
    }),
    get: async () => {
      if (readFailure) throw readFailure;
      return { docs: docs(), empty: docs().length === 0, size: docs().length };
    },
    _docs: docs,
  };
}

const dbAdmin = {
  collection,
  runTransaction: async (callback: (transaction: any) => Promise<void>) => {
    const writes: Array<() => void> = [];
    await callback({
      get: async (ref: any) => ({ docs: ref._docs() }),
      set: (ref: any, value: any, options?: { merge?: boolean }) => writes.push(() => {
        store[ref.collection][ref.id] = options?.merge
          ? { ...(store[ref.collection][ref.id] || {}), ...clone(value) }
          : clone(value);
      }),
      delete: (ref: any) => writes.push(() => { delete store[ref.collection][ref.id]; }),
    });
    writes.forEach((write) => write());
  },
  batch: () => {
    const writes: Array<() => void> = [];
    return {
      set: (ref: any, value: any, options?: { merge?: boolean }) => writes.push(() => {
        store[ref.collection][ref.id] = options?.merge
          ? { ...(store[ref.collection][ref.id] || {}), ...clone(value) }
          : clone(value);
      }),
      delete: (ref: any) => writes.push(() => { delete store[ref.collection][ref.id]; }),
      commit: async () => writes.forEach((write) => write()),
    };
  },
};

jest.mock('@/lib/firebase/server', () => ({ dbAdmin }));
jest.mock('@/lib/logger', () => ({
  shouldSkipFirestoreDuringBuild: () => false,
  isBuildTime: () => false,
  isDefaultCredentialError: () => false,
  compactError: (error: unknown) => error,
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

import { readFromFirestore, syncToFirestore } from '@/lib/firebase-sync';

const FILE = 'ajustes-costos-insumos.json';
const COLLECTION = 'ajustes_costos_insumos';

describe('respaldo y restauración de recibos de ajustes de costos', () => {
  beforeEach(() => {
    Object.keys(store).forEach((name) => delete store[name]);
    readFailure = null;
    jest.restoreAllMocks();
  });

  it('registra el archivo de respaldo y lo asocia con la colección real', async () => {
    expect(BACKUP_COLLECTIONS.map(({ file }) => file)).toContain(FILE);

    const recibo = { id: 'recibo-1', porcentaje: 10, ids: ['i1'], terminado: true };
    await syncToFirestore(FILE, [recibo], { esRestauracion: true });

    expect(store[COLLECTION]?.['recibo-1']).toMatchObject(recibo);
    expect(await readFromFirestore(FILE)).toEqual([expect.objectContaining(recibo)]);
  });

  it('rehidrata el id de documento de recibos legacy, incluso para _turno', async () => {
    store[COLLECTION] = {
      'legacy-hash': { porcentaje: 10, ids: ['i1'], terminado: false },
      _turno: { operacion: 'legacy-hash', porcentaje: 10 },
    };

    const recibos = await readFromFirestore(FILE);
    expect(recibos).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'legacy-hash', porcentaje: 10, ids: ['i1'], terminado: false }),
      expect.objectContaining({ id: '_turno', operacion: 'legacy-hash', porcentaje: 10 }),
    ]));
  });

  it('restaura IDs, estado pendiente/terminado y hash del turno sin perderlos', async () => {
    const respaldo = [
      { id: 'recibo-pendiente', porcentaje: 12, ids: ['i1'], terminado: false },
      { id: '_turno', operacion: 'recibo-pendiente', porcentaje: 12 },
    ];

    await syncToFirestore(FILE, respaldo, { esRestauracion: true });
    const restaurado = await readFromFirestore(FILE);

    expect(restaurado).toEqual(expect.arrayContaining(respaldo.map((item) => expect.objectContaining(item))));
    expect(Object.keys(store[COLLECTION]).sort()).toEqual(['_turno', 'recibo-pendiente']);
  });

  it('una restauración intencional de [] vacía definitivamente el libro', async () => {
    store[COLLECTION] = { a: { id: 'a' }, b: { id: 'b' } };

    await syncToFirestore(FILE, [], { esRestauracion: true });

    expect(store[COLLECTION]).toEqual({});
    expect(await readFromFirestore(FILE)).toEqual([]);
  });

  it('devuelve [] cuando la lectura exitosa encuentra la colección vacía', async () => {
    store[COLLECTION] = {};

    expect(await readFromFirestore(FILE)).toEqual([]);
  });

  it('mantiene intacta la asignación existente de insumos.json', async () => {
    await syncToFirestore('insumos.json', [{ id: 'insumo-1', nombre: 'Harina' }], { esRestauracion: true });

    expect(store.insumos?.['insumo-1']).toMatchObject({ id: 'insumo-1', nombre: 'Harina' });
    expect(store[COLLECTION]).toBeUndefined();
    expect(await readFromFirestore('insumos.json')).toEqual([expect.objectContaining({ id: 'insumo-1', nombre: 'Harina' })]);
  });

  it('no confunde un error de transporte con una lectura vacía válida', async () => {
    readFailure = new Error('transporte no disponible');

    expect(await readFromFirestore(FILE)).toBeNull();
    await expect(readFromFirestore(FILE, { propagarErrores: true })).rejects.toThrow('transporte no disponible');
  });

  it('recupera el ID real tambien con marcas de lectura y no confia en un ID viejo guardado', async () => {
    store[COLLECTION] = { hash: { id: 'otro-id', porcentaje: 10, ids: ['i1'], terminado: true } };
    expect(await readFromFirestore(FILE, { conMarcas: true })).toEqual([
      expect.objectContaining({ id: 'hash', terminado: true }),
    ]);
  });

  it('proveedores vacio no revive el fallback ni permite borrado masivo accidental', async () => {
    store.proveedores = {};
    expect(await readFromFirestore('proveedores.json')).toEqual([]);
    store.proveedores = { p1: { id: 'p1', nombre: 'Proveedor' } };
    await syncToFirestore('proveedores.json', []);
    expect(Object.keys(store.proveedores)).toEqual(['p1']);
    readFailure = new Error('sin conexion');
    expect(await readFromFirestore('proveedores.json')).toBeNull();
  });
});
