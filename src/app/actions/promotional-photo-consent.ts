'use server';

import { mutarDocumento } from '@/lib/generic-json-store';
import { readData } from '@/lib/data-service';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { verifySession } from '@/lib/auth/session-token';
import { PERMISOS } from '@/lib/auth/perfiles';
import type { PromotionalPhotoConsent, PromotionalPhotoConsentVersion } from '@/types/promotional-photo-consent';
import { validarFotosPromocionalesAlEnviar } from '@/lib/asistente/comercial-borrador';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';

const FILE = 'promotional-photo-consents.json';

export async function registrarPermisoFotoPromocional(input: {
  eventId: string;
  authorized: boolean;
  grantedBy: 'owner' | 'client';
  method: 'contract' | 'written' | 'recorded';
  evidenceReference: string;
  contractVersion: string;
}): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.CRM, PERMISOS.ORGANIZACION);
  const session = await verifySession();
  if (!session.success || !session.user) return { success: false, error: 'Sesión no autorizada.' };
  if (!input || typeof input !== 'object'
    || typeof input.authorized !== 'boolean'
    || input.grantedBy !== 'owner'
    || !['contract', 'written', 'recorded'].includes(input.method)) {
    return { success: false, error: 'La decisión o su origen no son válidos.' };
  }
  const eventId = typeof input.eventId === 'string' ? input.eventId.trim() : '';
  const evidenceReference = typeof input.evidenceReference === 'string' ? input.evidenceReference.trim() : '';
  const contractVersion = typeof input.contractVersion === 'string' ? input.contractVersion.trim() : '';
  if (!eventId || !evidenceReference || !contractVersion) {
    return { success: false, error: 'Se requiere fiesta, evidencia y versión del documento.' };
  }
  const fiesta = await getFiestaByIdRaw(eventId);
  if (!fiesta || fiesta.id !== eventId) return { success: false, error: 'La fiesta indicada no existe.' };
  if (input.authorized) {
    if (input.method !== 'contract') {
      return { success: false, error: 'El permiso del dueño requiere referencia a una cláusula de contrato.' };
    }
    if (!fiesta.contratoFirmaInfo?.isSigned && !fiesta.firmaDigitalConstancia) {
      return { success: false, error: 'Solo puede documentarse una cláusula promocional de un contrato firmado de esta fiesta.' };
    }
  }
  const now = new Date().toISOString();
  try {
    const updated = await mutarDocumento<Record<string, PromotionalPhotoConsent>>(FILE, {}, actual => {
      const previous = actual[eventId];
      const { history, ...previousVersion } = previous || {} as PromotionalPhotoConsent;
      return {
      ...actual,
      [eventId]: {
        eventId,
        authorized: input.authorized,
        grantedBy: input.grantedBy,
        method: input.method,
        evidenceReference,
        contractVersion,
        recordedBy: session.user!.email || session.user!.userId || 'Usuario autenticado',
        recordedAt: now,
        revokedAt: input.authorized ? undefined : now,
        history: [...(history || []), ...(previous ? [previousVersion as PromotionalPhotoConsentVersion] : [])],
      },
    };
    });
    return updated ? { success: true } : { success: false, error: 'No se pudo guardar el permiso.' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'No se pudo guardar el permiso.' };
  }
}

export async function obtenerAuditoriaPermisosFotos(): Promise<PromotionalPhotoConsent[]> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.CRM, PERMISOS.ORGANIZACION);
  const consents = await readData<Record<string, PromotionalPhotoConsent>>(FILE, {});
  return Object.values(consents).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export async function revocarPermisoFotoPromocional(eventId: string): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.CRM, PERMISOS.ORGANIZACION);
  const session = await verifySession();
  if (!session.success || !session.user) return { success: false, error: 'Sesión no autorizada.' };
  if (typeof eventId !== 'string' || !eventId.trim()) return { success: false, error: 'Fiesta no válida.' };
  const fiesta = await getFiestaByIdRaw(eventId);
  if (!fiesta || fiesta.id !== eventId) return { success: false, error: 'La fiesta indicada no existe.' };
  try {
    const now = new Date().toISOString();
    const updated = await mutarDocumento<Record<string, PromotionalPhotoConsent>>(FILE, {}, current => {
      const existing = current[eventId];
      if (!existing) return current;
      const { history, ...previous } = existing;
      return { ...current, [eventId]: {
        ...existing,
        authorized: false,
        revokedAt: now,
        recordedAt: now,
        recordedBy: session.user!.email || session.user!.userId || 'Usuario autenticado',
        history: [...(history || []), previous as PromotionalPhotoConsentVersion],
      } };
    });
    return updated ? { success: true } : { success: false, error: 'No se pudo revocar el permiso.' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'No se pudo revocar el permiso.' };
  }
}

export async function validarFotosPromocionalesParaEnvio(photoIds: string[]) {
  await requirePermisoAlguno(PERMISOS.CRM, PERMISOS.ADMINISTRACION);
  return validarFotosPromocionalesAlEnviar(photoIds);
}
