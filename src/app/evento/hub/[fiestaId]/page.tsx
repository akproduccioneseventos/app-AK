'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Camera,
  Gamepad2,
  GalleryHorizontal,
  Loader2,
  Martini,
  MessageCircle,
  Mic2,
  Music2,
  Orbit,
  ScanFace,
  Sparkles,
} from 'lucide-react';
import {
  getPublicGuestEntertainmentLinks,
  getPublicGuestPortalData,
  type PublicGuestEntertainmentLink,
} from '@/app/actions/public-guest-portal';
import { getPublicSocialPosts } from '@/app/actions/social-gallery';
import type { PublicGuestPortalData } from '@/lib/guest-portal-public-data';
import type { EntertainmentModuleId } from '@/lib/entertainment/station-config';
import { canUseNextImage } from '@/lib/next-image-url';

const STATION_ICONS: Record<EntertainmentModuleId, typeof Camera> = {
  fotocabina: Camera,
  plataforma360: Orbit,
  bogue: Sparkles,
  espejoMagicoFoto: ScanFace,
  espejoMagicoFirma: ScanFace,
  espejoMagicoIA: Sparkles,
  totems: GalleryHorizontal,
  capsulaTiempo: Mic2,
};

export default function EventoHubPage() {
  const params = useParams<{ fiestaId: string }>();
  const searchParams = useSearchParams();
  const fiestaId = decodeURIComponent(params.fiestaId);
  const guestId = searchParams.get('guestId') || '';
  const guestAccessToken = searchParams.get('token') || '';

  const [portal, setPortal] = useState<PublicGuestPortalData | null>(null);
  const [stations, setStations] = useState<PublicGuestEntertainmentLink[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      const [portalData, entertainmentLinks, posts] = await Promise.all([
        getPublicGuestPortalData(fiestaId, guestId, guestAccessToken),
        getPublicGuestEntertainmentLinks(fiestaId, guestId, guestAccessToken),
        getPublicSocialPosts(fiestaId).catch(() => []),
      ]);
      if (!active) return;
      setPortal(portalData);
      setStations(entertainmentLinks);
      setPhotoCount(posts.length);
      setIsLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [fiestaId, guestAccessToken, guestId]);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </main>
    );
  }

  if (!portal) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-center text-white">
        <div className="max-w-md">
          <h1 className="text-3xl font-black">Este acceso no es válido</h1>
          <p className="mt-3 text-zinc-400">Abrí la zona digital desde tu invitación personal para entrar con seguridad.</p>
        </div>
      </main>
    );
  }

  const { fiesta, guest } = portal;
  const accessQuery = `guestId=${encodeURIComponent(guest.id)}&token=${encodeURIComponent(guestAccessToken)}`;
  const eventName = fiesta.configuracion.nombreEvento || 'Tu evento';
  const coverImage = fiesta.invitacionConfig?.fotoPortada;

  const sharedTools = [
    {
      label: 'Red social',
      description: 'Publicá fotos, reaccioná y compartí el evento.',
      href: `/evento/social/${fiestaId}`,
      icon: MessageCircle,
    },
    {
      label: 'Galería',
      description: `${photoCount} recuerdos aprobados de la fiesta.`,
      href: `/evento/galeria/${fiestaId}`,
      icon: GalleryHorizontal,
    },
    {
      label: 'Pedir canción',
      description: 'Enviá tu sugerencia al DJ.',
      href: `/evento/social/${fiestaId}?section=songs`,
      icon: Music2,
    },
    {
      label: 'Carta de tragos',
      description: 'Elegí un trago y envialo a la barra.',
      href: `/evento/barra/${fiestaId}`,
      icon: Martini,
    },
    {
      label: 'Juegos y retos',
      description: 'Participá con tu nombre y sumá puntos durante la fiesta.',
      href: `/evento/zona-digital/${fiestaId}?${accessQuery}`,
      icon: Gamepad2,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white selection:bg-red-700">
      <section className="relative flex min-h-[54vh] items-end overflow-hidden border-b border-white/10">
        {coverImage ? (
          canUseNextImage(coverImage) ? (
            <Image src={coverImage} alt={eventName} fill priority sizes="100vw" className="object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- Event media may use an external host.
            <img src={coverImage} alt={eventName} className="absolute inset-0 h-full w-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/10" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
          <p className="text-sm font-black uppercase text-red-400">Zona digital de la fiesta</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{eventName}</h1>
          <p className="mt-4 text-lg text-zinc-200">Hola {guest.nombre}. Elegí qué querés hacer.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {stations.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-red-400">Estaciones de la fiesta</p>
                <h2 className="mt-2 text-3xl font-black">Creá tu recuerdo</h2>
              </div>
              <span className="text-sm text-zinc-500">{stations.length} disponibles</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((station) => {
                const Icon = STATION_ICONS[station.id];
                return (
                  <Link
                    key={station.id}
                    href={station.href}
                    className="group flex min-h-32 items-center gap-5 rounded-lg border border-white/10 bg-white/[0.04] p-5 transition hover:border-red-500/60 hover:bg-white/[0.07]"
                  >
                    <span className="grid h-14 w-14 flex-none place-items-center rounded-lg bg-red-600 text-white">
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-black">{station.label}</span>
                      <span className="mt-1 block text-sm text-zinc-400">Abrir experiencia</span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-zinc-600 transition group-hover:translate-x-1 group-hover:text-red-400" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className={stations.length > 0 ? 'mt-14 border-t border-white/10 pt-12' : ''}>
          <p className="text-sm font-bold uppercase text-zinc-500">Durante la fiesta</p>
          <h2 className="mt-2 text-3xl font-black">Participá en vivo</h2>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {sharedTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.label} href={tool.href} className="group flex items-center gap-4 py-5">
                  <Icon className="h-6 w-6 flex-none text-red-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-black">{tool.label}</span>
                    <span className="mt-1 block text-sm text-zinc-400">{tool.description}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white" />
                </Link>
              );
            })}
          </div>
        </section>

        <Link
          href={`/invitacion/${fiestaId}/invitado/${guest.id}?token=${encodeURIComponent(guestAccessToken)}`}
          className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
        >
          Volver a mi invitación <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
