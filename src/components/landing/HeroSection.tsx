'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MessageSquare, ChevronDown, Zap, Heart, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromoActiva } from '@/types/promo';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import { canUseNextImage } from '@/lib/next-image-url';
import { Button } from '@/components/ui/button';

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
  headline = 'Tu fiesta de ensueño,\norganizada sin estrés',
  subheadline = 'Disfrutá la paz mental de tener todo bajo control. En AK Producciones unificamos catering premium, discoteca profesional, ambientación de diseño y tecnología interactiva para crear un día inolvidable.',
  backgroundImageUrl = '/media/catalogo-servicios/quinceanera_hero.png',
  promoActiva,
  whatsappMessage = 'Hola AK Producciones, vi su página y me gustaría cotizar mi evento.',
  ctaLabel = 'Conversar con un Asesor',
  simulatorHref = '/simulador-de-presupuesto',
  simulatorLabel = 'Simular mi Fiesta',
}: HeroSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const configuredPromoHref = promoActiva?.ctaUrl?.trim() || '';
  const promoHref =
    /^https?:\/\//i.test(configuredPromoHref) || configuredPromoHref.startsWith('/')
      ? configuredPromoHref
      : waHref;
  const reduceMotion = useReducedMotion();

  const containerVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

  const itemVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

  return (
    <section data-testid="hero-section" className="relative flex min-h-[90svh] items-center overflow-hidden bg-zinc-950">
      {/* Background Image with Slow Animation */}
      <motion.div
        className="absolute inset-0 scale-105 opacity-55"
        animate={reduceMotion ? undefined : { scale: [1.02, 1.07, 1.02] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      >
        {canUseNextImage(backgroundImageUrl) ? (
          <Image
            src={backgroundImageUrl}
            alt="Celebración producida por AK Producciones"
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
          />
        )}
      </motion.div>

      {/* Premium Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/30" />

      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/3 h-[350px] w-[350px] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Column Left: Text & Action */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 text-left space-y-6"
          >
            {promoActiva && (
              <motion.a
                variants={itemVariants}
                href={promoHref}
                target={promoHref.startsWith('http') ? '_blank' : undefined}
                rel={promoHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={`Ver promo: ${promoActiva.titulo}`}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-400 backdrop-blur-sm transition-all hover:bg-red-950/50"
              >
                <Zap className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                Promo activa: {promoActiva.titulo}
              </motion.a>
            )}

            <motion.h1
              variants={itemVariants}
              className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight drop-shadow-lg"
            >
              {headline.split('\n').map((line, i, lines) => (
                <span key={i} className={cn('block', i === 1 && 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent')}>
                  {line}{i < lines.length - 1 ? ' ' : ''}
                </span>
              ))}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-zinc-300 font-medium max-w-2xl leading-relaxed"
            >
              {subheadline}
            </motion.p>

            {/* Quick Template Selector (Neuroventas: Involucramiento lúdico) */}
            <motion.div variants={itemVariants} className="space-y-3 pt-2">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">¿Qué tipo de evento estás planificando?</p>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { label: 'Boda / Casamiento', icon: Heart, href: '/simulador-de-presupuesto?tipo=boda', color: 'hover:border-rose-500/40 hover:bg-rose-950/10' },
                  { label: 'Fiesta de 15 Años', icon: Crown, href: '/simulador-de-presupuesto?tipo=15-anos', color: 'hover:border-emerald-500/40 hover:bg-emerald-950/10' },
                  { label: 'Cumpleaños / Social', icon: Sparkles, href: '/simulador-de-presupuesto?tipo=social', color: 'hover:border-red-500/40 hover:bg-red-950/10' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-bold text-white transition-all duration-300',
                        item.color,
                        'hover:scale-[1.02] active:scale-[0.98]'
                      )}
                    >
                      <Icon className="w-4 h-4 text-red-400 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
            >
              <Button
                asChild
                className="bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl px-8 py-5 shadow-lg shadow-red-950/30 transition-all duration-300 hover:translate-y-[-1px] active:scale-95 min-w-[220px] justify-center"
              >
                <Link href={simulatorHref}>
                  {simulatorLabel}
                  <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
                </Link>
              </Button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="hero-cta-button"
                aria-label="Conversar con un asesor por WhatsApp"
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-8 py-5 text-sm font-bold text-white hover:bg-white/10 transition-all duration-300 hover:translate-y-[-1px] active:scale-95 min-w-[220px] justify-center"
              >
                <MessageSquare className="w-5 h-5 shrink-0 text-emerald-400" />
                {ctaLabel}
              </a>
            </motion.div>
          </motion.div>

          {/* Column Right: Glassmorphic Interactive Simulator Teaser Card */}
          <motion.div
            initial={{ opacity: 0, x: 25, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl overflow-hidden max-w-sm mx-auto">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              <div className="space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/30 border border-red-500/25 px-2.5 py-1 rounded-md">
                    Simulador Express
                  </span>
                  <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-headline">Calculá tu presupuesto</h3>
                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                    Elegí servicios y estimá el precio de tu fiesta en Salto de forma instantánea.
                  </p>
                </div>

                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">Cantidad de invitados</span>
                    <div className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs text-white/90 font-bold flex justify-between items-center">
                      <span>120 Invitados</span>
                      <span className="text-[10px] text-zinc-500">Ajustable</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">Estilo de Gastronomía</span>
                    <div className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs text-white/90 font-bold flex justify-between items-center">
                      <span>Catering Integral Premium</span>
                      <span className="text-[10px] text-zinc-500">Cambiar</span>
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs uppercase tracking-widest py-5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Link href={simulatorHref}>
                    Empezar Simulación
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Small Trust Indicators */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-16 grid max-w-2xl grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-5 mx-auto lg:mx-0"
        >
          {[
            { value: '500+', label: 'Eventos realizados' },
            { value: '12+ Años', label: 'Líderes en Salto' },
            { value: '100%', label: 'Paz mental garantizada' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              className="px-4 text-center"
            >
              <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

      </div>

      <motion.a
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        href="#servicios"
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-white/70 transition-colors hover:text-white"
        aria-label="Ver servicios"
      >
        <ChevronDown className="w-7 h-7" />
      </motion.a>
    </section>
  );
}
