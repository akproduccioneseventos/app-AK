'use server';

import { readData, writeData } from '@/lib/data-service';
import type { GaleriaData, GaleriaFoto, GaleriaVideo } from '@/types/galeria';

const GALERIA_FILE = 'galeria-publica.json';

const DEFAULT_DATA: GaleriaData = { fotos: [], videos: [] };

export async function getGaleriaItems(): Promise<GaleriaData> {
  return readData<GaleriaData>(GALERIA_FILE, DEFAULT_DATA);
}

export async function addGaleriaFoto(foto: GaleriaFoto): Promise<void> {
  const data = await getGaleriaItems();
  data.fotos.push(foto);
  await writeData(GALERIA_FILE, data);
}

export async function addGaleriaVideo(video: GaleriaVideo): Promise<void> {
  const data = await getGaleriaItems();
  data.videos.push(video);
  await writeData(GALERIA_FILE, data);
}

export async function deleteGaleriaItem(id: string): Promise<void> {
  const data = await getGaleriaItems();
  data.fotos = data.fotos.filter((f) => f.id !== id);
  data.videos = data.videos.filter((v) => v.id !== id);
  await writeData(GALERIA_FILE, data);
}

export async function updateGaleriaItem(
  id: string,
  updates: Partial<GaleriaFoto | GaleriaVideo>
): Promise<void> {
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
