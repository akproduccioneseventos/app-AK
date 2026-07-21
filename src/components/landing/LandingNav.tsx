'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';

interface LandingNavProps {
  whatsappNumber?: string;
}

export function LandingNav(_props: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Servicios', href: '#servicios', isExternal: false },
    { label: 'Como trabajamos', href: '#experiencia', isExternal: false },
    { label: 'Consulta', href: '#contacto', isExternal: false },
    { label: 'Simulador', href: '/simulador-de-presupuesto', isExternal: true },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-zinc-950/85 backdrop-blur-lg shadow-2xl border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50">
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
              className="md:hidden rounded-lg p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
          <div className="px-4 py-6 space-y-2.5">
            {navLinks.map((link) =>
              link.isExternal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                >
                  {link.label}
                </a>
              )
            )}
            
            <div className="pt-4 border-t border-white/5 space-y-2">
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
