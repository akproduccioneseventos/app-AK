'use server';

import path from 'path';
import { readData, writeData } from '@/lib/data-service';
import { getAccesoById, type AccesoPersonal } from '@/app/actions/accesos-personal';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { getRolesPublicos } from '@/app/actions/roles';
import type { ProgramaEventoItem, FiestaEnPlanificacion } from '@/types/fiesta';
import type { Salon } from '@/types/salon';
import { getAjustesLlegadaPersonal } from '@/app/actions/settings';
import { calcularDistanciaMetros, extraerCoordenadasDeUrl } from '@/lib/geo/distancia';

export type AccesoPersonalPortalView = {
  acceso: AccesoPersonal;
  fiesta?: {
    id: string;
    nombreEvento: string;
    lugar: string;
    direccion: string;
    horaInicio: string;
    telefonoEncargado: string;
    rolAsignado: string;
    asistenciaConfirmada?: boolean;
    fechaConfirmacionAsistencia?: string;
    motivoRechazoAsistencia?: string;
    checkInTimestamp?: string;
    programa: ProgramaEventoItem[];
  };
};

export async function getAccesoPersonalPortalView(
  tokenId: string,
): Promise<AccesoPersonalPortalView | null> {
  const acceso = await getAccesoById(tokenId);
  if (!acceso) return null;
  if (!acceso.fiestaId) return { acceso };

  const fiesta = await getFiestaById(acceso.fiestaId, LECTURA_COMPLETA);
  if (!fiesta) return null;

  let rolAsignado = 'Colaborador';
  let asistenciaConfirmada: boolean | undefined;
  let fechaConfirmacionAsistencia: string | undefined;
  let motivoRechazoAsistencia: string | undefined;

  let checkInTimestamp: string | undefined;

  const asignacion = acceso.empleadoId ? fiesta.personalAsignado?.find(p => p.empleadoId === acceso.empleadoId) : undefined;
  if (asignacion) {
    asistenciaConfirmada = asignacion.asistenciaConfirmada;
    fechaConfirmacionAsistencia = asignacion.fechaConfirmacionAsistencia;
    motivoRechazoAsistencia = asignacion.motivoRechazoAsistencia;
    checkInTimestamp = asignacion.checkInTimestamp;

    const roles = await getRolesPublicos();
    const rol = roles.find(r => r.id === asignacion.rolId);
    if (rol) {
      rolAsignado = rol.nombre;
    }
  } else if (!acceso.empleadoId && fiesta.personalAsignado?.[0]) {
    checkInTimestamp = fiesta.personalAsignado[0].checkInTimestamp;
  }

  return {
    acceso,
    fiesta: {
      id: fiesta.id,
      nombreEvento: fiesta.configuracion.nombreEvento,
      lugar: fiesta.configuracion.nombreLugar || '',
      direccion: fiesta.configuracion.direccionLugar || '',
      horaInicio: fiesta.configuracion.horaInicio || '',
      telefonoEncargado: fiesta.configuracion.telefonoAsistencia || '',
      rolAsignado,
      asistenciaConfirmada,
      fechaConfirmacionAsistencia,
      motivoRechazoAsistencia,
      checkInTimestamp,
      programa: fiesta.programa || [],
    },
  };
}

export async function responderAsistenciaPersonal(
  tokenId: string,
  confirma: boolean,
  motivo?: string
): Promise<{ success: boolean; error?: string }> {
  const acceso = await getAccesoById(tokenId);
  if (!acceso || !acceso.fiestaId) {
    return { success: false, error: 'Acceso no válido o sin evento asociado.' };
  }

  const fiesta = await getFiestaById(acceso.fiestaId, LECTURA_COMPLETA);
  if (!fiesta) {
    return { success: false, error: 'Evento no encontrado.' };
  }

  const personal = fiesta.personalAsignado || [];
  let updated = false;

  const nextPersonal = personal.map((p) => {
    if (acceso.empleadoId && p.empleadoId === acceso.empleadoId) {
      updated = true;
      return {
        ...p,
        asistenciaConfirmada: confirma,
        fechaConfirmacionAsistencia: new Date().toISOString(),
        motivoRechazoAsistencia: confirma ? undefined : (motivo?.trim() || 'No especificado'),
      };
    }
    return p;
  });

  if (!updated && personal.length > 0) {
    nextPersonal[0] = {
      ...nextPersonal[0],
      asistenciaConfirmada: confirma,
      fechaConfirmacionAsistencia: new Date().toISOString(),
      motivoRechazoAsistencia: confirma ? undefined : (motivo?.trim() || 'No especificado'),
    };
  }

  const filePath = path.join('fiestas', `${fiesta.id}.json`);
  await writeData(filePath, { ...fiesta, personalAsignado: nextPersonal });

  return { success: true };
}

export async function registrarLlegadaPersonal(
  tokenId: string,
  ubicacion?: { lat: number; lng: number }
): Promise<{ success: boolean; error?: string; distanciaMetros?: number }> {
  const acceso = await getAccesoById(tokenId);
  if (!acceso || !acceso.fiestaId) {
    return { success: false, error: 'Acceso no válido o sin evento asociado.' };
  }

  const fiesta = await getFiestaById(acceso.fiestaId, LECTURA_COMPLETA);
  if (!fiesta) {
    return { success: false, error: 'Evento no encontrado.' };
  }

  const ajustes = await getAjustesLlegadaPersonal();
  let distanciaCalculada: number | undefined;

  // Si está activada la verificación de ubicación en Ajustes
  if (ajustes.llegadaConUbicacion) {
    let salonCoords: { lat: number; lng: number } | null = null;

    if (fiesta.configuracion?.googleMapsUrl) {
      salonCoords = extraerCoordenadasDeUrl(fiesta.configuracion.googleMapsUrl);
    }

    if (!salonCoords && fiesta.configuracion?.nombreLugar) {
      const salones = await readData<Salon[]>('salones.json', []);
      const salon = salones.find(
        (s) =>
          s.nombre.toLowerCase().trim() === fiesta.configuracion.nombreLugar.toLowerCase().trim() ||
          s.id === fiesta.configuracion.nombreLugar
      );
      if (salon?.lat != null && salon?.lng != null) {
        salonCoords = { lat: salon.lat, lng: salon.lng };
      } else if (salon?.googleMapsUrl) {
        salonCoords = extraerCoordenadasDeUrl(salon.googleMapsUrl);
      }
    }

    // Si el salón tiene coordenadas, validamos distancia
    if (salonCoords) {
      if (!ubicacion || typeof ubicacion.lat !== 'number' || typeof ubicacion.lng !== 'number') {
        return { success: false, error: 'Para registrar la llegada se requiere tu ubicación actual.' };
      }

      distanciaCalculada = calcularDistanciaMetros(ubicacion, salonCoords);
      const radioMaximo = ajustes.radioMetros || 300;

      if (distanciaCalculada > radioMaximo) {
        return {
          success: false,
          error: `Estás a ${distanciaCalculada}m del salón (el máximo permitido es ${radioMaximo}m).`,
          distanciaMetros: distanciaCalculada,
        };
      }
    }
  }

  // Guardar llegada
  const personal = fiesta.personalAsignado || [];
  let updated = false;
  const nowIso = new Date().toISOString();

  const nextPersonal = personal.map((p) => {
    if (acceso.empleadoId && p.empleadoId === acceso.empleadoId) {
      updated = true;
      return {
        ...p,
        checkInTimestamp: p.checkInTimestamp || nowIso,
        checkInUbicacion: ubicacion
          ? {
              lat: ubicacion.lat,
              lng: ubicacion.lng,
              distanciaMetros: distanciaCalculada ?? 0,
            }
          : p.checkInUbicacion,
      };
    }
    return p;
  });

  if (!updated && personal.length > 0) {
    nextPersonal[0] = {
      ...nextPersonal[0],
      checkInTimestamp: nextPersonal[0].checkInTimestamp || nowIso,
      checkInUbicacion: ubicacion
        ? {
            lat: ubicacion.lat,
            lng: ubicacion.lng,
            distanciaMetros: distanciaCalculada ?? 0,
          }
        : nextPersonal[0].checkInUbicacion,
    };
  }

  const filePath = path.join('fiestas', `${fiesta.id}.json`);
  await writeData(filePath, { ...fiesta, personalAsignado: nextPersonal });

  return { success: true, distanciaMetros: distanciaCalculada };
}
