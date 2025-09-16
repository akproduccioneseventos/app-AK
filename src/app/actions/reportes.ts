
'use server';

import { getInvoices } from './invoices';
import { getFiestas, getHistorialFiestas } from './fiesta-actual';
import { getMenuById } from './menus-catering';
import { getEmpleados } from './empleados';
import { getRoles } from './roles';

interface DateRange {
  from: Date;
  to: Date;
}

export interface IngresoDetalle {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
}

export interface CostoDetalle {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string;
  monto: number;
}

export interface ProfitAndLossData {
  ingresos: {
    total: number;
    detalle: IngresoDetalle[];
  };
  costos: {
    total: number;
    detalle: CostoDetalle[];
  };
  gananciaNeta: number;
  margen: number;
}

export async function getProfitAndLossData(range: DateRange): Promise<{ success: boolean; data?: ProfitAndLossData; error?: string }> {
  try {
    const { from, to } = range;

    // --- CÁLCULO DE INGRESOS ---
    const allInvoices = await getInvoices();
    const ingresosDetalle: IngresoDetalle[] = [];
    let totalIngresos = 0;

    allInvoices.forEach(invoice => {
      invoice.payments?.forEach(payment => {
        const paymentDate = new Date(payment.paymentDate);
        if (paymentDate >= from && paymentDate <= to) {
          ingresosDetalle.push({
            id: payment.id,
            fecha: payment.paymentDate,
            concepto: `Pago Factura #${invoice.invoiceNumber} (Cliente: ${invoice.customer.name || invoice.customer.companyName})`,
            monto: payment.amount,
          });
          totalIngresos += payment.amount;
        }
      });
    });

    // --- CÁLCULO DE COSTOS ---
    const [fiestas, historial, empleados, roles] = await Promise.all([
      getFiestas(false),
      getHistorialFiestas(),
      getEmpleados(),
      getRoles()
    ]);
    const allFiestas = [...fiestas, ...historial];
    const costosDetalle: CostoDetalle[] = [];
    let totalCostos = 0;

    for (const fiesta of allFiestas) {
      const fiestaDate = fiesta.configuracion.fechaEvento ? new Date(fiesta.configuracion.fechaEvento) : null;
      if (!fiestaDate || fiestaDate < from || fiestaDate > to) {
        continue; // Skip events outside the date range
      }
      
      const invitados = Number(fiesta.configuracion.invitadosEstimados) || 0;

      // Costos de Catering
      if (fiesta.menuAsignadoId) {
        const menu = await getMenuById(fiesta.menuAsignadoId);
        if (menu) {
          const costoMenu = menu.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0) * invitados;
          costosDetalle.push({ id: `catering-${fiesta.id}`, fecha: fiesta.configuracion.fechaEvento!, concepto: `Costo Catering: ${menu.name}`, categoria: 'Catering', monto: costoMenu });
          totalCostos += costoMenu;
        }
      }
      // Costos de Repostería
      const costoReposteria = fiesta.reposteria?.categorias?.reduce((sumCat, cat) => sumCat + (cat.items.reduce((sumItem, item) => sumItem + ((item.costoEstimado || 0) * (item.cantidad || 1)), 0)), 0) || 0;
      if (costoReposteria > 0) {
        costosDetalle.push({ id: `reposteria-${fiesta.id}`, fecha: fiesta.configuracion.fechaEvento!, concepto: 'Costo total Repostería', categoria: 'Repostería', monto: costoReposteria });
        totalCostos += costoReposteria;
      }
      // Costos de Bebidas
      const costoBebidas = fiesta.bebidas?.categorias?.reduce((sumCat, cat) => sumCat + (cat.items.reduce((sumItem, item) => sumItem + (item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0))), 0)), 0) || 0;
      if (costoBebidas > 0) {
        costosDetalle.push({ id: `bebidas-${fiesta.id}`, fecha: fiesta.configuracion.fechaEvento!, concepto: 'Costo total Bebidas', categoria: 'Bebidas', monto: costoBebidas });
        totalCostos += costoBebidas;
      }
      // Costos de Personal
      fiesta.personalAsignado?.forEach(personal => {
          const empleado = empleados.find(e => e.id === personal.empleadoId);
          const rol = empleado?.rolId ? roles.find(r => r.id === empleado.rolId) : undefined;
          const aportes = (personal.eventSalary * (rol?.porcentajeAportesPatronales || 0)) / 100;
          const costoTotalPersonal = personal.eventSalary + aportes;
          costosDetalle.push({ id: `personal-${personal.empleadoId}-${fiesta.id}`, fecha: fiesta.configuracion.fechaEvento!, concepto: `Pago Personal: ${empleado?.nombre || 'N/A'}`, categoria: 'Personal', monto: costoTotalPersonal });
          totalCostos += costoTotalPersonal;
      });
      // Costos Directos Manuales (Gestión de Costos)
      fiesta.gestionCostos?.costosItems?.forEach(costo => {
          costosDetalle.push({ id: `manual-${costo.id}`, fecha: fiesta.configuracion.fechaEvento!, concepto: costo.nombre, categoria: costo.categoria, monto: costo.montoEstimado });
          totalCostos += costo.montoEstimado;
      });
      // Pagos a Proveedores
      fiesta.pagosProveedores?.forEach(pago => {
          const pagoDate = new Date(pago.fecha);
           if (pagoDate >= from && pagoDate <= to) {
            const costoAsociado = fiesta.gestionCostos?.costosItems?.find(c => c.id === pago.costoAsociadoId);
            costosDetalle.push({ id: `pago-prov-${pago.id}`, fecha: pago.fecha, concepto: `Pago: ${costoAsociado?.nombre || 'Proveedor'}`, categoria: 'Pagos a Proveedores', monto: pago.monto });
            totalCostos += pago.monto;
           }
      });
    }

    const gananciaNeta = totalIngresos - totalCostos;
    const margen = totalIngresos > 0 ? (gananciaNeta / totalIngresos) * 100 : 0;

    return {
      success: true,
      data: {
        ingresos: { total: totalIngresos, detalle: ingresosDetalle },
        costos: { total: totalCostos, detalle: costosDetalle },
        gananciaNeta,
        margen,
      },
    };

  } catch (error: any) {
    console.error("Error calculating P&L data:", error);
    return { success: false, error: 'Failed to calculate profit and loss data.' };
  }
}
