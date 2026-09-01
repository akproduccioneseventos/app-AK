'use server';

import path from 'path';
import { readData, writeData } from '@/lib/data-service';
import { getAccesoById, type AccesoPersonal } from '@/app/actions/accesos-personal';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getRolesPublicos } from '@/app/actions/roles';
import type { ProgramaEventoItem, FiestaEnPlanificacion } from '@/types/fiesta';

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
    programa: ProgramaEventoItem[];
  };
};

export async function getAccesoPersonalPortalView(
  tokenId: string,
): Promise<AccesoPersonalPortalView | null> {
  const acceso = await getAccesoById(tokenId);
  if (!acceso) return null;
  if (!acceso.fiestaId) return { acceso };

  const fiesta = await getFiestaById(acceso.fiestaId);
  if (!fiesta) return null;

  let rolAsignado = 'Colaborador';
  let asistenciaConfirmada: boolean | undefined;
  let fechaConfirmacionAsistencia: string | undefined;
  let motivoRechazoAsistencia: string | undefined;

  const asignacion = acceso.empleadoId ? fiesta.personalAsignado?.find(p => p.empleadoId === acceso.empleadoId) : undefined;
  if (asignacion) {
    asistenciaConfirmada = asignacion.asistenciaConfirmada;
    fechaConfirmacionAsistencia = asignacion.fechaConfirmacionAsistencia;
    motivoRechazoAsistencia = asignacion.motivoRechazoAsistencia;

    const roles = await getRolesPublicos();
    const rol = roles.find(r => r.id === asignacion.rolId);
    if (rol) {
      rolAsignado = rol.nombre;
    }
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

  const fiesta = await getFiestaById(acceso.fiestaId);
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
