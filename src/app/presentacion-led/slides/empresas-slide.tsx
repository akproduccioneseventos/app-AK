'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { cn } from '@/lib/utils';
import type { PartnerLogo } from '@/types/contenido-publico';
import { DEFAULT_PARTNER_LOGOS } from '@/app/actions/contenido-publico';

interface EmpresasSlideProps {
  logos?: PartnerLogo[];
}

export function EmpresasSlide({ logos }: EmpresasSlideProps) {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const partnerLogos = Array.isArray(logos) && logos.length > 0 ? logos : DEFAULT_PARTNER_LOGOS;

  const handleLogoError = (id: string) => {
    setFailedLogos((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const visibleLogos = partnerLogos.filter((logo) => !failedLogos.has(logo.id));

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-indigo-300" />
          </div>
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-2">Respaldan nuestro trabajo</p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
            Empresas que confían en nosotros 🤝
          </h1>
          <p className="text-white/60 text-base mt-2 max-w-2xl mx-auto">
            Hemos realizado eventos y brindado servicios a corporaciones y organizaciones locales y nacionales de primer nivel.
          </p>
        </motion.div>

        {/* Logos Grid */}
        {visibleLogos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-stretch justify-center">
            {visibleLogos.map((logo, i) => (
              <motion.div
                key={logo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={cn(
                  'relative rounded-2xl border border-white/10 bg-slate-900/90 p-3',
                  'flex flex-col items-center justify-between shadow-lg shadow-black/20',
                  'hover:scale-105 hover:bg-slate-800 hover:border-indigo-400/40 transition-all duration-300'
                )}
              >
                <div className="relative w-full h-16 rounded-xl bg-white/95 p-2 flex items-center justify-center overflow-hidden">
                  <Image
                    src={logo.url}
                    alt={logo.name}
                    fill
                    sizes="(max-width: 768px) 33vw, 15vw"
                    unoptimized
                    className="object-contain filter contrast-125 hover:contrast-100 transition-all"
                    onError={() => handleLogoError(logo.id)}
                  />
                </div>
                <p className="text-xs font-bold text-white/90 text-center mt-2.5 line-clamp-2 drop-shadow">
                  {logo.name}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8">
            <p className="text-white/40 text-lg">Colaboramos con marcas de Salto y la región en eventos de primer nivel.</p>
          </div>
        )}
      </div>
    </SlideLayout>
  );
}
