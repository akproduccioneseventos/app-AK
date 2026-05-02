import { addLiveBudgetItem, createLiveBudgetState } from '@/lib/commercial/live-budget-editor';
import {
  applyEditedState,
  buildEditableSummaryChecklist,
  closeEditableBudget,
  createEditableBudgetSummaryFlow,
  getEditableBudgetHistoryLabels,
  goBackToLiveEdit,
  goToBudgetSummary,
} from '@/lib/commercial/editable-budget-summary';

describe('editable budget summary flow', () => {
  it('goes to summary and back to edit without losing state', () => {
    let state = createLiveBudgetState({ guestCount: 100 });
    state = addLiveBudgetItem(state, { id: 'menu', name: 'Menu', kind: 'menu', quantity: 100, unitPrice: 900 });

    let flow = createEditableBudgetSummaryFlow(state);
    flow = goToBudgetSummary(flow, { visualDiscountPercentage: 15 });

    expect(flow.currentStep).toBe('resumen');
    expect(flow.lastSummary?.totals.totalToCharge).toBe(90000);
    expect(flow.lastSummary?.commercialDiscount.finalPrice).toBe(90000);

    flow = goBackToLiveEdit(flow);
    expect(flow.currentStep).toBe('armado');
    expect(flow.currentState.items.length).toBe(1);
  });

  it('stores edit history and closes budget', () => {
    let state = createLiveBudgetState({ guestCount: 50 });
    state = addLiveBudgetItem(state, { id: 'entrada', name: 'Entrada', kind: 'entrada', quantity: 50, unitPrice: 300 });

    let flow = createEditableBudgetSummaryFlow(state);
    flow = goToBudgetSummary(flow);

    const editedState = addLiveBudgetItem(flow.currentState, { id: 'extra', name: 'Extra', kind: 'extra', quantity: 1, unitPrice: 5000 });
    flow = applyEditedState(flow, editedState, 'Cliente pidio sumar extra');
    flow = closeEditableBudget(flow);

    expect(flow.currentStep).toBe('cierre');
    expect(flow.snapshots.length).toBeGreaterThan(2);
    expect(getEditableBudgetHistoryLabels(flow).join(' ')).toContain('Cliente pidio sumar extra');
  });

  it('returns checklist', () => {
    expect(buildEditableSummaryChecklist().length).toBeGreaterThan(3);
  });
});
