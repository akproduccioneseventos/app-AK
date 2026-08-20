'use server';

import { getAccesoById, type AccesoPersonal } from '@/app/actions/accesos-personal';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getRolesPublicos } from '@/app/actions/roles';
import type { ProgramaEventoItem } from '@/types/fiesta';

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
  const asignacion = fiesta.personalAsignado?.find(p => p.empleadoId === acceso.empleadoId);
  if (asignacion) {
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
      programa: fiesta.programa || [],
    },
  };
}
