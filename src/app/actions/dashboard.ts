
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

    // Corrected logic for future parties:
    // Count all customers with a future party date.
    const now = new Date();
    // Set time to 00:00:00 to include today as a future date
    now.setHours(0, 0, 0, 0); 
    
    const fiestasFuturasCount = customersData.filter(customer => 
      customer.partyDate && new Date(customer.partyDate) >= now
    ).length;

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
        fiestasFuturas: fiestasFuturasCount,
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
