'use server';

import path from 'path';
import { uploadToStorage } from '@/lib/firebase/storage';
import { getFiestaById, getFiestas, saveFiesta } from './fiesta.actions';
import type { ScreenMediaAsset, SocialGallerySettings } from '@/types/fiesta';

function normalizeSocialSettings(settings?: SocialGallerySettings): SocialGallerySettings {
  return {
    enabled: settings?.enabled ?? true,
    allowLikes: settings?.allowLikes ?? true,
    allowComments: settings?.allowComments ?? true,
    uploadsActive: settings?.uploadsActive ?? true,
    chatEnabled: settings?.chatEnabled ?? true,
    showPolls: settings?.showPolls ?? true,
    showSongRequests: settings?.showSongRequests ?? true,
    showDedications: settings?.showDedications ?? true,
    marketingTickerText: settings?.marketingTickerText ?? '',
    ledMarqueeText: settings?.ledMarqueeText ?? '',
    ...settings,
  };
}

export async function uploadScreenMediaAsset(
  fiestaId: string,
  file: File
): Promise<{ success: boolean; asset?: ScreenMediaAsset; error?: string }> {
  try {
    if (!fiestaId || !file) return { success: false, error: 'Datos incompletos.' };
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    const ext = path.extname(file.name) || (file.type.startsWith('video/') ? '.mp4' : '.jpg');
    const id = `screen_asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `screen-mode/${fiestaId}/${id}${ext}`;
    const bytes = await file.arrayBuffer();
    const url = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'application/octet-stream', true);

    const asset: ScreenMediaAsset = {
      id,
      url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      sourceFiestaId: fiestaId,
      sourceFiestaNombre: fiesta.configuracion.nombreEvento,
      createdAt: new Date().toISOString(),
      title: file.name,
    };

    const nextLibrary = [...(fiesta.socialGallerySettings?.screenMediaLibrary ?? []), asset];
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        screenMediaLibrary: nextLibrary,
      },
    });

    return { success: true, asset };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo subir el medio.' };
  }
}

export async function getGlobalScreenMediaLibrary(): Promise<ScreenMediaAsset[]> {
  const fiestas = await getFiestas(false);
  const dedup = new Map<string, ScreenMediaAsset>();
  for (const fiesta of fiestas) {
    for (const asset of fiesta.socialGallerySettings?.screenMediaLibrary ?? []) {
      if (!dedup.has(asset.id)) dedup.set(asset.id, asset);
    }
  }
  return Array.from(dedup.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
