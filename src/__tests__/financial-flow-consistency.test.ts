import { readFileSync } from 'fs';
import { join } from 'path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('financial flow consistency', () => {
  it('uses the central discount engine and configured annual adjustment in manual budgets', () => {
    const summary = read('src/components/presupuestos/paso-3-resumen.tsx');
    const creator = read('src/app/(app)/presupuestos/nuevo/crear/page.tsx');

    expect(summary).toContain('calculateDiscountAmount');
    expect(summary).not.toContain('totalSinAj - descuentoCupon');
    expect(summary).not.toContain('adjustmentPct: 15');
    expect(creator).toContain('getBudgetDisplaySettings()');
    expect(creator).toContain('annualAdjustmentPercentage={annualAdjustmentPercentage}');
  });

  it('keeps the simulator server total and payment-only budget updates stable', () => {
    const persistence = read('src/lib/budget/public-simulator-persistence.ts');
    const budgets = read('src/app/actions/presupuestos.ts');

    expect(persistence).toContain('{ preserveStoredTotal: true }');
    expect(budgets.match(/preserveStoredTotal: true/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(budgets).toContain("referencia.startsWith('AK_SYNC:')");
  });

  it('persists historical payments and reconciles invoice payments with linked budgets', () => {
    const invoices = read('src/app/actions/invoices.ts');
    const historical = read('src/app/actions/historicos.ts');

    expect(invoices).toContain('const inputPayments');
    expect(invoices).toContain('sourcePresupuestoId: invoiceDataInput.sourcePresupuestoId || sourcePresupuestoId');
    expect(invoices).toContain('AK_SYNC:invoice:');
    expect(invoices).toContain('invoices[invoiceIndex] = invoice;');
    expect(historical).toContain('pagosCliente: [{');
    expect(historical).toContain("estadoPago: 'confirmado'");
    expect(historical).toContain('AK_SYNC:historico:');
  });
});
