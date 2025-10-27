
'use server';

import { getCustomers } from './customers';
import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { checkAndCreateTaskReminders, checkAndCreateReunionReminders } from './notifications';
import { subMonths, format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export interface MonthlyChartData {
  month: string;
  ventas: number;
  pagos: number;
}

export async function getDashboardKpiData() {
  try {
    // Run reminder checks in the background without waiting for them
    checkAndCreateTaskReminders().catch(err => console.warn("Background task reminder check failed:", err));
    checkAndCreateReunionReminders().catch(err => console.warn("Background meeting reminder check failed:", err));

    const [
      customersData,
      presupuestosData,
      invoicesData,
      fiestasData,
    ] = await Promise.all([
      getCustomers(),
      getPresupuestos(),
      getInvoices(),
      getAllFiestas(),
    ]);
    
    const now = new Date();
    const ventasTotales = invoicesData.reduce((total, inv) => total + inv.totalAmount, 0);
    const montoPagado = invoicesData.reduce((total, inv) => total + (inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0), 0);
    const totalPendiente = ventasTotales - montoPagado;
    const prospectosActivos = presupuestosData.filter(p => p.estado === 'Borrador' || p.estado === 'Enviado').length;
    
    const activeCustomerIds = new Set(fiestasData.filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= now).map(f => f.configuracion.clienteId));
    const clientesActivos = activeCustomerIds.size;
    
    const fiestasPasadas = fiestasData.filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) < new Date()).length;
    const fiestasFuturas = clientesActivos;

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
