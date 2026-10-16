'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
  Monitor,
  Film,
  Smile,
  Bot,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

export type TechCategory = 'visual' | 'emocion' | 'pista';

export interface TechStationItem {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  highlights: string[];
  features: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; title: string; desc: string }[];
  color: string;
  ctaText: string;
  category: TechCategory;
  serviceId?: string;
  isAiDemo?: boolean;
}

export const TECH_CATEGORIES: { id: TechCategory; label: string; shortLabel: string; desc: string }[] = [
  {
    id: 'visual',
    label: 'Impacto visual y viral',
    shortLabel: 'Visual y viral',
    desc: 'Fotos, videos 360 y efectos IA',
  },
  {
    id: 'emocion',
    label: 'Emoción y recuerdos',
    shortLabel: 'Emoción y recuerdos',
    desc: 'Voces, historias y afectos',
  },
  {
    id: 'pista',
    label: 'Interacción en pista',
    shortLabel: 'Interacción en pista',
    desc: 'Pantallas, QR y participación en vivo',
  },
];

const STATIONS: TechStationItem[] = [
  // 1. Impacto visual y viral
  {
    id: 'totemTouchIA',
    name: 'Tótem Touch IA',
    badge: 'Exclusivo con IA',
    tagline: 'Transforma la foto del invitado en personajes y estilos con inteligencia artificial',
    description:
      'Tus invitados posan frente a la pantalla táctil y el sistema de IA los convierte en superhéroes, personajes temáticos o retratos artísticos al instante, listos para descargar por QR o imprimir.',
    icon: Bot,
    highlights: ['Transformación facial con IA', 'Temas y personajes de fiesta', 'Descarga por código QR', 'Impresión opcional en el acto'],
    features: [
      { icon: Sparkles, title: 'Estilos IA automáticos', desc: 'Convierte retratos en héroes, realeza o arte digital en segundos.' },
      { icon: Smile, title: 'Fácil para todas las edades', desc: 'Tocan la pantalla, sonríen y el tótem hace la magia.' },
      { icon: QrCode, title: 'Descarga instantánea', desc: 'Cada invitado se lleva su retrato digital directamente al celular.' },
    ],
    color: 'from-fuchsia-600 to-indigo-600',
    ctaText: 'Quiero Tótem Touch IA',
    category: 'visual',
    serviceId: 'serv_espejo_magico_ia',
    isAiDemo: true,
  },
  {
    id: 'plataforma360',
    name: 'Plataforma 360° Video',
    badge: 'Video Dinámico HD',
    tagline: 'Videos espectaculares en cámara lenta con música',
    description:
      'El brazo giratorio captura a tus invitados en 360 grados, aplicando efectos dinámicos de velocidad, música sincronizada y entrega instantánea por QR.',
    icon: Video,
    highlights: ['Efectos slow-motion y reversa', 'Música sincronizada', 'Iluminación profesional', 'Entrega inmediata'],
    features: [
      { icon: Video, title: 'Tomas 360 en cámara lenta', desc: 'Giros fluidos con efectos cinematográficos que se vuelven virales.' },
      { icon: Music, title: 'Canción integrada', desc: 'El video se exporta procesado con el hit de la noche sonando de fondo.' },
      { icon: QrCode, title: 'Listo para historias', desc: 'Formato vertical optimizado para Instagram Reels, TikTok y WhatsApp.' },
    ],
    color: 'from-purple-600 to-indigo-600',
    ctaText: 'Quiero Plataforma 360°',
    category: 'visual',
    serviceId: 'serv_plataforma360',
  },
  {
    id: 'bogue',
    name: 'Vogue Boomerang & GIFs',
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
    ctaText: 'Quiero Vogue Boomerang',
    category: 'visual',
    serviceId: 'serv_bogue',
  },
  {
    id: 'espejo',
    name: 'Espejo Mágico Interactivo',
    badge: 'Animaciones & Táctil',
    tagline: 'Espejo de cuerpo entero con firma táctil y dedicatorias',
    description:
      'Un espejo elegante de cuerpo entero donde los invitados tocan la pantalla, firman sus dedicatorias a mano alzada y se llevan su foto postal impresa.',
    icon: Smile,
    highlights: ['Pantalla táctil gigante', 'Firma y emojis dibujados', 'Animaciones interactivas', 'Impresión de cuerpo entero'],
    features: [
      { icon: Smile, title: 'Animaciones interactivas', desc: 'El espejo habla y guía a los invitados con animaciones divertidas.' },
      { icon: Sparkles, title: 'Firma a mano alzada', desc: 'Dedicatorias personalizadas escritas con el dedo en el espejo.' },
      { icon: Printer, title: 'Foto postal 10x15', desc: 'Impresión de alta resolución con diseño de gala del evento.' },
    ],
    color: 'from-amber-500 to-yellow-600',
    ctaText: 'Quiero Espejo Mágico',
    category: 'visual',
    serviceId: 'serv_espejo_magico',
  },
  {
    id: 'fotocabina',
    name: 'Fotocabina Impresa',
    badge: 'Tiras 2x6 y Fotos 10x15',
    tagline: 'Fotos impresas al instante con el diseño de tu fiesta',
    description:
      'Tus invitados posan, se aplican filtros de belleza facial y se llevan la tira térmica impresa personalizada en segundos, además de tenerla en digital en su celular por código QR.',
    icon: Camera,
    highlights: ['Impresión térmica rápida', 'Filtro de belleza facial', 'Marcos personalizados', 'QR sin instalar apps'],
    features: [
      { icon: Printer, title: 'Impresión en segundos', desc: 'Tiras dobles clásicas o fotos individuales de recuerdo para cada invitado.' },
      { icon: Sparkles, title: 'Filtros y suavizado', desc: 'Tratamiento de piel en tiempo real para que todos salgan impecables.' },
      { icon: QrCode, title: 'Descarga instantánea', desc: 'Cada tanda genera un QR único para bajar la foto al teléfono al instante.' },
    ],
    color: 'from-pink-500 to-rose-600',
    ctaText: 'Quiero Fotocabina en mi fiesta',
    category: 'visual',
    serviceId: 'serv_fotocabina',
  },

  // 2. Emoción y recuerdos
  {
    id: 'buzon',
    name: 'Buzón de Recuerdos & Teléfono Retro',
    badge: 'Cápsula del Tiempo',
    tagline: 'Saludos de voz y mensajes que guardás para siempre',
    description:
      'Tus familiares y amigos levantan el auricular del teléfono vintage o graban desde la estación para dejarte sus mejores deseos con su propia voz.',
    icon: PhoneCall,
    highlights: ['Teléfono retro interactivo', 'Audio y mensajes auténticos', 'Compilado sonoro final', 'Emotivo e inolvidable'],
    features: [
      { icon: PhoneCall, title: 'Mensajes de voz auténticos', desc: 'El invitado escucha el saludo de los anfitriones y deja su mensaje al tono.' },
      { icon: Heart, title: 'Emociones genuinas', desc: 'Un recuerdo único con la voz de abuelos, padres y amigos entrañables.' },
      { icon: Layers, title: 'Álbum sonoro final', desc: 'Todos los audios recopilados en el álbum digital para revivirlos siempre.' },
    ],
    color: 'from-emerald-500 to-teal-600',
    ctaText: 'Quiero el Buzón de Recuerdos',
    category: 'emocion',
  },
  {
    id: 'videodevida',
    name: 'Video de Vida',
    badge: 'Producción Emotiva',
    tagline: 'La historia del homenajeado en formato de película',
    description:
      'Edición audiovisual profesional con fotos de la infancia, testimonios de familiares y música emotiva para proyectar en el momento cumbre.',
    icon: Film,
    highlights: ['Edición cinematográfica', 'Guion emotivo', 'Proyección HD', 'Copia digital de regalo'],
    features: [
      { icon: Film, title: 'Narrativa emocionante', desc: 'Un recorrido visual que conmueve a toda la familia.' },
      { icon: Music, title: 'Banda sonora a medida', desc: 'Canciones significativas que marcan cada etapa de la vida.' },
      { icon: QrCode, title: 'Guardado para siempre', desc: 'Disponible en el álbum digital y video recuerdo en alta definición.' },
    ],
    color: 'from-amber-600 to-rose-600',
    ctaText: 'Quiero Video de Vida',
    category: 'emocion',
    serviceId: 'serv_video_vida_regalo',
  },

  // 3. Interacción en pista
  {
    id: 'muro',
    name: 'Muro Social en Pantalla Gigante',
    badge: 'Interactivo en Vivo',
    tagline: 'La fiesta entera conectada en la pantalla grande',
    description:
      'Los invitados escanean el QR de su mesa y suben fotos, mandan reacciones voladoras en tiempo real, votan encuestas, juegan trivias y piden canciones al DJ.',
    icon: Tv,
    highlights: ['Reacciones voladoras en vivo', 'Juegos y trivias por mesa', 'Pedidos de música al DJ', 'Modo cine con fotos lentas'],
    features: [
      { icon: Flame, title: 'Reacciones y aplausos', desc: 'Corazones, fuegos y aplausos cruzan la pantalla al instante cuando alguien los toca.' },
      { icon: Gamepad2, title: 'Juegos y podio por mesa', desc: 'Trivias de la quinceañera o los novios con ranking interactivo en vivo.' },
      { icon: Music, title: 'Pedidos al DJ', desc: 'Los invitados sugieren sus temas favoritos directamente a la cabina.' },
    ],
    color: 'from-red-500 to-orange-600',
    ctaText: 'Quiero Pantalla Interactiva',
    category: 'pista',
    serviceId: 'serv_pantalla_regalo',
  },
  {
    id: 'totem',
    name: 'Tótems de Barra y Recepción',
    badge: 'Puntos de Consulta',
    tagline: 'Ubicación de mesas, cronograma interactivo y tragos',
    description:
      'Tótems táctiles verticales ubicados en la recepción y barra del salón para que los invitados busquen su mesa, vean la carta y consulten el cronograma de la noche.',
    icon: Monitor,
    highlights: ['Buscador de mesas interactivo', 'Cronograma en vivo', 'Carta de tragos y menú digital', 'Pantalla vertical táctil'],
    features: [
      { icon: Monitor, title: '¿Dónde me siento?', desc: 'Buscador instantáneo por nombre y apellido con plano de mesas.' },
      { icon: CheckCircle2, title: 'Cronograma del evento', desc: 'Horarios de vals, cena, show y cotillón actualizados.' },
      { icon: Smartphone, title: 'Acceso por QR', desc: 'También se sincroniza con el celular de cada invitado.' },
    ],
    color: 'from-blue-600 to-cyan-600',
    ctaText: 'Quiero Tótems Interactivos',
    category: 'pista',
  },
  {
    id: 'invitaciones',
    name: 'Invitación Digital con QR',
    badge: 'Web Personalizada',
    tagline: 'Invitaciones interactivas con mapa, cronograma y confirmación',
    description:
      'Diseños modernos y adaptados a tu estilo, con ubicación GPS con un toque, cuenta regresiva, mesa de regalos y confirmación por WhatsApp.',
    icon: Smartphone,
    highlights: ['Diseño personalizado exclusivo', 'Mapa interactivo al salón', 'Confirmación de asistencia online', 'Mesa de regalos clara'],
    features: [
      { icon: Smartphone, title: '100% interactiva', desc: 'Se abre en cualquier celular sin instalar nada, con música y cuenta regresiva.' },
      { icon: CheckCircle2, title: 'Control de invitados', desc: 'Confirmación de asistencia RSVP en tiempo real para organizar las mesas con facilidad.' },
      { icon: Heart, title: 'Mesa de regalos y datos', desc: 'Información clara de regalos, sugerencias de vestimenta y ubicación del evento.' },
    ],
    color: 'from-sky-500 to-blue-600',
    ctaText: 'Quiero mi Invitación Digital',
    category: 'pista',
    serviceId: 'serv_invitaciones_regalo',
  },
];

export function InteractiveTechShowcase({ className }: { className?: string }) {
  const [activeCategory, setActiveCategory] = useState<TechCategory>('visual');
  const [selectedStation, setSelectedStation] = useState<TechStationItem>(STATIONS[0]);
  const reduceMotion = useReducedMotion();

  // Filtrar estaciones por la categoría seleccionada
  const visibleStations = STATIONS.filter((s) => s.category === activeCategory);

  const handleCategoryChange = (cat: TechCategory) => {
    setActiveCategory(cat);
    const firstInCat = STATIONS.find((s) => s.category === cat);
    if (firstInCat) {
      setSelectedStation(firstInCat);
    }
  };

  const waHref = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `¡Hola! Me interesó la tecnología de ${selectedStation.name} para mi evento. ¿Me pueden pasar info y disponibilidad?`
  )}`;

  return (
    <section
      id="vidriera-tecnologica"
      className={cn('py-20 px-4 bg-slate-950 text-white relative overflow-hidden rounded-3xl border border-slate-800/80 my-8 shadow-2xl', className)}
    >
      {/* Background glow accents con identidad luminosa AK */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-red-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[250px] bg-amber-500/10 blur-[110px] pointer-events-none rounded-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_black_90%)]" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(239,68,68,0.25)] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            Tecnología Interactiva · AK Producciones
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
            Experiencias que hacen tu fiesta inolvidable
          </h2>
          <p className="mt-3 text-slate-300 max-w-2xl mx-auto font-medium text-sm sm:text-base">
            No es sólo equipamiento: es diversión en vivo, recuerdos impresos en el momento y conexión real con cada uno de tus invitados.
          </p>
        </div>

        {/* 3 Grupos de Filtros Grandes (entran en el celular sin desplazarse de costado) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto mb-8">
          {TECH_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  'py-3 px-2 sm:px-4 rounded-2xl text-center border transition-all flex flex-col items-center justify-center min-h-[64px]',
                  isSelected
                    ? 'bg-gradient-to-b from-red-600 to-rose-700 text-white border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)] ring-2 ring-red-400/30'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white hover:border-slate-700'
                )}
              >
                <span className="text-xs sm:text-sm font-black leading-tight block">
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="sm:hidden">{cat.shortLabel}</span>
                </span>
                <span className="text-[10px] text-slate-200/80 hidden sm:block mt-0.5 leading-tight">
                  {cat.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selector de estaciones dentro del grupo elegido */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 hide-scrollbar justify-start sm:flex-wrap sm:justify-center sm:overflow-visible">
          {visibleStations.map((station) => {
            const Icon = station.icon;
            const isSelected = selectedStation.id === station.id;
            return (
              <motion.button
                key={station.id}
                type="button"
                whileHover={reduceMotion ? undefined : { scale: 1.03, y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                onClick={() => setSelectedStation(station)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 border backdrop-blur-md',
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.45)]'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                )}
              >
                <Icon className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-slate-400')} />
                {station.name}
              </motion.button>
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
                  <span
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider',
                      selectedStation.badge === 'Exclusivo con IA'
                        ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-white/10 text-slate-200'
                    )}
                  >
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
                {/* Botón de inclusión en simulación si tiene serviceId */}
                {selectedStation.serviceId && (
                  <Link
                    href={`/simulador-de-presupuesto?extra=${selectedStation.serviceId}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-white bg-red-600 hover:bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.4)] transition-all hover:scale-105 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Incluir en mi simulación
                  </Link>
                )}

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r shadow-lg transition-all hover:scale-105 active:scale-95',
                    selectedStation.color
                  )}
                >
                  {selectedStation.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/simulador-de-presupuesto"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-xs sm:text-sm text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-700 transition-all"
                >
                  Simular mi presupuesto
                </Link>
              </div>
            </div>

            {/* Right Visual Column / Interactive Preview Box */}
            <div className="lg:col-span-5 flex flex-col justify-center bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className={cn('absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl opacity-20 bg-gradient-to-r', selectedStation.color)} />

              {/* Si es demo IA mostramos el bloque Antes / Después con rótulo "Ejemplo IA" */}
              {selectedStation.isAiDemo ? (
                <div className="space-y-4 relative z-10 py-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Demostración interactiva
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300">
                      Ejemplo IA
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Así transforma el Tótem Touch IA la foto de tus invitados en tiempo real:
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Antes */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-[4/5] flex flex-col">
                      <div className="relative flex-1 w-full bg-slate-800">
                        <Image
                          src="/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg"
                          alt="Foto original del invitado"
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="bg-slate-900/90 text-center py-1.5 border-t border-slate-800">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Antes (Original)
                        </span>
                      </div>
                    </div>

                    {/* Después (IA) */}
                    <div className="relative rounded-xl overflow-hidden border-2 border-purple-500/60 bg-slate-900 aspect-[4/5] flex flex-col shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                      <div className="relative flex-1 w-full bg-slate-800 overflow-hidden">
                        <Image
                          src="/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg"
                          alt="Transformación con inteligencia artificial"
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover filter contrast-125 saturate-150 hue-rotate-15 brightness-105"
                        />
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow">
                          Estilo IA
                        </div>
                      </div>
                      <div className="bg-purple-950/90 text-center py-1.5 border-t border-purple-800/60">
                        <span className="text-[11px] font-black text-purple-200 uppercase tracking-wider">
                          Después (IA)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights List */}
                  <ul className="text-left space-y-2 max-w-xs mx-auto pt-3 border-t border-slate-800">
                    {selectedStation.highlights.map((hl, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
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
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
