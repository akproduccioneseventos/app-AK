'use server';

import type { FiestaEnPlanificacion, Invitado, RsvpStatus, CategoriaInvitado, DietaryRestriction } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

// ─── Core helper ────────────────────────────────────────────────────────────

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
      throw new Error(result.error || 'No se pudo guardar la fiesta después de actualizar los invitados.');
    }
    return { success: true, updatedFiesta: result.fiesta };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── Guest queries ───────────────────────────────────────────────────────────

export async function getInvitados(fiestaId: string): Promise<Invitado[]> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.invitados || [];
}

// ─── Guest CRUD ──────────────────────────────────────────────────────────────

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
  return { ...result, invitado: invitadoActualizado };
}

export async function deleteInvitado(fiestaId: string, invitadoId: string) {
  return updateFiestaData(fiestaId, data => {
    const invitados = (data.invitados || []).filter(inv => inv.id !== invitadoId);
    return { ...data, invitados };
  });
}

// ─── RSVP ────────────────────────────────────────────────────────────────────

/**
 * Full RSVP update from the individual guest page.
 * Covers: attendance status, party size, companion names, dietary restrictions,
 * specific allergies, DJ song suggestions, and optional message to hosts.
 */
export async function updateGuestRsvp(
  fiestaId: string,
  invitadoId: string,
  submission: {
    rsvp: RsvpStatus;
    partySize?: number;
    companionNames?: string[];
    dietaryRestriction?: DietaryRestriction;
    alergiasEspecificas?: string;
    cancionesDJ?: string[];
    mensaje?: string;
    requiereAccesibilidad?: boolean;
  }
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  let updatedInvitado: Invitado | undefined;
  const result = await updateFiestaData(fiestaId, data => {
    const invitados = (data.invitados || []).map(inv => {
      if (inv.id !== invitadoId) return inv;
      updatedInvitado = {
        ...inv,
        rsvp: submission.rsvp,
        partySize: submission.partySize ?? inv.partySize,
        companionNames: submission.companionNames ?? inv.companionNames,
        dietaryRestriction: submission.dietaryRestriction ?? inv.dietaryRestriction,
        alergiasEspecificas:
          submission.alergiasEspecificas !== undefined
            ? submission.alergiasEspecificas
            : inv.alergiasEspecificas,
        cancionesDJ: submission.cancionesDJ ?? inv.cancionesDJ,
        isCeliac: submission.dietaryRestriction === 'Celiaco' || inv.isCeliac,
        ...(submission.mensaje !== undefined ? { mensaje: submission.mensaje } : {}),
        ...(submission.requiereAccesibilidad !== undefined ? { requiereAccesibilidad: submission.requiereAccesibilidad } : {}),
      };
      return updatedInvitado;
    });
    return { ...data, invitados };
  });
  return { ...result, invitado: updatedInvitado };
}

/** Legacy full-form RSVP used by the invitation templates. */
export async function handleRsvpSubmission(
  fiestaId: string,
  submission: {
    nombreCompleto: string;
    confirmacion: string;
    adultsCount: number;
    kidsCount: number;
    mensaje: string;
    companionNames: string[];
    isCeliac?: boolean;
    tag?: string;
  }
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  let updatedInvitado: Invitado | undefined;

  const result = await updateFiestaData(fiestaId, data => {
    const totalNew = submission.adultsCount + submission.kidsCount;

    const currentInvitados = data.invitados || [];
    const confirmedAdults = currentInvitados.reduce(
      (sum, inv) => sum + (inv.categoria === 'Adulto' ? (inv.partySize || 1) : 0),
      0
    );
    const confirmedKids = currentInvitados.reduce(
      (sum, inv) => sum + (inv.categoria === 'Niño/Adolescente' ? (inv.partySize || 1) : 0),
      0
    );

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
      invitadoExistenteIndex > -1 ? currentInvitados[invitadoExistenteIndex].notes : '',
      submission.mensaje,
    ]
      .filter(Boolean)
      .join('\n---\n');

    const mainCategory: CategoriaInvitado =
      submission.adultsCount >= submission.kidsCount ? 'Adulto' : 'Niño/Adolescente';

    if (invitadoExistenteIndex > -1) {
      updatedInvitado = {
        ...currentInvitados[invitadoExistenteIndex],
        rsvp: submission.confirmacion as RsvpStatus,
        partySize: totalNew,
        categoria: mainCategory,
        notes: combinedNotes,
        companionNames: submission.companionNames,
        isCeliac: submission.isCeliac ?? currentInvitados[invitadoExistenteIndex].isCeliac,
        tag: submission.tag || currentInvitados[invitadoExistenteIndex].tag,
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
        tag: submission.tag,
      };
      data.invitados = [...currentInvitados, updatedInvitado];
    }
    return data;
  });

  return { ...result, invitado: updatedInvitado };
}

// ─── Personalized experience ─────────────────────────────────────────────────

/**
 * Update the guest's personalized experience fields:
 * message to hosts and/or uploaded photos.
 */
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

// ─── Restrictions & companions ────────────────────────────────────────────────

/**
 * Update only the guest's dietary restrictions and companion information
 * without touching RSVP status.
 */
export async function updateGuestDetails(
  fiestaId: string,
  invitadoId: string,
  details: {
    dietaryRestriction?: DietaryRestriction;
    alergiasEspecificas?: string;
    companionNames?: string[];
    partySize?: number;
    cancionesDJ?: string[];
  }
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  let updatedInvitado: Invitado | undefined;
  const result = await updateFiestaData(fiestaId, data => {
    const invitados = (data.invitados || []).map(inv => {
      if (inv.id !== invitadoId) return inv;
      updatedInvitado = {
        ...inv,
        ...details,
        isCeliac: details.dietaryRestriction === 'Celiaco' || inv.isCeliac,
      };
      return updatedInvitado;
    });
    return { ...data, invitados };
  });
  return { ...result, invitado: updatedInvitado };
}

// ─── Check-in ────────────────────────────────────────────────────────────────

export async function checkInGuest(
  fiestaId: string,
  guestId: string
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  let invitadoActualizado: Invitado | undefined;
  let found = false;
  const result = await updateFiestaData(fiestaId, data => {
    const invitados = (data.invitados || []).map(inv => {
      if (inv.id === guestId) {
        found = true;
        if (inv.checkedIn) {
          invitadoActualizado = inv;
          return inv;
        }
        invitadoActualizado = { ...inv, checkedIn: true, checkInTimestamp: new Date().toISOString() };
        return invitadoActualizado;
      }
      return inv;
    });
    if (!found) return data;
    return { ...data, invitados };
  });

  if (!found) return { success: false, error: 'Invitado no encontrado.' };
  return { ...result, invitado: invitadoActualizado };
}

// ─── Public RSVP (invitation page) ───────────────────────────────────────────

export async function submitPublicRsvp(
  fiestaId: string,
  submission: {
    nombre: string;
    contacto?: string;
    asistencia: 'Confirmado' | 'Rechazado' | 'Tal vez';
    partySize?: number;
    companionNames?: string[];
    dietaryRestriction: DietaryRestriction;
    alergiasEspecificas?: string;
    cancionesDJ: string[];
    mensaje?: string;
    requiereAccesibilidad?: boolean;
  }
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  let savedInvitado: Invitado | undefined;

  // Normalise dietary restriction to valid type
  const dietary: DietaryRestriction = (['Ninguna', 'Celiaco', 'Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Alergia Mariscos', 'Alergia Frutos Secos', 'Otro'] as DietaryRestriction[]).includes(submission.dietaryRestriction as DietaryRestriction)
    ? (submission.dietaryRestriction as DietaryRestriction)
    : 'Ninguna';

  const rsvpStatus: RsvpStatus = submission.asistencia === 'Tal vez' ? 'Tal vez' : submission.asistencia;

  const result = await updateFiestaData(fiestaId, data => {
    const currentInvitados = data.invitados || [];
    const existingIndex = currentInvitados.findIndex(
      inv => inv.nombre.trim().toLowerCase() === submission.nombre.trim().toLowerCase()
    );

    if (existingIndex > -1) {
      savedInvitado = {
        ...currentInvitados[existingIndex],
        rsvp: rsvpStatus,
        contacto: submission.contacto ?? currentInvitados[existingIndex].contacto,
        partySize: submission.partySize ?? currentInvitados[existingIndex].partySize,
        companionNames: submission.companionNames ?? currentInvitados[existingIndex].companionNames,
        dietaryRestriction: dietary,
        alergiasEspecificas: submission.alergiasEspecificas ?? currentInvitados[existingIndex].alergiasEspecificas,
        cancionesDJ: submission.cancionesDJ.length > 0 ? submission.cancionesDJ : currentInvitados[existingIndex].cancionesDJ,
        mensaje: submission.mensaje ?? currentInvitados[existingIndex].mensaje,
        requiereAccesibilidad: submission.requiereAccesibilidad ?? currentInvitados[existingIndex].requiereAccesibilidad,
        isCeliac: dietary === 'Celiaco',
      };
      currentInvitados[existingIndex] = savedInvitado;
      return { ...data, invitados: [...currentInvitados] };
    } else {
      savedInvitado = {
        id: `inv_rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nombre: submission.nombre.trim(),
        rsvp: rsvpStatus,
        categoria: 'Adulto',
        contacto: submission.contacto,
        partySize: submission.partySize,
        companionNames: submission.companionNames,
        dietaryRestriction: dietary,
        alergiasEspecificas: submission.alergiasEspecificas,
        cancionesDJ: submission.cancionesDJ,
        mensaje: submission.mensaje,
        requiereAccesibilidad: submission.requiereAccesibilidad,
        isCeliac: dietary === 'Celiaco',
      };
      return { ...data, invitados: [...currentInvitados, savedInvitado] };
    }
  });

  return { ...result, invitado: savedInvitado };
}

// ─── Guest CTA click tracking ──────────────────────────────────────────────

type GuestCtaStat = 'clickedWhatsapp' | 'clickedInstagram' | 'clickedLanding' | 'clickedSimulator';

/**
 * Records a CTA click in the guest's guestExperienceStats.
 * Called fire-and-forget from the client portal — errors are swallowed on the caller side.
 */
export async function trackGuestCtaClick(
  fiestaId: string,
  guestId: string,
  stat: GuestCtaStat
): Promise<{ success: boolean }> {
  const result = await updateFiestaData(fiestaId, data => {
    const invitados = (data.invitados || []).map(inv => {
      if (inv.id !== guestId) return inv;
      return {
        ...inv,
        guestExperienceStats: {
          ...(inv.guestExperienceStats ?? {}),
          [stat]: true,
        },
      };
    });
    return { ...data, invitados };
  });
  return { success: result.success };
}
