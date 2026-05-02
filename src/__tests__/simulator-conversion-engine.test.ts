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
  });

  it('builds crm tags from simulator input', () => {
    const tags = buildSimulatorCrmTags({
      source: 'landing_quince',
      clientName: 'Sofia',
      eventType: '15 años',
      hasVenue: false,
      wantsClubUruguay: true,
      completedSalesPresentation: true,
      createdBudget: true,
    });

    expect(tags).toContain('origen:landing_quince');
    expect(tags).toContain('necesita_salon');
    expect(tags).toContain('interes:club_uruguay');
    expect(tags).toContain('vio_presentacion_ak');
  });

  it('builds whatsapp message and conversion plan', () => {
    const input = {
      source: 'simulador_asistente' as const,
      clientName: 'Sofia',
      eventType: '15 años',
      estimatedTotal: 120000,
      clickedWhatsApp: true,
    };

    expect(buildSimulatorWhatsappMessage(input)).toContain('Sofia');
    const plan = buildSimulatorConversionPlan(input);
    expect(plan.shouldCreateTask).toBe(true);
    expect(plan.shouldPrioritize).toBe(true);
    expect(plan.nextAction).toContain('WhatsApp');
    expect(plan.internalNote).toContain('simulador_asistente');
  });

  it('builds checklist', () => {
    expect(buildSimulatorConversionChecklist().length).toBeGreaterThan(3);
  });
});
