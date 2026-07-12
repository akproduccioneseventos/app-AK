'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MessageSquare, ChevronDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromoActiva } from '@/types/promo';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

interface HeroSectionProps {
  whatsappNumber?: string;
  headline?: string;
  subheadline?: string;
  backgroundImageUrl?: string;
  promoActiva?: PromoActiva | null;
  whatsappMessage?: string;
  ctaLabel?: string;
  simulatorHref?: string;
  simulatorLabel?: string;
}

export function HeroSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  headline = 'Disfrutá tu Fiesta,\nNosotros nos Encargamos del Resto',
  subheadline = 'La paz mental de saber que tu evento está en manos expertas. Desde el catering premium hasta la tecnología interactiva, coordinamos cada detalle para que vos solo te dediques a vivir el momento.',
  backgroundImageUrl = '/media/catalogo-servicios/quinceanera_hero.png',
  promoActiva,
  whatsappMessage = 'Hola AK Producciones, vi su pagina y me gustaria cotizar mi evento.',
  ctaLabel = 'Consultar por WhatsApp',
  simulatorHref = '/simulador-de-presupuesto',
  simulatorLabel = 'Simular Presupuesto',
}: HeroSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const configuredPromoHref = promoActiva?.ctaUrl?.trim() || '';
  const promoHref =
    /^https?:\/\//i.test(configuredPromoHref) || configuredPromoHref.startsWith('/')
      ? configuredPromoHref
      : waHref;
  const reduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section data-testid="hero-section" className="relative flex min-h-[78svh] items-center overflow-hidden bg-zinc-950">
      <motion.div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat opacity-75"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
        animate={reduceMotion ? undefined : { scale: [1.04, 1.09, 1.04], backgroundPosition: ['50% 50%', '54% 47%', '50% 50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl text-left"
        >
          {promoActiva && (
            <motion.a
              variants={itemVariants}
              href={promoHref}
              target={promoHref.startsWith('http') ? '_blank' : undefined}
              rel={promoHref.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/30 bg-black/20 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-black/40"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              Promo activa: {promoActiva.titulo}
            </motion.a>
          )}

          <motion.div
            variants={itemVariants}
            className="mb-7 inline-flex items-center gap-3 rounded-md border border-white/25 bg-black/20 px-4 py-2 text-xs font-bold text-white"
          >
            <span className="h-2 w-8 rounded-full bg-red-600" />
            AK Producciones Eventos
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none mb-6 drop-shadow-2xl"
          >
            {headline.split('\n').map((line, i, lines) => (
              <span key={i} className={cn('block', i === 1 && 'text-white/90')}>
                {line}{i < lines.length - 1 ? ' ' : ''}
              </span>
            ))}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl md:text-2xl text-zinc-300 font-medium max-w-2xl mb-10 leading-relaxed"
          >
            {subheadline}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
          >
            <Link
              href={simulatorHref}
              className={cn(
                'flex items-center gap-3 rounded-lg bg-red-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-red-950/20 hover:bg-red-800',
                'transition-all duration-300 hover:translate-y-[-1px] active:scale-95',
                'min-w-[220px] justify-center'
              )}
            >
              {simulatorLabel}
              <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-cta-button"
              className={cn(
                'flex items-center gap-3 rounded-lg border border-white/35 bg-black/20 px-8 py-4 text-base font-bold text-white hover:bg-black/35',
                'transition-all duration-300 hover:translate-y-[-1px] active:scale-95',
                'min-w-[220px] justify-center'
              )}
            >
              <MessageSquare className="w-6 h-6 shrink-0 text-emerald-300" />
              {ctaLabel}
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-14 grid max-w-lg grid-cols-3 divide-x divide-white/20 border-y border-white/20">
            {[
              { value: '500+', label: 'Eventos' },
              { value: '12+', label: 'Años' },
              { value: '24/7', label: 'Acompañamiento' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={reduceMotion ? undefined : { y: -2 }}
                className="px-4 py-3.5 text-center"
              >
                <div className="text-2xl sm:text-3xl font-black text-white drop-shadow">{stat.value}</div>
                <div className="mt-1 text-[9px] font-bold text-zinc-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.a
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        href="#servicios"
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-white/70 transition-colors hover:text-white"
        aria-label="Scroll hacia abajo"
      >
        <ChevronDown className="w-8 h-8" />
      </motion.a>
    </section>
  );
}
