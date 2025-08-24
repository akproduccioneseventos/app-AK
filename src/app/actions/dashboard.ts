
'use server';

import { getCustomers } from './customers';
import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { getFiestaActual, getHistorialFiestas } from './fiesta-actual';
import type { Customer } from '@/types/customer';

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
    
    const clientesActivos = customersData.filter(
      (c) => c.estadoCliente === 'Actual'
    ).length;

    // Corrected logic for "Fiestas Futuras"
    // It now specifically checks if the "Fiesta Actual" is set for a future date.
    let fiestasFuturasCount = 0;
    if (fiestaActualData?.configuracion?.fechaEvento) {
        const fechaEvento = new Date(fiestaActualData.configuracion.fechaEvento);
        if (fechaEvento >= now) {
            fiestasFuturasCount = 1;
        }
    }

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
