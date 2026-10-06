'use server';

import { randomUUID } from 'node:crypto';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { uploadToStorage, deleteFromStorage, getSignedUrl } from '@/lib/firebase/storage';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { hasPublicGuestAccess } from '@/lib/guest-portal-public-data';

const MAX_VIDEO_SIZE = 8 * 1024 * 1024; // 8 MB

export async function guardarVideoParaInvitados(
  fiestaId: string,
  invitadoIds: string[],
  formData: FormData
): Promise<{ success: boolean; videoId?: string; storagePath?: string; error?: string }> {
  // 1. La primera línea es verifyPortalSession(fiestaId)
  const tieneSesion = await verifyPortalSession(fiestaId);
  if (!tieneSesion) {
    return { success: false, error: 'Sesión no autorizada o inválida.' };
  }

  // 2. Validar que la fiesta existe y que el interruptor está prendido
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  if (!fiesta) {
    return { success: false, error: 'Fiesta no encontrada.' };
  }

  if (!fiesta.clientPortalSettings?.videosParaInvitadosActivo) {
    return { success: false, error: 'El módulo de videos para invitados está desactivado en esta fiesta.' };
  }

  // 3. Validar invitadoIds (no vacío, y todos pertenecientes a esta fiesta)
  if (!invitadoIds || !Array.isArray(invitadoIds) || invitadoIds.length === 0) {
    return { success: false, error: 'Debe seleccionar al menos un invitado.' };
  }

  const idsEnFiesta = new Set((fiesta.invitados || []).map((i) => i.id));
  const todosPertenecen = invitadoIds.every((id) => idsEnFiesta.has(id));
  if (!todosPertenecen) {
    return { success: false, error: 'Uno o más invitados no pertenecen a esta fiesta.' };
  }

  // 4. Validar archivo
  const file = formData.get('video') as File | null;
  if (!file) {
    return { success: false, error: 'No se envió ningún archivo de video.' };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return { success: false, error: 'El video supera el límite de 8 MB.' };
  }

  const mime = file.type || '';
  if (mime !== 'video/webm' && mime !== 'video/mp4') {
    return { success: false, error: 'Tipo de archivo no permitido. Solo se acepta video/webm o video/mp4.' };
  }

  const ext = mime === 'video/mp4' ? 'mp4' : 'webm';
  const videoId = randomUUID();
  const storagePath = `videos-invitados/${fiestaId}/${videoId}.${ext}`;

  // 5. Subir a Storage privado
  let buffer: Buffer;
  try {
    if (typeof (file as any).arrayBuffer === 'function') {
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (typeof (file as any).bytes === 'function') {
      buffer = Buffer.from(await (file as any).bytes());
    } else {
      const text = await (file as any).text?.();
      buffer = Buffer.from(text || '');
    }
    await uploadToStorage(buffer, storagePath, mime, false);
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al subir el video al almacenamiento.' };
  }

  // 6. Actualizar registro en fiesta
  const duracionSegundos = Math.min(30, Math.max(1, Number(formData.get('duracionSegundos')) || 30));

  try {
    const resActualizar = await actualizarFiesta(
      fiestaId,
      (fiestaFresca) => {
        const listaExistente = fiestaFresca.videosParaInvitados || [];
        const nuevoVideo = {
          id: videoId,
          invitadoIds,
          storagePath,
          duracionSegundos,
          creadoAt: new Date().toISOString(),
        };
        return {
          ...fiestaFresca,
          videosParaInvitados: [...listaExistente, nuevoVideo],
        };
      },
      { portalClient: true }
    );

    if (!resActualizar || !resActualizar.success) {
      throw new Error(resActualizar?.error || 'Fallo al persistir el video en la fiesta.');
    }

    return {
      success: true,
      videoId,
      storagePath,
    };
  } catch (err: any) {
    // Si el guardado falla, borra el archivo con deleteFromStorage y devuelve error
    await deleteFromStorage(storagePath);
    return {
      success: false,
      error: err.message || 'No se pudo guardar el video en la fiesta.',
    };
  }
}

export async function borrarVideoParaInvitados(
  fiestaId: string,
  videoId: string
): Promise<{ success: boolean; error?: string }> {
  const tieneSesion = await verifyPortalSession(fiestaId);
  if (!tieneSesion) {
    return { success: false, error: 'Sesión no autorizada.' };
  }

  let storagePathAEliminar: string | null = null;

  try {
    const resActualizar = await actualizarFiesta(
      fiestaId,
      (fiestaFresca) => {
        const listaExistente = fiestaFresca.videosParaInvitados || [];
        const video = listaExistente.find((v) => v.id === videoId);
        if (video) {
          storagePathAEliminar = video.storagePath;
        }
        return {
          ...fiestaFresca,
          videosParaInvitados: listaExistente.filter((v) => v.id !== videoId),
        };
      },
      { portalClient: true }
    );

    if (!resActualizar.success) {
      return { success: false, error: resActualizar.error || 'Error al eliminar el registro.' };
    }

    if (storagePathAEliminar) {
      await deleteFromStorage(storagePathAEliminar);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al borrar el video.' };
  }
}

export async function obtenerVideoBienvenidaTotem(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string
): Promise<{ success: boolean; guestName?: string; videoUrl?: string; error?: string }> {
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  if (!fiesta) {
    return { success: false, error: 'Fiesta no encontrada.' };
  }

  const guest = (fiesta.invitados || []).find((g) => g.id === guestId);
  if (!guest || !hasPublicGuestAccess(guest, guestId, guestAccessToken)) {
    return { success: false, error: 'Acceso de invitado no autorizado.' };
  }

  const guestName = guest.nombre;

  if (fiesta.clientPortalSettings?.videosParaInvitadosActivo) {
    const video = (fiesta.videosParaInvitados || []).find((v) =>
      v.invitadoIds.includes(guestId)
    );
    if (video?.storagePath) {
      const url = await getSignedUrl(video.storagePath, 6 * 60 * 60 * 1000);
      return { success: true, guestName, videoUrl: url || undefined };
    }
  }

  return { success: true, guestName };
}
