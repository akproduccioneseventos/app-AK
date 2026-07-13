'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Bot,
  LayoutDashboard,
  Smartphone,
  Ticket,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface TechnologyExperienceSectionProps {
  whatsappNumber?: string;
}

const techFeatures = [
  {
    icon: Smartphone,
    title: 'Portal de Cliente Digital',
    description: 'Contratos, pagos realizados, tareas de organización y plano de mesas desde un solo lugar.',
  },
  {
    icon: Ticket,
    title: 'Invitaciones con QR',
    description: 'Confirmación de asistencia, menú, mapa, dress code y acceso con código único para invitados.',
  },
  {
    icon: LayoutDashboard,
    title: 'Muro Social Interactivo',
    description: 'Fotos y mensajes de invitados ordenados para proyectar durante la fiesta en pantalla.',
  },
];

export default function TechnologyExperienceSection({
  whatsappNumber = '59898355530',
}: TechnologyExperienceSectionProps) {
  const reduceMotion = useReducedMotion();
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola! Me interesa saber más sobre la tecnología interactiva incluida en las fiestas.',
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
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  };

  return (
    <section
      id="tecnologia"
      className="border-y border-slate-200 bg-slate-50 py-24 text-slate-950"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-8">
            <div className="max-w-3xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-700">
                <Bot className="h-3.5 w-3.5" />
                Tecnología útil para el evento
              </span>
              <h2 className="font-headline text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                Una experiencia digital clara para clientes e invitados
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
                La tecnología suma cuando ordena la fiesta y no cuando complica. AK centraliza invitaciones, portal, confirmaciones y contenido social con una presentación simple.
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid gap-4"
            >
              {techFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    key={feature.title}
                    variants={cardVariants}
                    className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-950">{feature.title}</h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{feature.description}</p>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>

            <div className="flex flex-col items-start justify-between gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div className="max-w-md">
                <h3 className="text-lg font-black text-slate-950">
                  Integrado a los paquetes de AK.
                </h3>
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
                  La app acompaña la venta, la planificación y la experiencia de invitados sin mostrar controles internos al cliente.
                </p>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-md bg-red-700 px-6 text-xs font-bold text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:bg-red-800"
                >
                  <Link href="/simulador-de-presupuesto" className="w-full sm:w-auto">
                    Probar simulador
                  </Link>
                </Button>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full rounded-md border-slate-300 bg-white px-6 text-xs font-black uppercase tracking-wider text-slate-800 transition-all duration-200 hover:bg-slate-950 hover:text-white"
                  >
                    Consultar ahora
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <motion.div
            className="relative"
            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-200 shadow-xl">
              <Image
                src="/media/catalogo-servicios/tecnologia_fiesta.png"
                alt="Tecnología interactiva en fiesta de AK Producciones"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 45vw"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-slate-950/82 p-6 text-white">
                <span className="text-[10px] font-bold text-emerald-200">Fiestas conectadas</span>
                <p className="mt-2 text-xl font-black leading-tight sm:text-2xl">Invitados, pantallas y organización trabajando juntos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
