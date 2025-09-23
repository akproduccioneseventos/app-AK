
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, ClientTarea, ClientPortalSettings, EventWebPageSettings } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { uploadSocialPost } from '../social-gallery';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateClientChecklist(checklist: ClientTarea[]) {
  return updateFiestaData(data => ({ ...data, clientChecklist: checklist }));
}

export async function updateClientNotes(notes: string) {
  return updateFiestaData(data => ({ ...data, clientNotes: notes }));
}

export async function updatePortalSettings(clientSettings: ClientPortalSettings, webSettings: EventWebPageSettings) {
  return updateFiestaData(data => {
      // Logic to sync new gallery images to social gallery
      const existingSocialImageUrls = new Set(data.socialGallerySettings?.posts?.map(p => p.imageUrl) || []);
      const newWebGalleryUrls = webSettings.galleryImageUrls || [];

      newWebGalleryUrls.forEach(url => {
          if (!existingSocialImageUrls.has(url)) {
              if (!data.socialGallerySettings) {
                  data.socialGallerySettings = { enabled: true, allowLikes: true, allowComments: true, uploadsActive: true, posts: [] };
              }
              const newPost = {
                  id: `post_synced_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
                  fiestaId: data.id,
                  imageUrl: url,
                  authorName: 'Anfitrión',
                  timestamp: new Date().toISOString(),
                  likes: 0,
                  comments: [],
              };
              data.socialGallerySettings.posts?.unshift(newPost); // Add to the beginning
          }
      });
      
      return {
          ...data, 
          clientPortalSettings: clientSettings,
          webPageSettings: {
            ...data.webPageSettings,
            ...webSettings,
            galleryImageUrls: (webSettings.galleryImageUrls || []).filter(url => url && url.trim() !== '')
          },
      }
  });
}
