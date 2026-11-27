'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  Facebook,
  Instagram,
  MessageSquare,
  Music,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AK_WHATSAPP_NUMBER, AK_SOCIAL_LINKS } from '@/lib/public-contact';
import type { PromoActiva } from '@/types/promo';
import { EntrevistaGratuitaModal } from './EntrevistaGratuitaModal';

function formatearFechaFin(fechaStr?: string): string {
  if (!fechaStr) return '';
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const partes = fechaStr.slice(0, 10).split('-');
  if (partes.length === 3) {
    const dia = parseInt(partes[2], 10);
    const mesIdx = parseInt(partes[1], 10) - 1;
    if (mesIdx >= 0 && mesIdx < 12) {
      return `${dia} de ${meses[mesIdx]}`;
    }
  }
  return fechaStr;
}

interface CTASectionProps {
  whatsappNumber?: string;
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  whatsappMessage?: string;
  instagramUrl?: string;
  promo?: PromoActiva | null;
}

export function CTASection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  headline = '¿Listo para diseñar\ntu fiesta completa?',
  subheadline = 'Explorá tu presupuesto a tu ritmo o conversá con nuestro equipo sin compromiso. Todo en un solo lugar para celebrar tranquilo en Salto.',
  ctaLabel = 'Consultar disponibilidad por WhatsApp',
  whatsappMessage = 'Hola AK Producciones, me gustaría consultar disponibilidad para mi evento.',
  instagramUrl = AK_SOCIAL_LINKS.instagram,
  promo,
}: CTASectionProps) {
  const reduceMotion = useReducedMotion();
  const [modalOpen, setModalOpen] = useState(false);
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const socialLinks = [
    {
      platform: 'Instagram',
      href: instagramUrl,
      icon: Instagram,
      bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:shadow-pink-400/60',
    },
    {
      platform: 'Facebook',
      href: AK_SOCIAL_LINKS.facebook,
      icon: Facebook,
      bgClass: 'bg-[#1877F2] hover:shadow-blue-500/60',
    },
    {
      platform: 'TikTok',
      href: AK_SOCIAL_LINKS.tiktok,
      icon: Music,
      bgClass: 'bg-black border border-white/15 hover:shadow-zinc-500/60',
    },
  ];

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-40px' },
        transition: { duration: 0.5 },
      };

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 text-white sm:py-24">
      {/* Background glow and subtle mesh */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.18),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-[300px] w-[min(600px,100vw)] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl space-y-9 px-4 text-center sm:px-6 lg:px-8">

        {/* Header copy */}
        <div className="space-y-4">
          <motion.div {...reveal} className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-red-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true" />
            <span>Servicio integral en un solo lugar</span>
          </motion.div>
          <motion.h2
            {...reveal}
            className="whitespace-pre-line font-headline text-4xl font-black leading-tight tracking-tight text-white text-balance sm:text-6xl"
          >
            {headline}
          </motion.h2>
          <motion.p
            {...reveal}
            className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-zinc-300 sm:text-lg"
          >
            {subheadline}
          </motion.p>
        </div>

        {/* Banner de Urgencia / Oferta Especial (Invisible Funnel) */}
        {promo && (
          <motion.div
            {...reveal}
            className="inline-block max-w-full rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-amber-500/20 p-1"
          >
            <div className="rounded-xl bg-zinc-900/90 px-5 py-3 text-xs font-medium text-zinc-200 backdrop-blur sm:px-6 sm:text-sm">
              <span className="mr-2 inline-flex items-center gap-1.5 font-black uppercase tracking-wider text-red-400">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {promo.titulo}:
              </span>
              <p className="mt-1">
                {promo.descripcion ? (
                  promo.descripcion
                ) : (
                  <>
                    Confirmando antes del {formatearFechaFin(promo.fechaFin)} te regalamos{' '}
                    <strong className="text-white">{promo.regalo}</strong>.
                  </>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* Pain of Payment Reduction Banner */}
        <motion.div
          {...reveal}
          className="mx-auto inline-flex max-w-2xl items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold tracking-wide text-zinc-200 backdrop-blur-sm"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span>Presupuesto transparente en pesos uruguayos · Sin compromiso ni sorpresas</span>
        </motion.div>

        {/* CTAs con micro-interacciones */}
        <motion.div {...reveal} className="flex flex-col items-center justify-center gap-4">
          <div className="flex w-full max-w-2xl flex-col items-stretch justify-center gap-3.5 sm:flex-row sm:items-center">
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="flex w-full sm:w-auto"
            >
              <Link
                href="/simulador-de-presupuesto"
                className={cn(
                  'flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 sm:min-w-[260px] sm:px-7',
                  'bg-gradient-to-r from-red-600 via-red-600 to-rose-600 text-white hover:brightness-110',
                  'text-xs font-black uppercase tracking-wider sm:text-sm',
                  'shadow-2xl shadow-red-950/60 transition-all'
                )}
              >
                <span className="truncate">Armar mi propuesta sin compromiso</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </motion.div>

            <motion.button
              type="button"
              onClick={() => setModalOpen(true)}
              aria-label="Coordinar una entrevista gratuita"
              whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className={cn(
                'flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 sm:w-auto sm:min-w-[240px] sm:px-7',
                'border border-white/20 bg-white/10 text-white backdrop-blur-md hover:border-white/35 hover:bg-white/15',
                'text-xs font-black uppercase tracking-wider sm:text-sm',
                'shadow-xl transition-colors'
              )}
            >
              <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Coordinar una entrevista gratuita</span>
            </motion.button>
          </div>

          <div className="flex w-full max-w-2xl flex-col items-stretch justify-center gap-3.5 sm:flex-row sm:items-center">
            <motion.a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Consultar disponibilidad por WhatsApp"
              whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className={cn(
                'flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 sm:w-auto sm:min-w-[240px] sm:px-7',
                'bg-[#25D366] text-white hover:bg-[#1eb356]',
                'text-xs font-black uppercase tracking-wider',
                'shadow-2xl shadow-green-950/50 transition-colors'
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{ctaLabel}</span>
            </motion.a>
            <motion.a
              href={`tel:${whatsappNumber.replace(/[\s-]/g, '').replace(/^([^+])/, '+$1')}`}
              aria-label="Llamar por teléfono a AK Producciones"
              whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className={cn(
                'flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 sm:w-auto sm:min-w-[190px] sm:px-7',
                'border border-white/15 bg-white/5 text-zinc-100 backdrop-blur-md hover:border-white/30 hover:bg-white/10',
                'text-xs font-black uppercase tracking-wider',
                'transition-colors'
              )}
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Llamar directo</span>
            </motion.a>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="h-px w-16 bg-white/10" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">O visitanos en redes</p>
          <div className="h-px w-16 bg-white/10" />
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-4">
          {socialLinks.map(({ platform, href, icon: Icon, bgClass }) => (
            <motion.a
              key={platform}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={platform}
              aria-label={`Visitar ${platform} de AK Producciones`}
              whileHover={reduceMotion ? undefined : { scale: 1.15, y: -3 }}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl text-white',
                'shadow-md transition-all duration-300',
                bgClass
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            </motion.a>
          ))}
        </div>

      </div>

      <EntrevistaGratuitaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
