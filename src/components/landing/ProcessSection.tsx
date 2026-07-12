'use client';

import { cn } from '@/lib/utils';

const steps = [
  {
    icon: '💬',
    title: 'Contáctanos',
    description: 'Escribinos por WhatsApp o completá el formulario con los detalles de tu evento.',
    color: 'from-purple-500 to-fuchsia-500',
  },
  {
    icon: '📋',
    title: 'Planificamos Juntos',
    description: 'Nos reunimos, escuchamos tus ideas y creamos el plan perfecto para tu celebración.',
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    icon: '✨',
    title: '¡Disfrutá tu Evento!',
    description: 'Nosotros nos encargamos de todo. Vos solo disfrutás el día más especial.',
    color: 'from-amber-400 to-orange-500',
  },
];

export function ProcessSection() {
  return (
    <section className="py-24 bg-zinc-950" id="proceso">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-black uppercase tracking-widest mb-6 backdrop-blur">
            🚀 Cómo Trabajamos
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Proceso de Trabajo
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Simple, transparente y enfocado en hacerte la vida más fácil
          </p>
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:flex items-start justify-between relative">
          {/* Connector line */}
          <div className="absolute top-10 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-purple-500/40 via-indigo-500/40 to-amber-500/40" />

          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center w-1/3 px-6 relative">
              <div className={cn(
                'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-4xl',
                'shadow-xl z-10 mb-6',
                step.color
              )}>
                {step.icon}
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-zinc-950 border-2 border-indigo-500/40 flex items-center justify-center text-xs font-black text-indigo-300 z-10">
                {i + 1}
              </div>
              <h3 className="text-lg font-black text-white mb-2">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl',
                  'shadow-lg shrink-0',
                  step.color
                )}>
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-purple-500/30 to-amber-500/30 my-2 min-h-[2rem]" />
                )}
              </div>
              <div className="pt-2 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Paso {i + 1}</span>
                </div>
                <h3 className="text-base font-black text-white mb-1">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
