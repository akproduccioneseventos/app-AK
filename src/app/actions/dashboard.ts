
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
    ] = await Promise.all([
      getCustomers(),
      getPresupuestos(),
      getInvoices(),
      getFiestaActual(),
    ]);
    
    // Total de ventas basado en el monto total de TODAS las facturas generadas.
    const ventasTotales = invoicesData.reduce((total, inv) => total + inv.totalAmount, 0);

    // Total pagado basado en la suma de todos los pagos en todas las facturas.
    const montoPagado = invoicesData.reduce(
        (total, inv) => total + (inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0), 0
    );

    // El saldo pendiente es la diferencia.
    const totalPendiente = ventasTotales - montoPagado;

    // Conteo de prospectos basado en presupuestos no aceptados/facturados.
    const prospectosActivos = presupuestosData.filter(
      (p) => p.estado === 'Borrador' || p.estado === 'Enviado'
    ).length;

    // Conteo de fiestas futuras basado en clientes activos.
    const clientesActivos = customersData.filter(c => c.estadoCliente === 'Actual').length;
    
    // Conteo de fiestas pasadas.
    const historialFiestas = await getHistorialFiestas();
    const fiestasPasadas = historialFiestas.length;

    return {
      success: true,
      data: {
        fiestasPasadas,
        fiestasFuturas: clientesActivos,
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
