'use client';

import Image, { type ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2, CalendarDays, MapPin, Users } from 'lucide-react';
import type { SalonPhoto } from '@/lib/salon-helper';
import { canUseNextImage } from '@/lib/next-image-url';

const passthroughImageLoader = ({ src }: ImageLoaderProps) => src;

function SalonMedia({ src, alt, sizes, className }: { src: string; alt: string; sizes: string; className: string }) {
  if (canUseNextImage(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} />;
  }

  return (
    <Image
      loader={passthroughImageLoader}
      unoptimized
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
    />
  );
}

interface SalonDestacadoSectionProps {
  photos: SalonPhoto[];
  capacity?: number;
}

export function getVisibleSalonPhotos(photos: SalonPhoto[]) {
  return photos.slice(0, 3);
}

export function SalonDestacadoSection({ photos, capacity }: SalonDestacadoSectionProps) {
  const reduceMotion = useReducedMotion();
  const visiblePhotos = getVisibleSalonPhotos(photos);
  if (visiblePhotos.length === 0) return null;

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.55, ease: 'easeOut' as const },
      };

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-20 text-slate-950 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
        <motion.div {...reveal} className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-700">
            <Building2 className="h-4 w-4" aria-hidden="true" /> Salón destacado
          </p>
          <h2 className="mt-4 font-headline text-4xl font-black leading-tight sm:text-5xl lg:text-6xl tracking-tight text-slate-950">
            Club Uruguay
          </h2>
          <p className="mt-5 text-base sm:text-lg font-medium leading-relaxed text-slate-600">
            Un espacio emblemático en el centro de Salto, preparado por AK Producciones con catering, música, ambientación, personal y tecnología coordinados en una sola propuesta.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <MapPin className="h-5 w-5 text-red-700" aria-hidden="true" />
              <p className="mt-3 font-black text-slate-950">Centro de Salto</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">Club Uruguay, un salón conocido para celebrar.</p>
            </div>
            {capacity !== undefined && capacity > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <Users className="h-5 w-5 text-red-700" aria-hidden="true" />
                <p className="mt-3 font-black text-slate-950">Hasta {capacity} invitados</p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">Capacidad informada para este salón.</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
            <motion.div whileHover={reduceMotion ? undefined : { scale: 1.025, y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
              <Link
                href="/club-uruguay"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-6 py-3 font-black text-white shadow-md shadow-red-950/20 transition-colors hover:bg-red-800"
              >
                Conocer el salón <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>
            <motion.div whileHover={reduceMotion ? undefined : { scale: 1.025, y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
              <Link
                href="/simulador-de-presupuesto?salon=club"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-100"
              >
                <CalendarDays className="h-4 w-4 text-red-700" aria-hidden="true" /> Cotizar una fiesta
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div {...reveal} className="grid gap-3.5 sm:grid-cols-12">
          <figure className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-zinc-900 shadow-xl sm:col-span-8 sm:row-span-2 sm:aspect-auto sm:min-h-[500px]">
            <SalonMedia
              src={visiblePhotos[0].src}
              alt={visiblePhotos[0].alt}
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="font-black text-lg">{visiblePhotos[0].title}</p>
            </figcaption>
          </figure>

          <div className="grid gap-3.5 sm:col-span-4 sm:grid-rows-2">
            {visiblePhotos.slice(1).map((photo) => (
              <figure key={photo.src} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-900 shadow-md sm:aspect-auto">
                <SalonMedia
                  src={photo.src}
                  alt={photo.alt}
                  sizes="(max-width: 640px) 100vw, 22vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-xs font-bold text-white">
                  {photo.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
