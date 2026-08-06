'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toWhatsAppNumber } from '@/lib/commercial/contact';
// El numero de AK vive en un solo lugar. Antes este boton tenia escrito a mano un
// numero que no es el de la empresa: el prospecto que lo tocaba desde el simulador
// le escribia a un desconocido.
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
}

export function FloatingWhatsApp({
  phoneNumber = AK_WHATSAPP_NUMBER,
  message = 'Hola AK Producciones! Quisiera hacer una consulta sobre un evento.',
  className,
}: FloatingWhatsAppProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const rawTarget = toWhatsAppNumber(phoneNumber) || AK_WHATSAPP_NUMBER;
  const cleanTarget = rawTarget.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanTarget}?text=${encodeURIComponent(message)}`;

  return (
    <>
      <div ref={constraintsRef} className="pointer-events-none fixed inset-0 z-50 overflow-hidden" />
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none',
          className
        )}
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 rounded-full bg-emerald-500 px-4 py-3 text-white shadow-2xl transition-all duration-300 hover:bg-emerald-600 hover:shadow-emerald-500/30 focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
        >
          <div className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-75" />
            <MessageSquare className="relative h-6 w-6 fill-current stroke-emerald-500" />
          </div>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-black transition-all duration-300 group-hover:max-w-xs sm:max-w-xs">
            Consultar por WhatsApp
          </span>
        </a>
      </motion.div>
    </>
  );
}
