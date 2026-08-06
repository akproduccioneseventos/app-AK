'use server';

import { getCrmLeads } from '@/app/actions/crm';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getNotifications } from '@/app/actions/notifications';
import { createNotification } from '@/lib/notifications/create-notification';
import { saveAgentLearning } from '@/lib/multiagent/memory-store';
import type { Notificacion } from '@/types/fiesta';

export interface CommercialFollowupItem {
  id: string;
  name: string;
  source: 'crm' | 'presupuesto';
  status: string;
  priority: 'alta' | 'media' | 'normal';
  reason: string;
  href: string;
  suggestedMessage: string;
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

function messageForLead(name: string, reason: string) {
  return `Hola ${name}, Â¿cÃ³mo estÃ¡s? Te escribo de AK Producciones para seguir con la organizaciÃ³n de tu fiesta. ${reason} Si querÃ©s, coordinamos una entrevista sin costo y revisamos juntos las opciones.`;
}

function messageForBudget(name: string, eventType?: string) {
  const tipo = eventType ? ` para ${eventType}` : '';
  return `Hola ${name}, Â¿cÃ³mo estÃ¡s? Te escribo por el presupuesto${tipo} que vimos con AK Producciones. QuerÃ­a saber si pudiste revisarlo y si querÃ©s que coordinemos una entrevista para ajustar detalles y asegurar la fecha.`;
}

function isRecentDuplicate(notifications: Notificacion[], item: CommercialFollowupItem) {
  const cutoff = Date.now() - RECENT_NOTIFICATION_WINDOW_MS;
  const title = `Seguimiento comercial: ${item.name}`;
  return notifications.some(notification => {
    const date = new Date(notification.fecha).getTime();
    if (!date || date < cutoff) return false;
    return notification.entidadRelacionadaId === item.id
      || (
        notification.href === item.href
        && (notification.titulo === title || notification.mensaje === item.reason)
      );
  });
}

import { requireAppSession } from '@/lib/auth/require-session';

export async function getCommercialFollowups(): Promise<{ success: boolean; data: CommercialFollowupItem[] }> {
  await requireAppSession();
  const [leads, presupuestos] = await Promise.all([
    getCrmLeads().catch(() => []),
    getPresupuestos().catch(() => []),
  ]);

  const items: CommercialFollowupItem[] = [];

  for (const lead of leads as any[]) {
    const name = lead.name || 'Prospecto';
    const followUp = toDate(lead.followUpDate);
    const created = toDate(lead.createdAt || lead.createdDate || lead.timestamp);
    const stage = lead.stageId || lead.currentStageId || lead.status || 'Sin etapa';

    if (followUp) {
      const d = daysUntil(followUp);
      if (d <= 2) {
        const reason = d < 0 ? 'TenÃ­a seguimiento pendiente.' : d === 0 ? 'Hoy figura como fecha de seguimiento.' : `Tiene seguimiento en ${d} dÃ­a(s).`;
        items.push({
          id: `lead_${lead.id}`,
          name,
          source: 'crm',
          status: String(stage),
          priority: d <= 0 ? 'alta' : 'media',
          reason,
          href: '/contabilidad/crm',
          suggestedMessage: messageForLead(name, reason),
        });
      }
    } else if (created && daysSince(created) >= 3) {
      const age = daysSince(created);
      const reason = `Hace ${age} dÃ­a(s) que estÃ¡ cargado y no tiene seguimiento agendado.`;
      items.push({
        id: `lead_no_follow_${lead.id}`,
        name,
        source: 'crm',
        status: String(stage),
        priority: age >= 7 ? 'alta' : 'media',
        reason,
        href: '/contabilidad/crm',
        suggestedMessage: messageForLead(name, reason),
      });
    }
  }

  for (const pres of presupuestos as any[]) {
    if (pres.estado !== 'Enviado') continue;
    const created = toDate(pres.timestamp || pres.createdAt);
    const age = created ? daysSince(created) : 0;
    if (age >= 2) {
      const name = pres.clienteNombre || 'Cliente';
      const reason = `Presupuesto enviado hace ${age} dÃ­a(s). Conviene hacer seguimiento.`;
      items.push({
        id: `budget_${pres.id}`,
        name,
        source: 'presupuesto',
        status: pres.estado,
        priority: age >= 5 ? 'alta' : 'media',
        reason,
        href: `/presupuestos/${pres.id}/ver`,
        suggestedMessage: messageForBudget(name, pres.eventoTipo),
      });
    }
  }

  return {
    success: true,
    data: items.sort((a, b) => {
      const order = { alta: 3, media: 2, normal: 1 } as const;
      return order[b.priority] - order[a.priority];
    }),
  };
}

export async function createCommercialFollowupAlerts() {
  await requireAppSession();
  const result = await getCommercialFollowups();
  const existing: Notificacion[] = await getNotifications().catch((): Notificacion[] => []);
  let created = 0;
  let skipped = 0;

  for (const item of result.data.slice(0, 12)) {
    if (isRecentDuplicate(existing, item)) {
      skipped++;
      continue;
    }

    const response = await createNotification({
      titulo: `Seguimiento comercial: ${item.name}`,
      mensaje: item.reason,
      tipo: item.priority === 'alta' ? 'urgente' : 'aviso',
      href: item.href,
      icono: 'PhoneCall',
      entidadRelacionadaId: item.id,
      rolDestino: 'admin',
    }).catch(() => null);
    if (response?.success) {
      created++;
      if (response.notification) existing.unshift(response.notification);
    }
  }

  await saveAgentLearning({
    agentType: 'comercial',
    module: 'comercial',
    title: 'RevisiÃ³n comercial automÃ¡tica',
    content: `Se detectaron ${result.data.length} seguimiento(s) comerciales, se crearon ${created} aviso(s) y se evitaron ${skipped} repetido(s).`,
    tags: ['crm', 'seguimiento', 'comercial'],
    source: 'system',
    confidence: 'high',
  }).catch(() => null);

  return { success: true, created, skipped, total: result.data.length };
}
