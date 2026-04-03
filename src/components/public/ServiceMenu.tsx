'use client';

import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceItem } from '@/types/public-landing';

interface ServiceMenuProps {
  services: ServiceItem[];
  whatsappNumber?: string;
  whatsappMessage?: string;
  className?: string;
}

export function ServiceMenu({
  services,
  whatsappNumber = '59899123456',
  whatsappMessage = '¡Hola! Quiero consultar sobre sus paquetes.',
  className,
}: ServiceMenuProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <section id="servicios" className={cn('py-20 px-4 bg-white', className)}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">
            Nuestros paquetes
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Elegí el que mejor se adapta a vos
          </h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            Todos nuestros paquetes son personalizables. Hablemos y armamos juntos
            la propuesta ideal para tu celebración.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                'relative flex flex-col rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                service.highlighted
                  ? 'bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white border-transparent shadow-lg shadow-purple-500/30'
                  : 'bg-white text-slate-800 border-slate-100 shadow-md'
              )}
            >
              {service.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    <Star className="w-3 h-3 fill-amber-900" />
                    Más elegido
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3
                  className={cn(
                    'text-xl font-black',
                    service.highlighted ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {service.title}
                </h3>
                <p
                  className={cn(
                    'mt-1 text-sm',
                    service.highlighted ? 'text-purple-200' : 'text-slate-500'
                  )}
                >
                  {service.description}
                </p>
              </div>

              {/* Included items */}
              <ul className="flex-1 space-y-2 mb-6">
                {service.included.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check
                      className={cn(
                        'w-4 h-4 mt-0.5 shrink-0',
                        service.highlighted ? 'text-purple-200' : 'text-green-500'
                      )}
                    />
                    <span className={service.highlighted ? 'text-white/90' : 'text-slate-600'}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Price + CTA */}
              <div className="flex flex-col gap-3">
                {service.price && (
                  <p
                    className={cn(
                      'text-xs font-black uppercase tracking-widest text-center',
                      service.highlighted ? 'text-purple-200' : 'text-slate-400'
                    )}
                  >
                    Precio: {service.price}
                  </p>
                )}
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <button
                    className={cn(
                      'w-full py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95',
                      service.highlighted
                        ? 'bg-white text-purple-700 hover:bg-purple-50 shadow-md'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                    )}
                  >
                    Consultar precio
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 text-sm text-slate-400">
          ¿Querés algo a medida?{' '}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 font-bold hover:underline"
          >
            Hablemos y lo armamos juntos →
          </a>
        </p>
      </div>
    </section>
  );
}
