'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  ShieldCheck,
  X,
  RefreshCw,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Search,
} from 'lucide-react';
import type { SocialGalleryPost } from '@/types/social-gallery';
import { buscarFotosPorSelfie } from '@/lib/reconocimiento/buscador-selfie';

interface BuscadorSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: SocialGalleryPost[];
  nombreEvento?: string;
}

type PasoBuscador = 'permiso' | 'camara' | 'buscando' | 'resultados' | 'sin_resultados';

export function BuscadorSelfieModal({
  isOpen,
  onClose,
  posts,
  nombreEvento = 'la fiesta',
}: BuscadorSelfieModalProps) {
  const [paso, setPaso] = useState<PasoBuscador>('permiso');
  const [consentimiento, setConsentimiento] = useState(false);
  const [fotosEncontradas, setFotosEncontradas] = useState<SocialGalleryPost[]>([]);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Iniciar cámara sólo después del consentimiento explícito
  const iniciarCamara = async () => {
    setErrorCamara(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPaso('camara');
    } catch {
      setErrorCamara('No pudimos acceder a tu cámara. Comprobá los permisos del navegador.');
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      detenerCamara();
      setPaso('permiso');
      setConsentimiento(false);
      setFotosEncontradas([]);
    }
    return () => {
      detenerCamara();
    };
  }, [isOpen]);

  const aceptarPermisoYContinuar = () => {
    setConsentimiento(true);
    void iniciarCamara();
  };

  const capturarSelfieYBuscar = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 320;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    detenerCamara();
    setPaso('buscando');

    try {
      // Búsqueda en memoria local del teléfono (100% offline)
      const resultados = await buscarFotosPorSelfie(canvas, posts);

      // Pequeña pausa artificial suave para feedback visual de escaneo
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (resultados.length > 0) {
        setFotosEncontradas(resultados);
        setPaso('resultados');
      } else {
        setPaso('sin_resultados');
      }
    } catch {
      setPaso('sin_resultados');
    }
  };

  const reintentar = () => {
    setFotosEncontradas([]);
    void iniciarCamara();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <canvas ref={canvasRef} className="hidden" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Search className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-white">Encontrá tus fotos</h3>
                <p className="text-xs text-zinc-400">Reconocimiento instantáneo en tu celular</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content based on step */}
          <div className="flex-1 overflow-y-auto pr-1">
            {/* PASO 1: Permiso y Privacidad (Bloque 0) */}
            {paso === 'permiso' && (
              <div className="space-y-6 py-2 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-black text-white">Tu privacidad es lo primero</h4>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto">
                    Vamos a mirar tu cara en este teléfono para buscar tus fotos en {nombreEvento}.
                    <strong className="text-white block mt-2 font-bold">
                      No se guarda, no se sube a ningún servidor y no sale de tu celular.
                    </strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-left space-y-2 text-xs text-zinc-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Solo busca entre las fotos aprobadas de este evento.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Se procesa en segundos y la selfie se descarta al instante.</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={aceptarPermisoYContinuar}
                    className="w-full py-3.5 px-6 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Aceptar y sacar selfie
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 px-6 rounded-full text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-all"
                  >
                    Ver todas las fotos sin selfie
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: Cámara y Selfie */}
            {paso === 'camara' && (
              <div className="space-y-4 text-center">
                {errorCamara ? (
                  <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-3">
                    <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
                    <p>{errorCamara}</p>
                    <button
                      onClick={iniciarCamara}
                      className="px-4 py-2 rounded-full bg-rose-500/20 text-rose-200 font-bold text-xs"
                    >
                      Reintentar permiso
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden border-2 border-amber-400/60 shadow-2xl bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-0 border-[3px] border-dashed border-white/40 rounded-full m-8 pointer-events-none" />
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      Mirá a la cámara de frente con buena iluminación.
                    </p>
                    <button
                      onClick={capturarSelfieYBuscar}
                      className="w-full py-3.5 px-6 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Buscar mis fotos ahora
                    </button>
                  </>
                )}
              </div>
            )}

            {/* PASO 3: Buscando */}
            {paso === 'buscando' && (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 animate-pulse">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
                <h4 className="text-base font-black text-white">Buscando tus fotos en la galería...</h4>
                <p className="text-xs text-zinc-400">Analizando en tu teléfono de forma 100% privada</p>
              </div>
            )}

            {/* PASO 4: Resultados Encontrados */}
            {paso === 'resultados' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    ¡Encontramos {fotosEncontradas.length} foto(s) tuya(s)!
                  </span>
                  <button
                    onClick={reintentar}
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Otra selfie
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {fotosEncontradas.map((foto) => (
                    <div
                      key={foto.id}
                      className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 aspect-square"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto.imageUrl}
                        alt="Tu recuerdo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <a
                        href={foto.imageUrl}
                        download={`recuerdo-${foto.id}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 p-2 rounded-full bg-black/70 hover:bg-amber-400 hover:text-zinc-950 text-white transition-all shadow-md"
                        title="Descargar foto"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-full bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-xs font-bold transition-all border border-zinc-700"
                  >
                    Ver todas las fotos de la fiesta
                  </button>
                </div>
              </div>
            )}

            {/* PASO 5: Sin Resultados */}
            {paso === 'sin_resultados' && (
              <div className="py-8 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-black text-white">No encontramos fotos tuyas todavía</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Puede ser que las fotos se estén cargando todavía o que aún no hayas salido en una.
                    Probá con mejor luz o volvé a intentar.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={reintentar}
                    className="w-full py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Probar con otra selfie
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-full text-zinc-400 hover:text-white text-xs font-bold transition-all"
                  >
                    Ver todas las fotos de la fiesta
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
