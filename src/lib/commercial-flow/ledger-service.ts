/**
 * AK Producciones — Libro Mayor Financiero Unificado
 *
 * getFinancialLedger agrega ventas, cobros y saldos desde presupuestos,
 * facturas, pagosCliente e invoice.payments en una sola vista.
 */

import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';

export interface LedgerMonth {
  mes: string; // 'YYYY-MM'
  ventas: number;
  cobros: number;
  saldo: number;
}

export interface LedgerSummary {
  /** Ventas totales (facturas + presupuestos aceptados no facturados) */
  ventasTotales: number;
  /** Total efectivamente cobrado (invoice.payments + presupuesto.pagosCliente) */
  totalCobrado: number;
  /** Saldo pendiente de cobro */
  saldoPendiente: number;
  /** Detalle mensual */
  porMes: LedgerMonth[];
  /** Cantidad de facturas */
  cantidadFacturas: number;
  /** Cantidad de presupuestos aceptados sin factura */
  presupuestosAceptadosSinFactura: number;
}

/**
 * Calcula el libro mayor financiero unificado a partir de los datos crudos.
 * Esta función es pura (no llama a Firebase) para facilitar el testing.
 */
export function calculateFinancialLedger(
  presupuestos: Presupuesto[],
  invoices: Invoice[]
): LedgerSummary {
  const monthMap = new Map<string, LedgerMonth>();

  const getOrCreateMonth = (mes: string): LedgerMonth => {
    if (!monthMap.has(mes)) {
      monthMap.set(mes, { mes, ventas: 0, cobros: 0, saldo: 0 });
    }
    return monthMap.get(mes)!;
  };

  const getMes = (dateStr?: string): string => {
    if (!dateStr) return 'sin-fecha';
    try {
      return dateStr.slice(0, 7); // 'YYYY-MM'
    } catch {
      return 'sin-fecha';
    }
  };

  // 1. Sumar ventas de facturas
  let ventasFacturadas = 0;
  let totalCobradoFacturas = 0;
  for (const inv of invoices) {
    ventasFacturadas += inv.totalAmount ?? 0;
    const mes = getMes(inv.issueDate);
    const m = getOrCreateMonth(mes);
    m.ventas += inv.totalAmount ?? 0;

    // Cobros desde invoice.payments
    const cobrosInv = (inv.payments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
    totalCobradoFacturas += cobrosInv;
    m.cobros += cobrosInv;
  }

  // 2. Sumar ventas de presupuestos aceptados no facturados
  const presupuestosAceptadosSinFactura = presupuestos.filter(
    p => p.estado === 'Aceptado' && !p.invoiceId
  );
  let ventasPresupuestadas = 0;
  let totalCobradoPresupuestos = 0;
  for (const p of presupuestosAceptadosSinFactura) {
    const total = p.totalConDescuento ?? p.costoTotalEstimado ?? 0;
    ventasPresupuestadas += total;
    const mes = getMes(p.eventoFecha || p.timestamp);
    const m = getOrCreateMonth(mes);
    m.ventas += total;

    // Cobros desde presupuesto.pagosCliente
    const cobrosP = (p.pagosCliente ?? []).reduce((s, pg) => s + (pg.monto ?? 0), 0);
    totalCobradoPresupuestos += cobrosP;
    m.cobros += cobrosP;
  }

  const ventasTotales = ventasFacturadas + ventasPresupuestadas;
  const totalCobrado = totalCobradoFacturas + totalCobradoPresupuestos;
  const saldoPendiente = ventasTotales - totalCobrado;

  // Calcular saldo acumulado por mes
  const porMes = Array.from(monthMap.values())
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map(m => ({ ...m, saldo: m.ventas - m.cobros }));

  return {
    ventasTotales,
    totalCobrado,
    saldoPendiente,
    porMes,
    cantidadFacturas: invoices.length,
    presupuestosAceptadosSinFactura: presupuestosAceptadosSinFactura.length,
  };
}

/**
 * Versión asíncrona que carga los datos desde los servicios.
 * Usada por dashboard.ts.
 *
 * TODO (Fase 4) — Conectar reportes/flujo de caja: PENDIENTE
 * Las páginas de reportes y flujo de caja deben usar getFinancialLedger() o
 * calculateFinancialLedger() en lugar de recalcular los totales localmente.
 * Archivos a actualizar:
 *   - src/app/(app)/reportes/page.tsx (o equivalente)
 *   - src/app/(app)/contabilidad/flujo-de-caja/page.tsx (o equivalente)
 * Estado: PENDIENTE — Fase 3 incompleta para integración de ledger en reportes.
 */
export async function getFinancialLedger(): Promise<LedgerSummary> {
  const { getPresupuestos } = await import('@/app/actions/presupuestos');
  const { getInvoices } = await import('@/app/actions/invoices');

  const [presupuestos, invoices] = await Promise.all([
    getPresupuestos(),
    getInvoices(),
  ]);

  return calculateFinancialLedger(presupuestos, invoices);
}
