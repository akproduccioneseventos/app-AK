'use client';

import { ArrowRight, MessageSquare, ChevronDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromoActiva } from '@/types/promo';

interface HeroSectionProps {
  whatsappNumber?: string;
  headline?: string;
  subheadline?: string;
  backgroundImageUrl?: string;
  promoActiva?: PromoActiva | null;
}

export function HeroSection({
  whatsappNumber = '59899123456',
  headline = 'Hacemos Realidad\ntu Celebración',
  subheadline = 'Bodas, XV Años, cumpleaños y eventos empresariales con producción integral, atención cercana y una experiencia digital simple para tus invitados.',
  backgroundImageUrl = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85&auto=format&fit=crop',
  promoActiva,
}: HeroSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola AK Producciones! Vi su página y me gustaría cotizar mi evento.'
  )}`;

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex items-center overflow-hidden bg-zinc-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(17,17,17,0.92)_0%,rgba(127,29,29,0.78)_50%,rgba(17,17,17,0.44)_100%)]" />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 1px, transparent 1px 96px)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-4xl text-left">
          {promoActiva && (
            <a
              href="#promo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/12 border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-4 hover:bg-white/18 transition-colors backdrop-blur-md"
            >
              <Zap className="w-3.5 h-3.5 text-red-200" />
              Promo activa: {promoActiva.titulo}
            </a>
          )}

          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-7">
            <span className="h-2 w-8 rounded-full bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.82)]" />
            AK Producciones Eventos
          </div>

          <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none mb-6 drop-shadow-2xl">
            {headline.split('\n').map((line, i) => (
              <span key={i} className={cn('block', i === 1 && 'text-red-100')}>
                {line}
              </span>
            ))}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-white/84 font-medium max-w-2xl mb-10 leading-relaxed">
            {subheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-cta-button"
              className={cn(
                'flex items-center gap-3 px-8 py-4 rounded-2xl',
                'bg-red-600 hover:bg-red-700',
                'text-white font-black text-base uppercase tracking-widest',
                'shadow-2xl shadow-red-950/40',
                'transition-all duration-300 hover:scale-[1.02] active:scale-95',
                'min-w-[220px] justify-center'
              )}
            >
              <MessageSquare className="w-6 h-6 shrink-0" />
              Cotizá tu evento
            </a>
            <a
              href="/simulador-ak"
              className={cn(
                'flex items-center gap-3 px-8 py-4 rounded-2xl',
                'bg-white text-zinc-950 hover:bg-red-50',
                'font-black text-base uppercase tracking-widest',
                'border border-white/70',
                'transition-all duration-300 hover:scale-[1.02] active:scale-95',
                'min-w-[220px] justify-center'
              )}
            >
              Ver simulador
              <ArrowRight className="w-5 h-5 shrink-0" />
            </a>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-3 max-w-lg">
            {[
              { value: '500+', label: 'Eventos' },
              { value: '10+', label: 'Años' },
              { value: '24/7', label: 'Acompañamiento' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/16 bg-white/10 backdrop-blur-md px-4 py-3 text-center">
                <div className="text-2xl sm:text-3xl font-black text-white drop-shadow">{stat.value}</div>
                <div className="text-[10px] font-bold text-white/64 uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <a
        href="#servicios"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/70 hover:text-white transition-colors animate-bounce"
        aria-label="Scroll hacia abajo"
      >
        <ChevronDown className="w-8 h-8" />
      </a>
    </section>
  );
}
