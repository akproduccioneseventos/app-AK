import type { Metadata } from 'next';
import Image, { type ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import { Building2, CalendarDays, Check, MapPin, MessageCircle, Users } from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { PublicFooter } from '@/components/public-footer';
import { getSalonesPublicos } from '@/app/actions/salones';
import { isClubUruguay } from '@/lib/club-uruguay';
import { canUseNextImage } from '@/lib/next-image-url';
import { getDynamicSalonPhotos, type SalonPhoto } from '@/lib/salon-helper';

import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';

export const metadata: Metadata = {
  title: 'Fiestas en Club Uruguay | AK Producciones Eventos',
  description:
    'Conocé el salón Club Uruguay en Uruguay 754, Salto. Mirá montajes reales y cotizá una producción integral de AK Producciones.',
  alternates: {
    canonical: 'https://akproducciones.uy/club-uruguay',
  },
};

const WHATSAPP = AK_WHATSAPP_NUMBER;
const passthroughImageLoader = ({ src }: ImageLoaderProps) => src;

function SalonMedia({ src, alt, sizes, priority, className }: { src: string; alt: string; sizes: string; priority?: boolean; className: string }) {
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

function uniquePhotos(photos: SalonPhoto[]) {
  const seen = new Set<string>();
  return photos.filter((photo) => {
    if (!photo.src || seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
}

async function getSalonesWithoutBlockingSale() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getSalonesPublicos(),
      new Promise<Awaited<ReturnType<typeof getSalonesPublicos>>>((resolve) => {
        timeout = setTimeout(() => resolve([]), 2_500);
      }),
    ]);
  } catch {
    return [];
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export default async function ClubUruguayPage() {
  const salones = await getSalonesWithoutBlockingSale();
  const salon = salones.find((item) => item.esClubUruguay || isClubUruguay(item.nombre));
  const masterPhotos: SalonPhoto[] = (salon?.fotos || []).map((src, index) => ({
    src,
    alt: `Club Uruguay, vista ${index + 1}`,
    title: index === 0 ? 'El salon' : `Vista del salon ${index + 1}`,
    description: 'Foto cargada desde el modulo maestro de salones.',
  }));
  const photos = uniquePhotos([...masterPhotos, ...getDynamicSalonPhotos()]);
  const heroPhoto = photos[0]?.src || '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg';
  const salonAddress = salon?.direccion?.trim();
  const salonDescription = salon?.descripcion?.trim();
  const salonCapacity = salon?.capacidad && salon.capacidad > 0 ? salon.capacidad : undefined;
  const whatsappHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    'Hola AK Producciones. Quiero conocer y cotizar una fiesta en Club Uruguay.',
  )}`;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white selection:bg-red-700">
      <LocalBusinessJsonLd isClubUruguay={true} url="https://akproducciones.uy/club-uruguay" />
      <LandingNav />

      <main>
        <section className="relative flex min-h-[78vh] items-end overflow-hidden border-b border-white/10 pt-24">
          <SalonMedia
            src={heroPhoto}
            alt="Salon de Club Uruguay preparado por AK Producciones"
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-red-300">
                <Building2 className="h-4 w-4" /> Club Uruguay, Salto
              </p>
              <h1 className="font-headline text-5xl font-black leading-[1.02] sm:text-7xl">
                Tu fiesta en Club Uruguay
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-200 sm:text-xl">
                Conoce el espacio en montajes reales y arma una propuesta para tu celebración.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/simulador-de-presupuesto?salon=club"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-red-600 px-6 py-3 font-black text-white transition-colors hover:bg-red-500"
                >
                  <CalendarDays className="h-5 w-5" /> Cotizar mi fiesta
                </Link>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-emerald-400 px-6 py-3 font-black text-zinc-950 transition-colors hover:bg-emerald-300"
                >
                  <MessageCircle className="h-5 w-5" /> Coordinar una visita
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-white text-zinc-950">
          <div className="mx-auto grid max-w-7xl gap-px bg-zinc-200 sm:grid-cols-3">
            <div className="bg-white px-6 py-7">
              <Building2 className="mb-3 h-6 w-6 text-red-600" />
              <h2 className="font-headline text-xl font-black">Club Uruguay</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">El salón que estás buscando para tu evento en Salto.</p>
            </div>
            <div className="bg-white px-6 py-7">
              <MapPin className="mb-3 h-6 w-6 text-red-600" />
              <h2 className="font-headline text-xl font-black">Ubicación</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{salonAddress || 'Salto, Uruguay'}</p>
            </div>
            {salonCapacity !== undefined ? (
              <div className="bg-white px-6 py-7">
                <Users className="mb-3 h-6 w-6 text-red-600" />
                <h2 className="font-headline text-xl font-black">Capacidad informada</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{salonCapacity} invitados</p>
              </div>
            ) : (
              <div className="bg-white px-6 py-7">
                <Check className="mb-3 h-6 w-6 text-red-600" />
                <h2 className="font-headline text-xl font-black">Información clara</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">Consultá una propuesta acorde a tu celebración.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-red-400">Recorrido visual</p>
              <h2 className="mt-3 font-headline text-4xl font-black sm:text-5xl">Mira el salon en uso</h2>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
              Mirá el salón y algunos montajes reales para imaginar la disposición de tu evento.
            </p>
          </div>

          {salonDescription && (
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-300">{salonDescription}</p>
          )}

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <figure
                key={photo.src}
                className={`group relative overflow-hidden rounded-md bg-zinc-900 ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <div className={index === 0 ? 'aspect-[16/10] md:h-full' : 'aspect-[4/3]'}>
                  <SalonMedia
                    src={photo.src}
                    alt={photo.alt}
                    sizes={index === 0 ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
                    className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-headline text-lg font-black">{photo.title}</h3>
                  {photo.description && <p className="mt-1 text-sm text-zinc-300">{photo.description}</p>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-zinc-900">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase text-red-400">Propuesta a medida</p>
              <h2 className="mt-3 font-headline text-3xl font-black sm:text-5xl">Calcula una fiesta completa, sin precios viejos</h2>
              <p className="mt-4 max-w-2xl text-zinc-400">Usá el simulador para ordenar una propuesta con el catálogo vigente o escribinos para coordinar la conversación.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/simulador-de-presupuesto?salon=club"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-black text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                <CalendarDays className="h-5 w-5" /> Abrir simulador
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-3 font-black text-white transition-colors hover:bg-white/10"
              >
                <MessageCircle className="h-5 w-5" /> Escribir por WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter variant="dark" />
    </div>
  );
}
