'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Gift, Zap } from 'lucide-react';
import { PromoCountdown } from './PromoCountdown';
import { cn } from '@/lib/utils';
import type { PromoActiva } from '@/types/promo';

interface PromoWidgetProps {
  promo: PromoActiva;
}

const DISMISSED_KEY = 'ak_promo_dismissed';

/** Allow only https://, http://, and relative (/) URLs to prevent open redirects/XSS */
function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return '';
}

interface PromoWidgetProps {
  promo: PromoActiva;
}

const DISMISSED_KEY = 'ak_promo_dismissed';

export function PromoWidget({ promo }: PromoWidgetProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user already dismissed this promo
    try {
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
      if (!dismissed.includes(promo.id)) {
        // Small delay so page loads first
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(true);
    }
  }, [promo.id]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
      if (!dismissed.includes(promo.id)) {
        dismissed.push(promo.id);
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
      }
    } catch { /* ignore */ }
  };

  const waNumber = '59899123456';
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(promo.whatsappMensaje)}`;
  const rawCtaUrl = promo.ctaUrl ? sanitizeUrl(promo.ctaUrl) : '';
  const ctaHref = rawCtaUrl || waHref;

  const gradientStyle = promo.colorFondo
    ? { background: promo.colorFondo }
    : undefined;

  if (!mounted || !visible) return null;

  // ── BANNER TOP ──────────────────────────────────────────────────────────
  if (promo.posicion === 'banner-top') {
    return (
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3',
          'bg-gradient-to-r from-purple-700 via-fuchsia-700 to-indigo-700',
          'shadow-lg transition-all duration-500',
          visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
        style={gradientStyle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Zap className="w-5 h-5 text-yellow-300 shrink-0 animate-pulse" />
          <div className="min-w-0 flex-1">
            <p className="text-white font-black text-sm truncate">
              {promo.titulo} — <span className="text-yellow-300">{promo.regalo}</span>
            </p>
            {promo.subtitulo && (
              <p className="text-white/70 text-xs hidden sm:block">{promo.subtitulo}</p>
            )}
          </div>
          {promo.mostrarCountdown && (
            <div className="hidden sm:block shrink-0">
              <PromoCountdown fechaFin={promo.fechaFin} compact />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all hover:scale-105"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {promo.ctaTexto}
          </a>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors p-1 rounded"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── FLOATING BOTTOM ─────────────────────────────────────────────────────
  if (promo.posicion === 'floating-bottom') {
    return (
      <div
        className={cn(
          'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[420px] z-50',
          'rounded-2xl shadow-2xl overflow-hidden',
          'transition-all duration-500',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        )}
      >
        <div
          className="bg-gradient-to-br from-purple-700 via-fuchsia-700 to-indigo-700 p-4"
          style={gradientStyle}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-tight">{promo.titulo}</p>
                {promo.subtitulo && (
                  <p className="text-white/70 text-xs">{promo.subtitulo}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white transition-colors p-1 rounded shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {promo.regalo && (
            <p className="text-yellow-300 font-black text-sm mb-3">🎁 {promo.regalo}</p>
          )}

          {promo.mostrarCountdown && (
            <div className="mb-3">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">⏱ Termina en:</p>
              <PromoCountdown fechaFin={promo.fechaFin} compact />
            </div>
          )}

          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-sm uppercase tracking-widest py-2.5 rounded-xl transition-all hover:scale-105"
          >
            <MessageSquare className="w-4 h-4" />
            {promo.ctaTexto}
          </a>
        </div>
      </div>
    );
  }

  // ── POPUP CENTER ─────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-sm',
        'transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={(e) => e.target === e.currentTarget && handleDismiss()}
    >
      <div
        className={cn(
          'relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl',
          'transition-all duration-500',
          visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
      >
        {/* Background */}
        <div
          className="bg-gradient-to-br from-purple-700 via-fuchsia-700 to-indigo-700 p-8"
          style={gradientStyle}
        >
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <Gift className="w-8 h-8 text-yellow-300" />
            </div>
          </div>

          <h2 className="text-white font-black text-2xl text-center mb-1">{promo.titulo}</h2>
          {promo.subtitulo && (
            <p className="text-white/70 text-sm text-center mb-4">{promo.subtitulo}</p>
          )}

          {promo.descripcion && (
            <p className="text-white/80 text-sm text-center mb-4">{promo.descripcion}</p>
          )}

          {promo.regalo && (
            <div className="bg-white/10 rounded-2xl p-3 text-center mb-4">
              <p className="text-yellow-300 font-black">🎁 {promo.regalo}</p>
            </div>
          )}

          {promo.mostrarCountdown && (
            <div className="mb-6">
              <p className="text-white/60 text-xs uppercase tracking-widest text-center mb-2">
                ⏱ Oferta termina en:
              </p>
              <PromoCountdown fechaFin={promo.fechaFin} />
            </div>
          )}

          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-base uppercase tracking-widest py-3 rounded-2xl transition-all hover:scale-105 shadow-xl"
          >
            <MessageSquare className="w-5 h-5" />
            {promo.ctaTexto}
          </a>

          <button
            onClick={handleDismiss}
            className="w-full text-white/40 hover:text-white/60 text-xs text-center mt-3 transition-colors"
          >
            Cerrar, gracias
          </button>
        </div>
      </div>
    </div>
  );
}
