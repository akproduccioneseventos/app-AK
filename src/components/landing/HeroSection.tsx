'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MessageSquare, ChevronDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromoActiva } from '@/types/promo';

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
  whatsappNumber = '59899123456',
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
    <section data-testid="hero-section" className="relative min-h-screen flex items-center overflow-hidden bg-zinc-950">
      <motion.div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
        animate={reduceMotion ? undefined : { scale: [1.04, 1.09, 1.04], backgroundPosition: ['50% 50%', '54% 47%', '50% 50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.85)_0%,rgba(9,9,11,0.70)_52%,rgba(24,24,27,0.50)_100%)]" />
      <motion.div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 96px), repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 96px)',
        }}
        animate={reduceMotion ? undefined : { backgroundPosition: ['0px 0px', '96px 48px'] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Resplandor cinemático de fondo (Glow) */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

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
              href="#promo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-4 hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              Promo activa: {promoActiva.titulo}
            </motion.a>
          )}

          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white text-xs font-black uppercase tracking-widest mb-7"
          >
            <span className="h-2 w-8 rounded-full bg-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.62)]" />
            AK Producciones Eventos
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none mb-6 drop-shadow-2xl"
          >
            {headline.split('\n').map((line, i) => (
              <span key={i} className={cn('block', i === 1 && 'text-white/90')}>
                {line}
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
                'flex items-center gap-3 px-8 py-4 rounded-2xl',
                'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20',
                'font-black text-base uppercase tracking-widest',
                'transition-all duration-300 hover:scale-[1.02] active:scale-95',
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
                'flex items-center gap-3 px-8 py-4 rounded-2xl',
                'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20',
                'text-white font-black text-base uppercase tracking-widest',
                'transition-all duration-300 hover:scale-[1.02] active:scale-95',
                'min-w-[220px] justify-center'
              )}
            >
              <MessageSquare className="w-6 h-6 shrink-0 text-indigo-400" />
              {ctaLabel}
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-14 grid grid-cols-3 gap-3 max-w-lg">
            {[
              { value: '500+', label: 'Eventos' },
              { value: '12+', label: 'Años' },
              { value: '24/7', label: 'Acompañamiento' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={reduceMotion ? undefined : { y: -4, borderColor: 'rgba(255,255,255,0.22)' }}
                className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md px-4 py-3.5 text-center"
              >
                <div className="text-2xl sm:text-3xl font-black text-white drop-shadow">{stat.value}</div>
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</div>
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
