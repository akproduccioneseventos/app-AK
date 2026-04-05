'use server';

import { readData, writeData } from '@/lib/data-service';
import type { PromoActiva } from '@/types/promo';

const PROMOS_FILE = 'promos.json';

export async function getPromos(): Promise<PromoActiva[]> {
  return readData<PromoActiva[]>(PROMOS_FILE, []);
}

export async function getPromoActiva(): Promise<PromoActiva | null> {
  try {
    const promos = await getPromos();
    return promos.find((p) => p.activa && p.mostrarEnLanding) ?? null;
  } catch {
    return null;
  }
}

export async function savePromo(
  data: Omit<PromoActiva, 'id' | 'creadoEn' | 'actualizadoEn'> & { id?: string }
): Promise<{ success: boolean; error?: string; promo?: PromoActiva }> {
  try {
    const promos = await getPromos();
    const now = new Date().toISOString();

    if (data.id) {
      const idx = promos.findIndex((p) => p.id === data.id);
      if (idx === -1) return { success: false, error: 'Promo no encontrada.' };
      promos[idx] = { ...promos[idx], ...data, actualizadoEn: now };
      await writeData(PROMOS_FILE, promos);
      return { success: true, promo: promos[idx] };
    } else {
      const nueva: PromoActiva = {
        ...data,
        id: `promo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        creadoEn: now,
        actualizadoEn: now,
      };
      promos.push(nueva);
      await writeData(PROMOS_FILE, promos);
      return { success: true, promo: nueva };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar la promo.' };
  }
}

export async function deletePromo(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const promos = await getPromos();
    const filtered = promos.filter((p) => p.id !== id);
    if (filtered.length === promos.length) return { success: false, error: 'Promo no encontrada.' };
    await writeData(PROMOS_FILE, filtered);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function togglePromo(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const promos = await getPromos();
    const idx = promos.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: 'Promo no encontrada.' };
    promos[idx].activa = !promos[idx].activa;
    promos[idx].actualizadoEn = new Date().toISOString();
    await writeData(PROMOS_FILE, promos);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
