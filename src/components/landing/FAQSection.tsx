'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: '¿Cuánto cuesta organizar un evento?',
    a: 'El costo varía según el tipo de evento, la cantidad de invitados y los servicios que elijas. Te ofrecemos paquetes desde las opciones más accesibles hasta las más premium. ¡Contactanos para una cotización personalizada!',
  },
  {
    q: '¿Con cuánta anticipación debo reservar?',
    a: 'Para bodas y XV años recomendamos reservar con al menos 6-12 meses de anticipación. Para otros eventos puede ser menos tiempo. Lo importante es que cuanto antes nos contactés, más opciones tendrás disponibles.',
  },
  {
    q: '¿Qué incluye el servicio de producción integral?',
    a: 'Nuestro servicio cubre desde la planificación y coordinación hasta el día del evento: decoración, fotografía, DJ, catering, animación, luces, sonido, y todo lo que necesites para que tu celebración sea perfecta.',
  },
  {
    q: '¿Trabajan en todo Uruguay?',
    a: 'Sí, trabajamos en Montevideo y todo el interior del país. Contamos con los recursos y el equipo para llevar la magia de AK Producciones a donde la necesites.',
  },
  {
    q: '¿Puedo personalizar los paquetes?',
    a: 'Absolutamente. Cada evento es único y lo personalizamos a tu medida. Podés agregar o quitar servicios, elegir el estilo y los colores, y adaptarlo a tu presupuesto.',
  },
  {
    q: '¿Cómo es el proceso de pago?',
    a: 'Trabajamos con un sistema flexible: una seña para reservar la fecha y el resto en cuotas hasta el evento. Aceptamos efectivo y transferencia bancaria.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-slate-50" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest mb-6">
            ❓ FAQ
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Todo lo que necesitás saber antes de contratar tu evento
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={cn(
                'rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300',
                open === i ? 'bg-white shadow-md border-purple-200' : 'bg-white/60'
              )}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className={cn(
                  'font-bold text-sm sm:text-base transition-colors',
                  open === i ? 'text-purple-700' : 'text-slate-900'
                )}>
                  {faq.q}
                </span>
                {open === i
                  ? <ChevronUp className="w-5 h-5 text-purple-600 shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                }
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
