/* eslint-disable @next/next/no-img-element */
'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Accessibility,
  AlertTriangle,
  Armchair,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Facebook,
  Gamepad2,
  Gift,
  Globe,
  Heart,
  Home,
  Images,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  Music,
  Navigation,
  Shirt,
  Sparkles,
  TicketCheck,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import QRCodeStylized from 'qrcode.react';
import {
  getPublicGuestPortalData,
  type PublicGuestEntertainmentLink,
} from '@/app/actions/public-guest-portal';
import { getSocialConnections } from '@/app/actions/social-connections';
import { trackGuestCtaClick } from '@/app/actions/fiesta/invitados.actions';
import { Button } from '@/components/ui/button';
import { appendCommercialAttribution } from '@/lib/commercial/acquisition';
import {
  buildPublicEventTools,
  normalizePublicEventAccent,
  withGuestAccess,
  type PublicEventTool,
} from '@/lib/guest-portal/public-event-navigation';
import { getPublicGuestMenuSections } from '@/lib/guest-portal/public-menu';
import type { PublicGuest, PublicGuestEvent } from '@/lib/guest-portal-public-data';
import {
  formatEventDate,
  getDaysUntilEvent,
  parseEventDate,
} from '@/lib/public-experience/event-date';
import type { SocialConnection } from '@/types/settings';
import type { GuestPortalSettings } from '@/types/fiesta';
import { MiniQuiosco } from './MiniQuiosco';

const DIETARY_LABELS: Record<string, string> = {
  Ninguna: '',
  Celiaco: 'Menú sin gluten',
  Vegetariano: 'Menú vegetariano',
  Vegano: 'Menú vegano',
  Otro: 'Menú especial',
};

const DEFAULT_GPS: GuestPortalSettings = {
  showMural: true,
  showFotos: true,
  showInvitacionWeb: true,
  showMesaAsignada: true,
  showItinerario: true,
  showMusica: true,
  showRegalos: false,
  showCheckin: true,
};

function getSocialUrl(connections: SocialConnection[], platform: string): string | undefined {
  return connections.find((connection) => connection.platform === platform && connection.isConnected)?.profileUrl;
}

const PUBLIC_TOOL_ICONS: Record<PublicEventTool['id'], LucideIcon> = {
  social: Camera,
  gallery: Images,
  songs: Music,
  bar: Wine,
  games: Gamepad2,
};

type PortalAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  external?: boolean;
};

function PortalActionButton({ action }: { action: PortalAction }) {
  const Icon = action.icon;
  const className = 'group flex min-h-24 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 motion-reduce:transform-none';
  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white transition-colors group-hover:bg-red-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="mt-3 text-sm font-extrabold text-slate-950">{action.label}</span>
    </>
  );

  if (action.onClick) {
    return <button type="button" onClick={action.onClick} className={className}>{content}</button>;
  }

  return (
    <a
      href={action.href}
      target={action.external ? '_blank' : undefined}
      rel={action.external ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {content}
    </a>
  );
}

function getAccentForeground(hexColor: string): '#0f172a' | '#ffffff' {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);
  const perceivedBrightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return perceivedBrightness > 165 ? '#0f172a' : '#ffffff';
}

function SocialPhotosPreview({ fiestaId }: { fiestaId: string }) {
  const [photos, setPhotos] = useState<{ id: string; imageUrl: string; authorName: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    import('@/app/actions/social-gallery')
      .then(({ getPublicSocialPosts }) => getPublicSocialPosts(fiestaId))
      .then((posts) => {
        if (!active) return;
        setPhotos(posts.slice(0, 6).map((post) => ({
          id: post.id,
          imageUrl: post.imageUrl,
          authorName: post.authorName ?? '',
        })));
      })
      .catch(() => {
        if (active) setPhotos([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [fiestaId]);

  if (!loaded) return null;
  if (photos.length === 0) {
    return <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">Todavía no hay fotos publicadas.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-px border-t border-slate-200 bg-slate-200">
      {photos.map((photo) => (
        <div key={photo.id} className="aspect-square overflow-hidden bg-slate-100">
          <img
            src={photo.imageUrl}
            alt={`Foto compartida por ${photo.authorName}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}

function GuestPortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const guestId = params.guestId as string;
  const guestAccessToken = searchParams.get('token') || '';
  const [fiesta, setFiesta] = useState<PublicGuestEvent | null>(null);
  const [guest, setGuest] = useState<PublicGuest | null>(null);
  const [entertainmentLinks, setEntertainmentLinks] = useState<PublicGuestEntertainmentLink[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showQuiosco, setShowQuiosco] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId || !guestId || !guestAccessToken) {
      setLoadError('Enlace invalido.');
      setIsLoading(false);
      return;
    }
    try {
      const [data, connections] = await Promise.all([
        getPublicGuestPortalData(fiestaId, guestId, guestAccessToken),
        getSocialConnections().catch(() => [] as SocialConnection[]),
      ]);
      if (!data) throw new Error('Evento o invitado no encontrado.');
      setFiesta(data.fiesta);
      setGuest(data.guest);
      setEntertainmentLinks(data.entertainmentLinks);
      setSocialConnections(connections);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar tu información.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, guestAccessToken, guestId]);

  useEffect(() => { loadData(); }, [loadData]);

  const downloadQR = () => {
    const canvas = document.getElementById('qr-guest-portal') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    link.download = `QR-Entrada-${guest?.nombre ?? 'invitado'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>;
  }
  if (loadError || !fiesta || !guest) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-white">
        <div className="max-w-md"><AlertTriangle className="mx-auto h-10 w-10 text-red-400" /><h1 className="mt-5 text-2xl font-black">No pudimos abrir tu invitación</h1><p className="mt-3 text-sm text-slate-300">{loadError || 'Verificá el enlace o contactá al organizador.'}</p></div>
      </main>
    );
  }

  const config = fiesta.configuracion;
  const guestExp = fiesta.guestExperienceSettings;
  const gps: GuestPortalSettings = { ...DEFAULT_GPS, ...(fiesta.guestPortalSettings ?? {}) };
  const modules = fiesta.modulosContratados;
  const socialEnabled = gps.showMural !== false && (!modules || (modules.redSocial ?? modules.muroSocial) !== false);
  const photosEnabled = gps.showFotos !== false && (!modules || modules.fotografia !== false);
  const tableEnabled = gps.showMesaAsignada !== false && (!modules || modules.numerosMesa !== false);
  const checkinEnabled = gps.showCheckin !== false && (!modules || modules.checkin !== false);
  const menuEnabled = guestExp?.showMenu !== false && (!modules || modules.menuMesa !== false);
  const rsvpEnabled = fiesta.invitacionConfig?.rsvpActivo !== false;
  const giftsEnabled = gps.showRegalos === true && (!modules || modules.regalos !== false);
  const programaEnabled = gps.showItinerario !== false && (!modules || modules.itinerario !== false) && fiesta.programa.length > 0;

  if (guestExp?.allowGuestPortal === false) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 p-8 text-center text-white"><div><TicketCheck className="mx-auto h-10 w-10 text-slate-400" /><h1 className="mt-5 text-xl font-black">El portal del invitado todavía no está habilitado.</h1><p className="mt-2 text-sm text-slate-400">Intentá nuevamente más tarde.</p></div></main>;
  }

  const guestPath = (path: string) => withGuestAccess(path, guest.id, guestAccessToken);
  const hubHref = guestPath(`/evento/hub/${fiestaId}`);
  const socialHref = guestPath(`/evento/social/${fiestaId}`);
  const galleryHref = guestPath(`/evento/galeria/${fiestaId}`);
  const rsvpHref = guestPath(`/invitacion/${fiestaId}/rsvp`);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app-ak.vercel.app';
  const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&token=${encodeURIComponent(guestAccessToken)}&guestId=${encodeURIComponent(guest.id)}`;
  const invitacionUrl = fiesta.invitacionSlug ? `/i/${fiesta.invitacionSlug}` : `/invitacion/${fiestaId}`;
  const fecha = formatEventDate(config?.fechaEvento);
  const hora = config?.horaInicio;
  const mapsUrl = config?.googleMapsUrl
    || (config?.direccionLugar ? `https://maps.google.com/?q=${encodeURIComponent(config.direccionLugar)}` : undefined);
  const heroImage = gps.coverImageUrl || fiesta.invitacionConfig?.fotoPortada;
  const accentColor = normalizePublicEventAccent(
    gps.customAccentColor || fiesta.invitacionConfig?.colorPrincipal || config?.primaryColor,
  );
  const accentForeground = getAccentForeground(accentColor);
  const daysUntil = getDaysUntilEvent(config?.fechaEvento);
  const dietLabel = guest.dietaryRestriction && guest.dietaryRestriction !== 'Ninguna' ? (DIETARY_LABELS[guest.dietaryRestriction] || guest.dietaryRestriction) : null;
  const rsvpBadge = guest.rsvp === 'Confirmado'
    ? { label: 'Asistencia confirmada', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' }
    : guest.rsvp === 'Rechazado'
      ? { label: 'Asistencia cancelada', className: 'border-red-200 bg-red-50 text-red-800' }
      : { label: 'Confirmacion pendiente', className: 'border-amber-200 bg-amber-50 text-amber-800' };
  const menuSections = getPublicGuestMenuSections(fiesta);
  const instagramUrl = guestExp?.instagramUrl || getSocialUrl(socialConnections, 'Instagram');
  const facebookUrl = guestExp?.facebookUrl || getSocialUrl(socialConnections, 'Facebook');
  const tiktokUrl = guestExp?.tiktokUrl || getSocialUrl(socialConnections, 'TikTok');
  const whatsappConnection = socialConnections.find((connection) => connection.platform === 'WhatsApp' && connection.isConnected);
  const whatsappUrl = guestExp?.whatsappUrl
    || (guestExp?.whatsappNumber ? `https://wa.me/${guestExp.whatsappNumber.replace(/\D/g, '')}` : undefined)
    || whatsappConnection?.profileUrl
    || (whatsappConnection?.phoneNumber ? `https://wa.me/${whatsappConnection.phoneNumber}` : undefined);
  const attribution = { source: 'guest_portal' as const, campaign: 'guest-experience', refFiestaId: fiestaId, refGuestId: guest.id, entryPath: `/invitacion/${fiestaId}/invitado/${guest.id}` };
  const landingUrl = guestExp?.landingUrl ? appendCommercialAttribution(guestExp.landingUrl, attribution) : undefined;
  const simulatorUrl = guestExp?.simulatorUrl ? appendCommercialAttribution(guestExp.simulatorUrl, attribution) : undefined;
  const showAkCta = guestExp?.enabled !== false && guestExp?.showAkBranding !== false;
  const dressCode = fiesta.invitacionConfig?.dressCode;
  const publicTools = buildPublicEventTools({
    fiestaId,
    guestId: guest.id,
    guestAccessToken,
    event: fiesta,
    photoCount: 0,
  });
  const portalActions: PortalAction[] = [
    ...(rsvpEnabled && guest.rsvp !== 'Confirmado'
      ? [{ id: 'rsvp', label: 'Confirmar asistencia', icon: CheckCircle2, href: rsvpHref }]
      : []),
    ...publicTools.map((tool): PortalAction => ({
      id: tool.id,
      label: tool.label,
      icon: PUBLIC_TOOL_ICONS[tool.id],
      href: tool.id === 'bar' ? undefined : tool.href,
      onClick: tool.id === 'bar' ? () => setShowQuiosco(true) : undefined,
    })),
    ...(giftsEnabled
      ? [{ id: 'gifts', label: 'Regalos', icon: Gift, href: `${invitacionUrl}#regalos`, external: true }]
      : []),
    ...entertainmentLinks.map((link): PortalAction => ({
      id: `entertainment-${link.id}`,
      label: link.label,
      icon: Sparkles,
      href: link.href,
    })),
  ];
  const cancellationDeadline = parseEventDate(config?.fechaEvento);
  cancellationDeadline?.setDate(cancellationDeadline.getDate() - 7);
  const canModifyRsvp = Boolean(
    guest.rsvp === 'Confirmado'
      && cancellationDeadline
      && new Date() < cancellationDeadline,
  );

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 sm:pb-12">
      <section className="relative flex min-h-[56svh] items-end overflow-hidden bg-slate-950 text-white">
        {heroImage && <img src={heroImage} alt={config?.nombreEvento || 'Evento'} className="absolute inset-0 h-full w-full object-cover motion-safe:animate-[guestHero_18s_ease-in-out_infinite_alternate]" decoding="async" />}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 mx-auto flex min-h-[58svh] w-full max-w-4xl flex-col justify-end px-5 py-8 sm:px-8 sm:py-12">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-xs font-black uppercase text-white/80">Portal del invitado</p>
          </div>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">{config?.nombreEvento || 'Tu evento'}</h1>
          <p className="mt-3 text-xl font-medium text-slate-200">Hola, <span className="font-black text-white">{guest.nombre}</span></p>
          {gps.welcomeMessage && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300/90">{gps.welcomeMessage}</p>}
          {(fecha || config?.nombreLugar) && (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-200">
              {fecha && <span className="inline-flex items-center gap-2 capitalize"><CalendarDays className="h-4 w-4 text-rose-400" />{fecha}{hora ? ` - ${hora} hs` : ''}</span>}
              {config?.nombreLugar && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-400" />{config.nombreLugar}</span>}
            </div>
          )}
          {daysUntil !== null && (
            <div className="mt-4 flex w-fit items-center gap-2 rounded-lg border border-white/25 bg-black/25 px-4 py-2.5 text-sm font-black text-white backdrop-blur">
              <Clock className="h-4 w-4 text-amber-300" />
              <span>{daysUntil === 0 ? 'El evento es hoy' : daysUntil > 0 ? `Faltan ${daysUntil} día${daysUntil === 1 ? '' : 's'}` : `El evento fue hace ${Math.abs(daysUntil)} día${Math.abs(daysUntil) === 1 ? '' : 's'}`}</span>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={hubHref} className="inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-black shadow-lg transition-transform active:scale-95 hover:brightness-110" style={{ backgroundColor: accentColor, color: accentForeground }}>
              <Home className="h-4 w-4" />Hub del evento<ChevronRight className="h-4 w-4" />
            </a>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/25 bg-black/20 px-5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/15">
                <Navigation className="h-4 w-4 text-cyan-300" />Cómo llegar
              </a>
            )}
            {gps.showInvitacionWeb !== false && (
              <a href={invitacionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/25 bg-black/20 px-5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/15">
                <ExternalLink className="h-4 w-4 text-purple-300" />Ver invitación
              </a>
            )}
          </div>
        </div>
      </section>

      {portalActions.length > 0 && (
        <section aria-labelledby="guest-actions-title" className="border-b border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-4xl px-4 py-7 sm:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-red-700">Accesos</p>
                <h2 id="guest-actions-title" className="mt-1 text-2xl font-black text-slate-950">Todo tu evento</h2>
              </div>
              <span className="text-sm font-semibold text-slate-500">{portalActions.length} disponibles</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {portalActions.map((action) => <PortalActionButton key={action.id} action={action} />)}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-8 sm:py-12">
        {/* Mi Asistencia / Pase VIP */}
        <section id="mi-pase" className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-red-700">Mi asistencia</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{guest.nombre}</h2>
            </div>
            <span className={`rounded-lg border px-4 py-2 text-sm font-black ${rsvpBadge.className}`}>{rsvpBadge.label}</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {tableEnabled && guest.tableNumber && (
              <div data-testid="guest-portal-table" className="flex items-center gap-4 border-l-4 border-amber-400 bg-amber-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Armchair className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Mesa asignada</p>
                  <p className="text-xl font-black text-slate-950">Mesa {guest.tableNumber}</p>
                </div>
              </div>
            )}
            {dietLabel && (
              <div data-testid="guest-portal-dietary" className="flex items-start gap-4 border-l-4 border-rose-400 bg-rose-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Menú especial</p>
                  <p className="text-base font-bold text-slate-950">{dietLabel}{guest.alergiasEspecificas && <span className="font-normal text-slate-600"> - {guest.alergiasEspecificas}</span>}</p>
                </div>
              </div>
            )}
            {guest.requiereAccesibilidad && (
              <div className="flex items-center gap-3 border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                <Accessibility className="h-5 w-5" />Asistencia especial registrada
              </div>
            )}
            {guest.mensaje && (
              <div data-testid="guest-portal-message" className="flex items-start gap-3 border-l-4 border-slate-300 bg-slate-50 p-4 text-sm italic text-slate-700">
                <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <p>&ldquo;{guest.mensaje}&rdquo;</p>
              </div>
            )}
          </div>

          {checkinEnabled && guest.rsvp === 'Confirmado' && (
            <div data-testid="guest-portal-qr" className="mt-8 border-t border-slate-200 pt-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <TicketCheck className="h-5 w-5 text-emerald-400" />
                    <p className="text-xs font-black uppercase text-emerald-700">Credencial de entrada</p>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">Presentá este código QR al ingresar</h3>
                  <p className="mt-1 text-xs text-slate-500">Tu pase es personal.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <QRCodeStylized id="qr-guest-portal" value={qrValue} size={170} level="H" />
                </div>
                <Button onClick={downloadQR} variant="outline" className="min-h-12 rounded-lg border-slate-300 bg-white text-slate-950 hover:bg-slate-100">
                  <Download className="mr-2 h-4 w-4 text-emerald-400" />Guardar QR
                </Button>
              </div>
            </div>
          )}

          {checkinEnabled && guest.rsvp !== 'Confirmado' && (
            <p data-testid="guest-portal-qr-pending" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Tu código QR estará disponible cuando confirmes tu asistencia.
            </p>
          )}

          {rsvpEnabled && guest.rsvp !== 'Confirmado' && (
            <a href={rsvpHref} className="mt-6 inline-flex min-h-12 items-center rounded-lg px-5 text-sm font-black shadow-sm transition-transform active:scale-95 hover:brightness-110" style={{ backgroundColor: accentColor, color: accentForeground }}>
              {guest.rsvp === 'Rechazado' ? 'Actualizar respuesta' : 'Confirmar asistencia'}
            </a>
          )}

          {canModifyRsvp && cancellationDeadline && (
            <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-600">
              <p>Podés modificar o cancelar hasta el <strong className="text-slate-950">{cancellationDeadline.toLocaleDateString('es-UY', { day: 'numeric', month: 'long' })}</strong>.</p>
              <a href={rsvpHref} className="mt-2 inline-flex font-bold text-red-700 hover:underline">Modificar confirmación</a>
            </div>
          )}
        </section>

        {/* Datos del Evento */}
        {(config?.nombreLugar || fecha || dressCode?.tipo) && (
          <section id="datos-evento" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase text-sky-700">Datos del evento</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {config?.nombreLugar && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-950">{config.nombreLugar}</p>
                    {config.direccionLugar && <p className="mt-1 text-sm text-slate-500">{config.direccionLugar}</p>}
                  </div>
                </div>
              )}
              {fecha && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <p className="text-base font-bold capitalize text-slate-950">{fecha}{hora ? ` - ${hora} hs` : ''}</p>
                </div>
              )}
              {dressCode?.tipo && dressCode.tipo !== 'casual' && (
                <div data-testid="guest-portal-dresscode" className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
                    <Shirt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Código de vestimenta</p>
                    <p className="text-base font-bold capitalize text-slate-950">
                      {dressCode.tipo === 'personalizado' ? dressCode.textoPersonalizado : dressCode.tipo}
                      {dressCode.colorSugerido ? ` (${dressCode.colorSugerido})` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:underline">
                <Navigation className="h-4 w-4" />Ver en Google Maps
              </a>
            )}
          </section>
        )}

        {/* Menú del Evento */}
        {menuEnabled && (fiesta.menuMesa || menuSections.length > 0) && (
          <section id="menu-evento" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase text-amber-700">Gastronomía</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Menú seleccionado</h2>
            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              {menuSections.length > 0 ? (
                menuSections.map((item) => (
                  <div key={item.key} className="border-l-2 border-amber-300 pl-4">
                    <p className="text-xs font-bold uppercase text-slate-500">{item.label}</p>
                    <p className="mt-1 font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))
              ) : (
                <>
                  {fiesta.menuMesa?.entrada && <div className="border-l-2 border-amber-300 pl-4"><p className="text-xs font-bold uppercase text-slate-500">Entrada</p><p className="mt-1 font-semibold text-slate-950">{fiesta.menuMesa.entrada}</p></div>}
                  {fiesta.menuMesa?.platoPrincipal && <div className="border-l-2 border-amber-300 pl-4"><p className="text-xs font-bold uppercase text-slate-500">Plato principal</p><p className="mt-1 font-semibold text-slate-950">{fiesta.menuMesa.platoPrincipal}</p></div>}
                  {fiesta.menuMesa?.adolescentes && <div className="border-l-2 border-amber-300 pl-4"><p className="text-xs font-bold uppercase text-slate-500">Menú adolescente</p><p className="mt-1 font-semibold text-slate-950">{fiesta.menuMesa.adolescentes}</p></div>}
                  {fiesta.menuMesa?.postres && <div className="border-l-2 border-amber-300 pl-4"><p className="text-xs font-bold uppercase text-slate-500">Postres</p><p className="mt-1 font-semibold text-slate-950">{fiesta.menuMesa.postres}</p></div>}
                  {fiesta.menuMesa?.bebidas && <div className="border-l-2 border-amber-300 pl-4"><p className="text-xs font-bold uppercase text-slate-500">Bebidas</p><p className="mt-1 font-semibold text-slate-950">{fiesta.menuMesa.bebidas}</p></div>}
                </>
              )}
            </div>
          </section>
        )}

        {/* Recuerdos & Fotos */}
        {(socialEnabled || photosEnabled) && (
          <section id="recuerdos" className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Recuerdos en vivo</h2>
                  <p className="text-xs text-slate-500">Fotos aprobadas de esta fiesta.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {fiesta.galeriaUrl && (
                  <a href={fiesta.galeriaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-900 transition-colors hover:bg-amber-100">
                    <ExternalLink className="h-4 w-4" />Álbum oficial
                  </a>
                )}
                {socialEnabled && (
                  <a href={socialHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100">
                    <Camera className="h-4 w-4 text-rose-700" />Muro social
                  </a>
                )}
                {photosEnabled && (
                  <a href={galleryHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100">
                    <Images className="h-4 w-4 text-sky-700" />Galería
                  </a>
                )}
              </div>
            </div>
            {photosEnabled && <SocialPhotosPreview fiestaId={fiestaId} />}
          </section>
        )}

        {/* Programa del Evento */}
        {programaEnabled && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase text-emerald-700"><Clock className="mr-1.5 inline h-4 w-4" />Programa</p>
            <ul className="mt-6 space-y-4">
              {fiesta.programa.map((item) => (
                <li key={item.id} className="flex gap-4 items-start">
                  <span className="w-16 shrink-0 text-sm font-black text-emerald-700">{item.hora}</span>
                  <div>
                    <p className="text-base font-bold text-slate-950">{item.titulo}</p>
                    {item.descripcion && <p className="mt-1 text-sm text-slate-500">{item.descripcion}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Branding & CTA AK Producciones */}
        {showAkCta && (
          <section data-testid="guest-portal-ak-cta" className="border-t border-slate-300 pt-10 text-center">
            <p className="text-xs font-black uppercase text-red-700">Una experiencia de</p>
            <p className="mt-2 text-2xl font-black text-slate-950">AK PRODUCCIONES</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              {guestExp?.ctaDescription || guestExp?.ctaText || 'Conocé cómo organizamos eventos completos, tranquilos e inolvidables.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {instagramUrl && guestExp?.showSocialCta !== false && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-instagram" onClick={() => trackGuestCtaClick(fiestaId, guest.id, guestAccessToken, 'clickedInstagram').catch(() => {})} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100">
                  <Instagram className="h-4 w-4 text-pink-700" />Instagram
                </a>
              )}
              {facebookUrl && guestExp?.showSocialCta !== false && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100">
                  <Facebook className="h-4 w-4 text-blue-700" />Facebook
                </a>
              )}
              {tiktokUrl && guestExp?.showSocialCta !== false && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100">
                  TikTok
                </a>
              )}
              {whatsappUrl && guestExp?.showSocialCta !== false && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-whatsapp" onClick={() => trackGuestCtaClick(fiestaId, guest.id, guestAccessToken, 'clickedWhatsapp').catch(() => {})} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100">
                  <MessageCircle className="h-4 w-4 text-emerald-700" />WhatsApp
                </a>
              )}
            </div>
            {landingUrl && guestExp?.showLandingCta !== false && (
              <a href={landingUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-landing" onClick={() => trackGuestCtaClick(fiestaId, guest.id, guestAccessToken, 'clickedLanding').catch(() => {})} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-6 text-sm font-bold text-red-800 transition-colors hover:bg-red-100">
                <Globe className="h-4 w-4" />Quiero organizar mi evento
              </a>
            )}
            {simulatorUrl && guestExp?.showBudgetSimulatorCta && (
              <a href={simulatorUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-simulator" onClick={() => trackGuestCtaClick(fiestaId, guest.id, guestAccessToken, 'clickedSimulator').catch(() => {})} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition-colors hover:bg-red-800">
                Simular mi presupuesto
              </a>
            )}
          </section>
        )}
      </div>

      <nav aria-label="Navegación del invitado" className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-lg border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur sm:hidden">
        <div className="grid grid-cols-3 gap-1">
          <a href="#mi-pase" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-600 transition-colors hover:text-slate-950">
            <TicketCheck className="h-5 w-5 text-emerald-700" />Mi pase
          </a>
          <a href={hubHref} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-black" style={{ color: accentColor }}>
            <Home className="h-5 w-5" />Hub
          </a>
          {(config?.nombreLugar || fecha || dressCode?.tipo)
            ? <a href="#datos-evento" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-600 transition-colors hover:text-slate-950"><MapPin className="h-5 w-5 text-sky-700" />Evento</a>
            : <a href={invitacionUrl} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-600 transition-colors hover:text-slate-950"><ExternalLink className="h-5 w-5 text-sky-700" />Invitación</a>}
        </div>
      </nav>

      {showQuiosco && <MiniQuiosco fiestaId={fiestaId} guest={guest} guestAccessToken={guestAccessToken} canShareToSocial={socialEnabled && photosEnabled} onClose={() => setShowQuiosco(false)} />}
      <style jsx global>{`
        @keyframes guestHero {
          from {
            transform: scale(1.02) translate3d(-0.4%, 0, 0);
          }
          to {
            transform: scale(1.08) translate3d(0.4%, -0.6%, 0);
          }
        }
      `}</style>
    </main>
  );
}

export default function GuestPortalPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}><GuestPortalContent /></Suspense>;
}
