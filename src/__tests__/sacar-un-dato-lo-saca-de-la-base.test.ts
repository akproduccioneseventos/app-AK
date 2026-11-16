/**
 * Orden 292 — Bloque 2: Sacar un dato lo saca también de la base.
 *
 * En actualizaciones parciales con merge: true (updateFiestaPartial, mutateDataItem),
 * los campos con valor undefined deben enviarse como FieldValue.delete().
 * updateMenuAsignado(id, undefined) elimina menuAsignadoId del documento en Firestore.
 */

import { FieldValue } from 'firebase-admin/firestore';

type Doc = Record<string, any>;
const mockBase: Record<string, Map<string, Doc>> = {};
const col = (n: string) => (mockBase[n] ??= new Map());

function isDeleteSentinel(val: any): boolean {
  if (!val) return false;
  if (val === FieldValue.delete()) return true;
  if (typeof val === 'object' && (val.isEqual?.(FieldValue.delete()) || val._methodName === 'delete' || val.constructor?.name?.includes('Delete'))) {
    return true;
  }
  return false;
}

const mockDocSetCalls: Array<{ collection: string; id: string; data: any; options?: any }> = [];

function docRef(coleccion: string, id: string) {
  return {
    id,
    _col: coleccion,
    get: async () => {
      const d = col(coleccion).get(id);
      return { exists: Boolean(d), id, data: () => (d ? JSON.parse(JSON.stringify(d)) : undefined) };
    },
    set: async (datos: Doc, opts?: { merge?: boolean }) => {
      mockDocSetCalls.push({ collection: coleccion, id, data: datos, options: opts });
      if (opts?.merge) {
        const actual = { ...(col(coleccion).get(id) || {}) };
        for (const [k, v] of Object.entries(datos)) {
          if (isDeleteSentinel(v)) {
            delete actual[k];
          } else {
            actual[k] = v;
          }
        }
        col(coleccion).set(id, actual);
      } else {
        col(coleccion).set(id, JSON.parse(JSON.stringify(datos)));
      }
    },
  };
}

function snapshotDe(coleccion: string) {
  const docs = [...col(coleccion).entries()].map(([id, d]) => ({ id, data: () => JSON.parse(JSON.stringify(d)), ref: docRef(coleccion, id) }));
  return { empty: docs.length === 0, docs };
}

const mockDb = {
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
        void ref.set(datos, opts);
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

jest.mock('@/lib/firebase/server', () => ({
  get dbAdmin() {
    return mockDb;
  },
}));
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(async () => { throw new Error('sin archivo local'); }),
}));
jest.mock('@/app/actions/backup', () => ({ triggerAutoBackup: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => {}),
  requirePermiso: jest.fn(async () => {}),
  requirePermisoAlguno: jest.fn(async () => {}),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => {}),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { id: 'u1', username: 'admin', role: 'admin', permissions: ['*'] },
  }),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueSePuedaGuardar: jest.fn(async () => {}),
}));

import { updateMenuAsignado } from '@/app/actions/fiesta/catering.actions';
import { mutateDataItem, readData } from '@/lib/data-service';
import { sanitizeForFirestore } from '@/lib/firebase-sync';

describe('Bloque 2 — Sacar un dato lo saca también de la base', () => {
  const antes = process.env.AK_USE_LOCAL_JSON_ONLY;

  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    for (const k of Object.keys(mockBase)) delete mockBase[k];
    mockDocSetCalls.length = 0;
  });

  afterAll(() => {
    if (antes === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = antes;
  });

  it('sanitizeForFirestore con deleteUndefined envía FieldValue.delete() en campos undefined', () => {
    const objeto = { nombre: 'Fiesta', menuAsignadoId: undefined, catering: { sub: undefined } };
    const sanitizado = sanitizeForFirestore(objeto, { deleteUndefined: true }) as any;

    expect(sanitizado.nombre).toBe('Fiesta');
    expect(isDeleteSentinel(sanitizado.menuAsignadoId)).toBe(true);
  });

  it('updateMenuAsignado(id, undefined) borra menuAsignadoId de la base en fiestas/${id}', async () => {
    // 1. Sembrar fiesta con menuAsignadoId en la base
    col('fiestas').set('f_test_01', {
      id: 'f_test_01',
      nombre: 'Mis 15 Sofía',
      menuAsignadoId: 'menu_formal_15',
      estado: 'Planificación',
    });

    expect(col('fiestas').get('f_test_01')?.menuAsignadoId).toBe('menu_formal_15');

    // 2. Desasignar el menú
    const res = await updateMenuAsignado('f_test_01', undefined);
    expect(res.success).toBe(true);

    // 3. Verificar que la llamada a Firestore se envió con FieldValue.delete()
    const ultimaLlamada = mockDocSetCalls.find(c => c.collection === 'fiestas' && c.id === 'f_test_01');
    expect(ultimaLlamada).toBeDefined();
    expect(isDeleteSentinel(ultimaLlamada?.data?.menuAsignadoId)).toBe(true);

    // 4. Verificar que menuAsignadoId ya NO existe en el documento de la base
    const fiestaEnBase = col('fiestas').get('f_test_01');
    expect(fiestaEnBase).toBeDefined();
    expect(fiestaEnBase?.nombre).toBe('Mis 15 Sofía');
    expect('menuAsignadoId' in fiestaEnBase!).toBe(false);
  });

  it('mutateDataItem envía FieldValue.delete() en campos que cambian a undefined', async () => {
    col('prospectos').set('lead_01', {
      id: 'lead_01',
      name: 'Juan Perez',
      presupuestoId: 'presupuesto_123',
    });

    await mutateDataItem('crm-leads.json', 'prospectos', 'lead_01', (actual: any) => ({
      ...actual,
      presupuestoId: undefined,
    }));

    const enBase = col('prospectos').get('lead_01');
    expect(enBase).toBeDefined();
    expect('presupuestoId' in enBase!).toBe(false);
  });

  it('mutateDataItem borra en la base un campo que el cambio sacó del registro', async () => {
    col('prospectos').set('lead_02', {
      id: 'lead_02',
      name: 'Ana',
      sentAt: '2026-11-01',
      sentBy: 'equipo',
    });

    await mutateDataItem('crm-leads.json', 'prospectos', 'lead_02', (actual: any) => {
      const next = { ...actual };
      delete next.sentAt;
      delete next.sentBy;
      return next;
    });

    const enBase = col('prospectos').get('lead_02');
    expect(enBase?.name).toBe('Ana');
    expect('sentAt' in enBase!).toBe(false);
    expect('sentBy' in enBase!).toBe(false);
  });
});
