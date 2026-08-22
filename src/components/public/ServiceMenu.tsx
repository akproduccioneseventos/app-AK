'use client';

import { Check, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ServiceItem } from '@/types/public-landing';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

interface ServiceMenuProps {
  services: ServiceItem[];
  whatsappNumber?: string;
  whatsappMessage?: string;
  className?: string;
}

export function ServiceMenu({
  services,
  whatsappNumber = AK_WHATSAPP_NUMBER,
  whatsappMessage = '¡Hola! Quiero consultar sobre sus paquetes.',
  className,
}: ServiceMenuProps) {
  const reduceMotion = useReducedMotion();
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <section id="servicios" className={cn('py-20 px-4 bg-white', className)}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-600 mb-3">
            Nuestros paquetes
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Elegí el que mejor se adapta a vos
          </h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto font-medium">
            Todos nuestros paquetes son personalizables. Hablemos y armamos juntos
            la propuesta ideal para tu celebración.
          </p>
        </div>

        {/* Cards grid */}
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-40px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              variants={reduceMotion ? undefined : {
                hidden: { opacity: 0, y: 22 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.2 } }}
              className={cn(
                'relative flex flex-col rounded-3xl p-6 border transition-all duration-300',
                service.highlighted
                  ? 'bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white border-transparent shadow-xl shadow-purple-500/25'
                  : 'bg-white text-slate-800 border-slate-200/80 shadow-sm hover:border-purple-200 hover:shadow-xl'
              )}
            >
              {service.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    <Star className="w-3.5 h-3.5 fill-amber-950" />
                    Más elegido
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3
                  className={cn(
                    'text-2xl font-black tracking-tight',
                    service.highlighted ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {service.title}
                </h3>
                <p
                  className={cn(
                    'mt-1 text-sm font-medium leading-relaxed',
                    service.highlighted ? 'text-purple-100' : 'text-slate-500'
                  )}
                >
                  {service.description}
                </p>
              </div>

              {/* Included items */}
              <ul className="flex-1 space-y-2.5 mb-6">
                {service.included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        'w-4 h-4 mt-0.5 shrink-0',
                        service.highlighted ? 'text-purple-200' : 'text-emerald-500'
                      )}
                    />
                    <span className={service.highlighted ? 'text-white/90 font-medium' : 'text-slate-600'}>
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
                <motion.a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className={cn(
                    'w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-colors',
                    service.highlighted
                      ? 'bg-white text-purple-700 hover:bg-purple-50 shadow-md'
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-950/15'
                  )}
                >
                  Consultar propuesta
                </motion.a>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center mt-10 text-sm text-slate-500 font-medium">
          ¿Querés algo a medida?{' '}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 font-black hover:underline"
          >
            Hablemos y lo armamos juntos →
          </a>
        </p>
      </div>
    </section>
  );
}
