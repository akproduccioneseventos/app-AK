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

function credentialsForItem(item: OfflineMediaItem, scope: OfflineSyncScope) {
  if (scope.fiestaId && item.fiestaId !== scope.fiestaId) return {};
  if (scope.moduleId && item.moduleId !== scope.moduleId) return {};
  return scope;
}

export async function processOfflineMediaQueue(scope: OfflineSyncScope = {}): Promise<{
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
        const runtimeCredentials = credentialsForItem(item, scope);

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

        if (!success) throw new Error('El servidor no confirmo la recepcion');
        await removeOfflineMedia(item.id);
        processed++;
      } catch (err: any) {
        errors++;
        console.warn(`[OfflineSync] Error al subir captura ${item.id}:`, err.message);
        await updateOfflineMediaAttempt(item.id, err.message || 'Error de conexion');
        // La captura se conserva hasta que el servidor confirme la subida.
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
