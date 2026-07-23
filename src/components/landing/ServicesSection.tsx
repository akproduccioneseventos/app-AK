'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Building2, Calendar, ChevronRight, Crown, Heart, MessageSquare, Sparkles, type LucideIcon, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import { canUseNextImage } from '@/lib/next-image-url';

export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  imageUrl: string;
  imageHint: string;
  accentColor: string;
  emoji: string;
  whatsappMessage?: string;
  icon?: LucideIcon;
  badge?: string;
}

const PARTY_TYPES: Array<{
  title: string;
  icon: LucideIcon;
  desc: string;
  badge: string;
}> = [
  { title: 'Bodas de Gala', icon: Heart, desc: 'Producción integral de ceremonia y recepción con catering gourmet y ambientación.', badge: 'Romántico' },
  { title: 'Fiestas de 15', icon: Crown, desc: 'Pistas robóticas LED, muro interactivo QR y animación pensada para jóvenes.', badge: 'Tendencia' },
  { title: 'Sociales & Cumples', icon: Sparkles, desc: 'Festejos ágiles con barras iluminadas y excelente gastronomía.', badge: 'Diversión' },
  { title: 'Eventos Empresa', icon: Building2, desc: 'Cenas de gala, aniversarios y conferencias con sonido y logística de nivel.', badge: 'Corporativo' },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'bodas',
    title: 'Bodas Inolvidables',
    subtitle: 'Coordinación Total',
    description: 'La tranquilidad absoluta de tener ambientación de gala, banquete gourmet, música y coordinación en vivo con un solo equipo experto.',
    features: ['Coordinador de boda in-situ', 'Catering gourmet & barra de tragos', 'Ambientación, flores y luces de ambiente'],
    imageUrl: '/media/catalogo-servicios/boda_persuasiva.png',
    imageHint: 'wedding ceremony',
    accentColor: 'from-rose-600 to-pink-600',
    emoji: 'AK',
    whatsappMessage: '¡Hola AK Producciones! Quisiera consultar por el paquete de Boda.',
    icon: Heart,
    badge: 'Paz Mental Garantizada',
  },
  {
    id: 'xv-anos',
    title: '15 Años de Vanguardia',
    subtitle: 'Noche Mágica',
    description: 'La fiesta que todos tus amigos van a recordar. Pistas gigantes de luces LED, muro de fotos en pantalla y la mejor música.',
    features: ['Pista robótica de luces LED', 'Muro social interactivo por QR', 'Cabina de recuerdos en vivo'],
    imageUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    imageHint: 'quinceañera party',
    accentColor: 'from-purple-600 to-indigo-600',
    emoji: 'XV',
    whatsappMessage: '¡Hola AK Producciones! Quisiera consultar por el paquete de 15 Años.',
    icon: Crown,
    badge: 'Más Pedido por Jóvenes',
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños & Aniversarios',
    subtitle: 'Festejos Dinámicos',
    description: 'Festejos cargados de energía con discoteca pro, barras móviles temáticas y catering adaptado a tu cantidad de invitados.',
    features: ['Discoteca & sonido de alta fidelidad', 'Barras móviles con coctelería pro', 'Montaje y logística en Salto'],
    imageUrl: '/media/catalogo-servicios/social_persuasivo.png',
    imageHint: 'birthday party lights',
    accentColor: 'from-red-600 to-amber-600',
    emoji: 'AK',
    whatsappMessage: '¡Hola AK Producciones! Quisiera consultar por un Cumpleaños / Evento social.',
    icon: Sparkles,
    badge: '100% Adaptable',
  },
];

interface ServicesSectionProps {
  whatsappNumber?: string;
  services?: ServiceItem[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export function ServicesSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  services,
}: ServicesSectionProps) {
  const displayServices = services && services.length > 0 ? services : DEFAULT_SERVICES;

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 text-white border-y border-white/10">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-red-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-600/5 blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-16 max-w-3xl text-left space-y-4">
          <span className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-red-400 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-red-400" />
            Producción Integral Cero Estrés
          </span>
          <h2 className="font-headline text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
            Todo tu evento resuelto en un solo lugar
          </h2>
          <p className="text-lg leading-relaxed text-zinc-300 font-medium">
            Olvidate de coordinar con diez proveedores por separado. Unificamos gastronomía, música, ambientación y tecnología en propuestas integrales diseñadas para que disfrutes sin preocupaciones.
          </p>
        </div>

        {/* Categorización Emocional (Neuroventas 2026) */}
        <div className="mb-20">
          <div className="mb-8 flex items-center gap-3 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-black text-white">¿Cuál es tu tipo de evento?</h3>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Diseños personalizados según la energía y el público</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
            {PARTY_TYPES.map((party) => {
              const Icon = party.icon;
              return (
                <div
                  key={party.title}
                  className="group rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-red-500/30 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-red-400 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-950/80 border border-red-500/30 px-2 py-0.5 rounded-md">
                      {party.badge}
                    </span>
                  </div>
                  <h4 className="font-headline text-lg font-black text-white group-hover:text-red-400 transition-colors">{party.title}</h4>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-400">{party.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Listado de Servicios con Tarjetas Interactivas 3D */}
        <div>
          <div className="mb-10 text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h3 className="font-headline text-2xl font-black text-white">Servicios Integrales Destacados</h3>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Elegí la base de tu celebración y simulá tu presupuesto en vivo</p>
            </div>
            <Link 
              href="/simulador-de-presupuesto"
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:scale-105 shrink-0"
            >
              <span>Abrir Cotizador Interactivo</span>
              <ArrowRight className="w-3.5 h-3.5 text-red-400" />
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {displayServices.map((service) => {
              const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                service.whatsappMessage || `¡Hola AK Producciones! Me gustaría consultar por el servicio de ${service.title}.`
              )}`;
              const Icon = service.icon;

              return (
                <motion.article
                  key={service.id}
                  variants={cardVariants}
                  className="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-xl shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-red-500/40 hover:shadow-[0_20px_50px_rgba(239,68,68,0.15)] text-left"
                >
                  <div>
                    {/* Header Image Area with Hover Zoom */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                      {canUseNextImage(service.imageUrl) ? (
                        <Image
                          src={service.imageUrl}
                          alt={service.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 30vw"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={service.imageUrl}
                          alt={service.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                      
                      <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 text-white shadow-xl backdrop-blur-md bg-zinc-950/80">
                        {Icon ? <Icon className="h-6 w-6 text-red-400" /> : service.emoji}
                      </div>

                      {/* Emotion Badge */}
                      {service.badge && (
                        <div className="absolute right-5 top-5 rounded-xl bg-red-950/90 border border-red-500/40 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-300 shadow-xl backdrop-blur-md">
                          {service.badge}
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="space-y-4 p-7">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 block">{service.subtitle}</span>
                        <h4 className="mt-1 font-headline text-2xl font-black text-white group-hover:text-red-400 transition-colors">
                          {service.title}
                        </h4>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-zinc-400">
                        {service.description}
                      </p>

                      <div className="pt-2 border-t border-white/5 space-y-2.5">
                        {service.features.map((feat) => (
                          <div key={feat} className="flex items-start gap-2.5 text-xs font-semibold text-zinc-300">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons Row */}
                  <div className="p-7 pt-0 space-y-2">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-800 px-5 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-950/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 border border-red-500/30"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-emerald-300" />
                      <span>Consultar por WhatsApp</span>
                    </a>

                    <Link
                      href={`/simulador-de-presupuesto?servicio=${service.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-300 hover:text-white transition"
                    >
                      <span>Simular Costo Estimado</span>
                      <ChevronRight className="h-3.5 w-3.5 text-red-400" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>

        {/* Value Prop Banner */}
        <div className="mt-20 rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-12 text-left flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Garantía de Satisfacción AK
            </span>
            <h3 className="font-headline font-black text-2xl md:text-3xl text-white">¿Tenés dudas sobre cómo calcular tu banquete o discoteca?</h3>
            <p className="text-sm text-zinc-400 font-medium leading-relaxed">
              Nuestros asesores te arman una cotización en PDF sin compromiso con precios 100% claros y sin sorpresas de último momento.
            </p>
          </div>

          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('¡Hola AK Producciones! Quisiera recibir asesoramiento para mi fiesta.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-emerald-950/40 transition-all hover:scale-105 shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span>Hablar con un Coordinador</span>
          </a>
        </div>

      </div>
    </section>
  );
}
