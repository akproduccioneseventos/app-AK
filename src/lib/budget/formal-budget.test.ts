import {
  buildAnnualAdjustmentProjection,
  buildFormalBudgetBookingNote,
  calculatePricePerPerson,
} from './formal-budget';

describe('formal budget presentation calculations', () => {
  it('does not mention or apply an adjustment for the current year', () => {
    const projection = buildAnnualAdjustmentProjection({
      baseTotal: 100000,
      eventDate: '2026-11-20',
      currentYear: 2026,
      adjustmentPct: 15,
    });

    expect(projection.applies).toBe(false);
    expect(projection.rows).toEqual([]);
    expect(projection.adjustedTotal).toBe(100000);
    expect(projection.adjustmentAmount).toBe(0);
  });

  it('shows the accumulated total for every future event year', () => {
    const projection = buildAnnualAdjustmentProjection({
      baseTotal: 100000,
      eventDate: '2028-11-20',
      currentYear: 2026,
      adjustmentPct: 15,
    });

    expect(projection.applies).toBe(true);
    expect(projection.rows).toEqual([
      { year: 2027, total: 115000, adjustmentAmount: 15000 },
      { year: 2028, total: 132250, adjustmentAmount: 17250 },
    ]);
    expect(projection.adjustedTotal).toBe(132250);
    expect(projection.adjustmentAmount).toBe(32250);
  });

  it('calculates the marketing price per person without dividing by zero', () => {
    expect(calculatePricePerPerson(100000, 100)).toBe(1000);
    expect(calculatePricePerPerson(100000, 0)).toBe(0);
  });

  it('uses the configured annual percentage and deposit in the formal note', () => {
    const note = buildFormalBudgetBookingNote({
      hasAnnualAdjustment: true,
      adjustmentPct: 12,
      bookingDepositAmount: 7000,
      currentYear: 2026,
    });

    expect(note).toContain('ajuste anual proyectado del 12%');
    expect(note).toContain('seña de $ 7.000');
    expect(note).not.toContain('15%');
  });

  it('does not mention an annual adjustment for a current-year budget', () => {
    const note = buildFormalBudgetBookingNote({
      hasAnnualAdjustment: false,
      adjustmentPct: 15,
      currentYear: 2026,
    });

    expect(note).toContain('precio vigente del año 2026');
    expect(note).not.toContain('ajuste anual');
  });
});
