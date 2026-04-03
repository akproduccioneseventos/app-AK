'use client';

import { Check, MessageSquare } from 'lucide-react';
import type { EventPackage } from '@/types/public-landing';
import { cn } from '@/lib/utils';

interface PackageCardProps {
  pkg: EventPackage;
  accentColor: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export function PackageCard({
  pkg,
  accentColor,
  whatsappNumber = '59899123456',
  whatsappMessage,
}: PackageCardProps) {
  const message = whatsappMessage
    ? `${whatsappMessage} Me interesa el ${pkg.name}.`
    : `¡Hola! Me interesa el paquete "${pkg.name}".`;

  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className={cn(
        'relative bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col',
        pkg.popular && 'ring-2 ring-pink-500 shadow-pink-200 shadow-xl'
      )}
    >
      {pkg.popular && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-pink-500 text-white text-xs font-black uppercase tracking-widest">
          Más Popular
        </div>
      )}

      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${pkg.imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1 space-y-4">
        <div>
          <h3 className="font-headline text-xl font-black text-slate-800">{pkg.name}</h3>
          <p className="text-slate-500 text-sm mt-1">{pkg.description}</p>
        </div>

        {/* Includes */}
        <ul className="space-y-2 flex-1">
          {pkg.includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  accentColor
                )}
              >
                <Check className="w-3 h-3 text-white" />
              </span>
              <span className="text-slate-700 text-sm">{item}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors shadow-md"
        >
          <MessageSquare className="w-4 h-4" />
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  );
}
