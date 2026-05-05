import type { AkAgentType } from '@/types/multiagent';
import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';
import { getNotifications } from '@/app/actions/notifications';
import { calculateFiestaPreparationScore } from '@/lib/fiesta/preparation-score';
import { getCommercialFollowups } from '@/app/actions/commercial-intelligence';
import { getPostEventOpportunities } from '@/app/actions/post-event-intelligence';

export type AkAgentDiagnosticPriority = 'alta' | 'media' | 'normal';

export interface AkAgentDiagnosticItem {
  id: string;
  agentType: AkAgentType;
  title: string;
  detail: string;
  priority: AkAgentDiagnosticPriority;
  href: string;
  fiestaId?: string;
  learningHint?: string;
}

export interface AkAgentTeamBriefing {
  generatedAt: string;
  summary: string;
  items: AkAgentDiagnosticItem[];
  byAgent: Record<AkAgentType, AkAgentDiagnosticItem[]>;
}

const AGENT_TYPES: AkAgentType[] = ['secretaria', 'fiesta', 'fiestas_general', 'contable', 'marketing', 'comercial', 'central'];
const PRIORITY_ORDER: Record<AkAgentDiagnosticPriority, number> = { alta: 3, media: 2, normal: 1 };

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

function money(value: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function eventName(fiesta: any) {
  return fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.clienteNombre || fiesta?.nombreEvento || 'Fiesta sin nombre';
}

function eventHref(fiestaId: string | undefined, path = '/fiestas/nueva') {
  return fiestaId ? `${path}?fiestaId=${fiestaId}` : path;
}

function hasAssignedStaff(fiesta: any) {
  return Array.isArray(fiesta?.personalAsignado)
    && fiesta.personalAsignado.some((item: any) => String(item?.empleadoId || '').trim().length > 0);
}

function overduePaymentCount(fiesta: any) {
  const cuotas = fiesta?.planDePagos?.cuotas;
  if (!Array.isArray(cuotas)) return 0;
  return cuotas.filter((cuota: any) => {
    const status = String(cuota?.estado || '').toLowerCase();
    if (status === 'pagado' || status === 'completada') return false;
    const due = toDate(cuota?.fechaVencimiento);
    return due ? daysUntil(due) < 0 : false;
  }).length;
}

function pendingClientPayments(fiesta: any) {
  const pagos = fiesta?.clientPaymentNotifications;
  if (!Array.isArray(pagos)) return 0;
  return pagos.filter((pago: any) => pago?.estado === 'pendiente').length;
}

function add(items: AkAgentDiagnosticItem[], item: AkAgentDiagnosticItem) {
  if (items.some(existing => existing.id === item.id)) return;
  items.push(item);
}

function emptyByAgent(): Record<AkAgentType, AkAgentDiagnosticItem[]> {
  return AGENT_TYPES.reduce((acc, agent) => {
    acc[agent] = [];
    return acc;
  }, {} as Record<AkAgentType, AkAgentDiagnosticItem[]>);
}

function sortItems(items: AkAgentDiagnosticItem[]) {
  return [...items].sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
}

export async function buildMultiAgentTeamBriefing(input?: { fiestaId?: string }): Promise<AkAgentTeamBriefing> {
  const [fiestas, presupuestos, leads, notifications, commercialResult, postEventResult] = await Promise.all([
    getAllFiestas().catch(() => []),
    getPresupuestos().catch(() => []),
    getCrmLeads().catch(() => []),
    getNotifications().catch(() => []),
    getCommercialFollowups().catch(() => ({ success: false, data: [] })),
    getPostEventOpportunities().catch(() => ({ success: false, data: [] })),
  ]);

  const items: AkAgentDiagnosticItem[] = [];
  const allFiestas = fiestas as any[];

  for (const fiesta of allFiestas) {
    const fiestaId = fiesta?.id;
    const name = eventName(fiesta);
    const eventDate = toDate(fiesta?.configuracion?.fechaEvento);
    const d = eventDate ? daysUntil(eventDate) : null;
    const score = calculateFiestaPreparationScore(fiesta);
    const pendingTasks = Array.isArray(fiesta?.tareas) ? fiesta.tareas.filter((t: any) => !t.completada) : [];

    if (!input?.fiestaId || input.fiestaId === fiestaId) {
      if (score.score < 75) {
        add(items, {
          id: `fiesta_score_${fiestaId}`,
          agentType: 'fiesta',
          fiestaId,
          title: `${name}: preparación en ${score.score}%`,
          detail: score.summary,
          priority: score.score < 45 ? 'alta' : 'media',
          href: eventHref(fiestaId),
          learningHint: `La fiesta ${name} necesita foco en: ${score.importantPending.map(item => item.label).join(', ') || 'revisión general'}.`,
        });
      }

      for (const pending of score.importantPending.slice(0, 3)) {
        add(items, {
          id: `fiesta_pending_${fiestaId}_${pending.id}`,
          agentType: 'fiesta',
          fiestaId,
          title: `${name}: falta ${pending.label}`,
          detail: pending.detail,
          priority: pending.id === 'documentos' || pending.id === 'personal' ? 'alta' : 'media',
          href: pending.href || eventHref(fiestaId),
          learningHint: `En ${name}, revisar ${pending.label}: ${pending.detail}`,
        });
      }
    }

    if (eventDate && d !== null && d >= 0 && d <= 30) {
      add(items, {
        id: `secretaria_event_${fiestaId}`,
        agentType: 'secretaria',
        fiestaId,
        title: `${name} se acerca`,
        detail: d === 0 ? `Es hoy y tiene ${pendingTasks.length} tarea(s) pendiente(s).` : `Faltan ${d} día(s) y tiene ${pendingTasks.length} tarea(s) pendiente(s).`,
        priority: d <= 7 || pendingTasks.length >= 5 ? 'alta' : 'media',
        href: eventHref(fiestaId),
        learningHint: `Secretaria debe vigilar ${name}: faltan ${d} día(s), pendientes visibles ${pendingTasks.length}.`,
      });

      if (!hasAssignedStaff(fiesta) && d <= 14) {
        add(items, {
          id: `staff_missing_${fiestaId}`,
          agentType: 'fiestas_general',
          fiestaId,
          title: `${name}: personal a confirmar`,
          detail: `La fiesta está cerca y no veo personal asignado con empleado real.`,
          priority: d <= 7 ? 'alta' : 'media',
          href: eventHref(fiestaId, '/fiestas/nueva/personal'),
          learningHint: `Antes de ${name}, confirmar personal asignado con empleado real, no solo filas vacías.`,
        });
      }
    }

    const overduePayments = overduePaymentCount(fiesta);
    if (overduePayments > 0) {
      add(items, {
        id: `contable_overdue_${fiestaId}`,
        agentType: 'contable',
        fiestaId,
        title: `${name}: cuotas vencidas`,
        detail: `Hay ${overduePayments} cuota(s) del plan de pagos para revisar.`,
        priority: 'alta',
        href: eventHref(fiestaId, '/fiestas/nueva/gestion-documental'),
        learningHint: `Contable debe revisar cuotas vencidas de ${name}.`,
      });
    }

    const pendingPayments = pendingClientPayments(fiesta);
    if (pendingPayments > 0) {
      add(items, {
        id: `contable_payment_notice_${fiestaId}`,
        agentType: 'contable',
        fiestaId,
        title: `${name}: comprobantes pendientes`,
        detail: `Hay ${pendingPayments} comprobante(s) enviados por cliente esperando revisión.`,
        priority: 'alta',
        href: eventHref(fiestaId, '/fiestas/nueva/gestion-documental'),
        learningHint: `Contable debe aprobar o rechazar comprobantes pendientes de ${name}.`,
      });
    }

    if (eventDate && d !== null && d < 0 && d >= -45 && !fiesta?.postEventoCompletado) {
      add(items, {
        id: `marketing_post_event_${fiestaId}`,
        agentType: 'marketing',
        fiestaId,
        title: `${name}: cierre post-fiesta`,
        detail: `Ya pasó hace ${Math.abs(d)} día(s). Conviene pedir testimonio, autorización de fotos e idea de publicación.`,
        priority: Math.abs(d) <= 10 ? 'alta' : 'media',
        href: '/control-tower/post-fiesta',
        learningHint: `Marketing debe preparar contenido post-fiesta de ${name}.`,
      });
    }
  }

  for (const item of (commercialResult.data || []).slice(0, 8)) {
    add(items, {
      id: `commercial_${item.id}`,
      agentType: 'comercial',
      title: `Seguimiento: ${item.name}`,
      detail: item.reason,
      priority: item.priority,
      href: item.href,
      learningHint: `Comercial debe priorizar ${item.name}: ${item.reason}`,
    });
  }

  for (const pres of presupuestos as any[]) {
    if (pres.estado !== 'Enviado') continue;
    const created = toDate(pres.timestamp || pres.createdAt);
    const age = created ? daysSince(created) : 0;
    if (age >= 5) {
      add(items, {
        id: `commercial_budget_age_${pres.id}`,
        agentType: 'comercial',
        title: `Presupuesto sin respuesta: ${pres.clienteNombre || 'Cliente'}`,
        detail: `Está enviado hace ${age} día(s). Conviene seguimiento antes de perder la oportunidad.`,
        priority: 'alta',
        href: `/presupuestos/${pres.id}/ver`,
        learningHint: `Presupuesto de ${pres.clienteNombre || 'cliente'} necesita seguimiento después de ${age} días.`,
      });
    }
  }

  for (const post of (postEventResult.data || []).slice(0, 6)) {
    add(items, {
      id: `post_event_${post.fiestaId}`,
      agentType: 'marketing',
      fiestaId: post.fiestaId,
      title: `${post.nombreEvento}: oportunidad post-fiesta`,
      detail: `Pasaron ${post.daysAfter} día(s). Hay mensaje de testimonio y publicación sugerida listos para trabajar.`,
      priority: post.daysAfter <= 10 ? 'alta' : 'media',
      href: '/control-tower/post-fiesta',
      learningHint: `Post-fiesta de ${post.nombreEvento}: pedir testimonio y autorización de fotos.`,
    });
  }

  const unreadUrgent = (notifications as any[]).filter(n => !n.leida && n.tipo === 'urgente').slice(0, 5);
  for (const notification of unreadUrgent) {
    add(items, {
      id: `secretaria_urgent_notification_${notification.id}`,
      agentType: 'secretaria',
      title: notification.titulo || 'Notificación urgente pendiente',
      detail: notification.mensaje || 'Hay una notificación urgente para revisar.',
      priority: 'alta',
      href: notification.href || '/alertas',
      learningHint: `Secretaria debe revisar notificación urgente: ${notification.mensaje || notification.titulo || notification.id}.`,
    });
  }

  if ((leads as any[]).length === 0 && (presupuestos as any[]).length === 0) {
    add(items, {
      id: 'commercial_no_pipeline_data',
      agentType: 'comercial',
      title: 'Pipeline comercial sin datos visibles',
      detail: 'No veo leads ni presupuestos recientes para trabajar. Puede ser falta de datos o una oportunidad de ordenar CRM.',
      priority: 'normal',
      href: '/contabilidad/crm',
      learningHint: 'Comercial debe revisar si el CRM está alimentado con consultas reales.',
    });
  }

  const sorted = sortItems(items);
  const byAgent = emptyByAgent();
  for (const item of sorted) {
    byAgent[item.agentType].push(item);
    byAgent.central.push(item);
  }

  const high = sorted.filter(item => item.priority === 'alta').length;
  const medium = sorted.filter(item => item.priority === 'media').length;
  const summary = sorted.length
    ? `Equipo AK detectó ${sorted.length} punto(s): ${high} prioridad alta y ${medium} a revisar.`
    : 'Equipo AK no detectó pendientes importantes con los datos actuales.';

  return {
    generatedAt: new Date().toISOString(),
    summary,
    items: sorted,
    byAgent,
  };
}

export function formatAgentDiagnosticsForPrompt(briefing: AkAgentTeamBriefing, agentType: AkAgentType, fiestaId?: string) {
  const items = agentType === 'fiesta' && fiestaId
    ? briefing.items.filter(item => item.fiestaId === fiestaId)
    : briefing.byAgent[agentType] || [];

  const selected = items.slice(0, 12);
  if (selected.length === 0) return `${briefing.summary}\nNo hay pendientes concretos para este agente ahora.`;

  return [
    briefing.summary,
    ...selected.map(item => `- [${item.priority.toUpperCase()}] ${item.title}: ${item.detail} (${item.href})`),
  ].join('\n');
}

export function summarizeDiagnosticsForLearning(agentType: AkAgentType, items: AkAgentDiagnosticItem[]) {
  const selected = items.slice(0, 10);
  if (selected.length === 0) return 'Sin pendientes importantes detectados para este agente.';
  return selected.map(item => `- ${item.title}: ${item.detail}`).join('\n');
}
