'use server';

import { readData, writeData } from '@/lib/data-service';
import type { GaleriaData, GaleriaFoto, GaleriaVideo } from '@/types/galeria';
import { requireAppSession } from '@/lib/auth/require-session';

const GALERIA_FILE = 'galeria-publica.json';

const DEFAULT_DATA: GaleriaData = { fotos: [], videos: [] };

export async function getGaleriaItems(): Promise<GaleriaData> {
  return readData<GaleriaData>(GALERIA_FILE, DEFAULT_DATA);
}

export async function addGaleriaFoto(foto: GaleriaFoto): Promise<void> {
  await requireAppSession();
  const data = await getGaleriaItems();
  data.fotos.push(foto);
  await writeData(GALERIA_FILE, data);
}

export async function addGaleriaVideo(video: GaleriaVideo): Promise<void> {
  await requireAppSession();
  const data = await getGaleriaItems();
  data.videos.push(video);
  await writeData(GALERIA_FILE, data);
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
  const data = await getGaleriaItems();
  const item: GaleriaFoto | GaleriaVideo | undefined =
    data.fotos.find((f) => f.id === id) ?? data.videos.find((v) => v.id === id);
  if (!item) return;

  data.fotos = data.fotos.filter((f) => f.id !== id);
  data.videos = data.videos.filter((v) => v.id !== id);
  await writeData(GALERIA_FILE, data);

  const { deleteCatalogoFoto, getCatalogoFotos } = await import('./catalogo-fotos');
  const { archivosHuerfanos } = await import('@/lib/galeria/borrado-seguro');
  const { deleteFromStorage } = await import('@/lib/firebase/storage');

  // El gemelo del catálogo se crea al subir la foto desde esta pantalla.
  await deleteCatalogoFoto(`cat_${id}`).catch(() => undefined);

  // Si el depósito falla, la foto igual quedó sacada de la vista del cliente:
  // no se le devuelve un error al equipo por un archivo que quedó de más.
  try {
    const catalogo = await getCatalogoFotos();
    for (const url of archivosHuerfanos(item, data, catalogo)) {
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
  const data = await getGaleriaItems();
  const fotoIdx = data.fotos.findIndex((f) => f.id === id);
  if (fotoIdx !== -1) {
    data.fotos[fotoIdx] = { ...data.fotos[fotoIdx], ...updates } as GaleriaFoto;
  } else {
    const videoIdx = data.videos.findIndex((v) => v.id === id);
    if (videoIdx !== -1) {
      data.videos[videoIdx] = { ...data.videos[videoIdx], ...updates } as GaleriaVideo;
    }
  }
  await writeData(GALERIA_FILE, data);
}

export async function reorderGaleriaItems(
  tipo: 'foto' | 'video',
  ids: string[]
): Promise<void> {
  await requireAppSession();
  const data = await getGaleriaItems();
  if (tipo === 'foto') {
    ids.forEach((id, index) => {
      const item = data.fotos.find((f) => f.id === id);
      if (item) item.orden = index;
    });
    data.fotos.sort((a, b) => a.orden - b.orden);
  } else {
    ids.forEach((id, index) => {
      const item = data.videos.find((v) => v.id === id);
      if (item) item.orden = index;
    });
    data.videos.sort((a, b) => a.orden - b.orden);
  }
  await writeData(GALERIA_FILE, data);
}

export async function toggleDestacada(id: string): Promise<void> {
  await requireAppSession();
  const data = await getGaleriaItems();
  const foto = data.fotos.find((f) => f.id === id);
  if (foto) {
    foto.destacada = !foto.destacada;
  } else {
    const video = data.videos.find((v) => v.id === id);
    if (video) video.destacada = !video.destacada;
  }
  await writeData(GALERIA_FILE, data);
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
    const data = await getGaleriaItems();
    const fotoIdx = data.fotos.findIndex((f) => f.id === id);
    if (fotoIdx === -1) {
      return { success: false, error: 'Foto no encontrada.' };
    }

    data.fotos[fotoIdx] = { ...data.fotos[fotoIdx], ...updates };
    await writeData(GALERIA_FILE, data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo actualizar la foto.' };
  }
}
