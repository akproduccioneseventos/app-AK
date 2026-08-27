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
  // **Esto tambien pide sesion, y no es un detalle.** En Next, cada funcion exportada de
  // un archivo de acciones queda abierta a internet. Sin esta linea, cualquiera con la
  // direccion podia leer cuanto tiene puesto de tope de publicidad y cuanto lleva
  // comprometido. Es informacion del negocio, y ademas le dice a un competidor cuanto
  // esta gastando.
  await requireAppSession();
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
  // Este es el mas sensible de los tres: es el registro completo de lo que el agente
  // toco, con nombres de campanas, presupuestos de antes y de despues y los motivos.
  // Sin sesion, era el plan de medios de AK servido a quien lo pidiera.
  await requireAppSession();
  return await getAccionesPublicidadEjecutadas();
}
