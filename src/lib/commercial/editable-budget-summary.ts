import { calculateLiveBudgetTotals, type LiveBudgetState, type LiveBudgetTotals } from './live-budget-editor';
import { buildCommercialFictitiousDiscount, type CommercialDiscountBreakdown } from './fictitious-discount';

export type EditableBudgetStep = 'datos' | 'armado' | 'resumen' | 'cierre';

export type EditableBudgetSnapshot = {
  id: string;
  step: EditableBudgetStep;
  state: LiveBudgetState;
  totals: LiveBudgetTotals;
  commercialDiscount: CommercialDiscountBreakdown;
  createdAt: string;
  reason: string;
};

export type EditableBudgetSummaryFlow = {
  currentStep: EditableBudgetStep;
  currentState: LiveBudgetState;
  snapshots: EditableBudgetSnapshot[];
  canGoBackToEdit: boolean;
  lastSummary?: EditableBudgetSnapshot;
};

function nowISO(): string {
  return new Date().toISOString();
}

function buildSnapshotId(step: EditableBudgetStep, count: number): string {
  return `${step}_${count + 1}_${Date.now()}`;
}

export function createEditableBudgetSummaryFlow(state: LiveBudgetState): EditableBudgetSummaryFlow {
  return {
    currentStep: 'armado',
    currentState: state,
    snapshots: [],
    canGoBackToEdit: true,
  };
}

export function createEditableBudgetSnapshot(input: {
  state: LiveBudgetState;
  step: EditableBudgetStep;
  count?: number;
  reason?: string;
  visualDiscountPercentage?: number;
}): EditableBudgetSnapshot {
  const totals = calculateLiveBudgetTotals(input.state);
  return {
    id: buildSnapshotId(input.step, input.count ?? 0),
    step: input.step,
    state: input.state,
    totals,
    commercialDiscount: buildCommercialFictitiousDiscount({
      targetFinalPrice: totals.totalToCharge,
      visualDiscountPercentage: input.visualDiscountPercentage,
      giftsValue: totals.giftsCommercialValue,
    }),
    createdAt: nowISO(),
    reason: input.reason ?? 'Resumen generado',
  };
}

export function goToBudgetSummary(flow: EditableBudgetSummaryFlow, options?: { reason?: string; visualDiscountPercentage?: number }): EditableBudgetSummaryFlow {
  const snapshot = createEditableBudgetSnapshot({
    state: flow.currentState,
    step: 'resumen',
    count: flow.snapshots.length,
    reason: options?.reason ?? 'Se genero resumen final',
    visualDiscountPercentage: options?.visualDiscountPercentage,
  });

  return {
    ...flow,
    currentStep: 'resumen',
    snapshots: [...flow.snapshots, snapshot],
    lastSummary: snapshot,
    canGoBackToEdit: true,
  };
}

export function goBackToLiveEdit(flow: EditableBudgetSummaryFlow): EditableBudgetSummaryFlow {
  return {
    ...flow,
    currentStep: 'armado',
    canGoBackToEdit: true,
  };
}

export function applyEditedState(flow: EditableBudgetSummaryFlow, state: LiveBudgetState, reason?: string): EditableBudgetSummaryFlow {
  const snapshot = createEditableBudgetSnapshot({
    state,
    step: 'armado',
    count: flow.snapshots.length,
    reason: reason ?? 'Edicion realizada desde resumen',
  });

  return {
    ...flow,
    currentStep: 'armado',
    currentState: state,
    snapshots: [...flow.snapshots, snapshot],
    canGoBackToEdit: true,
  };
}

export function closeEditableBudget(flow: EditableBudgetSummaryFlow, options?: { reason?: string; visualDiscountPercentage?: number }): EditableBudgetSummaryFlow {
  const summaryFlow = flow.currentStep === 'resumen'
    ? flow
    : goToBudgetSummary(flow, { reason: 'Resumen generado antes del cierre', visualDiscountPercentage: options?.visualDiscountPercentage });

  const snapshot = createEditableBudgetSnapshot({
    state: summaryFlow.currentState,
    step: 'cierre',
    count: summaryFlow.snapshots.length,
    reason: options?.reason ?? 'Presupuesto cerrado para enviar o imprimir',
    visualDiscountPercentage: options?.visualDiscountPercentage,
  });

  return {
    ...summaryFlow,
    currentStep: 'cierre',
    snapshots: [...summaryFlow.snapshots, snapshot],
    lastSummary: snapshot,
    canGoBackToEdit: true,
  };
}

export function getEditableBudgetHistoryLabels(flow: EditableBudgetSummaryFlow): string[] {
  return flow.snapshots.map((snapshot, index) => `${index + 1}. ${snapshot.step}: ${snapshot.reason}`);
}

export function buildEditableSummaryChecklist(): string[] {
  return [
    'Resumen final debe permitir volver al armado sin perder datos.',
    'Cada regreso a editar debe guardar historial de cambios.',
    'El total se recalcula siempre desde el armado vivo.',
    'La bonificacion visual se recalcula sin bajar el precio real.',
    'El cierre debe quedar listo para PDF, contrato, WhatsApp o impresion.',
  ];
}
