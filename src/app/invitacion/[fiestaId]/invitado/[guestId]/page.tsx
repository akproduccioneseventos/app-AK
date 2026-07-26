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
<<<<<<< HEAD
  X,
  Utensils,
=======
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
>>>>>>> origin/main
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
  const [showMenuModal, setShowMenuModal] = useState(false);

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
<<<<<<< HEAD
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center gap-6">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-bold text-white">El Portal del Invitado todavía no está habilitado.</h2>
        <p className="text-sm text-zinc-400">Tu pase todavía no está activo.<br />Intentá nuevamente más tarde.</p>
      </div>
    );
=======
    return <main className="grid min-h-screen place-items-center bg-slate-950 p-8 text-center text-white"><div><TicketCheck className="mx-auto h-10 w-10 text-slate-400" /><h1 className="mt-5 text-xl font-black">El portal del invitado todavia no esta habilitado.</h1><p className="mt-2 text-sm text-slate-400">Intenta nuevamente mas tarde.</p></div></main>;
>>>>>>> origin/main
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
<<<<<<< HEAD
    <div className="ak-live-stage min-h-screen text-zinc-100 flex flex-col items-center" style={{ backgroundColor: gps.customBgColor || undefined }}>

      {/* ─── HERO ─── */}
      <div className="ak-public-hero relative w-full overflow-hidden" style={{ minHeight: '340px' }}>
        {heroImage ? (
          <img
            src={heroImage}
            alt={config?.nombreEvento || 'Evento'}
            className="absolute inset-0 w-full h-full object-cover"
            decoding="async"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, ${accentColor}30 100%)` }}
          />
        )}
        {/* Overlay oscuro gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-zinc-950" />

        {/* Contenido hero */}
        <div className="relative z-10 flex flex-col items-center justify-end px-6 pb-8 pt-14 text-center" style={{ minHeight: '340px' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>
            ✨ Portal del Invitado
          </p>
          <h1 className="text-3xl font-black text-white leading-tight mb-1">
            {config?.nombreEvento || 'Tu evento'}
          </h1>
          <p className="text-lg text-zinc-200 mb-2">Hola, <strong>{guest.nombre}</strong> 👋</p>
          {gps.welcomeMessage && (
            <p className="text-sm text-zinc-300 italic mb-2">{gps.welcomeMessage}</p>
          )}
          {fecha && (
            <p className="text-sm text-zinc-300 capitalize flex items-center gap-1.5 justify-center">
              <CalendarDays className="w-4 h-4" />
              {fecha}{hora ? ` · ${hora} hs` : ''}
            </p>
          )}
          {config?.nombreLugar && (
            <p className="text-sm text-zinc-400 mt-0.5">{config.nombreLugar}</p>
          )}

          {/* Cuenta regresiva */}
          {daysUntil !== null && (
            <div
              className="mt-3 px-4 py-1.5 rounded-full text-sm font-bold border"
              style={{ color: accentColor, borderColor: `${accentColor}60`, background: `${accentColor}15` }}
            >
              {daysUntil === 0
                ? '🎉 ¡Es hoy!'
                : daysUntil > 0
                ? `⏱ Faltan ${daysUntil} día${daysUntil === 1 ? '' : 's'}`
                : `El evento fue hace ${Math.abs(daysUntil)} día${Math.abs(daysUntil) === 1 ? '' : 's'}`}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
              >
                <Navigation className="w-3.5 h-3.5" /> Cómo llegar
              </a>
            )}
            {gps.showInvitacionWeb && (
              <a
                href={invitacionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ver invitación
              </a>
            )}
            {gps.showMesaAsignada && guest.tableNumber && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black text-white backdrop-blur-sm"
                style={{ borderColor: `${accentColor}80`, background: `${accentColor}25` }}
              >
                <span>🪑</span>
                <span>Mesa <strong>{guest.tableNumber}</strong></span>
              </div>
            )}
          </div>

          {/* 📸 Red Social de la Fiesta Banner */}
          {gps.showMural !== false && (
            <motion.a
              href={`/evento/social/${fiestaId}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-5 w-full max-w-sm flex items-center gap-4 p-4 rounded-3xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white border border-white/10 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-120 transition-transform duration-500" />
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
                📷
              </div>
              <div className="text-left min-w-0">
                <p className="font-black text-sm uppercase tracking-wide font-headline">Red Social de la Fiesta</p>
                <p className="text-[11px] text-white/80 mt-0.5 leading-normal">
                  Chatea, pide canciones y sube fotos/videos en tiempo real.
                </p>
              </div>
              <span className="ml-auto text-lg shrink-0 font-bold">➔</span>
            </motion.a>
          )}

          {/* 🎉 Zona Digital AK */}
          <div className="mt-6 w-full max-w-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-300 mb-3">🎉 Zona Digital AK</p>
            <div className="grid grid-cols-2 gap-2">
              <a href={`/evento/fotocabina/${fiestaId}`} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:scale-105 transition-transform border border-white/10">
                <span className="text-2xl">📸</span>
                <span className="text-xs font-black uppercase tracking-wide text-center">Fotocabina</span>
              </a>
              <a href={`/evento/hub/${fiestaId}`} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg hover:scale-105 transition-transform border border-white/10">
                <span className="text-2xl">🌐</span>
                <span className="text-xs font-black uppercase tracking-wide text-center">Hub del Evento</span>
              </a>
              <a href={`/evento/social/${fiestaId}`} className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-500 text-white shadow-lg hover:scale-105 transition-transform border border-white/10 ${gps.showBuzon !== false ? '' : 'col-span-2 flex-row gap-2'}`}>
                <span className="text-2xl">📱</span>
                <span className={`${gps.showBuzon !== false ? 'text-xs' : 'text-sm'} font-black uppercase tracking-wide text-center`}>Red Social</span>
              </a>
              {gps.showBuzon !== false && (
                <a href={`/evento/buzon/${fiestaId}`} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg hover:scale-105 transition-transform border border-white/10">
                  <span className="text-2xl">🎙️</span>
                  <span className="text-xs font-black uppercase tracking-wide text-center">Buzón recuerdos</span>
                </a>
              )}
              {/* Barra Interactiva / Mini Quiosco */}
              <button onClick={() => setShowQuiosco(true)} className="col-span-2 flex items-center justify-center gap-3 p-3 mt-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform border border-white/20">
                <span className="text-2xl">🍸</span>
                <span className="text-sm font-black uppercase tracking-widest text-center">Quiosco de Tragos</span>
              </button>
            </div>
=======
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
>>>>>>> origin/main
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

<<<<<<< HEAD
      {/* ─── CARDS ─── */}
      <div className="w-full max-w-sm px-4 pb-6 space-y-0">

        {/* ── MI ASISTENCIA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
        <div
          className="ak-guest-pass p-5 space-y-3 mt-4"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mi Asistencia</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${rsvpBadge.bg} ${rsvpBadge.color}`}>
              {rsvpBadge.label}
            </div>
            {guest.rsvp !== 'Confirmado' && (
              <a
                href={`/invitacion/${fiestaId}/rsvp`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow transition"
              >
                ✍️ Responder asistencia →
              </a>
            )}
          </div>

          {guest.companionNames && guest.companionNames.length > 0 && (
            <div className="mt-2 text-xs text-zinc-300 bg-white/5 p-3 rounded-xl border border-white/5">
              <p className="text-zinc-400 font-semibold mb-1">Acompañantes registrados ({guest.companionNames.length}):</p>
              <p className="text-zinc-200">{guest.companionNames.join(', ')}</p>
            </div>
          )}

          {gps.showMesaAsignada && guest.tableNumber && (
            <div
              data-testid="guest-portal-table"
              className="flex items-center gap-3 mt-1"
            >
              <span className="text-xl">🪑</span>
              <div>
                <p className="text-xs text-zinc-400">Mesa asignada</p>
                <p className="text-lg font-black text-white">Mesa {guest.tableNumber}</p>
              </div>
            </div>
          )}
          {dietLabel && (
            <div
              data-testid="guest-portal-dietary"
              className="flex items-center gap-2 text-sm text-zinc-300"
            >
              <UtensilsCrossed className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>{dietLabel}</span>
              {guest.alergiasEspecificas && <span className="text-zinc-500">· {guest.alergiasEspecificas}</span>}
            </div>
          )}
          {guest.requiereAccesibilidad && (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span>♿</span> <span>Asistencia especial registrada</span>
            </div>
          )}
          {guest.mensaje && (
            <div
              data-testid="guest-portal-message"
              className="flex items-start gap-2 text-sm text-zinc-300 mt-1"
            >
              <Heart className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <p className="italic">&ldquo;{guest.mensaje}&rdquo;</p>
            </div>
          )}

          {/* QR de entrada — siempre visible cuando confirmado */}
          {gps.showCheckin && guest.rsvp === 'Confirmado' && (
            <div data-testid="guest-portal-qr" className="mt-3">
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}
              >
                <div className="px-5 pt-5 pb-3 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300 mb-1">🎫 Pase de Entrada</p>
                  <p className="text-xl font-black text-white">{guest.nombre}</p>
                  {guest.tableNumber && (
                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                      <span className="text-sm">🪑</span>
                      <span className="text-sm font-bold text-white">Mesa {guest.tableNumber}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-center pb-4 px-5">
                  <div className="bg-white p-4 rounded-2xl shadow-2xl">
                    <QRCodeStylized id="qr-guest-portal" value={qrValue} size={180} level="H" />
                  </div>
                </div>
                <div className="px-5 pb-2 text-center">
                  <p className="text-xs text-purple-300">Mostrá este código en la entrada del evento</p>
                </div>
                <div className="px-5 pb-5 flex justify-between items-center">
                  <p className="text-xs text-purple-400 font-medium">{config?.nombreEvento}</p>
                  <Button
                    onClick={downloadQR}
                    size="sm"
                    variant="ghost"
                    className="text-purple-300 hover:text-white hover:bg-white/10 rounded-xl text-xs gap-1.5"
                  >
                    <Download className="w-3 h-3" /> Guardar QR
                  </Button>
                </div>
              </div>
            </div>
          )}
          {gps.showCheckin && guest.rsvp !== 'Confirmado' && (
            <div data-testid="guest-portal-qr-pending" className="text-xs text-zinc-500 mt-1">
              Tu QR de entrada estará disponible una vez que confirmes tu asistencia.
            </div>
          )}

          {/* Botón cancelar asistencia */}
          {guest.rsvp === 'Confirmado' && fiesta.configuracion?.fechaEvento && (() => {
            const eventDate = new Date(fiesta.configuracion!.fechaEvento!);
            const cancelDeadline = new Date(eventDate);
            cancelDeadline.setDate(cancelDeadline.getDate() - 7);
            const canStillCancel = new Date() < cancelDeadline;
            const deadlineStr = cancelDeadline.toLocaleDateString('es-UY', { day: 'numeric', month: 'long' });
            return canStillCancel ? (
              <div className="mt-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                <p className="text-xs text-amber-400/80">
                  Podés cancelar tu asistencia hasta el <strong className="text-amber-400">{deadlineStr}</strong>
                </p>
                <a
                  href={`/invitacion/${fiestaId}/rsvp`}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold hover:text-amber-300 transition"
                >
                  Cancelar confirmación →
                </a>
              </div>
            ) : null;
          })()}
        </div>
        </motion.div>

        {/* Separador visual */}
        <div className="h-px mx-4 my-1" style={{ background: `linear-gradient(to right, transparent, ${accentColor}30, transparent)` }} />

        {/* ── DATOS DEL EVENTO ── */}
        {(config?.nombreLugar || fecha || dressCode?.tipo) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
          <div
            className="ak-guest-pass p-5 space-y-3 mt-4"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Datos del evento</p>
            {config?.nombreLugar && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{config.nombreLugar}</p>
                  {config?.direccionLugar && <p className="text-xs text-zinc-400">{config.direccionLugar}</p>}
                </div>
              </div>
            )}
            {fecha && (
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-zinc-400 shrink-0" />
                <p className="text-sm text-zinc-200 capitalize">{fecha}{hora ? ` · ${hora} hs` : ''}</p>
              </div>
            )}
            {dressCode && dressCode.tipo && dressCode.tipo !== 'casual' && (
              <div
                data-testid="guest-portal-dresscode"
                className="flex items-center gap-3"
              >
                <span className="text-lg">👗</span>
                <div>
                  <p className="text-xs text-zinc-400">Dress code</p>
                  <p className="text-sm font-semibold text-white capitalize">
                    {dressCode.tipo === 'personalizado' ? dressCode.textoPersonalizado : dressCode.tipo}
                    {dressCode.colorSugerido ? ` · ${dressCode.colorSugerido}` : ''}
                  </p>
                </div>
              </div>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold mt-1 hover:opacity-80 transition"
                style={{ color: accentColor }}
              >
                <Navigation className="w-4 h-4" /> Ver en Google Maps →
              </a>
            )}
            {guestExp?.showMenu !== false && (
              <button
                type="button"
                onClick={() => setShowMenuModal(true)}
                className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition mt-1 text-left"
                style={{ color: accentColor }}
              >
                🍽️ Ver menú del evento →
              </button>
            )}
          </div>
          </motion.div>
        )}

        {/* Separador visual */}
        <div className="h-px mx-4 my-1" style={{ background: `linear-gradient(to right, transparent, ${accentColor}30, transparent)` }} />

        {/* ── ACCESOS RÁPIDOS (grid 2x2) ── */}
        {(() => {
          const actions = [
            mapsUrl && { icon: '📍', label: 'Cómo llegar', href: mapsUrl, external: true },
            gps.showInvitacionWeb && { icon: '💌', label: 'Ver invitación', href: invitacionUrl, external: true },
            gps.showFotos && { icon: '📸', label: 'Subir foto', href: `/evento/social/${fiestaId}`, external: false },
            gps.showMusica && { icon: '🎵', label: 'Sugerir canción', href: `/evento/social/${fiestaId}`, external: false },
          ].filter(Boolean) as { icon: string; label: string; href: string; external: boolean }[];
          if (actions.length === 0) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-4"
            >
            <div className="grid grid-cols-2 gap-3">
              {actions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  target={action.external ? '_blank' : undefined}
                  rel={action.external ? 'noopener noreferrer' : undefined}
                  className="ak-guest-pass flex flex-col items-center justify-center gap-2 p-4 text-center text-sm font-semibold text-zinc-200 hover:bg-white/10 transition"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <span className="text-2xl">{action.icon}</span>
                  {action.label}
                </a>
              ))}
            </div>
            </motion.div>
          );
        })()}

        {/* ── CANCIONES SUGERIDAS (solo si hay datos) ── */}
        {gps.showMusica && guest.cancionesDJ && guest.cancionesDJ.length > 0 && (
          <div
            className="ak-guest-pass p-5"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Tus canciones sugeridas</p>
            <ul className="space-y-1.5">
              {guest.cancionesDJ.map((song, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-200">
                  <Music className="w-4 h-4 text-zinc-500 shrink-0" /> {song}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Separador visual */}
        <div className="h-px mx-4 my-1" style={{ background: `linear-gradient(to right, transparent, ${accentColor}30, transparent)` }} />

        {/* ── MURO SOCIAL ── */}
        {gps.showMural && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
          <div
            className="ak-guest-pass overflow-hidden mt-4"
            style={{ borderColor: `${accentColor}30` }}
          >
            <div className="p-4 flex items-center justify-between" style={{ background: `${accentColor}10` }}>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" style={{ color: accentColor }} />
                <div>
                  <p className="text-sm font-bold text-white">Muro Social en Vivo</p>
                  <p className="text-xs text-zinc-400">Subí tus fotos durante la fiesta</p>
                </div>
              </div>
            </div>

            <SocialPhotosPreview fiestaId={fiestaId} accentColor={accentColor} />

            <div className="p-4 space-y-3 bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl shrink-0">
                  <QRCodeStylized
                    value={`${baseUrl}/evento/social/${fiestaId}`}
                    size={64}
                    level="M"
                    id="qr-social-guest-portal"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-400 mb-1">Escaneá para entrar al muro</p>
                  <a
                    href={`/evento/social/${fiestaId}`}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white w-full justify-center transition"
                    style={{ backgroundColor: accentColor }}
                  >
                    📷 Abrir muro social →
                  </a>
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        )}

        {/* Separador visual */}
        <div className="h-px mx-4 my-1" style={{ background: `linear-gradient(to right, transparent, ${accentColor}30, transparent)` }} />

        {/* ── PROGRAMA DEL EVENTO (Bug 5: solo si hay datos reales) ── */}
        {hasPrograma && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
          <div
            className="ak-guest-pass p-5 mt-4"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Programa del evento
            </p>
            <ul className="space-y-2">
              {(fiesta.programa ?? []).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-xs font-mono text-zinc-500 pt-0.5 shrink-0 w-12">{item.hora}</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{item.titulo}</p>
                    {item.descripcion && <p className="text-xs text-zinc-400">{item.descripcion}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          </motion.div>
        )}

        {/* ── AK PRODUCCIONES (firma de lujo) ── */}
        {showAkCta && (
          <div
            data-testid="guest-portal-ak-cta"
            className="ak-guest-pass p-6 text-center space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">✨ Experiencia creada por</p>
              <p className="text-xl font-black text-white tracking-wide">AK PRODUCCIONES</p>
              <p className="text-xs text-zinc-500">Organización de eventos · Salto, Uruguay</p>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {guestExp?.ctaDescription || guestExp?.ctaText || 'Si te gustó esta experiencia, podés conocer más sobre cómo organizamos eventos completos e inolvidables.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {instagramUrl && guestExp?.showSocialCta !== false && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="guest-portal-cta-instagram"
                  onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedInstagram').catch(() => {})}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold hover:opacity-90 transition"
                >
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </a>
              )}
              {facebookUrl && guestExp?.showSocialCta !== false && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:opacity-90 transition"
                >
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </a>
              )}
              {tiktokUrl && guestExp?.showSocialCta !== false && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-600 text-white text-xs font-bold hover:opacity-90 transition"
                >
                  🎵 TikTok
                </a>
              )}
              {whatsappData && guestExp?.showSocialCta !== false && (
                <a
                  href={whatsappData}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="guest-portal-cta-whatsapp"
                  onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedWhatsapp').catch(() => {})}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:opacity-90 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
            {landingUrl && guestExp?.showLandingCta !== false && (
              <a
                href={trackedLandingUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="guest-portal-cta-landing"
                onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedLanding').catch(() => {})}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border transition hover:opacity-90"
                style={{ borderColor: `${accentColor}60`, background: `${accentColor}20`, color: accentColor }}
              >
                <Globe className="w-4 h-4" /> Quiero organizar mi evento →
              </a>
            )}
            {guestExp?.simulatorUrl && guestExp?.showBudgetSimulatorCta && (
              <a
                href={trackedSimulatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="guest-portal-cta-simulator"
                onClick={() => trackGuestCtaClick(fiestaId, guest.id, 'clickedSimulator').catch(() => {})}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-white hover:opacity-90 transition"
              >
                💰 Simular presupuesto
              </a>
            )}
          </div>
        )}

        <p className="text-xs text-zinc-600 text-center py-2">AK Producciones Eventos · Salto, Uruguay</p>
      </div>

      <AnimatePresence>
        {showQuiosco && <MiniQuiosco fiestaId={fiestaId} guest={guest} onClose={() => setShowQuiosco(false)} />}
        {showMenuModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenuModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-10 text-left overflow-y-auto max-h-[85vh] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <h3 className="font-black text-lg text-white">Menú del Evento</h3>
                    <p className="text-xs text-zinc-400">{config?.nombreEvento}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {fiesta.menuMesa ? (
                <div className="space-y-3">
                  {fiesta.menuMesa.entrada && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Entrada</p>
                      <p className="text-sm text-zinc-200">{fiesta.menuMesa.entrada}</p>
                    </div>
                  )}
                  {fiesta.menuMesa.platoPrincipal && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Plato Principal</p>
                      <p className="text-sm text-zinc-200">{fiesta.menuMesa.platoPrincipal}</p>
                    </div>
                  )}
                  {fiesta.menuMesa.adolescentes && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Menú Jóvenes / Niños</p>
                      <p className="text-sm text-zinc-200">{fiesta.menuMesa.adolescentes}</p>
                    </div>
                  )}
                  {fiesta.menuMesa.postres && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Postre & Mesa Dulce</p>
                      <p className="text-sm text-zinc-200">{fiesta.menuMesa.postres}</p>
                    </div>
                  )}
                  {fiesta.menuMesa.bebidas && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Bebidas & Barra</p>
                      <p className="text-sm text-zinc-200">{fiesta.menuMesa.bebidas}</p>
                    </div>
                  )}
                </div>
              ) : fiesta.menuSeleccionPortal && (fiesta.menuSeleccionPortal.entrada || fiesta.menuSeleccionPortal.principal) ? (
                <div className="space-y-3">
                  {fiesta.menuSeleccionPortal.entrada && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Entrada</p>
                      <p className="text-sm text-zinc-200">{fiesta.menuSeleccionPortal.entrada}</p>
                    </div>
                  )}
                  {fiesta.menuSeleccionPortal.principal && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Plato Principal</p>
                      <p className="text-sm text-zinc-200">{fiesta.menuSeleccionPortal.principal}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-400 text-sm space-y-1">
                  <p>El menú gastronómico está coordinado por la cocina del evento.</p>
                  <p className="text-xs text-zinc-500">Si tenés restricciones especiales, podés indicarlas en tu asistencia.</p>
                </div>
              )}

              {dietLabel && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <span>✓</span>
                  <span>Tu preferencia registrada: <strong>{dietLabel}</strong></span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav aria-label="Navegacion del invitado" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          <a href="#mi-pase" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-600"><TicketCheck className="h-5 w-5" />Mi pase</a>
          <a href={hubHref} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-black" style={{ color: accentColor }}><Home className="h-5 w-5" />Hub</a>
          <a href="#datos-evento" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-600"><MapPin className="h-5 w-5" />Evento</a>
        </div>
      </nav>
    </main>
  );
}

export default function GuestPortalPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}><GuestPortalContent /></Suspense>;
}
