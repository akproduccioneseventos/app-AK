'use server';

import { readData } from '@/lib/data-service';
import { mutarDocumento } from '@/lib/generic-json-store';
import type { GaleriaData, GaleriaFoto, GaleriaVideo } from '@/types/galeria';
import { requireAppSession } from '@/lib/auth/require-session';

const GALERIA_FILE = 'galeria-publica.json';

const DEFAULT_DATA: GaleriaData = { fotos: [], videos: [] };

export async function getGaleriaItems(): Promise<GaleriaData> {
  return readData<GaleriaData>(GALERIA_FILE, DEFAULT_DATA);
}

export async function addGaleriaFoto(foto: GaleriaFoto): Promise<void> {
  await requireAppSession();
  await mutarDocumento<GaleriaData>(GALERIA_FILE, DEFAULT_DATA, (actual) => {
    return {
      fotos: [...(actual?.fotos || []), foto],
      videos: actual?.videos || [],
    };
  });
}

export async function addGaleriaVideo(video: GaleriaVideo): Promise<void> {
  await requireAppSession();
  await mutarDocumento<GaleriaData>(GALERIA_FILE, DEFAULT_DATA, (actual) => {
    return {
      fotos: actual?.fotos || [],
      videos: [...(actual?.videos || []), video],
    };
  });
}

/**
 * Saca una foto o un video de la galería, de verdad.
 *
 * Antes sólo se lo sacaba de la lista y quedaban dos rastros: el archivo seguía
 * en el depósito ocupando lugar (y pagándose), y la foto subida desde acá seguía
 * apareciendo en el catálogo, porque se guarda un gemelo con el mismo archivo.
 * Ahora se limpian los tres lugares, y el archivo se borra sólo si es nuestro y
 * no lo está usando ninguna otra foto ni video.
 */
export async function deleteGaleriaItem(id: string): Promise<void> {
  await requireAppSession();
  let itemEliminado: GaleriaFoto | GaleriaVideo | undefined;
  let dataFinal: GaleriaData = DEFAULT_DATA;

  await mutarDocumento<GaleriaData>(GALERIA_FILE, DEFAULT_DATA, (actual) => {
    // La base puede repetir este cambio: lo que vale es el intento que se guarda.
    itemEliminado = undefined;
    const item = actual?.fotos?.find((f) => f.id === id) ?? actual?.videos?.find((v) => v.id === id);
    if (!item) return actual;
    itemEliminado = item;
    dataFinal = {
      fotos: (actual?.fotos || []).filter((f) => f.id !== id),
      videos: (actual?.videos || []).filter((v) => v.id !== id),
    };
    return dataFinal;
  });

  if (!itemEliminado) return;

  const { deleteCatalogoFoto, getCatalogoFotos } = await import('./catalogo-fotos');
  const { archivosHuerfanos } = await import('@/lib/galeria/borrado-seguro');
  const { deleteFromStorage } = await import('@/lib/firebase/storage');

  // El gemelo del catálogo se crea al subir la foto desde esta pantalla.
  await deleteCatalogoFoto(`cat_${id}`).catch(() => undefined);

  // Si el depósito falla, la foto igual quedó sacada de la vista del cliente:
  // no se le devuelve un error al equipo por un archivo que quedó de más.
  try {
    const catalogo = await getCatalogoFotos();
    for (const url of archivosHuerfanos(itemEliminado, dataFinal, catalogo)) {
      await deleteFromStorage(url).catch(() => undefined);
    }
  } catch {
    // Nada que hacer: el borrado que le importa al usuario ya se guardó.
  }
}

export async function updateGaleriaItem(
  id: string,
  updates: Partial<GaleriaFoto | GaleriaVideo>
): Promise<void> {
  await requireAppSession();
  await mutarDocumento<GaleriaData>(GALERIA_FILE, DEFAULT_DATA, (actual) => {
    const fotoIdx = (actual?.fotos || []).findIndex((f) => f.id === id);
    if (fotoIdx !== -1) {
      const fotos = [...actual.fotos];
      fotos[fotoIdx] = { ...fotos[fotoIdx], ...updates } as GaleriaFoto;
      return { ...actual, fotos };
    }
    const videoIdx = (actual?.videos || []).findIndex((v) => v.id === id);
    if (videoIdx !== -1) {
      const videos = [...actual.videos];
      videos[videoIdx] = { ...videos[videoIdx], ...updates } as GaleriaVideo;
      return { ...actual, videos };
    }
    return actual;
  });
}

export async function reorderGaleriaItems(
  tipo: 'foto' | 'video',
  ids: string[]
): Promise<void> {
  await requireAppSession();
  await mutarDocumento<GaleriaData>(GALERIA_FILE, DEFAULT_DATA, (actual) => {
    if (tipo === 'foto') {
      const fotos = [...(actual?.fotos || [])];
      ids.forEach((id, index) => {
        const item = fotos.find((f) => f.id === id);
        if (item) item.orden = index;
      });
      fotos.sort((a, b) => a.orden - b.orden);
      return { ...actual, fotos };
    } else {
      const videos = [...(actual?.videos || [])];
      ids.forEach((id, index) => {
        const item = videos.find((v) => v.id === id);
        if (item) item.orden = index;
      });
      videos.sort((a, b) => a.orden - b.orden);
      return { ...actual, videos };
    }
  });
}

export async function toggleDestacada(id: string): Promise<void> {
  await requireAppSession();
  await mutarDocumento<GaleriaData>(GALERIA_FILE, DEFAULT_DATA, (actual) => {
    const foto = (actual?.fotos || []).find((f) => f.id === id);
    if (foto) {
      const fotos = actual.fotos.map((f) => (f.id === id ? { ...f, destacada: !f.destacada } : f));
      return { ...actual, fotos };
    }
    const video = (actual?.videos || []).find((v) => v.id === id);
    if (video) {
      const videos = actual.videos.map((v) => (v.id === id ? { ...v, destacada: !v.destacada } : v));
      return { ...actual, videos };
    }
    return actual;
  });
}

export async function getGaleriaFotosByTipoFiesta(tipoFiesta: string): Promise<GaleriaFoto[]> {
  const data = await getGaleriaItems();
  if (!tipoFiesta || tipoFiesta === 'Todos') {
    return data.fotos;
  }
  if (tipoFiesta === 'General') {
    return data.fotos.filter((foto) => !foto.tipoFiesta);
  }
  return data.fotos.filter((foto) => foto.tipoFiesta === tipoFiesta);
}

export async function getGaleriaFotosByServicio(servicio: string): Promise<GaleriaFoto[]> {
  const data = await getGaleriaItems();
  if (!servicio || servicio === 'Todos') {
    return data.fotos;
  }
  if (servicio === 'General') {
    return data.fotos.filter((foto) => !foto.categoria && !foto.servicio);
  }
  return data.fotos.filter((foto) => foto.categoria === servicio || foto.servicio === servicio);
}

export async function updateGaleriaFoto(
  id: string,
  updates: Partial<GaleriaFoto>
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    let encontrada = false;
    await mutarDocumento<GaleriaData>(GALERIA_FILE, DEFAULT_DATA, (actual) => {
      encontrada = false; // la base puede repetir este cambio
      const fotoIdx = (actual?.fotos || []).findIndex((f) => f.id === id);
      if (fotoIdx === -1) return actual;
      encontrada = true;
      const fotos = [...actual.fotos];
      fotos[fotoIdx] = { ...fotos[fotoIdx], ...updates };
      return { ...actual, fotos };
    });
    if (!encontrada) {
      return { success: false, error: 'Foto no encontrada.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo actualizar la foto.' };
  }
}
