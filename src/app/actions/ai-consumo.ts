'use server';

import { verifySession } from '@/lib/auth/session-token';
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
};

export async function getGastoDeIA(): Promise<ResumenDeGasto> {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') return SIN_ACCESO;

  const { getResumenDeGasto } = await import('@/lib/ai/consumo-servidor');
  return getResumenDeGasto();
}

export async function setTopeDeIA(
  topeUYU: number,
): Promise<{ success: boolean; resumen?: ResumenDeGasto; error?: string }> {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') {
    return { success: false, error: 'Solo un administrador puede cambiar el tope.' };
  }

  const { setTopeMensual } = await import('@/lib/ai/consumo-servidor');
  return { success: true, resumen: await setTopeMensual(topeUYU) };
}
