import { getPortalLedBudgetReadyItems, type PortalLedSelectedItem, type PortalLedSession } from './portal-led-sales-flow';
import { addLiveBudgetItem, createLiveBudgetState, type LiveBudgetItem, type LiveBudgetItemKind, type LiveBudgetState } from './live-budget-editor';

export type PortalLedBudgetConnectionResult = {
  sessionId: string;
  liveBudget: LiveBudgetState;
  importedItems: LiveBudgetItem[];
  skippedItems: PortalLedSelectedItem[];
  warnings: string[];
};

function mapCategoryToBudgetKind(item: PortalLedSelectedItem): LiveBudgetItemKind {
  const category = `${item.category} ${item.subcategory ?? ''}`.toLowerCase();
  if (item.status === 'regalo') return 'regalo';
  if (category.includes('menu') || category.includes('plato') || category.includes('gastronomia') || category.includes('catering')) return 'menu';
  if (category.includes('entrada')) return 'entrada';
  if (category.includes('mozo') || category.includes('personal')) return 'personal';
  if (category.includes('salon')) return 'salon';
  return 'servicio';
}

function buildBudgetItemFromPortalLed(item: PortalLedSelectedItem): LiveBudgetItem {
  return {
    id: `portal_led_${item.id}`,
    name: item.name,
    kind: mapCategoryToBudgetKind(item),
    quantity: item.quantity ?? 1,
    unitPrice: item.estimatedUnitPrice ?? 0,
    isGift: item.status === 'regalo',
    notes: [item.category, item.subcategory, item.notes].filter(Boolean).join(' | '),
  };
}

export function connectPortalLedSelectionToLiveBudget(session: PortalLedSession, existingBudget?: LiveBudgetState): PortalLedBudgetConnectionResult {
  const readyItems = getPortalLedBudgetReadyItems(session);
  const skippedItems = session.selectedItems.filter(item => !readyItems.includes(item));
  const importedItems = readyItems.map(buildBudgetItemFromPortalLed);
  let liveBudget = existingBudget ?? createLiveBudgetState({
    eventType: session.eventType,
    guestCount: session.guests ?? 0,
  });

  for (const item of importedItems) {
    liveBudget = addLiveBudgetItem(liveBudget, item);
  }

  const warnings = [
    ...importedItems.filter(item => item.unitPrice === 0 && !item.isGift).map(item => `Revisar precio de ${item.name}`),
    ...readyItems.filter(item => !item.quantity).map(item => `Revisar cantidad de ${item.name}`),
  ];

  return {
    sessionId: session.id,
    liveBudget,
    importedItems,
    skippedItems,
    warnings,
  };
}

export function buildPortalLedBudgetConnectorChecklist(): string[] {
  return [
    'Solo pasar al presupuesto lo marcado como interesa, incluido o regalo.',
    'Los regalos pasan como valor comercial sin cobrarse.',
    'Los items sin precio deben entrar con advertencia para revisar.',
    'La cantidad debe poder editarse en el presupuesto manual.',
    'El presupuesto debe conservar el tipo de fiesta y cantidad de invitados de la entrevista LED.',
  ];
}
