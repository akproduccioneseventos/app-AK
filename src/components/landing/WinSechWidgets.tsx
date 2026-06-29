'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export function WinSechWidgets() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (isClosed) return;

    // Show initial widget after 4 seconds
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Rotate widgets every 12 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % OFFERS.length);
        setIsVisible(true);
      }, 500);
    }, 12000);

    return () => {
      clearTimeout(showTimeout);
      clearInterval(interval);
    };
  }, [isClosed]);

  const handleClose = () => {
    setIsVisible(false);
    setIsClosed(true);
  };

  const current = OFFERS[currentIdx];
  const Icon = current?.icon || Sparkles;

  return (
    <AnimatePresence>
      {isVisible && !isClosed && (
        <motion.div
          initial={{ x: -100, opacity: 0, scale: 0.9 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -100, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-24 left-6 z-[80] max-w-sm w-[21rem] bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-3xl p-5 shadow-[0_10px_35px_rgba(99,102,241,0.25)] text-white flex flex-col gap-3"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${current.iconColor} animate-pulse`} />
              </div>
              <p className="font-headline font-black text-sm uppercase tracking-wider text-slate-100">{current.title}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white hover:bg-white/10 w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0"
              aria-label="Cerrar oferta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs font-semibold text-slate-300 leading-relaxed">
            {current.description}
          </p>

          {/* CTA Link */}
          {current.ctaUrl.startsWith('http') ? (
            <a
              href={current.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider h-10 transition-transform duration-200 hover:scale-[1.02] active:scale-98 shadow-md"
            >
              {current.ctaText}
            </a>
          ) : (
            <Link
              href={current.ctaUrl}
              onClick={() => {
                // If it's a hash link, let it scroll smoothly
                if (current.ctaUrl.startsWith('#')) {
                  setIsVisible(false);
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider h-10 transition-transform duration-200 hover:scale-[1.02] active:scale-98 shadow-md"
            >
              {current.ctaText}
            </Link>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
