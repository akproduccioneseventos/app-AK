import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, CalendarDays, Check, MapPin, MessageCircle, Users } from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { PublicFooter } from '@/components/public-footer';
import { getSalones } from '@/app/actions/salones';
import { isClubUruguay } from '@/lib/club-uruguay';
import { getDynamicSalonPhotos, type SalonPhoto } from '@/lib/salon-helper';

export const metadata: Metadata = {
  title: 'Fiestas en Club Uruguay | AK Producciones',
  description:
    'Conoce el salon, mira montajes reales y cotiza una produccion integral de AK Producciones en Club Uruguay, Salto.',
};

const WHATSAPP = '59898355530';

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
      getSalones(),
      new Promise<Awaited<ReturnType<typeof getSalones>>>((resolve) => {
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
  const whatsappHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    'Hola AK Producciones. Quiero conocer y cotizar una fiesta en Club Uruguay.',
  )}`;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white selection:bg-red-700">
      <LandingNav whatsappNumber={WHATSAPP} />

      <main>
        <section className="relative flex min-h-[78vh] items-end overflow-hidden border-b border-white/10 pt-24">
          <Image
            src={heroPhoto}
            alt="Salon de Club Uruguay preparado por AK Producciones"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,9,0.18)_0%,rgba(8,8,9,0.56)_54%,rgba(8,8,9,0.96)_100%)]" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-red-300">
                <Building2 className="h-4 w-4" /> Club Uruguay, Salto
              </p>
              <h1 className="font-headline text-5xl font-black leading-[1.02] sm:text-7xl">
                Tu fiesta en Club Uruguay
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-200 sm:text-xl">
                Conoce el espacio en montajes reales y cotiza salon, catering, discoteca, decoracion y coordinacion en una sola propuesta.
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
              <Users className="mb-3 h-6 w-6 text-red-600" />
              <h2 className="font-headline text-xl font-black">Dos espacios</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">Opciones para encuentros intimos y celebraciones de mayor capacidad.</p>
            </div>
            <div className="bg-white px-6 py-7">
              <MapPin className="mb-3 h-6 w-6 text-red-600" />
              <h2 className="font-headline text-xl font-black">En el centro de Salto</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">Una ubicacion reconocible y practica para invitados y proveedores.</p>
            </div>
            <div className="bg-white px-6 py-7">
              <Check className="mb-3 h-6 w-6 text-red-600" />
              <h2 className="font-headline text-xl font-black">Produccion integral</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">Un equipo coordina comida, ambientacion, musica, personal y tecnologia.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-red-400">Recorrido visual</p>
              <h2 className="mt-3 font-headline text-4xl font-black sm:text-5xl">Mira el salon en uso</h2>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
              Las fotos cargadas en el módulo maestro aparecen primero. Cuando todavía no hay suficientes, completamos el recorrido con montajes de referencia seleccionados por AK Producciones.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <figure
                key={photo.src}
                className={`group relative overflow-hidden rounded-md bg-zinc-900 ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <div className={index === 0 ? 'aspect-[16/10] md:h-full' : 'aspect-[4/3]'}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes={index === 0 ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
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
              <p className="mt-4 max-w-2xl text-zinc-400">El simulador usa el catalogo vigente y separa salon, invitados, menu y servicios para que puedas comparar una propuesta real.</p>
            </div>
            <Link
              href="/simulador-de-presupuesto?salon=club"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-black text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Abrir simulador
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter variant="dark" />
    </div>
  );
}
