'use server';

import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { getRoles } from './roles';
import { getEmpleados } from './empleados';
import { subMonths, format, startOfToday, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { isFirmSalesInvoice } from '@/lib/commercial-flow/ledger-service';
import { isSimulatorBudget } from '@/lib/budget/formal-budget';

function isAcceptedBudget(status?: string) {
  return status === 'Aceptado' || status === 'Facturado';
}

function parseAnalyticsDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00-03:00`)
    : new Date(value);
}

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
  simulatorConversionRate: number;
  margenBrutoPromedio: number;
}

/** Profitability broken down by event type */
export interface EventTypeProfitabilityData {
  tipo: string;
  ingresos: number;
  costos: number;
  margenBruto: number;
  margenNeto: number;
  cantidad: number;
}

/** Bottleneck alert surfaced from operational data */
export interface BottleneckAlert {
  id: string;
  tipo: 'presupuesto_tardio' | 'tarea_vencida' | 'proveedor_sin_confirmar' | 'evento_sin_presupuesto';
  nivel: 'critico' | 'advertencia' | 'info';
  mensaje: string;
  detalle?: string;
  fiestaId?: string;
  dias?: number;
}

/** Staff efficiency summary */
export interface StaffEfficiencyData {
  empleadoId: string;
  nombre: string;
  eventosAsignados: number;
  totalSalario: number;
  ingresosGenerados: number;
  eficiencia: number; // ratio ingresos / salario
}

export interface AnalyticsData {
  kpis: AnalyticsKpis;
  monthlyProfitability: MonthlyProfitabilityData[];
  conversionFunnel: ConversionData[];
  topServices: TopServiceData[];
  eventTypeProfitability: EventTypeProfitabilityData[];
  bottleneckAlerts: BottleneckAlert[];
  staffEfficiency: StaffEfficiencyData[];
}

export async function getAnalyticsData(): Promise<{ success: boolean; data?: AnalyticsData; error?: string }> {
  try {
    const [presupuestosData, invoicesData, fiestasData, rolesData, empleadosData] = await Promise.all([
      getPresupuestos(),
      getInvoices(),
      getAllFiestas(),
      getRoles(),
      getEmpleados(),
    ]);

    const now = new Date();
    const today = startOfToday();

    // â”€â”€â”€ Monthly Profitability (last 12 months) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const monthlyMap = new Map<string, { ingresos: number; costos: number }>();
    for (let i = 11; i >= 0; i--) {
      const key = format(subMonths(now, i), 'MMM yyyy', { locale: es });
      monthlyMap.set(key, { ingresos: 0, costos: 0 });
    }

    // Revenue from invoices (by issue date)
    invoicesData.filter(isFirmSalesInvoice).forEach(inv => {
      const key = format(parseAnalyticsDate(inv.issueDate), 'MMM yyyy', { locale: es });
      const entry = monthlyMap.get(key);
      if (entry) entry.ingresos += inv.totalAmount;
    });

    // Revenue from accepted presupuestos not yet invoiced (by event date)
    const invoicedPresupuestoIds = presupuestosData.reduce<Set<string>>((acc, p) => {
      if (p.invoiceId) acc.add(p.id);
      return acc;
    }, new Set());
    presupuestosData.forEach(pres => {
      if (!isAcceptedBudget(pres.estado)) return;
      if (invoicedPresupuestoIds.has(pres.id)) return;
      if (!pres.eventoFecha) return;
      const key = format(parseAnalyticsDate(pres.eventoFecha), 'MMM yyyy', { locale: es });
      const entry = monthlyMap.get(key);
      if (entry) entry.ingresos += pres.totalConDescuento || pres.costoTotalEstimado || 0;
    });

    // Costs from fiestas (gestionCostos + pagosProveedores + staff salaries)
    fiestasData.forEach(fiesta => {
      if (!fiesta.configuracion?.fechaEvento) return;
      const key = format(parseAnalyticsDate(fiesta.configuracion.fechaEvento), 'MMM yyyy', { locale: es });
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

    // â”€â”€â”€ Conversion Funnel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const total = presupuestosData.filter(p => p.estado !== 'Borrador').length;
    const aceptados = presupuestosData.filter(p => p.estado === 'Aceptado' || p.estado === 'Facturado').length;
    const enviados = presupuestosData.filter(p => p.estado === 'Enviado').length;
    const rechazados = presupuestosData.filter(p => p.estado === 'Rechazado').length;

    const conversionFunnel: ConversionData[] = [
      { name: 'Enviados', value: total, fill: 'hsl(var(--chart-1))' },
      { name: 'En NegociaciÃ³n', value: enviados, fill: 'hsl(var(--chart-3))' },
      { name: 'Contratados', value: aceptados, fill: 'hsl(var(--chart-2))' },
      { name: 'Rechazados', value: rechazados, fill: 'hsl(var(--chart-5))' },
    ];

    // â”€â”€â”€ Top-Selling Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const serviceMap = new Map<string, { totalVentas: number; cantidadVentas: number; categoria: string }>();

    presupuestosData.forEach(pres => {
      if (!isAcceptedBudget(pres.estado)) return;
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

    // â”€â”€â”€ Summary KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const totalEventosRealizados = fiestasData.filter(
      f => f.configuracion.fechaEvento && parseAnalyticsDate(f.configuracion.fechaEvento) < today
    ).length;

    const totalRevenue = monthlyProfitability.reduce((s, m) => s + m.ingresos, 0);
    const totalCosts = monthlyProfitability.reduce((s, m) => s + m.costos, 0);
    const rentabilidadNeta = totalRevenue - totalCosts;

    const valorPromedioEvento =
      totalEventosRealizados > 0
        ? Math.round(totalRevenue / totalEventosRealizados)
        : 0;

    const tasaConversion = total > 0 ? Math.round((aceptados / total) * 100) : 0;

    // â”€â”€â”€ Simulator Conversion Rate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const simulatorPresupuestos = presupuestosData.filter(p => isSimulatorBudget(p.source));
    const simulatorAceptados = simulatorPresupuestos.filter(
      p => p.estado === 'Aceptado' || p.estado === 'Facturado'
    ).length;
    const simulatorConversionRate =
      simulatorPresupuestos.length > 0
        ? Math.round((simulatorAceptados / simulatorPresupuestos.length) * 100)
        : 0;

    // â”€â”€â”€ Gross Margin Average â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const margenBrutoPromedio =
      totalRevenue > 0 ? Math.round(((totalRevenue - totalCosts) / totalRevenue) * 100) : 0;

    const kpis: AnalyticsKpis = {
      totalEventosRealizados,
      valorPromedioEvento,
      tasaConversion,
      rentabilidadNeta,
      simulatorConversionRate,
      margenBrutoPromedio,
    };

    // â”€â”€â”€ Profitability by Event Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const eventTypeMap = new Map<
      string,
      { ingresos: number; costos: number; cantidad: number }
    >();

    presupuestosData.forEach(pres => {
      if (!isAcceptedBudget(pres.estado)) return;
      const tipo = pres.eventoTipo || 'Otro';
      const revenue = pres.totalConDescuento || pres.costoTotalEstimado || 0;
      const existing = eventTypeMap.get(tipo);
      if (existing) {
        existing.ingresos += revenue;
        existing.cantidad += 1;
      } else {
        eventTypeMap.set(tipo, { ingresos: revenue, costos: 0, cantidad: 1 });
      }
    });

    fiestasData.forEach(fiesta => {
      const linkedPresupuesto = presupuestosData.find(p => p.id === fiesta.presupuestoId);
      const tipo = linkedPresupuesto?.eventoTipo || fiesta.configuracion?.tipoCelebracion || 'Otro';
      const costoItems =
        fiesta.gestionCostos?.costosItems?.reduce((s, item) => s + (item.montoEstimado || 0), 0) || 0;
      let staffCosts = 0;
      fiesta.personalAsignado?.forEach(pa => {
        const rol = rolesData.find(r => r.id === pa.rolId);
        const contributions = (pa.eventSalary * (rol?.porcentajeAportesPatronales || 0)) / 100;
        staffCosts += pa.eventSalary + contributions;
      });
      const entry = eventTypeMap.get(tipo);
      if (entry) entry.costos += costoItems + staffCosts;
    });

    const eventTypeProfitability: EventTypeProfitabilityData[] = Array.from(
      eventTypeMap.entries()
    ).map(([tipo, { ingresos, costos, cantidad }]) => {
      const margenBruto = ingresos > 0 ? Math.round(((ingresos - costos) / ingresos) * 100) : 0;
      const margenNeto = Math.round(ingresos - costos);
      return {
        tipo,
        ingresos: Math.round(ingresos),
        costos: Math.round(costos),
        margenBruto,
        margenNeto,
        cantidad,
      };
    }).sort((a, b) => b.ingresos - a.ingresos);

    // â”€â”€â”€ Bottleneck Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const bottleneckAlerts: BottleneckAlert[] = [];

    // 1. Budgets in "Borrador" older than 7 days â†’ late delivery
    presupuestosData.forEach(pres => {
      if (pres.estado !== 'Borrador') return;
      const age = differenceInDays(today, new Date(pres.timestamp));
      if (age >= 7) {
        bottleneckAlerts.push({
          id: `late-budget-${pres.id}`,
          tipo: 'presupuesto_tardio',
          nivel: age >= 14 ? 'critico' : 'advertencia',
          mensaje: `Presupuesto de "${pres.clienteNombre}" lleva ${age} dÃ­as como borrador`,
          detalle: `Tipo: ${pres.eventoTipo} Â· Creado el ${format(new Date(pres.timestamp), 'dd MMM yyyy', { locale: es })}`,
          dias: age,
        });
      }
    });

    // 2. Overdue tasks in upcoming events
    fiestasData.forEach(fiesta => {
      if (!fiesta.configuracion?.fechaEvento) return;
      const eventDate = parseAnalyticsDate(fiesta.configuracion.fechaEvento);
      if (eventDate < today) return; // Skip past events
      fiesta.tareas?.forEach(tarea => {
        if (tarea.completada || !tarea.fechaLimite) return;
        const daysOverdue = differenceInDays(today, parseAnalyticsDate(tarea.fechaLimite));
        if (daysOverdue > 0) {
          bottleneckAlerts.push({
            id: `overdue-task-${fiesta.id}-${tarea.id}`,
            tipo: 'tarea_vencida',
            nivel: daysOverdue >= 3 ? 'critico' : 'advertencia',
            mensaje: `Tarea vencida: "${tarea.texto}"`,
            detalle: `Evento: ${fiesta.configuracion.nombreEvento || fiesta.id} Â· Vencida hace ${daysOverdue} dÃ­a(s)`,
            fiestaId: fiesta.id,
            dias: daysOverdue,
          });
        }
      });
    });

    // 3. Events within 30 days with no linked budget
    fiestasData.forEach(fiesta => {
      if (!fiesta.configuracion?.fechaEvento) return;
      const eventDate = parseAnalyticsDate(fiesta.configuracion.fechaEvento);
      const daysUntil = differenceInDays(eventDate, today);
      if (daysUntil < 0 || daysUntil > 30) return;
      if (!fiesta.presupuestoId) {
        bottleneckAlerts.push({
          id: `no-budget-${fiesta.id}`,
          tipo: 'evento_sin_presupuesto',
          nivel: daysUntil <= 7 ? 'critico' : 'advertencia',
          mensaje: `Evento sin presupuesto en ${daysUntil} dÃ­a(s)`,
          detalle: `Evento: ${fiesta.configuracion.nombreEvento || fiesta.id}`,
          fiestaId: fiesta.id,
          dias: daysUntil,
        });
      }
    });

    // Sort alerts: crÃ­tico first, then by days
    bottleneckAlerts.sort((a, b) => {
      const levelOrder = { critico: 0, advertencia: 1, info: 2 };
      const levelDiff = levelOrder[a.nivel] - levelOrder[b.nivel];
      if (levelDiff !== 0) return levelDiff;
      return (b.dias || 0) - (a.dias || 0);
    });

    // â”€â”€â”€ Staff Efficiency â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const staffMap = new Map<
      string,
      { nombre: string; eventosAsignados: number; totalSalario: number; ingresosGenerados: number }
    >();

    fiestasData.forEach(fiesta => {
      // Find revenue for this event from its linked budget
      const linkedPresupuesto = presupuestosData.find(p => p.id === fiesta.presupuestoId);
      const eventRevenue = linkedPresupuesto && isAcceptedBudget(linkedPresupuesto.estado)
        ? linkedPresupuesto.totalConDescuento || linkedPresupuesto.costoTotalEstimado || 0
        : 0;

      fiesta.personalAsignado?.forEach(pa => {
        const empleado = empleadosData.find(e => e.id === pa.empleadoId);
        const nombre = empleado?.nombre || pa.empleadoId;
        const rol = rolesData.find(r => r.id === pa.rolId);
        const contributions = (pa.eventSalary * (rol?.porcentajeAportesPatronales || 0)) / 100;
        const totalSalario = pa.eventSalary + contributions;

        const existing = staffMap.get(pa.empleadoId);
        if (existing) {
          existing.eventosAsignados += 1;
          existing.totalSalario += totalSalario;
          existing.ingresosGenerados += eventRevenue;
        } else {
          staffMap.set(pa.empleadoId, {
            nombre,
            eventosAsignados: 1,
            totalSalario,
            ingresosGenerados: eventRevenue,
          });
        }
      });
    });

    const staffEfficiency: StaffEfficiencyData[] = Array.from(staffMap.entries())
      .map(([empleadoId, { nombre, eventosAsignados, totalSalario, ingresosGenerados }]) => ({
        empleadoId,
        nombre,
        eventosAsignados,
        totalSalario: Math.round(totalSalario),
        ingresosGenerados: Math.round(ingresosGenerados),
        eficiencia: totalSalario > 0 ? Math.round((ingresosGenerados / totalSalario) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.eficiencia - a.eficiencia)
      .slice(0, 10);

    return {
      success: true,
      data: {
        kpis,
        monthlyProfitability,
        conversionFunnel,
        topServices,
        eventTypeProfitability,
        bottleneckAlerts,
        staffEfficiency,
      },
    };
  } catch (error: any) {
    console.error('Error fetching analytics data:', error);
    return { success: false, error: 'No se pudieron cargar los datos analÃ­ticos.' };
  }
}
