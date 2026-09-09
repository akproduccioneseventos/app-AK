'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import type { ProgramaEventoItem } from '@/types/fiesta';
import { updateFiestaPartial } from './fiesta.actions';

export async function updatePrograma(fiestaId: string, programa: ProgramaEventoItem[]): Promise<{ success: boolean; updatedData?: ProgramaEventoItem[]; error?: string }> {
  await requireAppSession();
  try {
    const result = await updateFiestaPartial(fiestaId, { programa });
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: programa };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
