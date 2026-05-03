import { createPortalLedSession, selectPortalLedItem } from '@/lib/commercial/portal-led-sales-flow';
import {
  buildPortalLedBudgetConnectorChecklist,
  connectPortalLedSelectionToLiveBudget,
} from '@/lib/commercial/portal-led-budget-connector';

describe('Portal LED budget connector', () => {
  it('imports only ready items into live budget', () => {
    let session = createPortalLedSession({ id: 's1', eventType: '15 anos', guests: 100 });
    session = selectPortalLedItem(session, { id: 'menu1', name: 'Menu premium', category: 'Gastronomia', status: 'interesa', quantity: 100, estimatedUnitPrice: 900 });
    session = selectPortalLedItem(session, { id: 'foto1', name: 'Fotografia', category: 'Fotografia', status: 'pendiente', estimatedUnitPrice: 12000 });
    session = selectPortalLedItem(session, { id: 'regalo1', name: 'Fuegos frios', category: 'Show', status: 'regalo', estimatedUnitPrice: 8000 });

    const result = connectPortalLedSelectionToLiveBudget(session);

    expect(result.importedItems.length).toBe(2);
    expect(result.skippedItems.length).toBe(1);
    expect(result.liveBudget.eventType).toBe('15 anos');
    expect(result.liveBudget.guestCount).toBe(100);
    expect(result.liveBudget.items.find(item => item.name === 'Fuegos frios')?.isGift).toBe(true);
  });

  it('warns about missing prices and quantities', () => {
    let session = createPortalLedSession({ id: 's2' });
    session = selectPortalLedItem(session, { id: 'x1', name: 'Servicio sin precio', category: 'Extra', status: 'interesa' });

    const result = connectPortalLedSelectionToLiveBudget(session);

    expect(result.warnings.some(warning => warning.includes('precio'))).toBe(true);
    expect(result.warnings.some(warning => warning.includes('cantidad'))).toBe(true);
  });

  it('returns checklist', () => {
    expect(buildPortalLedBudgetConnectorChecklist().length).toBeGreaterThan(3);
  });
});
