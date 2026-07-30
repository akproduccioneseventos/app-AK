'use server';

import { randomUUID } from 'crypto';
import type { FiestaEnPlanificacion, Invitado, RsvpStatus, CategoriaInvitado, DietaryRestriction } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { writeData } from '@/lib/data-service';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { hasPublicGuestAccess } from '@/lib/guest-portal-public-data';

// ─── Core helper ────────────────────────────────────────────────────────────

const fiestaUpdateQueues = new Map<string, Promise<void>>();

async function acquireFiestaUpdateLock(fiestaId: string): Promise<() => void> {
  const previous = fiestaUpdateQueues.get(fiestaId);
  let releaseCurrent!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  fiestaUpdateQueues.set(fiestaId, current);
  if (previous) await previous;

  return () => {
    releaseCurrent();
    if (fiestaUpdateQueues.get(fiestaId) === current) {
      fiestaUpdateQueues.delete(fiestaId);
    }
  };
}

function normalizeGuestName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
    .replace(/\s+/g, ' ');
}

async function updateFiestaData(
  fiestaId: string,
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion,
  options: { publicRsvp?: boolean } = {},
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  const releaseLock = await acquireFiestaUpdateLock(fiestaId);
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
      throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
    }
    const updatedData = updateFn(currentData);
    const result: {
      success: boolean;
      fiesta?: FiestaEnPlanificacion;
      error?: string;
    } = options.publicRsvp
      ? await writeData(`fiestas/${fiestaId}.json`, updatedData).then(() => ({
          success: true,
          fiesta: updatedData,
        }))
      : await saveFiesta(updatedData);
    if (!result.success || !result.fiesta) {
      throw new Error(result.error || 'No se pudo guardar la fiesta después de actualizar los invitados.');
    }
    return { success: true, updatedFiesta: result.fiesta };
  } catch (e: any) {
    return { success: false, error: e.message };
  } finally {
    releaseLock();
  }
}

// ─── Guest queries ───────────────────────────────────────────────────────────

export async function getInvitados(fiestaId: string): Promise<Invitado[]> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.invitados || [];
}

export async function getConfirmedRsvpCount(fiestaId: string): Promise<number> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta?.invitados) return 0;
  return fiesta.invitados.filter(i => i.rsvp === 'Confirmado').length;
}

// ─── Guest CRUD ──────────────────────────────────────────────────────────────

export async function addInvitado(fiestaId: string, nuevoInvitadoData: Omit<Invitado, 'id'>) {
  let nuevoInvitado: Invitado | null = null;
  const result = await updateFiestaData(fiestaId, data => {
    nuevoInvitado = {
      ...nuevoInvitadoData,
      id: `inv_${Date.now()}`,
      guestAccessToken: nuevoInvitadoData.guestAccessToken ?? randomUUID(),
    };
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
    const normalizedSubmittedName = normalizeGuestName(submission.nombreCompleto);
    const invitadoExistenteIndex = currentInvitados.findIndex(
      inv => normalizeGuestName(inv.nombre) === normalizedSubmittedName
    );
    const existingGuest = invitadoExistenteIndex > -1
      ? currentInvitados[invitadoExistenteIndex]
      : undefined;
    const confirmedAdults = currentInvitados.reduce(
      (sum, inv) => sum + (
        inv.id !== existingGuest?.id && inv.categoria === 'Adulto'
          ? (inv.partySize || 1)
          : 0
      ),
      0
    );
    const confirmedKids = currentInvitados.reduce(
      (sum, inv) => sum + (
        inv.id !== existingGuest?.id && inv.categoria === 'Niño/Adolescente'
          ? (inv.partySize || 1)
          : 0
      ),
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

  await enforcePublicRateLimit({
    scope: 'public-event-rsvp',
    identity: fiestaId,
    limit: 12,
    windowMs: 15 * 60 * 1000,
  });

  const nombre = submission.nombre.trim().slice(0, 120);
  if (!nombre) return { success: false, error: 'El nombre es obligatorio.' };
  const contacto = submission.contacto?.trim().slice(0, 80) || undefined;
  const partySize = submission.partySize
    ? Math.max(1, Math.min(20, Math.round(submission.partySize)))
    : undefined;
  const companionNames = submission.companionNames
    ?.slice(0, 19)
    .map((name) => name.trim().slice(0, 120))
    .filter(Boolean);
  const cancionesDJ = submission.cancionesDJ
    .slice(0, 10)
    .map((song) => song.trim().slice(0, 150))
    .filter(Boolean);
  const alergiasEspecificas = submission.alergiasEspecificas?.trim().slice(0, 500);
  const mensaje = submission.mensaje?.trim().slice(0, 1000);

  // Normalise dietary restriction to valid type
  const dietary: DietaryRestriction = (['Ninguna', 'Celiaco', 'Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Alergia Mariscos', 'Alergia Frutos Secos', 'Otro'] as DietaryRestriction[]).includes(submission.dietaryRestriction as DietaryRestriction)
    ? (submission.dietaryRestriction as DietaryRestriction)
    : 'Ninguna';

  const rsvpStatus: RsvpStatus = submission.asistencia === 'Tal vez' ? 'Tal vez' : submission.asistencia;

  const result = await updateFiestaData(fiestaId, data => {
    const currentInvitados = data.invitados || [];
    const existingIndex = currentInvitados.findIndex(
      inv => normalizeGuestName(inv.nombre) === normalizeGuestName(nombre)
    );

    if (existingIndex > -1) {
      savedInvitado = {
        ...currentInvitados[existingIndex],
        // Stamp a token if the existing invitado doesn't have one yet
        guestAccessToken: currentInvitados[existingIndex].guestAccessToken ?? randomUUID(),
        rsvp: rsvpStatus,
        contacto: contacto ?? currentInvitados[existingIndex].contacto,
        partySize: partySize ?? currentInvitados[existingIndex].partySize,
        companionNames: companionNames ?? currentInvitados[existingIndex].companionNames,
        dietaryRestriction: dietary,
        alergiasEspecificas: alergiasEspecificas ?? currentInvitados[existingIndex].alergiasEspecificas,
        cancionesDJ: cancionesDJ.length > 0 ? cancionesDJ : currentInvitados[existingIndex].cancionesDJ,
        mensaje: mensaje ?? currentInvitados[existingIndex].mensaje,
        requiereAccesibilidad: submission.requiereAccesibilidad ?? currentInvitados[existingIndex].requiereAccesibilidad,
        isCeliac: dietary === 'Celiaco',
      };
      currentInvitados[existingIndex] = savedInvitado;
      return { ...data, invitados: [...currentInvitados] };
    } else {
      savedInvitado = {
        id: `inv_rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        guestAccessToken: randomUUID(),
        nombre,
        rsvp: rsvpStatus,
        categoria: 'Adulto',
        contacto,
        partySize,
        companionNames,
        dietaryRestriction: dietary,
        alergiasEspecificas,
        cancionesDJ,
        mensaje,
        requiereAccesibilidad: submission.requiereAccesibilidad,
        isCeliac: dietary === 'Celiaco',
      };
      return { ...data, invitados: [...currentInvitados, savedInvitado] };
    }
  }, { publicRsvp: true });

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
  guestAccessToken: string,
  stat: GuestCtaStat
): Promise<{ success: boolean }> {
  const result = await updateFiestaData(fiestaId, data => {
    const currentGuest = (data.invitados || []).find(inv => inv.id === guestId);
    if (!hasPublicGuestAccess(currentGuest, guestId, guestAccessToken)) {
      throw new Error('Acceso de invitado no autorizado.');
    }

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
  }, { publicRsvp: true });
  return { success: result.success };
}
