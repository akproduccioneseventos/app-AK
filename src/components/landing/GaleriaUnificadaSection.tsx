'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Play, Video, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GallerySection } from '@/components/landing/GallerySection';
import { VideoSection } from '@/components/landing/VideoSection';
import type { GaleriaFoto, GaleriaVideo } from '@/types/galeria';

interface GaleriaUnificadaSectionProps {
  galeriaFotos: GaleriaFoto[];
  galeriaVideos: GaleriaVideo[];
  channelUrl?: string;
  initialTab?: 'fotos' | 'videos' | 'testimonios';
}

export function GaleriaUnificadaSection({
  galeriaFotos,
  galeriaVideos,
  channelUrl,
  initialTab = 'fotos',
}: GaleriaUnificadaSectionProps) {
  const [activeTab, setActiveTab] = useState<'fotos' | 'videos' | 'testimonios'>(initialTab);

  // Filtrar los videos de testimonios
  const videoTestimonios = useMemo(() => {
    return galeriaVideos.filter((v) => {
      const cat = (v.categoria || '').toLowerCase();
      const tit = (v.titulo || '').toLowerCase();
      return cat.includes('testimonio') || tit.includes('testimonio');
    });
  }, [galeriaVideos]);

  const hasTestimonios = videoTestimonios.length > 0;

  // Manejar el ancla #videos si viene en la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkHash = () => {
        if (window.location.hash === '#videos') {
          setActiveTab('videos');
        } else if (window.location.hash === '#landing-gallery') {
          setActiveTab('fotos');
        }
      };
      checkHash();
      window.addEventListener('hashchange', checkHash);
      return () => window.removeEventListener('hashchange', checkHash);
    }
  }, []);

  return (
    <section id="landing-gallery" className="relative scroll-mt-20">
      {/* Barra de pestañas unificadas */}
      <div className="bg-slate-900 border-b border-slate-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/30 text-red-300 text-xs font-black uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            Galería y Producciones Reales
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-6">
            Nuestros eventos en imágenes y movimiento
          </h2>

          <div className="inline-flex p-1.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner gap-1.5 max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('fotos')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0',
                activeTab === 'fotos'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <Camera className="w-4 h-4" />
              Fotos de montajes
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0',
                activeTab === 'videos'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <Play className="w-4 h-4 fill-current" />
              Videos de fiestas reales
            </button>

            {hasTestimonios && (
              <button
                type="button"
                onClick={() => setActiveTab('testimonios')}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0',
                  activeTab === 'testimonios'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                )}
              >
                <Users className="w-4 h-4" />
                Video-testimonios
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido según pestaña activa */}
      <div>
        {activeTab === 'fotos' && (
          <div>
            <GallerySection galeriaFotos={galeriaFotos} />
          </div>
        )}

        {activeTab === 'videos' && (
          <div id="videos" className="scroll-mt-20">
            <VideoSection galeriaVideos={galeriaVideos} channelUrl={channelUrl} />
          </div>
        )}

        {activeTab === 'testimonios' && hasTestimonios && (
          <div className="scroll-mt-20">
            <VideoSection
              galeriaVideos={videoTestimonios}
              channelUrl={channelUrl}
            />
          </div>
        )}
      </div>

      {/* Elemento oculto o target para preservar el ancla #videos si la pestaña de fotos está activa */}
      {activeTab !== 'videos' && <div id="videos" className="absolute top-0 pointer-events-none" />}
    </section>
  );
}
