'use server';

import type { FiestaEnPlanificacion, Invitado, RsvpStatus, CategoriaInvitado } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';


// Lock registry for concurrency control
const locks = new Map<string, Promise<void>>();

async function acquireLock(key: string): Promise<() => void> {
  let release: () => void = () => {};
  const newPromise = new Promise<void>((resolve) => {
    release = resolve;
  });
  
  const existingPromise = locks.get(key);
  locks.set(key, newPromise);
  
  if (existingPromise) {
    await existingPromise;
  }
  
  return () => {
    release();
    if (locks.get(key) === newPromise) {
      locks.delete(key);
    }
  };
}

function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Normalize internal spaces
}

function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function getSimilarity(a: string, b: string): number {
  const distance = getLevenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - distance / maxLength;
}

async function updateFiestaData(
  fiestaId: string, 
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  const release = await acquireLock(fiestaId);
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
  } finally {
    release();
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
    adultsCount?: number, 
    kidsCount?: number, 
    numeroAsistentes?: number,
    mensaje: string, 
    companionNames: string[], 
    isCeliac?: boolean, 
    tag?: string 
}): Promise<{ success: boolean, invitado?: Invitado, error?: string}> {
   let updatedInvitado: Invitado | undefined;
   
   const result = await updateFiestaData(fiestaId, data => {
     // Support both payload types (discrete adults/kids count or single total)
     const adults = submission.adultsCount !== undefined ? Number(submission.adultsCount) : Number(submission.numeroAsistentes || 1);
     const kids = submission.kidsCount !== undefined ? Number(submission.kidsCount) : 0;
     const totalNew = adults + kids;
     
     // 1. Validar Cupos por Categoría
     const currentInvitados = data.invitados || [];
     const confirmedAdults = currentInvitados.reduce((sum, inv) => sum + (inv.categoria === 'Adulto' ? (inv.partySize || 1) : 0), 0);
     const confirmedKids = currentInvitados.reduce((sum, inv) => sum + (inv.categoria === 'Niño/Adolescente' ? (inv.partySize || 1) : 0), 0);
     
     const limitAdults = Number(data.configuracion.invitadosAdultos) || 0;
     const limitKids = Number(data.configuracion.invitadosNinos) || 0;

     if (confirmedAdults + adults > limitAdults) {
         throw new Error(`Cupos de ADULTOS agotados. Límite: ${limitAdults}. Contacta al organizador.`);
     }
     if (confirmedKids + kids > limitKids) {
         throw new Error(`Cupos de NIÑOS agotados. Límite: ${limitKids}. Contacta al organizador.`);
     }

     // Normalización de nombres para evitar duplicaciones
     const normInput = normalizeString(submission.nombreCompleto);
     
     let invitadoExistenteIndex = currentInvitados.findIndex(
        inv => normalizeString(inv.nombre) === normInput
     );

     // Si no hay coincidencia exacta normalizada, probamos Fuzzy Matching con 85% de similitud
     if (invitadoExistenteIndex === -1) {
        for (let i = 0; i < currentInvitados.length; i++) {
           const inv = currentInvitados[i];
           const normExisting = normalizeString(inv.nombre);
           if (getSimilarity(normInput, normExisting) >= 0.85) {
              invitadoExistenteIndex = i;
              break;
           }
        }
     }
      
     const combinedNotes = [
       (invitadoExistenteIndex > -1 ? currentInvitados[invitadoExistenteIndex].notes : ''),
       submission.mensaje
     ].filter(Boolean).join('\n---\n');

     // Determinamos categoría principal
     const mainCategory: CategoriaInvitado = adults >= kids ? 'Adulto' : 'Niño/Adolescente';

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
