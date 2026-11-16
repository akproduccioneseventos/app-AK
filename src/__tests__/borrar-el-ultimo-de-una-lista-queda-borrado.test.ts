/**
 * Orden 292 — Bloque 1: Borrar el último de una lista queda borrado en Firestore.
 *
 * task-templates.json, deco-canvas-templates.json y marketing-templates.json permiten vaciarse.
 * Para los archivos que no permiten vaciarse, writeToFirestore lanza error en lugar de fingir éxito.
 */

type Doc = Record<string, any>;
const base: Record<string, Map<string, Doc>> = {};
let reloj = 0;
const sello = () => `2026-11-13T10:00:${String(++reloj).padStart(6, '0')}Z`;
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const col = (n: string) => (base[n] ??= new Map());

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
  const docs = [...col(coleccion).entries()].map(([id, d]) => ({ id, data: () => copia(d), ref: docRef(coleccion, id) }));
  return { empty: docs.length === 0, docs };
}

const fakeDb = {
  collection: (n: string) => ({
    get: async () => snapshotDe(n),
    doc: (id: string) => docRef(n, id),
    _esColeccion: n,
  }),
  runTransaction: async (fn: (tx: any) => Promise<any>) => {
    const ops: Array<() => void> = [];
    const tx = {
      get: async (q: any) => (q._esColeccion ? snapshotDe(q._esColeccion) : q.get()),
      set: (ref: any, datos: Doc, opts?: { merge?: boolean }) => ops.push(() => {
        const c = col(ref._col);
        c.set(ref.id, opts?.merge ? { ...(c.get(ref.id) || {}), ...copia(datos) } : copia(datos));
      }),
      delete: (ref: any) => ops.push(() => { col(ref._col).delete(ref.id); }),
    };
    const r = await fn(tx);
    ops.forEach((op) => op());
    return r;
  },
  batch: () => {
    const ops: Array<() => void> = [];
    return {
      set: (ref: any, d: Doc, o?: any) => ops.push(() => { void ref.set(d, o); }),
      delete: (ref: any) => ops.push(() => { col(ref._col).delete(ref.id); }),
      commit: async () => ops.forEach((op) => op()),
    };
  },
};

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: fakeDb }));
jest.mock('fs/promises', () => ({ mkdir: jest.fn(), writeFile: jest.fn(), readFile: jest.fn(async () => { throw new Error('sin archivo'); }) }));
jest.mock('@/app/actions/backup', () => ({ triggerAutoBackup: jest.fn() }));

import { readData, writeData } from '@/lib/data-service';

function sembrar(coleccion: string, items: Doc[]) {
  base[coleccion] = new Map(items.map((i) => [i.id, { ...i, _syncedAt: sello() }]));
}

describe('Bloque 1 — Borrar el último de una lista queda borrado', () => {
  const antes = process.env.AK_USE_LOCAL_JSON_ONLY;

  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    for (const k of Object.keys(base)) delete base[k];
  });

  afterAll(() => {
    if (antes === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = antes;
  });

  it('con una sola plantilla de tareas, borrarla deja la colección vacía en la base', async () => {
    sembrar('task_templates', [{ id: 't1', title: 'Tarea única', category: 'General' }]);
    expect(col('task_templates').size).toBe(1);

    await writeData('task-templates.json', []);

    expect(col('task_templates').size).toBe(0);
    const leido = await readData<any[]>('task-templates.json', []);
    expect(leido).toEqual([]);
  });

  it('con una plantilla de deco-canvas y marketing, borrarlas deja las colecciones vacías', async () => {
    sembrar('deco_canvas_templates', [{ id: 'c1', name: 'Canvas 1' }]);
    sembrar('marketing_templates', [{ id: 'm1', name: 'Mkt 1' }]);

    await writeData('deco-canvas-templates.json', []);
    await writeData('marketing-templates.json', []);

    expect(col('deco_canvas_templates').size).toBe(0);
    expect(col('marketing_templates').size).toBe(0);
  });

  it('en un archivo que no permite vaciarse, la escritura vacía tira error y no borra los datos', async () => {
    sembrar('servicios', [{ id: 's1', nombre: 'Servicio 1' }, { id: 's2', nombre: 'Servicio 2' }]);
    expect(col('servicios').size).toBe(2);

    await expect(writeData('servicios-empresa.json', []))
      .rejects.toThrow('No se guardó: la lista quedaría vacía y este archivo no permite vaciarse');

    // La base conserva intactos los 2 documentos
    expect(col('servicios').size).toBe(2);
    expect(col('servicios').has('s1')).toBe(true);
    expect(col('servicios').has('s2')).toBe(true);
  });
});
