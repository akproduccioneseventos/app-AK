'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getVideosDeAyuda } from '@/app/actions/videos-de-ayuda';
import type { VideoAyudaInfo } from '@/lib/videos-de-ayuda';

export interface VideoDeAyudaProps {
  lugar: string;
  className?: string;
  initialVideo?: VideoAyudaInfo | null;
}

export function VideoDeAyuda({ lugar, className = '', initialVideo }: VideoDeAyudaProps) {
  const [video, setVideo] = useState<VideoAyudaInfo | null>(initialVideo ?? null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let activo = true;
    if (initialVideo !== undefined) {
      setVideo(initialVideo);
      return;
    }

    getVideosDeAyuda()
      .then((videos) => {
        if (!activo) return;
        const encontrado = videos.find((v) => v.lugar === lugar) || null;
        setVideo(encontrado);
      })
      .catch(() => {
        if (activo) setVideo(null);
      });

    return () => {
      activo = false;
    };
  }, [lugar, initialVideo]);

  if (!video || !video.videoId) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full transition-colors shadow-sm dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 ${className}`}
        aria-label="¿Cómo se usa? Ver video de ayuda"
      >
        <span aria-hidden="true">▶</span>
        <span>¿Cómo se usa?</span>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setAbierto(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 text-zinc-100">
              <h3 className="text-sm font-semibold truncate pr-2">
                {video.titulo || 'Video de ayuda'}
              </h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                aria-label="Cerrar video de ayuda"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1`}
                title={video.titulo || 'Video de ayuda'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VideoDeAyuda;
