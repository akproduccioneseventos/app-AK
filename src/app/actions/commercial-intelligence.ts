'use server';

import { getCrmLeads } from '@/app/actions/crm';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getNotifications } from '@/app/actions/notifications';
import { createNotification } from '@/lib/notifications/create-notification';
import { saveAgentLearning } from '@/lib/multiagent/memory-store';
import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';
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
  return `Hola ${name}, ¿cómo estás? Te escribo de AK Producciones para seguir con la organización de tu fiesta. ${reason} Si querés, coordinamos una entrevista sin costo y revisamos juntos las opciones.`;
}

function messageForBudget(name: string, eventType?: string) {
  const tipo = eventType ? ` para ${eventType}` : '';
  return `Hola ${name}, ¿cómo estás? Te escribo por el presupuesto${tipo} que vimos con AK Producciones. Quería saber si pudiste revisarlo y si querés que coordinemos una entrevista para ajustar detalles y asegurar la fecha.`;
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
    title: 'Revisión comercial automática',
    content: `Se detectaron ${result.data.length} seguimiento(s) comerciales, se crearon ${created} aviso(s) y se evitaron ${skipped} repetido(s).`,
    tags: ['crm', 'seguimiento', 'comercial'],
    source: 'system',
    confidence: 'high',
  }).catch(() => null);

  return { success: true, created, skipped, total: result.data.length };
}

export async function generateAiCommercialFollowup(params: {
  name: string;
  source: 'crm' | 'presupuesto';
  reason: string;
  eventType?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const model = getGeminiModelForAgent('comercial');
    const prompt = `Sos el Agente Vendedor de AK Producciones (Salto, Uruguay).
Escribí un mensaje de WhatsApp para seguimiento comercial 100% personalizado y persuasivo para:
- Cliente / Prospecto: ${params.name}
- Tipo de contacto: ${params.source === 'crm' ? 'Lead / Consulta CRM' : 'Presupuesto enviado'}
- Tipo de evento: ${params.eventType || 'Evento / Fiesta'}
- Situación: ${params.reason}

Reglas:
- Español rioplatense (uruguayo: vos, che, mirá, etc.), cálido y profesional.
- Aplicá neuroventas: no presiones, mostrá interés genuino en ayudarlos a que su fiesta sea perfecta y reducirles el estrés.
- Incluí un llamado a la acción claro para coordinar una llamada o reunión sin costo.
- Formato: Solo el texto final para WhatsApp (con 1 o 2 emojis pertinentes), sin saludos robóticos ni comillas.`;

    const result = await generateWithGeminiFallback({
      model,
      prompt,
    });

    return {
      success: true,
      message: result.text.trim(),
    };
  } catch (error: any) {
    console.error('Error generando mensaje con IA:', error);
    return {
      success: false,
      message: params.source === 'crm'
        ? messageForLead(params.name, params.reason)
        : messageForBudget(params.name, params.eventType),
    };
  }
}

