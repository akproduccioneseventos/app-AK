'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Sparkles, Instagram, Flame, Gift, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { AK_SOCIAL_LINKS } from '@/lib/public-contact';

interface OfferWidget {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  iconColor: string;
  bgGlow: string;
}

const OFFERS: OfferWidget[] = [
  {
    id: 1,
    icon: Sparkles,
    title: 'Cotizá en minutos',
    description: 'Armá el presupuesto de tu fiesta con precios transparentes y sin sorpresas.',
    ctaText: 'Simular Presupuesto',
    ctaUrl: '/simulador-de-presupuesto?salon=club',
    iconColor: 'text-amber-400',
    bgGlow: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 2,
    icon: Instagram,
    title: 'Seguinos en Instagram',
    description: 'Sumate a @akproduccionesfiestasyeventos. Compartimos fotos y videos reales de todas las fiestas en Salto.',
    ctaText: 'Ver Perfil',
    ctaUrl: AK_SOCIAL_LINKS.instagram,
    iconColor: 'text-pink-400',
    bgGlow: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    id: 3,
    icon: Gift,
    title: 'Producción integral',
    description: 'Cero estrés: música, comida gourmet, ambientación y organización en un solo paquete.',
    ctaText: 'Explorar Servicios',
    ctaUrl: '#servicios',
    iconColor: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

interface WinSechWidgetsProps {
  instagramUrl?: string;
  instagramHandle?: string;
}

export function WinSechWidgets({
<<<<<<< HEAD
  instagramUrl = AK_SOCIAL_LINKS.instagram,
=======
  instagramUrl = 'https://www.instagram.com/akproduccionesfiestasyeventos/',
>>>>>>> origin/main
  instagramHandle = '@akproduccionesfiestasyeventos',
}: WinSechWidgetsProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isClosed || isPaused) return;

    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 8500);

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % OFFERS.length);
        setIsVisible(true);
      }, reduceMotion ? 0 : 420);
    }, 18000);

    return () => {
      clearTimeout(showTimeout);
      clearInterval(interval);
    };
  }, [isClosed, isPaused, reduceMotion]);

  const handleClose = () => {
    setIsVisible(false);
    setIsClosed(true);
  };

  const current = OFFERS[currentIdx];
  const currentOffer =
    current.id === 2
      ? {
          ...current,
          description: `Mirá videos reales en vivo de nuestras fiestas directamente en ${instagramHandle}.`,
          ctaUrl: instagramUrl,
        }
      : current;

  const Icon = currentOffer?.icon || Sparkles;

  return (
    <AnimatePresence>
      {isVisible && !isClosed && (
        <motion.div
          key={currentOffer.id}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { x: 50, opacity: 0, scale: 0.95 }
          }
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { x: 50, opacity: 0, scale: 0.95 }
          }
          transition={{ duration: 0.45, ease: 'easeOut' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="fixed bottom-5 left-4 right-4 z-[80] w-auto overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85 p-5 text-white shadow-2xl backdrop-blur-xl sm:bottom-8 sm:left-auto sm:right-6 sm:w-[20rem] text-left"
          role="complementary"
          aria-live="polite"
          aria-label="Oferta destacada"
        >
          {/* Subtle Accent Glow bar */}
          {!reduceMotion && (
            <motion.div
              key={`progress-${currentOffer.id}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 18, ease: 'linear' }}
              className="absolute left-0 top-0 h-[2px] w-full origin-left bg-gradient-to-r from-red-500 to-pink-500"
            />
          )}

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${currentOffer.bgGlow}`}>
                <Icon className={`h-5 w-5 ${currentOffer.iconColor}`} />
              </div>
              <p className="font-headline text-xs font-black uppercase tracking-widest text-white">
                {currentOffer.title}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar oferta"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description */}
          <p className="mt-3 text-xs font-medium leading-relaxed text-zinc-400">
            {currentOffer.description}
          </p>

          {/* CTA Link */}
          <div className="mt-4 flex">
            {currentOffer.ctaUrl.startsWith('http') ? (
              <a
                href={currentOffer.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-red-950/20"
              >
                {currentOffer.ctaText}
              </a>
            ) : (
              <Link
                href={currentOffer.ctaUrl}
                onClick={() => {
                  if (currentOffer.ctaUrl.startsWith('#')) {
                    setIsVisible(false);
                  }
                }}
                className="w-full text-center inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-red-950/20"
              ><span className="w-full text-center">{currentOffer.ctaText}</span></Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
