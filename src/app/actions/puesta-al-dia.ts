'use server';

import { getPresupuestos } from '@/app/actions/presupuestos';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  buildPuestaAlDiaReporte,
  type PuestaAlDiaReporte,
} from '@/lib/commercial-flow/puesta-al-dia';

/**
 * Revisa los eventos que ya pasaron y devuelve qué quedó desacomodado.
 *
 * Sólo lee: no cierra fiestas ni toca plata por su cuenta. Cada caso puede tener
 * un motivo que sólo conoce el dueño, así que la aplicación señala y él decide.
 */
export async function getPuestaAlDiaReport(): Promise<{
  success: boolean;
  generatedAt?: string;
  report?: PuestaAlDiaReporte;
  error?: string;
}> {
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) return { success: false, error: permiso.error };

  try {
    // Se revisan las fiestas ABIERTAS: son las que pueden estar desacomodadas.
    // Las archivadas ya están cerradas y no hay nada que ordenar en ellas.
    //
    // Pero sí hacen falta para una cosa: saber que un presupuesto ya tiene su
    // evento. Sin eso, un presupuesto cuyo evento se archivó correctamente
    // aparecía como si nunca se hubiera creado la fiesta, que es alarma falsa
    // justo en los eventos viejos, que son los que más se archivan.
    const [presupuestos, abiertas, todas] = await Promise.all([
      getPresupuestos(true),
      getFiestas(false),
      getFiestas(true),
    ]);

    const presupuestosConEventoArchivado = new Set(
      todas.map((f) => f.presupuestoId).filter(Boolean) as string[],
    );

    return {
      success: true,
      generatedAt: new Date().toISOString(),
      report: buildPuestaAlDiaReporte(
        abiertas,
        presupuestos,
        new Date(),
        presupuestosConEventoArchivado,
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo revisar los eventos pasados.',
    };
  }
}
