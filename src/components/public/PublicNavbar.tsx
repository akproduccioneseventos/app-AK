'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicNavbarProps {
  whatsappNumber?: string;
  whatsappMessage?: string;
  className?: string;
}

export function PublicNavbar({
  whatsappNumber = '59899123456',
  whatsappMessage = '¡Hola AK Producciones! Quiero consultar sobre sus servicios.',
  className,
}: PublicNavbarProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'bg-white/80 backdrop-blur-md border-b border-purple-100/60',
        'shadow-sm',
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo + Brand */}
        <Link href="/public" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 shrink-0">
            <Image
              src="/logo_ak_producciones.png"
              alt="AK Producciones"
              fill
              className="object-contain group-hover:scale-110 transition-transform duration-200"
              sizes="36px"
            />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-slate-800 hidden sm:block">
            AK Producciones
          </span>
        </Link>

        {/* CTA Button */}
        <a href={waHref} target="_blank" rel="noopener noreferrer">
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl',
              'bg-[#25D366] hover:bg-[#1eb356]',
              'text-white font-black text-xs uppercase tracking-widest',
              'shadow-md shadow-green-900/20',
              'transition-all duration-200 hover:scale-105 active:scale-95'
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">¡Consultanos!</span>
            <span className="sm:hidden">WhatsApp</span>
          </button>
        </a>
      </div>
    </header>
  );
}
