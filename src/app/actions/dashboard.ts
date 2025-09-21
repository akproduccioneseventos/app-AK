
'use server';

import { getCustomers } from './customers';
import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { getAllFiestas } from './fiesta-actual';

export async function getDashboardKpiData() {
  try {
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
    
    const ventasTotales = invoicesData.reduce((total, inv) => total + inv.totalAmount, 0);
    const montoPagado = invoicesData.reduce((total, inv) => total + (inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0), 0);
    const totalPendiente = ventasTotales - montoPagado;
    const prospectosActivos = presupuestosData.filter(p => p.estado === 'Borrador' || p.estado === 'Enviado').length;
    const clientesActivos = customersData.filter(c => c.estadoCliente === 'Actual').length;
    const fiestasPasadas = fiestasData.filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) < new Date()).length;
    
    // Fiestas futuras se basa en la cantidad de clientes activos
    const fiestasFuturas = clientesActivos;

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
