import type { SimulatorConversionPlan, SimulatorLeadTemperature } from './simulator-conversion-engine';

export type CommercialFollowUpChannel = 'whatsapp' | 'llamada' | 'crm' | 'marketing' | 'manual';
export type CommercialFollowUpTiming = 'ahora' | 'hoy' | 'manana' | 'en_48_horas' | 'en_7_dias';
export type CommercialFollowUpStatus = 'pendiente' | 'enviado' | 'respondido' | 'cerrado' | 'perdido';

export type CommercialFollowUpTask = {
  id: string;
  title: string;
  channel: CommercialFollowUpChannel;
  timing: CommercialFollowUpTiming;
  priority: number;
  status: CommercialFollowUpStatus;
  message: string;
  tags: string[];
};

export type CommercialFollowUpPlan = {
  leadTemperature: SimulatorLeadTemperature;
  tasks: CommercialFollowUpTask[];
  crmStage: string;
  marketingAngle: string;
  whatsappFirstMessage: string;
  internalSummary: string;
};

function taskId(prefix: string, index: number): string {
  return `${prefix}_${index + 1}`;
}

function stageForTemperature(temperature: SimulatorLeadTemperature): string {
  if (temperature === 'caliente' || temperature === 'urgente') return 'Contactar hoy';
  if (temperature === 'tibio') return 'Seguimiento presupuesto';
  return 'Nutrir / educar';
}

function angleForTemperature(temperature: SimulatorLeadTemperature): string {
  if (temperature === 'urgente') return 'Fecha cercana: resolver rapido, disponibilidad y seña.';
  if (temperature === 'caliente') return 'Ya mostro interes: llevar a entrevista gratis y cierre.';
  if (temperature === 'tibio') return 'Ya vio valor/precio: reforzar beneficios y resolver dudas.';
  return 'Educar antes de vender: servicio integral, tecnologia y tranquilidad.';
}

export function buildCommercialFollowUpTasks(plan: SimulatorConversionPlan): CommercialFollowUpTask[] {
  const tasks: CommercialFollowUpTask[] = [];
  const priority = plan.shouldPrioritize ? 1 : plan.leadTemperature === 'tibio' ? 2 : 3;

  tasks.push({
    id: taskId('whatsapp', tasks.length),
    title: plan.shouldPrioritize ? 'Responder WhatsApp y proponer entrevista hoy' : 'Enviar seguimiento por WhatsApp',
    channel: 'whatsapp',
    timing: plan.shouldPrioritize ? 'ahora' : 'hoy',
    priority,
    status: 'pendiente',
    message: plan.whatsappMessage,
    tags: plan.crmTags,
  });

  tasks.push({
    id: taskId('crm', tasks.length),
    title: 'Actualizar etapa y etiquetas en CRM',
    channel: 'crm',
    timing: 'hoy',
    priority,
    status: 'pendiente',
    message: plan.internalNote,
    tags: plan.crmTags,
  });

  if (plan.leadTemperature === 'frio' || plan.leadTemperature === 'tibio') {
    tasks.push({
      id: taskId('marketing', tasks.length),
      title: 'Enviar contenido educativo de AK',
      channel: 'marketing',
      timing: plan.leadTemperature === 'frio' ? 'en_48_horas' : 'manana',
      priority: 3,
      status: 'pendiente',
      message: 'Enviar beneficios del servicio integral, tecnologia AK y entrevista gratis.',
      tags: [...plan.crmTags, 'contenido:educativo'],
    });
  }

  if (plan.leadTemperature === 'caliente' || plan.leadTemperature === 'urgente') {
    tasks.push({
      id: taskId('llamada', tasks.length),
      title: 'Llamar si no responde WhatsApp',
      channel: 'llamada',
      timing: 'hoy',
      priority: 1,
      status: 'pendiente',
      message: 'Lead con intencion alta. Intentar contacto directo si no responde.',
      tags: [...plan.crmTags, 'accion:llamada'],
    });
  }

  return tasks;
}

export function buildCommercialFollowUpPlan(plan: SimulatorConversionPlan): CommercialFollowUpPlan {
  const tasks = buildCommercialFollowUpTasks(plan);
  return {
    leadTemperature: plan.leadTemperature,
    tasks,
    crmStage: stageForTemperature(plan.leadTemperature),
    marketingAngle: angleForTemperature(plan.leadTemperature),
    whatsappFirstMessage: plan.whatsappMessage,
    internalSummary: `${stageForTemperature(plan.leadTemperature)} | ${plan.internalNote}`,
  };
}

export function buildCommercialFollowUpChecklist(): string[] {
  return [
    'Cada presupuesto de simulador debe crear o actualizar un lead en CRM.',
    'Cada lead debe guardar origen, temperatura, tags y proxima accion.',
    'WhatsApp debe ser el primer canal si el cliente dejo telefono o hizo clic.',
    'Si no responde, crear tarea de seguimiento sin perder el historial.',
    'Marketing debe nutrir leads frios o tibios con contenido educativo.',
    'Los leads calientes o urgentes deben priorizarse el mismo dia.',
  ];
}

export function canSendAutomatedWhatsapp(input: { hasPhone?: boolean; optedIn?: boolean; withinMessagingWindow?: boolean }): boolean {
  return Boolean(input.hasPhone && input.optedIn && input.withinMessagingWindow);
}
