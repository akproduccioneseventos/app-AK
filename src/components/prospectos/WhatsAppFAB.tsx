'use client';

import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function WhatsAppFAB({ prospectName }: { prospectName: string }) {
  // Número ficticio, luego lo pueden configurar
  const whatsappNumber = '59899123456'; 
  const message = encodeURIComponent(`¡Hola AK Producciones! Soy ${prospectName}, estoy viendo su portal interactivo y me gustaría consultar por un evento.`);
  
  const href = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <motion.a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-[#25D366] text-white rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.5)] cursor-pointer"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-8 h-8" />
      {/* Tooltip pequeño flotante */}
      <div className="absolute right-20 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap hidden md:block">
        ¡Hablemos!
      </div>
    </motion.a>
  );
}
