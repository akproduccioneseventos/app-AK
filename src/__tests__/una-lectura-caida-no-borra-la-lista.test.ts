/** @jest-environment node */
/**
 * Orden 336 — A.1 y A.4:
 * Una lectura caída o vencida de Firestore nunca devuelve lista vacía sin marca de error
 * ni deja que `decidirGuardado` / `writeData` borren el resto de la colección.
 * Y `syncToFirestore` no cae a lotes sueltos sin transacción ante errores reales.
 */

type Doc = Record<string, any>;
const base: Record<string, Map<string, Doc>> = {};
let reloj = 0;
const sello = () => `2026-11-23T10:00:${String(++reloj).padStart(6, '0')}Z`;
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const col = (n: string) => (base[n] ??= new Map());

let modoLectura: 'ok' | 'error' | 'timeout' = 'ok';
let txErrorSimulado: Error | null = null;
const batchCommits: string[] = [];

function docRef(coleccion: string, id: string) {
  return {
    id,
    _col: coleccion,
    get: async () => {
      const d = col(coleccion).get(id);
      return { exists: Boolean(d), id, data: () => (d ? copia(d) : undefined) };
    },
    set: async (datos: Doc, opts?: { merge?: boolean }) => {
      col(coleccion).set(id, opts?.merge ? { ...(col(coleccion).get(id) || {}), ...copia(datos) } : copia(datos));
    },
  };
}

function snapshotDe(coleccion: string) {
  const docs = [...col(coleccion).entries()].map(([id, d]) => ({
    id,
    data: () => copia(d),
    ref: docRef(coleccion, id),
  }));
  return { empty: docs.length === 0, docs };
}

const fakeDb = {
  collection: (n: string) => ({
    get: async () => {
      if (modoLectura === 'error') throw new Error('UNAVAILABLE: Firestore caído');
      if (modoLectura === 'timeout') {
        await new Promise((r) => setTimeout(r, 4000));
      }
      return snapshotDe(n);
    },
    doc: (id: string) => docRef(n, id),
    _esColeccion: n,
  }),
  runTransaction: async (fn: (tx: any) => Promise<any>) => {
    if (txErrorSimulado) throw txErrorSimulado;
    const ops: Array<() => void> = [];
    const tx = {
      get: async (q: any) => (q._esColeccion ? snapshotDe(q._esColeccion) : q.get()),
      set: (ref: any, datos: Doc, opts?: { merge?: boolean }) =>
        ops.push(() => {
          const c = col(ref._col);
          c.set(ref.id, opts?.merge ? { ...(c.get(ref.id) || {}), ...copia(datos) } : copia(datos));
        }),
      delete: (ref: any) =>
        ops.push(() => {
          col(ref._col).delete(ref.id);
        }),
    };
    const r = await fn(tx);
    ops.forEach((op) => op());
    return r;
  },
  batch: () => {
    const ops: Array<() => void> = [];
    return {
      set: (ref: any, d: Doc, o?: any) =>
        ops.push(() => {
          void ref.set(d, o);
        }),
      delete: (ref: any) =>
        ops.push(() => {
          col(ref._col).delete(ref.id);
        }),
      commit: async () => {
        batchCommits.push('commit');
        ops.forEach((op) => op());
      },
    };
  },
};

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: fakeDb }));
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(async () => {
    throw new Error('sin archivo');
  }),
}));
jest.mock('@/app/actions/backup', () => ({ triggerAutoBackup: jest.fn() }));

import { readData, writeData, limpiarLecturasFallidasDePrueba } from '@/lib/data-service';
import { decidirGuardado, esLecturaFallida } from '@/lib/marca-de-lectura';
import { syncToFirestore } from '@/lib/firebase-sync';

const ARCHIVO = 'incidentes.json';
const COLECCION = 'incidentes';

function sembrar(items: Doc[]) {
  base[COLECCION] = new Map(items.map((i) => [i.id, { ...i, _syncedAt: sello() }]));
}

describe('Una lectura caída no borra la lista', () => {
  const prevLocal = process.env.AK_USE_LOCAL_JSON_ONLY;

  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    limpiarLecturasFallidasDePrueba();
    modoLectura = 'ok';
    txErrorSimulado = null;
    batchCommits.length = 0;
    sembrar([
      { id: 'a', estado: 'Abierto' },
      { id: 'b', estado: 'En curso' },
    ]);
  });

  afterAll(() => {
    if (prevLocal === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = prevLocal;
  });

  it('readData ante error devuelve lista vacía CON marca de lectura fallida y writeData con [...lista, nuevo] no borra el resto', async () => {
    modoLectura = 'error';
    const lista = await readData<Doc[]>(ARCHIVO, []);
    expect(lista).toEqual([]);
    expect(esLecturaFallida(lista)).toBe(true);

    // La base se recupera y el caller agrega un renglón usando spread `[...lista, nuevo]`
    modoLectura = 'ok';
    await writeData(ARCHIVO, [...lista, { id: 'c', estado: 'Abierto' }]);

    const idsRestantes = [...col(COLECCION).keys()].sort();
    expect(idsRestantes).toEqual(['a', 'b', 'c']);
  });

  it('readData ante timeout (3,5s+) marca la lectura como fallida y lista.push + writeData tampoco borra el resto', async () => {
    modoLectura = 'timeout';
    const lista = await readData<Doc[]>(ARCHIVO, []);
    expect(lista).toEqual([]);
    expect(esLecturaFallida(lista)).toBe(true);

    modoLectura = 'ok';
    lista.push({ id: 'd', estado: 'Abierto' });
    await writeData(ARCHIVO, lista);

    const idsRestantes = [...col(COLECCION).keys()].sort();
    expect(idsRestantes).toEqual(['a', 'b', 'd']);
  }, 10_000);

  it('decidirGuardado nunca marca documentos para borrar si lecturaFallida es true', () => {
    const enLaBase = new Map([
      ['a', '2026-11-23T10:00:00Z'],
      ['b', '2026-11-23T10:01:00Z'],
    ]);
    const decision = decidirGuardado(
      [{ id: 'nuevo' }],
      (x) => x.id,
      enLaBase,
      { lecturaFallida: true },
    );
    expect(decision.borrar).toEqual([]);
    expect(decision.escribir).toEqual([{ id: 'nuevo' }]);
  });

  it('readData sobre colección genuinamente vacía no marca falla', async () => {
    base['clientes'] = new Map();
    const lista = await readData<Doc[]>('customers.json', []);
    expect(lista).toEqual([]);
    expect(esLecturaFallida(lista)).toBe(false);
  });

  it('syncToFirestore no cae a lotes sueltos sin transacción cuando la transacción falla por error real', async () => {
    txErrorSimulado = new Error('DEADLINE_EXCEEDED: fallo de red');
    await expect(
      syncToFirestore(ARCHIVO, [{ id: 'a', estado: 'Resuelto' }]),
    ).rejects.toThrow(/DEADLINE_EXCEEDED/);
    expect(batchCommits).toHaveLength(0);
  });
});
