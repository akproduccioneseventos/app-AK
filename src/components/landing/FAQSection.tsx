'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { LandingFaqItem } from '@/types/landing-editor';

const DEFAULT_FAQS: LandingFaqItem[] = [
  {
    id: 'default_1',
    question: '¿Cuánto cuesta organizar un evento?',
    answer: 'El costo varía según el tipo de evento, la cantidad de invitados y los servicios que elijas. Te ofrecemos paquetes desde las opciones más accesibles hasta las más premium. ¡Contactanos para una cotización personalizada!',
  },
  {
    id: 'default_2',
    question: '¿Con cuánta anticipación debo reservar?',
    answer: 'Para bodas y XV años recomendamos reservar con al menos 6-12 meses de anticipación. Para otros eventos puede ser menos tiempo. Lo importante es que cuanto antes nos contactés, más opciones tendrán disponibles.',
  },
  {
    id: 'default_3',
    question: '¿Qué incluye el servicio de producción integral?',
    answer: 'Nuestro servicio cubre desde la planificación y coordinación hasta el día del evento: decoración, fotografía, discoteca, gastronomía, animación, luces, sonido, y todo lo que necesites para que tu celebración sea perfecta.',
  },
  {
    id: 'default_4',
    question: '¿Trabajan en todo Uruguay?',
    answer: 'Sí, trabajamos en Montevideo y todo el interior del país. Contamos con los recursos y el equipo para llevar la magia de AK Producciones a donde la necesites.',
  },
  {
    id: 'default_5',
    question: '¿Puedo personalizar los paquetes?',
    answer: 'Absolutamente. Cada evento es único y lo personalizamos a tu medida. Podés agregar o quitar servicios, elegir el estilo y los colores, y adaptarlo a tu presupuesto.',
  },
  {
    id: 'default_6',
    question: '¿Cómo es el proceso de pago?',
    answer: 'Trabajamos con un sistema flexible: una seña para reservar la fecha y el resto en cuotas hasta el evento. Aceptamos efectivo y transferencia bancaria.',
  },
  {
    id: 'default_7',
    question: '¿Puedo simular mi presupuesto antes de consultar?',
    answer: 'Sí. El simulador te ayuda a elegir servicios, cantidad de invitados y estilo de fiesta para llegar a WhatsApp con una idea clara y recibir una propuesta formal.',
  },
  {
    id: 'default_8',
    question: '¿Qué tecnología incluye AK en los eventos?',
    answer: 'Según el tipo de fiesta podemos integrar portal del cliente, invitación web, red social privada, pantalla en vivo, QR, fotocabina, plataforma 360, tótems y herramientas para invitados.',
  },
  {
    id: 'default_9',
    question: '¿El presupuesto que recibo es formal?',
    answer: 'Sí. La propuesta se entrega en formato claro y descargable. La firma y el contrato aparecen cuando corresponde confirmar la reserva, no en un presupuesto preliminar.',
  },
];


interface FAQSectionProps {
  faqs?: LandingFaqItem[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [open, setOpen] = useState<string | null>(null);
  const items = faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS;

  return (
    <section className="py-24 bg-slate-50" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest mb-6">
            ❓ FAQ
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Todo lo que necesitás saber antes de contratar tu evento
          </p>
        </motion.div>

        {/* Accordeon List */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-3"
        >
          {items.map((faq) => (
            <div
              key={faq.id}
              className={cn(
                'rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300',
                open === faq.id ? 'bg-white shadow-md border-purple-200' : 'bg-white/60'
              )}
            >
              <button
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none"
              >
                <span className={cn(
                  'font-bold text-sm sm:text-base transition-colors',
                  open === faq.id ? 'text-purple-700' : 'text-slate-900'
                )}>
                  {faq.question}
                </span>
                {open === faq.id
                  ? <ChevronUp className="w-5 h-5 text-purple-600 shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                }
              </button>

              <AnimatePresence initial={false}>
                {open === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100/80 pt-3">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
