
'use server';

import { readData, writeData, createDataItem, deleteDataItem, mutateDataItem } from '@/lib/data-service';
import { AsyncMutex } from '@/lib/mutex';
import type { Salon, SalonPago } from '@/types/salon';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import { requireAppSession } from '@/lib/auth/require-session';

const SALONES_FILE = 'salones.json';

/**
 * Turno para tocar la lista de salones.
 *
 * **Por que.** Guardar un salon lee la lista entera, la cambia y la escribe entera. Dos
 * personas editando **salones distintos** al mismo tiempo leen la misma lista y la segunda
 * escribe encima: **el cambio de la primera se pierde** y las dos pantallas dicen que salio
 * bien. Lo encontro Codex el 22 de setiembre de 2026.
 *
 * **La lectura va ADENTRO del turno**, que es la mitad que siempre se olvida: con la lectura
 * afuera el candado no sirve de nada.
 */
const turnoDeSalones = new AsyncMutex();
const SALONES_STORAGE_PREFIX = 'salones';
const SALONES_COLLECTION = 'salones';

/**
 * **Cada cambio toca UN salon, dentro de la base, no la lista entera.**
 *
 * El turno de arriba solo ordena los pedidos dentro de un mismo servidor, y la app puede
 * correr en hasta cuatro a la vez: con dos personas en servidores distintos seguia
 * perdiendose un cambio. Lo encontro Codex el 23 de setiembre de 2026 —capacidades que
 * terminaban en [10, 21] en vez de [11, 21]—. Y lo mismo pasaba con **los pagos del salon**,
 * que ni siquiera tenian turno: dos pagos cargados a la vez perdian uno.
 *
 * Con la base de verdad, el cambio es una transaccion sobre ese unico salon. En el modo de
 * prueba local (sin base) se sigue usando el turno y la lista, que ahi hay un solo servidor.
 */
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

async function cambiarUnSalon(
  salonId: string,
  cambiar: (salon: Salon) => Salon | null,
): Promise<Salon | null> {
  if (!SIN_BASE()) {
    return mutateDataItem<Salon>(SALONES_FILE, SALONES_COLLECTION, salonId, cambiar);
  }
  return turnoDeSalones.runExclusive(async () => {
    const salones = await leerSalones();
    const idx = salones.findIndex((s) => s.id === salonId);
    if (idx === -1) return null;
    const nuevo = cambiar(salones[idx]);
    if (!nuevo) return null;
    salones[idx] = nuevo;
    await writeData(SALONES_FILE, salones);
    return nuevo;
  });
}

export async function getSalones(): Promise<Salon[]> {
  // La ficha del salon guarda el contacto del gerente (su WhatsApp y su correo).
  // Eso es del equipo: sin comprobar sesion, cualquiera se llevaba la agenda de
  // contactos de todos los salones con los que trabaja AK.
  await requireAppSession();
  return leerSalones();
}

/** Sin comprobar sesion: uso interno de este archivo. */
async function leerSalones(): Promise<Salon[]> {
  return readData<Salon[]>(SALONES_FILE, []);
}

/** Los salones como se muestran en las paginas de venta, sin el contacto del gerente. */
export async function getSalonesPublicos(): Promise<Salon[]> {
  const salones = await leerSalones();
  return salones.map(({ gerente, ...visible }) => {
    void gerente;
    return visible as Salon;
  });
}

export async function saveSalon(
  salonData: Omit<Salon, 'id'> | Salon
): Promise<{ success: boolean; salon?: Salon; error?: string }> {
  await requireAppSession();
  if (!salonData.nombre.trim()) {
    return { success: false, error: 'El nombre del salón es obligatorio.' };
  }
  // Un salon para cero personas no sirve para nada y despues aparece para
  // elegir al armar un presupuesto.
  const capacidad = Number((salonData as Salon).capacidad ?? 0);
  if (!Number.isFinite(capacidad) || capacidad <= 0) {
    return { success: false, error: 'Poné para cuántas personas es el salón.' };
  }

  if ('id' in salonData && salonData.id) {
    const savedSalon = await cambiarUnSalon(salonData.id, (actual) => ({ ...actual, ...salonData }));
    if (!savedSalon) return { success: false, error: 'Salón no encontrado para actualizar.' };
    return { success: true, salon: savedSalon };
  }

  const savedSalon: Salon = { ...salonData, id: `salon_${crypto.randomUUID()}` };
  if (!SIN_BASE()) {
    await createDataItem(SALONES_FILE, SALONES_COLLECTION, savedSalon.id, savedSalon);
  } else {
    await turnoDeSalones.runExclusive(async () => {
      const salones = await leerSalones();
      salones.push(savedSalon);
      await writeData(SALONES_FILE, salones);
    });
  }
  return { success: true, salon: savedSalon };
}

export async function deleteSalon(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  if (!SIN_BASE()) {
    const borrado = await deleteDataItem(SALONES_FILE, SALONES_COLLECTION, id);
    return borrado ? { success: true } : { success: false, error: 'Salón no encontrado.' };
  }
  return turnoDeSalones.runExclusive(async () => {
    const salones = await leerSalones();
    const idx = salones.findIndex((s) => s.id === id);
    if (idx === -1) {
      return { success: false, error: 'Salón no encontrado.' };
    }
    salones.splice(idx, 1);
    await writeData(SALONES_FILE, salones);
    return { success: true };
  });
}

/**
 * Uploads a photo for a salon to Firebase Storage and saves the URL in the salon's `fotos` array.
 */
export async function uploadSalonFoto(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  await requireAppSession();
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

    const cambiado = await cambiarUnSalon(salonId, (salon) => ({
      ...salon,
      fotos: [...(salon.fotos || []), url],
    }));
    if (!cambiado) return { success: false, error: 'Salón no encontrado.' };

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
  await requireAppSession();
  try {
    const cambiado = await cambiarUnSalon(salonId, (salon) => ({
      ...salon,
      fotos: (salon.fotos || []).filter((u) => u !== fotoUrl),
    }));
    if (!cambiado) return { success: false, error: 'Salón no encontrado.' };

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
  await requireAppSession();
  try {
    const newPago: SalonPago = {
      ...pago,
      id: `pago_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    const cambiado = await cambiarUnSalon(salonId, (salon) => ({
      ...salon,
      pagos: [...(salon.pagos || []), newPago],
    }));
    if (!cambiado) return { success: false, error: 'Salón no encontrado.' };
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
  await requireAppSession();
  try {
    const cambiado = await cambiarUnSalon(salonId, (salon) => ({
      ...salon,
      pagos: (salon.pagos || []).filter((p) => p.id !== pagoId),
    }));
    if (!cambiado) return { success: false, error: 'Salón no encontrado.' };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


