export type CommercialDiscountMode = 'bonificacion_visual' | 'regalos_incluidos' | 'promo_mes';

export type CommercialDiscountInput = {
  targetFinalPrice: number;
  visualDiscountPercentage?: number;
  giftsValue?: number;
  mode?: CommercialDiscountMode;
};

export type CommercialDiscountBreakdown = {
  mode: CommercialDiscountMode;
  targetFinalPrice: number;
  visualDiscountPercentage: number;
  commercialListValue: number;
  visualDiscountValue: number;
  giftsValue: number;
  displayedTotalBeforeBenefits: number;
  finalPrice: number;
  savingsStoryValue: number;
  disclaimer: string;
};

const DEFAULT_VISUAL_DISCOUNT_PERCENTAGE = 15;

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

function positiveMoney(value?: number): number {
  if (!Number.isFinite(value ?? 0)) return 0;
  return Math.max(0, Number(value ?? 0));
}

function normalizeDiscountPercentage(value?: number): number {
  const percentage = Number(value ?? DEFAULT_VISUAL_DISCOUNT_PERCENTAGE);
  if (!Number.isFinite(percentage)) return DEFAULT_VISUAL_DISCOUNT_PERCENTAGE;
  return Math.min(90, Math.max(0, percentage));
}

export function buildCommercialFictitiousDiscount(input: CommercialDiscountInput): CommercialDiscountBreakdown {
  const finalPrice = roundMoney(positiveMoney(input.targetFinalPrice));
  const visualDiscountPercentage = normalizeDiscountPercentage(input.visualDiscountPercentage);
  const discountRate = visualDiscountPercentage / 100;
  const commercialListValue = discountRate >= 1 ? finalPrice : roundMoney(finalPrice / (1 - discountRate));
  const visualDiscountValue = roundMoney(Math.max(0, commercialListValue - finalPrice));
  const giftsValue = roundMoney(positiveMoney(input.giftsValue));
  const displayedTotalBeforeBenefits = roundMoney(commercialListValue + giftsValue);
  const savingsStoryValue = roundMoney(visualDiscountValue + giftsValue);

  return {
    mode: input.mode ?? 'bonificacion_visual',
    targetFinalPrice: finalPrice,
    visualDiscountPercentage,
    commercialListValue,
    visualDiscountValue,
    giftsValue,
    displayedTotalBeforeBenefits,
    finalPrice,
    savingsStoryValue,
    disclaimer: 'La bonificacion es una presentacion comercial. El total final corresponde al precio real configurado por AK Producciones.',
  };
}

export function formatCommercialMoneyUYU(value: number): string {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundMoney(value));
}

export function buildCommercialDiscountSummary(input: CommercialDiscountInput): string {
  const breakdown = buildCommercialFictitiousDiscount(input);
  return [
    `Valor comercial: ${formatCommercialMoneyUYU(breakdown.commercialListValue)}`,
    `Bonificacion ${breakdown.visualDiscountPercentage}%: -${formatCommercialMoneyUYU(breakdown.visualDiscountValue)}`,
    breakdown.giftsValue > 0 ? `Regalos incluidos: ${formatCommercialMoneyUYU(breakdown.giftsValue)}` : undefined,
    `Total final AK: ${formatCommercialMoneyUYU(breakdown.finalPrice)}`,
  ].filter(Boolean).join(' · ');
}

export function assertNoRealDiscountApplied(input: CommercialDiscountInput): boolean {
  const breakdown = buildCommercialFictitiousDiscount(input);
  return breakdown.finalPrice === roundMoney(positiveMoney(input.targetFinalPrice));
}

export function buildCommercialDiscountLineItems(input: CommercialDiscountInput): { label: string; value: number; kind: 'list' | 'benefit' | 'final' }[] {
  const breakdown = buildCommercialFictitiousDiscount(input);
  const items: { label: string; value: number; kind: 'list' | 'benefit' | 'final' }[] = [
    { label: 'Valor comercial de servicios', value: breakdown.commercialListValue, kind: 'list' },
    { label: `Bonificacion comercial ${breakdown.visualDiscountPercentage}%`, value: -breakdown.visualDiscountValue, kind: 'benefit' },
  ];

  if (breakdown.giftsValue > 0) {
    items.push({ label: 'Regalos incluidos', value: breakdown.giftsValue, kind: 'benefit' });
  }

  items.push({ label: 'Total final a contratar', value: breakdown.finalPrice, kind: 'final' });
  return items;
}
