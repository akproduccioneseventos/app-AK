'use client';

import { cn } from '@/lib/utils';
import type { ProcessStep } from '@/types/public-landing';

interface EventProcessProps {
  steps: ProcessStep[];
  className?: string;
}

export function EventProcess({ steps, className }: EventProcessProps) {
  if (!steps.length) return null;

  return (
    <section className={cn('py-20 px-4 bg-white', className)}>
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">
            Nuestro proceso
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            ¿Cómo trabajamos contigo?
          </h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            Un proceso claro y sencillo para que siempre sepas qué esperar.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-purple-200 to-fuchsia-200 hidden sm:block"
            aria-hidden
          />

          <ol className="space-y-8">
            {steps.map((step, index) => (
              <li key={step.id} className="relative flex gap-5 sm:gap-8 items-start">
                {/* Step icon circle */}
                <div
                  className={cn(
                    'relative z-10 shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                    'bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/30',
                    index === steps.length - 1
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/30'
                      : ''
                  )}
                >
                  <span role="img" aria-label={step.title}>
                    {step.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                      Paso {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
