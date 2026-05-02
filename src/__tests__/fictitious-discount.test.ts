import {
  assertNoRealDiscountApplied,
  buildCommercialDiscountLineItems,
  buildCommercialDiscountSummary,
  buildCommercialFictitiousDiscount,
  formatCommercialMoneyUYU,
} from '@/lib/commercial/fictitious-discount';

describe('commercial fictitious discount engine', () => {
  it('keeps final price equal to the real target price', () => {
    const breakdown = buildCommercialFictitiousDiscount({
      targetFinalPrice: 100000,
      visualDiscountPercentage: 15,
    });

    expect(breakdown.finalPrice).toBe(100000);
    expect(breakdown.commercialListValue).toBe(117647);
    expect(breakdown.visualDiscountValue).toBe(17647);
    expect(assertNoRealDiscountApplied({ targetFinalPrice: 100000, visualDiscountPercentage: 15 })).toBe(true);
  });

  it('adds gifts to the savings story without lowering final price', () => {
    const breakdown = buildCommercialFictitiousDiscount({
      targetFinalPrice: 100000,
      visualDiscountPercentage: 15,
      giftsValue: 12000,
    });

    expect(breakdown.finalPrice).toBe(100000);
    expect(breakdown.giftsValue).toBe(12000);
    expect(breakdown.savingsStoryValue).toBe(29647);
  });

  it('builds line items and summary', () => {
    const items = buildCommercialDiscountLineItems({ targetFinalPrice: 50000, visualDiscountPercentage: 10 });
    expect(items[0].kind).toBe('list');
    expect(items.at(-1)?.kind).toBe('final');
    expect(buildCommercialDiscountSummary({ targetFinalPrice: 50000 })).toContain('Total final AK');
    expect(formatCommercialMoneyUYU(50000)).toContain('50');
  });
});
