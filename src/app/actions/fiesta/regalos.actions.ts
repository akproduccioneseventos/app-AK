
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
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
        // Ensure invitacionDigital and regalos exist
        const invitacionDigital = data.invitacionDigital || initialFiestaActualData.invitacionDigital!;
        const regalos = invitacionDigital.regalos || { visible: true, titulo: { text: '' }, texto: { text: '' }, datosBancarios: '', items: [] };

        const updatedRegalos = { ...regalos, items: giftList };

        return {
            ...data,
            invitacionDigital: {
                ...invitacionDigital,
                regalos: updatedRegalos,
            }
        };
    });
}


export async function addGiftToRegistry(fiestaId: string, newGiftData: Omit<GiftItem, 'id' | 'isClaimed'>): Promise<{ success: boolean; error?: string }> {
    return updateFiestaData(fiestaId, data => {
        const newGift: GiftItem = {
            ...newGiftData,
            id: `gift_user_${Date.now()}`,
            isClaimed: false,
        };

        const invitacionDigital = data.invitacionDigital || initialFiestaActualData.invitacionDigital!;
        const regalos = invitacionDigital.regalos || { visible: true, titulo: { text: '' }, texto: { text: '' }, datosBancarios: '', items: [] };

        const currentItems = regalos.items || [];
        const updatedItems = [...currentItems, newGift];
        const updatedRegalos = { ...regalos, items: updatedItems };

        return {
            ...data,
            invitacionDigital: {
                ...invitacionDigital,
                regalos: updatedRegalos,
            }
        };
    });
}


export async function claimGift(fiestaId: string, giftId: string, guestName: string): Promise<{ success: boolean; error?: string }> {
    return updateFiestaData(fiestaId, data => {
        const invitacionDigital = data.invitacionDigital || initialFiestaActualData.invitacionDigital!;
        const regalos = invitacionDigital.regalos || { visible: true, titulo: { text: '' }, texto: { text: '' }, datosBancarios: '', items: [] };
        
        const currentItems = regalos.items || [];
        const updatedItems = currentItems.map(gift => {
            if (gift.id === giftId && !gift.isClaimed) {
                return { ...gift, isClaimed: true, claimedBy: guestName };
            }
            return gift;
        });

        const updatedRegalos = { ...regalos, items: updatedItems };

        return {
            ...data,
            invitacionDigital: {
                ...invitacionDigital,
                regalos: updatedRegalos
            }
        };
    });
}
    
