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
      drag
      dragMomentum={false}
      dragElastic={0.1}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3 cursor-grab active:cursor-grabbing select-none"
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
              className="p-3 bg-zinc-900/90 text-white rounded-full border border-white/10 hover:bg-zinc-800 hover:text-white transition-all shadow-xl backdrop-blur-md"
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
                "flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl backdrop-blur-md transition-all",
                "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-500/30"
              )}
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <span>Cotizá tu Fiesta</span>
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
                "relative p-4 rounded-full text-white shadow-2xl transition-all",
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
