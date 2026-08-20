'use server';

import { readData, writeData } from '@/lib/data-service';
import { getFiestas, getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { requireAppSession } from '@/lib/auth/require-session';
import { isEventInActiveWindow } from '@/lib/experience-ak/post-event-utils';
import type { SocialGallerySettings } from '@/types/fiesta';

const SOCIAL_GLOBAL_SETTINGS_FILE = 'social-global-settings.json';

export interface GlobalAdItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  enabled: boolean;
}

export interface SocialGlobalSettings {
  adFrequency: number;
  ads: GlobalAdItem[];
}

const defaultGlobalAds: GlobalAdItem[] = [
  {
    id: 'ad-plataforma-360',
    title: 'Plataforma 360° Premium',
    description: '¡Hacé que tus invitados se lleven un video espectacular en cámara lenta! Reservá la plataforma 360 de AK Producciones para tu fiesta.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    ctaText: 'Cotizar en mi Simulador',
    ctaUrl: '/simulador-ak',
    enabled: true
  },
  {
    id: 'ad-robot-led',
    title: 'Robot LED Show',
    description: 'Megatron y show de luces LED robotizado para hacer explotar la tanda de baile de tu evento. ¡Diversión garantizada!',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    ctaText: 'Ver Servicios en Simulador',
    ctaUrl: '/simulador-ak',
    enabled: true
  },
  {
    id: 'ad-espejo-magico',
    title: 'Espejo Mágico de Fotos',
    description: 'Un espejo táctil interactivo que saca fotos de cuerpo entero y las imprime al instante como souvenir premium para tus invitados.',
    imageUrl: 'https://images.unsplash.com/photo-1541140111813-8222e9d90981?auto=format&fit=crop&w=600&q=80',
    ctaText: 'Cotizar Souvenirs',
    ctaUrl: '/simulador-ak',
    enabled: true
  },
  {
    id: 'ad-pistas-led',
    title: 'Pistas LED de Baile',
    description: 'Pistas de baile iluminadas que cambian de color al ritmo de la música. Elevá la estética visual de tu evento al máximo.',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    ctaText: 'Diseñar mi Pista',
    ctaUrl: '/simulador-ak',
    enabled: true
  }
];

const defaultSocialGlobalSettings: SocialGlobalSettings = {
  adFrequency: 4,
  ads: defaultGlobalAds
};

export async function getSocialGlobalSettings(): Promise<SocialGlobalSettings> {
  await requireAppSession();
  try {
    const data = await readData<Partial<SocialGlobalSettings>>(SOCIAL_GLOBAL_SETTINGS_FILE, {});
    return {
      adFrequency: data.adFrequency ?? defaultSocialGlobalSettings.adFrequency,
      ads: data.ads ? data.ads.map(ad => ({ ...ad })) : [...defaultSocialGlobalSettings.ads]
    };
  } catch {
    return { ...defaultSocialGlobalSettings };
  }
}

export async function saveSocialGlobalSettings(settings: SocialGlobalSettings): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    await writeData(SOCIAL_GLOBAL_SETTINGS_FILE, settings);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error al guardar la configuración global.' };
  }
}

export interface AdminSocialFeedInfo {
  id: string;
  nombreEvento: string;
  fechaEvento: string;
  temporalStatus: 'Próximamente' | 'Activa' | 'Desactivada';
  manualEnabled: boolean;
  settings: SocialGallerySettings;
}

export async function getSocialFeedsAdmin(): Promise<AdminSocialFeedInfo[]> {
  try {
    await requireAppSession();
    const fiestas = await getFiestas(true);

    return fiestas.map(fiesta => {
      const fecha = fiesta.configuracion?.fechaEvento || '';
      const windowInfo = isEventInActiveWindow(fecha);

      let temporalStatus: 'Próximamente' | 'Activa' | 'Desactivada' = 'Activa';
      if (windowInfo.phase === 'before') {
        temporalStatus = 'Próximamente';
      } else if (windowInfo.phase === 'after') {
        temporalStatus = 'Desactivada';
      }

      const settings: SocialGallerySettings = fiesta.socialGallerySettings || {
        enabled: true,
        allowLikes: true,
        allowComments: true,
        uploadsActive: true,
        backgroundColor: '#f1f5f9',
        accentColor: '#3b82f6',
        chatEnabled: true,
        showSongRequests: true,
        showDedications: true,
        // Prendida por defecto: lo que suben los invitados espera el visto bueno
        // antes de salir en la pantalla grande. Para publicar ahi alcanza con
        // conocer el codigo del evento, y una vez proyectado delante de ciento
        // cincuenta personas ya no hay como deshacerlo.
        requireApproval: true,
        title: '',
        subtitle: '',
        maxPhotos: 200
      };

      return {
        id: fiesta.id,
        nombreEvento: fiesta.configuracion?.nombreEvento || 'Fiesta sin nombre',
        fechaEvento: fecha,
        temporalStatus,
        manualEnabled: settings.enabled !== false,
        settings
      };
    });
  } catch (error) {
    console.error('Error al cargar feeds para admin:', error);
    return [];
  }
}

export async function toggleFeedOverrideAdmin(fiestaId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return { success: false, error: 'Evento no encontrado.' };
    }

    const currentSettings = fiesta.socialGallerySettings || {
      enabled: true,
      allowLikes: true,
      allowComments: true,
      uploadsActive: true,
      backgroundColor: '#f1f5f9',
      accentColor: '#3b82f6',
      chatEnabled: true,
      showSongRequests: true,
      showDedications: true,
      // Ver la nota de arriba: la moderacion viene prendida.
      requireApproval: true,
      title: '',
      subtitle: '',
      maxPhotos: 200
    };

    fiesta.socialGallerySettings = {
      ...currentSettings,
      enabled
    };

    const res = await saveFiesta(fiesta);
    if (res.success) {
      return { success: true };
    } else {
      return { success: false, error: res.error || 'Error al guardar el estado.' };
    }
  } catch (e: any) {
    return { success: false, error: e.message || 'Error al cambiar la anulación.' };
  }
}
