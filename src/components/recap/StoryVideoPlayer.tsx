'use client';

import React, { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Share2, Sparkles, Volume2, VolumeX, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SocialGalleryPost } from '@/types/social-gallery';

interface Props {
  eventName: string;
  photos: SocialGalleryPost[];
}

export function StoryVideoPlayer({ eventName, photos }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const durationPerSlide = 4000; // 4s por foto

  useEffect(() => {
    if (!isPlaying || photos.length === 0) return;

    const interval = 50; // update progress every 50ms
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((curr) => (curr + 1) % photos.length);
          return 0;
        }
        return prev + (interval / durationPerSlide) * 100;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, photos.length, currentIndex]);

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      void navigator.share({
        title: `Recuerdos de ${eventName}`,
        text: `¡Mirá los mejores momentos de ${eventName} en el video recap de AK Producciones! 🎉`,
        url: window.location.href,
      });
    } else {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `¡Mirá los mejores momentos de ${eventName}! 🎉 ${window.location.href}`
      )}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto my-8 select-none">
      <div className="relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-800 flex flex-col justify-between">
        {/* Progress bars on top (Instagram Story style) */}
        <div className="absolute top-3 inset-x-3 z-30 flex gap-1.5">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header inside story */}
        <div className="relative z-20 pt-7 px-4 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center font-black text-xs">
              AK
            </div>
            <div>
              <p className="text-xs font-black leading-tight truncate max-w-[160px]">{eventName}</p>
              <p className="text-[10px] text-white/80">Recap Oficial</p>
            </div>
          </div>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Story Photo with Ken Burns animation */}
        <div className="absolute inset-0 z-10 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhoto.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <NextImage
                src={currentPhoto.imageUrl}
                alt={currentPhoto.dedication || 'Recuerdo'}
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-cover"
                unoptimized
                priority
              />
            </motion.div>
          </AnimatePresence>
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Footer info & caption */}
        <div className="relative z-20 p-5 text-white space-y-3 drop-shadow-lg">
          {currentPhoto.likes != null && currentPhoto.likes > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600/80 backdrop-blur-md text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>{currentPhoto.likes} me gusta</span>
            </div>
          )}

          {currentPhoto.dedication ? (
            <p className="text-sm font-semibold line-clamp-2 leading-snug">
              &ldquo;{currentPhoto.dedication}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-white/80 font-medium">
              Foto compartida por {currentPhoto.authorName || 'Invitado'}
            </p>
          )}

          <div className="pt-1 flex items-center justify-between border-t border-white/20 text-[11px] text-white/70">
            <span>AK Producciones • Salto, UY</span>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-white font-bold hover:underline"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartir Historia
            </button>
          </div>
        </div>
      </div>

      {/* Share / Action bar */}
      <div className="mt-4 flex gap-2">
        <Button
          onClick={handleShare}
          className="flex-1 h-12 rounded-2xl font-black bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-lg active:scale-95 transition-all"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartir Video en WhatsApp
        </Button>
      </div>
    </div>
  );
}
