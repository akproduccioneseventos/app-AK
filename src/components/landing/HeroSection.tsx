'use client';

import { MessageSquare, ChevronDown, Zap } from 'lucide-react';
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
  subheadline = 'Bodas, XV Años, Cumpleaños y más — producción integral con calidad premium en Uruguay.',
  backgroundImageUrl = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85&auto=format&fit=crop',
  promoActiva,
}: HeroSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola AK Producciones! Vi su página y me gustaría cotizar mi evento.'
  )}`;

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-slate-900/70 to-fuchsia-900/60" />

      {/* Decorative particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute rounded-full opacity-20 animate-pulse',
              i % 2 === 0 ? 'bg-purple-400' : 'bg-pink-400'
            )}
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              top: `${10 + i * 15}%`,
              left: `${5 + i * 18}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Promo badge */}
        {promoActiva && (
          <a
            href="#promo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-black uppercase tracking-widest mb-4 hover:bg-yellow-400/30 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            🔥 PROMO ACTIVA — {promoActiva.titulo}
          </a>
        )}

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
          Producción Integral de Eventos
        </div>

        {/* Headline */}
        <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] mb-6 drop-shadow-2xl">
          {headline.split('\n').map((line, i) => (
            <span key={i} className={cn('block', i === 1 && 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300')}>
              {line}
            </span>
          ))}
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
          {subheadline}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="hero-cta-button"
            className={cn(
              'flex items-center gap-3 px-8 py-4 rounded-2xl',
              'bg-[#25D366] hover:bg-[#1eb356]',
              'text-white font-black text-base uppercase tracking-widest',
              'shadow-2xl shadow-green-900/40',
              'transition-all duration-300 hover:scale-105 active:scale-95',
              'min-w-[220px] justify-center'
            )}
          >
            <MessageSquare className="w-6 h-6 shrink-0" />
            ¡Cotizá tu evento!
          </a>
          <a
            href="/simulador-ak"
            className={cn(
              'flex items-center gap-3 px-8 py-4 rounded-2xl',
              'bg-white/10 backdrop-blur-sm hover:bg-white/20',
              'text-white font-black text-base uppercase tracking-widest',
              'border border-white/30',
              'transition-all duration-300 hover:scale-105 active:scale-95',
              'min-w-[220px] justify-center'
            )}
          >
            Ver Simulador
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto">
          {[
            { value: '500+', label: 'Eventos' },
            { value: '10+', label: 'Años' },
            { value: '100%', label: 'Dedicación' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-white drop-shadow">{stat.value}</div>
              <div className="text-xs font-bold text-white/60 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#servicios"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors animate-bounce"
        aria-label="Scroll hacia abajo"
      >
        <ChevronDown className="w-8 h-8" />
      </a>
    </section>
  );
}
