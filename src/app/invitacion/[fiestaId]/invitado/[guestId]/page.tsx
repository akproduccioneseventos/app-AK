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
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-950 sm:pb-10">
      <section className="relative flex min-h-[56svh] items-end overflow-hidden bg-slate-950 text-white">
        {heroImage && <img src={heroImage} alt={config?.nombreEvento || 'Evento'} className="absolute inset-0 h-full w-full object-cover" decoding="async" />}
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 mx-auto flex min-h-[56svh] w-full max-w-4xl flex-col justify-end px-5 py-8 sm:px-8 sm:py-12">
          <p className="text-xs font-black uppercase tracking-widest text-white/75">Portal del invitado</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{config?.nombreEvento || 'Tu evento'}</h1>
          <p className="mt-3 text-lg text-white/90">Hola, <strong>{guest.nombre}</strong></p>
          {gps.welcomeMessage && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">{gps.welcomeMessage}</p>}
          {(fecha || config?.nombreLugar) && <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/85">{fecha && <span className="inline-flex items-center gap-2 capitalize"><CalendarDays className="h-4 w-4" />{fecha}{hora ? ` - ${hora} hs` : ''}</span>}{config?.nombreLugar && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{config.nombreLugar}</span>}</div>}
          {daysUntil !== null && <p className="mt-4 w-fit rounded-lg border border-white/25 bg-black/20 px-3 py-2 text-sm font-bold">{daysUntil === 0 ? 'El evento es hoy' : daysUntil > 0 ? `Faltan ${daysUntil} dia${daysUntil === 1 ? '' : 's'}` : `El evento fue hace ${Math.abs(daysUntil)} dia${Math.abs(daysUntil) === 1 ? '' : 's'}`}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={hubHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-black text-white" style={{ backgroundColor: accentColor }}><Home className="h-4 w-4" />Hub del evento<ChevronRight className="h-4 w-4" /></a>
            {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/25 bg-black/20 px-4 text-sm font-bold"><Navigation className="h-4 w-4" />Como llegar</a>}
            {gps.showInvitacionWeb !== false && <a href={invitacionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/25 bg-black/20 px-4 text-sm font-bold"><ExternalLink className="h-4 w-4" />Ver invitacion</a>}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-8 sm:py-12">
        <section id="mi-pase" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-slate-500">Mi asistencia</p><h2 className="mt-2 text-2xl font-black">{guest.nombre}</h2></div><span className={`rounded-lg border px-3 py-2 text-sm font-bold ${rsvpBadge.className}`}>{rsvpBadge.label}</span></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {tableEnabled && guest.tableNumber && <div data-testid="guest-portal-table" className="flex items-center gap-3"><Armchair className="h-5 w-5 text-slate-500" /><div><p className="text-xs text-slate-500">Mesa asignada</p><p className="font-black">Mesa {guest.tableNumber}</p></div></div>}
            {dietLabel && <div data-testid="guest-portal-dietary" className="flex items-start gap-3"><UtensilsCrossed className="mt-0.5 h-5 w-5 text-slate-500" /><p className="text-sm"><span className="font-bold">{dietLabel}</span>{guest.alergiasEspecificas && <span className="text-slate-500"> - {guest.alergiasEspecificas}</span>}</p></div>}
            {guest.requiereAccesibilidad && <div className="flex items-center gap-3 text-sm"><Accessibility className="h-5 w-5 text-slate-500" />Asistencia especial registrada</div>}
            {guest.mensaje && <div data-testid="guest-portal-message" className="flex items-start gap-3 text-sm"><Heart className="mt-0.5 h-5 w-5 text-slate-500" /><p className="italic">&ldquo;{guest.mensaje}&rdquo;</p></div>}
          </div>
          {checkinEnabled && guest.rsvp === 'Confirmado' && <div data-testid="guest-portal-qr" className="mt-6 border-t border-slate-200 pt-5"><div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-slate-500">Pase de entrada</p><p className="mt-1 text-sm text-slate-600">Mostra este codigo al ingresar al evento.</p></div><div className="rounded-lg border border-slate-200 bg-white p-3"><QRCodeStylized id="qr-guest-portal" value={qrValue} size={160} level="H" /></div><Button onClick={downloadQR} variant="outline" className="min-h-11 rounded-lg"><Download className="mr-2 h-4 w-4" />Guardar QR</Button></div></div>}
          {checkinEnabled && guest.rsvp !== 'Confirmado' && <p data-testid="guest-portal-qr-pending" className="mt-5 text-sm text-slate-500">Tu QR de entrada estara disponible una vez que confirmes tu asistencia.</p>}
          {guest.rsvp === 'Confirmado' && fiesta.configuracion?.fechaEvento && (() => { const deadline = new Date(fiesta.configuracion.fechaEvento); deadline.setDate(deadline.getDate() - 7); return new Date() < deadline ? <div className="mt-5 border-t border-slate-200 pt-4 text-sm"><p className="text-slate-600">Podes cancelar hasta el <strong>{deadline.toLocaleDateString('es-UY', { day: 'numeric', month: 'long' })}</strong>.</p><a href={`/invitacion/${fiestaId}/rsvp`} className="mt-2 inline-flex font-bold text-slate-950 underline">Cancelar confirmacion</a></div> : null; })()}
        </section>

        {(config?.nombreLugar || fecha || dressCode?.tipo) && <section id="datos-evento" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Datos del evento</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{config?.nombreLugar && <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-slate-500" /><div><p className="font-bold">{config.nombreLugar}</p>{config.direccionLugar && <p className="mt-1 text-sm text-slate-500">{config.direccionLugar}</p>}</div></div>}{fecha && <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-5 w-5 text-slate-500" /><p className="text-sm capitalize">{fecha}{hora ? ` - ${hora} hs` : ''}</p></div>}{dressCode?.tipo && dressCode.tipo !== 'casual' && <div data-testid="guest-portal-dresscode" className="flex items-start gap-3"><Shirt className="mt-0.5 h-5 w-5 text-slate-500" /><div><p className="text-xs text-slate-500">Dress code</p><p className="text-sm font-bold capitalize">{dressCode.tipo === 'personalizado' ? dressCode.textoPersonalizado : dressCode.tipo}{dressCode.colorSugerido ? ` - ${dressCode.colorSugerido}` : ''}</p></div></div>}</div>{mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold underline" style={{ color: accentColor }}><Navigation className="h-4 w-4" />Ver en Google Maps</a>}</section>}

        {menuEnabled && fiesta.menuMesa && <section id="menu-evento" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Menu del evento</p><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{fiesta.menuMesa.entrada && <p><strong>Entrada:</strong> {fiesta.menuMesa.entrada}</p>}{fiesta.menuMesa.platoPrincipal && <p><strong>Plato principal:</strong> {fiesta.menuMesa.platoPrincipal}</p>}{fiesta.menuMesa.adolescentes && <p><strong>Menu adolescente:</strong> {fiesta.menuMesa.adolescentes}</p>}{fiesta.menuMesa.postres && <p><strong>Postres:</strong> {fiesta.menuMesa.postres}</p>}{fiesta.menuMesa.bebidas && <p><strong>Bebidas:</strong> {fiesta.menuMesa.bebidas}</p>}</div></section>}

        {giftsEnabled && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Regalos</p><p className="mt-2 text-sm text-slate-600">Consulta las opciones de regalo de este evento.</p><a href={`${invitacionUrl}#regalos`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-bold">Ver regalos</a></section>}

        {(socialEnabled || photosEnabled) && <section id="recuerdos" className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><Camera className="h-5 w-5" style={{ color: accentColor }} /><div><p className="font-black">Recuerdos de la fiesta</p><p className="text-sm text-slate-500">Compartí y mira los momentos publicados.</p></div></div><div className="flex flex-wrap gap-2">{socialEnabled && <a href={socialHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold"><Camera className="h-4 w-4" />Muro social</a>}{photosEnabled && <a href={galleryHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold"><Images className="h-4 w-4" />Galeria</a>}</div></div>{photosEnabled && <SocialPhotosPreview fiestaId={fiestaId} />}</section>}

        {musicEnabled && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-slate-500">Musica</p><h2 className="mt-2 text-xl font-black">Tus canciones sugeridas</h2></div><a href={songsHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold"><Music className="h-4 w-4" />Pedir cancion</a></div>{guest.cancionesDJ && guest.cancionesDJ.length > 0 && <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4">{guest.cancionesDJ.map((song, index) => <li key={index} className="flex items-center gap-2 text-sm"><Music className="h-4 w-4 text-slate-400" />{song}</li>)}</ul>}</section>}

        {barEnabled && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-widest text-slate-500">Barra tecnologica</p><h2 className="mt-2 text-xl font-black">Pedi tu trago</h2><p className="mt-1 text-sm text-slate-500">Segui el estado de tu pedido desde tu telefono.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setShowQuiosco(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-black text-white" style={{ backgroundColor: accentColor }}><TicketCheck className="h-4 w-4" />Abrir quiosco</button><a href={barHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold">Ver carta</a></div></div></section>}

        {programaEnabled && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-slate-500"><Clock className="mr-1 inline h-4 w-4" />Programa del evento</p><ul className="mt-5 space-y-4">{fiesta.programa.map((item) => <li key={item.id} className="flex gap-4"><span className="w-14 shrink-0 text-sm font-bold text-slate-500">{item.hora}</span><div><p className="font-bold">{item.titulo}</p>{item.descripcion && <p className="mt-1 text-sm text-slate-500">{item.descripcion}</p>}</div></li>)}</ul></section>}

        {showAkCta && <section data-testid="guest-portal-ak-cta" className="border-t border-slate-200 pt-8 text-center"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Experiencia creada por</p><p className="mt-2 text-xl font-black">AK PRODUCCIONES</p><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">{guestExp?.ctaDescription || guestExp?.ctaText || 'Conoce como organizamos eventos completos e inolvidables.'}</p><div className="mt-5 flex flex-wrap justify-center gap-2">{instagramUrl && guestExp?.showSocialCta !== false && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-instagram" onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedInstagram').catch(() => {})} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold"><Instagram className="h-4 w-4" />Instagram</a>}{facebookUrl && guestExp?.showSocialCta !== false && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold"><Facebook className="h-4 w-4" />Facebook</a>}{tiktokUrl && guestExp?.showSocialCta !== false && <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold">TikTok</a>}{whatsappUrl && guestExp?.showSocialCta !== false && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-whatsapp" onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedWhatsapp').catch(() => {})} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold"><MessageCircle className="h-4 w-4" />WhatsApp</a>}</div>{landingUrl && guestExp?.showLandingCta !== false && <a href={landingUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-landing" onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedLanding').catch(() => {})} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold" style={{ borderColor: accentColor, color: accentColor }}><Globe className="h-4 w-4" />Quiero organizar mi evento</a>}{simulatorUrl && guestExp?.showBudgetSimulatorCta && <a href={simulatorUrl} target="_blank" rel="noopener noreferrer" data-testid="guest-portal-cta-simulator" onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedSimulator').catch(() => {})} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white">Simular presupuesto</a>}</section>}
      </div>

      <nav aria-label="Navegacion del invitado" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:hidden"><div className="mx-auto grid max-w-md grid-cols-3"><a href="#mi-pase" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-600"><TicketCheck className="h-5 w-5" />Mi pase</a><a href={hubHref} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-black" style={{ color: accentColor }}><Home className="h-5 w-5" />Hub</a><a href="#datos-evento" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-600"><MapPin className="h-5 w-5" />Evento</a></div></nav>
      {showQuiosco && <MiniQuiosco fiestaId={fiestaId} guest={guest} guestAccessToken={guestAccessToken} canShareToSocial={socialEnabled && photosEnabled} onClose={() => setShowQuiosco(false)} />}
    </main>
  );
}

export default function GuestPortalPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}><GuestPortalContent /></Suspense>;
}
