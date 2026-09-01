'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Camera,
  Video,
  Sparkles,
  PhoneCall,
  Tv,
  Smartphone,
  Layers,
  Flame,
  Printer,
  QrCode,
  Heart,
  Music,
  Gamepad2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

export interface TechStationItem {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  highlights: string[];
  features: { icon: React.ElementType; title: string; desc: string }[];
  color: string;
  ctaText: string;
}

const STATIONS: TechStationItem[] = [
  {
    id: 'fotocabina',
    name: 'Fotocabina Digital',
    badge: 'Tiras 2x6 y Fotos 10x15',
    tagline: 'Fotos impresas al instante con el diseño de tu fiesta',
    description:
      'Tus invitados posan, se aplican filtros de belleza y se llevan la tira impresa personalizada en segundos, además de tenerla en digital en su celular por código QR.',
    icon: Camera,
    highlights: ['Impresión térmica rápida', 'Filtro de belleza facial', 'Marcos personalizados', 'QR sin instalar apps'],
    features: [
      { icon: Printer, title: 'Impresión en segundos', desc: 'Tiras dobles clásicas o fotos individuales de recuerdo para cada invitado.' },
      { icon: Sparkles, title: 'Filtros y suavizado', desc: 'Tratamiento de piel en tiempo real para que todos salgan impecables.' },
      { icon: QrCode, title: 'Descarga instantánea', desc: 'Cada tanda genera un QR único para bajar la foto al teléfono al instante.' },
    ],
    color: 'from-pink-500 to-rose-600',
    ctaText: 'Quiero Fotocabina en mi fiesta',
  },
  {
    id: 'plataforma360',
    name: 'Plataforma 360° Video',
    badge: 'Video Dinámico HD',
    tagline: 'Videos espectaculares en cámara lenta con música',
    description:
      'El brazo giratorio captura a tus invitados en 360 grados, aplicando efectos dinámicos de velocidad, música de fiesta y entrega instantánea por QR.',
    icon: Video,
    highlights: ['Efectos slow-motion y reversa', 'Música sincronizada', 'Iluminación profesional', 'Entrega inmediata'],
    features: [
      { icon: Video, title: 'Tomas 360 en cámara lenta', desc: 'Giros fluidos con efectos cinematográficos que se vuelven virales.' },
      { icon: Music, title: 'Canción integrada', desc: 'El video se exporta procesado con el hit de la noche sonando de fondo.' },
      { icon: QrCode, title: 'Listo para historias', desc: 'Formato vertical optimizado para Instagram Reels, TikTok y WhatsApp.' },
    ],
    color: 'from-purple-600 to-indigo-600',
    ctaText: 'Quiero Plataforma 360°',
  },
  {
    id: 'muro',
    name: 'Muro Social en Pantalla Gigante',
    badge: 'Interactivo en Vivo',
    tagline: 'La fiesta entera conectada en la pantalla grande',
    description:
      'Los invitados escanean el QR de su mesa y suben fotos, mandan reacciones voladoras, votan en encuestas en vivo, juegan trivias y le piden temas al DJ.',
    icon: Tv,
    highlights: ['Reacciones voladoras en vivo', 'Juegos y trivias por mesa', 'Pedidos de música al DJ', 'Moderación segura'],
    features: [
      { icon: Flame, title: 'Reacciones y aplausos', desc: 'Corazones, fuegos y aplausos cruzan la pantalla al instante cuando alguien los toca.' },
      { icon: Gamepad2, title: 'Juegos y podio por mesa', desc: 'Trivias de la quinceañera o los novios con ranking interactivo en vivo.' },
      { icon: Music, title: 'Pedidos al DJ', desc: 'Los invitados sugieren sus temas favoritos directamente a la cabina.' },
    ],
    color: 'from-amber-500 to-orange-600',
    ctaText: 'Quiero Pantalla Interactiva',
  },
  {
    id: 'bogue',
    name: 'Bogue Boomerang & GIFs',
    badge: 'Animaciones Cortas',
    tagline: 'Boomerangs divertidos listos para compartir',
    description:
      'Capturas cortas y dinámicas en bucle que capturan la mejor energía de tus invitados para compartir al instante en WhatsApp e Instagram.',
    icon: Sparkles,
    highlights: ['Efecto boomerang en vivo', 'Generación de GIF automática', 'Marcos de la fiesta', 'Descarga rápida'],
    features: [
      { icon: Sparkles, title: 'Movimiento continuo', desc: 'Secuencia de fotos de alta velocidad convertida en animación suave.' },
      { icon: Layers, title: 'GIF listo para WhatsApp', desc: 'El archivo se exporta en formato liviano para mandar directo a los grupos.' },
      { icon: QrCode, title: 'Acceso sin esperas', desc: 'Escanear el QR en la pantalla y el boomerang ya está en tu galería.' },
    ],
    color: 'from-fuchsia-500 to-pink-600',
    ctaText: 'Quiero Bogue Boomerang',
  },
  {
    id: 'buzon',
    name: 'Buzón de Mensajes & Teléfono Retro',
    badge: 'Cápsula del Tiempo',
    tagline: 'Saludos de voz y video que guardás para siempre',
    description:
      'Tus familiares y amigos levantan el auricular del teléfono retro o graban desde la estación para dejarte sus mejores deseos con su propia voz.',
    icon: PhoneCall,
    highlights: ['Teléfono retro interactivo', 'Audio y video de alta calidad', 'Entrega digital al cliente', 'Emotivo e inolvidable'],
    features: [
      { icon: PhoneCall, title: 'Mensajes de voz auténticos', desc: 'El invitado escucha el saludo de los novios o cumpleañero y deja su mensaje al tono.' },
      { icon: Heart, title: 'Emociones genuinas', desc: 'Un recuerdo único e íntimo con las voces de las personas que más querés.' },
      { icon: Layers, title: 'Álbum sonoro final', desc: 'Te entregamos todos los audios compilados para revivirlos cuando quieras.' },
    ],
    color: 'from-emerald-500 to-teal-600',
    ctaText: 'Quiero el Buzón de Recuerdos',
  },
  {
    id: 'invitaciones',
    name: 'Invitaciones Digitales & RSVP',
    badge: 'Web Personalizada',
    tagline: 'Invitaciones interactivas con mapa, cronograma y confirmación',
    description:
      'Diseños modernos y clásicos adaptados a tu estilo, con ubicación GPS con un toque, cuenta regresiva, mesa de regalos con datos bancarios y confirmación por WhatsApp.',
    icon: Smartphone,
    highlights: ['6 estilos de diseño exclusivos', 'Mapa interactivo al salón', 'Confirmación de asistencia online', 'Mesa de regalos segura'],
    features: [
      { icon: Smartphone, title: '100% interactiva', desc: 'Se abre en cualquier celular sin instalar nada, con música de fondo y cuenta regresiva.' },
      { icon: CheckCircle2, title: 'Control de invitados', desc: 'Confirmación de asistencia RSVP en tiempo real para organizar las mesas con facilidad.' },
      { icon: Heart, title: 'Mesa de regalos y datos', desc: 'Información clara de regalos, sugerencias de vestimenta y ubicación del evento.' },
    ],
    color: 'from-sky-500 to-blue-600',
    ctaText: 'Quiero mi Invitación Digital',
  },
];

export function InteractiveTechShowcase({ className }: { className?: string }) {
  const [selectedStation, setSelectedStation] = useState<TechStationItem>(STATIONS[0]);
  const reduceMotion = useReducedMotion();

  const waHref = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `¡Hola! Me interesó la tecnología de ${selectedStation.name} para mi evento. ¿Me pueden pasar info y presupuesto?`
  )}`;

  return (
    <section id="tecnologia" className={cn('py-20 px-4 bg-slate-900 text-white relative overflow-hidden', className)}>
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-pink-600/15 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Tecnología AK Producciones
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Experiencias que hacen tu fiesta inolvidable
          </h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto font-medium text-sm sm:text-base">
            No es sólo equipamiento: es diversión en vivo, recuerdos impresos en el momento y conexión real con cada uno de tus invitados.
          </p>
        </div>

        {/* Station Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 hide-scrollbar justify-start sm:justify-center">
          {STATIONS.map((station) => {
            const Icon = station.icon;
            const isSelected = selectedStation.id === station.id;
            return (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 border',
                  isSelected
                    ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10 scale-105'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-850 hover:text-white'
                )}
              >
                <Icon className={cn('w-4 h-4', isSelected ? 'text-purple-600' : 'text-slate-400')} />
                {station.name}
              </button>
            );
          })}
        </div>

        {/* Featured Station Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStation.id}
            initial={reduceMotion ? false : { opacity: 0, y: 15 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl"
          >
            {/* Left Info Column */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-md bg-white/10 text-slate-200 text-xs font-bold uppercase tracking-wider">
                    {selectedStation.badge}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {selectedStation.name}
                </h3>
                <p className="text-base sm:text-lg font-semibold text-purple-300 mt-1">
                  {selectedStation.tagline}
                </p>
                <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
                  {selectedStation.description}
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {selectedStation.features.map((feat, idx) => {
                  const FeatIcon = feat.icon;
                  return (
                    <div key={idx} className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <FeatIcon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-slate-200">{feat.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{feat.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r shadow-lg transition-all hover:scale-105 active:scale-95',
                    selectedStation.color
                  )}
                >
                  {selectedStation.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/simulador-de-presupuesto"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-slate-300 bg-slate-850 hover:bg-slate-800 hover:text-white border border-slate-700 transition-all"
                >
                  Calcular presupuesto online
                </Link>
              </div>
            </div>

            {/* Right Visual Column / Interactive Preview Box */}
            <div className="lg:col-span-5 flex flex-col justify-center bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className={cn('absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl opacity-20 bg-gradient-to-r', selectedStation.color)} />

              <div className="text-center space-y-4 relative z-10 py-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-white shadow-inner">
                  {React.createElement(selectedStation.icon, { className: 'w-8 h-8 text-purple-400' })}
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white">{selectedStation.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">Equipamiento oficial AK Producciones</p>
                </div>

                {/* Highlights List */}
                <ul className="text-left space-y-2.5 max-w-xs mx-auto pt-4 border-t border-slate-800">
                  {selectedStation.highlights.map((hl, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Disponible en Salto y todo el interior del país
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
