
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
        // Use invitacionDigital if it exists, otherwise fall back to old webPageSettings
        const target = data.invitacionDigital ? data.invitacionDigital.regalos : (data.webPageSettings || defaultWebPageSettings);
        const updatedTarget = { ...target, items: giftList, giftRegistry: giftList }; // Update both for compatibility

        if (data.invitacionDigital) {
            return { ...data, invitacionDigital: { ...data.invitacionDigital, regalos: updatedTarget as typeof data.invitacionDigital.regalos } };
        } else {
             return { ...data, webPageSettings: { ...(data.webPageSettings || defaultWebPageSettings), giftRegistry: giftList } };
        }
    });
}

export async function addGiftToRegistry(fiestaId: string, newGiftData: Omit<GiftItem, 'id' | 'isClaimed'>): Promise<{ success: boolean; error?: string }> {
    return updateFiestaData(fiestaId, data => {
        const newGift: GiftItem = {
            ...newGiftData,
            id: `gift_user_${Date.now()}`,
            isClaimed: false,
        };

        if (data.invitacionDigital) {
            const currentItems = data.invitacionDigital.regalos?.items || [];
            const updatedItems = [...currentItems, newGift];
            const updatedRegalos = { ...(data.invitacionDigital.regalos || {}), items: updatedItems };
            return { ...data, invitacionDigital: { ...data.invitacionDigital, regalos: updatedRegalos as typeof data.invitacionDigital.regalos }};
        } else {
            // Fallback for old structure
            const webPageSettings = data.webPageSettings || defaultWebPageSettings;
            const giftList = webPageSettings.giftRegistry || [];
            const updatedList = [...giftList, newGift];
            return { ...data, webPageSettings: { ...webPageSettings, giftRegistry: updatedList } };
        }
    });
}


export async function claimGift(fiestaId: string, giftId: string, guestName: string): Promise<{ success: boolean; error?: string }> {
    return updateFiestaData(fiestaId, data => {
        if (data.invitacionDigital) {
             const currentItems = data.invitacionDigital.regalos?.items || [];
             const updatedItems = currentItems.map(gift => {
                if (gift.id === giftId && !gift.isClaimed) {
                    return { ...gift, isClaimed: true, claimedBy: guestName };
                }
                return gift;
            });
            const updatedRegalos = { ...(data.invitacionDigital.regalos || {}), items: updatedItems };
            return { ...data, invitacionDigital: { ...data.invitacionDigital, regalos: updatedRegalos as typeof data.invitacionDigital.regalos }};

        } else {
            // Fallback
            const webPageSettings = data.webPageSettings || defaultWebPageSettings;
            const giftList = webPageSettings.giftRegistry || [];
            const updatedList = giftList.map(gift => {
                if (gift.id === giftId && !gift.isClaimed) {
                    return { ...gift, isClaimed: true, claimedBy: guestName };
                }
                return gift;
            });
            return { ...data, webPageSettings: { ...webPageSettings, giftRegistry: updatedList } };
        }
    });
}
    