/**
 * Guardar el nombre de un insumo o de un activo fijo y releer: el valor nuevo tiene que volver.
 *
 * Usa la lectura y la escritura reales de data-service, leer-insumos (cache 60s) y firebase-sync,
 * contra una base en memoria que emula Firestore sin escribir en data/ ni src/data/.
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
    limit: () => ({
      get: async () => ({ docs: docs().slice(0, 1), empty: docs().length === 0, size: Math.min(1, docs().length) }),
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
        exists: Object.hasOwn(store[r.collection] || {}, r.id),
        data: () => clone((store[r.collection] || {})[r.id]),
      }),
      set: (r: any, value: any, options?: { merge?: boolean }) => writes.push(() => {
        store[r.collection] ||= {};
        const prev = options?.merge ? { ...(store[r.collection][r.id] || {}) } : {};
        const merged = { ...prev, ...clone(value) };
        for (const [k, v] of Object.entries(value)) {
          if (v && typeof v === 'object' && (v as any).__op === 'delete') {
            delete merged[k];
          }
        }
        store[r.collection][r.id] = merged;
      }),
      delete: (r: any) => writes.push(() => {
        if (store[r.collection]) delete store[r.collection][r.id];
      }),
    });
    writes.forEach((write) => write());
  },
};

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { delete: () => ({ __op: 'delete' }) },
}));

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
jest.mock('@/lib/generic-json-store', () => ({
  readGenericJsonFile: jest.fn(async () => null),
  syncGenericJsonFile: jest.fn(async () => undefined),
  leerGenericJsonParaGuardarEncima: jest.fn(async () => ({ sePudoLeer: true, datos: {} })),
}));
jest.mock('@/lib/backup/schedule-after-write', () => ({
  scheduleAutoBackupAfterWrite: jest.fn(async () => undefined),
}));
jest.mock('fs/promises', () => ({
  readFile: jest.fn(async () => { throw new Error('ENOENT'); }),
  writeFile: jest.fn(async () => undefined),
  mkdir: jest.fn(async () => undefined),
}));

import { saveInsumo, getInsumoById, invalidateInsumosCache } from '@/app/actions/insumos';
import { saveActivoFijo, getActivoFijoById } from '@/app/actions/activos-fijos';

const SEMBRADO = '2026-11-01T00:00:00.000Z';

beforeEach(async () => {
  for (const k of Object.keys(store)) delete store[k];
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
  await invalidateInsumosCache();
  store.insumos = {
    'ing-harina': {
      id: 'ing-harina',
      nombre: 'Harina',
      categoria: 'Insumos varios',
      unidad: 'Kg',
      valorUnitarioEstimado: 180,
      tipoItem: 'Insumo/Ingrediente',
      _syncedAt: SEMBRADO,
    },
  };
  store.activos_fijos = {
    lc_psitio: {
      id: 'lc_psitio',
      nombre: 'PLATOS DE SITIO',
      categoria: 'Vajilla (Activo)',
      unidad: 'Unidad',
      cantidadDisponible: 200,
      valorUnitarioEstimado: 150,
      tipoItem: 'Activo Fijo',
      _syncedAt: SEMBRADO,
    },
  };
  store.menus_catering = {};
});

describe('Orden 377 — Guardar insumo y activo fijo y releer', () => {
  it('el insumo guarda el nombre nuevo, limpia el caché y al releer devuelve el valor nuevo', async () => {
    const antes = await getInsumoById('ing-harina');
    expect(antes?.nombre).toBe('Harina');

    const res = await saveInsumo({ ...antes!, nombre: 'ROBOT-12345' });
    expect(res.success).toBe(true);

    const releido = await getInsumoById('ing-harina');
    expect(releido?.nombre).toBe('ROBOT-12345');
  });

  it('el activo fijo guarda el nombre nuevo y al releer devuelve el valor nuevo', async () => {
    const antes = await getActivoFijoById('lc_psitio');
    expect(antes?.nombre).toBe('PLATOS DE SITIO');

    const res = await saveActivoFijo({ ...antes!, nombre: 'ROBOT-67890' } as any);
    expect(res.success).toBe(true);

    const releido = await getActivoFijoById('lc_psitio');
    expect(releido?.nombre).toBe('ROBOT-67890');
  });
});
