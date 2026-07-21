'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Gamepad2,
  GalleryHorizontal,
  Home,
  Loader2,
  MapPin,
  Martini,
  MessageCircle,
  Mic2,
  Music2,
  Orbit,
  ScanFace,
  Sparkles,
  TicketCheck,
} from 'lucide-react';
import {
  getPublicGuestEntertainmentLinks,
  getPublicGuestPortalData,
  type PublicGuestEntertainmentLink,
} from '@/app/actions/public-guest-portal';
import { getPublicSocialPosts } from '@/app/actions/social-gallery';
import { CompanyLogo } from '@/components/company-logo';
import type { PublicGuestPortalData } from '@/lib/guest-portal-public-data';
import {
  buildPublicEventTools,
  normalizePublicEventAccent,
  type PublicEventToolId,
} from '@/lib/guest-portal/public-event-navigation';
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

const TOOL_ICONS: Record<PublicEventToolId, typeof Camera> = {
  social: MessageCircle,
  gallery: GalleryHorizontal,
  songs: Music2,
  bar: Martini,
  games: Gamepad2,
};

function formatEventDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

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
    return () => {
      active = false;
    };
  }, [fiestaId, guestAccessToken, guestId]);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-red-500" />
          <p className="mt-4 text-sm font-semibold text-slate-300">Preparando tu experiencia</p>
        </div>
      </main>
    );
  }

  if (!portal) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-white">
        <div className="max-w-md">
          <TicketCheck className="mx-auto h-10 w-10 text-red-400" />
          <h1 className="mt-5 text-3xl font-black">Este acceso no es válido</h1>
          <p className="mt-3 leading-relaxed text-slate-300">
            Abrí la zona digital desde tu invitación personal para entrar con seguridad.
          </p>
        </div>
      </main>
    );
  }

  const { fiesta, guest } = portal;
  const eventName = fiesta.configuracion.nombreEvento || 'Tu evento';
  const coverImage = fiesta.invitacionConfig?.fotoPortada
    || fiesta.guestPortalSettings?.coverImageUrl
    || '/media/catalogo-servicios/familia_feliz_evento.png';
  const accentColor = normalizePublicEventAccent(
    fiesta.guestPortalSettings?.customAccentColor
      || fiesta.invitacionConfig?.colorPrincipal
      || fiesta.configuracion.primaryColor,
  );
  const pageStyle = {
    '--event-accent': accentColor,
    '--event-accent-soft': `${accentColor}18`,
  } as CSSProperties;
  const eventDate = formatEventDate(fiesta.configuracion.fechaEvento);
  const invitationHref = `/invitacion/${encodeURIComponent(fiestaId)}/invitado/${encodeURIComponent(guest.id)}?token=${encodeURIComponent(guestAccessToken)}`;
  const tools = buildPublicEventTools({
    fiestaId,
    guestId: guest.id,
    guestAccessToken,
    event: fiesta,
    photoCount,
  });
  const welcomeMessage = fiesta.guestPortalSettings?.welcomeMessage
    || `Hola ${guest.nombre}. Elegí qué querés hacer durante la fiesta.`;

  return (
    <main className="ak-public-page min-h-screen bg-slate-50 pb-24 text-slate-950 sm:pb-0" style={pageStyle}>
      <section className="ak-public-hero relative flex min-h-[58svh] items-end overflow-hidden bg-slate-950 text-white">
        {canUseNextImage(coverImage) ? (
          <Image src={coverImage} alt={eventName} fill priority sizes="100vw" className="object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Event media may use an external host.
          <img src={coverImage} alt={eventName} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/65" />
        <div className="ak-public-shell relative z-10 flex min-h-[58svh] flex-col justify-between py-6 sm:py-8">
          <div className="flex items-center justify-between gap-4">
            <Link href={invitationHref} className="inline-flex items-center gap-3 text-sm font-bold text-white">
              <CompanyLogo size="sm" />
              <span className="hidden sm:inline">AK Producciones</span>
            </Link>
            <Link
              href={invitationHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/25 bg-black/20 px-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-black/40"
            >
              <TicketCheck className="h-4 w-4" />
              Mi invitación
            </Link>
          </div>

          <div className="max-w-4xl pb-2">
            <p className="text-sm font-black uppercase text-white/75">Zona digital de la fiesta</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{eventName}</h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/85 sm:text-lg">
              {welcomeMessage}
            </p>
            {(eventDate || fiesta.configuracion.nombreLugar) && (
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/80">
                {eventDate && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {eventDate}
                  </span>
                )}
                {fiesta.configuracion.nombreLugar && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {fiesta.configuracion.nombreLugar}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="ak-public-shell py-10 sm:py-14">
        {stations.length > 0 && (
          <section aria-labelledby="event-stations-title">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-black uppercase text-[var(--event-accent)]">Estaciones disponibles</p>
                <h2 id="event-stations-title" className="mt-2 text-3xl font-black text-slate-950">Creá un recuerdo</h2>
              </div>
              <span className="text-sm font-semibold text-slate-500">{stations.length} experiencias activas</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((station) => {
                const Icon = STATION_ICONS[station.id];
                return (
                  <Link
                    key={station.id}
                    href={station.href}
                    className="ak-public-action group flex min-h-32 items-center gap-4 p-5 focus-visible:ring-2 focus-visible:ring-[var(--event-accent)]"
                  >
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-lg bg-[var(--event-accent)] text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-black text-slate-950">{station.label}</span>
                      <span className="mt-1 block text-sm text-slate-500">Abrir experiencia</span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[var(--event-accent)]" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className={stations.length > 0 ? 'mt-14 border-t border-slate-200 pt-12' : ''} aria-labelledby="event-tools-title">
          <p className="text-xs font-black uppercase text-slate-500">Todo en un solo lugar</p>
          <h2 id="event-tools-title" className="mt-2 text-3xl font-black text-slate-950">Participá en vivo</h2>
          {tools.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {tools.map((tool) => {
                const Icon = TOOL_ICONS[tool.id];
                return (
                  <Link key={tool.id} href={tool.href} className="ak-public-card group flex min-h-28 items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-[var(--event-accent)]">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-[var(--event-accent-soft)] text-[var(--event-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-black text-slate-950">{tool.label}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-500">{tool.description}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 flex-none text-slate-400 transition group-hover:translate-x-1 group-hover:text-[var(--event-accent)]" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
              El organizador todavía no habilitó actividades públicas para esta fiesta.
            </p>
          )}
        </section>

        <div className="mt-10 border-t border-slate-200 pt-7">
          <Link href={invitationHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-slate-600 transition hover:text-slate-950">
            <TicketCheck className="h-4 w-4" />
            Volver a mi invitación
          </Link>
        </div>
      </div>

      <nav aria-label="Navegación rápida del evento" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          <Link href="#event-tools-title" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-black text-[var(--event-accent)]">
            <Home className="h-5 w-5" />
            Inicio
          </Link>
          {tools.slice(0, 4).map((tool) => {
            const Icon = TOOL_ICONS[tool.id];
            return (
              <Link key={tool.id} href={tool.href} className="flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold text-slate-600">
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{tool.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
