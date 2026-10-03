'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Download, Share2, Play, Check, X, Loader2, Sparkles } from 'lucide-react';
import {
  generarVideoResumenWebM,
  type ItemFotoResumen,
  type ResultadoVideoResumen,
} from '@/lib/video-resumen/generar-video-resumen';
import { useToast } from '@/hooks/use-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  fecha: string;
  fotos: ItemFotoResumen[];
  fiestaId?: string;
}

export function TuVideoDeLaFiestaModal({
  isOpen,
  onClose,
  titulo,
  fecha,
  fotos,
  fiestaId,
}: Props) {
  const { toast } = useToast();
  const [generando, setGenerando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState<ResultadoVideoResumen | null>(null);
  const [copiado, setCopiado] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resultadoRef = useRef<ResultadoVideoResumen | null>(null);
  resultadoRef.current = resultado;

  useEffect(() => {
    if (!isOpen) {
      if (resultadoRef.current?.url) {
        URL.revokeObjectURL(resultadoRef.current.url);
      }
      setResultado(null);
      setGenerando(false);
      setProgreso(0);
    }
  }, [isOpen]);

  const handleGenerar = async () => {
    if (generando) return;
    setGenerando(true);
    setProgreso(0);

    try {
      const res = await generarVideoResumenWebM({
        titulo,
        fecha,
        fotos: fotos.slice(0, 30),
        duracionSegundos: 60,
        onProgress: (p) => setProgreso(p),
      });
      setResultado(res);
      toast({
        title: '¡Video resumen listo!',
        description: 'Tu video vertical de la fiesta ya está disponible para descargar y compartir.',
      });
    } catch (err: any) {
      toast({
        title: 'Error al generar video',
        description: err?.message || 'No se pudo generar el video en este dispositivo.',
        variant: 'destructive',
      });
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargar = () => {
    if (!resultado) return;
    const a = document.createElement('a');
    a.href = resultado.url;
    a.download = `video-resumen-${titulo.toLowerCase().replace(/\s+/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCompartir = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `¡Mirá el video resumen de la fiesta "${titulo}"! 🎥✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tu video de la fiesta — ${titulo}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback a portapapeles
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
      toast({ title: 'Enlace copiado al portapapeles' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-amber-500/20 shadow-2xl p-6 text-white space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Tu video de la fiesta</h2>
            <p className="text-xs text-zinc-400">Montaje vertical con fotos reales y música</p>
          </div>
        </div>

        {/* Video Preview o Placeholder */}
        <div className="relative aspect-[9/16] max-h-[380px] w-full mx-auto rounded-xl bg-zinc-900 border border-white/10 overflow-hidden flex flex-col items-center justify-center text-center p-4">
          {resultado ? (
            <video
              ref={videoRef}
              src={resultado.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : generando ? (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Armando tu video resumen...</p>
                <p className="text-xs text-zinc-400 mt-1">Tarda alrededor de un minuto y medio. Dejá esta pantalla abierta. ({progreso}%)</p>
              </div>
              <div className="w-48 h-2 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Sparkles className="w-8 h-8 text-amber-400/80 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">
                Resumen de 60 a 90 segundos preparado con las mejores fotos.
              </p>
              <button
                onClick={handleGenerar}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-bold text-xs hover:bg-amber-300 transition shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Generar Video Resumen
              </button>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {resultado && (
            <>
              <button
                onClick={handleCompartir}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white hover:bg-zinc-800 transition"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                Compartir
              </button>
              <button
                onClick={handleDescargar}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 text-xs font-black hover:bg-amber-300 transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
