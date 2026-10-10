'use server';

import { readData, writeData } from '@/lib/data-service';
import type { LandingSettings } from '@/types/landing-editor';
import { defaultLandingSettings } from '@/types/landing-editor';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';

const LANDING_SETTINGS_FILE = 'landing-settings.json';

export async function getLandingSettings(): Promise<LandingSettings> {
  try {
    const data = await readData<LandingSettings>(LANDING_SETTINGS_FILE, defaultLandingSettings);
    // Deep merge with defaults to ensure all fields exist
    return {
      ...defaultLandingSettings,
      ...data,
      hero: { ...defaultLandingSettings.hero, ...data.hero },
      cta: { ...defaultLandingSettings.cta, ...data.cta },
      colors: { ...defaultLandingSettings.colors, ...data.colors },
      seo: { ...defaultLandingSettings.seo, ...data.seo },
      services: data.services ?? defaultLandingSettings.services,
      stats: (() => {
        if (!data.stats?.length) return defaultLandingSettings.stats;
        const valoresViejos = ['+500', '+12', '100%', '24/7'];
        const esListaVieja =
          data.stats.length === 4 &&
          data.stats.every((s, i) => s.value === valoresViejos[i]);
        const tieneStatCero = data.stats.some(
          (s) => !s.value || s.value === '0' || /^0\//.test(s.value)
        );
        if (esListaVieja || tieneStatCero) {
          return defaultLandingSettings.stats;
        }
        return data.stats;
      })(),
      gallery: data.gallery ?? defaultLandingSettings.gallery,
      faqs: data.faqs ?? defaultLandingSettings.faqs,
    };
  } catch {
    return defaultLandingSettings;
  }
}

export async function saveLandingSettings(
  settings: LandingSettings
): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.CRM, PERMISOS.ADMINISTRACION);
  try {
    const dataToSave: LandingSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await writeData(LANDING_SETTINGS_FILE, dataToSave);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error al guardar la configuración.' };
  }
}
