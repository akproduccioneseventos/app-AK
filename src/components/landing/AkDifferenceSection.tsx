'use client';

import Image from 'next/image';
import { CalendarCheck, ClipboardList, Gem, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  {
    title: 'Organizamos la fiesta por vos',
    text: 'AK coordina salón, servicios, tiempos y proveedores para que tu familia solo se dedique a disfrutar como un invitado más.',
    icon: ClipboardList,
  },
  {
    title: 'Todos los servicios conectados',
    text: 'Decoración, comida, discoteca, fotos y pantallas LED trabajan bajo una misma planificación, evitando fallas de comunicación.',
    icon: Sparkles,
  },
  {
    title: 'Salón y producción integral',
    text: 'Un único presupuesto transparente que cubre todo, desde el salón clásico del Club Uruguay hasta el último detalle de la barra.',
    icon: Gem,
  },
];

export function AkDifferenceSection() {
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section className="overflow-hidden bg-zinc-950 py-24 text-white border-y border-white/5">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 items-center">
        {/* Left Side: Copy and list */}
        <div className="space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">
              ✨ La Experiencia AK
            </span>
            <h2 className="font-headline text-4xl sm:text-5xl font-black text-white leading-tight">
              No vendemos servicios sueltos: resolvemos la fiesta completa
            </h2>
            <p className="mt-5 max-w-xl text-zinc-400 text-lg leading-relaxed">
              El diferencial de AK es que no tenés que perseguir proveedores, comparar presupuestos incompletos ni llegar al día de tu evento con dudas o estrés.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-6"
          >
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  variants={itemVariants}
                  className="flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{benefit.title}</h3>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed font-medium">{benefit.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Side: Single high impact image */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-2xl aspect-[4/3] w-full">
            <Image
              src="/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg"
              alt="Equipo de organización AK Producciones"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 45vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Cero Preocupaciones</span>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-white leading-tight">Personas reales cuidando cada detalle real</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/15 text-indigo-300">
            <CalendarCheck className="h-6 w-6 shrink-0" />
            <p className="text-sm font-semibold leading-relaxed">
              Tranquilidad desde el primer día: fecha, salón, servicios y un plan de pagos claro, todo definido desde la primera reunión.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
