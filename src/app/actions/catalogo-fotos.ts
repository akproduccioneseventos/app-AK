'use server';

import { readData, writeData } from '@/lib/data-service';
import type { CatalogoFoto } from '@/types/catalogo';

const CATALOGO_FILE = 'catalogo-fotos.json';

export async function getCatalogoFotos(): Promise<CatalogoFoto[]> {
  return readData<CatalogoFoto[]>(CATALOGO_FILE, []);
}

export async function addCatalogoFoto(foto: CatalogoFoto): Promise<void> {
  const fotos = await getCatalogoFotos();
  fotos.push(foto);
  await writeData(CATALOGO_FILE, fotos);
}

export async function updateCatalogoFoto(foto: CatalogoFoto): Promise<void> {
  const fotos = await getCatalogoFotos();
  const idx = fotos.findIndex(f => f.id === foto.id);
  if (idx !== -1) {
    fotos[idx] = foto;
    await writeData(CATALOGO_FILE, fotos);
  }
}

export async function deleteCatalogoFoto(id: string): Promise<void> {
  const fotos = await getCatalogoFotos();
  await writeData(CATALOGO_FILE, fotos.filter(f => f.id !== id));
}

export async function toggleCatalogoFotoDestacada(id: string): Promise<void> {
  const fotos = await getCatalogoFotos();
  const idx = fotos.findIndex(f => f.id === id);
  if (idx !== -1) {
    fotos[idx] = { ...fotos[idx], destacada: !fotos[idx].destacada };
    await writeData(CATALOGO_FILE, fotos);
  }
}

export async function getCatalogoFotosByCategoria(categoria: string): Promise<CatalogoFoto[]> {
  const fotos = await getCatalogoFotos();
  const lower = categoria.toLowerCase();
  return fotos.filter(f => f.categoriaServicio.toLowerCase() === lower);
}

export async function getCatalogoFotosByTipoFiesta(tipo: string): Promise<CatalogoFoto[]> {
  const fotos = await getCatalogoFotos();
  return fotos.filter(f => f.tipoFiesta === tipo);
}
