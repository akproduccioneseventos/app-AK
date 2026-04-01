'use server';

import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { getRoles } from './roles';
import { subMonths, format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';

export interface MonthlyProfitabilityData {
  month: string;
  ingresos: number;
  costos: number;
  rentabilidad: number;
}

export interface ConversionData {
  name: string;
  value: number;
  fill: string;
}

export interface TopServiceData {
  nombre: string;
  totalVentas: number;
  cantidadVentas: number;
  categoria: string;
}

export interface AnalyticsKpis {
  totalEventosRealizados: number;
  valorPromedioEvento: number;
  tasaConversion: number;
  rentabilidadNeta: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKpis;
  monthlyProfitability: MonthlyProfitabilityData[];
  conversionFunnel: ConversionData[];
  topServices: TopServiceData[];
}

export async function getAnalyticsData(): Promise<{ success: boolean; data?: AnalyticsData; error?: string }> {
  try {
    const [presupuestosData, invoicesData, fiestasData, rolesData] = await Promise.all([
      getPresupuestos(),
      getInvoices(),
      getAllFiestas(),
      getRoles(),
    ]);

    const now = new Date();
    const today = startOfToday();

    // ─── Monthly Profitability (last 12 months) ───────────────────────────────
    const monthlyMap = new Map<string, { ingresos: number; costos: number }>();
    for (let i = 11; i >= 0; i--) {
      const key = format(subMonths(now, i), 'MMM yyyy', { locale: es });
      monthlyMap.set(key, { ingresos: 0, costos: 0 });
    }

    // Revenue from invoices (by issue date)
    invoicesData.forEach(inv => {
      const key = format(new Date(inv.issueDate), 'MMM yyyy', { locale: es });
      const entry = monthlyMap.get(key);
      if (entry) entry.ingresos += inv.totalAmount;
    });

    // Revenue from accepted presupuestos not yet invoiced (by event date)
    const invoicedPresupuestoIds = new Set(presupuestosData.filter(p => p.invoiceId).map(p => p.id));
    presupuestosData.forEach(pres => {
      if (pres.estado === 'Borrador' || pres.estado === 'Rechazado') return;
      if (invoicedPresupuestoIds.has(pres.id)) return;
      if (!pres.eventoFecha) return;
      const key = format(new Date(pres.eventoFecha), 'MMM yyyy', { locale: es });
      const entry = monthlyMap.get(key);
      if (entry) entry.ingresos += pres.totalConDescuento || pres.costoTotalEstimado || 0;
    });

    // Costs from fiestas (gestionCostos + pagosProveedores + staff salaries)
    fiestasData.forEach(fiesta => {
      if (!fiesta.configuracion?.fechaEvento) return;
      const key = format(new Date(fiesta.configuracion.fechaEvento), 'MMM yyyy', { locale: es });
      const entry = monthlyMap.get(key);
      if (!entry) return;

      // Manual cost items
      const costoItems = fiesta.gestionCostos?.costosItems?.reduce((s, item) => s + (item.montoEstimado || 0), 0) || 0;

      // Staff salary costs (eventSalary + employer contributions)
      let staffCosts = 0;
      fiesta.personalAsignado?.forEach(pa => {
        const rol = rolesData.find(r => r.id === pa.rolId);
        const contributions = (pa.eventSalary * (rol?.porcentajeAportesPatronales || 0)) / 100;
        staffCosts += pa.eventSalary + contributions;
      });

      entry.costos += costoItems + staffCosts;
    });

    const monthlyProfitability: MonthlyProfitabilityData[] = Array.from(monthlyMap.entries()).map(
      ([month, { ingresos, costos }]) => ({
        month,
        ingresos: Math.round(ingresos),
        costos: Math.round(costos),
        rentabilidad: Math.round(ingresos - costos),
      })
    );

    // ─── Conversion Funnel ────────────────────────────────────────────────────
    const total = presupuestosData.filter(p => p.estado !== 'Borrador').length;
    const aceptados = presupuestosData.filter(p => p.estado === 'Aceptado' || p.estado === 'Facturado').length;
    const enviados = presupuestosData.filter(p => p.estado === 'Enviado').length;
    const rechazados = presupuestosData.filter(p => p.estado === 'Rechazado').length;

    const conversionFunnel: ConversionData[] = [
      { name: 'Enviados', value: total, fill: 'hsl(var(--chart-1))' },
      { name: 'En Negociación', value: enviados, fill: 'hsl(var(--chart-3))' },
      { name: 'Contratados', value: aceptados, fill: 'hsl(var(--chart-2))' },
      { name: 'Rechazados', value: rechazados, fill: 'hsl(var(--chart-5))' },
    ];

    // ─── Top-Selling Services ─────────────────────────────────────────────────
    const serviceMap = new Map<string, { totalVentas: number; cantidadVentas: number; categoria: string }>();

    presupuestosData.forEach(pres => {
      if (pres.estado === 'Borrador') return;
      pres.itemsPresupuestados?.forEach(item => {
        if (item.esRegalo) return;
        const key = item.nombreServicio || 'Sin nombre';
        const existing = serviceMap.get(key);
        if (existing) {
          existing.totalVentas += item.costoTotalItem || 0;
          existing.cantidadVentas += 1;
        } else {
          serviceMap.set(key, {
            totalVentas: item.costoTotalItem || 0,
            cantidadVentas: 1,
            categoria: item.categoriaServicio || item.subcategoria || 'General',
          });
        }
      });
    });

    const topServices: TopServiceData[] = Array.from(serviceMap.entries())
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, 8);

    // ─── Summary KPIs ─────────────────────────────────────────────────────────
    const totalEventosRealizados = fiestasData.filter(
      f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) < today
    ).length;

    const totalRevenue = monthlyProfitability.reduce((s, m) => s + m.ingresos, 0);
    const totalCosts = monthlyProfitability.reduce((s, m) => s + m.costos, 0);
    const rentabilidadNeta = totalRevenue - totalCosts;

    const valorPromedioEvento =
      totalEventosRealizados > 0
        ? Math.round(totalRevenue / totalEventosRealizados)
        : 0;

    const tasaConversion = total > 0 ? Math.round((aceptados / total) * 100) : 0;

    const kpis: AnalyticsKpis = {
      totalEventosRealizados,
      valorPromedioEvento,
      tasaConversion,
      rentabilidadNeta,
    };

    return {
      success: true,
      data: { kpis, monthlyProfitability, conversionFunnel, topServices },
    };
  } catch (error: any) {
    console.error('Error fetching analytics data:', error);
    return { success: false, error: 'No se pudieron cargar los datos analíticos.' };
  }
}
