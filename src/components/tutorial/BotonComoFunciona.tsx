'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';
import { getTutorialesSettings } from '@/app/actions/settings';
import { TEMAS_TUTORIAL } from '@/lib/tutoriales/temas';
import type { TutorialesSettings } from '@/types/settings';
import { cn } from '@/lib/utils';

let cachedSettingsPromise: Promise<TutorialesSettings> | null = null;
let cachedSettingsData: TutorialesSettings | null = null;

function cargarTutoriales(): Promise<TutorialesSettings> {
  if (cachedSettingsData) {
    return Promise.resolve(cachedSettingsData);
  }
  if (typeof getTutorialesSettings !== 'function') {
    return Promise.resolve({});
  }
  if (!cachedSettingsPromise) {
    try {
      cachedSettingsPromise = Promise.resolve(getTutorialesSettings())
        .then((data) => {
          cachedSettingsData = data || {};
          return cachedSettingsData;
        })
        .catch(() => ({}));
    } catch {
      cachedSettingsPromise = Promise.resolve({});
    }
  }
  return cachedSettingsPromise;
}

export function invalidarCacheTutoriales() {
  cachedSettingsData = null;
  cachedSettingsPromise = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ak:tutoriales-updated'));
  }
}

export interface BotonComoFuncionaProps {
  clave: string;
  className?: string;
  variant?: 'default' | 'dark' | 'compact';
  initialVideoId?: string | null;
}

export function BotonComoFunciona({
  clave,
  className,
  variant = 'default',
  initialVideoId,
}: BotonComoFuncionaProps) {
  const [videoId, setVideoId] = useState<string | null>(initialVideoId ?? null);
  const [abierto, setAbierto] = useState(false);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  const tema = TEMAS_TUTORIAL.find((t) => t.clave === clave);
  const tituloModal = tema?.titulo || '¿Cómo funciona?';

  useEffect(() => {
    if (initialVideoId !== undefined) {
      setVideoId(initialVideoId || null);
      return;
    }

    let activo = true;
    const sync = () => {
      cargarTutoriales().then((map) => {
        if (!activo) return;
        const id = map?.[clave]?.videoId;
        setVideoId(typeof id === 'string' && id.trim() ? id.trim() : null);
      });
    };

    sync();

    const onUpdated = () => {
      cachedSettingsData = null;
      cachedSettingsPromise = null;
      sync();
    };
    window.addEventListener('ak:tutoriales-updated', onUpdated);
    return () => {
      activo = false;
      window.removeEventListener('ak:tutoriales-updated', onUpdated);
    };
  }, [clave, initialVideoId]);

  useEffect(() => {
    if (!abierto) return;
    const frame = requestAnimationFrame(() => botonCerrarRef.current?.focus());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      focoAnteriorRef.current?.focus();
    };
  }, [abierto]);

  if (!videoId) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        data-tutorial-clave={clave}
        onClick={(e) => {
          e.stopPropagation();
          focoAnteriorRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          setAbierto(true);
        }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors whitespace-nowrap shrink-0 print:hidden',
          variant === 'compact' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
          variant === 'dark'
            ? 'bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm'
            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-sm dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800',
          className,
        )}
        aria-label={`¿Cómo funciona? ${tituloModal}`}
      >
        <Play className="h-3.5 w-3.5 fill-current shrink-0" aria-hidden="true" />
        <span>¿Cómo funciona?</span>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Tutorial: ${tituloModal}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setAbierto(false);
          }}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  Tutorial en video
                </p>
                <h3 className="truncate text-sm sm:text-base font-bold text-white">
                  {tituloModal}
                </h3>
              </div>
              <button
                ref={botonCerrarRef}
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar tutorial"
                className="inline-flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`}
                title={`Tutorial: ${tituloModal}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
