'use client';

/**
 * Portal del Invitado — vista persistente donde el invitado puede ver:
 * - su QR de entrada
 * - mesa asignada
 * - ubicación del evento
 * - dress code
 * - restricción alimentaria
 * - canciones sugeridas
 * - dedicatoria/mensaje
 * - CTA AK Producciones
 * - links a redes e Instagram
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import { Button } from '@/components/ui/button';
import QRCodeStylized from 'qrcode.react';

const DIETARY_LABELS: Record<string, string> = {
  Ninguna: '',
  Celiaco: '🌾 Menú sin gluten',
  Vegetariano: '🥗 Menú vegetariano',
  Vegano: '🌱 Menú vegano',
  Otro: '⚠️ Menú especial',
};

function GuestPortalContent() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const guestId = params.guestId as string;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [guest, setGuest] = useState<Invitado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId || !guestId) {
      setLoadError('Enlace inválido.');
      setIsLoading(false);
      return;
    }
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error('Evento no encontrado.');
      setFiesta(data);
      const found = (data.invitados ?? []).find((i: Invitado) => i.id === guestId);
      if (!found) throw new Error('Invitado no encontrado.');
      setGuest(found);
    } catch (e: any) {
      setLoadError(e.message || 'No se pudo cargar tu información.');
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (loadError || !fiesta || !guest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-xl font-semibold text-slate-800">{loadError || 'No se pudo cargar tu información.'}</p>
      </div>
    );
  }

  const config = fiesta.configuracion;
  const guestExp = fiesta.guestExperienceSettings;
  const showAkCta = guestExp?.enabled && guestExp?.showAkBranding;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app-ak.vercel.app';
  const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&guestId=${guest.id}`;

  const fecha = config?.fechaEvento
    ? new Date(config.fechaEvento).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const hora = config?.horaInicio;
  const dressCode = fiesta.invitacionConfig?.dressCode;
  const dietLabel = guest.dietaryRestriction && guest.dietaryRestriction !== 'Ninguna'
    ? (DIETARY_LABELS[guest.dietaryRestriction] || guest.dietaryRestriction)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center py-10 px-4 gap-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tu pase digital</p>
        <h1 className="text-2xl font-black text-slate-900">{config?.nombreEvento}</h1>
        <p className="text-base font-semibold text-slate-600">Hola, <strong>{guest.nombre}</strong> 👋</p>
      </div>

      {/* QR */}
      {guest.rsvp === 'Confirmado' && (
        <div
          data-testid="guest-portal-qr"
          className="w-full max-w-xs bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 flex flex-col items-center gap-4"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Pase de entrada</p>
          <QRCodeStylized id="qr-guest-portal" value={qrValue} size={200} level="H" />
          <p className="text-xs text-slate-400 text-center">
            Mostrá este QR en la entrada del evento.<br />
            Lo podés descargar y guardarlo en tu galería.
          </p>
          <Button onClick={downloadQR} variant="outline" className="w-full rounded-xl">
            <Download className="w-4 h-4 mr-2" /> Descargar QR
          </Button>
        </div>
      )}

      {/* Event Details */}
      <div className="w-full max-w-xs space-y-3">
        {/* Mesa */}
        {guest.tableNumber && (
          <div
            data-testid="guest-portal-table"
            className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-2xl p-4"
          >
            <span className="text-2xl">🪑</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-500">Mesa asignada</p>
              <p className="text-xl font-black text-purple-800">Mesa {guest.tableNumber}</p>
            </div>
          </div>
        )}

        {/* Lugar y fecha */}
        {(config?.nombreLugar || fecha) && (
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              {config?.nombreLugar && <p className="font-semibold text-slate-800">{config.nombreLugar}</p>}
              {config?.direccionLugar && <p className="text-xs text-slate-500">{config.direccionLugar}</p>}
              {fecha && (
                <div className="flex items-center gap-1 mt-1">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-500 capitalize">{fecha}{hora ? ` — ${hora} hs` : ''}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dress Code */}
        {dressCode && dressCode.tipo && dressCode.tipo !== 'casual' && (
          <div
            data-testid="guest-portal-dresscode"
            className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4"
          >
            <span className="text-2xl">👗</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-rose-500">Dress code</p>
              <p className="font-semibold text-rose-800 capitalize">
                {dressCode.tipo === 'personalizado' ? dressCode.textoPersonalizado : dressCode.tipo}
              </p>
              {dressCode.colorSugerido && (
                <p className="text-xs text-rose-600">Color sugerido: {dressCode.colorSugerido}</p>
              )}
            </div>
          </div>
        )}

        {/* Restricción alimentaria */}
        {dietLabel && (
          <div
            data-testid="guest-portal-dietary"
            className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4"
          >
            <UtensilsCrossed className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Menú especial</p>
              <p className="font-semibold text-amber-800">{dietLabel}</p>
              {guest.alergiasEspecificas && (
                <p className="text-xs text-amber-600 mt-0.5">{guest.alergiasEspecificas}</p>
              )}
            </div>
          </div>
        )}

        {/* Accesibilidad */}
        {guest.requiereAccesibilidad && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <span className="text-2xl">♿</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Accesibilidad</p>
              <p className="font-semibold text-blue-800">Asistencia especial registrada</p>
            </div>
          </div>
        )}

        {/* Canciones sugeridas */}
        {guest.cancionesDJ && guest.cancionesDJ.length > 0 && (
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <Music className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">Tus canciones sugeridas</p>
              <ul className="space-y-0.5">
                {guest.cancionesDJ.map((song, i) => (
                  <li key={i} className="text-sm text-indigo-800 font-medium">🎵 {song}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Dedicatoria / mensaje */}
        {guest.mensaje && (
          <div className="flex items-start gap-3 bg-pink-50 border border-pink-100 rounded-2xl p-4">
            <Heart className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-1">Tu dedicatoria</p>
              <p className="text-sm text-pink-800 italic">&ldquo;{guest.mensaje}&rdquo;</p>
            </div>
          </div>
        )}
      </div>

      {/* AK Producciones CTA */}
      {showAkCta && (
        <div
          data-testid="guest-portal-ak-cta"
          className="w-full max-w-xs rounded-3xl border border-purple-100 bg-white shadow-lg p-6 text-center space-y-3"
        >
          <p className="text-xs font-black uppercase tracking-widest text-purple-500">
            ✨ AK Producciones Eventos
          </p>
          <p className="text-sm font-semibold text-slate-700">
            {guestExp?.ctaTitle || '¿Te gustó esta experiencia?'}
          </p>
          <p className="text-xs text-slate-500">
            {guestExp?.ctaDescription || guestExp?.ctaText || 'Organizamos tu próximo evento con la misma dedicación y amor por los detalles.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {guestExp?.instagramUrl && (
              <a
                href={guestExp.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="guest-portal-cta-instagram"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </a>
            )}
            {guestExp?.whatsappNumber && (
              <a
                href={`https://wa.me/${guestExp.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="guest-portal-cta-whatsapp"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {guestExp?.landingUrl && guestExp?.showLandingCta && (
              <a
                href={guestExp.landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="guest-portal-cta-landing"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ver servicios
              </a>
            )}
            {guestExp?.simulatorUrl && guestExp?.showBudgetSimulatorCta && (
              <a
                href={guestExp.simulatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="guest-portal-cta-simulator"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                💰 Simular presupuesto
              </a>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-300 text-center mt-2">AK Producciones Eventos · Salto, Uruguay</p>
    </div>
  );
}

export default function GuestPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    }>
      <GuestPortalContent />
    </Suspense>
  );
}
