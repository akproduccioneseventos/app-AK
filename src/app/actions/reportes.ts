
'use server';

import { getInvoices } from './invoices';
import { getAllFiestas, getFiestaActual } from './fiesta/fiesta.actions';
import { getMenuById } from './menus-catering';
import { getEmpleados } from './empleados';
import { getRoles } from './roles';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

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

export interface EventFinancialSummaryData extends ProfitAndLossData {
    nombreEvento: string;
    fechaEvento: string;
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
    const [fiestas, empleados, roles] = await Promise.all([
      getAllFiestas(),
      getEmpleados(),
      getRoles()
    ]);

    const costosDetalle: CostoDetalle[] = [];
    let totalCostos = 0;

    for (const fiesta of fiestas) {
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

async function getEventData(fiesta: FiestaEnPlanificacion): Promise<{ costosDetalle: CostoDetalle[], ingresosDetalle: IngresoDetalle[] }> {
    const costosDetalle: CostoDetalle[] = [];
    const ingresosDetalle: IngresoDetalle[] = [];

    if (!fiesta.configuracion.fechaEvento) return { costosDetalle, ingresosDetalle };
    
    const fechaEvento = fiesta.configuracion.fechaEvento;
    const invitados = Number(fiesta.configuracion.invitadosEstimados) || 0;

    // Ingresos
    const ingresosTotales = fiesta.gestionCostos?.ingresosTotalesEstimados || 0;
    if (ingresosTotales > 0) {
        ingresosDetalle.push({ id: 'ingreso-total', fecha: fechaEvento, concepto: 'Ingreso Total Estimado/Facturado', monto: ingresosTotales });
    }

    // Costos
    if (fiesta.menuAsignadoId) {
        const menu = await getMenuById(fiesta.menuAsignadoId);
        if (menu) {
            const costoMenu = menu.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0) * invitados;
            costosDetalle.push({ id: `catering`, fecha: fechaEvento, concepto: `Costo Catering: ${menu.name}`, categoria: 'Catering', monto: costoMenu });
        }
    }

    const costoReposteria = fiesta.reposteria?.categorias?.reduce((sumCat, cat) => cat.activada ? sumCat + (cat.items.reduce((sumItem, item) => sumItem + ((item.costoEstimado || 0) * (item.cantidad || 1)), 0)) : sumCat, 0) || 0;
    if (costoReposteria > 0) costosDetalle.push({ id: 'reposteria', fecha: fechaEvento, concepto: 'Costo total Repostería', categoria: 'Repostería', monto: costoReposteria });
    
    let costoBebidas = 0;
    fiesta.bebidas?.categorias.forEach(cat => {
        if(cat.activada) {
            cat.items.forEach(item => costoBebidas += item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0)));
            cat.recetas?.forEach(receta => {
                 const factorEscala = invitados / (receta.porcionesBase || 1);
                 costoBebidas += (receta.costoTotalReceta || 0) * (isNaN(factorEscala) ? 0 : factorEscala);
            });
        }
    });
    if (costoBebidas > 0) costosDetalle.push({ id: `bebidas`, fecha: fechaEvento, concepto: 'Costo total Bebidas', categoria: 'Bebidas', monto: costoBebidas });
    
    if (fiesta.personalAsignado && fiesta.personalAsignado.length > 0) {
      const [empleados, roles] = await Promise.all([getEmpleados(), getRoles()]);
      const costoPersonal = fiesta.personalAsignado.reduce((total, p) => {
        const rol = roles.find(r => r.id === empleados.find(e => e.id === p.empleadoId)?.rolId);
        const aportes = (p.eventSalary * (rol?.porcentajeAportesPatronales || 0)) / 100;
        return total + p.eventSalary + aportes;
      }, 0);
      costosDetalle.push({ id: `personal`, fecha: fechaEvento, concepto: 'Costo total Personal', categoria: 'Personal', monto: costoPersonal });
    }

    const costoDecoracion = fiesta.decoracion?.items?.reduce((sum, item) => sum + (item.estimatedCost || 0), 0) || 0;
    if (costoDecoracion > 0) costosDetalle.push({ id: 'decoracion', fecha: fechaEvento, concepto: 'Costo total Decoración', categoria: 'Decoración', monto: costoDecoracion });

    fiesta.gestionCostos?.costosItems?.forEach(costo => {
        costosDetalle.push({ id: `manual-${costo.id}`, fecha: fechaEvento, concepto: costo.nombre, categoria: costo.categoria, monto: costo.montoEstimado });
    });

    return { costosDetalle, ingresosDetalle };
}


export async function getEventFinancialSummary(): Promise<{ success: boolean; data?: EventFinancialSummaryData; error?: string }> {
  try {
    const fiesta = await getFiestaActual();
    if (!fiesta) {
        return { success: false, error: 'No se encontró un evento activo.' };
    }
    if (!fiesta.configuracion.fechaEvento) {
        return { success: false, error: 'El evento no tiene una fecha definida.' };
    }
    
    const { costosDetalle, ingresosDetalle } = await getEventData(fiesta);

    const totalIngresos = ingresosDetalle.reduce((sum, item) => sum + item.monto, 0);
    const totalCostos = costosDetalle.reduce((sum, item) => sum + item.monto, 0);
    const gananciaNeta = totalIngresos - totalCostos;
    const margen = totalIngresos > 0 ? (gananciaNeta / totalIngresos) * 100 : 0;
    
    return {
      success: true,
      data: {
        nombreEvento: fiesta.configuracion.nombreEvento,
        fechaEvento: fiesta.configuracion.fechaEvento,
        ingresos: { total: totalIngresos, detalle: ingresosDetalle },
        costos: { total: totalCostos, detalle: costosDetalle },
        gananciaNeta,
        margen,
      },
    };

  } catch (error: any) {
    console.error("Error calculating event financial summary:", error);
    return { success: false, error: 'Failed to calculate event financial summary.' };
  }
}
