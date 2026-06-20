'use server';

import { getFiestaById, saveFiesta } from './fiesta/fiesta.actions';
import type {
  FiestaEnPlanificacion,
  FotoEnVivo,
  SolicitudCancion,
  MensajeEnVivo,
  VotacionEnVivo,
  EventoEnVivoData,
  CaptacionInvitadoEnVivo,
} from '@/types/fiesta';
import { normalizeBirthdayMonthDay } from '@/lib/commercial/birthday';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';

function getOrInitData(fiesta: FiestaEnPlanificacion): EventoEnVivoData {
  const current = fiesta.eventoEnVivo ?? {
    fotos: [],
    solicitudesCanciones: [],
    mensajes: [],
    votaciones: [],
  };
  return { ...current, captaciones: current.captaciones || [] };
}

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function getEventoEnVivoData(fiestaId: string): Promise<EventoEnVivoData> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { fotos: [], solicitudesCanciones: [], mensajes: [], votaciones: [] };
  return getOrInitData(fiesta);
}

export async function getFotosEnVivo(fiestaId: string): Promise<FotoEnVivo[]> {
  const data = await getEventoEnVivoData(fiestaId);
  return data.fotos;
}

export async function registerGuestLiveInterest(
  fiestaId: string,
  input: {
    nombre: string;
    telefono: string;
    birthdayMonthDay?: string;
    marketingConsent: boolean;
  },
): Promise<{ success: boolean; leadSaved?: boolean; error?: string }> {
  try {
    const nombre = input.nombre.trim().replace(/\s+/g, ' ').slice(0, 120);
    const telefono = normalizeUruguayPhone(input.telefono);
    const birthdayMonthDay = normalizeBirthdayMonthDay(input.birthdayMonthDay);
    if (nombre.length < 3) return { success: false, error: 'Ingresa tu nombre completo.' };
    if (!/^09\d{7}$/.test(telefono)) return { success: false, error: 'Ingresa un celular uruguayo valido.' };
    if (input.birthdayMonthDay && !birthdayMonthDay) {
      return { success: false, error: 'La fecha de cumpleanos no es valida.' };
    }

    await enforcePublicRateLimit({
      scope: 'guest-live-interest',
      identity: `${fiestaId}|${telefono}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const now = new Date().toISOString();
    const capture: CaptacionInvitadoEnVivo = {
      id: `capture_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nombre,
      telefono,
      birthdayMonthDay,
      marketingConsent: input.marketingConsent,
      timestamp: now,
    };

    let persistedInTransaction = false;
    try {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        const ref = dbAdmin.collection('fiestas').doc(fiestaId);
        await dbAdmin.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(ref);
          if (!snapshot.exists) throw new Error('Evento no encontrado.');
          const stored = snapshot.data() as FiestaEnPlanificacion;
          const eventData = getOrInitData(stored);
          const existingIndex = (eventData.captaciones || []).findIndex(item => item.telefono === telefono);
          const captures = [...(eventData.captaciones || [])];
          if (existingIndex >= 0) captures[existingIndex] = { ...captures[existingIndex], ...capture, id: captures[existingIndex].id };
          else captures.push(capture);
          transaction.update(ref, {
            eventoEnVivo: { ...eventData, captaciones: captures.slice(-500) },
            _syncedAt: now,
          });
        });
        persistedInTransaction = true;
      }
    } catch (error) {
      console.warn('[guest-capture] Firestore transaction unavailable, using fiesta fallback.', error);
    }

    if (!persistedInTransaction) {
      const eventData = getOrInitData(fiesta);
      const captures = [...(eventData.captaciones || [])];
      const existingIndex = captures.findIndex(item => item.telefono === telefono);
      if (existingIndex >= 0) captures[existingIndex] = { ...captures[existingIndex], ...capture, id: captures[existingIndex].id };
      else captures.push(capture);
      const result = await saveFiesta({
        ...fiesta,
        eventoEnVivo: { ...eventData, captaciones: captures.slice(-500) },
      });
      if (!result.success) return result;
    }

    if (input.marketingConsent) {
      const eventName = fiesta.configuracion?.nombreEvento
        || fiesta.configuracion?.nombreAgasajado
        || 'Evento AK';
      await upsertPublicCommercialLead({
        name: nombre,
        phone: telefono,
        birthdayMonthDay,
        marketingConsent: true,
        marketingConsentSource: 'sorteo-evento-en-vivo',
        referrerEventName: eventName,
        notes: `Interes comercial voluntario registrado durante ${eventName}.`,
        acquisition: {
          source: 'guest_portal',
          campaign: 'guest-live-experience',
          refFiestaId: fiestaId,
          entryPath: `/evento/en-vivo/${fiestaId}/invitados`,
        },
      });
    }

    return { success: true, leadSaved: input.marketingConsent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo registrar la participacion.',
    };
  }
}

export async function addFotoEnVivo(
  fiestaId: string,
  foto: Omit<FotoEnVivo, 'id' | 'timestamp'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    data.fotos.push({ ...foto, id: randomId(), timestamp: new Date().toISOString() });
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo guardar la foto.' };
  }
}

export async function getSolicitudesCanciones(fiestaId: string): Promise<SolicitudCancion[]> {
  const data = await getEventoEnVivoData(fiestaId);
  return data.solicitudesCanciones;
}

export async function addSolicitudCancion(
  fiestaId: string,
  solicitud: Omit<SolicitudCancion, 'id' | 'timestamp' | 'reproducida'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    data.solicitudesCanciones.push({
      ...solicitud,
      id: randomId(),
      timestamp: new Date().toISOString(),
      reproducida: false,
    });
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo guardar la solicitud.' };
  }
}

export async function marcarCancionReproducida(
  fiestaId: string,
  solicitudId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    data.solicitudesCanciones = data.solicitudesCanciones.map(s =>
      s.id === solicitudId ? { ...s, reproducida: !s.reproducida } : s
    );
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo actualizar la solicitud.' };
  }
}

export async function getMensajesEnVivo(fiestaId: string): Promise<MensajeEnVivo[]> {
  const data = await getEventoEnVivoData(fiestaId);
  return data.mensajes;
}

export async function addMensajeEnVivo(
  fiestaId: string,
  mensaje: Omit<MensajeEnVivo, 'id' | 'timestamp' | 'destacado'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    data.mensajes.push({
      ...mensaje,
      id: randomId(),
      timestamp: new Date().toISOString(),
      destacado: false,
    });
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo guardar el mensaje.' };
  }
}

export async function toggleMensajeDestacado(
  fiestaId: string,
  mensajeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    data.mensajes = data.mensajes.map(m =>
      m.id === mensajeId ? { ...m, destacado: !m.destacado } : m
    );
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo actualizar el mensaje.' };
  }
}

export async function getVotaciones(fiestaId: string): Promise<VotacionEnVivo[]> {
  const data = await getEventoEnVivoData(fiestaId);
  return data.votaciones;
}

export async function createVotacion(
  fiestaId: string,
  votacion: Omit<VotacionEnVivo, 'id' | 'timestamp' | 'activa'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    data.votaciones.push({
      ...votacion,
      id: randomId(),
      timestamp: new Date().toISOString(),
      activa: true,
    });
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo crear la votación.' };
  }
}

export async function votarEnVivo(
  fiestaId: string,
  votacionId: string,
  opcionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    data.votaciones = data.votaciones.map(v => {
      if (v.id !== votacionId) return v;
      return {
        ...v,
        opciones: v.opciones.map(o =>
          o.id === opcionId ? { ...o, votos: o.votos + 1 } : o
        ),
      };
    });
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo registrar el voto.' };
  }
}

export async function toggleVotacionActiva(
  fiestaId: string,
  votacionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    data.votaciones = data.votaciones.map(v =>
      v.id === votacionId ? { ...v, activa: !v.activa } : v
    );
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo actualizar la votación.' };
  }
}

export async function deleteContenidoEnVivo(
  fiestaId: string,
  tipo: 'foto' | 'cancion' | 'mensaje' | 'votacion',
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    const data = getOrInitData(fiesta);
    switch (tipo) {
      case 'foto':
        data.fotos = data.fotos.filter(f => f.id !== id);
        break;
      case 'cancion':
        data.solicitudesCanciones = data.solicitudesCanciones.filter(s => s.id !== id);
        break;
      case 'mensaje':
        data.mensajes = data.mensajes.filter(m => m.id !== id);
        break;
      case 'votacion':
        data.votaciones = data.votaciones.filter(v => v.id !== id);
        break;
    }
    return (await saveFiesta({ ...fiesta, eventoEnVivo: data })) as { success: boolean; error?: string };
  } catch {
    return { success: false, error: 'No se pudo eliminar el contenido.' };
  }
}
