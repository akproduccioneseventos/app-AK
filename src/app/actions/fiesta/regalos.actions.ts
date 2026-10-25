'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, GiftItem } from '@/types/fiesta';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

import { requireAppSession } from '@/lib/auth/require-session';
async function updateFiestaData(
    fiestaId: string,
    updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; error?: string }> {
  try {
    // Lee y guarda adentro del turno: un regalo reservado por un invitado en el medio no se pisa.
    const guardado = await actualizarFiesta(fiestaId, updateFn);
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

        // Lo que edita el equipo (nombre, foto, orden, borrados) viene de la pantalla; lo que marca
        // el invitado (reservado, quien) se conserva de lo guardado en ESTE momento por id.
        const actuales = new Map((regalos.items || []).map(item => [item.id, item]));
        const items = giftList.map(item => {
            const guardado = actuales.get(item.id);
            return guardado ? { ...item, isClaimed: guardado.isClaimed, claimedBy: guardado.claimedBy } : item;
        });
        const updatedRegalos = { ...regalos, items };

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
            id: `gift_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
