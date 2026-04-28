'use client';

/**
 * Portal del Invitado — experiencia VIP de lujo.
 * Muestra al invitado: datos del evento, su asistencia, QR (colapsable),
 * accesos rápidos, programa, galería y bloque AK Producciones.
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Loader2,
  AlertTriangle,
  MapPin,
  CalendarDays,
  Download,
  Instagram,
  MessageCircle,
  ExternalLink,
  Music,
  UtensilsCrossed,
  Heart,
  Navigation,
  Globe,
  Camera,
  Clock,
  Facebook,
} from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getSocialConnections } from '@/app/actions/social-connections';
import { trackGuestCtaClick } from '@/app/actions/fiesta/invitados.actions';
import type { FiestaEnPlanificacion, Invitado, GuestPortalSettings } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { Button } from '@/components/ui/button';
import QRCodeStylized from 'qrcode.react';

const DIETARY_LABELS: Record<string, string> = {
  Ninguna: '',
  Celiaco: '🌾 Menú sin gluten',
  Vegetariano: '🥗 Menú vegetariano',
  Vegano: '🌱 Menú vegano',
  Otro: '⚠️ Menú especial',
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

/** Calcula días hasta el evento. Negativo = ya pasó. null = sin fecha. */
function getDaysUntil(fechaEvento?: string): number | null {
  if (!fechaEvento) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(fechaEvento);
  event.setHours(0, 0, 0, 0);
  return Math.round((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Extrae el URL de una plataforma de la lista de conexiones sociales */
function getSocialUrl(connections: SocialConnection[], platform: string): string | undefined {
  return connections.find(c => c.platform === platform && c.isConnected)?.profileUrl;
}

/** Preview de las últimas fotos del muro social — carga lazy */
function SocialPhotosPreview({ fiestaId, accentColor }: { fiestaId: string; accentColor: string }) {
  const [photos, setPhotos] = useState<{ id: string; imageUrl: string; authorName: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import('@/app/actions/social-gallery').then(({ getSocialPosts }) => {
      getSocialPosts(fiestaId).then(posts => {
        setPhotos(
          posts.slice(0, 6).map(p => ({ id: p.id, imageUrl: p.imageUrl, authorName: p.authorName ?? '' }))
        );
        setLoaded(true);
      }).catch(() => setLoaded(true));
    });
  }, [fiestaId]);

  if (!loaded) return null;
  if (photos.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-zinc-500">
        Sé el primero en subir una foto 📸
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 p-0.5">
      {photos.map(photo => (
        <div key={photo.id} className="aspect-square overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={`Foto compartida por ${photo.authorName}`}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

function GuestPortalContent() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const guestId = params.guestId as string;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [guest, setGuest] = useState<Invitado | null>(null);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId || !guestId) {
      setLoadError('Enlace inválido.');
      setIsLoading(false);
      return;
    }
    try {
      const [data, connections] = await Promise.all([
        getFiestaById(fiestaId),
        getSocialConnections().catch((err) => {
          console.error('[GuestPortal] Failed to load social connections:', err);
          return [] as SocialConnection[];
        }),
      ]);
      if (!data) throw new Error('Evento no encontrado.');
      setFiesta(data);
      setSocialConnections(connections);
      const found = (data.invitados ?? []).find((i: Invitado) => i.id === guestId);
      if (!found) throw new Error('Invitado no encontrado.');
      setGuest(found);
    } catch (e: unknown) {
      setLoadError((e instanceof Error ? e.message : null) || 'No se pudo cargar tu información.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, guestId]);

  useEffect(() => { loadData(); }, [loadData]);

  const downloadQR = () => {
    const canvas = document.getElementById('qr-guest-portal') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-Entrada-${guest?.nombre ?? 'invitado'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="w-12 h-12 animate-spin text-amber-400" />
      </div>
    );
  }

  if (loadError || !fiesta || !guest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-zinc-950">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-xl font-semibold text-white">{loadError || 'No se pudo cargar tu información.'}</p>
        <p className="text-sm text-zinc-400 mt-2">Verificá el enlace o contactá al organizador.</p>
      </div>
    );
  }

  const config = fiesta.configuracion;
  const guestExp = fiesta.guestExperienceSettings;
  const gps: GuestPortalSettings = { ...DEFAULT_GPS, ...(fiesta.guestPortalSettings ?? {}) };

  // Bug 1: solo bloquear si allowGuestPortal está EXPLÍCITAMENTE en false
  if (guestExp?.allowGuestPortal === false) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center gap-6">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-bold text-white">El Portal del Invitado todavía no está habilitado.</h2>
        <p className="text-sm text-zinc-400">El organizador activará tu pase próximamente.<br />Intentá nuevamente más tarde.</p>
      </div>
    );
  }

  // Bug 2: usar social connections globales como fuente primaria, guestExp como override
  const instagramUrl = guestExp?.instagramUrl || getSocialUrl(socialConnections, 'Instagram');
  const facebookUrl = guestExp?.facebookUrl || getSocialUrl(socialConnections, 'Facebook');
  const tiktokUrl = guestExp?.tiktokUrl || getSocialUrl(socialConnections, 'TikTok');
  const whatsappData = (() => {
    if (guestExp?.whatsappUrl) return guestExp.whatsappUrl;
    if (guestExp?.whatsappNumber) return `https://wa.me/${guestExp.whatsappNumber.replace(/\D/g, '')}`;
    const waConn = socialConnections.find(c => c.platform === 'WhatsApp' && c.isConnected);
    if (waConn?.profileUrl) return waConn.profileUrl;
    if (waConn?.phoneNumber) return `https://wa.me/${waConn.phoneNumber}`;
    return undefined;
  })();
  const landingUrl = guestExp?.landingUrl;

  const showAkCta = guestExp?.enabled !== false && guestExp?.showAkBranding !== false;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app-ak.vercel.app';
  const accessParam = guest.guestAccessToken
    ? `token=${guest.guestAccessToken}&guestId=${guest.id}`
    : `guestId=${guest.id}`;
  const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&${accessParam}`;

  // Bug 3: URL real de la invitación
  const invitacionUrl = fiesta.invitacionSlug
    ? `/i/${fiesta.invitacionSlug}`
    : `/invitacion/${fiestaId}`;

  const fecha = config?.fechaEvento
    ? new Date(config.fechaEvento).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const hora = config?.horaInicio;
  const dressCode = fiesta.invitacionConfig?.dressCode;
  const dietLabel = guest.dietaryRestriction && guest.dietaryRestriction !== 'Ninguna'
    ? (DIETARY_LABELS[guest.dietaryRestriction] || guest.dietaryRestriction)
    : null;
  const mapsUrl = config?.direccionLugar
    ? `https://maps.google.com/?q=${encodeURIComponent(config.direccionLugar)}`
    : null;

  // Cuenta regresiva
  const daysUntil = getDaysUntil(config?.fechaEvento);

  // Color acento del evento o dorado por defecto
  const accentColor = gps.customAccentColor || fiesta.invitacionConfig?.colorPrincipal || config?.primaryColor || '#d4af37';

  // Imagen de fondo del hero: portal cover has priority, then invitation cover
  const heroImage = gps.coverImageUrl || fiesta.invitacionConfig?.fotoPortada;

  // Programa real (Bug 5)
  const hasPrograma = gps.showItinerario && fiesta.programa && fiesta.programa.length > 0;

  // RSVP status
  const rsvpStatus = guest.rsvp;
  const rsvpBadge = rsvpStatus === 'Confirmado'
    ? { label: 'Confirmada ✓', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' }
    : rsvpStatus === 'Rechazado'
    ? { label: 'Cancelada ✗', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' }
    : { label: 'Pendiente de confirmación', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' };

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col items-center" style={{ backgroundColor: gps.customBgColor || '#09090b' }}>

      {/* ─── HERO ─── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: '340px' }}>
        {heroImage ? (
          <img
            src={heroImage}
            alt={config?.nombreEvento || 'Evento'}
            className="absolute inset-0 w-full h-full object-cover"
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
        </div>
      </div>

      {/* ─── CARDS ─── */}
      <div className="w-full max-w-sm px-4 pb-6 space-y-0">

        {/* ── MI ASISTENCIA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
        <div
          className="rounded-2xl border p-5 space-y-3 mt-4"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mi Asistencia</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${rsvpBadge.bg} ${rsvpBadge.color}`}>
            {rsvpBadge.label}
          </div>
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
            className="rounded-2xl border p-5 space-y-3 mt-4"
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
              <a
                href={`/portal-cliente/${fiestaId}/menu`}
                className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition mt-1"
                style={{ color: accentColor }}
              >
                🍽️ Ver menú del evento →
              </a>
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
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center text-sm font-semibold text-zinc-200 hover:bg-white/10 transition"
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
            className="rounded-2xl border p-5"
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
            className="rounded-2xl border overflow-hidden mt-4"
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
            className="rounded-2xl border p-5 mt-4"
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
            className="rounded-2xl border p-6 text-center space-y-4"
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
                href={landingUrl}
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
                href={guestExp.simulatorUrl}
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
    </div>
  );
}

export default function GuestPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
      </div>
    }>
      <GuestPortalContent />
    </Suspense>
  );
}
