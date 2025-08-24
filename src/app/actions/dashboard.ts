
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
    const clientesConFiestaFutura = new Set<string>();

    // 1. Check the current event being planned
    if (fiestaActualData?.configuracion?.fechaEvento && new Date(fiestaActualData.configuracion.fechaEvento) >= now) {
      if (fiestaActualData.configuracion.clienteId) {
        clientesConFiestaFutura.add(fiestaActualData.configuracion.clienteId);
      } else {
        // If no client is linked, it still counts as one future party.
        // We use a placeholder to represent this unlinked party.
        clientesConFiestaFutura.add('fiesta_actual_sin_cliente');
      }
    }
    
    // 2. Count other customers with future parties, ensuring not to double-count
    customersData.forEach(customer => {
      if (customer.partyDate && new Date(customer.partyDate) >= now) {
        clientesConFiestaFutura.add(customer.id);
      }
    });

    const fiestasFuturasCount = clientesConFiestaFutura.size;

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
