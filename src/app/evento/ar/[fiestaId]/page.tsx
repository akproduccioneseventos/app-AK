'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, X, ArrowLeft, RefreshCw, Volume2, VolumeX, CheckCircle2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPublicSocialEvent } from '@/app/actions/social-gallery';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';

export default function EventoWebArPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<PublicSocialEvent | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'holograma' | 'menu'>('holograma');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Iniciar cámara trasera para WebAR ambiental
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
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
      setCameraError(err?.message || 'No se pudo acceder a la cámara trasera para Realidad Aumentada.');
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
    getPublicSocialEvent(fiestaId).then((f) => {
      if (f) setFiesta(f);
    });
    startCamera();
    return () => {
      stopCamera();
    };
  }, [fiestaId, startCamera, stopCamera]);

  // Capturar foto AR
  const takeArSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dibujar cámara
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Dibujar elementos holográficos superpuestos
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.fillText(`✨ ${fiesta?.configuracion?.nombreEvento || 'AK Producciones'} ✨`, canvas.width / 2, 80);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Experiencia WebAR · Realidad Aumentada', canvas.width / 2, 120);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
  };

  const nombreEvento = fiesta?.configuracion?.nombreEvento || 'Gran Celebración';

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white overflow-hidden select-none">
      {/* Feed de Cámara Real en Vivo */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full object-cover z-0"
      />

      {/* Capa de destellos y partículas doradas en Realidad Aumentada */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden bg-radial-gradient from-transparent via-black/20 to-black/60">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
            style={{
              width: `${6 + (i % 5) * 3}px`,
              height: `${6 + (i % 5) * 3}px`,
              left: `${10 + ((i * 19) % 80)}%`,
              top: `${15 + ((i * 23) % 70)}%`,
            }}
            animate={{
              y: [0, -35, 0],
              opacity: [0.3, 0.95, 0.3],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 2.5 + (i % 3),
              repeat: Infinity,
              delay: i * 0.18,
            }}
          />
        ))}
      </div>

      {/* Barra superior de controles */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-amber-500/40 text-xs font-bold text-amber-300 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Realidad Aumentada (WebAR)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Holograma 3D central flotante */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 pointer-events-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: [1, 1.02, 1], opacity: 1, y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full max-w-sm rounded-3xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-950/70 via-black/80 to-slate-950/90 p-6 text-center backdrop-blur-md shadow-[0_0_50px_rgba(251,191,36,0.35)] pointer-events-auto"
        >
          {activeMode === 'holograma' ? (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-amber-400 bg-amber-400/20 flex items-center justify-center shadow-lg shadow-amber-400/20">
                <Sparkles className="w-10 h-10 text-amber-300 animate-pulse" />
              </div>

              <div>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-amber-400">
                  Mensaje Holográfico
                </span>
                <h2 className="mt-1 text-2xl font-black text-white">{nombreEvento}</h2>
                <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                  ¡Te damos la bienvenida a nuestra noche! Apuntá con la cámara hacia el salón o las mesas para interactuar con el evento.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={() => router.push(`/evento/hub/${fiestaId}`)}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 font-black text-slate-950 hover:brightness-110 shadow-lg"
                >
                  Entrar a la fiesta
                </Button>
                <button
                  onClick={() => setActiveMode('menu')}
                  className="text-xs text-amber-300 hover:text-amber-200 underline pt-1 font-bold"
                >
                  Ver Menú y Tragos en Realidad Aumentada
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-amber-400">
                Menú y Barra en tu Mesa
              </span>
              <h3 className="text-xl font-black text-white">Carta Digital 3D</h3>
              <p className="text-xs text-zinc-300">
                Explorá la carta de tragos y platos directamente desde tu teléfono mientras estás en tu mesa.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={() => router.push(`/evento/barra/${fiestaId}`)}
                  className="w-full rounded-2xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
                >
                  Abrir Carta de Tragos
                </Button>
                <button
                  onClick={() => setActiveMode('holograma')}
                  className="text-xs text-zinc-400 hover:text-white underline pt-1"
                >
                  Volver al Holograma de Bienvenida
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Barra inferior de captura */}
      <footer className="absolute bottom-6 inset-x-0 z-30 flex flex-col items-center gap-3 px-6 pointer-events-auto">
        <div className="flex items-center gap-4">
          <Button
            onClick={takeArSnapshot}
            className="h-16 w-16 rounded-full bg-white text-slate-950 hover:bg-zinc-200 border-4 border-amber-400 shadow-2xl flex items-center justify-center transition active:scale-90"
            title="Tomar foto de recuerdo en Realidad Aumentada"
          >
            <Camera className="w-7 h-7 text-slate-950" />
          </Button>
        </div>
        <p className="text-[11px] font-bold text-white/70 tracking-wide drop-shadow">
          Tocá el botón blanco para sacar una foto con el holograma
        </p>
      </footer>

      {/* Modal de foto capturada */}
      <AnimatePresence>
        {capturedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
          >
            <div className="w-full max-w-md rounded-3xl border border-white/20 bg-slate-900 p-4 text-center space-y-4 shadow-2xl">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedPhoto} alt="Captura WebAR" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-black text-white">¡Recuerdo Holográfico Guardado!</h3>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCapturedPhoto(null)}
                  className="flex-1 rounded-xl border-white/20 text-white"
                >
                  Cerrar
                </Button>
                <a
                  href={capturedPhoto}
                  download={`recuerdo-ar-${fiestaId}.jpg`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
                >
                  Descargar
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
