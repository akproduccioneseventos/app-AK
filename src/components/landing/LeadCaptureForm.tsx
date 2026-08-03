'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, Send, Loader2, Check } from 'lucide-react';
import { saveLead, type LandingLeadData } from '@/app/actions/crm';
import { cn } from '@/lib/utils';
import { commercialAttributionFromSearchParams } from '@/lib/commercial/acquisition';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

interface LeadCaptureFormProps {
  fuente: LandingLeadData['fuente'];
  whatsappNumber?: string;
  tipoEventoDefault?: string;
  title?: string;
  subtitle?: string;
}

export function LeadCaptureForm({
  fuente,
  whatsappNumber = AK_WHATSAPP_NUMBER,
  tipoEventoDefault = '',
  title = 'Diseñá tu evento a medida',
  subtitle = 'Completá el formulario y te contactamos en menos de 24 horas con tu propuesta.',
}: LeadCaptureFormProps) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tipoEvento: tipoEventoDefault,
    fechaEstimada: '',
    invitados: '',
    mensaje: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Por favor completá nombre y teléfono.');
      return;
    }
    setError('');
    setLoading(true);

    const parsedInvitados = form.invitados ? parseInt(form.invitados, 10) : undefined;

    const data: LandingLeadData = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim() || undefined,
      tipoEvento: form.tipoEvento || undefined,
      fechaEstimada: form.fechaEstimada || undefined,
      invitados: Number.isNaN(parsedInvitados) ? undefined : parsedInvitados,
      mensaje: form.mensaje.trim() || undefined,
      fuente,
      acquisition: {
        ...commercialAttributionFromSearchParams(searchParams, 'landing'),
        entryPath: window.location.pathname,
      },
      marketingConsent,
    };

    try {
      const res = await saveLead(data);
      setLoading(false);

      if (res.success) {
        const parts = [
          `Hola AK Producciones! 👋`,
          `Mi nombre es *${data.nombre}*.`,
          data.tipoEvento && `Tipo de evento: *${data.tipoEvento}*`,
          data.fechaEstimada && `Fecha estimada: *${data.fechaEstimada}*`,
          data.invitados && `Cantidad de invitados: *${data.invitados}*`,
          data.mensaje && `Mensaje: ${data.mensaje}`,
          `\n¡Me gustaría cotizar mi evento!`,
        ].filter(Boolean).join('\n');

        const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(parts)}`;
        setWhatsappUrl(waUrl);
        setSent(true);

        // Intentar abrir WhatsApp automáticamente (puede ser bloqueado por el navegador)
        try {
          window.open(waUrl, '_blank');
        } catch {
          // Si el navegador lo bloquea, el usuario tiene el botón manual abajo
        }
      } else {
        setError(res.error || 'Error al enviar. Intentá de nuevo.');
      }
    } catch {
      setLoading(false);
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.');
    }
  };

  if (sent) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">¡Gracias!</h3>
        <p className="text-slate-600 text-sm mb-5">
          Recibimos tu consulta. Continuá la conversación por WhatsApp para coordinar tu evento.
        </p>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3',
              'bg-green-600 hover:bg-green-700 text-white font-bold text-sm',
              'transition-all duration-200 shadow-lg shadow-green-600/20',
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Abrir WhatsApp
          </a>
        )}
        <div className="mt-4">
          <button
            onClick={() => { setSent(false); setWhatsappUrl(''); }}
            className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
          >
            Enviar otra consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl shadow-zinc-950/10 p-6 sm:p-8 border border-zinc-200">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="lead-nombre" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
              Nombre *
            </label>
            <input
              id="lead-nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-lg border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
                'transition-all placeholder:text-slate-400',
                error && !form.nombre.trim() ? 'border-red-400' : 'border-zinc-300'
              )}
              placeholder="Tu nombre"
              autoComplete="name"
              aria-required="true"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="lead-telefono" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
              WhatsApp / Teléfono *
            </label>
            <input
              id="lead-telefono"
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-lg border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
                'transition-all placeholder:text-slate-400',
                error && !form.telefono.trim() ? 'border-red-400' : 'border-zinc-300'
              )}
              placeholder="099 123 456"
              autoComplete="tel"
              aria-required="true"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lead-fecha" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
              Fecha estimada
            </label>
            <input
              id="lead-fecha"
              type="date"
              value={form.fechaEstimada}
              onChange={(e) => setForm({ ...form, fechaEstimada: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-lg border border-zinc-300 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
                'transition-all'
              )}
            />
          </div>
          <div>
            <label htmlFor="lead-invitados" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
              Invitados estimados
            </label>
            <input
              id="lead-invitados"
              type="number"
              value={form.invitados}
              onChange={(e) => setForm({ ...form, invitados: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-lg border border-zinc-300 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
                'transition-all placeholder:text-slate-400'
              )}
              placeholder="Ej: 150"
              min="1"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <label htmlFor="lead-email" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
            Email (opcional)
          </label>
          <input
            id="lead-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={cn(
              'w-full px-4 py-3 rounded-lg border border-zinc-300 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
              'transition-all placeholder:text-slate-400'
            )}
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="lead-mensaje" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
            ¿Algo que quieras contarnos?
          </label>
          <textarea
            id="lead-mensaje"
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            rows={3}
            className={cn(
              'w-full px-4 py-3 rounded-lg border border-zinc-300 text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
              'transition-all placeholder:text-slate-400'
            )}
            placeholder="Salón, estilo, colores, ideas..."
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm" role="alert">{error}</p>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-slate-600">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) => setMarketingConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-red-700"
          />
          <span>Acepto que AK Producciones use mis datos para medir esta campaña y enviarme promociones. Es opcional.</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full flex items-center justify-center gap-3 py-4 rounded-lg',
            'bg-red-700 hover:bg-red-800',
            'text-white font-black text-sm uppercase tracking-widest',
            'shadow-lg shadow-red-950/20',
            'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100'
          )}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Verificando...</>
          ) : (
            <><Send className="w-5 h-5" />Verificar Disponibilidad</>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <span>Tus datos se usan para responder esta consulta. La medición publicitaria es opcional.</span>
        </div>

        <p className="text-center text-xs text-slate-400">
          También podés escribirnos directo por{' '}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola AK Producciones! Me gustaría cotizar mi evento.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 font-bold hover:underline"
          >
            <MessageSquare className="w-3 h-3 inline mr-0.5" />
            WhatsApp
          </a>
        </p>
      </form>
    </div>
  );
}
