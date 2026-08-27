'use server';

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

import { requireAppSession } from '@/lib/auth/require-session';

export async function obtenerEstadoTopePublicidad(
  campanas: CampanaConPresupuesto[] = []
): Promise<EstadoDelTope> {
  return await getEstadoDelTope(campanas);
}

export async function actualizarTopePublicidad(
  topeMensualUYU: number
): Promise<{ success: boolean; mensaje: string }> {
  await requireAppSession();
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
  return await getAccionesPublicidadEjecutadas();
}
