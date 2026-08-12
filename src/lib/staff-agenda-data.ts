import type { FiestaEnPlanificacion } from '@/types/fiesta';

const AGENDA_READ_TIMEOUT_MS = 7_000;

export async function readActiveFiestasForStaffAgenda(
  localFallback: () => Promise<FiestaEnPlanificacion[]>,
): Promise<FiestaEnPlanificacion[]> {
  if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') return localFallback();

  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) {
    if (process.env.NODE_ENV !== 'production') return localFallback();
    throw new Error('No se pudo verificar la agenda porque Firestore no está disponible.');
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const snapshot = await Promise.race([
      dbAdmin.collection('fiestas').get(),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('La lectura de agenda superó el tiempo permitido.')),
          AGENDA_READ_TIMEOUT_MS,
        );
      }),
    ]);

    return snapshot.docs
      .map(doc => {
        const { _syncedAt: _internalTimestamp, ...data } = doc.data();
        return { ...data, id: String(data.id || doc.id) } as FiestaEnPlanificacion;
      })
      .filter(fiesta => fiesta.estado !== 'Archivado');
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'error desconocido';
    throw new Error(`No se pudo verificar la agenda en Firestore: ${detail}`);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
