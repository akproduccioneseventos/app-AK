'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

interface LandingNavProps {
  whatsappNumber?: string;
}

export function LandingNav({ whatsappNumber = AK_WHATSAPP_NUMBER }: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola AK Producciones! Vi su página y me gustaría cotizar mi evento.'
  )}`;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Servicios', href: '#landing-services', isExternal: false },
    { label: 'Club Uruguay', href: '/club-uruguay', isExternal: true },
    { label: 'Galería', href: '#landing-instagram', isExternal: false },
    { label: 'Videos', href: '#landing-blog-video', isExternal: false },
    { label: 'Testimonios', href: '#landing-testimonials-faq', isExternal: false },
    { label: 'Blog', href: '/public/blog', isExternal: true },
    { label: 'Simulador', href: '/simulador-de-presupuesto', isExternal: true },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-350',
        isScrolled
          ? 'bg-zinc-950/85 backdrop-blur-lg shadow-2xl border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50">
            <CompanyLogo size="sm" />
            <span className="font-headline font-black text-lg hidden sm:block text-white tracking-tight">
              AK Producciones
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className={cn(
            "hidden md:flex items-center gap-1 border-b transition-all duration-300",
            isScrolled ? "border-transparent" : "border-white/10"
          )}>
            {navLinks.map((link) =>
              link.isExternal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3.5 py-2 text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3.5 py-2 text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* CTA & Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                'hidden md:flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95',
                isScrolled
                  ? 'border-white/10 hover:bg-white/5 text-zinc-350 hover:text-white'
                  : 'border-white/20 hover:bg-white/10 text-white'
              )}
            >
              Acceso Staff
            </Link>
            
            <Link
              href="/simulador-de-presupuesto"
              className={cn(
                'hidden sm:flex items-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest',
                'bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-950/20',
                'transition-all duration-300 hover:scale-[1.02] active:scale-95'
              )}
            >
              Cotizá tu Fiesta
            </Link>

            {/* Mobile Menu button */}
            <button
              onClick={() => setIsMenuOpen((o) => !o)}
              className="md:hidden rounded-xl p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-zinc-950/98 backdrop-blur-xl border-b border-white/5 shadow-2xl">
          <div className="px-4 py-6 space-y-2.5">
            {navLinks.map((link) =>
              link.isExternal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-350 hover:bg-white/5 hover:text-white transition-all"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-350 hover:bg-white/5 hover:text-white transition-all"
                >
                  {link.label}
                </a>
              )
            )}
            
            <div className="pt-4 border-t border-white/5 space-y-2">
              <Link
                href="/simulador-de-presupuesto"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:bg-red-800 transition"
              >
                Cotizá tu Fiesta
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-4 text-xs font-black uppercase tracking-widest text-zinc-350 shadow-sm transition hover:bg-white/5 hover:text-white"
              >
                Acceso Staff
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

