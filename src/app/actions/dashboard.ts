'use server';

import { getCustomers } from './customers';
import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { getFiestaActual, getHistorialFiestas } from './fiesta-actual';

export async function getDashboardKpiData() {
  try {
    const [
      customersData,
      presupuestosData,
      invoicesData,
      fiestaActualData,
      historialFiestasData,
    ] = await Promise.all([
      getCustomers(),
      getPresupuestos(),
      getInvoices(),
      getFiestaActual(),
      getHistorialFiestas(),
    ]);

    const esFiestaFutura =
      fiestaActualData?.configuracion?.fechaEvento &&
      new Date(fiestaActualData.configuracion.fechaEvento) >= new Date();

    const clientesActivos = customersData.filter(
      (c) => c.estadoCliente === 'Actual'
    ).length;

    const prospectosActivos = presupuestosData.filter(
      (p) => p.estado === 'Borrador' || p.estado === 'Enviado'
    ).length;

    const totalPendiente = invoicesData.reduce((total, inv) => {
      const paidOnThisInvoice =
        inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
      const dueOnThisInvoice = inv.totalAmount - paidOnThisInvoice;
      return total + (dueOnThisInvoice > 0 ? dueOnThisInvoice : 0);
    }, 0);

    return {
      success: true,
      data: {
        fiestasPasadas: historialFiestasData.length,
        fiestasFuturas: esFiestaFutura ? 1 : 0,
        clientesActivos,
        prospectosActivos,
        totalPendiente,
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
