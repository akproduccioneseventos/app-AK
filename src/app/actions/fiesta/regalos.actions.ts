
'use server';

import { initialFiestaActualData, defaultWebPageSettings } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, GiftItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

async function updateFiestaData(
    fiestaId: string, 
    updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
     if (!currentData) {
        throw new Error("Fiesta no encontrada para actualizar regalos.");
    }
    const updatedData = updateFn(currentData);
    await saveFiesta(updatedData);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateGiftRegistry(fiestaId: string, giftList: GiftItem[]) {
    return updateFiestaData(fiestaId, data => {
        const webPageSettings = data.webPageSettings || defaultWebPageSettings;
        return {
            ...data,
            webPageSettings: { ...webPageSettings, giftRegistry: giftList }
        };
    });
}

export async function addGiftToRegistry(fiestaId: string, newGiftData: Omit<GiftItem, 'id' | 'isClaimed'>): Promise<{ success: boolean; error?: string }> {
    return updateFiestaData(fiestaId, data => {
        const webPageSettings = data.webPageSettings || defaultWebPageSettings;
        const giftList = webPageSettings.giftRegistry || [];
        
        const newGift: GiftItem = {
            ...newGiftData,
            id: `gift_user_${Date.now()}`,
            isClaimed: false,
        };

        const updatedList = [...giftList, newGift];

        return {
            ...data,
            webPageSettings: { ...webPageSettings, giftRegistry: updatedList }
        };
    });
}


export async function claimGift(fiestaId: string, giftId: string, guestName: string): Promise<{ success: boolean; error?: string }> {
    return updateFiestaData(fiestaId, data => {
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
    