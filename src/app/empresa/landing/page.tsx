'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Music2, Palette, UtensilsCrossed, Camera, Sparkles, ClipboardList,
  MessageSquare, ChevronDown, Star, Play, ExternalLink, BookOpen,
  Maximize2, X, ChevronLeft, ChevronRight, Facebook, Instagram, Music,
} from 'lucide-react';
import { getLandingPageSettings } from '@/app/actions/landing';
import { getTestimonials } from '@/app/actions/feedback';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { LandingPageSettings, GalleryItem } from '@/types/landing';
import type { Testimonial } from '@/types/feedback';
import { cn } from '@/lib/utils';
import { defaultLandingPageSettings } from '@/types/landing';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Music2,
  Palette,
  UtensilsCrossed,
  Camera,
  Sparkles,
  ClipboardList,
};

function getEmbedUrl(url: string): string {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

function getYoutubeThumbnail(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return '';
}

const FALLBACK_SOCIAL = [
  { platform: 'Instagram', profileUrl: 'https://instagram.com/akproduccioneseventos', icon: Instagram, bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400' },
  { platform: 'Facebook', profileUrl: 'https://facebook.com/akproduccioneseventos', icon: Facebook, bgClass: 'bg-[#1877F2]' },
  { platform: 'WhatsApp', profileUrl: 'https://wa.me/59899123456', icon: MessageSquare, bgClass: 'bg-[#25D366]' },
  { platform: 'TikTok', profileUrl: 'https://tiktok.com/@akproduccioneseventos', icon: Music, bgClass: 'bg-black' },
];

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ items, initialIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const item = items[current];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((i) => (i + 1) % items.length);
      if (e.key === 'ArrowLeft') setCurrent((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-8 h-8" />
      </button>
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((i) => (i - 1 + items.length) % items.length); }}
            className="absolute left-4 text-white/70 hover:text-white transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((i) => (i + 1) % items.length); }}
            className="absolute right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}
      <div
        className="max-w-4xl w-full mx-16"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'video' ? (
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              src={getEmbedUrl(item.url)}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={item.caption || 'Video'}
            />
          </div>
        ) : (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl">
            <Image src={item.url} alt={item.caption || 'Foto'} fill className="object-contain" />
          </div>
        )}
        {item.caption && (
          <p className="text-white/80 text-center mt-3 text-sm font-medium">{item.caption}</p>
        )}
      </div>
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex-shrink-0 w-80 bg-white rounded-3xl shadow-lg p-6 flex flex-col gap-4 border border-purple-50">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <blockquote className="text-slate-600 text-sm leading-relaxed flex-1 italic">
        &quot;{testimonial.testimonialText}&quot;
      </blockquote>
      <p className="text-sm font-bold text-slate-800">
        — {testimonial.clientName}
        {testimonial.fiestaNombre && (
          <span className="font-normal text-slate-400"> · {testimonial.fiestaNombre}</span>
        )}
      </p>
    </div>
  );
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const thumbnail = item.type === 'video' ? getYoutubeThumbnail(item.url) : item.url;

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={item.caption || ''}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
          <Camera className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        {item.type === 'video' && (
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-slate-800 ml-1" fill="currentColor" />
          </div>
        )}
        {item.type === 'photo' && (
          <Maximize2 className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>
      {item.caption && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white text-xs font-medium truncate">{item.caption}</p>
        </div>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicLandingPage() {
  const [settings, setSettings] = useState<LandingPageSettings>(defaultLandingPageSettings);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [socialLinks, setSocialLinks] = useState(FALLBACK_SOCIAL);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [catalogFullscreen, setCatalogFullscreen] = useState(false);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      getLandingPageSettings(),
      getTestimonials(),
      getSocialConnections(),
    ]).then(([s, t, connections]) => {
      setSettings(s);
      setTestimonials(t.filter((item) => item.isApproved));
      if (connections.length > 0) {
        const merged = FALLBACK_SOCIAL.map((fallback) => {
          const conn = connections.find(
            (c) => c.platform === fallback.platform && c.isConnected && c.profileUrl
          );
          return conn ? { ...fallback, profileUrl: conn.profileUrl! } : fallback;
        });
        setSocialLinks(merged);
      }
    });
  }, []);

  const waHref = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    '¡Hola AK Producciones! Vi su página y me gustaría consultar sobre mis eventos.'
  )}`;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-body">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900"
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-20 max-w-3xl mx-auto">
          <div className="relative w-24 h-24 drop-shadow-[0_4px_30px_rgba(255,255,255,0.2)]">
            <Image
              src="/logo_ak_producciones.png"
              alt="AK Producciones"
              fill
              className="object-contain"
              sizes="96px"
              priority
            />
          </div>
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-purple-300">
              Bienvenidos a
            </p>
            <h1 className="text-4xl sm:text-6xl font-headline text-white leading-tight">
              {settings.heroTitle}
            </h1>
            <p className="text-xl sm:text-2xl font-dancing text-purple-300">
              {settings.heroSubtitle}
            </p>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              {settings.heroDescription}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none sm:justify-center">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto h-14 rounded-2xl px-8 bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95">
                <MessageSquare className="w-5 h-5" />
                Consultanos
              </button>
            </a>
            {settings.catalogUrl && (
              <button
                onClick={() => scrollToSection('catalogo')}
                className="w-full sm:w-auto h-14 rounded-2xl px-8 bg-white/10 hover:bg-white/20 text-white font-black text-sm uppercase tracking-widest border border-white/20 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <BookOpen className="w-5 h-5" />
                Ver Catálogo
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => scrollToSection('servicios')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors animate-bounce"
          aria-label="Desplazar hacia abajo"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </section>

      {/* ─── Services ─────────────────────────────────────────────────────── */}
      <section id="servicios" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">
              Lo que hacemos
            </p>
            <h2 className="text-3xl sm:text-4xl font-headline text-slate-900">
              Nuestros Servicios
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {settings.serviceHighlights.map((service) => {
              const Icon = SERVICE_ICONS[service.icon] || Sparkles;
              return (
                <div
                  key={service.id}
                  className="group flex flex-col items-center text-center p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-md group-hover:shadow-purple-200 transition-shadow">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-headline text-slate-800 font-bold mb-1">{service.title}</h3>
                  <p className="text-xs text-slate-500">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── About ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">
            Quiénes somos
          </p>
          <h2 className="text-3xl sm:text-4xl font-headline text-white">
            Tu evento, nuestra pasión
          </h2>
          <p className="text-slate-300 leading-relaxed text-base sm:text-lg">
            {settings.aboutText}
          </p>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-block">
            <button className="h-14 rounded-2xl px-8 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 mx-auto">
              <MessageSquare className="w-5 h-5" />
              ¡Reservá tu fecha!
            </button>
          </a>
        </div>
      </section>

      {/* ─── Gallery ──────────────────────────────────────────────────────── */}
      {settings.galleryItems.length > 0 && (
        <section id="galeria" className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">
                Nuestro trabajo
              </p>
              <h2 className="text-3xl sm:text-4xl font-headline text-slate-900">
                Galería de Eventos
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {settings.galleryItems.map((item, i) => (
                <GalleryCard key={item.id} item={item} onClick={() => setLightboxIndex(i)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Catalog ──────────────────────────────────────────────────────── */}
      {settings.catalogUrl && (
        <section id="catalogo" className="py-20 px-6 bg-gradient-to-br from-purple-50 via-white to-pink-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">
                Explorá
              </p>
              <h2 className="text-3xl sm:text-4xl font-headline text-slate-900">
                Nuestro Catálogo
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                Hojeá nuestro catálogo completo de servicios y paquetes
              </p>
            </div>
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="font-bold text-slate-700 text-sm">Catálogo AK Producciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCatalogFullscreen(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Pantalla completa</span>
                  </button>
                  <a
                    href={settings.catalogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Abrir</span>
                  </a>
                </div>
              </div>
              <div className="aspect-[4/3] sm:aspect-video w-full">
                <iframe
                  src={settings.catalogUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title="Catálogo AK Producciones"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section id="testimonios" className="py-20 px-0 bg-white overflow-hidden">
          <div className="px-6 mb-12 text-center max-w-5xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">
              Opiniones
            </p>
            <h2 className="text-3xl sm:text-4xl font-headline text-slate-900">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <div
            ref={testimonialsRef}
            className="flex gap-5 overflow-x-auto px-6 pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((t) => (
              <div key={t.id} className="snap-start">
                <TestimonialCard testimonial={t} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Contact / Social ─────────────────────────────────────────────── */}
      <section id="contacto" className="py-20 px-6 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">
              ¡Hablemos!
            </p>
            <h2 className="text-3xl sm:text-4xl font-headline text-white">
              ¿Listo para tu evento?
            </h2>
            <p className="text-slate-400 text-sm">
              Contactanos y hacemos realidad el evento que siempre soñaste.
            </p>
          </div>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="block">
            <button className="w-full max-w-xs mx-auto h-16 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-base uppercase tracking-widest shadow-2xl shadow-green-900/40 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse hover:animate-none">
              <MessageSquare className="w-6 h-6 shrink-0" />
              Consultar por WhatsApp
            </button>
          </a>
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">
              ¡Seguinos en redes!
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(({ platform, profileUrl, icon: Icon, bgClass }) => (
                <a
                  key={platform}
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={platform}
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-white',
                    'transition-all duration-300 hover:scale-125 hover:shadow-lg',
                    bgClass
                  )}
                >
                  <Icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-6 px-6 bg-slate-950 flex flex-col items-center gap-2 border-t border-slate-800">
        <div className="relative w-10 h-10">
          <Image
            src="/logo_ak_producciones.png"
            alt="AK Producciones"
            fill
            className="object-contain"
            sizes="40px"
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
          © {new Date().getFullYear()} AK Producciones Eventos · Salto, Uruguay
        </p>
      </footer>

      {/* ─── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <Lightbox
          items={settings.galleryItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* ─── Catalog Fullscreen ───────────────────────────────────────────── */}
      {catalogFullscreen && settings.catalogUrl && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700">
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-300" />
              Catálogo AK Producciones
            </span>
            <button
              onClick={() => setCatalogFullscreen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Cerrar pantalla completa"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <iframe
            src={settings.catalogUrl}
            className="flex-1 border-0 w-full h-full"
            allowFullScreen
            title="Catálogo AK Producciones"
          />
        </div>
      )}
    </div>
  );
}
