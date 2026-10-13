import { createHash } from 'node:crypto';
import { dbAdmin } from '@/lib/firebase/server';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu } from '@/types/catering';

type ReciboAjuste = { porcentaje: number; ids: string[]; terminado: boolean };
export class AjusteNoIniciadoError extends Error {}

function referencias(operationId: string) {
  if (!dbAdmin) throw new Error('Firestore no esta disponible. No se aplico el ajuste.');
  const id = createHash('sha256').update(operationId).digest('hex');
  return {
    db: dbAdmin,
    recibo: dbAdmin.collection('ajustes_costos_insumos').doc(id),
    turno: dbAdmin.collection('ajustes_costos_insumos').doc('_turno'),
    id,
  };
}

/** El porcentaje y su recibo se guardan juntos: perder la respuesta no vuelve a multiplicar. */
export async function comenzarAjusteCostos(percentage: number, operationId: string, pendientesAnteriores?: string[]): Promise<ReciboAjuste> {
  const { db, recibo, turno, id } = referencias(operationId);
  return db.runTransaction(async transaction => {
    const anterior = await transaction.get(recibo);
    if (anterior.exists) {
      const datos = anterior.data() as ReciboAjuste;
      if (datos.porcentaje !== percentage) throw new AjusteNoIniciadoError('Ese ajuste ya se envio con otro porcentaje. Reintenta el original.');
      return datos;
    }
    const ocupado = await transaction.get(turno);
    if (ocupado.data()?.operacion) throw new AjusteNoIniciadoError('Hay un ajuste sin terminar. La persona que lo inicio debe reintentarlo antes de iniciar otro.');
    const inventario = await transaction.get(db.collection('insumos'));
    if (inventario.empty) throw new AjusteNoIniciadoError('No hay insumos en el catalogo para ajustar.');
    // No dividir una operacion monetaria en lotes que pudieran quedar aplicados a medias.
    if (!pendientesAnteriores && inventario.size > 498) throw new AjusteNoIniciadoError('El catalogo supera el limite de este ajuste seguro. No se cambio ningun costo.');
    for (const item of inventario.docs) {
      const costo = item.data().valorUnitarioEstimado;
      if (costo !== undefined && (!Number.isFinite(Number(costo)) || Number(costo) < 0)) {
        throw new AjusteNoIniciadoError(`El insumo ${item.id} tiene un costo invalido. No se aplico el ajuste.`);
      }
      if (!pendientesAnteriores && costo !== undefined && !Number.isSafeInteger(Math.round(Number(costo) * (1 + percentage / 100)))) {
        throw new AjusteNoIniciadoError(`El costo ajustado de ${item.id} supera la precision segura. No se aplico el ajuste.`);
      }
    }
    const fecha = new Date().toISOString();
    const datos: ReciboAjuste = { porcentaje: percentage, ids: pendientesAnteriores ?? inventario.docs.map(item => item.id), terminado: false };
    for (const item of inventario.docs) {
      const costo = item.data().valorUnitarioEstimado;
      if (!pendientesAnteriores && costo !== undefined) transaction.update(item.ref, {
        valorUnitarioEstimado: Math.round(Number(costo) * (1 + percentage / 100)),
        _syncedAt: fecha,
      });
    }
    transaction.create(recibo, { ...datos, id, fecha });
    transaction.set(turno, { id: '_turno', operacion: id, porcentaje: percentage, fecha });
    return datos;
  });
}

export async function leerInsumosParaAjuste(): Promise<ServicioEmpresa[]> {
  if (!dbAdmin) throw new Error('Firestore no esta disponible.');
  const snapshot = await dbAdmin.collection('insumos').get();
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id } as ServicioEmpresa));
}

/** Un reintento lento no puede llevar precios viejos a un menu despues del ajuste siguiente. */
export async function cambiarMenuDuranteAjuste(
  operationId: string,
  menuId: string,
  cambiar: (actual: FullMenu, catalogo: ServicioEmpresa[]) => FullMenu,
): Promise<void> {
  const { db, recibo, turno, id } = referencias(operationId);
  await db.runTransaction(async transaction => {
    const estado = await transaction.get(recibo);
    const ocupado = await transaction.get(turno);
    if (estado.data()?.terminado) return;
    if (!estado.exists || ocupado.data()?.operacion !== id) throw new Error('El ajuste ya no tiene el turno de los menus. Reintenta para confirmar su estado.');
    const ref = db.collection('menus_catering').doc(menuId);
    const menu = await transaction.get(ref);
    if (!menu.exists) return;
    const inventario = await transaction.get(db.collection('insumos'));
    const catalogo = inventario.docs.map(item => ({ ...item.data(), id: item.id } as ServicioEmpresa));
    const nuevo = cambiar({ ...menu.data(), id: menu.id } as FullMenu, catalogo);
    transaction.set(ref, { ...JSON.parse(JSON.stringify(nuevo)), _syncedAt: new Date().toISOString() });
  });
}

export async function terminarAjusteCostos(operationId: string): Promise<void> {
  const { db, recibo, turno, id } = referencias(operationId);
  await db.runTransaction(async transaction => {
    const datos = await transaction.get(recibo);
    const ocupado = await transaction.get(turno);
    if (!datos.exists) throw new Error('No se encontro el recibo del ajuste.');
    transaction.update(recibo, { terminado: true });
    if (ocupado.data()?.operacion === id) transaction.delete(turno);
  });
}
