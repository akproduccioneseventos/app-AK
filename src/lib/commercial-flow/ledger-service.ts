/**
 * AK Producciones — Libro Mayor Financiero Unificado
 *
 * getFinancialLedger agrega ventas, cobros y saldos desde presupuestos,
 * facturas, pagosCliente e invoice.payments en una sola vista.
 */

import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';
import { roundMoney, sumConfirmedClientPayments } from '@/lib/budget/financial-guardrails';

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

export type ReconciledSalePayment = {
  id: string;
  date: string;
  amount: number;
  source: 'invoice' | 'budget';
};

export function getReconciledSalePayments(
  invoice: Invoice,
  linkedBudget?: Presupuesto,
): ReconciledSalePayment[] {
  const invoicePayments = (invoice.payments ?? [])
    .map(payment => ({
      id: payment.id,
      date: payment.paymentDate,
      amount: roundMoney(payment.amount),
      source: 'invoice' as const,
    }))
    .filter(payment => payment.amount > 0);

  const budgetPayments = (linkedBudget?.pagosCliente ?? [])
    .filter(payment => payment.estadoPago !== 'pendiente_confirmacion' && payment.estadoPago !== 'rechazado')
    .map(payment => ({
      id: payment.id,
      date: payment.fecha,
      amount: roundMoney(payment.monto),
      source: 'budget' as const,
    }))
    .filter(payment => payment.amount > 0);

  const invoiceTotal = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const budgetTotal = budgetPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Deposits are intentionally mirrored in both records. Use the most complete
  // source instead of adding both, so cash is neither duplicated nor hidden.
  return budgetTotal > invoiceTotal ? budgetPayments : invoicePayments;
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
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'sin-fecha';
    return date.toISOString().slice(0, 7); // 'YYYY-MM'
  };
  const addCollection = (date: string, amount: number) => {
    getOrCreateMonth(getMes(date)).cobros += amount;
  };
  const linkedBudgetByInvoiceId = new Map(
    presupuestos
      .filter(presupuesto => presupuesto.invoiceId)
      .map(presupuesto => [presupuesto.invoiceId!, presupuesto]),
  );

  // 1. Sumar ventas de facturas
  let ventasFacturadas = 0;
  let totalCobradoFacturas = 0;
  for (const inv of invoices) {
    const invoiceTotal = roundMoney(inv.totalAmount);
    ventasFacturadas += invoiceTotal;
    const mes = getMes(inv.issueDate);
    const m = getOrCreateMonth(mes);
    m.ventas += invoiceTotal;

    const reconciledPayments = getReconciledSalePayments(inv, linkedBudgetByInvoiceId.get(inv.id));
    const cobrosInv = reconciledPayments.reduce((sum, payment) => sum + payment.amount, 0);
    totalCobradoFacturas += cobrosInv;
    reconciledPayments.forEach(payment => addCollection(payment.date, payment.amount));
  }

  // 2. Sumar ventas de presupuestos aceptados no facturados
  const presupuestosAceptadosSinFactura = presupuestos.filter(
    p => p.estado === 'Aceptado' && !p.invoiceId
  );
  let ventasPresupuestadas = 0;
  let totalCobradoPresupuestos = 0;
  for (const p of presupuestosAceptadosSinFactura) {
    const total = roundMoney(p.totalConDescuento ?? p.costoTotalEstimado);
    ventasPresupuestadas += total;
    const mes = getMes(p.eventoFecha || p.timestamp);
    const m = getOrCreateMonth(mes);
    m.ventas += total;

    // Cobros desde presupuesto.pagosCliente. Los comprobantes pendientes no cuentan como dinero cobrado.
    const cobrosP = sumConfirmedClientPayments(p.pagosCliente ?? []);
    totalCobradoPresupuestos += cobrosP;
    (p.pagosCliente ?? [])
      .filter(payment => payment.estadoPago !== 'pendiente_confirmacion' && payment.estadoPago !== 'rechazado')
      .forEach(payment => addCollection(payment.fecha, roundMoney(payment.monto)));
  }

  const ventasTotales = ventasFacturadas + ventasPresupuestadas;
  const totalCobrado = totalCobradoFacturas + totalCobradoPresupuestos;
  const saldoPendiente = Math.max(0, ventasTotales - totalCobrado);

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

 * TODO (Fase 4) — Conectar reportes/flujo de caja: COMPLETADO
 * Se ha integrado getFinancialLedger() y calculateFinancialLedger() en el gráfico del dashboard de ventas y pagos, así como en la estimación del flujo de caja mensual (CFO Virtual en actions/dashboard.ts) para evitar la duplicación de cobros y mantener la consistencia matemática en toda la aplicación.
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
