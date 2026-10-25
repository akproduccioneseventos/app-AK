'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getVideosDeAyuda } from '@/app/actions/videos-de-ayuda';
import type { VideoAyudaInfo } from '@/lib/videos-de-ayuda';

/** Tab y Shift+Tab dan la vuelta adentro del visor abierto, como en el de videos (orden 199). */
function mantenerElFocoAdentro(e: KeyboardEvent, dentroDe: HTMLElement | null | undefined) {
  if (e.key !== 'Tab' || !(dentroDe instanceof HTMLElement)) return;
  const enfocables = Array.from(
    dentroDe.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], iframe, video[controls], [tabindex]:not([tabindex="-1"])'),
  );
  if (enfocables.length === 0) return;
  const primero = enfocables[0];
  const ultimo = enfocables[enfocables.length - 1];
  const actual = document.activeElement;
  if (e.shiftKey && (actual === primero || !dentroDe.contains(actual))) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && (actual === ultimo || !dentroDe.contains(actual))) {
    e.preventDefault();
    primero.focus();
  }
}

export interface VideoDeAyudaProps {
  lugar: string;
  className?: string;
  initialVideo?: VideoAyudaInfo | null;
}

export function VideoDeAyuda({ lugar, className = '', initialVideo }: VideoDeAyudaProps) {
  const [video, setVideo] = useState<VideoAyudaInfo | null>(initialVideo ?? null);
  const [abierto, setAbierto] = useState(false);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  // Orden 199: al abrir, el foco entra al visor; Escape cierra; al cerrar vuelve al botón que lo abrió.
  useEffect(() => {
    if (!abierto) return;
    const cuadro = requestAnimationFrame(() => botonCerrarRef.current?.focus());
    const alApretar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        return;
      }
      mantenerElFocoAdentro(e, botonCerrarRef.current?.closest('[role="dialog"]') as HTMLElement | null);
    };
    window.addEventListener('keydown', alApretar);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener('keydown', alApretar);
      focoAnteriorRef.current?.focus();
    };
  }, [abierto]);

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
        onClick={() => {
          focoAnteriorRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          setAbierto(true);
        }}
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
                ref={botonCerrarRef}
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
