'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { cn } from '@/lib/utils';

interface PartnerLogo {
  id: string;
  url: string;
  name: string;
}

const PARTNER_LOGOS: PartnerLogo[] = [
  { id: '1', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/fe2d7dfa46dc7147960c514af9542afa.png', name: 'Empresa Colaboradora' },
  { id: '2', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/2ba335a8ad19794ec5917c23651f8786.jpg', name: 'Empresa Colaboradora' },
  { id: '3', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/e104d91117bfcf4df0383ac04a53edea.jpg', name: 'Empresa Colaboradora' },
  { id: '4', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/d81497c5c60f3fa14562a52efce1c1f0.jpg', name: 'Empresa Colaboradora' },
  { id: '5', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/d9557e28cec3eb2dd748424d592e5eae.png', name: 'Empresa Colaboradora' },
  { id: '6', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/5e07e7a5f80d64c01109ad4913af5b12.jpg', name: 'Empresa Colaboradora' },
  { id: '7', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/1e9e70f06c8719b1d3ab987c7f7ab669.jpg', name: 'Empresa Colaboradora' },
  { id: '8', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/ce9d2b2cdf34375322cc16f6722c35b2.png', name: 'Empresa Colaboradora' },
  { id: '9', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/4b905537b49f745ed0d75cd51a0bb475.png', name: 'Empresa Colaboradora' },
  { id: '10', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/dc47158bc14da0d9b32edec66286291e.png', name: 'Empresa Colaboradora' },
  { id: '11', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/8dae09f60c3d5a787eec748695141348.jpg', name: 'Empresa Colaboradora' },
];

export function EmpresasSlide() {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const handleLogoError = (id: string) => {
    setFailedLogos((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const visibleLogos = PARTNER_LOGOS.filter((logo) => !failedLogos.has(logo.id));

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-indigo-300" />
          </div>
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-2">Respaldan nuestro trabajo</p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
            Empresas que confían en nosotros 🤝
          </h1>
          <p className="text-white/60 text-lg mt-2 max-w-2xl mx-auto">
            Hemos realizado eventos y brindado servicios a corporaciones y organizaciones locales y nacionales de primer nivel.
          </p>
        </motion.div>

        {/* Logos Grid */}
        {visibleLogos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center justify-center">
            {visibleLogos.map((logo, i) => (
              <motion.div
                key={logo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={cn(
                  'relative h-20 rounded-2xl border border-white/10 bg-white/90 p-4',
                  'flex items-center justify-center shadow-lg shadow-black/10',
                  'hover:scale-105 hover:bg-white hover:border-indigo-400/30 transition-all duration-300'
                )}
              >
                <div className="relative w-full h-full">
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
