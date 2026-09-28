'use server';

import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import type { Comparativa } from '@/lib/costos/comparativa';

/**
 * La comparación de ganancia entre todas las fiestas.
 *
 * Pide el permiso de Contabilidad, no alcanza con tener sesión: acá se ve lo que
 * dejó cada evento y lo que se le cobró a cada cliente. Es la información más
 * sensible del negocio junto con los sueldos.
 */
export async function getComparativaDeGanancias(): Promise<{
  ok: boolean;
  comparativa?: Comparativa;
  error?: string;
}> {
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) return { ok: false, error: permiso.error };

  const { getFiestas } = await import('@/app/actions/fiesta/fiesta.actions');
  const { compararGanancias } = await import('@/lib/costos/comparativa');

  // Con archivadas incluidas: la comparación sirve justamente para mirar atrás.
  const fiestas = await getFiestas(true);
  // Los cobros de cada presupuesto, para restar la comisión real de Mercado Pago.
  const { getPresupuestos } = await import('@/app/actions/presupuestos');
  const presupuestos = await getPresupuestos(true);
  const cobrosPorPresupuesto = new Map(
    presupuestos.map((presupuesto) => [presupuesto.id, presupuesto.pagosCliente ?? []]),
  );
  return { ok: true, comparativa: compararGanancias(fiestas, cobrosPorPresupuesto) };
}
