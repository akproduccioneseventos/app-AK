'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
  BookOpen,
  Star,
  Shield,
  Clock,
  Headphones,
  Zap,
  Heart,
  Phone,
  MessageCircle,
  CreditCard,
  Gift,
  Users,
  Award,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCatalogBySlug } from '@/data/event-catalogs';
import type { EventCatalogData, ServiceItem } from '@/types/public-landing';

// ─── Session storage keys (must match presupuesto flow) ──────────────────────
const PRESUPUESTO_SESSION_KEY = 'presupuestoEnProgreso_v3';

// ─── Default values for budget pre-population ────────────────────────────────
/** Default guest count to pre-fill in the budget form; user adjusts in Paso 1 */
const DEFAULT_GUEST_COUNT = 50;

// ─── Slide variants for framer-motion ────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
};
const slideTransition = { duration: 0.35, ease: 'easeInOut' as const };

// ─── Accent color helpers ─────────────────────────────────────────────────────
const ACCENT_MAP: Record<string, { gradient: string; text: string; bg: string; border: string }> = {
  rose:    { gradient: 'from-rose-500 to-pink-600',    text: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  purple:  { gradient: 'from-purple-500 to-fuchsia-600', text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  amber:   { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  sky:     { gradient: 'from-sky-500 to-blue-600',     text: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200' },
  slate:   { gradient: 'from-slate-600 to-gray-700',   text: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  emerald: { gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};
function getAccent(color: string) {
  return ACCENT_MAP[color] ?? ACCENT_MAP['amber'];
}

// ─── Slide IDs ────────────────────────────────────────────────────────────────
type SlideId =
  | 'portada'
  | 'presentacion'
  | 'por-que-elegirnos'
  | 'proceso'
  | 'servicios'
  | 'regalos'
  | 'testimonios'
  | 'formas-de-pago'
  | 'cierre';

const SLIDE_ORDER: SlideId[] = [
  'portada',
  'presentacion',
  'por-que-elegirnos',
  'proceso',
  'servicios',
  'regalos',
  'testimonios',
  'formas-de-pago',
  'cierre',
];

const SLIDE_LABELS: Record<SlideId, string> = {
  'portada':          'Portada',
  'presentacion':     'Presentación',
  'por-que-elegirnos':'Por qué elegirnos',
  'proceso':          'El proceso',
  'servicios':        'Servicios',
  'regalos':          'Regalos incluidos',
  'testimonios':      'Testimonios',
  'formas-de-pago':   'Formas de pago',
  'cierre':           'Resumen',
};

// ─── Slide Components ─────────────────────────────────────────────────────────

function PortadaSlide({
  catalog,
  onNext,
}: {
  catalog: EventCatalogData;
  onNext: () => void;
}) {
  const accent = getAccent(catalog.hero.accentColor);
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 min-h-[500px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-8xl mb-6"
      >
        {catalog.hero.emoji}
      </motion.div>

      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4 bg-gradient-to-r ${accent.gradient} text-white`}
      >
        {catalog.name}
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-3xl md:text-5xl font-black text-slate-800 mb-4 leading-tight max-w-2xl"
      >
        {catalog.hero.headline}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="text-slate-500 text-lg md:text-xl max-w-xl mb-10 leading-relaxed"
      >
        {catalog.hero.subheadline}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={onNext}
          size="lg"
          className={cn(
            'h-14 px-10 rounded-2xl text-lg font-bold text-white shadow-lg',
            `bg-gradient-to-r ${accent.gradient} hover:opacity-90 transition-opacity`,
          )}
        >
          {catalog.hero.ctaLabel}
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

function PresentacionSlide({ catalog }: { catalog: EventCatalogData }) {
  const accent = getAccent(catalog.hero.accentColor);
  const stats = [
    { icon: Award, label: 'Años de experiencia', value: '+10' },
    { icon: Heart, label: 'Eventos realizados', value: '+500' },
    { icon: Users, label: 'Familias felices', value: '+500' },
  ];
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="text-center mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>Quiénes somos</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">AK Producciones</h2>
        <p className="text-slate-500 mt-2">Salto, Uruguay · Producción integral de eventos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className={`${accent.bg} ${accent.border} border rounded-2xl p-6`}>
          <h3 className="font-bold text-slate-800 mb-3 text-lg">Nuestra historia</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            En AK Producciones somos especialistas en transformar momentos especiales en recuerdos eternos.
            Nacimos con la pasión de organizar eventos únicos, y hoy somos el equipo de confianza de cientos
            de familias en Salto y la región.
          </p>
          <p className="text-slate-600 leading-relaxed text-sm mt-3">
            Nos encargamos de <span className="font-semibold text-slate-800">todo</span>: desde la decoración
            hasta el catering, el sonido, la fotografía y la coordinación general. Un solo equipo, una sola
            propuesta, cero preocupaciones para vos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className={`p-3 rounded-xl ${accent.bg}`}>
                <Icon className={`h-5 w-5 ${accent.text}`} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PorQueElegernosSlide({ catalog }: { catalog: EventCatalogData }) {
  const accent = getAccent(catalog.hero.accentColor);
  const whyUsIcons = [Shield, Clock, Headphones, Star, Zap, Heart];
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="text-center mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>Nuestros diferenciales</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">Por qué elegirnos</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.whyUs.map((item, idx) => {
          const Icon = whyUsIcons[idx % whyUsIcons.length];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex flex-col gap-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${accent.bg}`}>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ProcesoSlide({ catalog }: { catalog: EventCatalogData }) {
  const accent = getAccent(catalog.hero.accentColor);
  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="text-center mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>Paso a paso</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">Nuestro proceso</h2>
      </div>
      <div className="flex flex-col gap-0">
        {catalog.process.map((step, idx) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-4 relative"
          >
            {/* Connector line */}
            {idx < catalog.process.length - 1 && (
              <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-100" />
            )}
            {/* Step number */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${accent.gradient} text-white flex items-center justify-center font-black text-lg shadow-md z-10`}>
              {step.step}
            </div>
            <div className="pb-8 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{step.icon}</span>
                <h3 className="font-bold text-slate-800">{step.title}</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ServiciosSlide({
  catalog,
  selectedPackageId,
  onSelect,
}: {
  catalog: EventCatalogData;
  selectedPackageId: string | null;
  onSelect: (id: string) => void;
}) {
  const accent = getAccent(catalog.hero.accentColor);
  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="text-center mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>Lo que ofrecemos</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">Nuestros servicios</h2>
        <p className="text-slate-500 mt-2 text-sm">Seleccioná el paquete que mejor se adapta a tu evento</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {catalog.services.map((service, idx) => {
          const isSelected = selectedPackageId === service.id;
          const isHighlighted = service.highlighted;
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSelect(service.id)}
              className={cn(
                'relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg',
                isSelected
                  ? `border-transparent bg-gradient-to-br ${accent.gradient} text-white shadow-xl scale-[1.02]`
                  : isHighlighted
                  ? `${accent.border} ${accent.bg} border-2`
                  : 'border-slate-100 bg-white hover:border-slate-200',
              )}
            >
              {isHighlighted && !isSelected && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${accent.gradient}`}>
                  ⭐ Más popular
                </div>
              )}
              {isSelected && (
                <div className="absolute -top-3 right-4 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Check className={`h-4 w-4 ${accent.text}`} />
                </div>
              )}

              <h3 className={cn('text-xl font-black mb-1', isSelected ? 'text-white' : 'text-slate-800')}>
                {service.title}
              </h3>
              <p className={cn('text-sm mb-4 leading-relaxed', isSelected ? 'text-white/80' : 'text-slate-500')}>
                {service.description}
              </p>

              <ul className="flex flex-col gap-2">
                {service.included.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className={cn('h-4 w-4 mt-0.5 flex-shrink-0', isSelected ? 'text-white' : accent.text)} />
                    <span className={cn('text-xs', isSelected ? 'text-white/90' : 'text-slate-600')}>{item}</span>
                  </li>
                ))}
              </ul>

              {service.price && service.price !== 'Consultar' && (
                <div className={cn('mt-4 text-lg font-black', isSelected ? 'text-white' : accent.text)}>
                  {service.price}
                </div>
              )}

              <div className={cn(
                'mt-4 text-center text-xs font-bold py-2 rounded-xl transition-all',
                isSelected
                  ? 'bg-white/20 text-white'
                  : `${accent.bg} ${accent.text}`,
              )}>
                {isSelected ? '✓ Seleccionado' : 'Seleccionar este paquete'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RegalosSlide({ catalog }: { catalog: EventCatalogData }) {
  const accent = getAccent(catalog.hero.accentColor);
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="text-center mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>Beneficios exclusivos</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">{catalog.promotion.sectionTitle}</h2>
        {catalog.promotion.sectionSubtitle && (
          <p className="text-slate-500 mt-2">{catalog.promotion.sectionSubtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {catalog.promotion.gifts.map((gift, idx) => (
          <motion.div
            key={gift.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex items-start gap-4 p-5 rounded-2xl ${accent.bg} ${accent.border} border`}
          >
            <span className="text-4xl flex-shrink-0">{gift.icon}</span>
            <div>
              <h3 className="font-bold text-slate-800 mb-1">{gift.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{gift.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TestimoniosSlide({ catalog }: { catalog: EventCatalogData }) {
  const accent = getAccent(catalog.hero.accentColor);
  const SOURCE_ICON: Record<string, string> = {
    instagram: '📸',
    whatsapp:  '💬',
    google:    '⭐',
    text:      '💭',
  };
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="text-center mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>Clientes que confían en nosotros</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">Lo que dicen</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.testimonials.map((testimonial, idx) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">{testimonial.authorName}</span>
              <span className="text-lg">{SOURCE_ICON[testimonial.source] ?? '💬'}</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed italic">"{testimonial.text}"</p>
            {testimonial.date && (
              <span className="text-xs text-slate-400">{testimonial.date}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FormasDePagoSlide({ catalog }: { catalog: EventCatalogData }) {
  const accent = getAccent(catalog.hero.accentColor);
  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="text-center mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>Sin complicaciones</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">Formas de pago</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {catalog.paymentMethods.map((method, idx) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`flex items-center gap-4 p-4 bg-white border ${accent.border} rounded-2xl shadow-sm`}
          >
            <span className="text-3xl flex-shrink-0">{method.icon}</span>
            <div>
              <div className="font-bold text-slate-800 text-sm">{method.name}</div>
              {method.description && (
                <div className="text-xs text-slate-500">{method.description}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <div className={`p-5 rounded-2xl text-center ${accent.bg} ${accent.border} border`}>
        <p className={`font-bold ${accent.text} mb-1`}>Seña para reservar tu fecha</p>
        <p className="text-slate-600 text-sm">
          Se requiere el 30 % del total para confirmar la fecha. El saldo se abona en cuotas según lo acordado.
        </p>
      </div>
    </div>
  );
}

function CierreSlide({
  catalog,
  selectedPackage,
  onCreateBudget,
}: {
  catalog: EventCatalogData;
  selectedPackage: ServiceItem | null;
  onCreateBudget: () => void;
}) {
  const accent = getAccent(catalog.hero.accentColor);
  const WHATSAPP_NUMBER = catalog.whatsappNumber ?? '59899123456';
  const waMsg = catalog.whatsappMessage ?? `¡Hola AK Producciones! Quiero cotizar: ${catalog.name}.`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="text-center mb-8">
        <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>¡Estamos listos!</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">Siguiente paso 🚀</h2>
        <p className="text-slate-500 mt-2 max-w-lg mx-auto">
          Revisá tu selección y convertila en un presupuesto real con un solo clic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Selection summary */}
        <div>
          <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <FileText className={`h-4 w-4 ${accent.text}`} />
            Tu selección
          </h3>
          {selectedPackage ? (
            <div className={`p-5 rounded-2xl ${accent.bg} ${accent.border} border`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{catalog.hero.emoji}</span>
                <div className="flex-1">
                  <div className="font-black text-slate-800 text-lg">{selectedPackage.title}</div>
                  <div className="text-slate-600 text-sm mb-3">{selectedPackage.description}</div>
                  <ul className="flex flex-col gap-1">
                    {selectedPackage.included.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <Check className={`h-3.5 w-3.5 flex-shrink-0 ${accent.text}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-slate-400 text-sm">No seleccionaste un paquete todavía.</p>
              <p className="text-slate-400 text-xs mt-1">Podés volver al paso anterior para elegir uno.</p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Gift className={`h-4 w-4 ${accent.text}`} />
              ¿Qué querés hacer?
            </h3>
            <div className="flex flex-col gap-3">
              <Button
                onClick={onCreateBudget}
                size="lg"
                className={cn(
                  'h-14 rounded-2xl text-base font-bold text-white shadow-lg w-full',
                  `bg-gradient-to-r ${accent.gradient} hover:opacity-90 transition-opacity`,
                )}
              >
                <FileText className="h-5 w-5 mr-2" />
                Crear presupuesto manual
              </Button>

              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-2xl text-sm font-bold w-full border-2 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                  Consultar por WhatsApp
                </Button>
              </a>
            </div>
          </div>

          {/* FAQs preview */}
          {catalog.faqs.length > 0 && (
            <div className="mt-2">
              <h3 className="font-bold text-slate-700 mb-2 text-sm">Preguntas frecuentes</h3>
              <div className="flex flex-col gap-2">
                {catalog.faqs.slice(0, 2).map((faq) => (
                  <div key={faq.id} className="p-3 bg-white border border-slate-100 rounded-xl">
                    <p className="text-xs font-bold text-slate-700 mb-1">{faq.question}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Wizard Page ─────────────────────────────────────────────────────────

export default function CatalogoTipoPage() {
  const params = useParams();
  const router = useRouter();
  const tipo = Array.isArray(params.tipo) ? params.tipo[0] : params.tipo;
  const catalog = tipo ? getCatalogBySlug(tipo) : null;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const selectedPackage = useMemo(
    () => (catalog ? catalog.services.find((s) => s.id === selectedPackageId) ?? null : null),
    [catalog, selectedPackageId],
  );

  const goToSlide = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(next, SLIDE_ORDER.length - 1));
    setDirection(next > currentSlide ? 1 : -1);
    setCurrentSlide(clamped);
  }, [currentSlide]);

  const goNext = useCallback(() => goToSlide(currentSlide + 1), [goToSlide, currentSlide]);
  const goPrev = useCallback(() => goToSlide(currentSlide - 1), [goToSlide, currentSlide]);

  const handleCreateBudget = useCallback(() => {
    if (!catalog) return;
    // Pre-populate the presupuesto form via sessionStorage
    const presupuestoData = {
      clienteNombre: '',
      clienteContacto: '',
      eventoTipo: catalog.name,
      eventoFecha: undefined,
      invitadosCantidad: DEFAULT_GUEST_COUNT,
      invitadosAdultos: DEFAULT_GUEST_COUNT,
      invitadosNinos: 0,
      invitadosAdolescentes: 0,
      salonFiestas: '',
      protagonista1Nombre: '',
      protagonista2Nombre: '',
      nombreEmpresa: '',
      serviciosSeleccionados: [], // empty Map entries — user configures in budget form
      selectedMenuId: '',
      notas: selectedPackage
        ? `Catálogo digital — ${catalog.name}\nPaquete seleccionado: ${selectedPackage.title}\nIncluye: ${selectedPackage.included.join(', ')}`
        : `Catálogo digital — ${catalog.name}`,
      estado: 'Borrador',
      nombrePromocion: 'Descuento Promocional',
      descuentoTipo: 'porcentaje',
      descuentoValor: '10',
      vigenciaPromocion: 'Válido por 30 días',
    };
    try {
      sessionStorage.setItem(PRESUPUESTO_SESSION_KEY, JSON.stringify(presupuestoData));
      // Also store catalog selection details for reference
      sessionStorage.setItem('catalogo_seleccion', JSON.stringify({
        slug: catalog.slug,
        nombre: catalog.name,
        paqueteId: selectedPackage?.id ?? null,
        paqueteNombre: selectedPackage?.title ?? null,
        incluye: selectedPackage?.included ?? [],
      }));
    } catch (err) {
      // sessionStorage unavailable (e.g. private browsing quota) — log and navigate anyway
      console.warn('[CatalogoWizard] Could not write to sessionStorage:', err);
    }
    router.push('/presupuestos/nuevo/crear');
  }, [catalog, selectedPackage, router]);

  // Not found
  if (!catalog) return notFound();

  const accent = getAccent(catalog.hero.accentColor);
  const currentSlideId = SLIDE_ORDER[currentSlide];
  const isLastSlide = currentSlide === SLIDE_ORDER.length - 1;
  const isFirstSlide = currentSlide === 0;
  const progress = ((currentSlide) / (SLIDE_ORDER.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/20 flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/catalogo">
              <Button variant="ghost" size="icon" className="rounded-xl flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{catalog.hero.emoji}</span>
                <span className="font-black text-slate-800 text-sm md:text-base truncate">{catalog.name}</span>
                <span className="hidden sm:inline text-slate-300">·</span>
                <span className="hidden sm:inline text-slate-500 text-sm">{SLIDE_LABELS[currentSlideId]}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${accent.gradient} rounded-full transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-shrink-0 text-xs text-slate-400 font-mono">
              {currentSlide + 1}/{SLIDE_ORDER.length}
            </div>
          </div>

          {/* Slide index tabs (desktop) */}
          <div className="hidden lg:flex items-center gap-1 mt-3 flex-wrap">
            {SLIDE_ORDER.map((id, idx) => (
              <button
                key={id}
                onClick={() => goToSlide(idx)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                  currentSlide === idx
                    ? `bg-gradient-to-r ${accent.gradient} text-white`
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
                )}
              >
                {SLIDE_LABELS[id]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Slide area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-4 py-6 h-full overflow-y-auto">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentSlideId}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              {currentSlideId === 'portada' && (
                <PortadaSlide catalog={catalog} onNext={goNext} />
              )}
              {currentSlideId === 'presentacion' && (
                <PresentacionSlide catalog={catalog} />
              )}
              {currentSlideId === 'por-que-elegirnos' && (
                <PorQueElegernosSlide catalog={catalog} />
              )}
              {currentSlideId === 'proceso' && (
                <ProcesoSlide catalog={catalog} />
              )}
              {currentSlideId === 'servicios' && (
                <ServiciosSlide
                  catalog={catalog}
                  selectedPackageId={selectedPackageId}
                  onSelect={setSelectedPackageId}
                />
              )}
              {currentSlideId === 'regalos' && (
                <RegalosSlide catalog={catalog} />
              )}
              {currentSlideId === 'testimonios' && (
                <TestimoniosSlide catalog={catalog} />
              )}
              {currentSlideId === 'formas-de-pago' && (
                <FormasDePagoSlide catalog={catalog} />
              )}
              {currentSlideId === 'cierre' && (
                <CierreSlide
                  catalog={catalog}
                  selectedPackage={selectedPackage}
                  onCreateBudget={handleCreateBudget}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom navigation */}
      <footer className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Button
            onClick={goPrev}
            disabled={isFirstSlide}
            variant="outline"
            size="lg"
            className="h-12 px-6 rounded-2xl font-semibold disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Anterior
          </Button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {SLIDE_ORDER.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  currentSlide === idx
                    ? `w-6 bg-gradient-to-r ${accent.gradient}`
                    : 'w-2 bg-slate-200 hover:bg-slate-300',
                )}
              />
            ))}
          </div>

          {isLastSlide ? (
            <Button
              onClick={handleCreateBudget}
              size="lg"
              className={cn(
                'h-12 px-6 rounded-2xl font-bold text-white shadow-lg',
                `bg-gradient-to-r ${accent.gradient} hover:opacity-90`,
              )}
            >
              <FileText className="h-4 w-4 mr-2" />
              Crear presupuesto
            </Button>
          ) : (
            <Button
              onClick={goNext}
              size="lg"
              className={cn(
                'h-12 px-6 rounded-2xl font-semibold text-white',
                `bg-gradient-to-r ${accent.gradient} hover:opacity-90`,
              )}
            >
              Siguiente
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
