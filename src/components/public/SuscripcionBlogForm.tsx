'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SuscripcionBlogForm({
  variant = 'light',
  className,
}: {
  variant?: 'light' | 'dark';
  className?: string;
}) {
  const [email, setEmail] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isDark = variant === 'dark';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    if (!consentimiento) {
      setFeedback({
        type: 'error',
        message: 'Tenés que aceptar recibir los consejos por mail para suscribirte.',
      });
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFeedback({
        type: 'error',
        message: 'Ingresá tu mail para suscribirte.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/suscribirse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, consentimiento }),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !data?.success) {
        setFeedback({
          type: 'error',
          message:
            data?.message ||
            'No pudimos guardar tu suscripción. Probá de nuevo en unos minutos.',
        });
        return;
      }

      setFeedback({
        type: 'success',
        message:
          data.message ||
          '¡Listo! Quedaste suscripto a los consejos de AK Producciones.',
      });
      setEmail('');
      setConsentimiento(false);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Error de conexión al enviar tu suscripción. Probá de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full rounded-xl border p-4 sm:p-5 space-y-3',
        isDark
          ? 'border-white/15 bg-white/5 text-white'
          : 'border-slate-200 bg-slate-50 text-slate-900',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Mail className={cn('h-4 w-4 shrink-0', isDark ? 'text-red-400' : 'text-red-700')} />
        <p className="text-sm font-bold leading-snug">
          Recibí los consejos nuevos por mail, gratis
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@mail.com"
          aria-label="Tu correo electrónico"
          disabled={loading}
          className={cn(
            'w-full min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2',
            isDark
              ? 'border-white/20 bg-zinc-900 text-white placeholder:text-zinc-400 focus:border-red-500 focus:ring-red-500/30'
              : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:ring-red-700/20',
          )}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Suscribirme'
          )}
        </button>
      </div>

      <label
        className={cn(
          'flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer',
          isDark ? 'text-zinc-300' : 'text-slate-700',
        )}
      >
        <input
          type="checkbox"
          name="consentimiento"
          required
          checked={consentimiento}
          onChange={(e) => setConsentimiento(e.target.checked)}
          disabled={loading}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-red-700"
        />
        <span>
          Acepto recibir los consejos por mail y puedo darme de baja cuando quiera.
        </span>
      </label>

      <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-zinc-400' : 'text-slate-500')}>
        Tus datos quedan guardados sólo para enviarte consejos de AK Producciones y nunca se
        comparten con terceros.{' '}
        <Link
          href="/privacidad"
          className={cn(
            'underline underline-offset-2 transition-colors',
            isDark ? 'text-zinc-200 hover:text-white' : 'text-slate-700 hover:text-slate-950',
          )}
        >
          Política de privacidad
        </Link>
      </p>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
            feedback.type === 'success'
              ? isDark
                ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : isDark
                ? 'border-rose-500/40 bg-rose-950/50 text-rose-200'
                : 'border-rose-200 bg-rose-50 text-rose-700',
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </form>
  );
}
