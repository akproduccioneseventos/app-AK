'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import {
  getDirectorioAltas,
  toggleDirectorioItemInternal,
} from '@/lib/presencia-digital/directorio-altas';
import {
  getFiestasSeguimientoResenas,
  marcarResenaSolicitada,
  type ResenasSeguimientoResumen,
} from '@/lib/presencia-digital/resenas-seguimiento';
import {
  autoGenerarBorradoresSemanales,
  type AutoGeneracionSemanasResult,
} from '@/lib/presencia-digital/autogenerador-semanal';
import type { DirectorioAltasResumen } from '@/types/directorio-altas';

export async function getDirectoriosAltasAction(): Promise<{
  success: boolean;
  data?: DirectorioAltasResumen;
  error?: string;
}> {
  try {
    await requireAppSession();
    const data = await getDirectorioAltas();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al obtener directorios.' };
  }
}

export async function toggleDirectorioItemAction(
  id: string,
  completado: boolean,
  notas?: string
): Promise<{
  success: boolean;
  data?: DirectorioAltasResumen;
  error?: string;
}> {
  try {
    await requireAppSession();
    const data = await toggleDirectorioItemInternal(id, completado, notas);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al actualizar directorio.' };
  }
}

export async function getFiestasSeguimientoResenasAction(): Promise<{
  success: boolean;
  data?: ResenasSeguimientoResumen;
  error?: string;
}> {
  try {
    await requireAppSession();
    const data = await getFiestasSeguimientoResenas();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al obtener seguimiento de reseñas.' };
  }
}

export async function marcarResenaSolicitadaAction(fiestaId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAppSession();
    const ok = await marcarResenaSolicitada(fiestaId);
    return { success: ok };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al marcar reseña como solicitada.' };
  }
}

export async function triggerAutoGeneracionSemanalAction(): Promise<{
  success: boolean;
  data?: AutoGeneracionSemanasResult;
  error?: string;
}> {
  try {
    await requireAppSession();
    const data = await autoGenerarBorradoresSemanales();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al autogenerar publicaciones.' };
  }
}
