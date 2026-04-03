'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { use } from 'react';
import { MessageSquare, Check, Star, ExternalLink, Facebook, Instagram, Music, Loader2 } from 'lucide-react';
import { getPromoPageBySlug, getLandingPageSettings } from '@/app/actions/landing';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { PromoLandingPage } from '@/types/landing';
import { cn } from '@/lib/utils';
import { defaultLandingPageSettings } from '@/types/landing';

// ─── Fallback social links ─────────────────────────────────────────────────

const FALLBACK_SOCIAL = [
  { platform: 'Instagram', profileUrl: 'https://instagram.com/akproduccioneseventos', icon: Instagram, bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400' },
  { platform: 'Facebook', profileUrl: 'https://facebook.com/akproduccioneseventos', icon: Facebook, bgClass: 'bg-[#1877F2]' },
  { platform: 'WhatsApp', profileUrl: 'https://wa.me/59899123456', icon: MessageSquare, bgClass: 'bg-[#25D366]' },
  { platform: 'TikTok', profileUrl: 'https://tiktok.com/@akproduccioneseventos', icon: Music, bgClass: 'bg-black' },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PromoLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [page, setPage] = useState<PromoLandingPage | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState(defaultLandingPageSettings.whatsappNumber);
  const [loading, setLoading] = useState(true);
  const [socialLinks, setSocialLinks] = useState(FALLBACK_SOCIAL);

  useEffect(() => {
    Promise.all([
      getPromoPageBySlug(slug),
      getLandingPageSettings(),
      getSocialConnections(),
    ]).then(([p, landingSettings, connections]) => {
      setPage(p);
      setWhatsappNumber(landingSettings.whatsappNumber || defaultLandingPageSettings.whatsappNumber);
      if (connections.length > 0) {
        const merged = FALLBACK_SOCIAL.map((fallback) => {
          const conn = connections.find(
            (c) => c.platform === fallback.platform && c.isConnected && c.profileUrl
          );
          return conn && conn.profileUrl ? { ...fallback, profileUrl: conn.profileUrl } : fallback;
        });
        setSocialLinks(merged);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Loader2 className="w-10 h-10 text-purple-300 animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white px-6 text-center">
        <div className="relative w-16 h-16">
          <Image src="/logo_ak_producciones.png" alt="AK Producciones" fill className="object-contain" sizes="64px" />
        </div>
        <h1 className="text-3xl font-headline">Página no encontrada</h1>
        <p className="text-slate-400 text-sm">Esta promoción ya no está disponible.</p>
        <a
          href="/empresa/landing"
          className="mt-4 h-12 rounded-2xl px-6 bg-primary text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          Ver página principal
        </a>
      </div>
    );
  }

  const accent = page.accentColor || '#9333ea';
  const waMessage = page.ctaWhatsAppMessage || `¡Hola! Vi la promoción "${page.title}" y me gustaría consultar.`;
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="min-h-screen bg-white font-body">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden"
        style={{
          background: page.heroImageUrl
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(${page.heroImageUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, #0f0c29, #302b63, #24243e)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-20 max-w-2xl mx-auto">
          <div className="relative w-16 h-16 drop-shadow-[0_4px_20px_rgba(255,255,255,0.2)]">
            <Image src="/logo_ak_producciones.png" alt="AK Producciones" fill className="object-contain" sizes="64px" priority />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-white/60">
              AK Producciones · Oferta Especial
            </p>
            <h1 className="text-4xl sm:text-5xl font-headline text-white leading-tight">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-lg sm:text-xl font-dancing text-white/80">{page.subtitle}</p>
            )}
            {page.description && (
              <p className="text-sm text-white/70 max-w-lg mx-auto leading-relaxed">{page.description}</p>
            )}
          </div>
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <button
              className="h-14 rounded-2xl px-8 text-white font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ backgroundColor: accent }}
            >
              <MessageSquare className="w-5 h-5" />
              Consultar Ahora
            </button>
          </a>
        </div>
      </section>

      {/* ─── Packages ─────────────────────────────────────────────────────── */}
      {page.packages && page.packages.length > 0 && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: accent }}>
                Nuestras opciones
              </p>
              <h2 className="text-3xl sm:text-4xl font-headline text-slate-900">
                Elegí tu paquete
              </h2>
            </div>
            <div className={cn(
              'grid gap-6',
              page.packages.length === 1 ? 'max-w-sm mx-auto' :
              page.packages.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' :
              'sm:grid-cols-2 lg:grid-cols-3'
            )}>
              {page.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn(
                    'rounded-3xl border-2 p-8 flex flex-col gap-5 transition-all duration-300',
                    pkg.isHighlighted
                      ? 'shadow-2xl relative overflow-hidden'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
                  )}
                  style={pkg.isHighlighted ? { borderColor: accent, backgroundColor: 'white' } : {}}
                >
                  {pkg.isHighlighted && (
                    <div
                      className="absolute top-0 inset-x-0 py-2 text-center text-xs font-black uppercase tracking-widest text-white"
                      style={{ backgroundColor: accent }}
                    >
                      ⭐ Más popular
                    </div>
                  )}
                  <div className={cn('space-y-1', pkg.isHighlighted && 'mt-6')}>
                    <h3 className="text-xl font-headline font-bold text-slate-900">{pkg.name}</h3>
                    {pkg.description && <p className="text-sm text-slate-500">{pkg.description}</p>}
                  </div>
                  {pkg.price && (
                    <div className="border-y border-slate-100 py-4">
                      <p className="text-2xl font-black text-slate-900">{pkg.price}</p>
                    </div>
                  )}
                  <ul className="space-y-2 flex-1">
                    {pkg.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                        <Check
                          className="w-4 h-4 mt-0.5 shrink-0"
                          style={{ color: accent }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="block">
                    <button
                      className={cn(
                        'w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95',
                        pkg.isHighlighted ? 'text-white shadow-lg' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                      )}
                      style={pkg.isHighlighted ? { backgroundColor: accent } : {}}
                    >
                      Consultar
                    </button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ background: `linear-gradient(135deg, #0f0c29, #302b63, #24243e)` }}
      >
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h2 className="text-3xl font-headline text-white">
              ¡No te pierdas esta oportunidad!
            </h2>
            <p className="text-slate-400 text-sm">
              Contactanos ahora y asegurá tu fecha antes de que se agoten los cupos.
            </p>
          </div>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="block">
            <button className="w-full max-w-xs mx-auto h-16 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-base uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse hover:animate-none">
              <MessageSquare className="w-6 h-6 shrink-0" />
              Reservar por WhatsApp
            </button>
          </a>
          <a
            href="/empresa/landing"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Ver todos nuestros servicios
          </a>

          <div className="flex flex-col items-center gap-3 pt-4 border-t border-white/10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">
              Seguinos en redes
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ platform, profileUrl, icon: Icon, bgClass }) => (
                <a
                  key={platform}
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={platform}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-white',
                    'transition-all duration-300 hover:scale-125',
                    bgClass
                  )}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-6 px-6 bg-slate-950 flex flex-col items-center gap-2 border-t border-slate-800">
        <div className="relative w-10 h-10">
          <Image src="/logo_ak_producciones.png" alt="AK Producciones" fill className="object-contain" sizes="40px" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
          © {new Date().getFullYear()} AK Producciones Eventos · Salto, Uruguay
        </p>
      </footer>
    </div>
  );
}
