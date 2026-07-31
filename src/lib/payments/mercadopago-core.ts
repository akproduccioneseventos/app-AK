import { createHmac, timingSafeEqual } from 'crypto';
import type { PagoCliente, Presupuesto } from '@/types/presupuesto';
import {
  roundMoney,
  validatePaymentAgainstBudget,
} from '@/lib/budget/financial-guardrails';

export type MercadoPagoCheckoutPurpose = 'deposit' | 'balance';

export type MercadoPagoSessionStatus =
  | 'creating'
  | 'ready'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'failed';

export interface MercadoPagoPaymentSnapshot {
  id: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  transaction_amount_refunded?: number;
  currency_id?: string;
  date_created?: string;
  date_approved?: string;
  live_mode?: boolean;
  installments?: number;
}

export type MercadoPagoBudgetReconciliation = {
  presupuesto: Presupuesto;
  status: MercadoPagoSessionStatus;
  changed: boolean;
  requiresReview: boolean;
  reviewReason?: string;
};

export function resolveMercadoPagoCheckoutAmount(input: {
  balance: number;
  purpose: MercadoPagoCheckoutPurpose;
  depositAmount: number;
}): number {
  const balance = Math.max(0, Math.round(Number(input.balance) || 0));
  const deposit = Math.max(0, Math.round(Number(input.depositAmount) || 0));
  if (balance <= 0) throw new Error('El presupuesto no tiene saldo pendiente.');
  if (input.purpose === 'balance') return balance;
  if (input.purpose === 'deposit') return Math.min(balance, deposit);
  throw new Error('La opcion de pago no es valida.');
}

export function mapMercadoPagoPaymentStatus(status?: string): MercadoPagoSessionStatus {
  switch (String(status || '').toLowerCase()) {
    case 'approved':
      return 'approved';
    case 'rejected':
    case 'cancelled':
      return 'rejected';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    case 'pending':
    case 'in_process':
    case 'authorized':
    case 'in_mediation':
      return 'pending';
    default:
      return 'pending';
  }
}

function buildProviderPayment(input: {
  sessionId: string;
  amount: number;
  chargedAmount?: number;
  feeBaseAmount?: number;
  payment: MercadoPagoPaymentSnapshot;
  refundedAmount?: number;
}): PagoCliente {
  return {
    id: `pago_mp_${String(input.payment.id)}`,
    fecha: input.payment.date_approved || input.payment.date_created || new Date().toISOString(),
    monto: input.amount,
    metodoPago: 'MercadoPago',
    referencia: `Mercado Pago #${String(input.payment.id)}`,
    estadoPago: 'confirmado',
    montoCobrado: roundMoney(input.chargedAmount ?? input.payment.transaction_amount),
    montoReintegrado: roundMoney(input.refundedAmount),
    recargoFinanciero: Math.max(
      0,
      roundMoney(input.chargedAmount ?? input.payment.transaction_amount)
        - roundMoney(input.feeBaseAmount ?? input.amount),
    ),
    cuotasFinanciacion: Math.max(1, Math.round(Number(input.payment.installments) || 1)),
    proveedorPago: 'mercadopago',
    proveedorPagoId: String(input.payment.id),
    sesionPagoId: input.sessionId,
    estadoProveedorPago: input.payment.status,
  };
}

export function reconcileMercadoPagoBudget(input: {
  presupuesto: Presupuesto;
  sessionId: string;
  amount: number;
  chargedAmount?: number;
  payment: MercadoPagoPaymentSnapshot;
}): MercadoPagoBudgetReconciliation {
  const mappedStatus = mapMercadoPagoPaymentStatus(input.payment.status);
  const grossCharged = Math.max(
    1,
    roundMoney(input.chargedAmount ?? input.payment.transaction_amount ?? input.amount),
  );
  const grossRefunded = Math.min(
    grossCharged,
    roundMoney(input.payment.transaction_amount_refunded),
  );
  const refundedAmount = mappedStatus === 'refunded' && grossRefunded === 0
    ? input.amount
    : Math.min(input.amount, Math.round(input.amount * grossRefunded / grossCharged));
  const hasRefund = mappedStatus === 'refunded' || grossRefunded > 0;
  const status = hasRefund ? 'refunded' : mappedStatus;
  const netAmount = hasRefund
    ? Math.max(0, input.amount - (refundedAmount || input.amount))
    : input.amount;
  const payments = [...(input.presupuesto.pagosCliente || [])];
  const providerPaymentId = String(input.payment.id);
  const existingIndex = payments.findIndex((item) => item.proveedorPagoId === providerPaymentId);
  let changed = false;
  let requiresReview = false;
  let reviewReason: string | undefined;

  if (status === 'approved' && existingIndex === -1) {
    const validation = validatePaymentAgainstBudget(input.presupuesto, netAmount);
    if (!validation.ok) {
      requiresReview = true;
      reviewReason = validation.error;
    }
    payments.push(buildProviderPayment({
      sessionId: input.sessionId,
      amount: netAmount,
      chargedAmount: grossCharged,
      feeBaseAmount: input.amount,
      payment: input.payment,
    }));
    changed = true;
  } else if (status === 'refunded' && existingIndex >= 0) {
    const current = payments[existingIndex];
    const nextState = netAmount > 0 ? 'confirmado' : 'rechazado';
    if (
      current.estadoPago !== nextState
      || roundMoney(current.monto) !== roundMoney(netAmount)
      || roundMoney(current.montoReintegrado) !== roundMoney(refundedAmount || input.amount)
    ) {
      payments[existingIndex] = {
        ...current,
        monto: netAmount > 0 ? netAmount : current.monto,
        montoReintegrado: refundedAmount || input.amount,
        estadoPago: nextState,
        motivoRechazo: nextState === 'rechazado'
          ? `Mercado Pago informo ${input.payment.status || 'devolucion'}.`
          : undefined,
        estadoProveedorPago: input.payment.status,
      };
      changed = true;
    }
  } else if (status === 'refunded' && existingIndex === -1 && netAmount > 0) {
    const validation = validatePaymentAgainstBudget(input.presupuesto, netAmount);
    if (!validation.ok) {
      requiresReview = true;
      reviewReason = validation.error;
    }
    payments.push(buildProviderPayment({
      sessionId: input.sessionId,
      amount: netAmount,
      chargedAmount: grossCharged,
      feeBaseAmount: input.amount,
      refundedAmount,
      payment: input.payment,
    }));
    changed = true;
  }

  return {
    presupuesto: changed
      ? { ...input.presupuesto, pagosCliente: payments }
      : input.presupuesto,
    status,
    changed,
    requiresReview,
    reviewReason,
  };
}

function parseSignatureHeader(signature: string): { timestamp?: string; hash?: string } {
  const parsed: { timestamp?: string; hash?: string } = {};
  for (const part of signature.split(',')) {
    const [rawKey, ...rawValue] = part.split('=');
    const key = rawKey?.trim();
    const value = rawValue.join('=').trim();
    if (key === 'ts') parsed.timestamp = value;
    if (key === 'v1') parsed.hash = value;
  }
  return parsed;
}

export function verifyMercadoPagoWebhookSignature(input: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  if (!input.signature || !input.requestId || !input.dataId || !input.secret) return false;
  const { timestamp, hash } = parseSignatureHeader(input.signature);
  if (!timestamp || !hash || !/^[a-f0-9]{64}$/i.test(hash)) return false;

  const normalizedDataId = input.dataId.toLowerCase();
  const manifest = `id:${normalizedDataId};request-id:${input.requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', input.secret).update(manifest).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(hash, 'hex');
  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
}
