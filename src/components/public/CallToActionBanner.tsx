'use client';

import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallToActionBannerProps {
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  variant?: 'purple' | 'dark' | 'green';
  className?: string;
}

export function CallToActionBanner({
  headline = '¿Listo para crear momentos únicos?',
  subheadline = 'Contactanos hoy y empezamos a planificar juntos la celebración de tus sueños. Sin compromiso.',
  ctaLabel = '¡Hablemos por WhatsApp!',
  whatsappNumber = '59899123456',
  whatsappMessage = '¡Hola AK Producciones! Quiero consultar sobre sus servicios de eventos.',
  variant = 'purple',
  className,
}: CallToActionBannerProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const gradients: Record<typeof variant, string> = {
    purple: 'from-purple-700 via-purple-600 to-fuchsia-600',
    dark: 'from-slate-900 via-slate-800 to-slate-900',
    green: 'from-green-600 via-emerald-600 to-teal-600',
  };

  return (
    <section
      className={cn(
        'py-20 px-4 bg-gradient-to-br text-white',
        gradients[variant],
        className
      )}
    >
      <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl font-black leading-tight">{headline}</h2>
        <p className="text-lg text-white/80 max-w-xl leading-relaxed">{subheadline}</p>

        {/* CTA Button */}
        <a href={waHref} target="_blank" rel="noopener noreferrer">
          <button
            className={cn(
              'flex items-center gap-3 px-8 py-4 rounded-2xl',
              'bg-[#25D366] hover:bg-[#1eb356]',
              'text-white font-black text-base uppercase tracking-widest',
              'shadow-xl shadow-black/20',
              'transition-all duration-300 hover:scale-105 active:scale-95',
              'animate-pulse hover:animate-none motion-reduce:animate-none'
            )}
          >
            <MessageSquare className="w-5 h-5 shrink-0" />
            {ctaLabel}
          </button>
        </a>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {['✅ Respuesta en 24 hs', '🔒 Sin compromiso', '💳 Pago en cuotas'].map((item) => (
            <span
              key={item}
              className="text-xs font-bold text-white/70 bg-white/10 rounded-full px-3 py-1.5"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
