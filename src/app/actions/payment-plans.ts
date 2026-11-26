'use server';

import type { PlanDePagos, CuotaPlanPago, FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById } from './fiesta/fiesta.actions';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { notifyClientPaymentApproved } from './google-workspace-extended';
import { roundMoney } from '@/lib/budget/financial-guardrails';
import { mutarPresupuesto } from '@/lib/budget/mutar-presupuesto';
import { esCuotaDeSena, yaTieneSenaEnPagos } from '@/lib/contabilidad/cuotas-pagos';
import type { PagoCliente } from '@/types/presupuesto';

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
    const fiestaPrevia = await getFiestaById(fiestaId);
    if (!fiestaPrevia) return { success: false, error: 'Fiesta no encontrada.' };
    const planPrevio = fiestaPrevia.planDePagos;
    if (!planPrevio) return { success: false, error: 'Plan de pagos no encontrado' };
    const cuotaAntes = planPrevio.cuotas.find((c) => c.id === cuotaId);
    if (!cuotaAntes) return { success: false, error: 'La cuota no existe en este plan.' };

    const cuotaProyectada = normalizeCuotaPlanPago({ ...cuotaAntes, ...updates });
    const paidAmountProyectado = cuotaProyectada.estado === 'pagado'
      ? cuotaProyectada.monto
      : cuotaProyectada.estado === 'parcial'
        ? (cuotaProyectada.montoPagado ?? 0)
        : 0;
    const pagoIdFijo = `cuota_${cuotaId}`;
    const fechaPagoIso = buildMontevideoPaymentTimestamp(updates.fechaPago ?? cuotaProyectada.fechaPago);

    let pagosPreviosBackup: PagoCliente[] | null = null;
    if (fiestaPrevia.presupuestoId) {
      const mut = await mutarPresupuesto(fiestaPrevia.presupuestoId, (presupuesto) => {
        const pagos = Array.isArray(presupuesto.pagosCliente) ? [...presupuesto.pagosCliente] : [];
        pagosPreviosBackup = JSON.parse(JSON.stringify(pagos));

        if (cuotaProyectada.estado === 'pendiente') {
          const filtrados = pagos.filter((p) => p.id !== pagoIdFijo);
          return filtrados.length === pagos.length ? null : { ...presupuesto, pagosCliente: filtrados };
        }

        if ((cuotaProyectada.estado === 'pagado' || cuotaProyectada.estado === 'parcial') && paidAmountProyectado > 0) {
          if (pagos.some((p) => p.id === pagoIdFijo)) {
            return null; // Un reintento no cobra dos veces la misma cuota
          }
          if (esCuotaDeSena(cuotaProyectada) && yaTieneSenaEnPagos(pagos, paidAmountProyectado)) {
            return null; // La seña ya figura en pagosCliente desde el recibo del contrato
          }
          const nuevoPago: PagoCliente = {
            id: pagoIdFijo,
            fecha: fechaPagoIso,
            monto: paidAmountProyectado,
            metodoPago: ((updates.metodoPago as any) || (cuotaProyectada as any).metodoPago || 'Transferencia Bancaria'),
            referencia: cuotaProyectada.descripcion || `Cuota ${cuotaId}`,
            estadoPago: 'confirmado',
          };
          return { ...presupuesto, pagosCliente: [...pagos, nuevoPago] };
        }
        return null;
      });
      if (!mut.encontrado) {
        return { success: false, error: 'No se pudo encontrar o guardar el presupuesto asociado para sincronizar el cobro.' };
      }
    }

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
      if (fiestaPrevia.presupuestoId && pagosPreviosBackup !== null) {
        await mutarPresupuesto(fiestaPrevia.presupuestoId, (presupuesto) => ({
          ...presupuesto,
          pagosCliente: pagosPreviosBackup!,
        })).catch(() => undefined);
      }
      return { success: false, error: guardado.error || 'No se pudo guardar la cuota.' };
    }

    const paidAmount = updatedCuota?.montoPagado ?? updatedCuota?.monto ?? 0;
    const recienPagada = updatedCuota?.estado === 'pagado' && cuotaOriginal?.estado !== 'pagado';
    if (recienPagada && paidAmount > 0) {
      notifyClientPaymentApproved(fiestaId, {
        id: pagoIdFijo,
        monto: paidAmount,
        estado: 'aprobado',
        timestamp: fechaPagoIso,
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
