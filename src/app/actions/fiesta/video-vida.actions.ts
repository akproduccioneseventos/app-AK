
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, VideoVidaData } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';

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

export async function updateVideoVidaSettings(settings: Partial<VideoVidaData>) {
    return updateFiestaData(data => ({
        ...data,
        videoVida: { ...(data.videoVida || { galleryEnabled: false, photosUploaded: false }), ...settings }
    }));
}
