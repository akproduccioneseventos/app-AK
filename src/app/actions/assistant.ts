'use server';

import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { getDashboardKpiData } from './dashboard';
import { getAllFiestas } from './fiesta/fiesta.actions';
import { getPresupuestos } from './presupuestos';
import { getInvoices } from './invoices';
import { format, addDays, startOfToday, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

function buildContext(
  kpiData: any,
  fiestas: any[],
  presupuestos: any[],
  invoices: any[]
): string {
  const today = startOfToday();
  const now = new Date();
  const fechaActual = format(now, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });

  const lines: string[] = [`Fecha y hora actual: ${fechaActual}`];

  // Próximo evento
  if (kpiData?.proximoEvento) {
    const { nombre, fecha } = kpiData.proximoEvento;
    const fechaEvento = format(new Date(fecha), "d 'de' MMMM yyyy", { locale: es });
    lines.push(`\nPRÓXIMO EVENTO: ${nombre} — ${fechaEvento}`);
  } else {
    lines.push('\nPRÓXIMO EVENTO: No hay eventos programados próximamente.');
  }

  // KPIs del negocio
  if (kpiData) {
    lines.push(`\nKPIs DEL NEGOCIO:`);
    lines.push(`- Eventos futuros: ${kpiData.fiestasFuturas ?? 0}`);
    lines.push(`- Clientes activos: ${kpiData.clientesActivos ?? 0}`);
    lines.push(`- Ventas totales: $${(kpiData.ventasTotales ?? 0).toLocaleString('es-UY')}`);
    lines.push(`- Total cobrado: $${(kpiData.montoPagado ?? 0).toLocaleString('es-UY')}`);
    lines.push(`- Total pendiente de cobro: $${(kpiData.totalPendiente ?? 0).toLocaleString('es-UY')}`);
    lines.push(`- Presupuestos pendientes de respuesta: ${kpiData.presupuestosPendientes ?? 0}`);
    lines.push(`- Facturas que vencen en 7 días: ${kpiData.facturasPorVencer ?? 0}`);
  }

  // Próximas fiestas
  const fiestasFuturas = fiestas
    .filter(f => f.configuracion?.fechaEvento && new Date(f.configuracion.fechaEvento) >= today)
    .sort((a, b) => new Date(a.configuracion.fechaEvento).getTime() - new Date(b.configuracion.fechaEvento).getTime())
    .slice(0, 5);

  if (fiestasFuturas.length > 0) {
    lines.push('\nPRÓXIMAS FIESTAS:');
    fiestasFuturas.forEach(f => {
      const fecha = format(new Date(f.configuracion.fechaEvento), "d MMM yyyy", { locale: es });
      const nombre = f.configuracion.nombreEvento || 'Sin nombre';
      const tipo = f.configuracion.tipoEvento || '';
      const invitados = f.configuracion.cantidadInvitados || 0;
      lines.push(`- ${nombre} (${tipo}) — ${fecha} — ${invitados} invitados`);
    });
  }

  // Presupuestos recientes
  const presupuestosPendientes = presupuestos.filter(p => p.estado === 'Enviado' || p.estado === 'Borrador');
  const presupuestosAceptados = presupuestos.filter(p => p.estado === 'Aceptado');
  if (presupuestos.length > 0) {
    lines.push('\nPRESUPUESTOS:');
    lines.push(`- Pendientes/Enviados: ${presupuestosPendientes.length}`);
    lines.push(`- Aceptados: ${presupuestosAceptados.length}`);
    const totalPresupuestado = presupuestos.reduce((sum, p) => sum + (p.totalConDescuento || p.costoTotalEstimado || 0), 0);
    lines.push(`- Valor total presupuestado: $${totalPresupuestado.toLocaleString('es-UY')}`);
    const recientes = presupuestosPendientesRecent(presupuestosPendientes).slice(0, 3);
    if (recientes.length > 0) {
      lines.push('- Presupuestos pendientes recientes:');
      recientes.forEach(p => {
        const monto = (p.totalConDescuento || p.costoTotalEstimado || 0).toLocaleString('es-UY');
        lines.push(`  · ${p.nombreEvento || p.id} — $${monto} (${p.estado})`);
      });
    }
  }

  // Facturas pendientes/vencidas
  const facturasPendientes = invoices.filter(inv => inv.status === 'Sent' || inv.status === 'Overdue');
  const facturasVencidas = invoices.filter(inv => inv.status !== 'Paid' && inv.dueDate && isBefore(new Date(inv.dueDate), today));
  if (invoices.length > 0) {
    lines.push('\nFACTURAS:');
    lines.push(`- Pendientes de pago: ${facturasPendientes.length}`);
    lines.push(`- Vencidas: ${facturasVencidas.length}`);
    const totalPendienteFacturas = facturasPendientes.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    lines.push(`- Monto pendiente total: $${totalPendienteFacturas.toLocaleString('es-UY')}`);
  }

  // Alertas activas
  if (kpiData?.alerts && kpiData.alerts.length > 0) {
    lines.push('\nALERTAS ACTIVAS:');
    kpiData.alerts.slice(0, 5).forEach((a: any) => {
      lines.push(`- [${a.severity === 'high' ? 'URGENTE' : 'AVISO'}] ${a.title}: ${a.description}`);
    });
  }

  return lines.join('\n');
}

function presupuestosPendientesRecent(presupuestos: any[]) {
  return [...presupuestos].sort((a, b) => {
    const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
    const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
    return dateB - dateA;
  });
}

export async function sendAssistantMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const [kpiResult, fiestas, presupuestos, invoices] = await Promise.all([
      getDashboardKpiData(),
      getAllFiestas(),
      getPresupuestos(),
      getInvoices(),
    ]);

    const kpiData = kpiResult.success ? kpiResult.data : null;
    const context = buildContext(kpiData, fiestas, presupuestos, invoices);

    const result = await chatWithAssistant({ message, history, context });
    return { success: true, response: result.response };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al procesar el mensaje' };
  }
}
