'use client';

import Image from 'next/image';
import { CalendarCheck, ClipboardList, Gem, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const benefits = [
  {
    title: 'Descanso mental para vos y tu familia',
    text: 'AK coordina el salón, la comida, la discoteca, los tiempos y el equipo para que llegues descansado y disfrutes la noche como un invitado más.',
    icon: Sparkles,
  },
  {
    title: 'Control total sin perseguir proveedores',
    text: 'Todo en un solo lugar bajo una misma dirección. Se terminaron las cadenas de mensajes, los horarios cruzados y la incertidumbre de último momento.',
    icon: ClipboardList,
  },
  {
    title: 'Propuesta integral clara en pesos uruguayos',
    text: 'Servicio integral de principio a fin, con etapas y cuotas claras según tu calendario, sin sorpresas ni costos ocultos al acercarse la fecha.',
    icon: Gem,
  },
];

interface AkDifferenceSectionProps {
  imageSrc?: string;
  imageAlt?: string;
  isIllustrativeImage?: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function AkDifferenceSection({
  imageSrc = '/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg',
  imageAlt = 'Equipo de organización AK Producciones',
  isIllustrativeImage = false,
  eyebrow = 'Descanso mental y control',
  title = 'Vos disfrutás el abrazo. Nosotros sostenemos toda la noche.',
  subtitle = 'El verdadero valor de una fiesta completa es llegar sin cansancio ni pendientes. Dejás atrás el estrés de coordinar servicios sueltos para vivir tu celebración presente.',
}: AkDifferenceSectionProps = {}) {
  const reduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-zinc-950 py-20 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_20%,rgba(220,38,38,0.12),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        {/* Left Side: Copy and list */}
        <div className="space-y-8">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-red-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true" />
              <span>{eyebrow}</span>
            </span>
            <h2 className="font-headline text-3xl font-black leading-tight text-white text-balance sm:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-zinc-300 sm:text-lg">
              {subtitle}
            </p>
          </div>

          <motion.div
            variants={reduceMotion ? undefined : containerVariants}
            initial={reduceMotion ? false : 'hidden'}
            whileInView={reduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-80px' }}
            className="space-y-4"
          >
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  variants={reduceMotion ? undefined : itemVariants}
                  whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.2 } }}
                  className="group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_12px_36px_-18px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-all duration-300 hover:border-red-400/35 hover:bg-white/[0.06]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 transition-transform duration-300 motion-safe:group-hover:scale-105">
                    <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-white sm:text-lg">{benefit.title}</h3>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-zinc-300">{benefit.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Side: Single high impact image */}
        <div className="space-y-5">
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/15 bg-zinc-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
            {isIllustrativeImage && (
              <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[11px] font-semibold text-zinc-200 backdrop-blur-sm">
                Imagen ilustrativa
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 drop-shadow-md">
                Equipo real en escena · Salto
              </span>
              <p className="mt-2 text-xl font-black leading-tight text-white drop-shadow-lg sm:text-3xl">
                Personas reales cuidando el clima de tu fiesta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-zinc-200 shadow-lg backdrop-blur-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-400">
              <CalendarCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold leading-relaxed">
              Fecha confirmada, planificación ordenada y un equipo integral a tu lado de principio a fin.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

