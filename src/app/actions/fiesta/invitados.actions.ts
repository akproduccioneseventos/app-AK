'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, Invitado, RsvpStatus } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true, updatedFiesta: updatedData };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getInvitados(): Promise<Invitado[]> {
    const fiesta = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    return fiesta.invitados || [];
}

export async function addInvitado(nuevoInvitadoData: Omit<Invitado, 'id'>) {
    let nuevoInvitado: Invitado | null = null;
    const result = await updateFiestaData(data => {
        nuevoInvitado = { ...nuevoInvitadoData, id: `inv_${Date.now()}` };
        const invitados = [...(data.invitados || []), nuevoInvitado];
        return { ...data, invitados };
    });
    return { ...result, invitado: nuevoInvitado };
}

export async function updateInvitado(invitadoActualizado: Invitado) {
    const result = await updateFiestaData(data => {
        const invitados = (data.invitados || []).map(inv => 
            inv.id === invitadoActualizado.id ? invitadoActualizado : inv
        );
        return { ...data, invitados };
    });
    return {...result, invitado: invitadoActualizado};
}

export async function deleteInvitado(invitadoId: string) {
    return updateFiestaData(data => {
        const invitados = (data.invitados || []).filter(inv => inv.id !== invitadoId);
        return { ...data, invitados };
    });
}

export async function handleRsvpSubmission(submission: {nombreCompleto: string, confirmacion: string, numeroAsistentes: number, mensaje: string, companionNames: string[] }): Promise<{ success: boolean, invitado?: Invitado, error?: string}> {
   let updatedInvitado: Invitado | undefined;
   const result = await updateFiestaData(data => {
     const invitadoExistenteIndex = (data.invitados || []).findIndex(
        inv => inv.nombre.trim().toLowerCase() === submission.nombreCompleto.toLowerCase()
      );
      
      if (invitadoExistenteIndex > -1) {
         updatedInvitado = {
           ...(data.invitados![invitadoExistenteIndex]),
           rsvp: submission.confirmacion as RsvpStatus,
           partySize: submission.numeroAsistentes,
           notes: [data.invitados![invitadoExistenteIndex].notes, submission.mensaje].filter(Boolean).join('\\n---\\n'),
           companionNames: submission.companionNames,
         };
         data.invitados![invitadoExistenteIndex] = updatedInvitado;
      } else {
         updatedInvitado = {
           id: `inv_rsvp_${Date.now()}`,
           nombre: submission.nombreCompleto,
           rsvp: submission.confirmacion as RsvpStatus,
           partySize: submission.numeroAsistentes,
           notes: submission.mensaje,
           companionNames: submission.companionNames,
         };
         data.invitados = [...(data.invitados || []), updatedInvitado];
      }
      return data;
   });
   return {...result, invitado: updatedInvitado};
}

export async function checkInGuest(guestId: string): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
    let invitadoActualizado: Invitado | undefined;
    let found = false;
    const result = await updateFiestaData(data => {
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
