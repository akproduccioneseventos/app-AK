'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Box, Sparkles, Loader2, Download, MessageCircle, AlertCircle } from 'lucide-react';
import { SalonSceneAislada } from './SalonSceneAislada';
import type { SalonSceneRef } from './SalonScene';
import type { DecoracionData } from '@/types/fiesta';
import { generarFotoDelSalonDesdeElPortal } from '@/app/actions/fiesta/decoracion.actions';

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
  fiestaId?: string;
  decoracion?: DecoracionData | null;
  fotoFallbackUrl?: string;
  fotosAi?: string[];
  className?: string;
  titulo?: string;
  subtitulo?: string;
  mostrarEncabezado?: boolean;
}

export function Salon3DClienteView({
  fiestaId,
  decoracion,
  fotoFallbackUrl,
  fotosAi = [],
  className = '',
  titulo = 'Tu Salón en 3D',
  subtitulo = 'Girá el salón con el dedo para recorrer la distribución de mesas, pista y sectores.',
  mostrarEncabezado = true,
}: Salon3DClienteViewProps) {
  const [canRenderWebGL, setCanRenderWebGL] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const captureRef = useRef<SalonSceneRef | null>(null);

  const [fotosGeneradas, setFotosGeneradas] = useState<string[]>(() => {
    return (fotosAi && fotosAi.length > 0)
      ? fotosAi
      : (decoracion?.fotosGeneradasAi || []);
  });

  const [imagenMostrada, setImagenMostrada] = useState<string | null>(() => {
    if (fotosAi && fotosAi.length > 0) return fotosAi[fotosAi.length - 1];
    if (decoracion?.fotosGeneradasAi && decoracion.fotosGeneradasAi.length > 0) {
      return decoracion.fotosGeneradasAi[decoracion.fotosGeneradasAi.length - 1];
    }
    return null;
  });

  useEffect(() => {
    if (fotosAi && fotosAi.length > 0) {
      setFotosGeneradas(fotosAi);
    } else if (decoracion?.fotosGeneradasAi && decoracion.fotosGeneradasAi.length > 0) {
      setFotosGeneradas(decoracion.fotosGeneradasAi);
    }
  }, [fotosAi, decoracion?.fotosGeneradasAi]);

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

  const totalFotos = fotosGeneradas.length;
  const tieneElementos3D = (decoracion?.salonElements?.length || 0) > 0;
  const puedeMostrarBoton = Boolean(tieneElementos3D && canRenderWebGL !== false && fiestaId);

  const handleGenerarFoto = async () => {
    if (!fiestaId || isGenerating || totalFotos >= 3) return;
    const captura = captureRef.current?.captureScreenshot();
    if (!captura) {
      setGenerationError('La vista 3D todavía se está preparando. Esperá un momento y volvé a intentar.');
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await generarFotoDelSalonDesdeElPortal(fiestaId, captura);
      if (res.success && res.imageUrl) {
        setFotosGeneradas((prev) => [...prev, res.imageUrl!]);
        setImagenMostrada(res.imageUrl);
      } else {
        setGenerationError(res.error || 'No se pudo generar la imagen. Probá de nuevo.');
      }
    } catch (err) {
      console.error('[Salon3DClienteView] Error al generar foto:', err);
      setGenerationError('No se pudo generar la imagen por un error de conexión. Probá de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

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
        unoptimized
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
            {decoracion && <SalonScene captureRef={captureRef} onCaptureReady={() => setCaptureReady(true)} decoracion={decoracion} />}
          </SalonSceneAislada>
        )}

        {puedeMostrarBoton && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2 max-w-[90%] sm:max-w-md pointer-events-auto">
            <button
              type="button"
              onClick={handleGenerarFoto}
              disabled={isGenerating || totalFotos >= 3 || !captureReady}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg shadow-black/50 backdrop-blur-md transition-all border border-purple-400/30"
              data-testid="btn-asi-va-a-quedar"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Armando tu foto…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Así va a quedar tu fiesta</span>
                </>
              )}
            </button>
            {!captureReady && canRenderWebGL !== false && (
              <p role="status" className="rounded-lg bg-slate-950/90 px-3 py-2 text-xs text-slate-200">
                Preparando la captura del salón…
              </p>
            )}
            {generationError && (
              <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-950/90 px-3 py-2 text-left text-xs text-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />{generationError}
              </p>
            )}
            {totalFotos >= 3 && (
              <div
                data-testid="cartel-tope-fotos"
                className="bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-500/40 text-xs font-semibold text-amber-300 shadow-xl"
              >
                Ya armaste tus 3 fotos. Si querés otra, pedísela al equipo.
              </div>
            )}
          </div>
        )}
      </div>

      {imagenMostrada && (
        <div
          data-testid="seccion-foto-generada"
          className="space-y-4 rounded-2xl border border-purple-500/30 bg-slate-900/90 p-4 sm:p-6 shadow-2xl backdrop-blur-md"
        >
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
            <Image
              src={imagenMostrada}
              alt="Así va a quedar tu fiesta"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={imagenMostrada}
                download={`salon-decorado-${fiestaId || 'fiesta'}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-md transition-colors"
                data-testid="btn-descargar-foto"
              >
                <Download className="w-4 h-4" />
                Descargar
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`¡Mirá cómo va a quedar la decoración de mi fiesta!\n${imagenMostrada}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md transition-colors"
                data-testid="btn-whatsapp-foto"
              >
                <MessageCircle className="w-4 h-4" />
                Compartir por WhatsApp
              </a>
            </div>
            <p
              data-testid="contador-fotos-restantes"
              className="text-xs text-slate-300 font-medium"
            >
              Te quedan {Math.max(0, 3 - totalFotos)} de 3
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
