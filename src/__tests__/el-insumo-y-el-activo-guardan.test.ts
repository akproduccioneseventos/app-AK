/**
 * Guardar el nombre de un insumo o de un activo fijo y releer: el valor nuevo tiene que volver.
 *
 * Usa la lectura y la escritura reales de data-service y firebase-sync, contra una base falsa
 * que se comporta como Firestore (documentos, transacciones, `_syncedAt`).
 */

type Stored = Record<string, Record<string, any>>;
const store: Stored = {};
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function coleccion(name: string) {
  store[name] ||= {};
  const ref = (id: string) => ({ collection: name, id });
  const docs = () => Object.entries(store[name]).map(([id, value]) => ({
    id,
    ref: ref(id),
    data: () => clone(value),
  }));
  return {
    doc: (id: string) => ({
      ...ref(id),
      get: async () => ({
        exists: Object.hasOwn(store[name], id),
        data: () => clone(store[name][id]),
      }),
      set: async (value: any, options?: { merge?: boolean }) => {
        store[name][id] = options?.merge
          ? { ...(store[name][id] || {}), ...clone(value) }
          : clone(value);
      },
      create: async (value: any) => {
        if (Object.hasOwn(store[name], id)) throw new Error('already exists');
        store[name][id] = clone(value);
      },
      delete: async () => { delete store[name][id]; },
    }),
    get: async () => ({ docs: docs(), empty: docs().length === 0, size: docs().length }),
  };
}

const dbAdmin = {
  collection: coleccion,
  runTransaction: async (callback: (transaction: any) => Promise<void>) => {
    const writes: Array<() => void> = [];
    await callback({
      get: async (r: any) => ({
        exists: Object.hasOwn(store[r.collection], r.id),
        data: () => clone(store[r.collection][r.id]),
      }),
      set: (r: any, value: any, options?: { merge?: boolean }) => writes.push(() => {
        store[r.collection][r.id] = options?.merge
          ? { ...(store[r.collection][r.id] || {}), ...clone(value) }
          : clone(value);
      }),
      delete: (r: any) => writes.push(() => { delete store[r.collection][r.id]; }),
    });
    writes.forEach((write) => write());
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
jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
}));

import { saveInsumo, getInsumoById } from '@/app/actions/insumos';
import { saveActivoFijo, getActivoFijoById } from '@/app/actions/activos-fijos';

const SEMBRADO = '2026-11-01T00:00:00.000Z';

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
  store.insumos = {
    'ins-1': {
      id: 'ins-1', nombre: 'Harina', categoria: 'Almacen', unidad: 'kg',
      valorUnitarioEstimado: 100, tipoItem: 'Insumo/Ingrediente', _syncedAt: SEMBRADO,
    },
  };
  store.activos_fijos = {
    'act-1': {
      id: 'act-1', nombre: 'Horno', categoria: 'Cocina', unidad: 'unidad',
      valorUnitarioEstimado: 5000, tipoItem: 'Activo Fijo', _syncedAt: SEMBRADO,
    },
  };
});

describe('guardar el nombre y releer', () => {
  it('el insumo guarda el nombre nuevo y al releer lo devuelve', async () => {
    const actual = await getInsumoById('ins-1');
    expect(actual).not.toBeNull();
    const res = await saveInsumo({ ...actual!, nombre: 'ROBOT-12345' } as any);
    expect(res.success).toBe(true);

    const releido = await getInsumoById('ins-1');
    expect(releido?.nombre).toBe('ROBOT-12345');
  });

  it('el activo fijo guarda el nombre nuevo y al releer lo devuelve', async () => {
    const actual = await getActivoFijoById('act-1');
    expect(actual).not.toBeNull();
    const res = await saveActivoFijo({ ...actual!, nombre: 'ROBOT-12345' } as any);
    expect(res.success).toBe(true);

    const releido = await getActivoFijoById('act-1');
    expect(releido?.nombre).toBe('ROBOT-12345');
  });
});
