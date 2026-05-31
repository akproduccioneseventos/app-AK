'use server';

import { getInvoices } from './invoices';
import { getPresupuestos } from './presupuestos';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { getEmpleados } from './empleados';
import { getRoles } from './roles';
import { getGastosGenerales } from './gastos';
import { isConfirmedClientPayment } from '@/lib/budget/financial-guardrails';

interface DateRange {
  from: Date;
  to: Date;
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

export async function getProfitAndLossData(range: DateRange): Promise<{ success: boolean; data?: ProfitAndLossData; error?: string }> {
  try {
    const { from, to } = range;
    const [allInvoices, presupuestos, fiestas, _empleados, roles, gastosGenerales] = await Promise.all([
      getInvoices(),
      getPresupuestos(),
      getAllFiestas(),
      getEmpleados(),
      getRoles(),
      getGastosGenerales(),
    ]);

    const ingresosDetalle: IngresoDetalle[] = [];
    let totalIngresos = 0;

    allInvoices.forEach(invoice => {
      invoice.payments?.forEach(payment => {
        if (!inRange(payment.paymentDate, from, to)) return;
        const monto = roundMoney(payment.amount);
        if (monto <= 0) return;
        ingresosDetalle.push({
          id: payment.id,
          fecha: payment.paymentDate,
          concepto: `Pago Factura #${invoice.invoiceNumber} (Cliente: ${invoice.customer?.name || invoice.customer?.companyName || 'Sin cliente'})`,
          monto,
        });
        totalIngresos += monto;
      });
    });

    const invoicedBudgetIds = new Set(presupuestos.filter(p => p.invoiceId).map(p => p.id));
    presupuestos.forEach(presupuesto => {
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

    for (const fiesta of fiestas) {
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
      const totalCostosPlanificados = costosItems.reduce((sum, item) => sum + roundMoney(item.montoEstimado), 0);
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

      if (totalCostosPlanificados === 0) {
        const otros = fiesta.gestionCostos?.others || {};
        const proyecciones = [
          { id: 'cat', nombre: 'Proyección comida', categoria: 'Comida Proyectada', monto: otros.totalCateringCost || 0 },
          { id: 'beb', nombre: 'Proyección bebidas', categoria: 'Bebidas Proyectadas', monto: otros.totalBebidasCost || 0 },
          { id: 'rep', nombre: 'Proyección repostería', categoria: 'Repostería Proyectada', monto: otros.totalReposteriaCost || 0 },
          { id: 'prov', nombre: 'Proyección proveedores', categoria: 'Proveedores Proyectados', monto: otros.totalProveedorCost || 0 },
        ];
        proyecciones.forEach(proy => {
          const monto = roundMoney(proy.monto);
          if (monto <= 0) return;
          costosDetalle.push({
            id: `proy-${proy.id}-${fiesta.id}`,
            fecha: fechaEvento!,
            concepto: `${proy.nombre}: ${fiesta.configuracion.nombreEvento}`,
            categoria: proy.categoria,
            monto,
          });
          totalCostos += monto;
        });
      }

      fiesta.personalAsignado?.forEach(pa => {
        const rol = roles.find(r => r.id === pa.rolId);
        const sueldo = roundMoney(pa.eventSalary || rol?.sueldoPorEvento || 0);
        const aportes = Math.round((sueldo * (rol?.porcentajeAportesPatronales || 0)) / 100);
        const costoNomina = sueldo + aportes;
        if (costoNomina <= 0) return;
        costosDetalle.push({
          id: `pers-${pa.empleadoId || 'vac'}-${fiesta.id}`,
          fecha: fechaEvento!,
          concepto: `Nómina: ${rol?.nombre || 'Personal'} (${fiesta.configuracion.nombreEvento})`,
          categoria: 'Personal',
          monto: costoNomina,
        });
        totalCostos += costoNomina;
      });
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
      },
    };
  } catch (error: any) {
    console.error('Error calculating global P&L:', error);
    return { success: false, error: 'Fallo al consolidar el reporte contable global.' };
  }
}
