'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Box } from 'lucide-react';
import { SalonSceneAislada } from './SalonSceneAislada';
import type { DecoracionData } from '@/types/fiesta';

const SalonScene = dynamic(
  () => import('./SalonScene').then((mod) => mod.SalonScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs">
        Cargando vista 3D del salón...
      </div>
    ),
  }
);

export interface Salon3DClienteViewProps {
  decoracion?: DecoracionData | null;
  fotoFallbackUrl?: string;
  fotosAi?: string[];
  className?: string;
  titulo?: string;
  subtitulo?: string;
  mostrarEncabezado?: boolean;
}

export function Salon3DClienteView({
  decoracion,
  fotoFallbackUrl,
  fotosAi = [],
  className = '',
  titulo = 'Tu Salón en 3D',
  subtitulo = 'Girá el salón con el dedo para recorrer la distribución de mesas, pista y sectores.',
  mostrarEncabezado = true,
}: Salon3DClienteViewProps) {
  const [canRenderWebGL, setCanRenderWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setCanRenderWebGL(Boolean(gl));
    } catch {
      setCanRenderWebGL(false);
    }
  }, []);

  const tieneElementos3D = (decoracion?.salonElements?.length || 0) > 0;
  const imagenFallback =
    fotoFallbackUrl ||
    fotosAi[0] ||
    decoracion?.salonPreview3dUrl ||
    decoracion?.salonPlanBackgroundImageUrl ||
    '/media/salones/default.jpg';

  const renderFotoFallback = (mensaje = 'Vista en foto') => (
    <div className="relative w-full h-full min-h-[300px]">
      <Image
        src={imagenFallback}
        alt="Visualización del Salón"
        fill
        className="object-cover"
      />
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-slate-300">
        {mensaje}
      </div>
    </div>
  );

  return (
    <section className={`space-y-4 ${className}`} data-testid="seccion-salon-3d">
      {mostrarEncabezado && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-purple-400" />
              {titulo}
            </h2>
            <p className="text-xs text-slate-400">{subtitulo}</p>
          </div>
        </div>
      )}

      <div className="relative w-full h-[380px] sm:h-[480px] rounded-2xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl">
        {!tieneElementos3D || canRenderWebGL === false ? (
          renderFotoFallback(
            canRenderWebGL === false
              ? 'Vista en foto (tu dispositivo no soporta aceleración 3D)'
              : 'Vista en foto'
          )
        ) : (
          <SalonSceneAislada fallback={renderFotoFallback('Vista en foto')}>
            {decoracion && <SalonScene decoracion={decoracion} />}
          </SalonSceneAislada>
        )}
      </div>
    </section>
  );
}
