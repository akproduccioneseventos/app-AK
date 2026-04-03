'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FAQItem } from '@/types/public-landing';

interface FAQSectionProps {
  faqs: FAQItem[];
  className?: string;
}

function FAQItemRow({ faq }: { faq: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
          {faq.question}
        </span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-purple-500 shrink-0 transition-transform duration-300',
            open && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-96' : 'max-h-0'
        )}
      >
        <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-3">
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

export function FAQSection({ faqs, className }: FAQSectionProps) {
  if (!faqs.length) return null;

  return (
    <section className={cn('py-20 px-4 bg-slate-50', className)}>
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">
            Preguntas frecuentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            ¿Tenés dudas? Aquí respondemos las más comunes
          </h2>
          <p className="mt-3 text-slate-500">
            Si tu pregunta no está aquí, escribinos por WhatsApp y te respondemos enseguida.
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq) => (
            <FAQItemRow key={faq.id} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
