'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Users, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import { cn } from '@/lib/utils';
import type { PresentacionLedEquipoSettings } from '@/types/contenido-publico';

interface EquipoSlideProps {
  tipoFiesta?: string;
  equipoSettings?: PresentacionLedEquipoSettings;
}

export function EquipoSlide({ tipoFiesta, equipoSettings }: EquipoSlideProps) {
  const [failedFotos, setFailedFotos] = useState<Set<string>>(new Set());

  const titulo = equipoSettings?.titulo || 'Hay Equipo 🤝';
  const frase =
    equipoSettings?.frase ||
    `El día de ${tipoFiesta ? `tu ${tipoFiesta.toLowerCase()}` : 'tu fiesta'} somos 11 personas trabajando para vos.`;
  const cantidadPersonas = equipoSettings?.cantidadPersonas || 11;
  const fotosRaw = equipoSettings?.fotos || [];

  const handleFotoError = (url: string) => {
    setFailedFotos((prev) => new Set(prev).add(url));
  };

  const visibleFotos = fotosRaw.filter((url) => !!url && !failedFotos.has(url));

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-rose-500/30 border border-white/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-amber-300" />
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              {cantidadPersonas} Profesionales en tu evento
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
            {titulo}
          </h1>
          <p className="text-xl md:text-2xl font-bold text-amber-200/90 max-w-3xl mx-auto leading-relaxed">
            "{frase}"
          </p>
        </motion.div>

        {/* Visual Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Main Photo Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900 aspect-[16/9]"
          >
            {visibleFotos.length > 0 ? (
              <div
                className={cn(
                  'grid w-full h-full gap-2 p-2 bg-slate-950',
                  visibleFotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
                )}
              >
                {visibleFotos.slice(0, 4).map((url, idx) => (
                  <div key={idx} className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image
                      src={url}
                      alt={`Equipo AK trabajando ${idx + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      unoptimized
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      onError={() => handleFotoError(url)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <ImagePlaceholder id="equipo-ak" label="Fotos del equipo AK trabajando en tu fiesta" aspectRatio="16/9" />
            )}
          </motion.div>

          {/* Pillars Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Respaldo Real</h3>
                  <p className="text-white/60 text-xs mt-0.5">
                    Mozos, cocina, DJ, técnica, recepción y coordinación trabajando sincronizados.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Compromiso Humano</h3>
                  <p className="text-white/60 text-xs mt-0.5">
                    Cada integrante con experiencia probada para que vos solo te dediques a disfrutar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Tranquilidad Absoluta</h3>
                  <p className="text-white/60 text-xs mt-0.5">
                    Lo que otros tercerizan, nosotros lo resolvemos en equipo desde el primer minuto.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}
