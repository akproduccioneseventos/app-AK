
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
    
    // --- Lógica de Fiestas Futuras Corregida ---
    // Contará cada cliente que tenga una fiesta en el futuro, sin duplicados.
    const clientesConFiestaFutura = new Set<string>();

    // 1. Iterar sobre todos los clientes activos y contar sus fiestas futuras
    customersData.forEach(customer => {
      // Solo contar clientes activos que tengan una fecha de fiesta futura
      if (customer.estadoCliente === 'Actual' && customer.partyDate && new Date(customer.partyDate) >= now) {
        clientesConFiestaFutura.add(customer.id);
      }
    });

    // 2. Considerar la fiesta actual en planificación, solo si su cliente no ha sido contado ya
    if (fiestaActualData?.configuracion?.fechaEvento && new Date(fiestaActualData.configuracion.fechaEvento) >= now) {
      if (fiestaActualData.configuracion.clienteId) {
        // Añadir solo si no estaba ya en el set (evita doble conteo)
        clientesConFiestaFutura.add(fiestaActualData.configuracion.clienteId);
      }
      // Si la fiesta actual no tiene clienteId, no se puede añadir al set de clientes,
      // pero podría considerarse una fiesta futura si la lógica de negocio lo permite.
      // Por ahora, solo contamos las vinculadas a un cliente para ser consistentes.
    }
    

    const fiestasFuturasCount = clientesConFiestaFutura.size;
    // --- Fin de la Lógica Corregida ---

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
