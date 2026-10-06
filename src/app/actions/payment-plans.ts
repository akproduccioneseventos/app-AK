'use server';

import type { PlanDePagos, CuotaPlanPago, FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById } from './fiesta/fiesta.actions';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { notifyClientPaymentApproved } from './google-workspace-extended';
import { roundMoney } from '@/lib/budget/financial-guardrails';

import { requireAppSession, requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
function buildMontevideoPaymentTimestamp(fechaPago?: string) {
  if (!fechaPago) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) {
    return `${fechaPago}T12:00:00-03:00`;
  }
  return fechaPago;
}

function normalizeCuotaPlanPago(cuota: CuotaPlanPago): CuotaPlanPago {
  const monto = roundMoney(cuota.monto);
  const rawPaid = cuota.estado === 'pagado'
    ? monto
    : roundMoney(cuota.montoPagado);
  const clampedPaid = Math.min(monto, rawPaid);
  let estado = cuota.estado;

  if (estado === 'parcial' && clampedPaid <= 0) estado = 'pendiente';
  if ((estado === 'parcial' || estado === 'pagado') && monto > 0 && clampedPaid >= monto) estado = 'pagado';

  return {
    ...cuota,
    monto,
    estado,
    montoPagado: estado === 'pagado'
      ? monto
      : estado === 'parcial'
        ? clampedPaid
        : undefined,
  };
}

export async function getPlanDePagos(
  fiestaId: string
): Promise<PlanDePagos | null> {
  await requireAppSession();
  // Las cuotas son plata: contabilidad (Codex, auditoría 70).
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) throw new Error(permiso.error);
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return fiesta.planDePagos ?? null;
}

const pagadoDe = (c: CuotaPlanPago) => (c.estado === 'pagado' ? roundMoney(c.monto) : c.estado === 'parcial' ? roundMoney(c.montoPagado) : 0);

/**
 * GUARDAR EL PLAN NO DESHACE UN COBRO (Codex, auditoría 70, PLAN01, 6/10/2026).
 *
 * A abría el plan con una cuota pendiente; B la marcaba pagada; A cambiaba una nota y guardaba
 * su lista vieja: la cuota volvía a pendiente y lo cobrado a cero. Ahora el plan se arma sobre el
 * guardado EN ESE MOMENTO (`actualizarFiesta`), y:
 * - si quien guarda trae la versión que leyó (`versionLeida`) y el plan cambió desde entonces, se
 *   le pide recargar en vez de pisar;
 * - un cobro que ya figura no baja por guardar el plan (para deshacerlo está la cuota misma), y
 *   una cuota con cobro no se borra.
 */
export async function savePlanDePagos(
  fiestaId: string,
  plan: Omit<PlanDePagos, 'id' | 'fiestaId' | 'createdAt' | 'updatedAt'> & { versionLeida?: string }
): Promise<{ success: boolean; plan?: PlanDePagos; error?: string }> {
  await requireAppSession();
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) return { success: false, error: permiso.error };
  const { versionLeida, ...datos } = plan;
  try {
    let resultado: PlanDePagos | undefined;
    const guardado = await actualizarFiesta(fiestaId, (fiesta: FiestaEnPlanificacion) => {
      const now = new Date().toISOString();
      const existingPlan = fiesta.planDePagos;
      if (versionLeida && existingPlan?.updatedAt && existingPlan.updatedAt !== versionLeida) {
        throw new Error('El plan cambió mientras lo editabas (por ejemplo, alguien marcó una cuota). Recargá la pantalla y volvé a hacer tu cambio.');
      }
      const guardadas = new Map((existingPlan?.cuotas ?? []).map((c) => [c.id, c]));
      const entran = new Set((datos.cuotas ?? []).map((c) => c.id));
      const conCobroBorrada = [...guardadas.values()].find((c) => !entran.has(c.id) && pagadoDe(c) > 0);
      if (conCobroBorrada) {
        throw new Error(`La cuota "${conCobroBorrada.descripcion || conCobroBorrada.id}" ya tiene un cobro: no se puede sacar del plan.`);
      }
      const cuotas = (datos.cuotas ?? []).map((entra) => {
        const antes = guardadas.get(entra.id);
        const nueva = normalizeCuotaPlanPago(entra);
        if (antes && pagadoDe(nueva) < pagadoDe(antes)) {
          // Lo cobrado se conserva tal como está guardado.
          return normalizeCuotaPlanPago({
            ...nueva,
            estado: antes.estado,
            montoPagado: antes.montoPagado,
            fechaPago: antes.fechaPago,
            metodoPago: antes.metodoPago,
            monto: Math.max(nueva.monto, pagadoDe(antes)),
          });
        }
        return nueva;
      });
      resultado = {
        ...datos,
        cuotas,
        id: existingPlan?.id ?? `plan_${Date.now()}`,
        fiestaId,
        createdAt: existingPlan?.createdAt ?? now,
        updatedAt: now,
      };
      return { ...fiesta, planDePagos: resultado };
    });
    if (!guardado.success || !resultado) {
      return { success: false, error: guardado.error || 'No se pudo guardar el plan de pagos.' };
    }
    return { success: true, plan: resultado };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateCuotaEstado(
  fiestaId: string,
  cuotaId: string,
  updates: Partial<Pick<CuotaPlanPago, 'estado' | 'montoPagado' | 'fechaPago' | 'metodoPago' | 'notas'>>
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    /**
     * PRIMERO SE GUARDA, DESPUES SE AVISA. Y SI NO SE GUARDO, NO SE AVISA.
     *
     * Hasta el 8 de septiembre de 2026 esto no miraba el resultado de guardar y le mandaba al
     * cliente el mail de pago aprobado con la cuota impaga. Y el aviso sale **una sola vez**:
     * sólo cuando la cuota pasa de no-pagada a pagada.
     *
     * **Y la cuota se cambia adentro del turno de la fiesta (Codex, 2/10/2026, COB-02).** Antes
     * se leía la fiesta, se armaba la lista entera de cuotas y se guardaba: dos cuotas marcadas a
     * la vez daban "cobrada" las dos, con dos mails, y quedaba pagada una sola. Ahora cada una se
     * relee en el momento de guardar, y "recién pagada" se mide contra lo que había ahí.
     */
    let cuotaOriginal: CuotaPlanPago | undefined;
    let updatedCuota: CuotaPlanPago | undefined;
    const guardado = await actualizarFiesta(fiestaId, (fiesta) => {
      const plan = fiesta.planDePagos;
      if (!plan) throw new Error('Plan de pagos no encontrado');
      cuotaOriginal = plan.cuotas.find((c) => c.id === cuotaId);
      if (!cuotaOriginal) throw new Error('La cuota no existe en este plan.');
      const updatedCuotas = plan.cuotas.map((c) =>
        c.id === cuotaId ? normalizeCuotaPlanPago({ ...c, ...updates }) : c,
      );
      updatedCuota = updatedCuotas.find((c) => c.id === cuotaId);
      return { ...fiesta, planDePagos: { ...plan, cuotas: updatedCuotas, updatedAt: new Date().toISOString() } };
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudo guardar la cuota.' };
    }

    const paidAmount = updatedCuota?.montoPagado ?? updatedCuota?.monto ?? 0;
    const recienPagada = updatedCuota?.estado === 'pagado' && cuotaOriginal?.estado !== 'pagado';
    if (recienPagada && paidAmount > 0) {
      notifyClientPaymentApproved(fiestaId, {
        id: `cuota_${cuotaId}`,
        monto: paidAmount,
        estado: 'aprobado',
        timestamp: buildMontevideoPaymentTimestamp(updates.fechaPago),
        approvedAt: new Date().toISOString(),
        notas: updates.notas || updatedCuota?.descripcion,
      }).catch((error) => {
        console.warn('[Google Workspace] No se pudo enviar mail de cuota pagada:', error);
      });
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
