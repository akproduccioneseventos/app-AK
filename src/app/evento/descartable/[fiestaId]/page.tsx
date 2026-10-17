'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft, Sparkles, Clock, Film, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPublicSocialEvent, uploadSocialPost } from '@/app/actions/social-gallery';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';

const MAX_FOTOS_ROLLO = 12;

export default function CamaraDescartablePage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<PublicSocialEvent | null>(null);
  const [fotosRestantes, setFotosRestantes] = useState(MAX_FOTOS_ROLLO);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDisparando, setIsDisparando] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [autorNombre, setAutorNombre] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Leer estado guardado en el celular
  useEffect(() => {
    getPublicSocialEvent(fiestaId).then((f) => {
      if (f) setFiesta(f);
    });

    const guardadas = localStorage.getItem(`ak_rollo_${fiestaId}`);
    if (guardadas !== null) {
      const rest = Number(guardadas);
      if (!Number.isNaN(rest)) setFotosRestantes(rest);
    }
    const nombreGuardado = localStorage.getItem(`ak_autor_${fiestaId}`) || '';
    setAutorNombre(nombreGuardado);
  }, [fiestaId]);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Tu navegador no permite acceso a la cámara.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setHasCamera(true);
      setCameraError(null);
    } catch (err: any) {
      setCameraError(err?.message || 'No se pudo acceder a la cámara.');
      setHasCamera(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const dispararFotoDescartable = async () => {
    if (fotosRestantes <= 0 || isDisparando || !videoRef.current || !canvasRef.current) return;
    setIsDisparando(true);
    setFlashActive(true);

    setTimeout(() => setFlashActive(false), 200);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar el revelador.');

      // Dibujar imagen con filtro retro/vintage
      ctx.filter = 'contrast(115%) saturate(120%) sepia(15%)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Marca de fecha retro en la esquina inferior derecha
      const ahora = new Date();
      const fechaStamp = `${String(ahora.getDate()).padStart(2, '0')}/${String(ahora.getMonth() + 1).padStart(2, '0')}/'${String(ahora.getFullYear()).slice(-2)}`;
      ctx.filter = 'none';
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'right';
      ctx.fillText(fechaStamp, canvas.width - 30, canvas.height - 30);

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.88));
      if (!blob) throw new Error('Error al capturar foto.');

      const file = new File([blob], `descartable_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fiestaId', fiestaId);
      formData.append('authorName', autorNombre.trim() || 'Invitado');
      formData.append('sourceModule', 'fotocabina');

      await uploadSocialPost(formData).catch(() => {});

      const nuevasRestantes = fotosRestantes - 1;
      setFotosRestantes(nuevasRestantes);
      localStorage.setItem(`ak_rollo_${fiestaId}`, String(nuevasRestantes));
      setShowConfirmacion(true);
      setTimeout(() => setShowConfirmacion(false), 3000);
    } catch (err: any) {
      console.warn('[CamaraDescartable] Error al tomar foto:', err);
    } finally {
      setIsDisparando(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-stone-900 text-stone-100 flex flex-col justify-between overflow-hidden select-none font-mono">
      {/* Flash visual al disparar */}
      {flashActive && <div className="absolute inset-0 z-50 bg-white" />}

      {/* Cabecera estilo visor de cámara antigua */}
      <header className="relative z-30 flex items-center justify-between p-4 bg-stone-950/90 border-b border-stone-800 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full bg-stone-800 text-stone-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black tracking-widest uppercase text-amber-400">
            Cámara Descartable POV
          </span>
        </div>

        {/* Contador mecánico de fotos restantes */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-stone-900 border-2 border-stone-700 shadow-inner">
          <span className="text-[10px] text-stone-400 font-bold uppercase">Rollo</span>
          <span className="text-sm font-black text-amber-400 tabular-nums">
            {String(fotosRestantes).padStart(2, '0')}/{MAX_FOTOS_ROLLO}
          </span>
        </div>
      </header>

      {/* Visor central con marco analógico */}
      <main className="relative flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border-4 border-stone-700 bg-black shadow-2xl shadow-black/80">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
            style={{ filter: 'contrast(115%) saturate(110%)' }}
          />

          {/* Mira central de enfoque */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-24 h-24 border border-amber-400/30 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-400/50" />
            </div>
          </div>

          {/* Cartel de foto capturada en el rollo */}
          <AnimatePresence>
            {showConfirmacion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
              >
                <CheckCircle2 className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
                <h4 className="text-lg font-black text-white">¡Foto guardada en el rollo!</h4>
                <p className="mt-1 text-xs text-stone-300">
                  Nadie puede verla todavía. Se revela mañana a las 12:00 hs en el Álbum Oficial.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Panel inferior con disparador y nombre */}
      <footer className="relative z-30 flex flex-col items-center gap-4 p-6 bg-stone-950/95 border-t border-stone-800">
        <div className="w-full max-w-sm flex items-center gap-2">
          <input
            type="text"
            value={autorNombre}
            onChange={(e) => {
              setAutorNombre(e.target.value);
              localStorage.setItem(`ak_autor_${fiestaId}`, e.target.value);
            }}
            placeholder="Tu nombre (para el revelado)"
            className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-500 text-center"
          />
        </div>

        {fotosRestantes > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={dispararFotoDescartable}
              disabled={isDisparando}
              className="h-20 w-20 rounded-full bg-stone-200 text-stone-950 hover:bg-white border-4 border-amber-500 shadow-2xl active:scale-90 transition flex items-center justify-center"
            >
              <div className="h-14 w-14 rounded-full bg-amber-500 border-2 border-stone-900 flex items-center justify-center">
                <Camera className="w-7 h-7 text-stone-950" />
              </div>
            </Button>
            <span className="text-[11px] font-bold text-stone-400">
              Disparar foto analógica
            </span>
          </div>
        ) : (
          <div className="text-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 max-w-sm">
            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <h5 className="text-sm font-black text-amber-300">¡Terminaste tu rollo de 12 fotos!</h5>
            <p className="text-[11px] text-stone-300 mt-1">
              Tus recuerdos están en el laboratorio. Entrá al Álbum mañana a las 12:00 hs para ver todo el revelado.
            </p>
          </div>
        )}
      </footer>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
