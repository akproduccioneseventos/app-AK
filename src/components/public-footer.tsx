'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Music, MessageSquare, Building2, MapPin, Sparkles, Phone, ArrowUpRight, ShieldCheck, Heart } from 'lucide-react';
import { CompanyLogo } from '@/components/company-logo';
import { getSocialConnections } from '@/app/actions/social-connections';
import { cn } from '@/lib/utils';
import { AK_WHATSAPP_NUMBER, AK_SOCIAL_LINKS } from '@/lib/public-contact';

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  );
}

interface SocialLinkItem {
  platform: string;
  profileUrl: string;
  icon: React.ElementType;
  bgClass: string;
}

const FALLBACK_SOCIAL: SocialLinkItem[] = [
  {
    platform: 'Instagram',
    profileUrl: AK_SOCIAL_LINKS.instagram,
    icon: Instagram,
    bgClass: 'bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 hover:shadow-pink-500/50',
  },
  {
    platform: 'Facebook',
    profileUrl: AK_SOCIAL_LINKS.facebook,
    icon: Facebook,
    bgClass: 'bg-[#1877F2] hover:shadow-blue-500/50',
  },
  {
    platform: 'Pinterest',
    profileUrl: AK_SOCIAL_LINKS.pinterest,
    icon: PinterestIcon,
    bgClass: 'bg-[#E60023] hover:shadow-red-500/50',
  },
  {
    platform: 'WhatsApp',
    profileUrl: `https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola AK Producciones! Quisiera consultar por mi evento.')}`,
    icon: MessageSquare,
    bgClass: 'bg-[#25D366] hover:shadow-emerald-500/50',
  },
  {
    platform: 'TikTok',
    profileUrl: AK_SOCIAL_LINKS.tiktok,
    icon: Music,
    bgClass: 'bg-zinc-900 border border-white/20 hover:shadow-slate-400/40',
  },
];

interface PublicFooterProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function PublicFooter({ className }: PublicFooterProps) {
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>(FALLBACK_SOCIAL);

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

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.assign(`/${href}`);
      }
    }
  };

  return (
    <footer
      className={cn(
        'relative overflow-hidden pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-left bg-gradient-to-b from-zinc-950 via-zinc-900/90 to-zinc-950 text-white border-t border-white/10',
        className
      )}
    >
      {/* Top glowing ambient gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        
        {/* Top Banner Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-12 border-b border-white/10">
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <CompanyLogo size="md" className="drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
              <div>
                <span className="font-headline font-black text-2xl sm:text-3xl text-white tracking-tight block">
                  AK Producciones
                </span>
                <span className="text-xs font-black text-transparent bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text uppercase tracking-widest block">
                  Producción Integral de Eventos • Salto, Uruguay
                </span>
              </div>
            </div>
            <p className="text-sm text-zinc-300 max-w-lg font-medium leading-relaxed">
              Diseñamos bodas, 15 años y eventos empresariales inolvidables. Gastronomía gourmet, discoteca profesional, salones de gala y tecnología interactiva en un solo lugar.
            </p>
          </div>

          <div className="md:col-span-6 flex flex-col sm:flex-row items-start sm:items-center md:justify-end gap-4">
            <a
              href={`https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola AK Producciones! Quisiera consultar disponibilidad para mi fecha.')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Consultar disponibilidad por WhatsApp (abre en nueva ventana)"
              className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-widest px-7 py-4 shadow-xl shadow-emerald-950/40 transition-all duration-300 hover:scale-[1.03] active:scale-95 border border-emerald-400/30"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200" />
              </span>
              <MessageSquare className="w-4 h-4 text-emerald-100 transition-transform group-hover:scale-110" aria-hidden="true" />
              <span>WhatsApp Directo</span>
            </a>

            <Link
              href="/simulador-de-presupuesto"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-xs uppercase tracking-widest px-7 py-4 shadow-xl shadow-red-950/50 transition-all duration-300 hover:scale-[1.03] active:scale-95 border border-red-500/40"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" aria-hidden="true" />
              <span>Cotizá tu Fiesta</span>
            </Link>
          </div>
        </div>

        {/* Middle Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: Salones y Propuesta */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-red-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-400" aria-hidden="true" />
              Salones Destacados
            </h4>
            <ul className="space-y-3 text-xs font-semibold text-zinc-300">
              <li>
                <a href="#landing-salon" onClick={(e) => handleAnchorClick(e, '#landing-salon')} className="hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 group-hover:w-3 transition-all duration-300" />
                  Salón Club Uruguay (Exclusivo)
                </a>
              </li>
              <li>
                <a href="#landing-services" onClick={(e) => handleAnchorClick(e, '#landing-services')} className="hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 group-hover:w-3 transition-all duration-300" />
                  Gastronomía Gourmet & Catering
                </a>
              </li>
              <li>
                <a href="#landing-services" onClick={(e) => handleAnchorClick(e, '#landing-services')} className="hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 group-hover:w-3 transition-all duration-300" />
                  Discoteca & Pistas de Luces LED
                </a>
              </li>
              <li>
                <a href="#landing-technology" onClick={(e) => handleAnchorClick(e, '#landing-technology')} className="hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 group-hover:w-3 transition-all duration-300" />
                  Plataforma 360° & Fotocabina QR
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Navegación Rápida */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-red-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" aria-hidden="true" />
              Accesos Rápidos
            </h4>
            <ul className="space-y-3 text-xs font-semibold text-zinc-300">
              <li>
                <Link href="/simulador-de-presupuesto" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="text-red-400 group-hover:translate-x-0.5 transition-transform">→</span>
                  Simulador de Presupuesto
                  <ArrowUpRight className="w-3 h-3 text-red-400" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <a href="#landing-gallery" onClick={(e) => handleAnchorClick(e, '#landing-gallery')} className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-500 group-hover:text-white transition-colors">→</span>
                  Galería de Eventos Reales
                </a>
              </li>
              <li>
                <a href="#landing-blog-video" onClick={(e) => handleAnchorClick(e, '#landing-blog-video')} className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-500 group-hover:text-white transition-colors">→</span>
                  Blog & Guías de Organización
                </a>
              </li>
              <li>
                <a href="#landing-testimonials-faq" onClick={(e) => handleAnchorClick(e, '#landing-testimonials-faq')} className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-500 group-hover:text-white transition-colors">→</span>
                  Testimonios & Preguntas Frecuentes
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  Acceso Staff & Equipo AK
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Ubicación y Contacto */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-red-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400" aria-hidden="true" />
              Oficina & Atencion
            </h4>
            <div className="space-y-3 text-xs font-medium text-zinc-300 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Salto, Uruguay</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <a href={`tel:+59898355530`} className="hover:text-white transition-colors font-bold">+598 98 355 530</a>
              </p>
              <p className="text-[11px] text-zinc-400 pt-1 border-t border-white/5 leading-relaxed">
                Coordinación presencial garantizada el día de tu celebración.
              </p>
            </div>
          </div>

          {/* Col 4: Redes Sociales */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.25em] text-red-400 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" aria-hidden="true" />
              Comunidad & Redes
            </h4>
            <p className="text-xs font-medium text-zinc-300 leading-relaxed">
              Seguinos en redes para ver coberturas en vivo, montajes reales y salones armados.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ platform, profileUrl, icon: Icon, bgClass }) => (
                <a
                  key={platform}
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visitar ${platform} de AK Producciones (abre en nueva ventana)`}
                  title={platform}
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center text-white',
                    'transition-all duration-300 hover:scale-125 hover:-translate-y-1 shadow-lg',
                    bgClass
                  )}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-zinc-400">
          <p>© {new Date().getFullYear()} AK Producciones Eventos. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#landing-salon" onClick={(e) => handleAnchorClick(e, '#landing-salon')} className="hover:text-white transition">Club Uruguay</a>
            <Link href="/simulador-de-presupuesto" className="hover:text-white transition">Simulador</Link>
            <Link href="/login" className="hover:text-white transition text-zinc-500">Acceso Staff</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
