'use server';

import { getDashboardKpiData } from '@/app/actions/dashboard';
import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';
import { getNotifications } from '@/app/actions/notifications';

export interface ControlTowerItem {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: 'alta' | 'media' | 'normal';
  area: 'fiesta' | 'comercial' | 'contable' | 'agenda' | 'sistema';
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function money(value: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

import { requireAppSession } from '@/lib/auth/require-session';

export async function getControlTowerData() {
  await requireAppSession();
  const [dashboardResult, fiestas, presupuestos, leads, notifications] = await Promise.all([
    getDashboardKpiData(),
    getAllFiestas().catch(() => []),
    getPresupuestos().catch(() => []),
    getCrmLeads().catch(() => []),
    getNotifications().catch(() => []),
  ]);

  const dashboard = (dashboardResult as any)?.success ? (dashboardResult as any).data : null;
  const items: ControlTowerItem[] = [];

  for (const fiesta of fiestas as any[]) {
    const eventDate = toDate(fiesta?.configuracion?.fechaEvento);
    const eventName = fiesta?.configuracion?.nombreEvento || 'Fiesta sin nombre';
    const d = eventDate ? daysUntil(eventDate) : null;

    if (eventDate && d !== null && d >= 0 && d <= 30) {
      const pendingTasks = (fiesta.tareas || []).filter((t: any) => !t.completada).length;
      items.push({
        id: `event_${fiesta.id}`,
        title: `${eventName} se acerca`,
        description: d === 0 ? `Es hoy. Tiene ${pendingTasks} pendiente(s) para revisar.` : `Faltan ${d} dÃ­a(s). Tiene ${pendingTasks} pendiente(s) para revisar.`,
        href: `/fiestas/nueva?fiestaId=${fiesta.id}`,
        priority: d <= 7 || pendingTasks >= 5 ? 'alta' : 'media',
        area: 'fiesta',
      });
    }

    for (const tarea of fiesta.tareas || []) {
      if (tarea.completada) continue;
      const due = toDate(tarea.fechaLimite);
      if (!due) continue;
      const dTask = daysUntil(due);
      if (dTask <= 7) {
        items.push({
          id: `task_${tarea.id}`,
          title: tarea.texto || 'Tarea pendiente',
          description: dTask < 0 ? `PasÃ³ la fecha indicada. Fiesta: ${eventName}.` : dTask === 0 ? `Para hoy. Fiesta: ${eventName}.` : `Para dentro de ${dTask} dÃ­a(s). Fiesta: ${eventName}.`,
          href: `/fiestas/nueva/tareas?fiestaId=${fiesta.id}`,
          priority: dTask <= 1 ? 'alta' : 'media',
          area: 'agenda',
        });
      }
    }
  }

  for (const lead of leads as any[]) {
    const followUp = toDate(lead.followUpDate);
    if (!followUp) continue;
    const d = daysUntil(followUp);
    if (d <= 2) {
      items.push({
        id: `lead_${lead.id}`,
        title: `Seguimiento comercial: ${lead.name || 'prospecto'}`,
        description: d < 0 ? 'Tiene seguimiento pendiente.' : d === 0 ? 'Seguimiento para hoy.' : `Seguimiento en ${d} dÃ­a(s).`,
        href: '/contabilidad/crm',
        priority: d <= 0 ? 'alta' : 'media',
        area: 'comercial',
      });
    }
  }

  for (const pres of presupuestos as any[]) {
    if (pres.estado !== 'Enviado') continue;
    const created = toDate(pres.timestamp);
    const age = created ? Math.max(0, -daysUntil(created)) : 0;
    if (age >= 2) {
      items.push({
        id: `budget_${pres.id}`,
        title: `Presupuesto para revisar: ${pres.clienteNombre || 'Cliente'}`,
        description: `Hace ${age} dÃ­a(s) que estÃ¡ enviado. Conviene hacer seguimiento.`,
        href: `/presupuestos/${pres.id}/ver`,
        priority: age >= 5 ? 'alta' : 'media',
        area: 'comercial',
      });
    }
  }

  const unreadNotifications: ControlTowerItem[] = (notifications as any[])
    .filter(n => !n.leida)
    .slice(0, 6)
    .map(n => ({
      id: `notif_${n.id}`,
      title: n.titulo || 'NotificaciÃ³n pendiente',
      description: n.mensaje || 'Hay una notificaciÃ³n para revisar.',
      href: n.href || '/alertas',
      priority: n.tipo === 'urgente' ? 'alta' : 'normal',
      area: 'sistema',
    }));

  items.push(...unreadNotifications);

  const sortedItems = items.sort((a, b) => {
    const order = { alta: 3, media: 2, normal: 1 } as const;
    return order[b.priority] - order[a.priority];
  });

  return {
    success: true,
    data: {
      kpis: {
        fiestasFuturas: dashboard?.fiestasFuturas ?? 0,
        prospectosActivos: dashboard?.prospectosActivos ?? 0,
        presupuestosPendientes: dashboard?.presupuestosPendientes ?? 0,
        totalPendiente: money(dashboard?.totalPendiente ?? 0),
        notificacionesNoLeidas: dashboard?.notificacionesNoLeidas ?? 0,
        proximoEvento: dashboard?.proximoEvento ?? null,
      },
      items: sortedItems.slice(0, 18),
      priorityScore: sortedItems.reduce((score, item) => score + (item.priority === 'alta' ? 3 : item.priority === 'media' ? 2 : 1), 0),
      generatedAt: new Date().toISOString(),
    },
  };
}
