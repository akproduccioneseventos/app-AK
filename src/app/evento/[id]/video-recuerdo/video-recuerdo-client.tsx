'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, SkipForward, PlayCircle } from 'lucide-react';
import type { SocialGalleryPost } from '@/types/social-gallery';

interface Props {
  eventName: string;
  images: SocialGalleryPost[];
}

// Tiempo por foto en milisegundos
const SLIDE_DURATION = 4000;

export function VideoRecuerdoClient({ eventName, images }: Props) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-avance
  useEffect(() => {
    if (!started) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_DURATION);
    
    return () => clearInterval(timer);
  }, [started, images.length]);

  const startExperience = () => {
    setStarted(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  if (!started) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-8 z-50">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-dancing_script text-indigo-400">
            Recuerdos de
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-wider">
            {eventName}
          </h2>
        </div>
        
        <button
          onClick={startExperience}
          className="group relative flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:scale-105 transition-transform"
        >
          <PlayCircle className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
          Reproducir Video
        </button>
        <p className="text-sm text-slate-400">Activá el sonido para una mejor experiencia</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      {/* Música de fondo (URL pública de prueba, en prod se podría pasar por settings) */}
      <audio 
        ref={audioRef} 
        src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_b8c9103636.mp3?filename=emotional-piano-107684.mp3" 
        loop 
      />

      {/* Controles superpuestos */}
      <div className="absolute top-6 right-6 z-50 flex gap-4">
        <button 
          onClick={toggleMute}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Título superpuesto permanente */}
      <div className="absolute bottom-10 left-10 z-50 pointer-events-none">
        <h2 className="text-3xl md:text-5xl font-dancing_script text-white drop-shadow-lg">
          {eventName}
        </h2>
        <p className="text-white/80 font-medium text-sm md:text-base drop-shadow-md">
          {currentIndex + 1} / {images.length}
        </p>
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
          {/* Fondo borroso (blur) para rellenar aspect ratios distintos */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-2xl opacity-50 scale-110"
            style={{ backgroundImage: `url(${currentImage?.imageUrl})` }}
          />
          {/* Imagen principal */}
          <img
            src={currentImage?.imageUrl}
            alt={currentImage?.authorName || 'Recuerdo'}
            className="absolute inset-0 w-full h-full object-contain"
          />
          
          {/* Nombre del autor abajo a la derecha */}
          {currentImage?.authorName && (
            <div className="absolute bottom-10 right-10 text-white/70 text-sm drop-shadow-md">
              Por {currentImage.authorName}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
