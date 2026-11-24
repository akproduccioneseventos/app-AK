'use server';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';

import { revalidatePath } from 'next/cache';
import {
  getEstadoDelTope,
  getTopeDeGasto,
  guardarTopeDeGasto,
  type CampanaConPresupuesto,
  type EstadoDelTope,
} from '@/lib/marketing/tope-de-gasto-publicidad';
import {
  getAccionesPublicidadEjecutadas,
  type AccionPublicidadEjecutada,
} from '@/lib/marketing/meta-ads-acciones';

export async function obtenerEstadoTopePublicidad(
  campanas: CampanaConPresupuesto[] = []
): Promise<EstadoDelTope> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.CRM, PERMISOS.ADMINISTRACION);
  return await getEstadoDelTope(campanas);
}

export async function actualizarTopePublicidad(
  topeMensualUYU: number
): Promise<{ success: boolean; mensaje: string }> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD); // revisión de plata, 6/10/2026: no cualquier sesión
  try {
    await guardarTopeDeGasto(topeMensualUYU);
    revalidatePath('/contabilidad/crm/marketing-ads');
    return {
      success: true,
      mensaje: `Tope mensual actualizado a $${Math.round(topeMensualUYU).toLocaleString('es-UY')}.`,
    };
  } catch (error: any) {
    return {
      success: false,
      mensaje: error?.message || 'Error al guardar el tope de publicidad.',
    };
  }
}

export async function obtenerHistorialAccionesPublicidad(): Promise<AccionPublicidadEjecutada[]> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.CRM, PERMISOS.ADMINISTRACION);
  return await getAccionesPublicidadEjecutadas();
}
