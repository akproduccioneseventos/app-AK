'use client';

import type { FiestaEnPlanificacion, Invitado, RsvpStatus } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';


async function updateFiestaData(
  fiestaId: string, 
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
      throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
    }
    const updatedData = updateFn(currentData);
    const result = await saveFiesta(updatedData);
    if (!result.success || !result.fiesta) {
        throw new Error(result.error || "No se pudo guardar la fiesta después de actualizar los invitados.");
    }
    return { success: true, updatedFiesta: result.fiesta };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getInvitados(fiestaId: string): Promise<Invitado[]> {
    const fiesta = await getFiestaById(fiestaId);
    return fiesta?.invitados || [];
}

export async function addInvitado(fiestaId: string, nuevoInvitadoData: Omit<Invitado, 'id'>) {
    let nuevoInvitado: Invitado | null = null;
    const result = await updateFiestaData(fiestaId, data => {
        nuevoInvitado = { ...nuevoInvitadoData, id: `inv_${Date.now()}` };
        const invitados = [...(data.invitados || []), nuevoInvitado];
        return { ...data, invitados };
    });
    return { ...result, invitado: nuevoInvitado };
}

export async function updateInvitado(fiestaId: string, invitadoActualizado: Invitado) {
    const result = await updateFiestaData(fiestaId, data => {
        const invitados = (data.invitados || []).map(inv => 
            inv.id === invitadoActualizado.id ? invitadoActualizado : inv
        );
        return { ...data, invitados };
    });
    return {...result, invitado: invitadoActualizado};
}

export async function deleteInvitado(fiestaId: string, invitadoId: string) {
    return updateFiestaData(fiestaId, data => {
        const invitados = (data.invitados || []).filter(inv => inv.id !== invitadoId);
        return { ...data, invitados };
    });
}

export async function handleRsvpSubmission(fiestaId: string, submission: {nombreCompleto: string, confirmacion: string, numeroAsistentes: number, mensaje: string, companionNames: string[], isCeliac?: boolean }): Promise<{ success: boolean, invitado?: Invitado, error?: string}> {
   let updatedInvitado: Invitado | undefined;
   const result = await updateFiestaData(fiestaId, data => {
     const invitadoExistenteIndex = (data.invitados || []).findIndex(
        inv => inv.nombre.trim().toLowerCase() === submission.nombreCompleto.toLowerCase()
      );
      
      const combinedNotes = [
        (invitadoExistenteIndex > -1 ? data.invitados![invitadoExistenteIndex].notes : ''),
        submission.mensaje
      ].filter(Boolean).join('\n---\n');

      if (invitadoExistenteIndex > -1) {
         updatedInvitado = {
           ...(data.invitados![invitadoExistenteIndex]),
           rsvp: submission.confirmacion as RsvpStatus,
           partySize: submission.numeroAsistentes,
           notes: combinedNotes,
           companionNames: submission.companionNames,
           isCeliac: submission.isCeliac ?? data.invitados![invitadoExistenteIndex].isCeliac,
         };
         data.invitados![invitadoExistenteIndex] = updatedInvitado;
      } else {
         updatedInvitado = {
           id: `inv_rsvp_${Date.now()}`,
           nombre: submission.nombreCompleto,
           rsvp: submission.confirmacion as RsvpStatus,
           partySize: submission.numeroAsistentes,
           notes: combinedNotes,
           companionNames: submission.companionNames,
           isCeliac: submission.isCeliac,
         };
         data.invitados = [...(data.invitados || []), updatedInvitado];
      }
      return data;
   });
   return {...result, invitado: updatedInvitado};
}

export async function checkInGuest(fiestaId: string, guestId: string): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
    let invitadoActualizado: Invitado | undefined;
    let found = false;
    const result = await updateFiestaData(fiestaId, data => {
        const invitados = (data.invitados || []).map(inv => {
            if (inv.id === guestId) {
                found = true;
                if(inv.checkedIn) { 
                   invitadoActualizado = inv;
                   return inv;
                }
                invitadoActualizado = { ...inv, checkedIn: true, checkInTimestamp: new Date().toISOString() };
                return invitadoActualizado;
            }
            return inv;
        });
        if (!found) {
            // This won't throw error to the caller directly, but we can check the returned object
            return data; 
        }
        return { ...data, invitados };
    });

    if (!found) return { success: false, error: 'Invitado no encontrado.' };
    return { ...result, invitado: invitadoActualizado };
}
