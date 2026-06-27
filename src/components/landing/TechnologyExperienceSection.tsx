'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Bot,
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
      className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 py-24 text-white border-b border-white/5"
    >
      {/* Background soft glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          {/* Left Side: Content & Features */}
          <div className="space-y-8">
            <div className="max-w-3xl">
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

            {/* Benefits List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="space-y-4"
            >
              {techFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    variants={cardVariants}
                    className="group flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 transition-all duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">{feature.title}</h3>
                      <p className="mt-2 text-sm text-zinc-400 leading-relaxed font-medium">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Bottom CTA bar */}
            <div className="relative flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
              <div className="relative z-10 max-w-sm">
                <h3 className="text-lg font-black text-white">
                  Tecnología incluida en todos los paquetes.
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium mt-1">
                  No pagás licencias extra ni programas externos. Tu fiesta queda integrada al sistema.
                </p>
              </div>

              <div className="relative z-10 flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg px-6 transition-transform duration-200 hover:scale-[1.02]"
                >
                  <Link href="/simulador-de-presupuesto" className="w-full sm:w-auto">
                    Probar Simulador
                  </Link>
                </Button>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full rounded-2xl border-white/10 bg-transparent text-white font-bold text-xs uppercase tracking-wider px-6 hover:bg-white/5 hover:text-white transition-all duration-200"
                  >
                    Consultar ahora
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Right Side: High impact fotorrealistic image by Nano Banana */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Ambient glow behind image */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-30 pointer-events-none" />

            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-2xl aspect-[4/3] w-full max-w-lg">
              <Image
                src="/media/catalogo-servicios/tecnologia_fiesta.png"
                alt="Tecnología interactiva en fiesta de AK Producciones"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 45vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Fiestas Conectadas</span>
                <p className="mt-2 text-xl sm:text-2xl font-black text-white leading-tight">Invitados interactuando con pantallas en vivo</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
