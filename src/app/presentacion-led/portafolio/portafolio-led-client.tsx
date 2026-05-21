'use client';

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Gift,
  Heart,
  ImagePlus,
  Laptop,
  LayoutGrid,
  Mail,
  Map,
  Monitor,
  Music,
  Palette,
  PartyPopper,
  Play,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Tv,
  Users,
  Utensils,
  Wand2,
  Wine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEVICE_PRESETS,
  HERO_IMAGES,
  LED_CLIENT_DECISION_SCENES,
  LED_SALES_IMPACT_STATS,
  INVITATION_TEMPLATES,
  LED_SALES_STORYLINE,
  LED_TECHNOLOGY_PACKAGES,
  SERVICE_MAP,
  TECHNOLOGY_STEPS,
  type DeviceMode,
  type PortfolioIcon,
  type PortfolioPhase,
} from '@/lib/portfolio-experience/portfolio-experience-data';

type DemoEvent = {
  tipo: string;
  protagonista: string;
  fecha: string;
  invitados: string;
};

const iconComponents: Record<PortfolioIcon, LucideIcon> = {
  salon: Map,
  decoracion: Palette,
  catering: Utensils,
  barra: Wine,
  musica: Music,
  fotoVideo: Camera,
  invitacion: Mail,
  portalCliente: LayoutGrid,
  portalInvitado: Users,
  muroSocial: Share2,
  pantallaLed: Tv,
  zonaDigital: Sparkles,
  fotocabina: Camera,
  plataforma360: Play,
  espejoMagico: Wand2,
  totems: Smartphone,
  audioRitmico: Music,
  coordinacion: CheckCircle2,
  agenda: CalendarDays,
  postFiesta: Gift,
};

const deviceIcons: Record<DeviceMode, LucideIcon> = {
  led: Monitor,
  desktop: Laptop,
  tablet: Tablet,
  mobile: Smartphone,
};

const phaseLabels: PortfolioPhase[] = ['Antes', 'Durante', 'Despues'];

function colorWithAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ImagePanel({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn('h-full w-full object-cover', className)}
    />
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-700 shadow-sm">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

export function PortafolioLedClient() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('led');
  const [selectedServiceId, setSelectedServiceId] = useState(SERVICE_MAP[0].id);
  const [activeStepId, setActiveStepId] = useState(TECHNOLOGY_STEPS[0].id);
  const [activeSceneId, setActiveSceneId] = useState(LED_CLIENT_DECISION_SCENES[0].id);
  const [demo, setDemo] = useState<DemoEvent>({
    tipo: 'XV anos',
    protagonista: 'Valentina',
    fecha: '15 de noviembre',
    invitados: '150',
  });

  const activeDevice = useMemo(
    () => DEVICE_PRESETS.find((preset) => preset.id === deviceMode) ?? DEVICE_PRESETS[0],
    [deviceMode],
  );

  const selectedService = useMemo(
    () => SERVICE_MAP.find((service) => service.id === selectedServiceId) ?? SERVICE_MAP[0],
    [selectedServiceId],
  );

  const activeStep = useMemo(
    () => TECHNOLOGY_STEPS.find((step) => step.id === activeStepId) ?? TECHNOLOGY_STEPS[0],
    [activeStepId],
  );

  const activeScene = useMemo(
    () => LED_CLIENT_DECISION_SCENES.find((scene) => scene.id === activeSceneId) ?? LED_CLIENT_DECISION_SCENES[0],
    [activeSceneId],
  );

  const serviceCounts = useMemo(() => ({
    Antes: SERVICE_MAP.filter((service) => service.phase === 'Antes').length,
    Durante: SERVICE_MAP.filter((service) => service.phase === 'Durante').length,
    Despues: SERVICE_MAP.filter((service) => service.phase === 'Despues').length,
  }), []);

  const isSmallDevice = deviceMode === 'mobile' || deviceMode === 'tablet';
  const protagonist = demo.protagonista.trim() || 'Valentina';
  const eventType = demo.tipo.trim() || 'XV anos';
  const eventDate = demo.fecha.trim() || '15 de noviembre';
  const guestCount = demo.invitados.trim() || '150';

  const selectedStyle: CSSProperties = {
    borderColor: selectedService.accent,
    boxShadow: `0 24px 70px ${colorWithAlpha(selectedService.accent, 0.18)}`,
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/presentacion-led" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-900/20">
              <PartyPopper className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.24em] text-slate-950">AK Producciones</span>
              <span className="hidden text-xs font-semibold text-slate-500 sm:block">Portafolio de experiencia tecnologica</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {['Impacto', 'Mapa', 'Vendedor', 'Experiencia', 'Invitaciones'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500 transition hover:bg-red-50 hover:text-red-700"
              >
                {item}
              </a>
            ))}
          </nav>

          <Link
            href="/presentacion-led"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-slate-900/20 transition hover:bg-red-700"
          >
            Presentacion
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,#fff1f2_0%,rgba(255,255,255,0)_100%)]" />
        <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1600px] items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-10 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <SectionEyebrow>Venta visual para clientes</SectionEyebrow>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl xl:text-7xl">
              Una plataforma de venta para que el cliente vea, entienda y quiera su fiesta.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
              Un showroom comercial adaptable para pantalla gigante, PC, tablet y celular. Usa fotos de ejemplo reemplazables, movimiento y un recorrido claro por toda la tecnologia que AK entrega antes, durante y despues del evento.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {phaseLabels.map((phase) => (
                <div key={phase} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-3xl font-black text-slate-950">{serviceCounts[phase]}</span>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{phase}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Vista adaptable</p>
                <p className="text-sm font-semibold text-slate-500">La misma idea cambia segun la pantalla.</p>
              </div>
              <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                {DEVICE_PRESETS.map((preset) => {
                  const Icon = deviceIcons[preset.id];
                  const isActive = preset.id === deviceMode;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setDeviceMode(preset.id)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full transition sm:w-auto sm:px-4',
                        isActive ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
                      )}
                      title={preset.label}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="ml-2 hidden text-xs font-black uppercase tracking-[0.12em] sm:inline">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={cn('mx-auto rounded-[2.5rem] border border-slate-200 bg-slate-950 p-2 shadow-2xl shadow-slate-950/20', activeDevice.frameClassName)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={deviceMode}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35 }}
                  className={cn('relative h-full w-full overflow-hidden bg-white', activeDevice.screenClassName)}
                >
                  <div className="absolute inset-0">
                    <ImagePanel src={HERO_IMAGES[0]} alt="Fiesta AK de ejemplo" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.82)_0%,rgba(15,23,42,0.48)_42%,rgba(220,38,38,0.18)_100%)]" />
                  </div>

                  <div className={cn('relative z-10 grid h-full gap-4 p-5 text-white sm:p-7', isSmallDevice ? 'grid-cols-1 content-between' : 'grid-cols-[1.1fr_0.9fr] items-end')}>
                    <div className="max-w-2xl">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur">
                        <Play className="h-3 w-3" />
                        Demo en vivo
                      </span>
                      <h2 className={cn('mt-4 font-black leading-none', deviceMode === 'mobile' ? 'text-3xl' : 'text-5xl xl:text-7xl')}>
                        {eventType} de {protagonist}
                      </h2>
                      <p className={cn('mt-4 max-w-xl font-medium text-white/80', deviceMode === 'mobile' ? 'text-sm leading-6' : 'text-lg leading-8')}>
                        Invitacion, portal, invitados, muro social y pantalla LED unidos en una sola experiencia visual.
                      </p>
                    </div>

                    <div className={cn('grid gap-3', isSmallDevice ? 'grid-cols-1' : 'grid-cols-2')}>
                      {TECHNOLOGY_STEPS.slice(0, isSmallDevice ? 3 : 4).map((step) => (
                        <div key={step.id} className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">{step.eyebrow}</p>
                          <p className="mt-1 text-sm font-black leading-tight">{step.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-3 text-center text-xs font-bold text-slate-500">{activeDevice.description}</p>
          </motion.div>
        </div>
      </section>

      <section id="impacto" className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div className="absolute inset-0">
          <ImagePanel src={HERO_IMAGES[1]} alt="Showroom comercial AK" className="opacity-28" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(220,38,38,0.32),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.22),transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.90))]" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-10 xl:grid-cols-[0.72fr_1.28fr] xl:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-100 backdrop-blur">
                <Star className="h-3.5 w-3.5" />
                Plataforma de venta espectacular
              </span>
              <h2 className="mt-5 text-4xl font-black leading-none tracking-tight sm:text-6xl">
                La reunion tiene que sentirse como entrar a la fiesta antes de contratarla.
              </h2>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white/68">
                La pantalla LED debe hacer tres cosas a la vez: emocionar, explicar y cerrar. Por eso la tecnologia se presenta como una experiencia visible, con paquetes activables y una ruta comercial clara.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {LED_SALES_IMPACT_STATS.map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4 }}
                  className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-xl"
                  style={{ boxShadow: `0 24px 70px ${colorWithAlpha(stat.accent, 0.16)}` }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/48">{stat.label}</p>
                  <p className="mt-3 text-4xl font-black leading-none" style={{ color: stat.accent }}>{stat.value}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-white/62">{stat.copy}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-[430px_1fr]">
            <div className="grid gap-3">
              {LED_CLIENT_DECISION_SCENES.map((scene, index) => {
                const isActive = scene.id === activeSceneId;
                return (
                  <motion.button
                    key={scene.id}
                    type="button"
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    onClick={() => setActiveSceneId(scene.id)}
                    className={cn(
                      'group rounded-[1.75rem] border p-4 text-left transition',
                      isActive ? 'border-white/35 bg-white text-slate-950' : 'border-white/10 bg-white/10 text-white hover:border-white/25 hover:bg-white/15',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ backgroundColor: scene.accent }}>
                        {index + 1}
                      </span>
                      <span>
                        <span className={cn('text-[10px] font-black uppercase tracking-[0.18em]', isActive ? 'text-slate-400' : 'text-white/45')}>{scene.eyebrow}</span>
                        <span className="mt-1 block text-base font-black leading-tight">{scene.title}</span>
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.article
                key={activeScene.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.34 }}
                className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white text-slate-950 shadow-2xl shadow-black/30"
              >
                <div className="grid min-h-[520px] lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="relative min-h-[320px] overflow-hidden">
                    <ImagePanel src={activeScene.imageUrl} alt={activeScene.title} className="transition duration-700" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.74)_100%)]" />
                    <div className="absolute left-6 right-6 top-6 flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">Demo comercial</span>
                      <span className="rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: activeScene.accent }}>AK Experience</span>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">{activeScene.eyebrow}</p>
                      <h3 className="mt-2 max-w-3xl text-4xl font-black leading-none sm:text-5xl">{activeScene.title}</h3>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-6 sm:p-8">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: activeScene.accent }}>Frase de venta</p>
                      <blockquote className="mt-4 border-l-4 pl-5 text-3xl font-black leading-tight text-slate-950" style={{ borderColor: activeScene.accent }}>
                        &quot;{activeScene.sellerLine}&quot;
                      </blockquote>
                      <p className="mt-5 text-base font-medium leading-8 text-slate-600">{activeScene.description}</p>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {activeScene.bullets.map((bullet) => (
                        <div key={bullet} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <CheckCircle2 className="h-5 w-5" style={{ color: activeScene.accent }} />
                          <p className="mt-3 text-sm font-black uppercase tracking-[0.12em] text-slate-700">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section id="mapa" className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <SectionEyebrow>Mapa semantico de fiesta</SectionEyebrow>
              <h2 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Todo lo que necesita una fiesta, conectado en un solo recorrido.
              </h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-7 text-slate-600">
              Cada nodo se puede tocar. La idea es que el cliente no vea una lista fria, sino una experiencia completa que empieza con la invitacion y termina con recuerdos.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
            <div className="grid gap-5 lg:grid-cols-3">
              {phaseLabels.map((phase) => (
                <div key={phase} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-950">{phase}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      {serviceCounts[phase]} piezas
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {SERVICE_MAP.filter((service) => service.phase === phase).map((service) => {
                      const Icon = iconComponents[service.icon];
                      const isActive = selectedServiceId === service.id;
                      return (
                        <motion.button
                          key={service.id}
                          type="button"
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedServiceId(service.id)}
                          className={cn(
                            'group flex min-h-[86px] items-start gap-3 rounded-2xl border bg-white p-3 text-left transition',
                            isActive ? 'border-red-500' : 'border-slate-200 hover:border-red-200 hover:bg-red-50/40',
                          )}
                          style={isActive ? selectedStyle : undefined}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: service.accent }}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-black text-slate-950">{service.title}</span>
                            <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{service.tagline}</span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <aside className="xl:sticky xl:top-28 xl:self-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedService.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <ImagePanel src={selectedService.imageUrl} alt={selectedService.title} />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(15,23,42,0.74)_100%)]" />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Foto de ejemplo reemplazable</p>
                      <h3 className="mt-2 text-3xl font-black leading-none">{selectedService.title}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-lg font-black leading-7 text-slate-950">{selectedService.tagline}</p>
                    <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{selectedService.details}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{selectedService.phase}</span>
                      <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-700">Conectado</span>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 ring-1 ring-slate-200">Adaptable</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </aside>
          </div>
        </div>
      </section>

      <section id="vendedor" className="relative overflow-hidden bg-white py-20 sm:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-200 to-transparent" />
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
            <div>
              <SectionEyebrow>Vendedor de tecnologia</SectionEyebrow>
              <h2 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
                La pantalla LED no vende una lista: vende una experiencia AK por paquetes.
              </h2>
            </div>
            <p className="max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
              El recorrido recomendado es simple: primero se muestra el wow visual, despues el mapa completo de la fiesta,
              luego la tecnologia como producto y al final se cierra con lo elegido para presupuesto o reunion.
            </p>
          </div>

          <div className="mt-12 grid gap-5 xl:grid-cols-5">
            {LED_SALES_STORYLINE.map((step, index) => (
              <motion.article
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white" style={{ backgroundColor: step.accent }}>
                  {index + 1}
                </div>
                <h3 className="mt-5 text-xl font-black leading-tight text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{step.goal}</p>
                <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Como mostrarlo</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{step.howToShow}</p>
                </div>
                <p className="mt-4 text-xs font-bold leading-5 text-slate-500">{step.proof}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-12 rounded-[2.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Que se vende</p>
                <h3 className="mt-4 text-3xl font-black leading-none sm:text-4xl">Paquetes de tecnologia activables</h3>
                <p className="mt-4 text-sm font-medium leading-7 text-white/65">
                  Esto evita prometer cosas sueltas. Si una fiesta no contrato fotocabina, 360 o barra tecnologica,
                  el vendedor lo apaga del paquete y la pantalla conserva una historia coherente.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {LED_TECHNOLOGY_PACKAGES.map((pack) => (
                  <motion.article
                    key={pack.id}
                    whileHover={{ y: -4 }}
                    className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur"
                    style={{ boxShadow: `0 20px 60px ${colorWithAlpha(pack.accent, 0.12)}` }}
                  >
                    <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white" style={{ backgroundColor: pack.accent }}>
                      Producto
                    </span>
                    <h4 className="mt-4 text-xl font-black leading-tight">{pack.title}</h4>
                    <p className="mt-2 text-sm font-bold leading-6 text-red-100">{pack.sellAs}</p>
                    <p className="mt-3 text-sm font-medium leading-6 text-white/62">{pack.clientValue}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {pack.includes.map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
                          {item}
                        </span>
                      ))}
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="experiencia" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[420px_1fr]">
            <div>
              <SectionEyebrow>Bosquejo personalizado</SectionEyebrow>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Asi vive el cliente la tecnologia de AK.
              </h2>
              <p className="mt-5 text-base font-medium leading-7 text-slate-600">
                Cambias los datos de ejemplo y la pantalla muestra un recorrido de la experiencia: invitacion, portal del cliente, invitados, muro social, LED y cierre post fiesta.
              </p>

              <div className="mt-7 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Tipo de fiesta
                  <input
                    value={demo.tipo}
                    onChange={(event) => setDemo((current) => ({ ...current, tipo: event.target.value }))}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold normal-case tracking-normal text-slate-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                </label>
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Nombre protagonista
                  <input
                    value={demo.protagonista}
                    onChange={(event) => setDemo((current) => ({ ...current, protagonista: event.target.value }))}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold normal-case tracking-normal text-slate-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Fecha
                    <input
                      value={demo.fecha}
                      onChange={(event) => setDemo((current) => ({ ...current, fecha: event.target.value }))}
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold normal-case tracking-normal text-slate-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Invitados
                    <input
                      value={demo.invitados}
                      onChange={(event) => setDemo((current) => ({ ...current, invitados: event.target.value }))}
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold normal-case tracking-normal text-slate-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_430px]">
              <div className="grid gap-4 md:grid-cols-2">
                {TECHNOLOGY_STEPS.map((step, index) => {
                  const isActive = activeStepId === step.id;
                  return (
                    <motion.button
                      key={step.id}
                      type="button"
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                      onClick={() => setActiveStepId(step.id)}
                      className={cn(
                        'overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition',
                        isActive ? 'border-red-500 shadow-xl shadow-red-900/10' : 'border-slate-200 hover:border-red-200 hover:shadow-lg hover:shadow-slate-950/10',
                      )}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <ImagePanel src={step.imageUrl} alt={step.title} />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.66)_100%)]" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{step.eyebrow}</p>
                          <h3 className="mt-1 text-xl font-black leading-tight">{step.title}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-semibold leading-6 text-slate-600">{step.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.aside
                  key={activeStep.id}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.32 }}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/20"
                >
                  <div className="relative aspect-[9/13] overflow-hidden">
                    <ImagePanel src={activeStep.imageUrl} alt={activeStep.title} />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18)_0%,rgba(15,23,42,0.88)_100%)]" />
                    <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur">Vista cliente</span>
                      <Heart className="h-5 w-5 text-red-300" />
                    </div>
                    <div className="absolute inset-x-5 bottom-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">{activeStep.eyebrow}</p>
                      <h3 className="mt-2 text-4xl font-black leading-none">{eventType}</h3>
                      <p className="mt-2 text-xl font-black text-red-200">{protagonist}</p>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                          <Clock className="h-4 w-4 text-red-200" />
                          <p className="mt-2 text-xs font-black">{eventDate}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                          <Users className="h-4 w-4 text-red-200" />
                          <p className="mt-2 text-xs font-black">{guestCount} invitados</p>
                        </div>
                      </div>
                      <p className="mt-5 text-sm font-medium leading-6 text-white/70">{activeStep.description}</p>
                    </div>
                  </div>
                </motion.aside>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section id="invitaciones" className="bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-200">
                <ImagePlus className="h-3.5 w-3.5" />
                Invitaciones con fotos de ejemplo
              </span>
              <h2 className="mt-5 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
                Plantillas listas para vender la idea y despues reemplazar las fotos.
              </h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-7 text-white/70">
              Cada modelo ya muestra estilo, portada, tono y experiencia. Cuando tengas fotos reales, se sustituyen sin cambiar la estructura.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {INVITATION_TEMPLATES.map((template, index) => (
              <motion.article
                key={template.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl shadow-black/20"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <ImagePanel src={template.imageUrl} alt={template.title} className="transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.72)_100%)]" />
                  <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                    <span className="rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur">Demo</span>
                    <Star className="h-5 w-5" style={{ color: template.accent }} />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-3xl font-black leading-none">{template.title}</h3>
                    <p className="mt-2 text-sm font-bold text-white/80">{template.mood}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm font-medium leading-6 text-white/70">{template.description}</p>
                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Foto reemplazable</span>
                    <Wand2 className="h-4 w-4 text-red-200" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
