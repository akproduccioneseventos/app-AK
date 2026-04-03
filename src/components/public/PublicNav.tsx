'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

interface PublicNavProps {
  whatsappNumber?: string;
}

export function PublicNav({ whatsappNumber = '59899123456' }: PublicNavProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola AK Producciones! Me gustaría más información sobre sus servicios.'
  )}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/public" className="flex items-center gap-2">
          <span className="font-headline text-xl font-black text-slate-900">AK</span>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Producciones</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/landing"
            className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/simulador-de-presupuesto"
            className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            Simulador
          </Link>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Cotizar</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
