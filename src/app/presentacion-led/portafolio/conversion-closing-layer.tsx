'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MessageCircleQuestion,
  MonitorPlay,
  PartyPopper,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ClosingTopic = {
  id: string;
  question: string;
  shortAnswer: string;
  proof: string;
  imageUrl: string;
  accent: string;
};

type BeforeAfter = {
  before: string;
  after: string;
};

const closingTopics: ClosingTopic[] = [
  {
    id: 'diferencia',
    question: 'Que hace diferente a AK?',
    shortAnswer: 'El prospecto no ve solo una lista de servicios: ve como va a vivir su fiesta completa.',
    proof: 'Se le muestra salon, invitacion, portal, invitados, muro social, pantalla LED y cierre post fiesta en un mismo relato.',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1500&q=82',
    accent: '#dc2626',
  },
  {
    id: 'facil',
    question: 'La gente lo va a poder usar?',
    shortAnswer: 'Si. El recorrido esta pensado primero para celular y para personas que no son tecnicas.',
    proof: 'Invitados y clientes ven acciones simples: confirmar, guardar fecha, mandar mensaje, ver info y participar.',
    imageUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1500&q=82',
    accent: '#16a34a',
  },
  {
    id: 'control',
    question: 'Como se controla la organizacion?',
    shortAnswer: 'El cliente entiende que no depende de memoria, chats sueltos o mensajes perdidos.',
    proof: 'Portal cliente, agenda, tareas, documentos, pagos, invitados y responsables se cuentan como sistema conectado.',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1500&q=82',
    accent: '#2563eb',
  },
  {
    id: 'wow',
    question: 'Donde aparece el efecto wow?',
    shortAnswer: 'En la invitacion, en la pantalla grande, en el muro social y en la forma de presentar todo.',
    proof: 'La tecnologia deja de estar escondida en la app y pasa a verse como parte del valor de la fiesta.',
    imageUrl: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1500&q=82',
    accent: '#7c3aed',
  },
];

const beforeAfterItems: BeforeAfter[] = [
  {
    before: 'El prospecto recibe precios y fotos sueltas por WhatsApp.',
    after: 'El prospecto ve una experiencia completa, ordenada y emocionante.',
  },
  {
    before: 'La familia imagina la fiesta con dudas.',
    after: 'La familia mira invitacion, portal, invitados, muro y pantalla como si ya estuviera ocurriendo.',
  },
  {
    before: 'La tecnologia queda escondida dentro de la app.',
    after: 'La tecnologia se transforma en argumento de venta y en confianza.',
  },
  {
    before: 'Se habla de costo demasiado rapido.',
    after: 'Primero se construye deseo, claridad y valor; despues se habla del presupuesto.',
  },
];

const closeSignals = [
  { label: 'Confianza', text: 'Todo se ve claro y ordenado.', icon: ShieldCheck },
  { label: 'Emocion', text: 'El cliente se imagina su fiesta.', icon: Sparkles },
  { label: 'Control', text: 'Sabe que AK lo acompana.', icon: CalendarCheck },
  { label: 'Wow', text: 'La tecnologia se vuelve visible.', icon: MonitorPlay },
];

function colorWithAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ConversionClosingLayer() {
  const [activeId, setActiveId] = useState(closingTopics[0].id);

  const activeTopic = useMemo(
    () => closingTopics.find((topic) => topic.id === activeId) ?? closingTopics[0],
    [activeId],
  );

  return (
    <section id="cierre-comercial" className="bg-white py-20 text-slate-950 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-700">
              <HeartHandshake className="h-3.5 w-3.5" />
              Cierre del prospecto
            </span>
            <h2 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              Esta pantalla tiene que vender la decision, no solo mostrar tecnologia.
            </h2>
          </div>
          <p className="max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
            El objetivo es que la persona diga: “con AK mi fiesta se ve mas clara, mas moderna y mas tranquila”. Por eso el portafolio cierra con valor, confianza y una comparacion simple entre organizar a mano y organizar con una experiencia AK.
          </p>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-[430px_1fr]">
          <div className="grid gap-3">
            {closingTopics.map((topic, index) => {
              const isActive = topic.id === activeId;
              return (
                <motion.button
                  key={topic.id}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.32, delay: index * 0.04 }}
                  onClick={() => setActiveId(topic.id)}
                  className={cn(
                    'rounded-3xl border bg-white p-5 text-left transition',
                    isActive ? 'border-red-500 shadow-2xl shadow-red-950/10' : 'border-slate-200 hover:border-red-200 hover:bg-red-50/40',
                  )}
                  style={isActive ? { boxShadow: `0 26px 80px ${colorWithAlpha(topic.accent, 0.16)}` } : undefined}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: topic.accent }}>
                      <MessageCircleQuestion className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-base font-black text-slate-950">{topic.question}</span>
                      <span className="mt-2 block text-sm font-semibold leading-6 text-slate-600">{topic.shortAnswer}</span>
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTopic.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-950/20"
            >
              <div className="grid min-h-[560px] lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[360px] overflow-hidden">
                  <Image
                    src={activeTopic.imageUrl}
                    alt={activeTopic.question}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    unoptimized
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.84)_100%)]" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Argumento de venta</p>
                    <h3 className="mt-2 max-w-xl text-4xl font-black leading-none sm:text-5xl">{activeTopic.question}</h3>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-8 p-6 text-white sm:p-8">
                  <div>
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                        <Star className="h-5 w-5 text-red-200" />
                      </span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50">Respuesta clara</p>
                        <p className="text-sm font-bold text-white/80">Para usar en la reunion comercial</p>
                      </div>
                    </div>
                    <p className="text-2xl font-black leading-tight">{activeTopic.shortAnswer}</p>
                    <p className="mt-5 text-base font-medium leading-8 text-white/70">{activeTopic.proof}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {closeSignals.map((signal) => {
                      const Icon = signal.icon;
                      return (
                        <div key={signal.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <Icon className="h-5 w-5 text-red-200" />
                          <p className="mt-3 text-sm font-black">{signal.label}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-white/60">{signal.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Clock3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Antes</p>
                <h3 className="text-xl font-black text-slate-950">Venta comun de eventos</h3>
              </div>
            </div>
            <div className="grid gap-3">
              {beforeAfterItems.map((item) => (
                <div key={item.before} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-600">
                  {item.before}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 shadow-2xl shadow-red-950/10 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white">
                <Wand2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-700">Con AK</p>
                <h3 className="text-xl font-black text-slate-950">Venta por experiencia</h3>
              </div>
            </div>
            <div className="grid gap-3">
              {beforeAfterItems.map((item) => (
                <div key={item.after} className="flex gap-3 rounded-2xl border border-red-100 bg-white p-4 text-sm font-bold leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  {item.after}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.82fr]">
            <div className="p-6 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-200">
                <PartyPopper className="h-3.5 w-3.5" />
                Frase de cierre
              </span>
              <h3 className="mt-6 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
                “No solo organizamos tu fiesta: hacemos que tu familia, tus invitados y vos la vivan desde antes.”
              </h3>
              <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-white/70">
                Ese es el mensaje que tiene que quedar cuando el prospecto termina de mirar el portafolio. La tecnologia se convierte en tranquilidad, emocion y diferenciacion.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/presentacion-led" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-red-50">
                  Abrir presentacion
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#mapa" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10">
                  Ver mapa de servicios
                  <Users className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="relative min-h-[360px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1500&q=82"
                alt="Cierre de fiesta AK"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.74)_0%,rgba(15,23,42,0.08)_100%)]" />
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <Smartphone className="h-5 w-5 text-red-200" />
                  <p className="mt-3 text-sm font-black">Celular primero</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <MonitorPlay className="h-5 w-5 text-red-200" />
                  <p className="mt-3 text-sm font-black">LED preparado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
