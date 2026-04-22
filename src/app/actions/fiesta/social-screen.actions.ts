'use server';

import type { SocialScreenConfig } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function getSocialScreenConfig(fiestaId: string): Promise<SocialScreenConfig | null> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return fiesta.socialScreenConfig ?? null;
}

export async function saveSocialScreenConfig(fiestaId: string, config: SocialScreenConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };
    const updated = { ...fiesta, socialScreenConfig: config };
    await saveFiesta(updated);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
