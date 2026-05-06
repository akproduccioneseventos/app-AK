'use client';

import { motion } from 'framer-motion';
import { ChevronRight, MonitorPlay, ShieldCheck, Sparkles } from 'lucide-react';
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
  const safeLogoUrl = (logoUrl && /^https?:\/\//i.test(logoUrl)) || (logoUrl && /^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/i.test(logoUrl))
    ? logoUrl
    : null;
  const safeBackgroundUrl = (imagenFondoUrl && /^https?:\/\//i.test(imagenFondoUrl))
    ? imagenFondoUrl
    : null;
  const accent = colorAcento || contenido.colorAcento;
  const displayTitle = tituloPrincipal || companyInfo.companyName || 'AK Producciones';

  return (
    <SlideLayout className="text-center">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] 2xl:max-w-[1680px]">
        <div className="text-left">
          <motion.div
            initial={{ opacity: 0, y: -22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className="mb-7 flex flex-wrap items-center gap-3"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-white/80 backdrop-blur-sm">
              <MonitorPlay className="h-4 w-4 text-red-300" />
              Modo pantalla gigante
            </span>
            {tipoFiesta && (
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-white shadow-xl bg-gradient-to-r ${accent}`}>
                {contenido.emoji} {tipoFiesta}
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.55 }}
            className="mb-7"
          >
            {safeLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeLogoUrl} alt="Logo AK Producciones" className="h-20 w-auto object-contain drop-shadow-2xl md:h-24" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-white/10">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <span className="text-2xl font-black text-white md:text-3xl">{companyInfo.companyName || 'AK Producciones'}</span>
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.65 }}
            className="mb-5 max-w-4xl text-5xl font-black leading-none tracking-normal text-white drop-shadow-2xl md:text-7xl xl:text-8xl"
          >
            {displayTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            className="mb-3 max-w-3xl text-2xl font-black leading-tight text-white/90 md:text-3xl"
          >
            {contenido.tagline}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.55 }}
            className="mb-8 max-w-3xl text-lg font-medium leading-8 text-white/60 md:text-xl"
          >
            {subtitulo || contenido.subtitulo}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap items-center gap-4"
          >
            <button
              onClick={onNext}
              className={`inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-black text-white shadow-2xl transition-transform hover:-translate-y-0.5 bg-gradient-to-r ${accent}`}
            >
              Empezar propuesta
              <ChevronRight className="h-6 w-6" />
            </button>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-white/60">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Pensado para vender en vivo, sin aspecto de catalogo interno
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, x: 28 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.28, duration: 0.75 }}
          className="relative hidden lg:block"
        >
          <div className="absolute -inset-4 rounded-[2rem] border border-white/10" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl">
            {safeBackgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeBackgroundUrl}
                alt={tipoFiesta ? `Foto de ${tipoFiesta}` : 'Foto principal del evento'}
                className="h-[58vh] min-h-[460px] w-full object-cover"
              />
            ) : (
              <ImagePlaceholder
                id="hero-portada"
                label={tipoFiesta ? `Visual de ${tipoFiesta}` : 'Visual principal del evento'}
                aspectRatio="4/3"
                className="min-h-[460px] shadow-2xl"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-6 text-left backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-widest text-red-200">Experiencia AK</p>
              <p className="mt-1 text-2xl font-black text-white">Evento completo, claro y listo para decidir</p>
            </div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
