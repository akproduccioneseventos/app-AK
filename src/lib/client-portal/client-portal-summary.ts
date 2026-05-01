export type PortalGuest = {
  rsvp?: string | null;
  partySize?: number | null;
};

export type PortalPaymentRecord = {
  monto?: number | null;
  estadoPago?: string | null;
  estado?: string | null;
};

export type PortalPaymentNotification = {
  monto?: number | null;
  estado?: string | null;
};

export type GuestStats = {
  recordsTotal: number;
  total: number;
  confirmed: number;
  pending: number;
  maybe: number;
  rejected: number;
  needsAction: number;
};

export type PaymentSummary = {
  total: number;
  paid: number;
  balance: number;
  paidPercent: number;
  pendingReviewCount: number;
  pendingReviewAmount: number;
  isFullyPaid: boolean;
};

export type GuestIncreaseEstimate = {
  adultDelta: number;
  childDelta: number;
  weightedGuests: number;
  basePerGuest: number;
  subtotalBeforeAnnualAdjustment: number;
  annualAdjustmentPercent: number;
  annualAdjustmentAmount: number;
  additionalTotal: number;
  newTotal: number;
};

const moneyFormatter = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function positiveAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function wholePeople(value: unknown): number {
  const amount = Math.floor(Number(value));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function parsePortalMoneyInput(value: unknown): number {
  if (typeof value === 'number') return positiveAmount(value);

  const raw = String(value ?? '').trim();
  if (!raw) return 0;

  const onlyMoneyChars = raw.replace(/[^\d.,-]/g, '');
  if (!onlyMoneyChars) return 0;

  const hasComma = onlyMoneyChars.includes(',');
  const hasDot = onlyMoneyChars.includes('.');
  let normalized = onlyMoneyChars;

  if (hasComma && hasDot) {
    normalized = onlyMoneyChars.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    const [, decimals = ''] = onlyMoneyChars.split(',');
    normalized = decimals.length > 0 && decimals.length <= 2
      ? onlyMoneyChars.replace(',', '.')
      : onlyMoneyChars.replace(/,/g, '');
  } else if (hasDot) {
    const parts = onlyMoneyChars.split('.');
    const last = parts[parts.length - 1] ?? '';
    normalized = parts.length > 1 && last.length === 3 ? parts.join('') : onlyMoneyChars;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function formatPortalMoney(amount?: number | null): string {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 'Sin monto';
  return moneyFormatter.format(value);
}

export function getGuestStats(guests: PortalGuest[] = []): GuestStats {
  return guests.reduce<GuestStats>((stats, guest) => {
    const partySize = Math.max(1, wholePeople(guest.partySize) || 1);
    const status = normalizeText(guest.rsvp || 'pendiente');

    stats.recordsTotal += 1;
    stats.total += partySize;

    if (status.includes('confirm')) {
      stats.confirmed += partySize;
      return stats;
    }

    if (status.includes('rechaz') || status.includes('cancel') || status === 'no') {
      stats.rejected += partySize;
      return stats;
    }

    if (status.includes('tal vez') || status.includes('talvez') || status.includes('maybe')) {
      stats.maybe += partySize;
      stats.needsAction += partySize;
      return stats;
    }

    stats.pending += partySize;
    stats.needsAction += partySize;
    return stats;
  }, {
    recordsTotal: 0,
    total: 0,
    confirmed: 0,
    pending: 0,
    maybe: 0,
    rejected: 0,
    needsAction: 0,
  });
}

function isConfirmedPayment(payment: PortalPaymentRecord): boolean {
  const status = normalizeText(payment.estadoPago ?? payment.estado ?? 'confirmado');
  return status !== 'pendiente_confirmacion'
    && status !== 'pendiente confirmacion'
    && status !== 'pendiente'
    && status !== 'rechazado'
    && status !== 'rechazada';
}

export function getPortalPaymentSummary(input: {
  total?: number | null;
  payments?: PortalPaymentRecord[] | null;
  notifications?: PortalPaymentNotification[] | null;
}): PaymentSummary {
  const total = positiveAmount(input.total);
  const payments = input.payments ?? [];
  const notifications = input.notifications ?? [];

  const confirmedPayments = payments.filter(isConfirmedPayment);
  const pendingPayments = payments.filter(payment => !isConfirmedPayment(payment));
  const pendingNotifications = notifications.filter(notification => normalizeText(notification.estado) === 'pendiente');
  const approvedNotifications = notifications.filter(notification => normalizeText(notification.estado) === 'aprobado');

  const paidFromBudget = confirmedPayments.reduce((sum, payment) => sum + positiveAmount(payment.monto), 0);
  const paidFromNotifications = payments.length === 0
    ? approvedNotifications.reduce((sum, notification) => sum + positiveAmount(notification.monto), 0)
    : 0;
  const pendingReviewAmount = [
    ...pendingPayments.map(payment => payment.monto),
    ...pendingNotifications.map(notification => notification.monto),
  ].reduce((sum, amount) => sum + positiveAmount(amount), 0);

  const paid = roundMoney(paidFromBudget + paidFromNotifications);
  const balance = roundMoney(Math.max(0, total - paid));
  const paidPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return {
    total,
    paid,
    balance,
    paidPercent,
    pendingReviewCount: pendingPayments.length + pendingNotifications.length,
    pendingReviewAmount: roundMoney(pendingReviewAmount),
    isFullyPaid: total > 0 && balance === 0,
  };
}

export function estimateGuestIncrease(input: {
  currentTotal?: number | null;
  currentGuestCount?: number | null;
  adultDelta?: number | null;
  childDelta?: number | null;
  annualAdjustmentPercent?: number | null;
}): GuestIncreaseEstimate {
  const currentTotal = positiveAmount(input.currentTotal);
  const currentGuestCount = Math.max(1, wholePeople(input.currentGuestCount) || 1);
  const adultDelta = wholePeople(input.adultDelta);
  const childDelta = wholePeople(input.childDelta);
  const annualAdjustmentPercent = positiveAmount(input.annualAdjustmentPercent ?? 15);
  const weightedGuests = adultDelta + childDelta * 0.65;
  const basePerGuest = currentTotal > 0 ? currentTotal / currentGuestCount : 0;
  const subtotalBeforeAnnualAdjustment = roundMoney(basePerGuest * weightedGuests);
  const additionalTotal = roundMoney(subtotalBeforeAnnualAdjustment * (1 + annualAdjustmentPercent / 100));
  const annualAdjustmentAmount = roundMoney(additionalTotal - subtotalBeforeAnnualAdjustment);

  return {
    adultDelta,
    childDelta,
    weightedGuests,
    basePerGuest: roundMoney(basePerGuest),
    subtotalBeforeAnnualAdjustment,
    annualAdjustmentPercent,
    annualAdjustmentAmount,
    additionalTotal,
    newTotal: roundMoney(currentTotal + additionalTotal),
  };
}

export function buildWhatsAppHref(contact: string | undefined, eventName: string): string {
  const digits = String(contact ?? '').replace(/\D/g, '');
  const text = encodeURIComponent(`Hola AK, soy cliente del evento "${eventName}" y quiero hacer una consulta.`);

  if (digits.length >= 7) {
    return `https://wa.me/${digits}?text=${text}`;
  }

  return `https://wa.me/?text=${text}`;
}
