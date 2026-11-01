'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image, { type ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageCircle,
  Users,
  X,
  Layers,
} from 'lucide-react';
import type { SalonPhoto } from '@/lib/salon-helper';
import { canUseNextImage } from '@/lib/next-image-url';
import { trackClubEvent } from '@/lib/analytics/club-uruguay-analytics';

const passthroughImageLoader = ({ src }: ImageLoaderProps) => src;

export function SalonMedia({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className: string;
}) {
  if (canUseNextImage(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
  }

  return (
    <Image
      loader={passthroughImageLoader}
      unoptimized
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}

export function ClubUruguayHeroActions({
  whatsappHref,
  simulatorHref = '/simulador-de-presupuesto?salon=club',
}: {
  whatsappHref: string;
  simulatorHref?: string;
}) {
  return (
    <div className="flex flex-col gap-3.5 sm:flex-row">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClubEvent('clickWhatsApp', { ubicacion: 'hero', cta: 'coordinar_visita' })}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-7 py-3.5 font-black text-zinc-950 transition-colors hover:bg-emerald-300 shadow-lg shadow-emerald-950/20"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" /> Coordinar visita por WhatsApp
      </a>
      <Link
        href={simulatorHref}
        onClick={() => trackClubEvent('clickSimulador', { ubicacion: 'hero', cta: 'calcular_presupuesto' })}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 font-black text-white transition-colors hover:bg-red-500 shadow-lg shadow-red-950/30"
      >
        <CalendarDays className="h-5 w-5" aria-hidden="true" /> Calcular presupuesto
      </Link>
    </div>
  );
}

export function ClubUruguayClosingActions({
  whatsappHref,
  simulatorHref = '/simulador-de-presupuesto?salon=club',
}: {
  whatsappHref: string;
  simulatorHref?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClubEvent('clickWhatsApp', { ubicacion: 'cierre', cta: 'coordinar_visita' })}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 font-black text-zinc-950 transition-colors hover:bg-emerald-300 shadow-md"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" /> Coordinar visita por WhatsApp
      </a>
      <Link
        href={simulatorHref}
        onClick={() => trackClubEvent('clickSimulador', { ubicacion: 'cierre', cta: 'calcular_presupuesto' })}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/20 bg-zinc-800 px-6 py-3.5 font-black text-white transition-colors hover:bg-zinc-700"
      >
        <CalendarDays className="h-5 w-5 text-red-400" aria-hidden="true" /> Calcular presupuesto
      </Link>
    </div>
  );
}

interface ClubUruguayInteractiveProps {
  photos: SalonPhoto[];
  whatsappNumber: string;
}

export function ClubUruguayInteractive({ photos, whatsappNumber }: ClubUruguayInteractiveProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    trackClubEvent('interesClub');
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const nextPhoto = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % photos.length : null));
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + photos.length) % photos.length : null));
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      } else if (e.key === 'ArrowLeft') {
        prevPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, closeLightbox, nextPhoto, prevPhoto]);

  const buildWaUrl = (text: string) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

  const handleWhatsAppClick = (ubicacion: string, cta: string, espacio?: 'principal' | 'intimo') => {
    trackClubEvent('clickWhatsApp', { ubicacion, cta, espacio });
    if (espacio) {
      trackClubEvent('espacioConsultado', { espacio, ubicacion });
    }
  };

  return (
    <>
      {/* ── BANDA 2: Dos espacios comparables ── */}
      <section id="espacios" className="border-b border-zinc-200 bg-white py-20 text-zinc-950 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-widest text-red-600">
              Distribución y aforos informados
            </p>
            <h2 className="mt-3 font-headline text-3xl font-black sm:text-5xl">
              Dos espacios para cada escala de celebración
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              Club Uruguay dispone de dos áreas independientes para adecuarse al formato de tu fiesta.
              Las capacidades son informadas y están sujetas a la distribución de mesas, pista de baile y montaje.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Espacio 1: Salón Principal */}
            <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-zinc-50 p-7 shadow-sm transition hover:border-zinc-300 hover:shadow-md sm:p-9">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-red-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-700">
                    Grandes celebraciones
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                    <Users className="h-4 w-4 text-red-600" aria-hidden="true" />
                    <span>Hasta ~250 personas</span>
                  </div>
                </div>

                <h3 className="mt-5 font-headline text-2xl font-black sm:text-3xl">
                  Salón Principal
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  Ideal para bodas, fiestas de 15 años y eventos empresariales que requieren pista de baile central, livings y banquete servido.
                </p>

                <div className="mt-6 space-y-3 border-t border-zinc-200 pt-6 text-sm text-zinc-700">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span><strong>Capacidad informada:</strong> Hasta 250 invitados según armado de mesas y pista.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span><strong>Instalaciones:</strong> Climatización central frío/calor, pista de luces, recepción integrada y acceso a cocina.</span>
                  </div>
                  <div className="flex items-start gap-3 text-zinc-500">
                    <Layers className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
                    <span><strong>Por confirmar:</strong> Disposición particular de estaciones (360, fotocabina, barra) según lista de asistentes.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-200">
                <a
                  href={buildWaUrl('Hola AK Producciones. Me interesa consultar por el Salón Principal de Club Uruguay para mi fiesta.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleWhatsAppClick('espacios', 'consultar_salon_principal', 'principal')}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 font-bold text-white transition hover:bg-zinc-800"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  Consultar por Salón Principal
                </a>
              </div>
            </div>

            {/* Espacio 2: Espacio Íntimo */}
            <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-zinc-50 p-7 shadow-sm transition hover:border-zinc-300 hover:shadow-md sm:p-9">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-zinc-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-zinc-800">
                    Formato contenido
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                    <Users className="h-4 w-4 text-red-600" aria-hidden="true" />
                    <span>Hasta ~50 personas</span>
                  </div>
                </div>

                <h3 className="mt-5 font-headline text-2xl font-black sm:text-3xl">
                  Espacio Íntimo
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  Pensado para cumpleaños, aniversarios, cenas de trabajo o reuniones sociales que buscan un clima cálido y reservado.
                </p>

                <div className="mt-6 space-y-3 border-t border-zinc-200 pt-6 text-sm text-zinc-700">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span><strong>Capacidad informada:</strong> Hasta 50 invitados según formato cóctel o mesas reducidas.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span><strong>Instalaciones:</strong> Ambiente contenido, climatizado, con privacidad y acceso cómodo.</span>
                  </div>
                  <div className="flex items-start gap-3 text-zinc-500">
                    <Layers className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
                    <span><strong>Por confirmar:</strong> Montaje de sonido según estilo de reunión y confirmación de fecha.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-200">
                <a
                  href={buildWaUrl('Hola AK Producciones. Me interesa consultar por el Espacio Íntimo de Club Uruguay para mi celebración.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleWhatsAppClick('espacios', 'consultar_espacio_intimo', 'intimo')}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 font-bold text-zinc-900 transition hover:bg-zinc-100"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Consultar por Espacio Íntimo
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 text-xs leading-relaxed text-amber-900">
            <p>
              <strong>Aclaración sobre aforos y fotografías:</strong> Los valores de 50 y 250 personas corresponden a capacidades informadas según montajes habituales y no constituyen una habilitación legal certificada ni se suman como aforo simultáneo de 300 invitados. Las fotografías exhibidas a continuación reflejan vistas generales y montajes reales en Club Uruguay coordinados por AK Producciones.
            </p>
          </div>
        </div>
      </section>

      {/* ── BANDA 3: Galería real con captions fuera de la foto + Lightbox ── */}
      <section id="galeria" className="border-b border-zinc-800 bg-zinc-950 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-widest text-red-400">
              Fotografías verificadas
            </p>
            <h2 className="mt-3 font-headline text-3xl font-black sm:text-5xl">
              Galería real de montajes en Club Uruguay
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
              Inspeccioná fotos reales de ambientaciones, pista y salones. Hacé clic en cualquier imagen para abrir el visor ampliado con zoom accesible.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <figure
                key={photo.src}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-md transition hover:border-zinc-700"
              >
                <div
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver foto ampliada: ${photo.title}`}
                  onClick={() => setLightboxIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxIndex(index);
                    }
                  }}
                  className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <SalonMedia
                    src={photo.src}
                    alt={photo.alt}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
                  <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                    <Maximize2 className="h-3 w-3" aria-hidden="true" /> Ampliar
                  </span>
                </div>

                {/* Caption descriptivo FUERA de la foto */}
                <figcaption className="flex flex-1 flex-col justify-between p-5 text-left">
                  <div>
                    <h3 className="font-headline text-lg font-black text-white">{photo.title}</h3>
                    {photo.description && (
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{photo.description}</p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-500">
                    <span>Registro real AK</span>
                    <span className="text-red-400">Club Uruguay</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal con accesibilidad (Escape, focus, flechas, reduced-motion) */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Visor de foto: ${photos[lightboxIndex].title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={closeLightbox}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior con botón de salida claro */}
            <div className="flex w-full items-center justify-between border-b border-zinc-800 px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Foto {lightboxIndex + 1} de {photos.length}
              </span>
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Cerrar visor de foto"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <X className="h-4 w-4" aria-hidden="true" /> Cerrar (Esc)
              </button>
            </div>

            {/* Imagen principal */}
            <div className="relative aspect-[16/10] w-full max-h-[64vh] bg-black">
              <SalonMedia
                src={photos[lightboxIndex].src}
                alt={photos[lightboxIndex].alt}
                sizes="100vw"
                priority
                className="object-contain"
              />

              {/* Controles de navegación */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    aria-label="Foto siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <ChevronRight className="h-6 w-6" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {/* Caption descriptivo fuera/debajo de la foto en el lightbox */}
            <div className="w-full border-t border-zinc-800 bg-zinc-900 p-5 text-left">
              <h4 className="font-headline text-lg font-black text-white">
                {photos[lightboxIndex].title}
              </h4>
              {photos[lightboxIndex].description && (
                <p className="mt-1 text-sm text-zinc-300">
                  {photos[lightboxIndex].description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
