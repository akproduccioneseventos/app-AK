'use server';

import { getInvoices } from './invoices';
import { getPresupuestos } from './presupuestos';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { getRoles } from './roles';
import { getGastosGenerales } from './gastos';
import { isConfirmedClientPayment } from '@/lib/budget/financial-guardrails';
import { getReconciledSalePayments, isFirmSalesInvoice } from '@/lib/commercial-flow/ledger-service';
import { verifySession } from '@/lib/auth/session-token';

interface DateRange {
  from: Date;
  to: Date;
}

interface ProfitAndLossScope {
  fiestaId?: string;
}

export interface IngresoDetalle {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
}

export interface CostoDetalle {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string;
  monto: number;
}

export interface ProfitAndLossData {
  ingresos: {
    total: number;
    detalle: IngresoDetalle[];
  };
  costos: {
    total: number;
    detalle: CostoDetalle[];
  };
  gananciaNeta: number;
  margen: number;
  nombreEvento?: string;
}

function roundMoney(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function inRange(dateValue: string | undefined, from: Date, to: Date): boolean {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date >= from && date <= to;
}

function isFirmBudgetStatus(estado?: string) {
  return estado === 'Aceptado' || estado === 'Facturado';
}

export async function getProfitAndLossData(
  range: DateRange,
  scope: ProfitAndLossScope = {},
): Promise<{ success: boolean; data?: ProfitAndLossData; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error || 'No autorizado.' };

    const { from, to } = range;
    const [allInvoices, presupuestos, fiestas, roles, gastosGenerales] = await Promise.all([
      getInvoices(),
      getPresupuestos(),
      getAllFiestas(),
      getRoles(),
      getGastosGenerales(),
    ]);

    const targetFiesta = scope.fiestaId
      ? fiestas.find(fiesta => fiesta.id === scope.fiestaId)
      : undefined;
    if (scope.fiestaId && !targetFiesta) {
      return { success: false, error: 'No se encontró el evento solicitado.' };
    }

    const scopedBudgetIds = targetFiesta
      ? new Set(targetFiesta.presupuestoId ? [targetFiesta.presupuestoId] : [])
      : null;
    const scopedInvoiceIds = targetFiesta
      ? new Set([
          ...(targetFiesta.invoiceIds ?? []),
          ...presupuestos
            .filter(presupuesto => presupuesto.id === targetFiesta.presupuestoId && presupuesto.invoiceId)
            .map(presupuesto => presupuesto.invoiceId!),
          ...allInvoices
            .filter(invoice => invoice.sourceFiestaId === targetFiesta.id)
            .map(invoice => invoice.id),
        ])
      : null;

    const ingresosDetalle: IngresoDetalle[] = [];
    let totalIngresos = 0;

    const linkedBudgetByInvoiceId = new Map(
      presupuestos
        .filter(presupuesto => presupuesto.invoiceId)
        .map(presupuesto => [presupuesto.invoiceId!, presupuesto]),
    );

    allInvoices.forEach(invoice => {
      if (!isFirmSalesInvoice(invoice)) return;
      if (scopedInvoiceIds && !scopedInvoiceIds.has(invoice.id)) return;
      getReconciledSalePayments(invoice, linkedBudgetByInvoiceId.get(invoice.id)).forEach(payment => {
        if (!inRange(payment.date, from, to)) return;
        const monto = roundMoney(payment.amount);
        if (monto <= 0) return;
        ingresosDetalle.push({
          id: payment.id,
          fecha: payment.date,
          concepto: `Pago Factura #${invoice.invoiceNumber} (Cliente: ${invoice.customer?.name || invoice.customer?.companyName || 'Sin cliente'})`,
          monto,
        });
        totalIngresos += monto;
      });
    });

    const firmInvoiceIds = new Set(allInvoices.filter(isFirmSalesInvoice).map(invoice => invoice.id));
    const invoicedBudgetIds = new Set(
      presupuestos
        .filter(presupuesto => presupuesto.invoiceId && firmInvoiceIds.has(presupuesto.invoiceId))
        .map(presupuesto => presupuesto.id),
    );
    presupuestos.forEach(presupuesto => {
      if (scopedBudgetIds && !scopedBudgetIds.has(presupuesto.id)) return;
      if (!isFirmBudgetStatus(presupuesto.estado)) return;
      if (invoicedBudgetIds.has(presupuesto.id)) return;
      presupuesto.pagosCliente?.forEach(pago => {
        if (!isConfirmedClientPayment(pago)) return;
        if (!inRange(pago.fecha, from, to)) return;
        const monto = roundMoney(pago.monto);
        if (monto <= 0) return;
        ingresosDetalle.push({
          id: pago.id,
          fecha: pago.fecha,
          concepto: `Pago Presupuesto #${presupuesto.numero || presupuesto.id} (${presupuesto.clienteNombre || 'Sin cliente'})`,
          monto,
        });
        totalIngresos += monto;
      });
    });

    const costosDetalle: CostoDetalle[] = [];
    let totalCostos = 0;

    if (!targetFiesta) {
      gastosGenerales.forEach(gasto => {
        if (!inRange(gasto.fecha, from, to)) return;
        const monto = roundMoney(gasto.monto);
        if (monto <= 0) return;
        costosDetalle.push({
          id: gasto.id,
          fecha: gasto.fecha,
          concepto: gasto.concepto,
          categoria: gasto.categoria,
          monto,
        });
        totalCostos += monto;
      });
    }

    const fiestasForReport = targetFiesta ? [targetFiesta] : fiestas;
    for (const fiesta of fiestasForReport) {
      const fechaEvento = fiesta.configuracion.fechaEvento;
      if (!inRange(fechaEvento, from, to)) continue;

      const pagosProveedores = fiesta.pagosProveedores || [];
      const totalPagosProveedores = pagosProveedores.reduce((sum, pago) => sum + roundMoney(pago.monto), 0);

      pagosProveedores.forEach(pago => {
        const monto = roundMoney(pago.monto);
        if (monto <= 0) return;
        const concepto = fiesta.gestionCostos?.costosItems?.find(c => c.id === pago.costoAsociadoId)?.nombre || 'Pago Proveedor';
        costosDetalle.push({
          id: `pago-${pago.id}`,
          fecha: pago.fecha || fechaEvento!,
          concepto: `${concepto} (${fiesta.configuracion.nombreEvento})`,
          categoria: 'Egresos Reales',
          monto,
        });
        totalCostos += monto;
      });

      const costosItems = fiesta.gestionCostos?.costosItems || [];
      const costosSinMermaDuplicada = costosItems.filter(item => item.id !== 'auto_merma_bebidas');
      const otros = fiesta.gestionCostos?.others || {};
      const personalCalculado = (fiesta.personalAsignado ?? []).reduce((sum, pa) => {
        const rol = roles.find(r => r.id === pa.rolId);
        const sueldo = roundMoney(pa.eventSalary || rol?.sueldoPorEvento || 0);
        const aportes = Math.round((sueldo * (rol?.porcentajeAportesPatronales || 0)) / 100);
        return sum + sueldo + aportes;
      }, 0);
      const costosOperativos = [
        roundMoney(otros.totalCateringCost),
        roundMoney(otros.totalBebidasCost),
        roundMoney(otros.totalReposteriaCost),
        Math.max(roundMoney(otros.totalPersonalCost), personalCalculado),
      ];
      const totalCostosPlanificados = costosSinMermaDuplicada.reduce(
        (sum, item) => sum + roundMoney(item.montoEstimado),
        0,
      ) + costosOperativos.reduce((sum, monto) => sum + monto, 0);
      const restantePlanificado = Math.max(0, totalCostosPlanificados - totalPagosProveedores);
      if (restantePlanificado > 0) {
        costosDetalle.push({
          id: `pendiente-costos-${fiesta.id}`,
          fecha: fechaEvento!,
          concepto: `Costos pendientes planificados (${fiesta.configuracion.nombreEvento})`,
          categoria: 'Costos Pendientes',
          monto: restantePlanificado,
        });
        totalCostos += restantePlanificado;
      }

    }

    const gananciaNeta = totalIngresos - totalCostos;
    const margen = totalIngresos > 0 ? (gananciaNeta / totalIngresos) * 100 : 0;

    return {
      success: true,
      data: {
        ingresos: { total: totalIngresos, detalle: ingresosDetalle },
        costos: { total: totalCostos, detalle: costosDetalle },
        gananciaNeta,
        margen,
        nombreEvento: targetFiesta?.configuracion.nombreEvento,
      },
    };
  } catch (error: any) {
    console.error('Error calculating global P&L:', error);
    return { success: false, error: 'Fallo al consolidar el reporte contable global.' };
  }
}
