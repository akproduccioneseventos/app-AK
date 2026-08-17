'use server';

import { getFiestaById, updateFiestaPartial } from '@/app/actions/fiesta/fiesta.actions';
import { requireAppSession } from '@/lib/auth/require-session';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export async function updateFiestaLiveStream(
  fiestaId: string,
  streamData: {
    activa: boolean;
    youtubeUrl?: string;
    tituloMomento?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();

  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
    return { success: false, error: 'Fiesta no encontrada' };
  }

  const result = await updateFiestaPartial(fiestaId, {
    configuracion: {
      ...fiesta.configuracion,
      transmisionEnVivo: streamData,
    },
  });

  return { success: result.success, error: result.error };
}

export async function getFiestaLiveStreamStatus(fiestaId: string): Promise<{
  success: boolean;
  eventName?: string;
  activa: boolean;
  youtubeUrl?: string;
  tituloMomento?: string;
  error?: string;
}> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
    return { success: false, activa: false, error: 'Fiesta no encontrada.' };
  }

  const stream = fiesta.configuracion?.transmisionEnVivo;
  return {
    success: true,
    eventName: fiesta.configuracion?.nombreEvento || 'La Fiesta',
    activa: stream?.activa || false,
    youtubeUrl: stream?.youtubeUrl || '',
    tituloMomento: stream?.tituloMomento || 'Transmisión Especial',
  };
}
