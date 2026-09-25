/**
 * MATAFUEGO DE RAIZ — Guardar una lista entera no pisa ni borra lo que otro hizo mientras tanto.
 *
 * 25 de septiembre de 2026. Codex encontraba, una por una, la misma falla en distintos
 * lugares (incidentes, encuestas, prospectos, cobros...): la app lee la lista entera, cambia un
 * renglon y guarda la lista entera. Con dos personas a la vez, el segundo deshacia lo del
 * primero o borraba lo que el primero creo, y las dos pantallas decian "guardado". Habia unos
 * 160 lugares con esa forma.
 *
 * Se arreglo una sola vez, donde se guarda todo (`src/lib/marca-de-lectura.ts` y
 * `syncToFirestore`). Esta prueba usa el `readData` / `writeData` de verdad contra una base de
 * mentira que se comporta como la real: devuelve copias, las transacciones se confirman al
 * final, y cada documento lleva su `_syncedAt`.
 *
 * Se probo rompiendolo: con el guardado de antes, "dos personas cambian renglones distintos" y
 * "lo que otro creo no se borra" se ponen en rojo, y "los dos cambian el mismo" guarda en
 * silencio el ultimo.
 */
type Doc = Record<string, any>;
const base: Record<string, Map<string, Doc>> = {};
let reloj = 0;
const sello = () => `2026-09-25T10:00:${String(++reloj).padStart(6, '0')}Z`;
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

// Una coleccion cualquiera de las que se guardan como lista entera.
const ARCHIVO = 'incidentes.json';
const COLECCION = 'incidentes';

function sembrar(items: Doc[]) {
  base[COLECCION] = new Map(items.map((i) => [i.id, { ...i, _syncedAt: sello() }]));
}
const enLaBase = () => [...col(COLECCION).values()].map(({ _syncedAt, ...r }) => r).sort((a, b) => a.id.localeCompare(b.id));

describe('Guardar la lista entera no pisa lo de otro', () => {
  const antes = process.env.AK_USE_LOCAL_JSON_ONLY;
  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    sembrar([{ id: 'a', estado: 'Abierto' }, { id: 'b', estado: 'Abierto' }]);
  });
  afterAll(() => {
    if (antes === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = antes;
  });

  it('dos personas cambian renglones distintos: quedan los dos cambios', async () => {
    const deAna = await readData<Doc[]>(ARCHIVO, []);
    const deBeto = await readData<Doc[]>(ARCHIVO, []);
    await writeData(ARCHIVO, deBeto.map((i) => (i.id === 'b' ? { ...i, estado: 'Resuelto' } : i)));
    await writeData(ARCHIVO, deAna.map((i) => (i.id === 'a' ? { ...i, estado: 'En curso' } : i)));
    expect(enLaBase()).toEqual([{ id: 'a', estado: 'En curso' }, { id: 'b', estado: 'Resuelto' }]);
  });

  it('lo que otro creó mientras tanto no se borra, y lo que uno borró sí', async () => {
    const deAna = await readData<Doc[]>(ARCHIVO, []);
    const deBeto = await readData<Doc[]>(ARCHIVO, []);
    await writeData(ARCHIVO, [...deBeto, { id: 'c', estado: 'Abierto' }]);
    await writeData(ARCHIVO, deAna.filter((i) => i.id !== 'b'));
    expect(enLaBase().map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('los dos cambian el MISMO renglón: el segundo recibe un aviso y no pisa al primero', async () => {
    const deAna = await readData<Doc[]>(ARCHIVO, []);
    const deBeto = await readData<Doc[]>(ARCHIVO, []);
    await writeData(ARCHIVO, deBeto.map((i) => (i.id === 'a' ? { ...i, estado: 'Resuelto' } : i)));
    await expect(writeData(ARCHIVO, deAna.map((i) => (i.id === 'a' ? { ...i, estado: 'Cerrado' } : i))))
      .rejects.toThrow(/cambió/);
    expect(enLaBase().find((i) => i.id === 'a')!.estado).toBe('Resuelto');
  });

  it('la marca de lectura nunca queda guardada en la base', async () => {
    const lista = await readData<Doc[]>(ARCHIVO, []);
    await writeData(ARCHIVO, lista.map((i) => ({ ...i, nota: 'x' })));
    expect([...col(COLECCION).values()].some((d) => '_leido' in d)).toBe(false);
  });

  it('una lista armada de cero (sin haber leído) reemplaza como siempre: no se rompe lo que andaba', async () => {
    await writeData(ARCHIVO, [{ id: 'z', estado: 'Abierto' }]);
    expect(enLaBase().map((i) => i.id)).toEqual(['z']);
  });

  it('un renglón nuevo agregado a lo leído se guarda y no borra nada', async () => {
    const lista = await readData<Doc[]>(ARCHIVO, []);
    await writeData(ARCHIVO, [...lista, { id: 'z', estado: 'Abierto' }]);
    expect(enLaBase().map((i) => i.id)).toEqual(['a', 'b', 'z']);
  });
});
