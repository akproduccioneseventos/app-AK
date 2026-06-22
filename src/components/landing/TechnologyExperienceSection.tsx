'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Calculator,
  LayoutDashboard,
  Smartphone,
  Ticket,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface TechnologyExperienceSectionProps {
  whatsappNumber?: string;
}

const techFeatures = [
  {
    icon: Smartphone,
    title: 'Portal de Cliente PRO',
    description: 'Contratos, pagos, reuniones y plano de mesas en una vista clara para la familia.',
    cta: 'Demo del portal',
    href: '/portal-cliente/demo',
  },
  {
    icon: Calculator,
    title: 'Simulador instantáneo',
    description: 'Armá tu fiesta ideal y conocé una estimación profesional sin esperar una cotización.',
    cta: 'Probar simulador',
    href: '/simulador-ak',
  },
  {
    icon: Bot,
    title: 'Asistencia inteligente',
    description: 'Respuestas rápidas y seguimiento para resolver dudas durante la organización.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda sincronizada',
    description: 'Reuniones, degustaciones y fechas importantes ordenadas en un mismo calendario.',
  },
  {
    icon: Ticket,
    title: 'Invitaciones digitales',
    description: 'Invitaciones con QR, confirmación, cronograma, dress code y cuenta regresiva.',
  },
  {
    icon: LayoutDashboard,
    title: 'Control del evento',
    description: 'El equipo AK coordina tiempos, mesas, personal e incidencias desde una vista operativa.',
  },
];

export default function TechnologyExperienceSection({
  whatsappNumber = '59898355530',
}: TechnologyExperienceSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola! Me interesa saber más sobre la tecnología incluida en las fiestas.',
  )}`;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <section
      id="tecnologia"
      className="ak-deferred-section relative overflow-hidden border-y border-white/5 bg-zinc-950 py-24 text-white"
    >
      {/* Background soft glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Bot className="h-3.5 w-3.5" />
            Tecnología al servicio del evento
          </span>
          <h2 className="mb-5 text-4xl sm:text-5xl font-black text-white font-headline leading-tight">
            Una organización más clara antes, durante y después.
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
            Herramientas concretas para conectar a la familia, los invitados y el equipo AK sin agregar complejidad.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {techFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group flex flex-col justify-between rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Subtle hover card light */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div>
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-lg font-black text-white">{feature.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
                </div>

                {feature.href && (
                  <Link
                    href={feature.href}
                    className="inline-flex items-center text-xs font-black uppercase tracking-wider text-indigo-400 group-hover:text-white transition-colors duration-200"
                  >
                    {feature.cta}
                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <div className="relative flex flex-col items-start justify-between gap-8 border-t border-white/10 py-10 md:flex-row md:items-center">
          <div className="relative z-10 max-w-xl">
            <h3 className="mb-3 text-2xl font-black text-white sm:text-3xl">
              Tecnología incluida, sin costos escondidos.
            </h3>
            <p className="text-zinc-400 text-base leading-relaxed">
              No pagás licencias extra ni necesitás aplicaciones complicadas. Tu evento queda conectado desde el primer día.
            </p>
          </div>

          <div className="relative z-10 flex w-full shrink-0 flex-col gap-4 sm:flex-row md:w-auto">
            <Button
              asChild
              size="lg"
              className="h-13 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm uppercase tracking-wider shadow-lg px-8 transition-transform duration-200 hover:scale-[1.02]"
            >
              <Link href="/simulador-de-presupuesto" className="w-full sm:w-auto">
                Probar simulador
              </Link>
            </Button>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-13 w-full rounded-2xl border-white/10 bg-transparent text-white font-bold text-sm uppercase tracking-wider px-8 hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                Consultar ahora
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
