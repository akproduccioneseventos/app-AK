'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';

export interface LandingNavProps {
  whatsappNumber?: string;
}

export function LandingNav(_props: LandingNavProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === '#faq' && typeof window !== 'undefined' && window.location.pathname.includes('simulador')) {
      window.dispatchEvent(new CustomEvent('ak-open-faq'));
      setIsMenuOpen(false);
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.assign(`/${href}`);
    }
    setIsMenuOpen(false);
  }, []);

  const navLinks = [
    { label: 'Inicio', href: '#landing-hero', isExternal: false },
    { label: 'Servicios', href: '#landing-services', isExternal: false },
    { label: 'Galería HD', href: 'https://galeria.akproducciones.uy', isExternal: true, openInNewTab: true },
    { label: 'Simulador', href: '/simulador-de-presupuesto', isExternal: true },
    { label: 'Blog', href: '/public/blog', isExternal: true },
    { label: 'Preguntas Frecuentes', href: '#faq', isExternal: false },
    { label: 'Club Uruguay', href: '/club-uruguay', isExternal: true },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'border-b border-slate-200 bg-white/95 text-slate-950 shadow-lg backdrop-blur-lg'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50">
            {/* Sin fondo blanco la barra es transparente y el logo queda oscuro
                sobre la foto: en el celular no se veia nada arriba a la
                izquierda, solo las rayitas del menu. */}
            <CompanyLogo size="sm" blanco={!isScrolled} />
            <span className={cn(
              "hidden font-headline text-lg font-black tracking-tight sm:block",
              isScrolled ? "text-slate-950" : "text-white",
            )}>
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
                  target={link.openInNewTab ? '_blank' : undefined}
                  rel={link.openInNewTab ? 'noreferrer' : undefined}
                  className={cn(
                    "px-3.5 py-2 text-xs font-black uppercase tracking-widest transition-colors",
                    isScrolled ? "text-slate-600 hover:text-red-700" : "text-zinc-200 hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={`/${link.href}`}
                  target={link.openInNewTab ? '_blank' : undefined}
                  rel={link.openInNewTab ? 'noreferrer' : undefined}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className={cn(
                    "px-3.5 py-2 text-xs font-black uppercase tracking-widest transition-colors",
                    isScrolled ? "text-slate-600 hover:text-red-700" : "text-zinc-200 hover:text-white",
                  )}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* CTA & Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/simulador-de-presupuesto"
              className={cn(
                'hidden sm:flex items-center gap-2 rounded-lg px-5 py-2.5 text-[10px] font-black uppercase tracking-widest',
                'bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-950/20',
                'transition-all duration-300 hover:scale-[1.02] active:scale-95'
              )}
            >
              Cotizá tu Fiesta
            </Link>

            {/* Mobile Menu button */}
            <button
              onClick={() => setIsMenuOpen((o) => !o)}
              disabled={!isHydrated}
              className={cn(
                "rounded-lg p-2.5 transition-colors md:hidden",
                isScrolled
                  ? "text-slate-700 hover:bg-slate-100 hover:text-red-700"
                  : "text-zinc-200 hover:bg-white/10 hover:text-white",
              )}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isMenuOpen && (
        <div className="border-b border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="px-4 py-6 space-y-2.5">
            {navLinks.map((link) =>
              link.isExternal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-4 py-3.5 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-100 hover:text-red-700"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={`/${link.href}`}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="block rounded-lg px-4 py-3.5 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-100 hover:text-red-700"
                >
                  {link.label}
                </a>
              )
            )}

            <div className="space-y-2 border-t border-slate-200 pt-4">
              <Link
                href="/simulador-de-presupuesto"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:bg-red-800 transition"
              >
                Cotizá tu Fiesta
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
