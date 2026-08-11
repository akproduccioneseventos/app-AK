'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Calculator, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

interface FloatingActionsProps {
  whatsappNumber?: string;
  whatsappMessage?: string;
  simulatorHref?: string;
}

export function FloatingActions({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  whatsappMessage = '👋 ¡Hola! Me gustaría cotizar y obtener información sobre los servicios de AK Producciones.',
  simulatorHref = '/simulador-de-presupuesto',
}: FloatingActionsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    toggleVisibility();
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <motion.div
      data-testid="public-floating-actions"
      /* En el celular son dos botones redondos apilados en la esquina, no una
         barra cruzando la pantalla: la barra cortaba el pie en todas las
         pantallas publicas mientras la persona miraba las fotos. En pantalla
         grande hay lugar de sobra, asi que el de cotizar conserva su texto. */
      className="fixed bottom-4 right-4 z-50 flex select-none flex-col items-end gap-2 sm:bottom-6 sm:right-6 sm:gap-3"
    >
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Scroll to Top */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={scrollToTop}
              className="hidden rounded-full border border-white/10 bg-zinc-900/90 p-3 text-white shadow-xl backdrop-blur-md transition-all hover:bg-zinc-800 hover:text-white sm:block"
              aria-label="Subir al inicio"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>

            {/* Quote Simulator Button */}
            <motion.a
              href={simulatorHref}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-red-600 bg-red-700 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-red-600",
                "sm:h-auto sm:w-auto sm:rounded-lg sm:px-4 sm:py-3"
              )}
              aria-label="Cotizá tu fiesta"
            >
              <Calculator className="w-5 h-5 shrink-0 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cotizá tu Fiesta</span>
            </motion.a>

            {/* Direct WhatsApp Button */}
            <motion.a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className={cn(
                "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-3 text-white shadow-xl transition-all sm:h-auto sm:w-auto sm:p-4",
                "bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/20"
              )}
              aria-label="Escribinos por WhatsApp"
            >
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <MessageCircle className="w-6 h-6 shrink-0" />
            </motion.a>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
