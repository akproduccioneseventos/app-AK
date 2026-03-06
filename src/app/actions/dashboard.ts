
'use server';

import { getCustomers } from './customers';
import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { checkAndCreateTaskReminders, checkAndCreateReunionReminders } from './notifications';
import { subMonths, format, isBefore, startOfToday, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCrmKpiData, getCrmLeads } from './crm';

export interface MonthlyChartData {
  month: string;
  ventas: number;
  pagos: number;
}

export interface GlobalAlert {
  id: string;
  type: 'task' | 'payment' | 'meeting' | 'budget';
  title: string;
  description: string;
  severity: 'high' | 'medium';
  href: string;
}

export async function getDashboardKpiData() {
  try {
    // Run reminder checks in the background
    checkAndCreateTaskReminders().catch(err => console.warn("Background task reminder check failed:", err));
    checkAndCreateReunionReminders().catch(err => console.warn("Background meeting reminder check failed:", err));

    const [
      customersData,
      presupuestosData,
      invoicesData,
      fiestasData,
      crmKpis,
      leadsData,
    ] = await Promise.all([
      getCustomers(),
      getPresupuestos(),
      getInvoices(),
      getAllFiestas(),
      getCrmKpiData(),
      getCrmLeads(),
    ]);
    
    const now = new Date();
    const today = startOfToday();
    const tomorrow = addDays(today, 1);
    
    const ventasTotales = invoicesData.reduce((total, inv) => total + inv.totalAmount, 0);
    const montoPagado = invoicesData.reduce((total, inv) => total + (inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0), 0);
    const totalPendiente = ventasTotales - montoPagado;
    const prospectosActivos = crmKpis.success ? crmKpis.data.activeLeads : 0;
    
    const activeCustomerIds = new Set(fiestasData.filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= now).map(f => f.configuracion.clienteId));
    const clientesActivos = activeCustomerIds.size;
    
    const fiestasPasadas = fiestasData.filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) < new Date()).length;
    const fiestasFuturas = fiestasData.filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= today).length;

    // Generar Alertas Globales
    const alerts: GlobalAlert[] = [];

    // 1. Tareas Vencidas o Próximas
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
              href: `/fiestas/nueva/tareas?fiestaId=${fiesta.id}`
            });
          }
        }
      });
    });

    // 2. Facturas Vencidas
    invoicesData.forEach(inv => {
      if (inv.status !== 'Paid' && inv.dueDate && isBefore(new Date(inv.dueDate), today)) {
        alerts.push({
          id: inv.id,
          type: 'payment',
          title: `Pago Pendiente: Factura ${inv.invoiceNumber}`,
          description: `Cliente: ${inv.customer.name || inv.customer.companyName}`,
          severity: 'high',
          href: `/invoices/${inv.id}`
        });
      }
    });

    // 3. REUNIONES CRM (Novedad Revisión 3)
    leadsData.forEach(lead => {
        if (lead.followUpDate) {
            const meetingDate = new Date(lead.followUpDate);
            if (isSameDay(meetingDate, today) || isSameDay(meetingDate, tomorrow)) {
                alerts.push({
                    id: `meet_${lead.id}`,
                    type: 'meeting',
                    title: `Reunión ${isSameDay(meetingDate, today) ? 'HOY' : 'MAÑANA'}: ${lead.name}`,
                    description: `Cita agendada para las ${meetingDate.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs`,
                    severity: isSameDay(meetingDate, today) ? 'high' : 'medium',
                    href: `/contabilidad/crm/agenda?date=${meetingDate.toISOString().split('T')[0]}`
                });
            }
        }
    });

    // 4. PRESUPUESTOS VENCIDOS (Novedad Revisión 3)
    presupuestosData.forEach(pres => {
        if (pres.estado === 'Enviado' || pres.estado === 'Borrador') {
            const createdDate = new Date(pres.timestamp);
            const expiryDate = addDays(createdDate, 30);
            if (isBefore(expiryDate, today)) {
                alerts.push({
                    id: `expire_${pres.id}`,
                    type: 'budget',
                    title: `Presupuesto Vencido: ${pres.clienteNombre}`,
                    description: `Enviado hace más de 30 días. Requiere seguimiento o actualización.`,
                    severity: 'medium',
                    href: `/presupuestos/${pres.id}/ver`
                });
            }
        }
    });

    // Data for Monthly Chart (last 12 months)
    const monthlyData: MonthlyChartData[] = [];
    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthName = format(date, 'MMM yyyy', { locale: es });
        monthlyData.push({ month: monthName, ventas: 0, pagos: 0 });
    }

    invoicesData.forEach(invoice => {
        const issueDate = new Date(invoice.issueDate);
        const monthKey = format(issueDate, 'MMM yyyy', { locale: es });
        const monthEntry = monthlyData.find(d => d.month === monthKey);
        if(monthEntry) {
            monthEntry.ventas += invoice.totalAmount;
        }

        invoice.payments?.forEach(payment => {
            const paymentDate = new Date(payment.paymentDate);
            const paymentMonthKey = format(paymentDate, 'MMM yyyy', { locale: es });
            const paymentMonthEntry = monthlyData.find(d => d.month === paymentMonthKey);
             if(paymentMonthEntry) {
                paymentMonthEntry.pagos += payment.amount;
            }
        });
    });

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
        alerts: alerts.sort((a, b) => a.severity === 'high' ? -1 : 1).slice(0, 6)
      },
    };
  } catch (error: any) {
    console.error('Error fetching dashboard KPI data:', error);
    return {
      success: false,
      error: 'Failed to load dashboard data.',
    };
  }
}
