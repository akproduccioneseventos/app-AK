'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';

interface LandingNavProps {
  whatsappNumber?: string;
}

export function LandingNav({ whatsappNumber = '59899123456' }: LandingNavProps) {
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
    { label: 'Servicios', href: '#servicios' },
    { label: 'Galería', href: '#galeria' },
    { label: 'Videos', href: '#videos' },
    { label: 'Testimonios', href: '#testimonios' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-purple-100'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-3 shrink-0">
            <CompanyLogo size="sm" className="w-10 h-10" />
            <span
              className={cn(
                'font-headline font-bold text-lg hidden sm:block transition-colors',
                isScrolled ? 'text-slate-800' : 'text-white drop-shadow'
              )}
            >
              AK Producciones
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-bold uppercase tracking-wider transition-colors hover:text-primary',
                  isScrolled ? 'text-slate-600' : 'text-white/90 drop-shadow hover:text-white'
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA + Mobile menu toggle */}
          <div className="flex items-center gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest',
                'bg-[#25D366] text-white shadow-lg hover:bg-[#1eb356]',
                'transition-all duration-200 hover:scale-105 active:scale-95'
              )}
            >
              <MessageSquare className="w-4 h-4" />
              ¡Cotizá!
            </a>
            <button
              onClick={() => setIsMenuOpen((o) => !o)}
              className={cn(
                'md:hidden p-2 rounded-xl transition-colors',
                isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
              )}
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-purple-100 shadow-xl">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-700 hover:bg-purple-50 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-widest bg-[#25D366] text-white"
            >
              <MessageSquare className="w-5 h-5" />
              ¡Cotizá tu evento!
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
