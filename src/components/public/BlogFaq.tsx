'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: '¿Con cuánta anticipación recomiendan reservar fecha en Salto?',
    answer: 'Para temporada alta (octubre a marzo), te sugerimos reservar con 9 a 12 meses de anticipación. Para el resto del año, con 6 meses suele ser suficiente para asegurar el salón y los servicios clave.'
  },
  {
    question: '¿Qué servicios se pueden calcular en el simulador?',
    answer: 'Podés jugar con toda la base de tu fiesta: salón, catering (por persona), barra tecnológica de tragos, discoteca integral, pantallas LED y ambientación básica. Luego lo ajustamos a tu medida.'
  },
  {
    question: '¿La barra de tragos incluye opciones sin alcohol?',
    answer: '¡Por supuesto! Todas nuestras barras de coctelería incluyen mocktails (tragos sin alcohol) premium con frutas de estación y jarabes artesanales, pensados para los adolescentes y conductores designados.'
  }
];

export function BlogFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4">
      <div className="flex items-center gap-2 text-purple-700">
        <HelpCircle className="h-5 w-5" />
        <h3 className="text-sm font-black uppercase tracking-wider">Preguntas frecuentes</h3>
      </div>
      <div className="divide-y divide-slate-200">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="py-3 first:pt-0 last:pb-0">
              <button
                onClick={() => toggleFaq(index)}
                className="flex w-full items-center justify-between text-left text-sm font-bold text-slate-900 hover:text-purple-700 transition-colors duration-200"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-700' : 'text-slate-400'}`} />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden text-xs leading-relaxed text-slate-600">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
