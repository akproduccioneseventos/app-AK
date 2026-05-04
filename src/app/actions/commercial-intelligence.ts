'use server';

import { getCrmLeads } from '@/app/actions/crm';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { createNotification } from '@/app/actions/notifications';
import { saveAgentLearning } from '@/lib/multiagent/memory-store';

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
  return `Hola ${name}, ¿cómo estás? Te escribo de AK Producciones para seguir con la organización de tu fiesta. ${reason} Si querés, coordinamos una entrevista sin costo y revisamos juntos las opciones.`;
}

function messageForBudget(name: string, eventType?: string) {
  const tipo = eventType ? ` para ${eventType}` : '';
  return `Hola ${name}, ¿cómo estás? Te escribo por el presupuesto${tipo} que vimos con AK Producciones. Quería saber si pudiste revisarlo y si querés que coordinemos una entrevista para ajustar detalles y asegurar la fecha.`;
}

export async function getCommercialFollowups(): Promise<{ success: boolean; data: CommercialFollowupItem[] }> {
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
        const reason = d < 0 ? 'Tenía seguimiento pendiente.' : d === 0 ? 'Hoy figura como fecha de seguimiento.' : `Tiene seguimiento en ${d} día(s).`;
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
      const reason = `Hace ${age} día(s) que está cargado y no tiene seguimiento agendado.`;
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
      const reason = `Presupuesto enviado hace ${age} día(s). Conviene hacer seguimiento.`;
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
  const result = await getCommercialFollowups();
  let created = 0;

  for (const item of result.data.slice(0, 12)) {
    const response = await createNotification({
      titulo: `Seguimiento comercial: ${item.name}`,
      mensaje: item.reason,
      tipo: item.priority === 'alta' ? 'urgente' : 'aviso',
      href: item.href,
      icono: 'PhoneCall',
      entidadRelacionadaId: item.id,
      rolDestino: 'admin',
    }).catch(() => null);
    if (response?.success) created++;
  }

  await saveAgentLearning({
    agentType: 'comercial',
    module: 'comercial',
    title: 'Revisión comercial automática',
    content: `Se detectaron ${result.data.length} seguimiento(s) comerciales y se crearon ${created} aviso(s).`,
    tags: ['crm', 'seguimiento', 'comercial'],
    source: 'system',
    confidence: 'high',
  }).catch(() => null);

  return { success: true, created, total: result.data.length };
}
