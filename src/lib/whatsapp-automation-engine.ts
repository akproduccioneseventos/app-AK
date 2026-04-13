import type { AutomationTrigger, ScheduledMessage } from '@/types/whatsapp-automation';
import { getWhatsAppSettings, getWhatsAppTemplates } from '@/app/actions/settings';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';

export interface AutomationContext {
  targetId: string;
  targetName: string;
  targetType: 'prospecto' | 'cliente';
  targetPhone?: string;
  leadId?: string;
  fiestaId?: string;
  // Template variables
  nombre?: string;
  fecha?: string;
  hora?: string;
  fechaEvento?: string;
  saldo?: string;
  link?: string;
  salon?: string;
}

type TemplateVariables = Record<string, string>;

function buildVariables(ctx: AutomationContext): TemplateVariables {
  return {
    NOMBRE: ctx.nombre || ctx.targetName || '',
    FECHA: ctx.fecha || ctx.fechaEvento || '',
    HORA: ctx.hora || '',
    FECHA_EVENTO: ctx.fechaEvento || ctx.fecha || '',
    SALDO: ctx.saldo || '',
    LINK: ctx.link || '',
    SALON: ctx.salon || '',
  };
}

function renderTemplate(template: string, ctx: AutomationContext): string {
  const vars = buildVariables(ctx);
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
    template
  );
}

/**
 * Evaluates all enabled automation rules for a given trigger event and
 * creates ScheduledMessage entries for each matching rule.
 *
 * Call this fire-and-forget (non-blocking) from server actions when key
 * events occur (presupuesto created/sent, contract signed, etc.).
 */
export async function triggerWhatsAppAutomation(
  trigger: AutomationTrigger,
  ctx: AutomationContext
): Promise<{ scheduled: number; errors: string[] }> {
  const errors: string[] = [];
  let scheduled = 0;

  try {
    const [settings, templates] = await Promise.all([
      getWhatsAppSettings(),
      getWhatsAppTemplates(),
    ]);

    if (!settings.enabled) return { scheduled: 0, errors: [] };

    const rules = (settings.automationRules ?? []).filter(
      r => r.enabled && r.trigger === trigger
    );

    if (rules.length === 0) return { scheduled: 0, errors: [] };

    for (const rule of rules) {
      try {
        let messageText = '';

        switch (rule.templateType) {
          case 'recordatorio_reunion':
            messageText = renderTemplate(settings.reminderMessageTemplate, ctx);
            break;
          case 'presupuesto_24h':
          case 'presupuesto_48h':
          case 'simulador_completado':
            messageText = renderTemplate(templates.budgetShareTemplate, ctx);
            break;
          case 'pago_vencido':
          case 'pago_por_vencer':
            messageText = renderTemplate(settings.paymentReminderTemplate, ctx);
            break;
          case 'bienvenida':
          case 'cliente_nuevo':
          case 'lead_estado_cambiado':
            messageText = renderTemplate(templates.welcomeTemplate, ctx);
            break;
          case 'contrato_firmado':
            messageText = renderTemplate(templates.contractShareTemplate, ctx);
            break;
          case 'personalizado':
            messageText = renderTemplate(rule.customTemplate ?? '', ctx);
            break;
          default:
            messageText = renderTemplate(templates.welcomeTemplate, ctx);
        }

        if (!messageText.trim()) continue;

        const scheduledAt = new Date(
          Date.now() + rule.delayHours * 60 * 60 * 1000
        ).toISOString();

        const newMsg: Omit<ScheduledMessage, 'id' | 'createdAt'> = {
          targetType: rule.targetType,
          targetId: ctx.targetId,
          targetName: ctx.targetName,
          targetPhone: ctx.targetPhone,
          templateType: rule.templateType,
          messageText,
          scheduledAt,
          status: 'pendiente',
          leadId: ctx.leadId,
          fiestaId: ctx.fiestaId,
          automationRuleId: rule.id,
        };

        const result = await saveScheduledMessage(newMsg);
        if (result.success) {
          scheduled++;
        } else {
          errors.push(`Error programando mensaje para regla "${rule.name}": ${result.error}`);
        }
      } catch (e: any) {
        errors.push(`Error en regla "${rule.name}": ${e.message}`);
      }
    }
  } catch (e: any) {
    errors.push(`Error en motor de automatización: ${e.message}`);
  }

  return { scheduled, errors };
}
