'use server';

import { initialFiestaActualData, defaultWebPageSettings } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, GiftItem } from '@/types/fiesta';
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

export async function updateGiftRegistry(giftList: GiftItem[]) {
    return updateFiestaData(data => {
        const webPageSettings = data.webPageSettings || defaultWebPageSettings;
        return {
            ...data,
            webPageSettings: { ...webPageSettings, giftRegistry: giftList }
        };
    });
}
export async function claimGift(giftId: string, guestName: string): Promise<{ success: boolean; error?: string }> {
    return updateFiestaData(data => {
        const webPageSettings = data.webPageSettings || defaultWebPageSettings;
        const giftList = webPageSettings.giftRegistry || [];
        const updatedList = giftList.map(gift => {
            if (gift.id === giftId && !gift.isClaimed) {
                return { ...gift, isClaimed: true, claimedBy: guestName };
            }
            return gift;
        });
        return { ...data, webPageSettings: { ...webPageSettings, giftRegistry: updatedList } };
    });
}
