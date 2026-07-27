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
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Facebook,
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
  TicketCheck,
  UtensilsCrossed,
} from 'lucide-react';
import QRCodeStylized from 'qrcode.react';
import {
  getPublicGuestPortalData,
} from '@/app/actions/public-guest-portal';
import { getSocialConnections } from '@/app/actions/social-connections';
import { trackGuestCtaClick } from '@/app/actions/fiesta/invitados.actions';
import { Button } from '@/components/ui/button';
import { appendCommercialAttribution } from '@/lib/commercial/acquisition';
import { withGuestAccess } from '@/lib/guest-portal/public-event-navigation';
import { getPublicGuestMenuSections } from '@/lib/guest-portal/public-menu';
import type { PublicGuest, PublicGuestEvent } from '@/lib/guest-portal-public-data';
import type { SocialConnection } from '@/types/settings';
import type { GuestPortalSettings } from '@/types/fiesta';
import { MiniQuiosco } from './MiniQuiosco';

const DIETARY_LABELS: Record<string, string> = {
  Ninguna: '',
  Celiaco: 'Menu sin gluten',
  Vegetariano: 'Menu vegetariano',
  Vegano: 'Menu vegano',
  Otro: 'Menu especial',
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

function getDaysUntil(fechaEvento?: string): number | null {
  if (!fechaEvento) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(fechaEvento);
  event.setHours(0, 0, 0, 0);
  return Math.round((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getSocialUrl(connections: SocialConnection[], platform: string): string | undefined {
  return connections.find((connection) => connection.platform === platform && connection.isConnected)?.profileUrl;
}

function SocialPhotosPreview({ fiestaId }: { fiestaId: string }) {
  const [photos, setPhotos] = useState<{ id: string; imageUrl: string; authorName: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import('@/app/actions/social-gallery').then(({ getPublicSocialPosts }) => {
      getPublicSocialPosts(fiestaId)
        .then((posts) => setPhotos(posts.slice(0, 6).map((post) => ({
          id: post.id,
          imageUrl: post.imageUrl,
          authorName: post.authorName ?? '',
        }))))
        .finally(() => setLoaded(true));
    });
  }, [fiestaId]);

  if (!loaded) return null;
  if (photos.length === 0) {
    return <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">Todavia no hay fotos publicadas.</p>;
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
      setSocialConnections(connections);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar tu informacion.');
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
        <div className="max-w-md"><AlertTriangle className="mx-auto h-10 w-10 text-red-400" /><h1 className="mt-5 text-2xl font-black">No pudimos abrir tu invitacion</h1><p className="mt-3 text-sm text-slate-300">{loadError || 'Verifica el enlace o contacta al organizador.'}</p></div>
      </main>
    );
  }

  const config = fiesta.configuracion;
  const guestExp = fiesta.guestExperienceSettings;
  const gps: GuestPortalSettings = { ...DEFAULT_GPS, ...(fiesta.guestPortalSettings ?? {}) };
  const modules = fiesta.modulosContratados;
  const socialEnabled = gps.showMural !== false && (!modules || (modules.redSocial ?? modules.muroSocial) !== false);
  const photosEnabled = gps.showFotos !== false && (!modules || modules.fotografia !== false);
  const musicEnabled = gps.showMusica !== false && guestExp?.allowSongSuggestions !== false && (!modules || modules.musica !== false);
  const barEnabled = modules?.barraTecnologica === true;
  const tableEnabled = gps.showMesaAsignada !== false && (!modules || modules.numerosMesa !== false);
  const checkinEnabled = gps.showCheckin !== false && (!modules || modules.checkin !== false);
  const menuEnabled = guestExp?.showMenu !== false && (!modules || modules.menuMesa !== false);
  const rsvpEnabled = fiesta.invitacionConfig?.rsvpActivo !== false;
  const giftsEnabled = gps.showRegalos === true && (!modules || modules.regalos !== false);
  const programaEnabled = gps.showItinerario !== false && (!modules || modules.itinerario !== false) && fiesta.programa.length > 0;

  if (guestExp?.allowGuestPortal === false) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 p-8 text-center text-white"><div><TicketCheck className="mx-auto h-10 w-10 text-slate-400" /><h1 className="mt-5 text-xl font-black">El portal del invitado todavia no esta habilitado.</h1><p className="mt-2 text-sm text-slate-400">Intenta nuevamente mas tarde.</p></div></main>;
  }

  const guestPath = (path: string) => withGuestAccess(path, guest.id, guestAccessToken);
  const hubHref = guestPath(`/evento/hub/${fiestaId}`);
  const socialHref = guestPath(`/evento/social/${fiestaId}`);
  const galleryHref = guestPath(`/evento/galeria/${fiestaId}`);
  const songsHref = guestPath(`/evento/social/${fiestaId}?section=songs`);
  const barHref = guestPath(`/evento/barra/${fiestaId}`);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app-ak.vercel.app';
  const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&token=${encodeURIComponent(guestAccessToken)}&guestId=${encodeURIComponent(guest.id)}`;
  const invitacionUrl = fiesta.invitacionSlug ? `/i/${fiesta.invitacionSlug}` : `/invitacion/${fiestaId}`;
  const fecha = config?.fechaEvento ? new Date(config.fechaEvento).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const hora = config?.horaInicio;
  const mapsUrl = config?.direccionLugar ? `https://maps.google.com/?q=${encodeURIComponent(config.direccionLugar)}` : undefined;
  const heroImage = gps.coverImageUrl || fiesta.invitacionConfig?.fotoPortada;
  const accentColor = gps.customAccentColor || fiesta.invitacionConfig?.colorPrincipal || config?.primaryColor || '#b91c1c';
  const daysUntil = getDaysUntil(config?.fechaEvento);
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24 text-slate-100 sm:pb-12">
      <section className="relative flex min-h-[58svh] items-end overflow-hidden text-white">
        {heroImage && <img src={heroImage} alt={config?.nombreEvento || 'Evento'} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105" decoding="async" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-black/50" />
        <div className="relative z-10 mx-auto flex min-h-[58svh] w-full max-w-4xl flex-col justify-end px-5 py-8 sm:px-8 sm:py-12">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
            <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Portal VIP del Invitado</p>
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">{config?.nombreEvento || 'Tu evento'}</h1>
          <p className="mt-3 text-xl font-medium text-slate-200">Hola, <span className="font-black text-white">{guest.nombre}</span> ✨</p>
          {gps.welcomeMessage && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300/90">{gps.welcomeMessage}</p>}
          {(fecha || config?.nombreLugar) && (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-200">
              {fecha && <span className="inline-flex items-center gap-2 capitalize"><CalendarDays className="h-4 w-4 text-rose-400" />{fecha}{hora ? ` - ${hora} hs` : ''}</span>}
              {config?.nombreLugar && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-400" />{config.nombreLugar}</span>}
            </div>
          )}
          {daysUntil !== null && (
            <div className="mt-4 flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-black text-white backdrop-blur-md shadow-lg">
              <Clock className="h-4 w-4 text-amber-300 animate-spin-slow" />
              <span>{daysUntil === 0 ? '🎉 ¡El evento es HOY!' : daysUntil > 0 ? `Faltan ${daysUntil} día${daysUntil === 1 ? '' : 's'} para la gran fiesta` : `El evento fue hace ${Math.abs(daysUntil)} día${Math.abs(daysUntil) === 1 ? '' : 's'}`}</span>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={hubHref} className="inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-black text-white shadow-lg transition-transform active:scale-95 hover:brightness-110" style={{ backgroundColor: accentColor }}>
              <Home className="h-4 w-4" />Hub del evento<ChevronRight className="h-4 w-4" />
            </a>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20">
                <Navigation className="h-4 w-4 text-cyan-300" />Cómo llegar
              </a>
            )}
            {gps.showInvitacionWeb !== false && (
              <a href={invitacionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20">
                <ExternalLink className="h-4 w-4 text-purple-300" />Ver invitación
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-8 sm:py-12">
        {/* Mi Asistencia / Pase VIP */}
        <section id="mi-pase" className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-400">Pase VIP de Asistencia</p>
              <h2 className="mt-2 text-3xl font-black text-white">{guest.nombre}</h2>
            </div>
            <span className={`rounded-xl border px-4 py-2 text-sm font-black shadow-sm ${rsvpBadge.className}`}>{rsvpBadge.label}</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {tableEnabled && guest.tableNumber && (
              <div data-testid="guest-portal-table" className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                  <Armchair className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Mesa Asignada</p>
                  <p className="text-xl font-black text-white">Mesa {guest.tableNumber}</p>
                </div>
              </div>
            )}
            {dietLabel && (
              <div data-testid="guest-portal-dietary" className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Menú Especial</p>
                  <p className="text-base font-bold text-white">{dietLabel}{guest.alergiasEspecificas && <span className="text-slate-300 font-normal"> - {guest.alergiasEspecificas}</span>}</p>
                </div>
              </div>
            )}
            {guest.requiereAccesibilidad && (
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-400 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <Accessibility className="h-5 w-5" />Asistencia especial registrada
              </div>
            )}
            {guest.mensaje && (
              <div data-testid="guest-portal-message" className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 italic">
                <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <p>&ldquo;{guest.mensaje}&rdquo;</p>
              </div>
            )}
          </div>

          {checkinEnabled && guest.rsvp === 'Confirmado' && (
            <div data-testid="guest-portal-qr" className="mt-8 border-t border-white/10 pt-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <TicketCheck className="h-5 w-5 text-emerald-400" />
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Credencial de Entrada</p>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-white">Presentá este código QR al ingresar</h3>
                  <p className="mt-1 text-xs text-slate-400">Escáner automático en recepción para acceso sin demoras.</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white p-4 shadow-2xl">
                  <QRCodeStylized id="qr-guest-portal" value={qrValue} size={170} level="H" />
                </div>
                <Button onClick={downloadQR} variant="outline" className="min-h-12 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md">
                  <Download className="mr-2 h-4 w-4 text-emerald-400" />Guardar QR
                </Button>
              </div>
            </div>
          )}

          {checkinEnabled && guest.rsvp !== 'Confirmado' && (
            <p data-testid="guest-portal-qr-pending" className="mt-6 text-sm font-semibold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              ⚠️ Tu código QR de entrada estará disponible tan pronto como confirmes tu asistencia.
            </p>
          )}

          {rsvpEnabled && guest.rsvp !== 'Confirmado' && (
            <a href={`/invitacion/${fiestaId}/rsvp`} className="mt-6 inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-black text-white shadow-lg transition-transform active:scale-95 hover:brightness-110" style={{ backgroundColor: accentColor }}>
              {guest.rsvp === 'Rechazado' ? 'Actualizar respuesta' : 'Confirmar asistencia'}
            </a>
          )}

          {guest.rsvp === 'Confirmado' && fiesta.configuracion?.fechaEvento && (() => {
            const deadline = new Date(fiesta.configuracion.fechaEvento);
            deadline.setDate(deadline.getDate() - 7);
            return new Date() < deadline ? (
              <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">
                <p>Podés modificar o cancelar hasta el <strong className="text-white">{deadline.toLocaleDateString('es-UY', { day: 'numeric', month: 'long' })}</strong>.</p>
                <a href={`/invitacion/${fiestaId}/rsvp`} className="mt-2 inline-flex font-bold text-rose-400 hover:underline">Modificar confirmación</a>
              </div>
            ) : null;
          })()}
        </section>

        {/* Datos del Evento */}
        {(config?.nombreLugar || fecha || dressCode?.tipo) && (
          <section id="datos-evento" className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-400">Datos Clave del Evento</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {config?.nombreLugar && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{config.nombreLugar}</p>
                    {config.direccionLugar && <p className="mt-1 text-sm text-slate-400">{config.direccionLugar}</p>}
                  </div>
                </div>
              )}
              {fecha && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <p className="text-base font-bold capitalize text-white">{fecha}{hora ? ` - ${hora} hs` : ''}</p>
                </div>
              )}
              {dressCode?.tipo && dressCode.tipo !== 'casual' && (
                <div data-testid="guest-portal-dresscode" className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300">
                    <Shirt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Código de Vestimenta</p>
                    <p className="text-base font-bold capitalize text-white">
                      {dressCode.tipo === 'personalizado' ? dressCode.textoPersonalizado : dressCode.tipo}
                      {dressCode.colorSugerido ? ` (${dressCode.colorSugerido})` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:underline">
                <Navigation className="h-4 w-4" />Ver en Google Maps
              </a>
            )}
          </section>
        )}

        {/* Menú del Evento */}
        {menuEnabled && (fiesta.menuMesa || menuSections.length > 0) && (
          <section id="menu-evento" className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400">Gastronomía & Menú</p>
            <h2 className="mt-1 text-2xl font-black text-white">Menú Seleccionado</h2>
            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              {menuSections.length > 0 ? (
                menuSections.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">{item.label}</p>
                    <p className="mt-1 font-semibold text-white">{item.value}</p>
                  </div>
                ))
              ) : (
                <>
                  {fiesta.menuMesa?.entrada && <div className="rounded-2xl border border-white/5 bg-white/5 p-4"><p className="text-xs font-bold uppercase text-slate-400">Entrada</p><p className="mt-1 font-semibold text-white">{fiesta.menuMesa.entrada}</p></div>}
                  {fiesta.menuMesa?.platoPrincipal && <div className="rounded-2xl border border-white/5 bg-white/5 p-4"><p className="text-xs font-bold uppercase text-slate-400">Plato Principal</p><p className="mt-1 font-semibold text-white">{fiesta.menuMesa.platoPrincipal}</p></div>}
                  {fiesta.menuMesa?.adolescentes && <div className="rounded-2xl border border-white/5 bg-white/5 p-4"><p className="text-xs font-bold uppercase text-slate-400">Menú Adolescente</p><p className="mt-1 font-semibold text-white">{fiesta.menuMesa.adolescentes}</p></div>}
                  {fiesta.menuMesa?.postres && <div className="rounded-2xl border border-white/5 bg-white/5 p-4"><p className="text-xs font-bold uppercase text-slate-400">Postres</p><p className="mt-1 font-semibold text-white">{fiesta.menuMesa.postres}</p></div>}
                  {fiesta.menuMesa?.bebidas && <div className="rounded-2xl border border-white/5 bg-white/5 p-4"><p className="text-xs font-bold uppercase text-slate-400">Bebidas</p><p className="mt-1 font-semibold text-white">{fiesta.menuMesa.bebidas}</p></div>}
                </>
              )}
            </div>
          </section>
        )}

        {/* Regalos */}
        {giftsEnabled && (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-widest text-violet-400">Mesa de Regalos</p>
            <p className="mt-2 text-sm text-slate-300">Consultá las opciones de obsequios o transferencia de este evento.</p>
            <a href={`${invitacionUrl}#regalos`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/20 transition-all">
              Ver opciones de regalo
            </a>
          </section>
        )}

        {/* Recuerdos & Fotos */}
        {(socialEnabled || photosEnabled) && (
          <section id="recuerdos" className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Recuerdos en Vivo</h2>
                  <p className="text-xs text-slate-400">Compartí fotos e interaccioná en la pantalla gigante.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {fiesta.galeriaUrl && (
                  <a href={fiesta.galeriaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 text-sm font-bold text-amber-300 hover:bg-amber-400/20 transition-all">
                    <ExternalLink className="h-4 w-4 text-amber-300" />Álbum Digital Oficial
                  </a>
                )}
                {socialEnabled && (
                  <a href={socialHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all">
                    <Camera className="h-4 w-4 text-rose-400" />Muro Social
                  </a>
                )}
                {photosEnabled && (
                  <a href={galleryHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all">
                    <Images className="h-4 w-4 text-cyan-400" />Galería
                  </a>
                )}
              </div>
            </div>
            {photosEnabled && <SocialPhotosPreview fiestaId={fiestaId} />}
          </section>
        )}

        {/* Música */}
        {musicEnabled && (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-fuchsia-400">Peticiones Musicales</p>
                <h2 className="mt-1 text-2xl font-black text-white">Tus canciones para el DJ</h2>
              </div>
              <a href={songsHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all">
                <Music className="h-4 w-4 text-fuchsia-400" />Pedir canción
              </a>
            </div>
            {guest.cancionesDJ && guest.cancionesDJ.length > 0 && (
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
                {guest.cancionesDJ.map((song, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                    <Music className="h-4 w-4 text-fuchsia-400" />{song}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Barra Tecnológica */}
        {barEnabled && (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-400">Barra Tecnológica VIP</p>
                <h2 className="mt-1 text-2xl font-black text-white">Pedí tu trago desde el celu</h2>
                <p className="mt-1 text-xs text-slate-400">Seguí el estado de preparación de tu pedido en tiempo real.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowQuiosco(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white shadow-lg transition-transform active:scale-95 hover:brightness-110" style={{ backgroundColor: accentColor }}>
                  <TicketCheck className="h-4 w-4" />Abrir quiosco
                </button>
                <a href={barHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all">
                  Ver carta
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Programa del Evento */}
        {programaEnabled && (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-400"><Clock className="mr-1.5 inline h-4 w-4" />Programa & Cronograma</p>
            <ul className="mt-6 space-y-4">
              {fiesta.programa.map((item) => (
                <li key={item.id} className="flex gap-4 items-start">
                  <span className="w-16 shrink-0 text-sm font-black text-emerald-400">{item.hora}</span>
                  <div>
                    <p className="font-bold text-white text-base">{item.titulo}</p>
                    {item.descripcion && <p className="mt-1 text-sm text-slate-400">{item.descripcion}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Branding & CTA AK Producciones */}
        {showAkCta && (
          <section data-testid="guest-portal-ak-cta" className="border-t border-white/10 pt-10 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400">Experiencia Producida por</p>
            <p className="mt-2 text-2xl font-black text-white tracking-wider">AK PRODUCCIONES</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              {guestExp?.ctaDescription || guestExp?.ctaText || 'Conocé cómo organizamos eventos completos, tranquilos e inolvidables.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {instagramUrl && guestExp?.showSocialCta !== false && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-instagram" onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedInstagram').catch(() => {})} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all">
                  <Instagram className="h-4 w-4 text-pink-400" />Instagram
                </a>
              )}
              {facebookUrl && guestExp?.showSocialCta !== false && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all">
                  <Facebook className="h-4 w-4 text-blue-400" />Facebook
                </a>
              )}
              {tiktokUrl && guestExp?.showSocialCta !== false && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all">
                  TikTok
                </a>
              )}
              {whatsappUrl && guestExp?.showSocialCta !== false && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-whatsapp" onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedWhatsapp').catch(() => {})} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 transition-all">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />WhatsApp
                </a>
              )}
            </div>
            {landingUrl && guestExp?.showLandingCta !== false && (
              <a href={landingUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-landing" onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedLanding').catch(() => {})} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-6 text-sm font-bold text-amber-300 hover:bg-amber-400/20 transition-all">
                <Globe className="h-4 w-4" />Quiero organizar mi evento
              </a>
            )}
            {simulatorUrl && guestExp?.showBudgetSimulatorCta && (
              <a href={simulatorUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-simulator" onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedSimulator').catch(() => {})} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-slate-950 shadow-lg hover:bg-slate-100 transition-all">
                Simular mi presupuesto
              </a>
            )}
          </section>
        )}
      </div>

      {/* Dock de Navegación Flotante estilo iOS */}
      <nav aria-label="Navegacion del invitado" className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-2xl border border-white/20 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-xl sm:hidden">
        <div className="grid grid-cols-3 gap-1">
          <a href="#mi-pase" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-300 transition-colors hover:text-white">
            <TicketCheck className="h-5 w-5 text-emerald-400" />Pase VIP
          </a>
          <a href={hubHref} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-black text-white" style={{ color: accentColor }}>
            <Home className="h-5 w-5" />Hub
          </a>
          <a href="#datos-evento" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-300 transition-colors hover:text-white">
            <MapPin className="h-5 w-5 text-cyan-400" />Evento
          </a>
        </div>
      </nav>

      {showQuiosco && <MiniQuiosco fiestaId={fiestaId} guest={guest} guestAccessToken={guestAccessToken} canShareToSocial={socialEnabled && photosEnabled} onClose={() => setShowQuiosco(false)} />}
    </main>
  );
}

export default function GuestPortalPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}><GuestPortalContent /></Suspense>;
}
