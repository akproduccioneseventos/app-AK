import { resolvePublicLeadStageId } from './public-lead-stage';

describe('public CRM lead stage', () => {
  it('keeps simulator progress without a budget in the initial stage', () => {
    expect(resolvePublicLeadStageId({
      initialStageId: 'consulto',
      budgetStageId: 'presupuesto',
      shouldAdvanceToBudget: false,
    })).toBe('consulto');
  });

  it('advances a new lead after a budget is actually created', () => {
    expect(resolvePublicLeadStageId({
      initialStageId: 'consulto',
      budgetStageId: 'presupuesto',
      shouldAdvanceToBudget: true,
    })).toBe('presupuesto');
  });

  it('preserves an established stage when no budget transition is required', () => {
    expect(resolvePublicLeadStageId({
      existingStageId: 'entrevista',
      initialStageId: 'consulto',
      budgetStageId: 'presupuesto',
      shouldAdvanceToBudget: false,
    })).toBe('entrevista');
  });
});
