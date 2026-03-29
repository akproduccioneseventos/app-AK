'use server';

import { getInvoices } from './invoices';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { getMenuById } from './menus-catering';
import { getEmpleados } from './empleados';
import { getRoles } from './roles';
import { getGastosGenerales } from './gastos'; 
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

/**
 * CONSOLIDADOR FINANCIERO GLOBAL: Calcula P&L sumando TODAS las fiestas y gastos generales.
 */
export async function getProfitAndLossData(range: DateRange): Promise<{ success: boolean; data?: ProfitAndLossData; error?: string }> {
  try {
    const { from, to } = range;

    // 1. CÁLCULO DE INGRESOS (PAGOS REALES RECIBIDOS)
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
            concepto: `Pago Factura #${invoice.invoiceNumber} (Cliente: ${invoice.customer?.name || invoice.customer?.companyName || 'Sin cliente'})`,
            monto: payment.amount,
          });
          totalIngresos += payment.amount;
        }
      });
    });

    // 2. CÁLCULO DE COSTOS GLOBALES
    const [fiestas, empleados, roles, gastosGenerales] = await Promise.all([
      getAllFiestas(),
      getEmpleados(),
      getRoles(),
      getGastosGenerales() 
    ]);

    const costosDetalle: CostoDetalle[] = [];
    let totalCostos = 0;
    
    // 2.1 Gastos Generales de Empresa
    gastosGenerales.forEach(gasto => {
        const gastoDate = new Date(gasto.fecha);
        if (gastoDate >= from && gastoDate <= to) {
            costosDetalle.push({
                id: gasto.id,
                fecha: gasto.fecha,
                concepto: gasto.concepto,
                categoria: gasto.categoria,
                monto: gasto.monto,
            });
            totalCostos += gasto.monto;
        }
    });

    // 2.2 Costos por Fiesta (Sincronización Inteligente)
    for (const fiesta of fiestas) {
      if (!fiesta.configuracion.fechaEvento) continue;
      const fiestaDate = new Date(fiesta.configuracion.fechaEvento);
      
      if (fiestaDate >= from && fiestaDate <= to) {
          // Si existen pagos registrados a proveedores, usamos la realidad
          if (fiesta.pagosProveedores && fiesta.pagosProveedores.length > 0) {
              fiesta.pagosProveedores.forEach(pago => {
                  const pagoDate = new Date(pago.fecha);
                  if (pagoDate >= from && pagoDate <= to) {
                      const concepto = fiesta.gestionCostos?.costosItems?.find(c => c.id === pago.costoAsociadoId)?.nombre || 'Pago Proveedor';
                      costosDetalle.push({ 
                          id: `pago-${pago.id}`, 
                          fecha: pago.fecha, 
                          concepto: `${concepto} (${fiesta.configuracion.nombreEvento})`, 
                          categoria: 'Egresos Reales', 
                          monto: pago.monto 
                      });
                      totalCostos += pago.monto;
                  }
              });
          } else {
              // Fallback a PROYECCIÓN si no hay pagos reales todavía
              const otros = fiesta.gestionCostos?.others || {};
              const proyCatering = otros.totalCateringCost || 0;
              const proyBebidas = otros.totalBebidasCost || 0;
              const proyReposteria = otros.totalReposteriaCost || 0;
              const proyProveedores = otros.totalProveedorCost || 0;

              if (proyCatering > 0) {
                  costosDetalle.push({ id: `proy-cat-${fiesta.id}`, fecha: fiesta.configuracion.fechaEvento, concepto: `Proyección Catering: ${fiesta.configuracion.nombreEvento}`, categoria: 'Catering (Proyectado)', monto: proyCatering });
                  totalCostos += proyCatering;
              }
              if (proyBebidas > 0) {
                  costosDetalle.push({ id: `proy-beb-${fiesta.id}`, fecha: fiesta.configuracion.fechaEvento, concepto: `Proyección Bebidas: ${fiesta.configuracion.nombreEvento}`, categoria: 'Bebidas (Proyectado)', monto: proyBebidas });
                  totalCostos += proyBebidas;
              }
              if (proyProveedores > 0) {
                  costosDetalle.push({ id: `proy-prov-${fiesta.id}`, fecha: fiesta.configuracion.fechaEvento, concepto: `Proyección Proveedores: ${fiesta.configuracion.nombreEvento}`, categoria: 'Proveedores (Proyectado)', monto: proyProveedores });
                  totalCostos += proyProveedores;
              }
          }

          // Costos de Personal (Sueldos + Aportes)
          fiesta.personalAsignado?.forEach(pa => {
              const rol = roles.find(r => r.id === pa.rolId);
              const sueldo = pa.eventSalary || rol?.sueldoPorEvento || 0;
              const aportes = (sueldo * (rol?.porcentajeAportesPatronales || 0)) / 100;
              const costoNómina = sueldo + aportes;
              
              if (costoNómina > 0) {
                  costosDetalle.push({ 
                      id: `pers-${pa.empleadoId || 'vac'}-${fiesta.id}`, 
                      fecha: fiesta.configuracion.fechaEvento!, 
                      concepto: `Nómina: ${rol?.nombre || 'Personal'} (${fiesta.configuracion.nombreEvento})`, 
                      categoria: 'Personal', 
                      monto: costoNómina 
                  });
                  totalCostos += costoNómina;
              }
          });
      }
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
    console.error("Error calculating global P&L:", error);
    return { success: false, error: 'Fallo al consolidar el reporte contable global.' };
  }
}
