
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { Salon, SalonPago } from '@/types/salon';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';

const SALONES_FILE = 'salones.json';
const SALONES_STORAGE_PREFIX = 'salones';

export async function getSalones(): Promise<Salon[]> {
  return readData<Salon[]>(SALONES_FILE, []);
}

export async function saveSalon(
  salonData: Omit<Salon, 'id'> | Salon
): Promise<{ success: boolean; salon?: Salon; error?: string }> {
  if (!salonData.nombre.trim()) {
    return { success: false, error: 'El nombre del salón es obligatorio.' };
  }

  const salones = await getSalones();
  let savedSalon: Salon;

  if ('id' in salonData && salonData.id) {
    const idx = salones.findIndex((s) => s.id === salonData.id);
    if (idx === -1) {
      return { success: false, error: 'Salón no encontrado para actualizar.' };
    }
    savedSalon = { ...salones[idx], ...salonData };
    salones[idx] = savedSalon;
  } else {
    savedSalon = { ...salonData, id: `salon_${crypto.randomUUID()}` };
    salones.push(savedSalon);
  }

  await writeData(SALONES_FILE, salones);
  return { success: true, salon: savedSalon };
}

export async function deleteSalon(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const salones = await getSalones();
  const idx = salones.findIndex((s) => s.id === id);
  if (idx === -1) {
    return { success: false, error: 'Salón no encontrado.' };
  }
  salones.splice(idx, 1);
  await writeData(SALONES_FILE, salones);
  return { success: true };
}

/**
 * Uploads a photo for a salon to Firebase Storage and saves the URL in the salon's `fotos` array.
 */
export async function uploadSalonFoto(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const file = formData.get('file') as File | null;
  const salonId = formData.get('salonId') as string | null;

  if (!file) return { success: false, error: 'No se proporcionó ningún archivo.' };
  if (!salonId) return { success: false, error: 'ID de salón no proporcionado.' };

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Solo se permiten imágenes JPEG, PNG, GIF o WebP.' };
  }

  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const photoId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const storagePath = `${SALONES_STORAGE_PREFIX}/${salonId}/${photoId}.${ext}`;

    const bytes = await file.arrayBuffer();
    const url = await uploadToStorage(Buffer.from(bytes), storagePath, file.type, true);

    const salones = await getSalones();
    const idx = salones.findIndex((s) => s.id === salonId);
    if (idx === -1) return { success: false, error: 'Salón no encontrado.' };

    salones[idx] = {
      ...salones[idx],
      fotos: [...(salones[idx].fotos || []), url],
    };
    await writeData(SALONES_FILE, salones);

    return { success: true, url };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Removes a photo URL from a salon's `fotos` array (and optionally deletes it from Storage).
 */
export async function deleteSalonFoto(
  salonId: string,
  fotoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const salones = await getSalones();
    const idx = salones.findIndex((s) => s.id === salonId);
    if (idx === -1) return { success: false, error: 'Salón no encontrado.' };

    salones[idx] = {
      ...salones[idx],
      fotos: (salones[idx].fotos || []).filter((u) => u !== fotoUrl),
    };
    await writeData(SALONES_FILE, salones);

    // Best-effort delete from Storage (storage path derived from URL)
    try {
      const url = new URL(fotoUrl);
      // Only attempt deletion for known Firebase Storage public URLs
      // Pattern: https://storage.googleapis.com/BUCKET/path/to/file
      if (url.hostname === 'storage.googleapis.com') {
        // pathname: /BUCKET/path/to/file → split → ['', 'BUCKET', 'path', 'to', 'file'] → slice(2) → ['path', 'to', 'file']
        const pathParts = url.pathname.split('/').slice(2);
        // Require at least 2 path segments (sub-folder + filename) to avoid accidentally deleting bucket roots
        if (pathParts.length >= 2 && pathParts.every((p) => p.length > 0)) {
          const storagePath = pathParts.join('/');
          await deleteFromStorage(storagePath);
        }
      }
    } catch {
      // Ignore storage deletion errors — the DB record is already updated
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────── Salon Payments ───────────────────

/**
 * Adds a payment record to a salon (with optional comprobante as base64).
 * Comprobante images are stored inline as base64 to keep them self-contained.
 */
export async function addSalonPago(
  salonId: string,
  pago: Omit<SalonPago, 'id'>
): Promise<{ success: boolean; pago?: SalonPago; error?: string }> {
  try {
    const salones = await getSalones();
    const idx = salones.findIndex((s) => s.id === salonId);
    if (idx === -1) return { success: false, error: 'Salón no encontrado.' };

    const newPago: SalonPago = {
      ...pago,
      id: `pago_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    salones[idx] = {
      ...salones[idx],
      pagos: [...(salones[idx].pagos || []), newPago],
    };
    await writeData(SALONES_FILE, salones);
    return { success: true, pago: newPago };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Removes a payment record from a salon.
 */
export async function deleteSalonPago(
  salonId: string,
  pagoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const salones = await getSalones();
    const idx = salones.findIndex((s) => s.id === salonId);
    if (idx === -1) return { success: false, error: 'Salón no encontrado.' };

    salones[idx] = {
      ...salones[idx],
      pagos: (salones[idx].pagos || []).filter((p) => p.id !== pagoId),
    };
    await writeData(SALONES_FILE, salones);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


