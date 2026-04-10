'use server';

import { readData, writeData } from '@/lib/data-service';
import type { LandingSettings } from '@/types/landing-editor';
import { defaultLandingSettings } from '@/types/landing-editor';
import { requireAdmin } from '@/lib/auth/session-server';

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
      stats: data.stats?.length ? data.stats : defaultLandingSettings.stats,
    };
  } catch {
    return defaultLandingSettings;
  }
}

export async function saveLandingSettings(
  settings: LandingSettings
): Promise<{ success: boolean; error?: string }> {
  try { await requireAdmin(); } catch { return { success: false, error: 'No autorizado.' }; }
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
