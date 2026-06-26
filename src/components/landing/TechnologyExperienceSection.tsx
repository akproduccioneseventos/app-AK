'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bot,
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
    title: 'Portal de Cliente Digital',
    description: 'Controlá tus contratos, pagos realizados, tareas de organización y el plano interactivo de mesas desde un solo lugar.',
  },
  {
    icon: Ticket,
    title: 'Invitaciones con QR',
    description: 'Tus invitados confirman asistencia, eligen menú, ven el mapa, el dress code y acceden con un código QR único y seguro.',
  },
  {
    icon: LayoutDashboard,
    title: 'Muro Social Interactivo',
    description: 'Los invitados sacan fotos durante el baile y las proyectamos al instante en la pantalla LED gigante de la discoteca.',
  },
];

export default function TechnologyExperienceSection({
  whatsappNumber = '59898355530',
}: TechnologyExperienceSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola! Me interesa saber más sobre la tecnología interactiva incluida en las fiestas.',
  )}`;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <section
      id="tecnologia"
      className="relative overflow-hidden bg-zinc-950 py-24 text-white border-b border-white/5"
    >
      {/* Background soft glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-16 max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Bot className="h-3.5 w-3.5" />
            La tecnología a favor de tu fiesta
          </span>
          <h2 className="mb-5 text-4xl sm:text-5xl font-black text-white font-headline leading-tight">
            Toda tu fiesta en un solo lugar. Organizamos el evento por vos. Andá como invitado.
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
            Sin planillas confusas ni perseguir proveedores por separado. Nuestro sistema digital exclusivo conecta el salón, los servicios, los invitados y al equipo de AK de forma automática.
          </p>
        </div>

        {/* Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3"
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
                  <p className="text-sm leading-relaxed text-zinc-400 font-medium">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA bar */}
        <div className="relative flex flex-col items-start justify-between gap-8 border-t border-white/10 py-10 md:flex-row md:items-center">
          <div className="relative z-10 max-w-xl">
            <h3 className="mb-2 text-2xl font-black text-white sm:text-3xl">
              Tecnología incluida en todos los paquetes.
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-medium">
              No pagás licencias extra ni programas externos. Tu evento queda integrado al sistema desde el momento de confirmar la reserva.
            </p>
          </div>

          <div className="relative z-10 flex w-full shrink-0 flex-col gap-4 sm:flex-row md:w-auto">
            <Button
              asChild
              size="lg"
              className="h-13 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-lg px-8 transition-transform duration-200 hover:scale-[1.02]"
            >
              <Link href="/simulador-de-presupuesto" className="w-full sm:w-auto">
                Probar Simulador
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
