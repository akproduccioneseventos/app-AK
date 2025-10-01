
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, ClientTarea, ClientPortalSettings, EventWebPageSettings } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { uploadSocialPost } from '../social-gallery';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion | Promise<FiestaEnPlanificacion>): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = await updateFn(currentData);
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
  return updateFiestaData(async (currentData) => {
    // Correct logic: Take the existing data and overwrite the settings properties
    // with the complete new objects coming from the client form.
    // This ensures all toggles (true/false) are respected.
    const updatedData = {
      ...currentData,
      clientPortalSettings: clientSettings,
      webPageSettings: webSettings,
    };

    // Logic to sync new gallery images to social gallery (can be preserved)
    const existingSocialImageUrls = new Set(currentData.socialGallerySettings?.posts?.map(p => p.imageUrl) || []);
    const newWebGalleryUrls = webSettings.galleryImageUrls || [];
    
    let socialSettingsUpdated = false;
    for (const url of newWebGalleryUrls) {
      if (url && !existingSocialImageUrls.has(url)) {
        if (!updatedData.socialGallerySettings) {
          updatedData.socialGallerySettings = { enabled: true, allowLikes: true, allowComments: true, uploadsActive: true, posts: [] };
        }
        const newPost = {
          id: `post_synced_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fiestaId: updatedData.id,
          imageUrl: url,
          authorName: 'Anfitrión',
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: [],
        };
        // Ensure posts array exists before unshifting
        if (!updatedData.socialGallerySettings.posts) {
            updatedData.socialGallerySettings.posts = [];
        }
        updatedData.socialGallerySettings.posts.unshift(newPost);
        socialSettingsUpdated = true;
      }
    }
    
    if (socialSettingsUpdated) {
        // Sort posts to keep the newest ones first
        updatedData.socialGallerySettings?.posts?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    return updatedData;
  });
}
