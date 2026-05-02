import {
  buildCommercialFollowUpChecklist,
  buildCommercialFollowUpPlan,
  buildCommercialFollowUpTasks,
  canSendAutomatedWhatsapp,
} from '@/lib/commercial/commercial-follow-up';
import type { SimulatorConversionPlan } from '@/lib/commercial/simulator-conversion-engine';

const basePlan: SimulatorConversionPlan = {
  source: 'simulador_comun',
  leadTemperature: 'caliente',
  crmTags: ['origen:simulador_comun', 'temperatura:caliente'],
  nextAction: 'Responder WhatsApp con propuesta de entrevista gratis.',
  whatsappMessage: 'Hola, coordinamos entrevista gratis.',
  internalNote: 'Origen comercial: simulador_comun',
  shouldCreateTask: true,
  shouldPrioritize: true,
};

describe('commercial follow-up engine', () => {
  it('builds priority tasks for hot leads', () => {
    const tasks = buildCommercialFollowUpTasks(basePlan);

    expect(tasks[0].channel).toBe('whatsapp');
    expect(tasks[0].timing).toBe('ahora');
    expect(tasks.some(task => task.channel === 'llamada')).toBe(true);
  });

  it('builds nurture task for cold leads', () => {
    const tasks = buildCommercialFollowUpTasks({
      ...basePlan,
      leadTemperature: 'frio',
      shouldPrioritize: false,
      crmTags: ['temperatura:frio'],
    });

    expect(tasks.some(task => task.channel === 'marketing')).toBe(true);
    expect(tasks.some(task => task.channel === 'llamada')).toBe(false);
  });

  it('builds full follow-up plan', () => {
    const plan = buildCommercialFollowUpPlan(basePlan);

    expect(plan.crmStage).toBe('Contactar hoy');
    expect(plan.marketingAngle).toContain('entrevista');
    expect(plan.whatsappFirstMessage).toContain('entrevista');
    expect(plan.tasks.length).toBeGreaterThan(1);
  });

  it('checks whatsapp automation safety', () => {
    expect(canSendAutomatedWhatsapp({ hasPhone: true, optedIn: true, withinMessagingWindow: true })).toBe(true);
    expect(canSendAutomatedWhatsapp({ hasPhone: true, optedIn: false, withinMessagingWindow: true })).toBe(false);
  });

  it('returns checklist', () => {
    expect(buildCommercialFollowUpChecklist().length).toBeGreaterThan(4);
  });
});
