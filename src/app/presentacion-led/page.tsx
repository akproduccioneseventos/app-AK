'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Check,
  Star,
  Mail,
  MessageCircle,
  Sparkles,
  Gift,
  ShoppingCart,
  Loader2,
  Music,
  Camera,
  Utensils,
  Palette,
  Users,
  Zap,
  Package,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getCompanyInfo } from '@/app/actions/settings';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import type { ServicioEmpresa } from '@/types/empresa';
import type { CompanyInfo } from '@/types/settings';
import { cn } from '@/lib/utils';

// Canva catalog links per service category
const CANVA_LINKS: Record<string, string> = {
  catering: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering',
  bebida: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering',
  barra: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering',
  repostería: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering',
  boda: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-bodas',
  'xv años': 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-xv-a-os-sitio-web',
  'xv': 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-xv-a-os-sitio-web',
  default: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web',
};

function getCanvaLinkForService(categoria?: string): string {
  if (!categoria) return CANVA_LINKS.default;
  const lower = categoria.toLowerCase();
  for (const [key, link] of Object.entries(CANVA_LINKS)) {
    if (key !== 'default' && lower.includes(key)) return link;
  }
  return CANVA_LINKS.default;
}

// ---- Security helpers ----

function isSafeImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  // Allow https, http, and data URIs for images (logo is stored as data URI or https URL)
  return /^https?:\/\//i.test(url) || /^data:image\//i.test(url);
}

function isSafeEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

// ---- Types ----

interface PageData {
  companyInfo: CompanyInfo;
  logoUrl: string | null;
  servicios: ServicioEmpresa[];
  valuePropositions: string[];
  mostrarPrecios: boolean;
}

// ---- Helpers ----

function getServiceIcon(categoria?: string) {
  if (!categoria) return <Package className="h-16 w-16" />;
  const c = categoria.toLowerCase();
  if (c.includes('música') || c.includes('discoteca') || c.includes('dj')) return <Music className="h-16 w-16" />;
  if (c.includes('fotografía') || c.includes('filmación') || c.includes('video')) return <Camera className="h-16 w-16" />;
  if (c.includes('catering') || c.includes('bebida') || c.includes('repostería') || c.includes('menú')) return <Utensils className="h-16 w-16" />;
  if (c.includes('decoración')) return <Palette className="h-16 w-16" />;
  if (c.includes('personal')) return <Users className="h-16 w-16" />;
  if (c.includes('entretenimiento')) return <Zap className="h-16 w-16" />;
  if (c.includes('regalo')) return <Gift className="h-16 w-16" />;
  return <Sparkles className="h-16 w-16" />;
}

function formatPrice(servicio: ServicioEmpresa): string | null {
  if (servicio.calculationMethod === 'porPersona' && servicio.precioPorPersona) {
    return `$${servicio.precioPorPersona.toLocaleString('es-UY')} por persona`;
  }
  if (servicio.precioVenta) {
    return `$${servicio.precioVenta.toLocaleString('es-UY')}`;
  }
  return null;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const transition = {
  type: 'tween' as const,
  ease: 'easeInOut',
  duration: 0.5,
};

// ---- Slide Components ----

function CompanySlide({
  companyInfo,
  logoUrl,
  valuePropositions,
  onNext,
}: {
  companyInfo: CompanyInfo;
  logoUrl: string | null;
  valuePropositions: string[];
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="mb-8"
      >
        {isSafeImageUrl(logoUrl) ? (
          <img src={logoUrl} alt="Logo" className="h-28 w-auto mx-auto object-contain drop-shadow-2xl" />
        ) : (
          <div className="flex items-center justify-center h-28 w-28 mx-auto rounded-full bg-white/10 border-4 border-white/30">
            <Sparkles className="h-14 w-14 text-white" />
          </div>
        )}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
        className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4 drop-shadow-lg"
      >
        {companyInfo.companyName || 'AK Producciones Eventos'}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-xl md:text-3xl text-white/80 mb-12 max-w-3xl font-light"
      >
        Tu evento soñado, hecho realidad 🎉
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="w-full max-w-3xl mb-12"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-400 mb-6 uppercase tracking-widest">
          ¿Por qué elegirnos?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(valuePropositions.length > 0 ? valuePropositions : [
            'Experiencia en todo tipo de eventos',
            'Servicio personalizado y dedicado',
            'Todo en un solo lugar',
            'Calidad y puntualidad garantizadas',
          ]).map((prop, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-4 border border-white/20 backdrop-blur-sm"
            >
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-emerald-500/30 flex items-center justify-center border border-emerald-400/50">
                <Check className="h-5 w-5 text-emerald-300" />
              </div>
              <span className="text-white/90 font-medium text-lg">{prop}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <Button
          onClick={onNext}
          size="lg"
          className="h-16 px-12 text-xl rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white border-0 shadow-2xl font-bold tracking-wide"
        >
          Ver nuestros servicios
          <ChevronRight className="h-6 w-6 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

function ServiceSlide({
  servicio,
  index,
  total,
  isSelected,
  onToggleSelect,
  mostrarPrecios,
}: {
  servicio: ServicioEmpresa;
  index: number;
  total: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  mostrarPrecios: boolean;
}) {
  const price = mostrarPrecios ? formatPrice(servicio) : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12">
      <div className="w-full max-w-4xl mx-auto">
        {/* Category badge */}
        {servicio.categoria && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <Badge className="text-sm px-4 py-1.5 bg-white/20 text-white/80 border border-white/30 uppercase tracking-widest font-medium">
              {servicio.categoria}
            </Badge>
          </motion.div>
        )}

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-indigo-500/40 to-emerald-500/40 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white/80">
            {getServiceIcon(servicio.categoria)}
          </div>
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-6xl font-black text-white text-center mb-6 tracking-tight drop-shadow-lg"
        >
          {servicio.nombre}
        </motion.h1>

        {/* Price */}
        {price && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-6"
          >
            <span className="text-3xl md:text-4xl font-bold text-emerald-400 drop-shadow">
              {price}
            </span>
          </motion.div>
        )}

        {/* Notes */}
        {servicio.notas && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-white/75 text-xl text-center max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            {servicio.notas}
          </motion.p>
        )}

        {/* Select button + Ver Catálogo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onToggleSelect}
            className={cn(
              'flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-200 border-2',
              isSelected
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50'
            )}
          >
            <div className={cn(
              'h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all',
              isSelected ? 'border-white bg-white' : 'border-white/60'
            )}>
              {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
            </div>
            {isSelected ? '¡Le interesa!' : 'Marcar como interesado'}
          </button>
          <a
            href={getCanvaLinkForService(servicio.categoria)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold border-2 bg-indigo-500/30 border-indigo-400/60 text-white/90 hover:bg-indigo-500/50 transition-all duration-200"
          >
            <ExternalLink className="h-5 w-5" />
            Ver Catálogo
          </a>
        </motion.div>
      </div>

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium"
      >
        Servicio {index + 1} de {total}
      </motion.div>
    </div>
  );
}

function GiftsSlide({
  companyInfo,
  selectedServices,
  servicios,
  onGenerateBudget,
}: {
  companyInfo: CompanyInfo;
  selectedServices: string[];
  servicios: ServicioEmpresa[];
  onGenerateBudget: () => void;
}) {
  const gifts = servicios.filter(s => s.categoria === 'Regalo exclusivo');
  const safeEmail = isSafeEmail(companyInfo.companyContact) ? companyInfo.companyContact : null;
  // Build WhatsApp link from the email or contact info if available
  const waHref = `https://wa.me/59898355530?text=${encodeURIComponent('¡Hola! Estuve viendo sus servicios y me gustaría solicitar un presupuesto personalizado.')}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-br from-yellow-400/40 to-rose-500/40 border border-white/20 flex items-center justify-center mb-6">
          <Gift className="h-10 w-10 text-yellow-300" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg mb-4">
          🎁 Regalos Especiales
        </h1>
        <p className="text-white/70 text-xl max-w-2xl">
          Si contratás hoy, te incluimos estos beneficios exclusivos:
        </p>
      </motion.div>

      {gifts.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl w-full mb-10"
        >
          {gifts.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-4 bg-gradient-to-r from-yellow-500/20 to-rose-500/20 border border-yellow-400/30 rounded-2xl px-5 py-4"
            >
              <Star className="h-7 w-7 text-yellow-300 shrink-0" />
              <div className="text-left">
                <p className="text-white font-bold text-lg">{g.nombre}</p>
                {g.notas && <p className="text-white/60 text-sm">{g.notas}</p>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10 bg-white/10 border border-white/20 rounded-2xl px-8 py-6 max-w-xl w-full"
        >
          <p className="text-white/80 text-lg">
            🎊 Consultanos sobre nuestros regalos exclusivos al contratar hoy. ¡Tenemos sorpresas para vos!
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-2xl"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">📞 ¿Cómo contratar?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 rounded-2xl px-4 py-5 transition-colors"
            >
              <MessageCircle className="h-8 w-8 text-emerald-300" />
              <span className="text-white font-semibold text-sm">WhatsApp</span>
              <span className="text-white/60 text-xs">Contactar</span>
            </a>
          {safeEmail && (
            <a
              href={`mailto:${safeEmail}`}
              className="flex flex-col items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 rounded-2xl px-4 py-5 transition-colors"
            >
              <Mail className="h-8 w-8 text-indigo-300" />
              <span className="text-white font-semibold text-sm">Email</span>
              <span className="text-white/60 text-xs truncate w-full text-center">{safeEmail}</span>
            </a>
          )}
          <button
            onClick={onGenerateBudget}
            className="flex flex-col items-center gap-2 bg-gradient-to-br from-indigo-600/40 to-emerald-600/40 hover:from-indigo-600/60 hover:to-emerald-600/60 border border-white/30 rounded-2xl px-4 py-5 transition-colors"
          >
            <ShoppingCart className="h-8 w-8 text-white" />
            <span className="text-white font-semibold text-sm">Presupuesto</span>
            <span className="text-white/60 text-xs">Personalizado</span>
          </button>
        </div>

        {selectedServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 mb-6"
          >
            <p className="text-white/70 text-sm mb-2">Servicios marcados como interesado:</p>
            <div className="flex flex-wrap gap-2">
              {selectedServices.map(id => {
                const s = servicios.find(x => x.id === id);
                return s ? (
                  <span key={id} className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-sm border border-emerald-400/30 flex items-center gap-1">
                    <Check className="h-3 w-3" /> {s.nombre}
                  </span>
                ) : null;
              })}
            </div>
          </motion.div>
        )}

        <Button
          onClick={onGenerateBudget}
          size="lg"
          className="w-full h-16 text-xl rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white border-0 shadow-2xl font-bold"
        >
          <ShoppingCart className="h-6 w-6 mr-3" />
          ¡Pedí tu presupuesto personalizado ahora!
        </Button>

        <p className="text-white/40 text-sm mt-4">
          {companyInfo.companyAddress || 'Salto, Uruguay'}
        </p>
      </motion.div>
    </div>
  );
}

// ---- Main Component ----

export default function PresentacionLedPage() {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [servicios, companyInfo, invoiceSettings, budgetSettings] = await Promise.all([
          getServiciosEmpresa(),
          getCompanyInfo(),
          getInvoiceTemplateSettings(),
          getBudgetDisplaySettings(),
        ]);
        setData({
          companyInfo,
          logoUrl: invoiceSettings.logoUrl || null,
          servicios: servicios.filter(s => s.tipoItem === 'Servicio' || !s.tipoItem),
          valuePropositions: budgetSettings.valuePropositions || [],
          mostrarPrecios: budgetSettings.showPriceBreakdown ?? true,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalSlides = data ? 1 + data.servicios.length + 1 : 0; // company + services + gifts

  const goToSlide = useCallback((next: number) => {
    if (!data) return;
    const clamped = Math.max(0, Math.min(next, totalSlides - 1));
    setDirection(next > currentSlide ? 1 : -1);
    setCurrentSlide(clamped);
  }, [data, currentSlide, totalSlides]);

  const goNext = useCallback(() => goToSlide(currentSlide + 1), [goToSlide, currentSlide]);
  const goPrev = useCallback(() => goToSlide(currentSlide - 1), [goToSlide, currentSlide]);

  const toggleSelect = (id: string) => {
    setSelectedServices((prev: string[]) =>
      prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id]
    );
  };

  const handleGenerateBudget = useCallback(() => {
    // Only allow alphanumeric IDs (sanitize before putting in URL)
    const safeIds = (selectedServices as string[]).filter((id: string) => /^[\w-]+$/.test(id));
    if (safeIds.length > 0) {
      sessionStorage.setItem('presentacion_servicios_seleccionados', JSON.stringify(safeIds));
    }
    router.push('/presupuestos/nuevo/crear');
  }, [selectedServices, router]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { goNext(); }
      if (e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { goPrev(); }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, toggleFullscreen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
          <p className="text-white/60 text-lg">Cargando presentación...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const servicioIndex = currentSlide - 1;
  const isCompanySlide = currentSlide === 0;
  const isGiftsSlide = currentSlide === totalSlides - 1;
  const isServiceSlide = !isCompanySlide && !isGiftsSlide;
  const currentServicio = isServiceSlide ? data.servicios[servicioIndex] : null;

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 overflow-hidden select-none"
    >
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          {isSafeImageUrl(data.logoUrl) ? (
            <img src={data.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <span className="text-white font-bold text-lg">{data.companyInfo.companyName || 'AK Producciones'}</span>
          )}
        </div>

        {/* Progress bar */}
        {totalSlides > 1 && (
          <div className="flex-1 mx-8 max-w-md">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentSlide) / (totalSlides - 1)) * 100}%` }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1 text-center">
              {isCompanySlide ? 'Presentación' : isGiftsSlide ? 'Regalos y contacto' : `Servicio ${servicioIndex + 1} de ${data.servicios.length}`}
            </p>
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>

      {/* Slides */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className="absolute inset-0"
        >
          {isCompanySlide && (
            <CompanySlide
              companyInfo={data.companyInfo}
              logoUrl={data.logoUrl}
              valuePropositions={data.valuePropositions}
              onNext={goNext}
            />
          )}
          {isServiceSlide && currentServicio && (
            <ServiceSlide
              servicio={currentServicio}
              index={servicioIndex}
              total={data.servicios.length}
              isSelected={selectedServices.includes(currentServicio.id)}
              onToggleSelect={() => toggleSelect(currentServicio.id)}
              mostrarPrecios={data.mostrarPrecios}
            />
          )}
          {isGiftsSlide && (
            <GiftsSlide
              companyInfo={data.companyInfo}
              selectedServices={selectedServices}
              servicios={data.servicios}
              onGenerateBudget={handleGenerateBudget}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-4">
        <Button
          onClick={goPrev}
          disabled={currentSlide === 0}
          variant="ghost"
          size="lg"
          className="h-14 px-8 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-semibold"
        >
          <ChevronLeft className="h-6 w-6 mr-2" />
          Anterior
        </Button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 mx-4">
          {Array.from({ length: Math.min(totalSlides, 9) }).map((_, i) => {
            const slideIdx = totalSlides <= 9 ? i : Math.round(i * (totalSlides - 1) / 8);
            return (
              <button
                key={i}
                onClick={() => goToSlide(slideIdx)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  currentSlide === slideIdx
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                )}
              />
            );
          })}
        </div>

        <Button
          onClick={isGiftsSlide ? handleGenerateBudget : goNext}
          size="lg"
          className={cn(
            'h-14 px-8 rounded-2xl text-lg font-bold border-0',
            isGiftsSlide
              ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-lg'
              : 'bg-white/15 hover:bg-white/25 text-white border border-white/30'
          )}
        >
          {isGiftsSlide ? (
            <>
              <ShoppingCart className="h-5 w-5 mr-2" />
              Generar Presupuesto
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight className="h-6 w-6 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/20 text-xs pointer-events-none">
        ← → Navegar · F Pantalla completa
      </div>
    </div>
  );
}
