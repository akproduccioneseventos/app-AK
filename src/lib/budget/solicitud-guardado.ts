import 'server-only';
import { createHash } from 'crypto';
import type { Presupuesto } from '@/types/presupuesto';
import { mutateDataItem } from '@/lib/data-service';

type PresupuestoSolicitado = Presupuesto & {
  _solicitudCreacion?: { cargaHash: string; seguimientoConfirmado: boolean };
};
export interface SolicitudGuardado { id: string; cargaHash: string }

function ordenado(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordenado);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, ordenado(v)]));
  }
  return value;
}

export function prepararSolicitudGuardado(clave: string, actor: string, carga: object): SolicitudGuardado {
  if (!actor || typeof clave !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(clave)) {
    throw new Error('El identificador de guardado no es valido.');
  }
  const { timestamp: _timestamp, ...estable } = carga as Record<string, unknown>;
  return {
    id: 'pres_request_' + createHash('sha256').update(JSON.stringify([actor, clave])).digest('hex'),
    cargaHash: createHash('sha256').update(JSON.stringify(ordenado(estable))).digest('hex'),
  };
}

export async function crearPresupuestoSolicitado(presupuesto: Presupuesto, solicitud: SolicitudGuardado) {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin || process.env.AK_USE_LOCAL_JSON_ONLY === 'true') throw new Error('La base no esta disponible para confirmar el guardado.');
  const collection = dbAdmin.collection('presupuestos');
  const ref = collection.doc(solicitud.id);
  const counter = dbAdmin.collection('commercial_counters').doc('presupuestos');
  return dbAdmin.runTransaction(async transaction => {
    const actual = await transaction.get(ref);
    if (actual.exists) {
      const stored = actual.data() as PresupuestoSolicitado;
      if (stored._solicitudCreacion?.cargaHash !== solicitud.cargaHash) {
        throw new Error('Este intento ya corresponde a otra cotizacion. No se sobrescribio el presupuesto.');
      }
      return { presupuesto: { ...stored, id: ref.id }, reused: true,
        seguimientoConfirmado: stored._solicitudCreacion.seguimientoConfirmado };
    }
    // Leer numeros dentro de la transaccion: otro servidor puede crear al mismo tiempo.
    const [numbers, sequence] = await Promise.all([transaction.get(collection.select('numero')), transaction.get(counter)]);
    const max = numbers.docs.reduce((n, doc) => Math.max(n, Number(doc.data().numero) || 0), 0);
    const numero = Math.max(max, Number(sequence.data()?.lastNumber) || 0) + 1;
    const next: PresupuestoSolicitado = JSON.parse(JSON.stringify({ ...presupuesto, id: ref.id, numero,
      _solicitudCreacion: { cargaHash: solicitud.cargaHash, seguimientoConfirmado: false } }));
    transaction.create(ref, { ...next, _syncedAt: new Date().toISOString() });
    transaction.set(counter, { lastNumber: numero, updatedAt: new Date().toISOString() }, { merge: true });
    return { presupuesto: next, reused: false, seguimientoConfirmado: false };
  });
}

export async function confirmarSeguimientoSolicitud(id: string, leadId: string) {
  const result = await mutateDataItem<PresupuestoSolicitado>('presupuestos.json', 'presupuestos', id, actual => {
    if (!actual._solicitudCreacion) return null;
    return { ...actual, leadId, _solicitudCreacion: { ...actual._solicitudCreacion, seguimientoConfirmado: true } };
  });
  if (!result) throw new Error('El seguimiento del presupuesto no pudo confirmarse.');
  return result;
}
