'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type PaymentStatus =
  | 'creating'
  | 'ready'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'failed';

type PaymentResult = {
  status: PaymentStatus;
  amount: number;
  serviceAmount: number;
  surchargeAmount: number;
  purpose: 'deposit' | 'balance';
  requiresReview: boolean;
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  maximumFractionDigits: 0,
}).format(amount);

export function MercadoPagoResultClient({ sessionId }: { sessionId: string }) {
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [budgetReturnUrl, setBudgetReturnUrl] = useState('/');

  useEffect(() => {
    if (!sessionId) return;
    const stored = sessionStorage.getItem(`ak-mp-return:${sessionId}`);
    if (stored?.startsWith(window.location.origin)) {
      setBudgetReturnUrl(stored.slice(window.location.origin.length) || '/');
    }
  }, [sessionId]);

  const loadStatus = useCallback(async () => {
    if (!sessionId) {
      setError('No encontramos la referencia del pago.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/payments/mercadopago/status?session=${encodeURIComponent(sessionId)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json() as PaymentResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'No se pudo consultar el pago.');
      setResult(payload);
      setError('');
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'No se pudo consultar el pago.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!result || !['creating', 'ready', 'pending'].includes(result.status)) return;
    const timer = window.setInterval(() => void loadStatus(), 5000);
    return () => window.clearInterval(timer);
  }, [loadStatus, result]);

  const content = useMemo(() => {
    if (!result) return null;
    if (result.status === 'approved') {
      return {
        icon: CheckCircle2,
        iconClass: 'text-emerald-600',
        title: result.requiresReview ? 'Pago recibido, en revision' : 'Pago confirmado',
        description: result.requiresReview
          ? 'Mercado Pago aprobo el cobro. AK revisara el saldo porque cambio durante el proceso.'
          : 'Mercado Pago aprobo el cobro y el saldo del presupuesto se actualizo automaticamente.',
      };
    }
    if (result.status === 'rejected' || result.status === 'failed') {
      return {
        icon: AlertTriangle,
        iconClass: 'text-red-600',
        title: 'El pago no se completo',
        description: 'No registramos ningun ingreso. Podes volver al presupuesto e intentarlo nuevamente.',
      };
    }
    if (result.status === 'refunded') {
      return {
        icon: AlertTriangle,
        iconClass: 'text-amber-600',
        title: 'Pago devuelto',
        description: 'Mercado Pago informo una devolucion o contracargo. El saldo fue restaurado.',
      };
    }
    return {
      icon: Clock3,
      iconClass: 'text-amber-600',
      title: 'Pago pendiente',
      description: 'Estamos esperando la confirmacion de Mercado Pago. Esta pantalla se actualiza sola.',
    };
  }, [result]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Consultando el pago...
        </div>
      </main>
    );
  }

  if (error || !result || !content) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <section className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">No pudimos consultar el pago</h1>
          <p className="mt-2 text-sm text-slate-600">{error || 'Intenta nuevamente.'}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Volver al inicio</Link>
          </Button>
        </section>
      </main>
    );
  }

  const Icon = content.icon;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
          <Icon className={`h-9 w-9 ${content.iconClass}`} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">{content.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{content.description}</p>
        <div className="mt-6 border-y border-slate-100 py-5">
          <p className="text-xs font-bold uppercase text-slate-500">
            Total procesado
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{formatCurrency(result.amount)}</p>
          <p className="mt-2 text-xs text-slate-500">
            {result.purpose === 'deposit' ? 'Sena' : 'Saldo'}: {formatCurrency(result.serviceAmount)}
            {' + '}recargo financiero: {formatCurrency(result.surchargeAmount)}
          </p>
        </div>
        <Button asChild className="mt-6 w-full bg-[#009EE3] hover:bg-[#0089c7]">
          <Link href={budgetReturnUrl}>{budgetReturnUrl === '/' ? 'Volver al inicio' : 'Volver al presupuesto'}</Link>
        </Button>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          La confirmacion proviene directamente de Mercado Pago.
        </div>
      </section>
    </main>
  );
}
