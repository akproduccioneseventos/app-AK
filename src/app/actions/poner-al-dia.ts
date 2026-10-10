'use server';

import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { readDataConDetalle } from '@/lib/data-service';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { hoyEnUruguay } from '@/lib/utils';
import { armarPonerAlDia, type PonerAlDia } from '@/lib/contabilidad/poner-al-dia';
import { addPagoToPresupuesto, archivePresupuesto } from '@/app/actions/presupuestos';
import { archiveFiesta, suspenderFiestaAction } from '@/app/actions/fiesta/fiesta.actions';
import type { Presupuesto } from '@/types/presupuesto';

/**
 * "Poner al día" (pedido del dueño, 9/10/2026). Es plata: sólo contabilidad. La lista la arma
 * la app; aplicar lo decide una persona tocando el botón. Cada paso usa la acción de siempre
 * (registrar un cobro, suspender, archivar), con sus propias reglas y controles.
 */
async function leer(): Promise<{ ok: true; datos: PonerAlDia; presupuestos: Presupuesto[] } | { ok: false; error: string }> {
  const [{ valor, huboFalla }, fiestas] = await Promise.all([
    readDataConDetalle<Presupuesto[]>('presupuestos.json', []),
    leerFiestasCrudas(false),
  ]);
  if (huboFalla) return { ok: false, error: 'No se pudieron leer los presupuestos. Probá de nuevo en un momento.' };
  return { ok: true, datos: armarPonerAlDia(valor || [], fiestas, hoyEnUruguay()), presupuestos: valor || [] };
}

export async function getPonerAlDia(): Promise<{ success: true; datos: PonerAlDia } | { success: false; error: string }> {
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    const r = await leer();
    return r.ok ? { success: true, datos: r.datos } : { success: false, error: r.error };
  } catch (e: any) {
    return { success: false, error: e?.message || 'No se pudo armar la lista.' };
  }
}

export interface SeleccionPonerAlDia {
  cobrar: string[];
  cancelar: string[];
  archivarCopias: string[];
  archivarPruebas: string[];
}

export interface ResultadoPonerAlDia {
  success: boolean;
  hechos: number;
  fallas: Array<{ que: string; error: string }>;
  error?: string;
}

export async function aplicarPonerAlDia(sel: SeleccionPonerAlDia): Promise<ResultadoPonerAlDia> {
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) return { success: false, hechos: 0, fallas: [], error: permiso.error };

  // Se vuelve a armar la lista en el servidor: sólo se aplica lo que sigue siendo válido ahora y
  // con los montos de ahora, no lo que mandó la pantalla.
  const r = await leer();
  if (!r.ok) return { success: false, hechos: 0, fallas: [], error: r.error };
  const { datos } = r;
  const fallas: ResultadoPonerAlDia['fallas'] = [];
  let hechos = 0;

  for (const c of datos.cobros.filter((x) => sel.cobrar.includes(x.presupuestoId))) {
    const res = await addPagoToPresupuesto(c.presupuestoId, {
      fecha: c.fecha,
      monto: c.saldo,
      metodoPago: 'Otro',
      estadoPago: 'confirmado',
      // Con este prefijo un segundo toque no lo anota dos veces.
      referencia: `AK_SYNC:poner-al-dia:${c.presupuestoId}`,
    });
    if (res.success) hechos++;
    else fallas.push({ que: `Cobro de ${c.cliente}`, error: res.error || 'no se pudo registrar' });
  }

  for (const f of datos.vigentes.filter((x) => sel.cancelar.includes(x.fiestaId))) {
    const res = await suspenderFiestaAction(f.fiestaId, 'Cancelada por el cliente (poner al día)');
    if (res.success) hechos++;
    else fallas.push({ que: `Cancelar ${f.nombre}`, error: (res as { error?: string }).error || 'no se pudo cancelar' });
  }

  for (const f of datos.copias.filter((x) => sel.archivarCopias.includes(x.fiestaId))) {
    const res = await archiveFiesta(f.fiestaId);
    if (res.success) hechos++;
    else fallas.push({ que: `Archivar la copia ${f.nombre}`, error: res.error || 'no se pudo archivar' });
  }

  for (const p of datos.pruebas.filter((x) => sel.archivarPruebas.includes(x.presupuestoId))) {
    const res = await archivePresupuesto(p.presupuestoId);
    if (res.success) hechos++;
    else fallas.push({ que: `Archivar el presupuesto de ${p.cliente}`, error: res.error || 'no se pudo archivar' });
  }

  return { success: fallas.length === 0, hechos, fallas };
}
