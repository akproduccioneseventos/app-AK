'use client';

import { MessageSquare, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeroData } from '@/types/public-landing';

interface HeroSectionProps {
  hero: HeroData;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export function HeroSection({
  hero,
  whatsappNumber = '59899123456',
  whatsappMessage,
}: HeroSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage ?? hero.ctaLabel
  )}`;

  return (
    <section
      className={cn(
        'relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-20',
        'bg-gradient-to-br',
        hero.gradientClasses
      )}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-pink-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
        {/* Emoji badge */}
        <span
          className="text-6xl sm:text-7xl drop-shadow-lg animate-bounce"
          role="img"
          aria-label={hero.emoji}
          style={{ animationDuration: '2s' }}
        >
          {hero.emoji}
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          {hero.headline}
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed font-medium">
          {hero.subheadline}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none sm:justify-center mt-2">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <button
              className={cn(
                'w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl',
                'bg-[#25D366] hover:bg-[#1eb356]',
                'text-white font-black text-base uppercase tracking-widest',
                'shadow-xl shadow-green-900/25',
                'transition-all duration-300 hover:scale-105 active:scale-95',
                'animate-pulse hover:animate-none'
              )}
            >
              <MessageSquare className="w-5 h-5 shrink-0" />
              {hero.ctaLabel}
            </button>
          </a>

          <a href="#servicios">
            <button
              className={cn(
                'w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl',
                'bg-white hover:bg-slate-50 border border-slate-200',
                'text-slate-700 font-black text-base uppercase tracking-widest',
                'shadow-md',
                'transition-all duration-300 hover:scale-105 active:scale-95'
              )}
            >
              Ver paquetes
            </button>
          </a>
        </div>

        {/* Trust badge row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {['✅ +10 años de experiencia', '⭐ 100% Personalizado', '📞 Respuesta en 24 hs'].map((badge) => (
            <span
              key={badge}
              className="text-xs font-bold text-slate-500 bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-slate-100"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#servicios"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 hover:text-slate-600 transition-colors animate-bounce"
        aria-label="Scroll hacia abajo"
      >
        <ChevronDown className="w-7 h-7" />
      </a>
    </section>
  );
}
