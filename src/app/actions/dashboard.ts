'use server';

import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { checkAndCreateTaskReminders, checkAndCreateReunionReminders, getNotifications } from './notifications';
import { subMonths, format, isBefore, startOfToday, addDays, isSameDay, addMonths, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCrmLeadsForDashboard } from './crm';
import { getRoles } from './roles';
import { calculateFinancialLedger, getReconciledSalePayments, isFirmSalesInvoice } from '@/lib/commercial-flow/ledger-service';
import { getPrioridadesDescartadas } from './alertas.actions';
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import { verifySession } from '@/lib/auth/session-token';
import { requireAppSession } from '@/lib/auth/require-session';

import { requireAppSession } from '@/lib/auth/require-session';
export interface MonthlyChartData {
  month: string;
  ventas: number;
  pagos: number;
}

export interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface GlobalAlert {
  id: string;
  type: 'task' | 'payment' | 'meeting' | 'budget';
  title: string;
  description: string;
  severity: 'high' | 'medium';
  href: string;
}

export type DashboardSourceStatus = {
  presupuestos: boolean;
  facturas: boolean;
  fiestas: boolean;
  prospectos: boolean;
};

type DashboardSourceName = keyof DashboardSourceStatus;

async function loadDashboardSource<T>(
  source: DashboardSourceName,
  loader: () => Promise<T>,
  fallback: T,
  status: DashboardSourceStatus,
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    status[source] = false;
    console.error(`Dashboard ${source} failed:`, error);
    return fallback;
  }
}

function isFirmBudgetStatus(estado?: string) {
  return estado === 'Aceptado' || estado === 'Facturado';
}

function getMonthKey(date: Date) {
  if (Number.isNaN(date.getTime())) return 'sin fecha';
  return format(date, 'MMM yyyy', { locale: es });
}

function roundMoney(value: unknown) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function getInvoicePaidAmount(invoice: { payments?: { amount?: number }[] }) {
  return (invoice.payments ?? []).reduce((sum, payment) => sum + roundMoney(payment.amount), 0);
}

export async function getDashboardKpiData() {
  try {
    const auth = await verifySession();
    if (!auth.success) {
      return { success: false, error: 'SESSION_EXPIRED' };
    }

    checkAndCreateTaskReminders().catch(err => console.warn('Background task reminder check failed:', err));
    checkAndCreateReunionReminders().catch(err => console.warn('Background meeting reminder check failed:', err));

    const sourceStatus: DashboardSourceStatus = {
      presupuestos: true,
      facturas: true,
      fiestas: true,
      prospectos: true,
    };
    const [
      presupuestosData,
      invoicesData,
      fiestasData,
      leadsData,
      notificationsData,
      prioridadesDescartadas,
    ] = await Promise.all([
      loadDashboardSource('presupuestos', getPresupuestos, [], sourceStatus),
      loadDashboardSource('facturas', getInvoices, [], sourceStatus),
      loadDashboardSource('fiestas', getAllFiestas, [], sourceStatus),
      loadDashboardSource('prospectos', getCrmLeadsForDashboard, [], sourceStatus),
      getNotifications().catch(() => []),
      getPrioridadesDescartadas().catch(() => new Set<string>()),
    ]);

    if (Object.values(sourceStatus).every((available) => !available)) {
      return { success: false, error: 'DASHBOARD_DATA_UNAVAILABLE' };
    }

    const now = new Date();
    const today = startOfToday();
    const tomorrow = addDays(today, 1);

    const ledger = calculateFinancialLedger(presupuestosData, invoicesData);
    const ventasTotales = ledger.ventasTotales;
    const montoPagado = ledger.totalCobrado;
    const totalPendiente = ledger.saldoPendiente;
    const prospectosActivos = leadsData.filter((lead) => lead.currentStageId !== 's4' && lead.currentStageId !== 's5').length;

    const activeFiestas = fiestasData.filter(f => f.estado !== 'Archivado' && f.estado !== 'Demo AK' && !f.id.startsWith('demo_'));
    const activeCustomerIds = new Set(
      activeFiestas
        .filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= now)
        .map(f => f.configuracion.clienteId)
    );
    const clientesActivos = activeCustomerIds.size;
    const fiestasPasadas = activeFiestas.filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) < now).length;
    const fiestasFuturas = activeFiestas.filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= today).length;

    const alerts: GlobalAlert[] = [];

    fiestasData.forEach(fiesta => {
      fiesta.tareas?.forEach(tarea => {
        if (!tarea.completada && tarea.fechaLimite) {
          const dueDate = new Date(tarea.fechaLimite);
          if (isBefore(dueDate, today)) {
            alerts.push({
              id: tarea.id,
              type: 'task',
              title: `Tarea Vencida: ${tarea.texto}`,
              description: `Evento: ${fiesta.configuracion.nombreEvento}`,
              severity: 'high',
              href: `/fiestas/nueva/tareas?fiestaId=${fiesta.id}`,
            });
          }
        }
      });
    });

    invoicesData.forEach(inv => {
      if (inv.status !== 'Paid' && inv.dueDate && isBefore(new Date(inv.dueDate), today)) {
        alerts.push({
          id: inv.id,
          type: 'payment',
          title: `Pago Pendiente: Factura ${inv.invoiceNumber}`,
          description: `Cliente: ${inv.customer.name || inv.customer.companyName}`,
          severity: 'high',
          href: `/invoices/${inv.id}`,
        });
      }
    });

    presupuestosData.forEach(pres => {
      if (!isFirmBudgetStatus(pres.estado)) return;
      const summary = getBudgetPaymentSummary(pres, { includeAnnualAdjustment: true });
      if (summary.balance > 0 && pres.eventoFecha && new Date(pres.eventoFecha) <= addDays(today, 7)) {
        alerts.push({
          id: `budget_balance_${pres.id}`,
          type: 'payment',
          title: `Saldo pendiente: ${pres.clienteNombre}`,
          description: `Faltan ${summary.balance.toLocaleString('es-UY')} UYU para completar el presupuesto.`,
          severity: 'high',
          href: `/presupuestos/${pres.id}/ver`,
        });
      }
    });

    leadsData.forEach(lead => {
      if (!lead.followUpDate) return;
      const meetingDate = new Date(lead.followUpDate);
      if (isSameDay(meetingDate, today) || isSameDay(meetingDate, tomorrow)) {
        alerts.push({
          id: `meet_${lead.id}`,
          type: 'meeting',
          title: `Reunión ${isSameDay(meetingDate, today) ? 'HOY' : 'MAÑANA'}: ${lead.name}`,
          description: `Cita agendada para las ${meetingDate.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs`,
          severity: isSameDay(meetingDate, today) ? 'high' : 'medium',
          href: `/contabilidad/crm/agenda?date=${meetingDate.toISOString().split('T')[0]}`,
        });
      }
    });

    presupuestosData.forEach(pres => {
      if (pres.estado !== 'Enviado') return;
      const createdDate = new Date(pres.timestamp);
      const expiryDate = addDays(createdDate, 30);
      if (isBefore(expiryDate, today)) {
        alerts.push({
          id: `expire_${pres.id}`,
          type: 'budget',
          title: `Presupuesto vencido: ${pres.clienteNombre || 'Sin nombre'}`,
          description: 'Enviado hace más de 30 días. Requiere seguimiento o actualización.',
          severity: 'medium',
          href: `/presupuestos/${pres.id}/ver`,
        });
      }
    });

    const monthlyData: MonthlyChartData[] = [];
    const ledgerMonthsMap = new Map(ledger.porMes.map(m => [m.mes, m]));

    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthName = getMonthKey(date);
      const monthKey = format(date, 'yyyy-MM');
      const ledgerMonth = ledgerMonthsMap.get(monthKey);
      
      monthlyData.push({
        month: monthName,
        ventas: ledgerMonth ? ledgerMonth.ventas : 0,
        pagos: ledgerMonth ? ledgerMonth.cobros : 0,
      });
    }

    return {
      success: true,
      data: {
        fiestasPasadas,
        fiestasFuturas,
        clientesActivos,
        prospectosActivos,
        ventasTotales,
        montoPagado,
        totalPendiente,
        monthlyChartData: monthlyData,
        alerts: alerts.filter(a => !prioridadesDescartadas.has(a.id)).sort((a, b) => a.severity === 'high' ? -1 : 1).slice(0, 6),
        notificacionesNoLeidas: notificationsData.filter(n => !n.leida).length,
        proximoEvento: (() => {
          const futuras = activeFiestas
            .filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= today)
            .sort((a, b) => new Date(a.configuracion.fechaEvento!).getTime() - new Date(b.configuracion.fechaEvento!).getTime());
          if (futuras.length === 0) return null;
          const next = futuras[0];
          return {
            nombre: next.configuracion.nombreEvento || 'Evento sin nombre',
            fecha: next.configuracion.fechaEvento!,
          };
        })(),
        presupuestosPendientes: presupuestosData.filter(p => p.estado === 'Enviado').length,
        facturasPorVencer: (() => {
          const in7days = addDays(today, 7);
          return invoicesData.filter(inv => {
            if (inv.status !== 'Sent' && inv.status !== 'Overdue') return false;
            if (!inv.dueDate) return false;
            const due = new Date(inv.dueDate);
            return due >= today && due <= in7days;
          }).length;
        })(),
        sourceStatus,
        unavailableSources: Object.entries(sourceStatus)
          .filter(([, available]) => !available)
          .map(([source]) => source),
      },
    };
  } catch (error: any) {
    console.error('Error fetching dashboard KPI data:', error);
    return { success: false, error: 'Failed to load dashboard data.' };
  }
}

export async function getCashFlowProjection() {
  await requireAppSession();
  try {
    await requireAppSession();
    const [fiestas, invoices, roles, presupuestos] = await Promise.all([
      getAllFiestas().catch(err => { console.error('CashFlow getAllFiestas failed:', err); return []; }),
      getInvoices().catch(err => { console.error('CashFlow getInvoices failed:', err); return []; }),
      getRoles().catch(err => { console.error('CashFlow getRoles failed:', err); return []; }),
      getPresupuestos().catch(err => { console.error('CashFlow getPresupuestos failed:', err); return []; }),
    ]);

    const today = startOfToday();
    const projectionMonths: CashFlowMonth[] = [];
    const currentMonthKey = getMonthKey(today);

    for (let i = 0; i < 6; i++) {
      const date = addMonths(today, i);
      projectionMonths.push({ month: getMonthKey(date), income: 0, expenses: 0, balance: 0 });
    }

    const firmInvoiceIds = new Set(invoices.filter(isFirmSalesInvoice).map(invoice => invoice.id));
    const invoicedPresupuestoIds = new Set(
      presupuestos.filter(p => p.invoiceId && firmInvoiceIds.has(p.invoiceId)).map(p => p.id)
    );

    const linkedBudgetByInvoiceId = new Map(
      presupuestos
        .filter(p => p.invoiceId)
        .map(p => [p.invoiceId!, p])
    );

    invoices.forEach(inv => {
      if (!isFirmSalesInvoice(inv)) return;
      if (inv.status === 'Paid') return;
      const reconciledPayments = getReconciledSalePayments(inv, linkedBudgetByInvoiceId.get(inv.id));
      const paidAmount = reconciledPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, roundMoney(inv.totalAmount) - paidAmount);
      if (remaining <= 0) return;
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : today;
      const monthKey = isAfter(dueDate, today) || isSameDay(dueDate, today) ? getMonthKey(dueDate) : currentMonthKey;
      const monthEntry = projectionMonths.find(m => m.month === monthKey);
      if (monthEntry) monthEntry.income += remaining;
    });

    presupuestos.forEach(pres => {
      if (!isFirmBudgetStatus(pres.estado)) return;
      if (invoicedPresupuestoIds.has(pres.id)) return;
      if (!pres.eventoFecha) return;
      const eventDate = new Date(pres.eventoFecha);
      if (!isAfter(eventDate, today) && !isSameDay(eventDate, today)) return;
      const monthEntry = projectionMonths.find(m => m.month === getMonthKey(eventDate));
      if (!monthEntry) return;
      monthEntry.income += getBudgetPaymentSummary(pres, {
        includeAnnualAdjustment: true,
      }).balance;
    });

    fiestas.forEach(fiesta => {
      if (!fiesta.configuracion?.fechaEvento) return;
      const eventDate = new Date(fiesta.configuracion.fechaEvento);
      if (!isAfter(eventDate, today) && !isSameDay(eventDate, today)) return;
      const monthEntry = projectionMonths.find(m => m.month === getMonthKey(eventDate));
      if (!monthEntry) return;

      const manualCosts = fiesta.gestionCostos?.costosItems?.reduce((s, i) => s + roundMoney(i.montoEstimado), 0) || 0;
      const paidProviders = fiesta.pagosProveedores?.reduce((s, p) => s + roundMoney(p.monto), 0) || 0;
      let staffCosts = 0;
      fiesta.personalAsignado?.forEach(pa => {
        const rol = roles.find(r => r.id === pa.rolId);
        const salary = roundMoney(pa.eventSalary);
        const contributions = (salary * (rol?.porcentajeAportesPatronales || 0)) / 100;
        staffCosts += salary + contributions;
      });

      monthEntry.expenses += Math.max(0, manualCosts - paidProviders) + staffCosts;
    });

    projectionMonths.forEach(m => {
      m.income = Math.round(m.income);
      m.expenses = Math.round(m.expenses);
      m.balance = m.income - m.expenses;
    });

    return { success: true, data: projectionMonths };
  } catch (error: any) {
    console.error('Error calculating cash flow projection:', error);
    return { success: false, error: error.message };
  }
}
