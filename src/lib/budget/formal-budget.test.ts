import {
  buildAnnualAdjustmentProjection,
  buildFormalBudgetBookingNote,
  calculatePricePerPerson,
  getYearFromDate,
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

  it('shows the simple adjustment total for every future event year', () => {
    const projection = buildAnnualAdjustmentProjection({
      baseTotal: 100000,
      eventDate: '2029-11-20',
      currentYear: 2026,
      adjustmentPct: 15,
      tipoAjusteAnual: 'simple',
    });

    expect(projection.applies).toBe(true);
    expect(projection.tipoAjusteAnual).toBe('simple');
    expect(projection.rows).toEqual([
      { year: 2027, total: 115000, adjustmentAmount: 15000 },
      { year: 2028, total: 130000, adjustmentAmount: 15000 },
      { year: 2029, total: 145000, adjustmentAmount: 15000 },
    ]);
    expect(projection.adjustedTotal).toBe(145000);
    expect(projection.adjustmentAmount).toBe(45000);
  });

  it('keeps the written year for date-only values in every timezone', () => {
    expect(getYearFromDate('2027-01-01')).toBe(2027);
    expect(getYearFromDate('2027-01-01T00:00:00.000Z')).toBe(2027);
    expect(getYearFromDate('2027-02-31')).toBeNull();
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

    expect(note).toContain('ajuste anual del 12% acumulativo desde la firma del contrato');
    expect(note).toContain('seña de $ 7.000');
    expect(note).not.toContain('15%');
  });

  it('mentions simple annual adjustment in the formal note when tipoAjusteAnual is simple', () => {
    const note = buildFormalBudgetBookingNote({
      hasAnnualAdjustment: true,
      adjustmentPct: 15,
      bookingDepositAmount: 5000,
      currentYear: 2026,
      tipoAjusteAnual: 'simple',
    });

    expect(note).toContain('ajuste anual del 15% simple desde la firma del contrato');
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
