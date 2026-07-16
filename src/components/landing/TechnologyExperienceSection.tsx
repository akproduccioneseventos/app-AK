'use client';

import Link from 'next/link';
import {
  Bot,
  LayoutDashboard,
  Smartphone,
  Ticket,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import { cn } from '@/lib/utils';

interface TechnologyExperienceSectionProps {
  whatsappNumber?: string;
}

const techFeatures = [
  {
    icon: Smartphone,
    title: 'Portal de Cliente Exclusivo',
    description: 'Gestioná tu presupuesto, firmá contratos digitales, coordiná tareas y visualizá el plano de mesas interactivo en un solo panel de control.',
  },
  {
    icon: Ticket,
    title: 'Invitación Web Inteligente',
    description: 'Códigos QR para control de acceso, confirmación de asistencia en tiempo real, mapa, código de vestimenta y selección de menú especial.',
  },
  {
    icon: LayoutDashboard,
    title: 'Muro Social en Vivo',
    description: 'Permití que tus invitados suban fotos y dedicatorias desde sus celulares directamente a la pantalla gigante del salón durante la fiesta.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export default function TechnologyExperienceSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
}: TechnologyExperienceSectionProps) {
  const reduceMotion = useReducedMotion();
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola! Me interesa saber más sobre la tecnología interactiva incluida en las fiestas.',
  )}`;

  return (
    <section
      id="tecnologia"
      className="relative overflow-hidden bg-zinc-950 py-24 text-white border-b border-white/5"
    >
      {/* Decorative Blur Overlays */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 h-96 w-96 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Column Left: Copy & Details */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="max-w-3xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-400 backdrop-blur">
                <Bot className="h-3.5 w-3.5 text-red-500" />
                Tecnología Exclusiva
              </span>
              <h2 className="font-headline text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
                Fiestas modernas e interactivas
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-zinc-400 font-medium">
                La tecnología no debe complicar, debe asombrar y organizar. Te ofrecemos un ecosistema digital integrado a tu paquete de servicios para que planificar sea un disfrute y tus invitados vivan una fiesta inolvidable.
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
                    className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.01] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-white/[0.03] shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/10 text-red-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white font-headline">{feature.title}</h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-400">{feature.description}</p>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>

            {/* Bottom mini-banner */}
            <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-md sm:flex-row sm:items-center">
              <div className="max-w-md">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  Todo incluido sin costos extras
                </h3>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
                  Desarrollamos esta app a medida para que gestiones todo de forma digital, sin cargos sorpresa ni intermediarios.
                </p>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-red-700 px-6 text-xs font-bold text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:bg-red-800"
                ><Link href="/simulador-de-presupuesto" className="w-full sm:w-auto">Probar simulador</Link></Button>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full rounded-2xl border-white/10 bg-white/5 px-6 text-xs font-bold text-white transition-all duration-200 hover:bg-white/10"
                  >
                    Consultar ahora
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Column Right: Perspective Interactive CSS mockup */}
          <div className="lg:col-span-6 relative h-[480px] w-full flex items-center justify-center">
            
            {/* Live Salon Screen Mockup (Muro Social) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="relative w-full aspect-[4/3] rounded-[2.5rem] border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-2xl p-6 flex flex-col justify-between"
            >
              {/* Screen Top Status bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  🔴 Pantalla del salón en vivo
                </span>
                <span className="text-[9px] font-black uppercase text-red-400 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded">
                  Muro Social QR
                </span>
              </div>

              {/* Chat dedicatories */}
              <div className="space-y-4 my-4 flex-1 flex flex-col justify-end">
                <div className="flex items-start gap-2.5 max-w-[80%] text-left">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-[10px] font-black text-white">M</div>
                  <div className="rounded-2xl rounded-tl-none bg-white/5 border border-white/10 p-3 text-xs">
                    <p className="font-bold text-red-300">María José</p>
                    <p className="text-zinc-300 mt-0.5">¡Qué fotón! Te queremos Vale 📸✨</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5 max-w-[85%] self-end flex-row-reverse text-right">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-[10px] font-black text-white">S</div>
                  <div className="rounded-2xl rounded-tr-none bg-red-600/10 border border-red-500/20 p-3 text-xs text-left">
                    <p className="font-bold text-emerald-400">Seba & Belén</p>
                    <p className="text-zinc-300 mt-0.5">¡La pista está prendida fuego! Qué temazo Dj 🔥💃</p>
                  </div>
                </div>
              </div>

              {/* Screen footer */}
              <div className="text-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                Escaneá el QR de tu mesa para enviar tu mensaje
              </div>
            </motion.div>

            {/* Client Mobile Portal Mockup (Smartphone floating) */}
            <motion.div
              initial={{ opacity: 0, y: 35, rotate: -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: -4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.25 }}
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              style={{ originX: 0.5, originY: 0.5 }}
              className="absolute right-4 bottom-0 w-[230px] h-[400px] rounded-[2.25rem] border border-white/20 bg-zinc-950 shadow-2xl backdrop-blur-xl overflow-hidden p-5 hidden sm:flex flex-col justify-between"
            >
              {/* Smartphone Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-zinc-900 border border-white/5 z-30" />
              
              {/* Inner Portal App Header */}
              <div className="pt-3 border-b border-white/5 pb-3">
                <span className="text-[8px] font-black uppercase text-zinc-500 block">Mi portal de evento</span>
                <span className="text-xs font-black text-white font-headline mt-0.5 block">Hola María José 👋</span>
              </div>

              {/* App Checklist */}
              <div className="flex-1 py-4 space-y-3.5 text-left">
                <span className="text-[7px] font-black uppercase tracking-wider text-zinc-600">Tareas de planificación</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[9px] font-bold text-zinc-300">Menú seleccionado</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[9px] font-bold text-zinc-300">Discoteca y Playlist</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="text-[9px] font-bold text-white">Falta: Distribución de mesas</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[7px] font-black text-zinc-500">
                    <span>Avance de la Fiesta</span>
                    <span className="text-red-400">75%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-red-600 to-rose-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* App Footer bar */}
              <div className="border-t border-white/5 pt-2 flex items-center justify-between text-zinc-600">
                <span className="text-[7px] font-black">Plan: Premium</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}
