import { resolvePublicLeadStage } from './lead-stage';

describe('public CRM lead stage resolution', () => {
  it('uses the configured budget stage for a new simulator lead', () => {
    expect(resolvePublicLeadStage({
      initialStageId: 'consulta-custom',
      budgetStageId: 'presupuesto-custom',
      isSimulatorLead: true,
      shouldAdvanceToBudget: false,
    })).toBe('presupuesto-custom');
  });

  it('falls back to the configured initial stage instead of a hard-coded id', () => {
    expect(resolvePublicLeadStage({
      initialStageId: 'consulta-custom',
      isSimulatorLead: true,
      shouldAdvanceToBudget: false,
    })).toBe('consulta-custom');
  });

  it('does not move an existing opportunity backwards', () => {
    expect(resolvePublicLeadStage({
      existingStageId: 'contrato-firmado',
      initialStageId: 'consulta-custom',
      budgetStageId: 'presupuesto-custom',
      isSimulatorLead: true,
      shouldAdvanceToBudget: false,
    })).toBe('contrato-firmado');
  });

  it('advances an eligible existing lead when a budget is created', () => {
    expect(resolvePublicLeadStage({
      existingStageId: 'consulta-custom',
      initialStageId: 'consulta-custom',
      budgetStageId: 'presupuesto-custom',
      isSimulatorLead: true,
      shouldAdvanceToBudget: true,
    })).toBe('presupuesto-custom');
  });
});
