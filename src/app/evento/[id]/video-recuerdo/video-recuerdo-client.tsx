'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, SkipForward, PlayCircle, Download, Sparkles, Share2, Check } from 'lucide-react';
import type { RecapPhotoItem } from '@/lib/recap/recap-engine';

interface Props {
  eventName: string;
  eventDate?: string;
  images: RecapPhotoItem[];
  isPersonalized?: boolean;
  fiestaId?: string;
}

// Tiempo por foto en milisegundos para reproducción en pantalla
const SLIDE_DURATION = 4000;

export function VideoRecuerdoClient({ eventName, eventDate, images, isPersonalized, fiestaId }: Props) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-avance del slideshow interactivo
  useEffect(() => {
    if (!started || isGeneratingVideo) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [started, isGeneratingVideo, images.length]);

  const startExperience = () => {
    setStarted(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch((e) => console.warn('Audio play blocked:', e));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  const copyShareText = async () => {
    const text = `¡Mirá el resumen de la fiesta de ${eventName}! 📸✨\nPresupuestá tu evento con AK Producciones: https://akproducciones.uy/simulador-de-presupuesto`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch {
      // Ignorar fallback
    }
  };

  /**
   * Bloque 3: Generador de video vertical 100% en el celular del cliente (Client-side Canvas MediaRecorder).
   * Dibuja cada foto con zoom Ken-Burns, título, fecha y marca de agua discreta de AK.
   */
  const generateAndDownloadVideo = async () => {
    if (isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setGenerationProgress(0);

    const canvas = document.createElement('canvas');
    const width = 720;
    const height = 1280;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Tu navegador no soporta renderizado de canvas.');
      setIsGeneratingVideo(false);
      return;
    }

    try {
      // Cargar imágenes en memoria
      const loadedImgs: HTMLImageElement[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = images[i].imageUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continuar aunque una falle
        });
        loadedImgs.push(img);
        setGenerationProgress(Math.round(((i + 1) / images.length) * 30));
      }

      // Iniciar captura de stream de video desde el canvas
      const stream = canvas.captureStream(30);
      let mediaRecorder: MediaRecorder;
      const chunks: Blob[] = [];

      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      } catch {
        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        } catch {
          mediaRecorder = new MediaRecorder(stream);
        }
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.start();

      const framesPerImage = 60; // 2 segundos a 30fps por foto en el video exportable
      let totalRenderedFrames = 0;
      const totalFrames = loadedImgs.length * framesPerImage;

      for (let imgIdx = 0; imgIdx < loadedImgs.length; imgIdx++) {
        const img = loadedImgs[imgIdx];
        const post = images[imgIdx];

        for (let f = 0; f < framesPerImage; f++) {
          const progress = f / framesPerImage;
          const scale = 1.0 + progress * 0.08; // Efecto Ken-Burns suave

          // Fondo oscuro elegante con gradiente
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, width, height);

          // Dibujar imagen centrada y escalada manteniendo aspect ratio
          if (img.width > 0 && img.height > 0) {
            const aspect = img.width / img.height;
            let drawW = width * scale;
            let drawH = (width / aspect) * scale;
            if (drawH < height * 0.75) {
              drawH = height * 0.75 * scale;
              drawW = drawH * aspect;
            }
            const drawX = (width - drawW) / 2;
            const drawY = (height * 0.45 - drawH / 2);

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.clip();
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();
          }

          // Sombra inferior y superior
          const bottomGrad = ctx.createLinearGradient(0, height - 320, 0, height);
          bottomGrad.addColorStop(0, 'rgba(9, 13, 22, 0)');
          bottomGrad.addColorStop(1, 'rgba(9, 13, 22, 0.95)');
          ctx.fillStyle = bottomGrad;
          ctx.fillRect(0, height - 320, width, 320);

          // Header con nombre de fiesta
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(eventName, width / 2, height - 180);

          // Subtítulo
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 22px sans-serif';
          if (post.esTuFoto) {
            ctx.fillText('✨ Tu Recuerdo Especial', width / 2, height - 135);
          } else {
            ctx.fillText('Momentos de la Fiesta 🎉', width / 2, height - 135);
          }

          // Marca discreta AK abajo
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '16px sans-serif';
          ctx.fillText('AK PRODUCCIONES EVENTOS', width / 2, height - 60);

          totalRenderedFrames++;
          setGenerationProgress(30 + Math.round((totalRenderedFrames / totalFrames) * 65));
          await new Promise((r) => setTimeout(r, 16)); // ~30-60fps
        }
      }

      mediaRecorder.stop();
      await new Promise((resolve) => {
        mediaRecorder.onstop = resolve;
      });

      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      const downloadUrl = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `recuerdo-${eventName.toLowerCase().replace(/\s+/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setGenerationProgress(100);
      setTimeout(() => {
        setIsGeneratingVideo(false);
        setGenerationProgress(0);
      }, 1000);
    } catch (err: any) {
      console.error('Error generando video en canvas:', err);
      alert('No se pudo generar el archivo de video en este dispositivo.');
      setIsGeneratingVideo(false);
    }
  };

  if (!started) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-6 z-50">
        <div className="space-y-3 max-w-sm">
          {isPersonalized && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Tu Recuerdo Personalizado
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-wide text-white">
            {eventName}
          </h1>
          <p className="text-sm text-slate-400">
            {isPersonalized
              ? 'Tus fotos de la noche y los mejores momentos de la fiesta.'
              : 'Los momentos más queridos de la fiesta en video vertical.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={startExperience}
            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-base hover:scale-105 transition shadow-lg"
          >
            <PlayCircle className="w-5 h-5 text-indigo-600" />
            Reproducir Recuerdo
          </button>

          <button
            onClick={generateAndDownloadVideo}
            disabled={isGeneratingVideo}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-bold text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isGeneratingVideo
              ? `Generando video (${generationProgress}%)...`
              : 'Descargar para Historias (Vertical)'}
          </button>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      {/* Música de fondo */}
      <audio
        ref={audioRef}
        src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_b8c9103636.mp3?filename=emotional-piano-107684.mp3"
        loop
      />

      {/* Controles superpuestos en celular */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={generateAndDownloadVideo}
          disabled={isGeneratingVideo}
          className="px-3 py-2 bg-black/60 backdrop-blur-md rounded-full text-amber-300 hover:bg-black/80 transition text-xs font-bold flex items-center gap-1.5 border border-amber-500/30"
          title="Descargar video vertical"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isGeneratingVideo ? `${generationProgress}%` : 'Bajar Video'}
          </span>
        </button>

        <button
          onClick={copyShareText}
          className="p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition"
          title="Copiar texto para compartir"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleMute}
          className="p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
          className="p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Título superpuesto y autor abajo */}
      <div className="absolute bottom-8 left-6 right-6 z-50 pointer-events-none flex items-end justify-between">
        <div className="space-y-1">
          {currentImage?.esTuFoto && (
            <span className="inline-block px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[11px] font-black rounded shadow">
              Tu Foto
            </span>
          )}
          <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
            {eventName}
          </h2>
          <p className="text-white/80 font-medium text-xs md:text-sm drop-shadow-md">
            {currentIndex + 1} / {images.length} · {currentImage?.authorName || 'Invitado'}
          </p>
        </div>

        <div className="text-right text-[11px] font-bold text-white/60 tracking-wider">
          AK PRODUCCIONES
        </div>
      </div>

      {/* Slideshow animado (Ken Burns sutil + Fade) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Fondo borroso (blur) */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-2xl opacity-40 scale-110"
            style={{ backgroundImage: `url(${currentImage?.imageUrl})` }}
          />
          {/* Imagen principal */}
          <Image
            src={currentImage?.imageUrl || '/placeholder.png'}
            alt={currentImage?.authorName || 'Recuerdo'}
            fill
            className="object-contain"
            unoptimized
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
