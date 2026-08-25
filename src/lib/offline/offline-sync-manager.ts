'use client';

import {
  getPendingOfflineMedia,
  removeOfflineMedia,
  updateOfflineMediaAttempt,
  type OfflineMediaItem,
} from './offline-db';
import { uploadEntretenimientoMedia } from '@/app/actions/fiesta/entretenimiento.actions';
import { uploadTouchpixPhoto } from '@/app/actions/touchpix-ai';
import { uploadBuzonMessage } from '@/app/actions/buzon';
import { saveLifeStoryVideoPhoto } from '@/app/actions/fiesta/video-vida.actions';
import { classifyOfflineUploadError } from './offline-upload-policy';

let isSyncing = false;

/**
 * Procesa la cola de subidas de IndexedDB elemento por elemento.
 */
export interface OfflineSyncScope {
  fiestaId?: string;
  moduleId?: string;
  accessToken?: string;
  guestId?: string;
  guestAccessToken?: string;
}

export function resolveOfflineMediaCredentials(item: OfflineMediaItem, scope: OfflineSyncScope) {
  const matchesScopeEvent = !scope.fiestaId || item.fiestaId === scope.fiestaId;
  const matchesScopeModule = !scope.moduleId || item.moduleId === scope.moduleId;
  const renewedStationToken = matchesScopeEvent && matchesScopeModule
    ? scope.accessToken
    : undefined;

  return {
    // La identidad del invitado pertenece EXCLUSIVAMENTE al ítem que la guardó.
    // Nunca asociar una captura anónima o de otro invitado al guestId que esté activo en el navegador al sincronizar.
    guestId: item.guestId,
    guestAccessToken: item.guestAccessToken,
    // La estación sí puede renovar su token al reabrirse. Preferir el nuevo evita
    // que una captura quede atrapada para siempre con la credencial vencida.
    accessToken: renewedStationToken || item.accessToken,
  };
}

/**
 * Traba entre pestañas: sin esto, dos pestañas abiertas en la misma estacion leen
 * la cola al mismo tiempo y suben la MISMA foto dos veces, que aparece duplicada
 * en el muro. El candado `isSyncing` es de cada pestaña y no alcanza.
 * `navigator.locks` es del navegador y lo comparten todas las pestañas del mismo
 * sitio. Si el navegador no lo tiene, se sigue como antes.
 */
async function conTrabaEntreSolapas<T>(tarea: () => Promise<T>, siOcupado: T): Promise<T> {
  const locks = (typeof navigator !== 'undefined' ? (navigator as any).locks : undefined);
  if (!locks?.request) return tarea();
  const resultado = await locks.request(
    'ak-cola-sin-internet',
    { ifAvailable: true },
    async (lock: unknown) => (lock ? tarea() : siOcupado),
  );
  return resultado as T;
}

export async function processOfflineMediaQueue(scope: OfflineSyncScope = {}): Promise<{
  processed: number;
  remaining: number;
  errors: number;
}> {
  return conTrabaEntreSolapas(
    () => procesarColaSinTraba(scope),
    { processed: 0, remaining: 0, errors: 0 },
  );
}

async function procesarColaSinTraba(scope: OfflineSyncScope = {}): Promise<{
  processed: number;
  remaining: number;
  errors: number;
}> {
  const getScopedQueue = async () => {
    const pending = await getPendingOfflineMedia(scope.fiestaId);
    return scope.moduleId
      ? pending.filter(item => item.moduleId === scope.moduleId)
      : pending;
  };

  if (typeof window === 'undefined' || !navigator.onLine || isSyncing) {
    const pending = await getScopedQueue();
    return { processed: 0, remaining: pending.length, errors: 0 };
  }

  isSyncing = true;
  let processed = 0;
  let errors = 0;

  try {
    const queue = await getScopedQueue();

    for (const item of queue) {
      if (!navigator.onLine) break;

      try {
        let success = false;
        const file = new File([item.fileBlob], item.fileName, { type: item.mimeType });
        const runtimeCredentials = resolveOfflineMediaCredentials(item, scope);

        if (item.moduleId === 'touchpix') {
          const formData = new FormData();
          formData.append('fiestaId', item.fiestaId);
          formData.append('file', file);
          formData.append('authorName', item.authorName);
          if (item.metadata?.selectedTheme) formData.append('themeLabel', item.metadata.selectedTheme);
          if (item.metadata?.character) formData.append('characterLabel', item.metadata.character);
          if (runtimeCredentials.guestId) formData.append('guestId', runtimeCredentials.guestId);
          if (runtimeCredentials.guestAccessToken) formData.append('guestAccessToken', runtimeCredentials.guestAccessToken);
          if (runtimeCredentials.accessToken) formData.append('accessToken', runtimeCredentials.accessToken);

          const res = await uploadTouchpixPhoto(formData);
          success = !!res?.success;
          if (!success && res?.error) throw new Error(res.error);
        } else if (item.moduleId === 'buzon') {
          const formData = new FormData();
          formData.append('fiestaId', item.fiestaId);
          formData.append('file', file);
          formData.append('authorName', item.authorName || 'Invitado');
          formData.append('mediaType', item.metadata?.mediaType || 'audio');
          if (runtimeCredentials.accessToken) formData.append('accessToken', runtimeCredentials.accessToken);
          if (item.metadata?.timeCapsuleYears) formData.append('timeCapsuleYears', String(item.metadata.timeCapsuleYears));
          if (item.metadata?.recipientNote) formData.append('recipientNote', item.metadata.recipientNote);

          const res = await uploadBuzonMessage(formData);
          success = !!res?.success;
          if (!success && res?.error) throw new Error(res.error);
        } else if (item.moduleId === 'video-vida') {
          const formData = new FormData();
          formData.append('fiestaId', item.fiestaId);
          formData.append('file', file);
          formData.append('photoNumber', String(item.metadata?.photoNumber || 1));
          const res = await saveLifeStoryVideoPhoto(formData);
          success = !!res?.success;
          if (!success && res?.error) throw new Error(res.error);
        } else {
          const formData = new FormData();
          formData.append('fiestaId', item.fiestaId);
          formData.append('file', file);
          formData.append('authorName', item.authorName || 'Puesto AK');
          formData.append('moduleId', item.moduleId);
          if (runtimeCredentials.accessToken) formData.append('accessToken', runtimeCredentials.accessToken);
          if (runtimeCredentials.guestId) formData.append('guestId', runtimeCredentials.guestId);
          if (runtimeCredentials.guestAccessToken) formData.append('guestAccessToken', runtimeCredentials.guestAccessToken);

          const res = await uploadEntretenimientoMedia(formData);
          success = !!res?.success;
          if (!success && res?.error) throw new Error(res.error);
        }

        if (!success) {
          throw new Error('El servidor no confirmo la recepcion');
        }
        await removeOfflineMedia(item.id);
        processed++;
      } catch (err: any) {
        errors++;
        const msg = String(err?.message || '');
        const decision = classifyOfflineUploadError(msg);
        if (decision === 'duplicate') {
          console.log(`[OfflineSync] Captura ${item.id} ya existía en el servidor. Quitando de la cola.`);
          await removeOfflineMedia(item.id);
          processed++;
        } else if (decision === 'permanent') {
          console.warn(`[OfflineSync] Descartando captura ${item.id} por error definitivo del servidor:`, msg);
          await removeOfflineMedia(item.id);
        } else {
          // NO se borra por cantidad de intentos.
          //
          // Habia un tope de tres y despues la foto se borraba sola. En un salon con
          // senal intermitente tres intentos se cumplen en minutos, y la foto del
          // invitado desaparecia **sin que nadie se entere**. La captura se conserva
          // hasta que el servidor confirme que la recibio o hasta que diga que no la
          // quiere; ocupar lugar de mas es mucho mas barato que perder la foto.
          console.warn(`[OfflineSync] Error al subir captura ${item.id} (intento ${item.attempts + 1}):`, msg);
          await updateOfflineMediaAttempt(item.id, msg || 'Error de conexion');
        }
      }
    }
  } finally {
    isSyncing = false;
  }

  const remainingItems = await getScopedQueue();
  return { processed, remaining: remainingItems.length, errors };
}

/**
 * Inicia los observadores globales para sincronizar automaticamente al recuperar senal.
 */
export function setupGlobalOfflineSync(scope: OfflineSyncScope = {}) {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    console.log('[OfflineSync] Señal restablecida. Sincronizando capturas pendientes...');
    void processOfflineMediaQueue(scope);
  };

  window.addEventListener('online', handleOnline);

  const interval = setInterval(() => {
    if (navigator.onLine) {
      void processOfflineMediaQueue(scope);
    }
  }, 20000);

  if (navigator.onLine) {
    void processOfflineMediaQueue(scope);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(interval);
  };
}
