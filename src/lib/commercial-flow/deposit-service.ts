/**
 * AK Producciones — Servicio Unificado de Registro de Seña/Pago
 *
 * registerContractDeposit garantiza que un pago de seña quede reflejado
 * de forma sincrónica en:
 *   - presupuesto.pagosCliente
 *   - invoice.payments (via registerBookingDeposit)
 *   - presupuesto.senia / presupuesto.saldo
 *   - fiesta.invoiceIds
 *
 * Nunca permite un pago en el CRM que no quede en el libro mayor.
 */

'use server';

import type { MetodoPago, Presupuesto } from '@/types/presupuesto';
import {
  findMatchingClientPayment,
  roundMoney,
  sumConfirmedClientPayments,
  validatePaymentAgainstBudget,
} from '@/lib/budget/financial-guardrails';

export interface DepositInput {
  /** ID de la fiesta (obligatorio para vincular la factura al evento) */
  fiestaId: string;
  /** ID del presupuesto asociado (para actualizar pagosCliente y senia/saldo) */
  presupuestoId?: string;
  /** Monto de la seña */
  amount: number;
  /** Método de pago */
  method: MetodoPago | string;
  /** Fecha del pago (ISO string) */
  date: string;
  /** Referencia / notas opcionales */
  referencia?: string;
}

export interface DepositResult {
  success: boolean;
  invoiceId?: string;
  error?: string;
}

/**
 * Registra una seña de forma atómica en todos los módulos financieros.
 */
export async function registerContractDeposit(input: DepositInput): Promise<DepositResult> {
  const { fiestaId, presupuestoId, amount, method, date, referencia } = input;
  const normalizedAmount = roundMoney(amount);

  if (!fiestaId) return { success: false, error: 'fiestaId es requerido.' };
  if (!normalizedAmount || normalizedAmount <= 0) return { success: false, error: 'El monto debe ser mayor a cero.' };
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return { success: false, error: 'La fecha de la seña no es válida.' };
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const paymentDay = `${year}-${month}-${day}`;
  const paymentReference = referencia || `Seña contrato:${fiestaId}:${paymentDay}:${normalizedAmount}`;

  try {
    let existingBudget: Presupuesto | null = null;
    let existingPayment = false;
    if (presupuestoId) {
      const { getPresupuestoById } = await import('@/app/actions/presupuestos');
      existingBudget = await getPresupuestoById(presupuestoId);
      if (existingBudget) {
        existingPayment = Boolean(findMatchingClientPayment(existingBudget.pagosCliente, normalizedAmount, date));
        const validation = existingPayment
          ? { ok: true as const }
          : validatePaymentAgainstBudget(existingBudget, normalizedAmount, { includePendingForLimit: true });
        if (!validation.ok) return { success: false, error: validation.error };
      }
    }

    // 1. Crear la factura de seña y vincularla a la fiesta (invoice.payments + fiesta.invoiceIds)
    const { registerBookingDeposit } = await import('@/app/actions/invoices');
    const depositResult = await registerBookingDeposit({
      fiestaId,
      amount: normalizedAmount,
      method,
      date,
      skipBudgetPayment: Boolean(presupuestoId),
    });
    if (!depositResult.success) {
      throw new Error(depositResult.error || 'Error al registrar la seña en facturas.');
    }

    // 2. Si tenemos presupuestoId, actualizar presupuesto.pagosCliente y senia/saldo
    if (presupuestoId) {
      const { getPresupuestoById, updatePresupuesto } = await import('@/app/actions/presupuestos');
      const presupuesto = existingBudget ?? await getPresupuestoById(presupuestoId);

      if (presupuesto && !existingPayment) {
        const newPago = {
          id: `pago_dep_${presupuestoId}_${Date.now()}`,
          fecha: date,
          monto: normalizedAmount,
          metodoPago: method as MetodoPago,
          referencia: paymentReference,
          estadoPago: 'confirmado' as const,
        };

        const pagosActualizados = [...(presupuesto.pagosCliente ?? []), newPago];
        const totalPagado = sumConfirmedClientPayments(pagosActualizados);
        const totalPresupuesto =
          presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado ?? 0;
        const saldoActualizado = Math.max(0, totalPresupuesto - totalPagado);

        await updatePresupuesto({
          ...presupuesto,
          pagosCliente: pagosActualizados,
          senia: roundMoney((presupuesto.senia ?? 0) + normalizedAmount),
          saldo: saldoActualizado,
        });
      }
    }

    // 3. Recalcular plan de pagos del contrato si la fiesta tiene uno activo
    try {
      const { getFiestaById, saveFiesta } = await import('@/app/actions/fiesta/fiesta.actions');
      const fiesta = await getFiestaById(fiestaId);
      if (fiesta?.contratoDatos?.planPagos?.activo) {
        const { recalcularEstadoCuotas } = await import('@/lib/planPagos');
        // Build a list of all payments from presupuesto or fall back to the new payment alone
        let allPagos: import('@/types/presupuesto').PagoCliente[] = [];
        if (presupuestoId) {
          const { getPresupuestoById } = await import('@/app/actions/presupuestos');
          const pres = await getPresupuestoById(presupuestoId);
          allPagos = pres?.pagosCliente ?? [];
        } else {
          allPagos = [{
            id: `pago_dep_${fiestaId}_${Date.now()}`,
            fecha: date,
            monto: normalizedAmount,
            metodoPago: method as import('@/types/presupuesto').MetodoPago,
            estadoPago: 'confirmado',
          }];
        }
        const planActualizado = recalcularEstadoCuotas(fiesta.contratoDatos.planPagos, allPagos);
        await saveFiesta({
          ...fiesta,
          contratoDatos: { ...fiesta.contratoDatos, planPagos: planActualizado },
        });
      }
    } catch (planError) {
      // Non-fatal: log but don't fail the deposit
      console.warn('[registerContractDeposit] Error recalculando plan de pagos:', planError);
    }

    return { success: true, invoiceId: depositResult.invoiceId };
  } catch (error: any) {
    return { success: false, error: error.message ?? 'Error desconocido al registrar la seña.' };
  }
}
