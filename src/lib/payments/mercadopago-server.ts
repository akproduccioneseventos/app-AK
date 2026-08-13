import 'server-only';

import { randomUUID } from 'crypto';
import type { Presupuesto } from '@/types/presupuesto';
import { DEFAULT_BOOKING_DEPOSIT_AMOUNT } from '@/lib/budget/formal-budget';
import { montoDeSenia } from '@/lib/budget/monto-de-senia';
import {
  getBudgetPaymentSummary,
  roundMoney,
} from '@/lib/budget/financial-guardrails';
import { calculateMercadoPagoCuotas } from '@/lib/payments/mercadopago-calculator';
import {
  reconcileMercadoPagoBudget,
  resolveMercadoPagoCheckoutAmount,
  type MercadoPagoCheckoutPurpose,
  type MercadoPagoPaymentSnapshot,
  type MercadoPagoSessionStatus,
} from './mercadopago-core';

const API_BASE = 'https://api.mercadopago.com';
const SESSION_COLLECTION = 'mercadopago_checkout_sessions';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface MercadoPagoCheckoutSession {
  id: string;
  presupuestoId: string;
  purpose: MercadoPagoCheckoutPurpose;
  serviceAmount: number;
  amount: number;
  surchargeAmount: number;
  currency: 'UYU';
  status: MercadoPagoSessionStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  preferenceId?: string;
  checkoutUrl?: string;
  sandboxCheckoutUrl?: string;
  providerPaymentId?: string;
  providerStatus?: string;
  confirmedAt?: string;
  error?: string;
  requiresReview?: boolean;
  reviewReason?: string;
}

interface MercadoPagoPreferenceResponse {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
}

function getAccessToken(): string {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('Mercado Pago todavia no esta configurado.');
  return token;
}

export function isMercadoPagoReady(): boolean {
  return Boolean(
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()
    && process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim(),
  );
}

export function isMercadoPagoSandbox(): boolean {
  return process.env.MERCADO_PAGO_USE_SANDBOX !== 'false';
}

function getPublicOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://akproducciones.uy').replace(/\/+$/, '');
}

async function getDb() {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firebase no esta disponible para registrar el pago.');
  return dbAdmin;
}

async function mercadoPagoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({})) as T & { message?: string; error?: string };
    if (!response.ok) {
      throw new Error(payload.message || payload.error || `Mercado Pago respondio ${response.status}.`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPreferenceBody(session: MercadoPagoCheckoutSession, presupuesto: Presupuesto) {
  const origin = getPublicOrigin();
  const budgetNumber = presupuesto.numero || presupuesto.id.slice(-8);
  const concept = session.purpose === 'deposit' ? 'Sena' : 'Saldo';
  const resultUrl = `${origin}/pago/mercadopago?session=${encodeURIComponent(session.id)}`;

  return {
    items: [{
      id: `${presupuesto.id}:${session.purpose}`,
      title: `AK Producciones - ${concept} presupuesto ${budgetNumber}`,
      description: `${presupuesto.eventoTipo} - ${presupuesto.clienteNombre}`,
      quantity: 1,
      currency_id: 'UYU',
      unit_price: session.amount,
    }],
    external_reference: session.id,
    metadata: {
      presupuesto_id: presupuesto.id,
      checkout_purpose: session.purpose,
    },
    back_urls: {
      success: `${resultUrl}&return=success`,
      pending: `${resultUrl}&return=pending`,
      failure: `${resultUrl}&return=failure`,
    },
    notification_url: `${origin}/api/payments/mercadopago/webhook`,
    auto_return: 'approved',
    statement_descriptor: 'AK PRODUCCIONES',
    expires: true,
    expiration_date_from: session.createdAt,
    expiration_date_to: session.expiresAt,
  };
}

export async function createMercadoPagoCheckout(input: {
  presupuesto: Presupuesto;
  purpose: MercadoPagoCheckoutPurpose;
}): Promise<{ session: MercadoPagoCheckoutSession; checkoutUrl: string }> {
  const summary = getBudgetPaymentSummary(input.presupuesto, {
    includeAnnualAdjustment: true,
  });
  // La senia que le corresponde a ESTE cliente, no un valor fijo.
  //
  // Antes se cobraban siempre $5.000, que es el ultimo recurso. En un evento
  // grande el cliente apretaba "Pagar senia", pagaba cinco mil, y la reserva
  // quedaba senalada con una fraccion de lo acordado. La diferencia aparecia
  // recien al ir a cobrar el resto.
  const serviceAmount = resolveMercadoPagoCheckoutAmount({
    balance: summary.balance,
    purpose: input.purpose,
    depositAmount: montoDeSenia({
      seniaAcordada: input.presupuesto.senia,
      totalConAjuste: summary.total,
      porDefecto: DEFAULT_BOOKING_DEPOSIT_AMOUNT,
    }),
  });
  const financing = calculateMercadoPagoCuotas(serviceAmount);
  const now = new Date();
  const session: MercadoPagoCheckoutSession = {
    id: randomUUID(),
    presupuestoId: input.presupuesto.id,
    purpose: input.purpose,
    serviceAmount,
    amount: financing.totalWithSurcharge,
    surchargeAmount: financing.surchargeAmount,
    currency: 'UYU',
    status: 'creating',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
  const db = await getDb();
  const ref = db.collection(SESSION_COLLECTION).doc(session.id);
  await ref.set(session);

  try {
    const preference = await mercadoPagoFetch<MercadoPagoPreferenceResponse>('/checkout/preferences', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': session.id },
      body: JSON.stringify(buildPreferenceBody(session, input.presupuesto)),
    });
    const checkoutUrl = isMercadoPagoSandbox()
      ? preference.sandbox_init_point || preference.init_point
      : preference.init_point;
    if (!preference.id || !checkoutUrl) {
      throw new Error('Mercado Pago no devolvio un enlace de pago.');
    }
    const ready: MercadoPagoCheckoutSession = {
      ...session,
      status: 'ready',
      preferenceId: preference.id,
      checkoutUrl: preference.init_point,
      sandboxCheckoutUrl: preference.sandbox_init_point,
      updatedAt: new Date().toISOString(),
    };
    await ref.set(ready, { merge: true });
    return { session: ready, checkoutUrl };
  } catch (error) {
    await ref.set({
      status: 'failed',
      error: error instanceof Error ? error.message : 'No se pudo iniciar el pago.',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    throw error;
  }
}

export async function getMercadoPagoCheckoutSession(
  sessionId: string,
): Promise<MercadoPagoCheckoutSession | null> {
  const db = await getDb();
  const snapshot = await db.collection(SESSION_COLLECTION).doc(sessionId).get();
  return snapshot.exists ? snapshot.data() as MercadoPagoCheckoutSession : null;
}

export async function getMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPaymentSnapshot> {
  return mercadoPagoFetch<MercadoPagoPaymentSnapshot>(`/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
  });
}

export async function reconcileMercadoPagoPayment(payment: MercadoPagoPaymentSnapshot): Promise<{
  presupuestoId: string;
  sessionStatus: MercadoPagoSessionStatus;
  changed: boolean;
  requiresReview: boolean;
}> {
  const sessionId = payment.external_reference?.trim();
  if (!sessionId) throw new Error('El pago no tiene una referencia de checkout valida.');
  const providerPaymentId = String(payment.id || '').trim();
  if (!providerPaymentId) throw new Error('El pago no tiene identificador.');

  const db = await getDb();
  const sessionRef = db.collection(SESSION_COLLECTION).doc(sessionId);
  const budgetCollection = db.collection('presupuestos');
  let result = {
    presupuestoId: '',
    sessionStatus: 'pending' as MercadoPagoSessionStatus,
    changed: false,
    requiresReview: false,
  };

  await db.runTransaction(async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);
    if (!sessionSnapshot.exists) throw new Error('La sesion de pago no existe.');
    const session = sessionSnapshot.data() as MercadoPagoCheckoutSession;
    const currentBudgetRef = budgetCollection.doc(session.presupuestoId);
    const budgetSnapshot = await transaction.get(currentBudgetRef);
    if (!budgetSnapshot.exists) throw new Error('El presupuesto asociado no existe.');
    const presupuesto = budgetSnapshot.data() as Presupuesto;
    const amountMatches = roundMoney(payment.transaction_amount) === roundMoney(session.amount);
    const currencyMatches = payment.currency_id === session.currency;
    const environmentMatches = isMercadoPagoSandbox()
      ? payment.live_mode !== true
      : payment.live_mode === true;
    if (!amountMatches || !currencyMatches || !environmentMatches) {
      throw new Error('Los datos del pago no coinciden con la sesion creada.');
    }

    const reconciliation = reconcileMercadoPagoBudget({
      presupuesto,
      sessionId: session.id,
      amount: session.serviceAmount,
      chargedAmount: session.amount,
      payment,
    });
    const status = reconciliation.status;

    if (reconciliation.changed) {
      transaction.set(currentBudgetRef, {
        ...reconciliation.presupuesto,
        _syncedAt: new Date().toISOString(),
      }, { merge: false });
    }
    transaction.set(sessionRef, {
      status,
      providerPaymentId,
      providerStatus: payment.status,
      confirmedAt: status === 'approved' ? new Date().toISOString() : session.confirmedAt,
      requiresReview: reconciliation.requiresReview,
      reviewReason: reconciliation.reviewReason || null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    result = {
      presupuestoId: session.presupuestoId,
      sessionStatus: status,
      changed: reconciliation.changed,
      requiresReview: reconciliation.requiresReview,
    };
  });

  return result;
}
