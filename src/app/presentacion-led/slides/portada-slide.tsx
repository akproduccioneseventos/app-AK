'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import type { CompanyInfo } from '@/types/settings';

interface PortadaSlideProps {
  companyInfo: CompanyInfo;
  logoUrl: string | null;
  tipoFiesta: string;
  tituloPrincipal?: string;
  subtitulo?: string;
  imagenFondoUrl?: string;
  colorAcento?: string;
  onNext: () => void;
}

export function PortadaSlide({
  companyInfo,
  logoUrl,
  tipoFiesta,
  tituloPrincipal,
  subtitulo,
  imagenFondoUrl,
  colorAcento,
  onNext,
}: PortadaSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);
  // Validate logo URL before rendering to prevent XSS:
  // Allow only https/http URLs or properly-formed data:image base64 URIs
  const safeLogoUrl = (logoUrl && /^https?:\/\//i.test(logoUrl)) || (logoUrl && /^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/i.test(logoUrl))
    ? logoUrl
    : null;
  const safeBackgroundUrl = (imagenFondoUrl && /^https?:\/\//i.test(imagenFondoUrl))
    ? imagenFondoUrl
    : null;

  return (
    <SlideLayout className="text-center">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Text */}
        <div className="text-left">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-6"
          >
            {safeLogoUrl ? (
              <img src={safeLogoUrl} alt="Logo" className="h-20 w-auto object-contain drop-shadow-2xl" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/10 border-2 border-white/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <span className="text-2xl font-black text-white">{companyInfo.companyName || 'AK Producciones'}</span>
              </div>
            )}
          </motion.div>

          {/* Emoji + tipo */}
          {tipoFiesta && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4"
            >
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r ${colorAcento || contenido.colorAcento} text-white`}>
                {contenido.emoji} {tipoFiesta}
              </span>
            </motion.div>
          )}

          {/* Company name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-4 drop-shadow-lg leading-none"
          >
            {tituloPrincipal || companyInfo.companyName || 'AK Producciones'}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-xl md:text-2xl text-white/80 mb-3 font-semibold"
          >
            {contenido.tagline}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="text-base md:text-lg text-white/50 mb-8 font-light"
          >
            {subtitulo || contenido.subtitulo}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <button
              onClick={onNext}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold text-white bg-gradient-to-r ${colorAcento || contenido.colorAcento} shadow-2xl hover:opacity-90 transition-opacity`}
            >
              Ver presentación
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        </div>

        {/* Right: Image placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="hidden lg:block"
        >
          {safeBackgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeBackgroundUrl}
              alt={tipoFiesta ? `Foto de ${tipoFiesta}` : 'Foto principal del evento'}
              className="w-full aspect-[4/3] object-cover rounded-2xl shadow-2xl"
            />
          ) : (
            <ImagePlaceholder
              id="hero-portada"
              label={tipoFiesta ? `Foto de ${tipoFiesta}` : 'Foto principal del evento'}
              aspectRatio="4/3"
              className="shadow-2xl"
            />
          )}
        </motion.div>
      </div>
    </SlideLayout>
  );
}
