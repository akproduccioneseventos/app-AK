'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';

interface LandingNavProps {
  whatsappNumber?: string;
}

export function LandingNav({ whatsappNumber = '59898355530' }: LandingNavProps) {
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
    { label: 'Servicios', href: '#servicios', isExternal: false },
    { label: 'Club Uruguay', href: '/club-uruguay', isExternal: true },
    { label: 'Galería', href: '#galeria', isExternal: false },
    { label: 'Videos', href: '#videos', isExternal: false },
    { label: 'Testimonios', href: '#testimonios', isExternal: false },
    { label: 'Blog', href: '/public/blog', isExternal: true },
    { label: 'Simulador', href: '/simulador-de-presupuesto', isExternal: true },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xl border-b border-slate-200'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-3 shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400">
            <CompanyLogo size="sm" />
            <span
              className={cn(
                'font-headline font-black text-lg hidden sm:block transition-colors',
                isScrolled ? 'text-zinc-950' : 'text-white drop-shadow'
              )}
            >
              AK Producciones
            </span>
          </Link>

          <nav className={cn(
            "hidden md:flex items-center gap-1 border-b transition-all duration-300",
            isScrolled ? "border-slate-200" : "border-white/20"
          )}>
            {navLinks.map((link) =>
              link.isExternal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 text-sm font-bold transition-colors',
                    isScrolled ? 'text-zinc-600 hover:text-red-700' : 'text-white/90 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 text-sm font-bold transition-colors',
                    isScrolled ? 'text-zinc-600 hover:text-red-700' : 'text-white/90 hover:text-white'
                  )}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                'hidden md:flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all duration-200 hover:scale-[1.03] active:scale-95',
                isScrolled
                  ? 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  : 'border-white/20 hover:bg-white/10 text-white'
              )}
            >
              Acceso Staff
            </Link>
            <Link
              href="/simulador-de-presupuesto"
              className={cn(
                'hidden sm:flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold',
                'bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-950/20',
                'transition-all duration-200 hover:scale-[1.03] active:scale-95'
              )}
            >
              Cotizá tu Fiesta
            </Link>
            <button
              onClick={() => setIsMenuOpen((o) => !o)}
              className={cn(
                'md:hidden rounded-lg p-2 transition-colors',
                isScrolled ? 'text-zinc-800 hover:bg-slate-100' : 'text-white hover:bg-white/10'
              )}
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-xl">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) =>
              link.isExternal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-slate-100 hover:text-red-700 transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-slate-100 hover:text-red-700 transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
            <Link
              href="/simulador-de-presupuesto"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-red-800"
            >
              Cotizá tu Fiesta
            </Link>
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-zinc-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Acceso Staff
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
