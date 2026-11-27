'use server';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';

import { getInvoices } from './invoices';
import { inRange } from '@/lib/reportes/rango-de-dias';
import { getPresupuestos } from './presupuestos';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { leerRolesInterno } from '@/lib/roles/leer-roles-interno';
import { getGastosGenerales } from './gastos';
import { isConfirmedClientPayment } from '@/lib/budget/financial-guardrails';
import { getReconciledSalePayments, isDepositReceiptInvoice, isFirmSalesInvoice } from '@/lib/commercial-flow/ledger-service';
import { verifySession } from '@/lib/auth/session-token';
import { requireAppSession } from '@/lib/auth/require-session';
import { getCompanyInfo } from './settings';
import { mandarResumenAlContador, type ResultadoMandarAlContador } from '@/lib/contabilidad/mandar-resumen-al-contador';
import { resolverSueldoDelRol } from '@/lib/fiesta/sueldo-del-rol';

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

function montoCosto(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

function isFirmBudgetStatus(estado?: string) {
  return estado === 'Aceptado' || estado === 'Facturado';
}

function calcularCostosPendientesDeFiesta(
  fiesta: {
    gestionCostos?: any;
    personalAsignado?: any[];
  },
  roles: any[],
  pagosPorCosto: Map<string, number>,
  esPrecioDeVentaCopiado: (id: string | undefined) => boolean,
): number {
  const costosItems = (fiesta.gestionCostos?.costosItems || [])
    .filter((item: any) => item.id !== 'auto_merma_bebidas')
    .map((item: any) => (esPrecioDeVentaCopiado(item.id) && !item.costoDeCatalogo ? { ...item, montoEstimado: 0 } : item));
  const otros = fiesta.gestionCostos?.others || {};
  const personalCalculado = (fiesta.personalAsignado ?? []).reduce((sum, pa) => {
    const rol = roles.find(r => r.id === pa.rolId);
    const sueldo = montoCosto(resolverSueldoDelRol(pa, rol));
    const aportes = Math.round((sueldo * (rol?.porcentajeAportesPatronales || 0)) / 100);
    return sum + sueldo + aportes;
  }, 0);

  let restante = 0;
  for (const item of costosItems) {
    const pagado = pagosPorCosto.get(item.id) || 0;
    const estimado = montoCosto(item.montoEstimado);
    if (pagado > 0 && item.cerrado) continue;
    restante += Math.max(0, estimado - pagado);
  }

  const bloquesAutomaticos: Array<{ id: string; monto: number }> = [
    { id: 'cat_catering', monto: montoCosto(otros.totalCateringCost) },
    { id: 'cat_bebidas', monto: montoCosto(otros.totalBebidasCost) },
    { id: 'cat_reposteria', monto: montoCosto(otros.totalReposteriaCost) },
    { id: 'cat_personal', monto: Math.max(montoCosto(otros.totalPersonalCost), personalCalculado) },
  ];
  for (const bloque of bloquesAutomaticos) {
    const pagado = pagosPorCosto.get(bloque.id) || 0;
    if (pagado > 0) continue;
    restante += bloque.monto;
  }

  return restante;
}

function generarRefReportePL(): string {
  const tiempo = Date.now().toString(36).slice(-4).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `REF-PL-${tiempo}${azar}`;
}

function sanitizarMotivoReporte(raw: string): string {
  const primeraLinea = raw.split(/\r?\n/)[0]?.trim() || '';
  const limpio = primeraLinea
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, '[token]')
    .replace(/[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token]')
    .replace(/([?&](?:token|key|apiKey|secret|password|auth)=)[^&\s]+/gi, '$1[oculto]')
    .replace(/[a-zA-Z]:\\[^\s'"]+/g, '[ruta]')
    .replace(/\/(?:Users|home|var|tmp|app|srv|opt|etc)\/[^\s'"]+/g, '[ruta]')
    .replace(/\s+/g, ' ')
    .trim();
  return limpio ? limpio.slice(0, 180) : 'Error interno al consolidar el reporte contable';
}

export async function getProfitAndLossData(
  range: DateRange,
  scope: ProfitAndLossScope = {},
): Promise<{ success: boolean; data?: ProfitAndLossData; error?: string; codigoError?: string }> {
  try {
    await requirePermisoAlguno(PERMISOS.GANANCIAS); // revisión de plata, 6/10/2026: no cualquier sesión (ganancias, sólo el dueño)
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error || 'No autorizado.' };

    const { from, to } = range;
    // Período imposible: no se calcula ni se exporta un reporte en cero (auditoría del 18/11/2026, C18-03).
    const desdeMs = new Date(from as any).getTime();
    const hastaMs = new Date(to as any).getTime();
    if (Number.isNaN(desdeMs) || Number.isNaN(hastaMs)) {
      return { success: false, error: 'Elegí las dos fechas del período.' };
    }
    if (desdeMs > hastaMs) {
      return { success: false, error: 'La fecha de inicio es posterior a la de fin.' };
    }
    const [allInvoices, presupuestos, fiestasRaw, roles, gastosGenerales] = await Promise.all([
      getInvoices(),
      getPresupuestos(),
      getAllFiestas(),
      leerRolesInterno(),
      getGastosGenerales(),
    ]);
    const { esFiestaDemo } = await import('@/lib/events/event-ordering');
    const { esPrecioDeVentaCopiado } = await import('@/lib/costos/ganancia-evento');
    const fiestas = fiestasRaw.filter(f => !esFiestaDemo(f));

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
      if (isDepositReceiptInvoice(invoice)) {
        if (scopedInvoiceIds && !scopedInvoiceIds.has(invoice.id)) return;
        const hasLinkedBudget = invoice.sourcePresupuestoId
          ? presupuestos.some(p => p.id === invoice.sourcePresupuestoId)
          : false;
        if (!hasLinkedBudget) {
          getReconciledSalePayments(invoice).forEach(payment => {
            if (!inRange(payment.date, from, to)) return;
            const comision = (typeof payment.comisionProveedor === 'number' && Number.isFinite(payment.comisionProveedor) && payment.comisionProveedor > 0)
              ? roundMoney(payment.comisionProveedor)
              : 0;
            const monto = roundMoney(payment.amount) - comision;
            if (monto <= 0) return;
            ingresosDetalle.push({
              id: payment.id,
              fecha: payment.date,
              concepto: 'Seña cobrada',
              monto,
            });
            totalIngresos += monto;
          });
        }
        return;
      }
      if (!isFirmSalesInvoice(invoice)) return;
      if (scopedInvoiceIds && !scopedInvoiceIds.has(invoice.id)) return;
      getReconciledSalePayments(invoice, linkedBudgetByInvoiceId.get(invoice.id)).forEach(payment => {
        if (!inRange(payment.date, from, to)) return;
        const comision = (typeof payment.comisionProveedor === 'number' && Number.isFinite(payment.comisionProveedor) && payment.comisionProveedor > 0)
          ? roundMoney(payment.comisionProveedor)
          : 0;
        const monto = roundMoney(payment.amount) - comision;
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
        const comision = (typeof pago.comisionProveedor === 'number' && Number.isFinite(pago.comisionProveedor) && pago.comisionProveedor > 0)
          ? roundMoney(pago.comisionProveedor)
          : 0;
        const monto = roundMoney(pago.monto) - comision;
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
        const monto = montoCosto(gasto.monto);
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

    if (targetFiesta) {
      const fechaEvento = targetFiesta.configuracion?.fechaEvento;
      const pagosProveedores = targetFiesta.pagosProveedores || [];
      const pagosPorCosto = pagosProveedores.reduce((totals, pago) => {
        const costoId = pago.costoAsociadoId?.trim();
        if (!costoId) return totals;
        totals.set(costoId, (totals.get(costoId) || 0) + montoCosto(pago.monto));
        return totals;
      }, new Map<string, number>());

      pagosProveedores.forEach(pago => {
        const monto = montoCosto(pago.monto);
        if (monto <= 0) return;
        const concepto = targetFiesta.gestionCostos?.costosItems?.find(c => c.id === pago.costoAsociadoId)?.nombre || 'Pago Proveedor';
        costosDetalle.push({
          id: `pago-${pago.id}`,
          fecha: pago.fecha || fechaEvento || '',
          concepto: `${concepto} (${targetFiesta.configuracion.nombreEvento})`,
          categoria: 'Egresos Reales',
          monto,
        });
        totalCostos += monto;
      });

      const restantePlanificado = calcularCostosPendientesDeFiesta(
        targetFiesta,
        roles,
        pagosPorCosto,
        esPrecioDeVentaCopiado,
      );
      if (restantePlanificado > 0) {
        costosDetalle.push({
          id: `pendiente-costos-${targetFiesta.id}`,
          fecha: fechaEvento || '',
          concepto: `Costos pendientes planificados (${targetFiesta.configuracion.nombreEvento})`,
          categoria: 'Costos Pendientes',
          monto: restantePlanificado,
        });
        totalCostos += restantePlanificado;
      }
    } else {
      for (const fiesta of fiestas) {
        const fechaEvento = fiesta.configuracion?.fechaEvento;
        const pagosProveedores = fiesta.pagosProveedores || [];
        const pagosPorCosto = pagosProveedores.reduce((totals, pago) => {
          const costoId = pago.costoAsociadoId?.trim();
          if (!costoId) return totals;
          totals.set(costoId, (totals.get(costoId) || 0) + montoCosto(pago.monto));
          return totals;
        }, new Map<string, number>());

        pagosProveedores.forEach(pago => {
          const fechaPago = pago.fecha || fechaEvento;
          if (!fechaPago || !inRange(fechaPago, from, to)) return;
          const monto = montoCosto(pago.monto);
          if (monto <= 0) return;
          const concepto = fiesta.gestionCostos?.costosItems?.find(c => c.id === pago.costoAsociadoId)?.nombre || 'Pago Proveedor';
          costosDetalle.push({
            id: `pago-${pago.id}`,
            fecha: fechaPago,
            concepto: `${concepto} (${fiesta.configuracion.nombreEvento})`,
            categoria: 'Egresos Reales',
            monto,
          });
          totalCostos += monto;
        });

        if (fechaEvento && inRange(fechaEvento, from, to)) {
          const restantePlanificado = calcularCostosPendientesDeFiesta(
            fiesta,
            roles,
            pagosPorCosto,
            esPrecioDeVentaCopiado,
          );
          if (restantePlanificado > 0) {
            costosDetalle.push({
              id: `pendiente-costos-${fiesta.id}`,
              fecha: fechaEvento,
              concepto: `Costos pendientes planificados (${fiesta.configuracion.nombreEvento})`,
              categoria: 'Costos Pendientes',
              monto: restantePlanificado,
            });
            totalCostos += restantePlanificado;
          }
        }
      }
    }

    totalCostos = Math.round(totalCostos * 100) / 100;
    const gananciaNeta = Math.round((totalIngresos - totalCostos) * 100) / 100;
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
    const refId = generarRefReportePL();
    const rawMessage = error instanceof Error ? error.message : String(error ?? '');
    if (/permis|autoriz|contabilidad|ganancias|tu perfil no tiene acceso/i.test(rawMessage)) {
      console.warn(`[reportes] Permiso denegado en getProfitAndLossData (${refId}):`, rawMessage);
      return {
        success: false,
        error: 'No tenés permiso de Contabilidad o Ganancias para ver el reporte contable.',
        codigoError: refId,
      };
    }
    console.error(`Error calculating global P&L (${refId}):`, error);
    const motivo = sanitizarMotivoReporte(rawMessage);
    return {
      success: false,
      error: `${motivo} (Ref: ${refId})`,
      codigoError: refId,
    };
  }
}

/**
 * MANDAR AL CONTADOR (25 de septiembre de 2026, pedido del dueño).
 * Recibe el RANGO, no los números: el resumen se calcula acá, en el servidor, con
 * `getProfitAndLossData`. Así nadie puede mandarle al contador cifras armadas en el navegador.
 */
export async function mandarAlContador(
  rango: DateRange,
  nombreDelMes: string
): Promise<ResultadoMandarAlContador> {
  await requireAppSession();
  const desde = new Date(rango?.from as any);
  const hasta = new Date(rango?.to as any);
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
    return { success: false, error: 'Elegí el período antes de mandar el resumen.' };
  }
  const reporte = await getProfitAndLossData({ from: desde, to: hasta });
  if (!reporte.success || !reporte.data) {
    return { success: false, error: reporte.error || 'No se pudo armar el resumen del período.' };
  }
  return mandarResumenAlContador(reporte.data, nombreDelMes);
}

export async function getEmailContador(): Promise<string | undefined> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD);
  const company = await getCompanyInfo().catch(() => null);
  return company?.emailContador;
}
