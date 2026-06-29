'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Sparkles, Instagram, Flame, Gift, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface OfferWidget {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  iconColor: string;
}

const OFFERS: OfferWidget[] = [
  {
    id: 1,
    icon: Flame,
    title: '50% OFF en Salones',
    description: 'Reservando esta semana: Salón Chico por $8.900 (50 invitados) y Salón Grande por $16.900 (200 invitados).',
    ctaText: 'Cotizar salón ahora',
    ctaUrl: '/simulador-de-presupuesto?salon=club',
    iconColor: 'text-amber-400',
  },
  {
    id: 2,
    icon: Instagram,
    title: 'Seguinos en Instagram',
    description: 'Sumate a @akproduccioneseventos. Compartimos fotos reales en vivo de todas las fiestas y sorteos semanales.',
    ctaText: 'Seguir cuenta',
    ctaUrl: 'https://instagram.com/akproduccioneseventos',
    iconColor: 'text-pink-400',
  },
  {
    id: 3,
    icon: Gift,
    title: 'Discoteca Incluida',
    description: 'Contratando el servicio completo te regalamos los efectos especiales de chispa fría para el vals.',
    ctaText: 'Ver servicios',
    ctaUrl: '#servicios',
    iconColor: 'text-emerald-400',
  },
];

interface WinSechWidgetsProps {
  instagramUrl?: string;
  instagramHandle?: string;
}

export function WinSechWidgets({
  instagramUrl = 'https://instagram.com/akproduccioneseventos',
  instagramHandle = '@akproduccioneseventos',
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
    }, 2200);

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % OFFERS.length);
        setIsVisible(true);
      }, reduceMotion ? 0 : 420);
    }, 12000);

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
  const currentOffer = current.id === 2
    ? {
        ...current,
        description: `Mira contenido real y novedades en ${instagramHandle}. La web se sincroniza con lo mejor del perfil.`,
        ctaUrl: instagramUrl,
      }
    : current;
  const Icon = currentOffer?.icon || Sparkles;

  return (
    <AnimatePresence>
      {isVisible && !isClosed && (
        <motion.div
          key={currentOffer.id}
          initial={reduceMotion ? { opacity: 0 } : { x: -42, opacity: 0, scale: 0.97 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { x: -42, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-8 z-[80] w-auto sm:w-[20rem] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/88 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          {!reduceMotion && (
            <motion.div
              key={`progress-${currentOffer.id}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 12, ease: 'linear' }}
              className="absolute left-0 top-0 h-0.5 w-full origin-left bg-gradient-to-r from-indigo-400 via-fuchsia-300 to-amber-300"
            />
          )}

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Icon className={`w-5 h-5 ${currentOffer.iconColor}`} />
              </div>
              <p className="font-headline text-sm font-black uppercase tracking-wider text-slate-100">{currentOffer.title}</p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/10 hover:text-white"
              aria-label="Cerrar oferta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs font-semibold text-slate-300 leading-relaxed">
            {currentOffer.description}
          </p>

          {/* CTA Link */}
          {currentOffer.ctaUrl.startsWith('http') ? (
            <a
              href={currentOffer.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-wider text-white shadow-md transition-transform duration-200 hover:scale-[1.02] hover:bg-indigo-500 active:scale-[0.98]"
            >
              {currentOffer.ctaText}
            </a>
          ) : (
            <Link
              href={currentOffer.ctaUrl}
              onClick={() => {
                // If it's a hash link, let it scroll smoothly
                if (currentOffer.ctaUrl.startsWith('#')) {
                  setIsVisible(false);
                }
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-wider text-white shadow-md transition-transform duration-200 hover:scale-[1.02] hover:bg-indigo-500 active:scale-[0.98]"
            >
              {currentOffer.ctaText}
            </Link>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
