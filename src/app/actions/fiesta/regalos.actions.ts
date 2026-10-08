
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, GiftItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

import { requireAppSession } from '@/lib/auth/require-session';
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
    const guardado = await saveFiesta(updatedData);
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudo guardar la lista de regalos.' };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateGiftRegistry(fiestaId: string, giftList: GiftItem[]) {
  await requireAppSession();
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
    await requireAppSession();
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


/**
 * El invitado reserva un regalo desde la invitación pública, SIN sesión.
 *
 * Antes pasaba por `saveFiesta`, que pide sesión del equipo o del portal: para un invitado
 * siempre fallaba con "No autorizado". Ahora es una escritura angosta: usa `actualizarFiesta`
 * con `publicRsvp: true` (lee y guarda adentro de la misma transacción, como la confirmación de
 * asistencia) y la función sólo toca UN regalo: lo marca reservado con el nombre limpio. Si el
 * regalo no existe o ya lo eligió otro, no escribe nada. Nada más de la fiesta cambia.
 * Es un regalo, no plata: no toca pagos ni cuotas.
 */
export async function claimGift(fiestaId: string, giftId: string, guestName: string): Promise<{ success: boolean; error?: string }> {
    const nombre = String(guestName ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!fiestaId || !giftId || !nombre) {
        return { success: false, error: 'Falta tu nombre para reservar el regalo.' };
    }

    try {
        await enforcePublicRateLimit({
            scope: 'public-claim-gift',
            identity: fiestaId,
            limit: 20,
            windowMs: 60 * 60 * 1000,
        });
    } catch (e: any) {
        return { success: false, error: e.message };
    }

    const res = await actualizarFiesta(fiestaId, (data) => {
        const invitacionDigital = data.invitacionDigital;
        const regalos = invitacionDigital?.regalos;
        const currentItems = regalos?.items || [];
        const targetGift = currentItems.find(gift => gift.id === giftId);
        if (!invitacionDigital || !regalos || !targetGift) {
            throw new Error('Regalo no encontrado.');
        }
        if (targetGift.isClaimed) {
            throw new Error('Justo lo eligió otro invitado; elegí otro de la lista.');
        }

        return {
            ...data,
            invitacionDigital: {
                ...invitacionDigital,
                regalos: {
                    ...regalos,
                    items: currentItems.map(gift =>
                        gift.id === giftId ? { ...gift, isClaimed: true, claimedBy: nombre } : gift
                    ),
                },
            },
        };
    }, { publicRsvp: true });

    return res.success ? { success: true } : { success: false, error: res.error || 'No se pudo reservar el regalo.' };
}
