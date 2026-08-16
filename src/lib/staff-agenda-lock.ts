import { randomUUID } from 'crypto';
import { dbAdmin } from '@/lib/firebase/server';

const LOCK_COLLECTION = 'agenda_personal_locks';
// Supera ampliamente el tiempo de lectura/guardado normal y aun se recupera
// solo si una instancia cae antes de liberar el bloqueo.
const LOCK_LEASE_MS = 5 * 60_000;

export async function acquireStaffAgendaLocks(
  empleadoIds: string[],
): Promise<() => Promise<void>> {
  const ids = [...new Set(empleadoIds.filter(Boolean))].sort();
  const db = dbAdmin;
  if (ids.length === 0 || !db) return async () => undefined;

  const owner = randomUUID();
  const expiresAtMs = Date.now() + LOCK_LEASE_MS;
  const refs = ids.map(id => db.collection(LOCK_COLLECTION).doc(id));

  await db.runTransaction(async transaction => {
    const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
    const ocupado = snapshots.find(snapshot => {
      const data = snapshot.data();
      return snapshot.exists && data?.owner !== owner && Number(data?.expiresAtMs || 0) > Date.now();
    });

    if (ocupado) {
      throw new Error('La agenda de este empleado se está actualizando. Esperá unos segundos y volvé a intentar.');
    }

    for (const ref of refs) {
      transaction.set(ref, { owner, expiresAtMs, updatedAt: new Date().toISOString() });
    }
  });

  return async () => {
    try {
      await db.runTransaction(async transaction => {
        const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
        snapshots.forEach((snapshot, index) => {
          if (snapshot.exists && snapshot.data()?.owner === owner) {
            transaction.delete(refs[index]);
          }
        });
      });
    } catch (error) {
      console.warn('[staff-agenda-lock] No se pudo liberar un bloqueo; vencerá automáticamente.', error);
    }
  };
}
