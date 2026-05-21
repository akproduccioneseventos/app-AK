import {
  buildSimulatorConversionChecklist,
  buildSimulatorConversionPlan,
  buildSimulatorCrmTags,
  buildSimulatorWhatsappMessage,
  classifySimulatorLeadTemperature,
} from '@/lib/commercial/simulator-conversion-engine';

describe('simulator conversion engine', () => {
  it('classifies lead temperature by actions', () => {
    expect(classifySimulatorLeadTemperature({ source: 'simulador_comun', clientName: 'Ana' })).toBe('frio');
    expect(classifySimulatorLeadTemperature({ source: 'simulador_asistente', clientName: 'Ana', completedSalesPresentation: true })).toBe('tibio');
    expect(classifySimulatorLeadTemperature({ source: 'simulador_comun', clientName: 'Ana', clickedWhatsApp: true })).toBe('caliente');
    expect(classifySimulatorLeadTemperature({ source: 'simulador_comun', clientName: 'Ana', requestedMeeting: true, createdBudget: true })).toBe('urgente');
  });

  it('builds crm tags from simulator input', () => {
    const tags = buildSimulatorCrmTags({
      source: 'landing_quince',
      clientName: 'Sofia',
      eventType: '15 años',
      hasVenue: false,
      wantsClubUruguay: true,
      completedSalesPresentation: true,
      viewedTechnologyValue: true,
      createdBudget: true,
    });

    expect(tags).toContain('origen:landing_quince');
    expect(tags).toContain('necesita_salon');
    expect(tags).toContain('interes:club_uruguay');
    expect(tags).toContain('vio_presentacion_ak');
    expect(tags).toContain('vio_tecnologia_ak');
  });

  it('builds whatsapp message and conversion plan', () => {
    const input = {
      source: 'simulador_asistente' as const,
      clientName: 'Sofia',
      eventType: '15 años',
      estimatedTotal: 120000,
      clickedWhatsApp: true,
      viewedTechnologyValue: true,
    };

    expect(buildSimulatorWhatsappMessage(input)).toContain('Sofia');
    expect(buildSimulatorWhatsappMessage(input)).toContain('portal');
    const plan = buildSimulatorConversionPlan(input);
    expect(plan.shouldCreateTask).toBe(true);
    expect(plan.shouldPrioritize).toBe(true);
    expect(plan.nextAction).toContain('WhatsApp');
    expect(plan.internalNote).toContain('simulador_asistente');
    expect(plan.salesStage).toBe('agendar_entrevista');
    expect(plan.followUpTaskTitle).toContain('Sofia');
    expect(plan.valueProof.join(' ')).toContain('tecnología AK');
  });

  it('builds checklist', () => {
    expect(buildSimulatorConversionChecklist().length).toBeGreaterThan(3);
  });
});
