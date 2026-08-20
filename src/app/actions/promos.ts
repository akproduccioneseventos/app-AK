'use server';

import { readData, writeData } from '@/lib/data-service';
import type { PromoActiva } from '@/types/promo';
import { requireAppSession } from '@/lib/auth/require-session';

const PROMOS_FILE = 'promos.json';

export async function getPromos(): Promise<PromoActiva[]> {
  await requireAppSession();
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
  await requireAppSession();
  try {
    if (!data.titulo || !data.titulo.trim()) {
      return { success: false, error: 'El título de la promoción es obligatorio.' };
    }
    if (!data.fechaInicio || !data.fechaInicio.trim()) {
      return { success: false, error: 'La fecha de inicio de la promoción es obligatoria.' };
    }
    if (!data.fechaFin || !data.fechaFin.trim()) {
      return { success: false, error: 'La fecha de fin de la promoción es obligatoria.' };
    }
    if (new Date(data.fechaInicio) > new Date(data.fechaFin)) {
      return { success: false, error: 'La fecha de fin no puede ser anterior a la fecha de inicio.' };
    }

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
  await requireAppSession();
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
  await requireAppSession();
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
