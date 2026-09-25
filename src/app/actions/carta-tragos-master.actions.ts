'use server';

import type { Trago } from '@/types/fiesta';
import { writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';
import { CARTA_TRAGOS_MASTER_FILE, leerCartaTragosMaster, normalizeMasterItems } from '@/lib/carta-tragos/leer-carta-master';

export async function getCartaTragosMaster(): Promise<Trago[]> {
  await requireAppSession();
  return leerCartaTragosMaster();
}

export async function saveCartaTragosMaster(items: Trago[]): Promise<{ success: boolean; data?: Trago[]; error?: string }> {
  await requireAppSession();
  try {
    const sanitized = normalizeMasterItems(items);
    await writeData(CARTA_TRAGOS_MASTER_FILE, sanitized);
    return { success: true, data: sanitized };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
