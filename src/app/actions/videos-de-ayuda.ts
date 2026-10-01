'use server';

import { readData, writeData } from '@/lib/data-service';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { requireAppSession } from '@/lib/auth/require-session';
import {
  LUGARES_CON_VIDEO,
  idDeYoutube,
  type VideoAyudaItem,
  type VideoAyudaInfo,
} from '@/lib/videos-de-ayuda';

const VIDEOS_FILE = 'videos-de-ayuda.json';

/**
 * Para el panel de Ajustes: devuelve la lista con URLs completas.
 */
export async function getVideosDeAyudaParaAjustes(): Promise<VideoAyudaItem[]> {
  await requireAppSession();
  return readData<VideoAyudaItem[]>(VIDEOS_FILE, []);
}

/**
 * Pública: devuelve los videos de ayuda configurados con su videoId resuelto.
 * La usan tanto el equipo como los clientes e invitados sin sesión.
 */
export async function getVideosDeAyuda(): Promise<VideoAyudaInfo[]> {
  try {
    const lista = await readData<VideoAyudaItem[]>(VIDEOS_FILE, []);
    const res: VideoAyudaInfo[] = [];
    for (const item of lista) {
      const videoId = idDeYoutube(item.youtubeUrl);
      if (videoId) {
        res.push({
          lugar: item.lugar,
          videoId,
          ...(item.titulo ? { titulo: item.titulo } : {}),
        });
      }
    }
    return res;
  } catch {
    return [];
  }
}

/**
 * Guarda o actualiza el video de ayuda para una pantalla determinada.
 * Requiere sesión de la aplicación y enlace válido de YouTube.
 */
export async function guardarVideoDeAyuda(
  lugar: string,
  url: string,
  titulo?: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();

  const esValido = LUGARES_CON_VIDEO.some((l) => l.clave === lugar);
  if (!esValido) {
    return { success: false, error: 'El lugar indicado no admite videos de ayuda.' };
  }

  const videoId = idDeYoutube(url);
  if (!videoId) {
    return {
      success: false,
      error: 'El enlace debe ser un video válido de YouTube (youtube.com, youtu.be o shorts).',
    };
  }

  const ahora = new Date().toISOString();
  const nuevoItem: VideoAyudaItem = {
    lugar,
    youtubeUrl: url.trim(),
    titulo: (titulo || '').trim() || undefined,
    actualizadoEn: ahora,
  };

  try {
    const actualizado = await mutateGenericJsonArray<VideoAyudaItem>(
      VIDEOS_FILE,
      (actual) => {
        const index = actual.findIndex((i) => i.lugar === lugar);
        if (index >= 0) {
          const copia = [...actual];
          copia[index] = nuevoItem;
          return copia;
        }
        return [...actual, nuevoItem];
      },
    );

    if (actualizado === null) {
      // Fallback para entornos donde mutateGenericJsonArray devuelve null por modo local
      const actual = await readData<VideoAyudaItem[]>(VIDEOS_FILE, []);
      const index = actual.findIndex((i) => i.lugar === lugar);
      if (index >= 0) actual[index] = nuevoItem;
      else actual.push(nuevoItem);
      await writeData(VIDEOS_FILE, actual);
    }

    return { success: true };
  } catch (err: any) {
    // Si falla la transacción o está en modo local sin base de pruebas
    if (
      err?.message?.includes('modo local de pruebas') ||
      err?.message?.includes('Firestore no esta disponible')
    ) {
      const actual = await readData<VideoAyudaItem[]>(VIDEOS_FILE, []);
      const index = actual.findIndex((i) => i.lugar === lugar);
      if (index >= 0) actual[index] = nuevoItem;
      else actual.push(nuevoItem);
      await writeData(VIDEOS_FILE, actual);
      return { success: true };
    }
    return { success: false, error: err?.message || 'Error al guardar el video de ayuda.' };
  }
}

/**
 * Quita el video de ayuda de una pantalla determinada.
 * Requiere sesión de la aplicación.
 */
export async function quitarVideoDeAyuda(
  lugar: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();

  const esValido = LUGARES_CON_VIDEO.some((l) => l.clave === lugar);
  if (!esValido) {
    return { success: false, error: 'Lugar no válido.' };
  }

  try {
    const actualizado = await mutateGenericJsonArray<VideoAyudaItem>(
      VIDEOS_FILE,
      (actual) => actual.filter((i) => i.lugar !== lugar),
    );

    if (actualizado === null) {
      const actual = await readData<VideoAyudaItem[]>(VIDEOS_FILE, []);
      await writeData(
        VIDEOS_FILE,
        actual.filter((i) => i.lugar !== lugar),
      );
    }

    return { success: true };
  } catch (err: any) {
    if (
      err?.message?.includes('modo local de pruebas') ||
      err?.message?.includes('Firestore no esta disponible')
    ) {
      const actual = await readData<VideoAyudaItem[]>(VIDEOS_FILE, []);
      await writeData(
        VIDEOS_FILE,
        actual.filter((i) => i.lugar !== lugar),
      );
      return { success: true };
    }
    return { success: false, error: err?.message || 'Error al quitar el video de ayuda.' };
  }
}
