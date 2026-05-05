'use server';

import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';
import { createNotification, getNotifications } from '@/app/actions/notifications';
import { saveAgentLearning } from '@/lib/multiagent/memory-store';

export interface SmartAutomationResult {
  id: string;
  title: string;
  description: string;
  created: boolean;
  href?: string;
}

const RECENT_NOTIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

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

function daysSince(date: Date) {
  return Math.max(0, -daysUntil(date));
}

function hasText(value?: unknown) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function hasArray(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function hasObjectData(value: unknown) {
  return Boolean(value && typeof value === 'object' && JSON.stringify(value).length > 30);
}

function hasMenuMesaData(menuMesa: any) {
  return Boolean(menuMesa && (
    hasText(menuMesa.entrada)
    || hasText(menuMesa.platoPrincipal)
    || hasText(menuMesa.adolescentes)
    || hasText(menuMesa.postres)
    || hasText(menuMesa.bebidas)
    || hasText(menuMesa.titulo)
  ));
}

function hasPortalMenuData(menuSeleccionPortal: any) {
  return Boolean(menuSeleccionPortal && (
    hasText(menuSeleccionPortal.entrada)
    || hasText(menuSeleccionPortal.principal)
    || hasText(menuSeleccionPortal.postre)
    || hasText(menuSeleccionPortal.bebidas)
    || hasText(menuSeleccionPortal.restriccionesAlimentarias)
    || menuSeleccionPortal.confirmado === true
  ));
}

function hasFoodCategoryData(value: any) {
  return Array.isArray(value?.categorias)
    && value.categorias.some((category: any) => category?.activada === true || hasArray(category?.items));
}

function hasMenuData(fiesta: any) {
  return hasText(fiesta?.menuAsignadoId)
    || hasMenuMesaData(fiesta?.menuMesa)
    || hasPortalMenuData(fiesta?.menuSeleccionPortal)
    || hasFoodCategoryData(fiesta?.bebidas)
    || hasFoodCategoryData(fiesta?.reposteria)
    || hasObjectData(fiesta?.cartaTragos)
    || hasObjectData(fiesta?.catering)
    || hasObjectData(fiesta?.menu);
}

function hasGuestData(fiesta: any) {
  const invitados = fiesta?.invitados || fiesta?.guestList || [];
  return Array.isArray(invitados) && invitados.length > 0;
}

function isRecentDuplicate(notifications: any[], input: { id: string; title: string; message: string; href: string }) {
  const cutoff = Date.now() - RECENT_NOTIFICATION_WINDOW_MS;
  return notifications.some(notification => {
    const date = new Date(notification.fecha).getTime();
    if (!date || date < cutoff) return false;
    return notification.entidadRelacionadaId === input.id
      || (
        notification.href === input.href
        && (notification.titulo === input.title || notification.mensaje === input.message)
      );
  });
}

async function notifyOnce(input: {
  id: string;
  title: string;
  message: string;
  href: string;
  icono?: string;
  tipo?: 'info' | 'aviso' | 'urgente' | 'exito';
}) {
  const existing = await getNotifications().catch(() => []);
  if (isRecentDuplicate(existing, input)) return false;

  const result = await createNotification({
    titulo: input.title,
    mensaje: input.message,
    tipo: input.tipo ?? 'aviso',
    href: input.href,
    icono: input.icono ?? 'BellRing',
    entidadRelacionadaId: input.id,
    rolDestino: 'admin',
  });
  return result.success;
}

export async function runSmartAutomations(): Promise<{ success: boolean; results: SmartAutomationResult[]; created: number }> {
  const [fiestas, presupuestos, leads] = await Promise.all([
    getAllFiestas().catch(() => []),
    getPresupuestos().catch(() => []),
    getCrmLeads().catch(() => []),
  ]);

  const results: SmartAutomationResult[] = [];

  for (const pres of presupuestos as any[]) {
    if (pres.estado !== 'Enviado') continue;
    const created = toDate(pres.timestamp);
    if (!created) continue;
    const age = daysSince(created);
    if (age >= 2) {
      const title = `Seguimiento de presupuesto: ${pres.clienteNombre || 'Cliente'}`;
      const message = `Hace ${age} día(s) que el presupuesto está enviado. Conviene hacer seguimiento comercial.`;
      const href = `/presupuestos/${pres.id}/ver`;
      const ok = await notifyOnce({ id: `auto_budget_${pres.id}`, title, message, href, icono: 'ClipboardList' });
      results.push({ id: `budget_${pres.id}`, title, description: message, href, created: ok });
    }
  }

  for (const lead of leads as any[]) {
    const followUp = toDate(lead.followUpDate);
    if (!followUp) continue;
    const d = daysUntil(followUp);
    if (d <= 0) {
      const title = `Seguimiento comercial: ${lead.name || 'Prospecto'}`;
      const message = d < 0 ? 'Tiene seguimiento pendiente. Conviene contactarlo hoy.' : 'Tiene seguimiento para hoy.';
      const ok = await notifyOnce({ id: `auto_lead_${lead.id}`, title, message, href: '/contabilidad/crm', icono: 'PhoneCall' });
      results.push({ id: `lead_${lead.id}`, title, description: message, href: '/contabilidad/crm', created: ok });
    }
  }

  for (const fiesta of fiestas as any[]) {
    const eventDate = toDate(fiesta?.configuracion?.fechaEvento);
    if (!eventDate) continue;
    const d = daysUntil(eventDate);
    if (d < 0) continue;

    const eventName = fiesta?.configuracion?.nombreEvento || 'Fiesta sin nombre';

    if (d <= 30 && !hasMenuData(fiesta)) {
      const title = `Menú a revisar: ${eventName}`;
      const message = `Faltan ${d} día(s). Conviene revisar o confirmar el menú/catering.`;
      const href = `/fiestas/nueva/catering?fiestaId=${fiesta.id}`;
      const ok = await notifyOnce({ id: `auto_menu_${fiesta.id}`, title, message, href, icono: 'ChefHat', tipo: d <= 7 ? 'urgente' : 'aviso' });
      results.push({ id: `menu_${fiesta.id}`, title, description: message, href, created: ok });
    }

    if (d <= 7 && !hasGuestData(fiesta)) {
      const title = `Invitados a revisar: ${eventName}`;
      const message = `Faltan ${d} día(s). La lista de invitados no parece cargada o confirmada.`;
      const href = `/fiestas/nueva/invitados?fiestaId=${fiesta.id}`;
      const ok = await notifyOnce({ id: `auto_guests_${fiesta.id}`, title, message, href, icono: 'Users', tipo: 'urgente' });
      results.push({ id: `guests_${fiesta.id}`, title, description: message, href, created: ok });
    }

    const pendingSoon = (fiesta.tareas || []).filter((t: any) => {
      if (t.completada) return false;
      const due = toDate(t.fechaLimite);
      return due && daysUntil(due) <= 2;
    });

    if (pendingSoon.length > 0) {
      const title = `Tareas próximas: ${eventName}`;
      const message = `Hay ${pendingSoon.length} tarea(s) con fecha cercana para revisar.`;
      const href = `/fiestas/nueva/tareas?fiestaId=${fiesta.id}`;
      const ok = await notifyOnce({ id: `auto_tasks_${fiesta.id}`, title, message, href, icono: 'ListChecks', tipo: 'aviso' });
      results.push({ id: `tasks_${fiesta.id}`, title, description: message, href, created: ok });
    }
  }

  const created = results.filter(item => item.created).length;

  if (results.length > 0) {
    await saveAgentLearning({
      agentType: 'secretaria',
      title: 'Revisión automática ejecutada',
      content: `Se detectaron ${results.length} prioridad(es) y se crearon ${created} aviso(s).`,
      tags: ['automatizacion', 'control-tower'],
      source: 'system',
      confidence: 'high',
    }).catch(() => null);
  }

  return { success: true, results, created };
}
