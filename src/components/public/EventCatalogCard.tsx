'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import type { EventCatalog } from '@/types/public-landing';
import { cn } from '@/lib/utils';

interface EventCatalogCardProps {
  catalog: EventCatalog;
  whatsappNumber?: string;
}

export function EventCatalogCard({ catalog, whatsappNumber = '59899123456' }: EventCatalogCardProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(catalog.whatsappMessage)}`;

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${catalog.heroImageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Emoji badge */}
        <div className="absolute top-4 left-4 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-2xl shadow-md">
          {catalog.emoji}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-primary">{catalog.subtitle}</p>
        <h3 className="font-headline text-2xl font-black text-slate-800">{catalog.title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{catalog.description}</p>

        <div className="flex items-center gap-3 pt-2">
          <Link
            href={`/public/${catalog.slug}`}
            className={cn(
              'flex-1 text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors',
              catalog.accentColor,
              'hover:opacity-90'
            )}
          >
            Ver Paquetes
          </Link>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
            aria-label="Cotizar por WhatsApp"
          >
            <MessageSquare className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
