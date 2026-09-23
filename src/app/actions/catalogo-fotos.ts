'use server';

import { readData, writeData, createDataItem, deleteDataItem, mutateDataItem } from '@/lib/data-service';
import { uploadToStorage } from '@/lib/firebase/storage';
import type { CatalogoFoto } from '@/types/catalogo';
import { requireAppSession } from '@/lib/auth/require-session';
import { AsyncMutex } from '@/lib/mutex';

const CATALOGO_FILE = 'catalogo-fotos.json';

/**
 * Turno para tocar el catalogo de fotos.
 *
 * **Por que.** Cada una de estas funciones lee la lista entera, la cambia y la vuelve a
 * escribir entera. Si dos personas suben una foto al mismo tiempo, las dos leen la misma
 * lista y la segunda escribe encima: **una de las dos fotos desaparece** y las dos pantallas
 * dicen que salio bien. Lo encontro Codex el 22 de setiembre de 2026.
 *
 * **La lectura va ADENTRO del turno**, no afuera: con la lectura afuera el candado no sirve
 * de nada, que es la forma exacta que ya habia aparecido en cobros y en proveedores.
 */
const turnoDelCatalogo = new AsyncMutex();
const CATALOGO_COLLECTION = 'catalogo_fotos';

/**
 * **Con la base de verdad, cada cambio toca UNA foto dentro de la base**, no la lista entera.
 * El turno de arriba ordena los pedidos de un solo servidor, pero la app puede correr en
 * hasta cuatro: dos altas en servidores distintos seguian perdiendo una (lo midio Codex el 23
 * de setiembre de 2026). El turno queda para el modo de prueba local, donde hay uno solo.
 */
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

export async function getCatalogoFotos(): Promise<CatalogoFoto[]> {
  return readData<CatalogoFoto[]>(CATALOGO_FILE, []);
}

export async function addCatalogoFoto(foto: CatalogoFoto): Promise<void> {
  await requireAppSession();
  if (!SIN_BASE()) {
    await createDataItem(CATALOGO_FILE, CATALOGO_COLLECTION, foto.id, foto);
    return;
  }
  await turnoDelCatalogo.runExclusive(async () => {
    const fotos = await getCatalogoFotos();
    fotos.push(foto);
    await writeData(CATALOGO_FILE, fotos);
  });
}

export async function updateCatalogoFoto(foto: CatalogoFoto): Promise<void> {
  await requireAppSession();
  if (!SIN_BASE()) {
    await mutateDataItem<CatalogoFoto>(CATALOGO_FILE, CATALOGO_COLLECTION, foto.id, () => foto);
    return;
  }
  await turnoDelCatalogo.runExclusive(async () => {
    const fotos = await getCatalogoFotos();
    const idx = fotos.findIndex(f => f.id === foto.id);
    if (idx !== -1) {
      fotos[idx] = foto;
      await writeData(CATALOGO_FILE, fotos);
    }
  });
}

export async function deleteCatalogoFoto(id: string): Promise<void> {
  await requireAppSession();
  if (!SIN_BASE()) {
    await deleteDataItem(CATALOGO_FILE, CATALOGO_COLLECTION, id);
    return;
  }
  await turnoDelCatalogo.runExclusive(async () => {
    const fotos = await getCatalogoFotos();
    await writeData(CATALOGO_FILE, fotos.filter(f => f.id !== id));
  });
}

export async function toggleCatalogoFotoDestacada(id: string): Promise<void> {
  await requireAppSession();
  if (!SIN_BASE()) {
    // Adentro de la transaccion: dos toques a la vez dan vuelta el valor dos veces, no una.
    await mutateDataItem<CatalogoFoto>(CATALOGO_FILE, CATALOGO_COLLECTION, id, (actual) => ({
      ...actual,
      destacada: !actual.destacada,
    }));
    return;
  }
  await turnoDelCatalogo.runExclusive(async () => {
    const fotos = await getCatalogoFotos();
    const idx = fotos.findIndex(f => f.id === id);
    if (idx !== -1) {
      fotos[idx] = { ...fotos[idx], destacada: !fotos[idx].destacada };
      await writeData(CATALOGO_FILE, fotos);
    }
  });
}

export async function getCatalogoFotosByCategoria(categoria: string): Promise<CatalogoFoto[]> {
  await requireAppSession();
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
  await requireAppSession();
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
