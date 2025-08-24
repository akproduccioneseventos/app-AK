
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

    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    
    // Corrected logic for future parties.
    // Includes the current event if its date is in the future,
    // plus any other customers with a future date.
    let fiestasFuturasCount = 0;
    const clientesConFiestaFutura = new Set<string>();

    // 1. Check the current event being planned
    if (fiestaActualData?.configuracion?.fechaEvento && new Date(fiestaActualData.configuracion.fechaEvento) >= now) {
      fiestasFuturasCount = 1;
      if (fiestaActualData.configuracion.clienteId) {
        clientesConFiestaFutura.add(fiestaActualData.configuracion.clienteId);
      }
    }
    
    // 2. Count other customers with future parties, ensuring not to double-count
    customersData.forEach(customer => {
      if (
        customer.partyDate && 
        new Date(customer.partyDate) >= now &&
        !clientesConFiestaFutura.has(customer.id) // Avoid double counting if they are also the "current" party
      ) {
        fiestasFuturasCount++;
        clientesConFiestaFutura.add(customer.id);
      }
    });

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
