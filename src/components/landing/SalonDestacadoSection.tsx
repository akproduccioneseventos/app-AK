import Image, { type ImageLoaderProps } from 'next/image';
import Link from 'next/link';
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
  const visiblePhotos = getVisibleSalonPhotos(photos);
  if (visiblePhotos.length === 0) return null;

  return (
    <section className="border-y border-zinc-200 bg-white py-20 text-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm font-black uppercase text-red-700">
            <Building2 className="h-4 w-4" /> Salón destacado
          </p>
          <h2 className="mt-4 font-headline text-4xl font-black leading-tight sm:text-6xl">
            Club Uruguay
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-zinc-600">
            Un espacio emblemático en el centro de Salto, preparado por AK Producciones con catering, música, ambientación, personal y tecnología coordinados en una sola propuesta.
          </p>

          <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2">
            <div className="bg-white p-5">
              <MapPin className="h-5 w-5 text-red-700" />
              <p className="mt-3 font-black">Centro de Salto</p>
              <p className="mt-1 text-sm text-zinc-600">Club Uruguay, un salón conocido para celebrar.</p>
            </div>
            {capacity !== undefined && capacity > 0 && (
              <div className="bg-white p-5">
                <Users className="h-5 w-5 text-red-700" />
                <p className="mt-3 font-black">Hasta {capacity} invitados</p>
                <p className="mt-1 text-sm text-zinc-600">Capacidad informada para este salón.</p>
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/club-uruguay"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-zinc-950 px-6 py-3 font-black text-white transition-colors hover:bg-zinc-800"
            >
              Conocer el salón <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/simulador-de-presupuesto?salon=club"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-6 py-3 font-black text-zinc-950 transition-colors hover:border-red-700 hover:text-red-700"
            >
              <CalendarDays className="h-4 w-4" /> Cotizar una fiesta
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-12">
          <figure className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 sm:col-span-8 sm:row-span-2 sm:aspect-auto sm:min-h-[520px]">
            <SalonMedia
              src={visiblePhotos[0].src}
              alt={visiblePhotos[0].alt}
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-black/70 p-4 text-white">
              <p className="font-black">{visiblePhotos[0].title}</p>
            </figcaption>
          </figure>

          <div className="grid gap-3 sm:col-span-4 sm:grid-rows-2">
            {visiblePhotos.slice(1).map((photo) => (
              <figure key={photo.src} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 sm:aspect-auto">
                <SalonMedia
                  src={photo.src}
                  alt={photo.alt}
                  sizes="(max-width: 640px) 100vw, 22vw"
                  className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/70 p-3 text-sm font-bold text-white">
                  {photo.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
