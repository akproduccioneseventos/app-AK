'use client';

import { cn } from '@/lib/utils';
import type { WhyUsItem } from '@/types/public-landing';

interface WhyChooseUsProps {
  items: WhyUsItem[];
  className?: string;
}

export function WhyChooseUs({ items, className }: WhyChooseUsProps) {
  if (!items.length) return null;

  return (
    <section className={cn('py-20 px-4 bg-gradient-to-br from-slate-900 to-purple-950 text-white', className)}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-400 mb-3">
            ¿Por qué elegirnos?
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            La diferencia AK Producciones
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Nos esforzamos para que cada evento sea extraordinario. Estos son algunos de los motivos
            por los que nuestros clientes nos eligen y recomiendan.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex flex-col gap-3 p-6 rounded-3xl',
                'bg-white/5 border border-white/10',
                'hover:bg-white/10 transition-colors duration-200'
              )}
            >
              <span className="text-4xl drop-shadow-sm" role="img" aria-label={item.title}>
                {item.icon}
              </span>
              <h3 className="font-black text-lg text-white">{item.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
