'use server';

import type { FiestaEnPlanificacion, Invitado, RsvpStatus, CategoriaInvitado, DietaryRestriction } from '@/types/fiesta';
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

export async function handleRsvpSubmission(fiestaId: string, submission: {
    nombreCompleto: string, 
    confirmacion: string, 
    adultsCount: number, 
    kidsCount: number, 
    mensaje: string, 
    companionNames: string[], 
    isCeliac?: boolean, 
    tag?: string 
}): Promise<{ success: boolean, invitado?: Invitado, error?: string}> {
   let updatedInvitado: Invitado | undefined;
   
   const result = await updateFiestaData(fiestaId, data => {
     const totalNew = submission.adultsCount + submission.kidsCount;
     
     // 1. Validar Cupos por Categoría
     const currentInvitados = data.invitados || [];
     const confirmedAdults = currentInvitados.reduce((sum, inv) => sum + (inv.categoria === 'Adulto' ? (inv.partySize || 1) : 0), 0);
     const confirmedKids = currentInvitados.reduce((sum, inv) => sum + (inv.categoria === 'Niño/Adolescente' ? (inv.partySize || 1) : 0), 0);
     
     const limitAdults = Number(data.configuracion.invitadosAdultos) || 0;
     const limitKids = Number(data.configuracion.invitadosNinos) || 0;

     if (confirmedAdults + submission.adultsCount > limitAdults) {
         throw new Error(`Cupos de ADULTOS agotados. Límite: ${limitAdults}. Contacta al organizador.`);
     }
     if (confirmedKids + submission.kidsCount > limitKids) {
         throw new Error(`Cupos de NIÑOS agotados. Límite: ${limitKids}. Contacta al organizador.`);
     }

     const invitadoExistenteIndex = currentInvitados.findIndex(
        inv => inv.nombre.trim().toLowerCase() === submission.nombreCompleto.toLowerCase()
      );
      
      const combinedNotes = [
        (invitadoExistenteIndex > -1 ? currentInvitados[invitadoExistenteIndex].notes : ''),
        submission.mensaje
      ].filter(Boolean).join('\n---\n');

      // Determinamos categoría principal basado en la mayoría o default
      const mainCategory: CategoriaInvitado = submission.adultsCount >= submission.kidsCount ? 'Adulto' : 'Niño/Adolescente';

      if (invitadoExistenteIndex > -1) {
         updatedInvitado = {
           ...(currentInvitados[invitadoExistenteIndex]),
           rsvp: submission.confirmacion as RsvpStatus,
           partySize: totalNew,
           categoria: mainCategory,
           notes: combinedNotes,
           companionNames: submission.companionNames,
           isCeliac: submission.isCeliac ?? currentInvitados[invitadoExistenteIndex].isCeliac,
           tag: submission.tag || currentInvitados[invitadoExistenteIndex].tag
         };
         currentInvitados[invitadoExistenteIndex] = updatedInvitado;
      } else {
         updatedInvitado = {
           id: `inv_rsvp_${Date.now()}`,
           nombre: submission.nombreCompleto,
           rsvp: submission.confirmacion as RsvpStatus,
           partySize: totalNew,
           categoria: mainCategory,
           notes: combinedNotes,
           companionNames: submission.companionNames,
           isCeliac: submission.isCeliac,
           tag: submission.tag
         };
         data.invitados = [...currentInvitados, updatedInvitado];
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
            return data; 
        }
        return { ...data, invitados };
    });

    if (!found) return { success: false, error: 'Invitado no encontrado.' };
    return { ...result, invitado: invitadoActualizado };
}

export async function submitPublicRsvp(fiestaId: string, submission: {
    nombre: string;
    asistencia: 'Confirmado' | 'Rechazado';
    dietaryRestriction: DietaryRestriction;
    cancionesDJ: string[];
}): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
    let savedInvitado: Invitado | undefined;

    const result = await updateFiestaData(fiestaId, data => {
        const currentInvitados = data.invitados || [];
        const existingIndex = currentInvitados.findIndex(
            inv => inv.nombre.trim().toLowerCase() === submission.nombre.trim().toLowerCase()
        );

        if (existingIndex > -1) {
            savedInvitado = {
                ...currentInvitados[existingIndex],
                rsvp: submission.asistencia,
                dietaryRestriction: submission.dietaryRestriction,
                cancionesDJ: submission.cancionesDJ,
                isCeliac: submission.dietaryRestriction === 'Celiaco',
            };
            currentInvitados[existingIndex] = savedInvitado;
            return { ...data, invitados: [...currentInvitados] };
        } else {
            savedInvitado = {
                id: `inv_rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                nombre: submission.nombre.trim(),
                rsvp: submission.asistencia,
                categoria: 'Adulto',
                dietaryRestriction: submission.dietaryRestriction,
                cancionesDJ: submission.cancionesDJ,
                isCeliac: submission.dietaryRestriction === 'Celiaco',
            };
            return { ...data, invitados: [...currentInvitados, savedInvitado] };
        }
    });

    return { ...result, invitado: savedInvitado };
}

export async function updateGuestExperience(
  fiestaId: string,
  invitadoId: string,
  data: { mensaje?: string; fotosSubidas?: string[] }
): Promise<{ success: boolean; error?: string }> {
  const result = await updateFiestaData(fiestaId, fiesta => {
    const invitados = (fiesta.invitados ?? []).map(inv =>
      inv.id === invitadoId ? { ...inv, ...data } : inv
    );
    return { ...fiesta, invitados };
  });
  return { success: result.success, error: result.error };
}
