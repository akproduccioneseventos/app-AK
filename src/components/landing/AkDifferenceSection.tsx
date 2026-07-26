'use client';

import Image from 'next/image';
import { CalendarCheck, ClipboardList, Gem, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  {
    title: 'Disfrutá, nosotros nos encargamos',
    text: 'AK coordina el salón, los tiempos, el staff y los detalles para que tu única responsabilidad sea divertirte como un invitado más.',
    icon: ClipboardList,
  },
  {
    title: 'Cero sorpresas ni intermediarios',
    text: 'Desde la gastronomía gourmet hasta la discoteca y pantallas LED, todo funciona bajo una misma visión integral. Menos proveedores, cero fallas.',
    icon: Sparkles,
  },
  {
    title: 'Presupuesto claro y completo',
    text: 'Un precio transparente que cubre todo lo que realmente necesitás, sin costos ocultos de último momento ni dolores de cabeza.',
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
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-red-400 mb-4 backdrop-blur">
              ✨ El Valor de la Tranquilidad
            </span>
            <h2 className="font-headline text-4xl sm:text-5xl font-black text-white leading-tight">
              No vendemos luces ni sonido: diseñamos tu tranquilidad
            </h2>
            <p className="mt-5 max-w-xl text-zinc-400 text-lg leading-relaxed font-medium">
              El verdadero lujo es llegar al día de tu evento sin estrés. Olvidate de perseguir proveedores o comparar presupuestos incompletos.
            </p>
          </div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-5"
          >
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  variants={itemVariants}
                  className="flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300 group backdrop-blur-sm"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{benefit.title}</h3>
                    <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed font-medium">{benefit.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Side: Single high impact image */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-900 shadow-2xl aspect-[4/3] w-full">
            <Image
              src="/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg"
              alt="Equipo de organización AK Producciones"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 45vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 drop-shadow-md">Seguridad Absoluta</span>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-lg">Personas reales cuidando cada detalle</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-zinc-300 backdrop-blur-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <CalendarCheck className="h-5 w-5 shrink-0" />
            </div>
            <p className="text-sm font-semibold leading-relaxed">
              Reserva de fecha garantizada, plan de pagos claro y un equipo entero a tu disposición.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

