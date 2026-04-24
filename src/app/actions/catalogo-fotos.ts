'use server';

import { readData, writeData } from '@/lib/data-service';
import { uploadToStorage } from '@/lib/firebase/storage';
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

/**
 * Upload an image file to Firebase Storage and save its metadata to the catalog.
 * Accepts a FormData with:
 *   - file: File
 *   - categoriaServicio: string
 *   - tipoFiesta?: string
 *   - titulo?: string
 *   - descripcion?: string
 *   - destacada?: 'true' | 'false'
 */
export async function uploadCatalogoFotoFromFile(formData: FormData): Promise<{
  success: boolean;
  foto?: CatalogoFoto;
  error?: string;
}> {
  const file = formData.get('file') as File | null;
  const categoriaServicio = (formData.get('categoriaServicio') as string | null) || 'General';
  const tipoFiesta = (formData.get('tipoFiesta') as string | null) || undefined;
  const titulo = (formData.get('titulo') as string | null) || undefined;
  const descripcion = (formData.get('descripcion') as string | null) || undefined;
  const destacada = formData.get('destacada') === 'true';

  if (!file) return { success: false, error: 'No se proporcionó ningún archivo.' };

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Solo se permiten imágenes JPEG, PNG, GIF o WebP.' };
  }

  try {
    const fotoId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ext = file.name.split('.').pop() || 'jpg';
    const safeFilename = `${fotoId}.${ext}`;
    const storagePath = `catalogo-fotos/${categoriaServicio.replace(/[^a-zA-Z0-9_-]/g, '_')}/${safeFilename}`;

    const bytes = await file.arrayBuffer();
    const url = await uploadToStorage(Buffer.from(bytes), storagePath, file.type, true);

    const fotos = await getCatalogoFotos();
    const nuevaFoto: CatalogoFoto = {
      id: fotoId,
      url,
      titulo,
      descripcion,
      categoriaServicio,
      tipoFiesta,
      destacada,
      orden: fotos.length,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    fotos.push(nuevaFoto);
    await writeData(CATALOGO_FILE, fotos);

    return { success: true, foto: nuevaFoto };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
