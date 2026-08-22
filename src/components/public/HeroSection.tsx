'use client';

import { MessageSquare } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { HeroData } from '@/types/public-landing';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

interface HeroSectionProps {
  hero: HeroData;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export function HeroSection({
  hero,
  whatsappNumber = AK_WHATSAPP_NUMBER,
  whatsappMessage,
}: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage ?? hero.ctaLabel
  )}`;

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section
      className={cn(
        'relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden',
        'bg-gradient-to-br',
        hero.gradientClasses
      )}
    >
      {/* Decorative blobs animadas */}
      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-300/25 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-pink-300/25 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
        {/* Emoji badge */}
        <motion.span
          {...reveal}
          className="text-6xl sm:text-7xl drop-shadow-md inline-block"
          role="img"
          aria-label={hero.emoji}
          animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {hero.emoji}
        </motion.span>

        {/* Headline */}
        <motion.h1
          {...reveal}
          transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight"
        >
          {hero.headline}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...reveal}
          transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed font-medium"
        >
          {hero.subheadline}
        </motion.p>

        {/* CTA Buttons con micro-interacciones */}
        <motion.div
          {...reveal}
          transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-3.5 w-full max-w-sm sm:max-w-none sm:justify-center mt-2"
        >
          <motion.a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl',
              'bg-[#25D366] hover:bg-[#1eb356]',
              'text-white font-black text-base uppercase tracking-widest',
              'shadow-xl shadow-green-900/20 transition-colors'
            )}
          >
            <MessageSquare className="w-5 h-5 shrink-0" />
            {hero.ctaLabel}
          </motion.a>

          <motion.a
            href="#servicios"
            whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl',
              'bg-white hover:bg-slate-50 border border-slate-200',
              'text-slate-700 font-black text-base uppercase tracking-widest',
              'shadow-sm transition-colors'
            )}
          >
            Ver paquetes
          </motion.a>
        </motion.div>

        {/* Trust badge row */}
        <motion.div
          {...reveal}
          transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.32 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-4"
        >
          {['✅ +10 años de experiencia', '⭐ 100% Personalizado', '📞 Respuesta en el día'].map((badge) => (
            <span
              key={badge}
              className="text-xs font-bold text-slate-600 bg-white/90 px-3.5 py-1.5 rounded-full shadow-sm border border-slate-200/80 backdrop-blur-sm"
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
