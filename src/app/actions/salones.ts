
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { Salon } from '@/types/salon';

const SALONES_FILE = 'salones.json';

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
