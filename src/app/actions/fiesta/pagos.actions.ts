'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import type { PagoProveedor } from '@/types/fiesta';

/**
 * Agrega UN pago a proveedor (pregunta 58, 14/10/2026). Antes la pantalla mandaba la lista entera
 * armada en el navegador: si la respuesta se perdía y se volvía a tocar, o si otra persona cargaba un
 * pago al mismo tiempo, la lista vieja pisaba lo de la otra. Ahora se agrega sólo este pago sobre la
 * lista guardada de ese momento, y con la identidad del intento (`pago.id`, la misma en cada
 * reintento) un segundo toque no lo anota dos veces.
 */
export async function agregarPagoProveedor(
  fiestaId: string,
  pago: PagoProveedor,
): Promise<{ success: boolean; error?: string; yaEstaba?: boolean }> {
  await requireAppSession();
  try {
    await requireEventPermission(fiestaId, PERMISOS.CONTABILIDAD);
    if (typeof pago?.id !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(pago.id)) {
      return { success: false, error: 'La identidad del pago no es válida.' };
    }
    if (!Number.isFinite(Number(pago.monto)) || Number(pago.monto) < 0) {
      return { success: false, error: 'El importe del pago no es válido.' };
    }
    let yaEstaba = false;
    const result = await actualizarFiesta(fiestaId, (fiesta) => {
      const actuales = fiesta.pagosProveedores || [];
      yaEstaba = actuales.some((p) => p.id === pago.id);
      if (yaEstaba) return fiesta;
      return { ...fiesta, pagosProveedores: [...actuales, { ...pago, monto: Number(pago.monto) }] };
    });
    if (!result.success) throw new Error(result.error);
    return { success: true, ...(yaEstaba ? { yaEstaba: true } : {}) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
