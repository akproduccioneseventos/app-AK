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
    const { hayPresupuestoParaIA, registrarConsumoIA } = await import('@/lib/ai/consumo-servidor');
    if (!(await hayPresupuestoParaIA().catch(() => false))) {
      return { success: false, error: 'Se alcanzó el tope mensual de IA.' };
    }
    const djProfile = await generateDjProfileFlow({
      eventoTipo,
      playlistFiesta,
      listaNoReproducir,
      cancionesTortaBrindis,
    });

    if (!djProfile) {
      return { success: false, error: 'La IA no pudo generar el perfil.' };
    }

    await registrarConsumoIA('perfil-dj').catch(() => undefined);
    return { success: true, data: djProfile };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
