'use server';

import { readData, writeData } from '@/lib/data-service';
import type { CatalogoFoto } from '@/types/catalogo';

const CATALOGO_FILE = 'catalogo-fotos.json';

function makeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `catalogo_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
  }
  return `catalogo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
}

export async function getCatalogoFotos(filtros?: {
  categoriaServicio?: string;
  tipoFiesta?: string;
  destacada?: boolean;
  activa?: boolean;
}): Promise<CatalogoFoto[]> {
  const fotos = await readData<CatalogoFoto[]>(CATALOGO_FILE, []);
  let result = fotos.filter((f) => f.activa !== false);

  if (filtros?.categoriaServicio) {
    result = result.filter((f) => f.categoriaServicio === filtros.categoriaServicio);
  }
  if (filtros?.tipoFiesta) {
    result = result.filter((f) => f.tipoFiesta === filtros.tipoFiesta);
  }
  if (filtros?.destacada !== undefined) {
    result = result.filter((f) => f.destacada === filtros.destacada);
  }

  return result.sort((a, b) => (b.destacada ? 1 : 0) - (a.destacada ? 1 : 0) || a.orden - b.orden);
}

export async function getCatalogoFotosPorServicio(categoriaServicio: string): Promise<CatalogoFoto[]> {
  return getCatalogoFotos({ categoriaServicio });
}

export async function getCatalogoFotosPorTipoFiesta(tipoFiesta: string): Promise<CatalogoFoto[]> {
  return getCatalogoFotos({ tipoFiesta });
}

export async function addCatalogoFoto(
  foto: Omit<CatalogoFoto, 'id' | 'createdAt' | 'orden'> & Partial<Pick<CatalogoFoto, 'id' | 'createdAt' | 'orden'>>
): Promise<CatalogoFoto> {
  const fotos = await readData<CatalogoFoto[]>(CATALOGO_FILE, []);
  const newFoto: CatalogoFoto = {
    ...foto,
    id: foto.id ?? makeId(),
    orden: foto.orden ?? fotos.length,
    activa: foto.activa !== false,
    destacada: foto.destacada ?? false,
    source: foto.source ?? 'url',
    createdAt: foto.createdAt ?? new Date().toISOString(),
  };
  fotos.push(newFoto);
  await writeData(CATALOGO_FILE, fotos);
  return newFoto;
}

export async function updateCatalogoFoto(
  id: string,
  updates: Partial<CatalogoFoto>
): Promise<void> {
  const fotos = await readData<CatalogoFoto[]>(CATALOGO_FILE, []);
  const idx = fotos.findIndex((f) => f.id === id);
  if (idx !== -1) {
    fotos[idx] = { ...fotos[idx], ...updates };
    await writeData(CATALOGO_FILE, fotos);
  }
}

export async function deleteCatalogoFoto(id: string): Promise<void> {
  const fotos = await readData<CatalogoFoto[]>(CATALOGO_FILE, []);
  const filtered = fotos.filter((f) => f.id !== id);
  await writeData(CATALOGO_FILE, filtered);
}

export async function toggleCatalogoFotoDestacada(id: string): Promise<void> {
  const fotos = await readData<CatalogoFoto[]>(CATALOGO_FILE, []);
  const foto = fotos.find((f) => f.id === id);
  if (foto) {
    foto.destacada = !foto.destacada;
    await writeData(CATALOGO_FILE, fotos);
  }
}

export async function toggleCatalogoFotoActiva(id: string): Promise<void> {
  const fotos = await readData<CatalogoFoto[]>(CATALOGO_FILE, []);
  const foto = fotos.find((f) => f.id === id);
  if (foto) {
    foto.activa = !foto.activa;
    await writeData(CATALOGO_FILE, fotos);
  }
}
