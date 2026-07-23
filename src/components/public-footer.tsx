'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Music, MessageSquare, Building2, MapPin, Sparkles, Phone, ArrowUpRight } from 'lucide-react';
import { CompanyLogo } from '@/components/company-logo';
import { getSocialConnections } from '@/app/actions/social-connections';
import { cn } from '@/lib/utils';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

const FALLBACK_SOCIAL = [
  {
    platform: 'Instagram',
    profileUrl: 'https://instagram.com/akproduccioneseventos',
    icon: Instagram,
    bgClass: 'bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500',
    shadowClass: 'hover:shadow-pink-500/40',
  },
  {
    platform: 'Facebook',
    profileUrl: 'https://facebook.com/akproduccioneseventos',
    icon: Facebook,
    bgClass: 'bg-[#1877F2]',
    shadowClass: 'hover:shadow-blue-500/40',
  },
  {
    platform: 'WhatsApp',
    profileUrl: `https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola AK Producciones! Me gustaría consultar por mi evento.')}`,
    icon: MessageSquare,
    bgClass: 'bg-[#25D366]',
    shadowClass: 'hover:shadow-emerald-500/40',
  },
  {
    platform: 'TikTok',
    profileUrl: 'https://tiktok.com/@akproduccioneseventos',
    icon: Music,
    bgClass: 'bg-zinc-900 border border-white/20',
    shadowClass: 'hover:shadow-slate-400/40',
  },
];

interface PublicFooterProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function PublicFooter({ className, variant = 'dark' }: PublicFooterProps) {
  const [socialLinks, setSocialLinks] = useState(FALLBACK_SOCIAL);

  useEffect(() => {
    getSocialConnections()
      .then((connections) => {
        if (connections.length > 0) {
          const merged = FALLBACK_SOCIAL.map((fallback) => {
            const conn = connections.find(
              (c) =>
                c.platform === fallback.platform &&
                c.isConnected &&
                c.profileUrl
            );
            return conn ? { ...fallback, profileUrl: conn.profileUrl! } : fallback;
          });
          setSocialLinks(merged);
        }
      })
      .catch(() => {});
  }, []);

  const isDark = variant === 'dark';

  return (
    <footer
      className={cn(
        'relative overflow-hidden pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 text-left',
        isDark
          ? 'bg-zinc-950 text-white'
          : 'bg-slate-900 text-white',
        className
      )}
    >
      {/* Glow decorative blobs */}
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-red-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute top-0 left-1/3 w-80 h-80 rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        
        {/* Top Banner Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-12 border-b border-white/10">
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-3">
              <CompanyLogo size="md" className="drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
              <div>
                <span className="font-headline font-black text-2xl text-white tracking-tight block">
                  AK Producciones
                </span>
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest block">
                  Producción Integral de Eventos • Salto, Uruguay
                </span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 max-w-md font-medium leading-relaxed">
              Diseñamos bodas, 15 años y eventos sociales inolvidables. Gastronomía gourmet, discoteca profesional, salones de gala y tecnología interactiva.
            </p>
          </div>

          <div className="md:col-span-6 flex flex-col sm:flex-row items-start sm:items-center md:justify-end gap-4">
            <a
              href={`https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola AK Producciones! Quisiera consultar disponibilidad para mi fecha.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest px-6 py-4 shadow-xl shadow-emerald-950/30 transition-all hover:scale-[1.02] active:scale-95 border border-emerald-400/30"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              <span>Consultar por WhatsApp</span>
            </a>

            <Link
              href="/simulador-de-presupuesto"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-700 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest px-6 py-4 shadow-xl shadow-red-950/40 transition-all hover:scale-[1.02] active:scale-95 border border-red-500/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Cotizá tu Fiesta</span>
            </Link>
          </div>
        </div>

        {/* Middle Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: Salones y Propuesta */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-red-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-400" />
              Salones Destacados
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-zinc-400">
              <li>
                <a href="#landing-salon" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 group-hover:w-3 transition-all" />
                  Salón Club Uruguay (Exclusivo)
                </a>
              </li>
              <li>
                <a href="#landing-services" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 group-hover:w-3 transition-all" />
                  Gastronomía Gourmet & Catering
                </a>
              </li>
              <li>
                <a href="#landing-services" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 group-hover:w-3 transition-all" />
                  Discoteca & Pistas de Luces LED
                </a>
              </li>
              <li>
                <a href="#landing-technology" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 group-hover:w-3 transition-all" />
                  Plataforma 360° & Fotocabina QR
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Navegación Rapida */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-red-400">
              Accesos Rápidos
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-zinc-400">
              <li>
                <Link href="/simulador-de-presupuesto" className="hover:text-white transition-colors flex items-center gap-1">
                  Simulador de Presupuesto
                  <ArrowUpRight className="w-3 h-3 text-red-400" />
                </Link>
              </li>
              <li>
                <a href="#landing-gallery" className="hover:text-white transition-colors">
                  Galería de Eventos Reales
                </a>
              </li>
              <li>
                <a href="#landing-blog-video" className="hover:text-white transition-colors">
                  Blog & Guías de Organización
                </a>
              </li>
              <li>
                <a href="#landing-testimonials-faq" className="hover:text-white transition-colors">
                  Testimonios & Preguntas Frecuentes
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors text-zinc-500">
                  Acceso Staff & Equipo AK
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Ubicación y Contacto */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-red-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400" />
              Oficina & Salto
            </h4>
            <div className="space-y-2 text-xs font-medium text-zinc-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>Salto, Uruguay</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>+598 98 355 530</span>
              </p>
              <p className="text-[11px] text-zinc-500 pt-1">
                Atención personalizada con coordinación in-situ el día del evento.
              </p>
            </div>
          </div>

          {/* Col 4: Redes Sociales */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-red-400">
              Redes Sociales
            </h4>
            <p className="text-xs font-medium text-zinc-400">
              Seguinos para ver coberturas en vivo, salones armados y fotos reales de fiestas.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map(({ platform, profileUrl, icon: Icon, bgClass, shadowClass }) => (
                <a
                  key={platform}
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                  title={platform}
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center text-white',
                    'transition-all duration-300 hover:scale-110 shadow-lg',
                    bgClass,
                    shadowClass
                  )}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-zinc-500">
          <p>© {new Date().getFullYear()} AK Producciones Eventos. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#landing-salon" className="hover:text-zinc-300 transition">Club Uruguay</a>
            <Link href="/simulador-de-presupuesto" className="hover:text-zinc-300 transition">Simulador</Link>
            <Link href="/login" className="hover:text-zinc-300 transition">Staff</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
