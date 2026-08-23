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
export async function processOfflineMediaQueue(): Promise<{
  processed: number;
  remaining: number;
  errors: number;
}> {
  if (typeof window === 'undefined' || !navigator.onLine || isSyncing) {
    const pending = await getPendingOfflineMedia();
    return { processed: 0, remaining: pending.length, errors: 0 };
  }

  isSyncing = true;
  let processed = 0;
  let errors = 0;

  try {
    const queue = await getPendingOfflineMedia();

    for (const item of queue) {
      // Si perdimos conexion a mitad de la cola, frenamos
      if (!navigator.onLine) break;

      try {
        let success = false;
        const file = new File([item.fileBlob], item.fileName, { type: item.mimeType });

        if (item.moduleId === 'touchpix') {
          const formData = new FormData();
          formData.append('fiestaId', item.fiestaId);
          formData.append('file', file);
          formData.append('authorName', item.authorName);
          if (item.metadata?.selectedTheme) formData.append('themeLabel', item.metadata.selectedTheme);
          if (item.metadata?.character) formData.append('characterLabel', item.metadata.character);
          if (item.metadata?.guestAccessToken) formData.append('guestAccessToken', item.metadata.guestAccessToken);
          if (item.metadata?.accessToken) formData.append('accessToken', item.metadata.accessToken);

          const res = await uploadTouchpixPhoto(formData);
          success = !!res?.success;
          if (!success && res?.error) throw new Error(res.error);
        } else if (item.moduleId === 'buzon') {
          const formData = new FormData();
          formData.append('fiestaId', item.fiestaId);
          formData.append('file', file);
          formData.append('authorName', item.authorName || 'Invitado');
          formData.append('mediaType', item.metadata?.mediaType || 'audio');
          if (item.metadata?.accessToken) formData.append('accessToken', item.metadata.accessToken);
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
          // Default: fotocabina, espejo-magico, plataforma-360, totem, muro-en-vivo
          const formData = new FormData();
          formData.append('fiestaId', item.fiestaId);
          formData.append('file', file);
          formData.append('authorName', item.authorName || 'Puesto AK');
          formData.append('moduleId', item.moduleId);
          if (item.metadata?.accessToken) formData.append('accessToken', item.metadata.accessToken);
          if (item.metadata?.guestId) formData.append('guestId', item.metadata.guestId);
          if (item.metadata?.guestAccessToken) formData.append('guestAccessToken', item.metadata.guestAccessToken);

          const res = await uploadEntretenimientoMedia(formData);
          success = !!res?.success;
          if (!success && res?.error) throw new Error(res.error);
        }

        if (success) {
          await removeOfflineMedia(item.id);
          processed++;
        } else {
          throw new Error('El servidor no confirmo la recepcion');
        }
      } catch (err: any) {
        errors++;
        console.warn(`[OfflineSync] Error al subir captura ${item.id}:`, err.message);
        await updateOfflineMediaAttempt(item.id, err.message || 'Error de conexion');
        if (item.attempts >= 10) {
          console.error(`[OfflineSync] Captura ${item.id} descartada por exceder maximo de reintentos.`);
        }
      }
    }
  } finally {
    isSyncing = false;
  }

  const remainingItems = await getPendingOfflineMedia();
  return { processed, remaining: remainingItems.length, errors };
}

/**
 * Inicia los observadores globales para sincronizar automaticamente al recuperar senal.
 */
export function setupGlobalOfflineSync() {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    console.log('[OfflineSync] Señal restablecida. Sincronizando capturas pendientes...');
    processOfflineMediaQueue();
  };

  window.addEventListener('online', handleOnline);

  const interval = setInterval(() => {
    if (navigator.onLine) {
      processOfflineMediaQueue();
    }
  }, 20000);

  if (navigator.onLine) {
    processOfflineMediaQueue();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(interval);
  };
}
