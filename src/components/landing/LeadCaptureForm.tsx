'use client';

import { useState } from 'react';
import { MessageSquare, Send, Loader2, Check } from 'lucide-react';
import { saveLead, type LandingLeadData } from '@/app/actions/crm';
import { cn } from '@/lib/utils';

interface LeadCaptureFormProps {
  fuente: LandingLeadData['fuente'];
  whatsappNumber?: string;
  tipoEventoDefault?: string;
  title?: string;
  subtitle?: string;
}

export function LeadCaptureForm({
  fuente,
  whatsappNumber = '59899123456',
  tipoEventoDefault = '',
  title = '¡Cotizá tu Evento!',
  subtitle = 'Completá el formulario y te contactamos en menos de 24 horas.',
}: LeadCaptureFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Por favor completá nombre y teléfono.');
      return;
    }
    setError('');
    setLoading(true);

    const data: LandingLeadData = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim() || undefined,
      tipoEvento: form.tipoEvento || undefined,
      fechaEstimada: form.fechaEstimada || undefined,
      invitados: form.invitados ? parseInt(form.invitados) : undefined,
      mensaje: form.mensaje.trim() || undefined,
      fuente,
    };

    const res = await saveLead(data);
    setLoading(false);

    if (res.success) {
      setSent(true);
      // Open WhatsApp with pre-filled message
      const parts = [
        `Hola AK Producciones! 👋`,
        `Mi nombre es *${data.nombre}*.`,
        data.tipoEvento && `Tipo de evento: *${data.tipoEvento}*`,
        data.fechaEstimada && `Fecha estimada: *${data.fechaEstimada}*`,
        data.invitados && `Cantidad de invitados: *${data.invitados}*`,
        data.mensaje && `Mensaje: ${data.mensaje}`,
        `\n¡Me gustaría cotizar mi evento!`,
      ].filter(Boolean).join('\n');

      setTimeout(() => {
        window.open(
          `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(parts)}`,
          '_blank'
        );
      }, 500);
    } else {
      setError(res.error || 'Error al enviar. Intentá de nuevo.');
    }
  };

  if (sent) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">¡Gracias!</h3>
        <p className="text-slate-600 text-sm mb-4">
          Recibimos tu consulta. Te abrimos WhatsApp para que podamos continuar la conversación.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-purple-900/10 p-8 border border-slate-100">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent',
                'transition-all placeholder:text-slate-400'
              )}
              placeholder="Tu nombre"
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
              WhatsApp / Teléfono *
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent',
                'transition-all placeholder:text-slate-400'
              )}
              placeholder="099 123 456"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
              Fecha estimada
            </label>
            <input
              type="date"
              value={form.fechaEstimada}
              onChange={(e) => setForm({ ...form, fechaEstimada: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent',
                'transition-all'
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
              Invitados estimados
            </label>
            <input
              type="number"
              value={form.invitados}
              onChange={(e) => setForm({ ...form, invitados: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent',
                'transition-all placeholder:text-slate-400'
              )}
              placeholder="Ej: 150"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
            Email (opcional)
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={cn(
              'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent',
              'transition-all placeholder:text-slate-400'
            )}
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
            ¿Algo que quieras contarnos?
          </label>
          <textarea
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            rows={3}
            className={cn(
              'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent',
              'transition-all placeholder:text-slate-400'
            )}
            placeholder="Salón, estilo, colores, ideas..."
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full flex items-center justify-center gap-3 py-4 rounded-2xl',
            'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700',
            'text-white font-black text-sm uppercase tracking-widest',
            'shadow-xl shadow-purple-900/30',
            'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100'
          )}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Enviando...</>
          ) : (
            <><Send className="w-5 h-5" />Enviar Consulta</>
          )}
        </button>

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
