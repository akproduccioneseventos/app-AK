'use server';

import type { FiestaEnPlanificacion, ZonaDigitalAdolescentesSettings } from '@/types/fiesta';
import {
  buildZonaDigitalPublicUrl,
  withZonaDigitalDefaults,
} from '@/lib/zona-digital-adolescentes';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function getZonaDigitalSettings(fiestaId: string): Promise<{
  success: boolean;
  settings?: ZonaDigitalAdolescentesSettings;
  publicUrl?: string;
  error?: string;
}> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };

    return {
      success: true,
      settings: withZonaDigitalDefaults(fiesta.zonaDigitalAdolescentes),
      publicUrl: buildZonaDigitalPublicUrl(fiestaId),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo leer la zona digital' };
  }
}

export async function updateZonaDigitalSettings(
  fiestaId: string,
  settings: ZonaDigitalAdolescentesSettings
): Promise<{ success: boolean; settings?: ZonaDigitalAdolescentesSettings; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };

    const normalized = withZonaDigitalDefaults({
      ...settings,
      qrUrl: settings.qrUrl || buildZonaDigitalPublicUrl(fiestaId),
      updatedAt: new Date().toISOString(),
    });

    const updatedFiesta: FiestaEnPlanificacion = {
      ...fiesta,
      zonaDigitalAdolescentes: normalized,
      modulosContratados: {
        ...(fiesta.modulosContratados ?? ({} as any)),
        zonaDigital: normalized.enabled,
        muroSocial: normalized.syncWithMuroSocial ? true : fiesta.modulosContratados?.muroSocial ?? true,
        entretenimiento: normalized.syncWithEntretenimiento ? true : fiesta.modulosContratados?.entretenimiento,
        pantallasTotem: normalized.syncWithTotems ? true : fiesta.modulosContratados?.pantallasTotem,
        barraTecnologica: normalized.syncWithBarra ? true : fiesta.modulosContratados?.barraTecnologica,
      },
      socialGallerySettings: normalized.syncWithMuroSocial
        ? {
            ...(fiesta.socialGallerySettings ?? {
              enabled: true,
              allowLikes: true,
              allowComments: true,
              uploadsActive: true,
            }),
            enabled: true,
            allowLikes: true,
            allowComments: normalized.allowComments,
            uploadsActive: true,
            showDedications: normalized.allowDedications,
            showSongRequests: normalized.allowSongVotes,
            requireApproval: normalized.moderationRequired,
            marketingTickerEnabled: true,
            marketingTickerText: `Subi tu foto, juga y etiqueta ${normalized.hashtag}`,
            ledMarqueeEnabled: true,
            ledMarqueeText: `${normalized.title} activa | ${normalized.hashtag}`,
            accentColor: normalized.accentColor,
          }
        : fiesta.socialGallerySettings,
    };

    const result = await saveFiesta(updatedFiesta);
    if (!result.success) return { success: false, error: result.error };

    return { success: true, settings: normalized };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo guardar la zona digital' };
  }
}
