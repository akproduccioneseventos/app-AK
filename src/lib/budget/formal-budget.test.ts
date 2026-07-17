import {
  buildAnnualAdjustmentProjection,
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
});
