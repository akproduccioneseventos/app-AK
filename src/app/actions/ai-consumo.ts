'use server';

import { verifySession } from '@/lib/auth/session-token';
import { puede, PERMISOS, esAdministrador } from '@/lib/auth/perfiles';
import type { ResumenDeGasto } from '@/lib/ai/consumo';

/**
 * Lo que se gastó en inteligencia artificial este mes, y el tope.
 *
 * Es plata de la empresa: sólo el administrador lo ve y lo cambia.
 */

const SIN_ACCESO: ResumenDeGasto = {
  mes: '',
  porFuncion: {},
  generaciones: 0,
  gastadoUYU: 0,
  topeUYU: 0,
  estado: 'sin-tope',
  porcentaje: 0,
  frenado: false,
  mensaje: 'Solo un administrador puede ver el gasto de inteligencia artificial.',
  respuestasProfundasHoy: 0,
  topeDiarioProfundo: 40,
};

export async function getGastoDeIA(): Promise<ResumenDeGasto> {
  const session = await verifySession();
  if (!session.success || !puede(session.user, PERMISOS.ADMINISTRACION)) return SIN_ACCESO;

  const { getResumenDeGasto } = await import('@/lib/ai/consumo-servidor');
  return getResumenDeGasto();
}

export async function setTopeDeIA(
  topeUYU: number,
): Promise<{ success: boolean; resumen?: ResumenDeGasto; error?: string }> {
  const session = await verifySession();
  if (!session.success || !puede(session.user, PERMISOS.ADMINISTRACION)) {
    return { success: false, error: 'Solo un administrador puede cambiar el tope.' };
  }

  const { setTopeMensual } = await import('@/lib/ai/consumo-servidor');
  try {
    const resumen = await setTopeMensual(topeUYU);
    return { success: true, resumen };
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo guardar el tope mensual.' };
  }
}

export async function setTopeDiarioDeIA(
  topeDiario: number,
): Promise<{ success: boolean; resumen?: ResumenDeGasto; error?: string }> {
  const session = await verifySession();
  if (!session.success || !puede(session.user, PERMISOS.ADMINISTRACION)) {
    return { success: false, error: 'Solo un administrador puede cambiar el tope diario.' };
  }

  const { setTopeDiarioProfundo } = await import('@/lib/ai/consumo-servidor');
  try {
    const resumen = await setTopeDiarioProfundo(topeDiario);
    return { success: true, resumen };
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo guardar el tope diario.' };
  }
}
