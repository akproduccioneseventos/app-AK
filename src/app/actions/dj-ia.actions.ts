'use server';

import { generateDjProfileFlow } from '@/ai/flows/generate-dj-profile-flow';

import { requireAppSession } from '@/lib/auth/require-session';
export async function generateDjProfileAction(
  eventoTipo: string,
  playlistFiesta?: string,
  listaNoReproducir?: string,
  cancionesTortaBrindis?: string[]
): Promise<{ success: boolean; data?: string; error?: string }> {
  await requireAppSession();
  try {
    const djProfile = await generateDjProfileFlow({
      eventoTipo,
      playlistFiesta,
      listaNoReproducir,
      cancionesTortaBrindis,
    });

    if (!djProfile) {
      return { success: false, error: 'La IA no pudo generar el perfil.' };
    }

    return { success: true, data: djProfile };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
