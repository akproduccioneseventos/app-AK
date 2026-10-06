'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import type { PagoProveedor } from '@/types/fiesta';

/**
 * Los pagos a proveedores son plata: contabilidad (revisión de plata, 6/10/2026). Antes alcanzaba
 * cualquier sesión del equipo de la fiesta, y se guardaba la fiesta entera leída antes; ahora se
 * cambia sólo esta lista, sobre la fiesta guardada en ese momento.
 */
export async function updatePagosProveedores(fiestaId: string, pagos: PagoProveedor[]): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    await requireEventPermission(fiestaId, PERMISOS.CONTABILIDAD);
    const invalido = (pagos || []).find((p) => !Number.isFinite(Number(p.monto)) || Number(p.monto) < 0);
    if (invalido) return { success: false, error: 'Hay un pago a proveedor con un importe que no es válido.' };
    const result = await actualizarFiesta(fiestaId, (fiesta) => ({ ...fiesta, pagosProveedores: pagos }));
    if (!result.success) throw new Error(result.error);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
