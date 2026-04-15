'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getCompanyInfo, getInvoiceTemplateSettings, getBudgetDisplaySettings } from '@/app/actions/settings';
import { getMenus } from '@/app/actions/menus-catering';
import { getCatalogoFotos } from '@/app/actions/catalogo-fotos';
import type { FullMenu } from '@/types/catering';
import type { CatalogoFoto } from '@/types/catalogo';
import { cn } from '@/lib/utils';

// Slide components
import { PortadaSlide } from './slides/portada-slide';
import { QuienesSomosSlide } from './slides/quienes-somos-slide';
import { BeneficiosSlide } from './slides/beneficios-slide';
import { DatosEventoSlide } from './slides/datos-evento-slide';
import { CategoriaServiciosSlide } from './slides/categoria-servicios-slide';
import { TestimoniosSlide } from './slides/testimonios-slide';
import { FormasDePagoSlide } from './slides/formas-de-pago-slide';
import { MenuSlide } from './slides/menu-slide';
import { RegalosSlide } from './slides/regalos-slide';
import { CierreSlide } from './slides/cierre-slide';

// Types
import type { PageData, ClientData, CategoriaServicio } from './lib/tipos';


// ---- Slide variants & transition ----

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

// ---- Helpers ----

function isSafeImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return /^https?:\/\//i.test(url) || /^data:image\//i.test(url);
}

function groupServicesByCategory(servicios: PageData['servicios']): CategoriaServicio[] {
  const map = new Map<string, CategoriaServicio>();
  for (const s of servicios) {
    const cat = s.categoria || 'Otros servicios';
    // Skip gifts — they go on the regalos slide
    if (cat === 'Regalo exclusivo') continue;
    if (!map.has(cat)) {
      map.set(cat, { nombre: cat, servicios: [] });
    }
    map.get(cat)!.servicios.push(s);
  }
  return Array.from(map.values());
}

// ---- Slide index constants ----
const FIXED_SLIDES_START = 4; // portada, quienes somos, beneficios, datos evento
const FIXED_SLIDES_END = 5;   // testimonios, formas de pago, menu, regalos, cierre

// ---- Main Component ----

export default function PresentacionLedPage() {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [catalogoFotos, setCatalogoFotos] = useState<CatalogoFoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientData>({
    nombre: '', fechaEvento: '', tipoFiesta: '', cantidadInvitados: '',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [servicios, companyInfo, invoiceSettings, budgetSettings, menus, catalogoData] = await Promise.all([
          getServiciosEmpresa(),
          getCompanyInfo(),
          getInvoiceTemplateSettings(),
          getBudgetDisplaySettings(),
          getMenus().catch(() => [] as FullMenu[]),
          getCatalogoFotos().catch(() => [] as CatalogoFoto[]),
        ]);
        setData({
          companyInfo,
          logoUrl: invoiceSettings.logoUrl || null,
          servicios: servicios.filter(s => s.tipoItem === 'Servicio' || !s.tipoItem),
          valuePropositions: budgetSettings.valuePropositions || [],
          mostrarPrecios: budgetSettings.showPriceBreakdown ?? true,
          menus,
        });
        setCatalogoFotos(catalogoData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derive category groups from servicios
  const categorias = useMemo<CategoriaServicio[]>(
    () => (data ? groupServicesByCategory(data.servicios) : []),
    [data],
  );

  // Total slides: start fixed + categories + end fixed
  const totalSlides = data ? FIXED_SLIDES_START + categorias.length + FIXED_SLIDES_END : 0;

  // Slide index helpers
  const testimoniosSlideIndex = FIXED_SLIDES_START + categorias.length;
  const formasDePagoSlideIndex = testimoniosSlideIndex + 1;
  const menuSlideIndex = formasDePagoSlideIndex + 1;
  const regalosSlideIndex = menuSlideIndex + 1;
  const cierreSlideIndex = regalosSlideIndex + 1;

  const isPortadaSlide = currentSlide === 0;
  const isQuienesSomosSlide = currentSlide === 1;
  const isBeneficiosSlide = currentSlide === 2;
  const isDatosEventoSlide = currentSlide === 3;
  const isCategoriaSlide = currentSlide >= FIXED_SLIDES_START && currentSlide < testimoniosSlideIndex;
  const isTestimoniosSlide = currentSlide === testimoniosSlideIndex;
  const isFormasDePagoSlide = currentSlide === formasDePagoSlideIndex;
  const isMenuSlide = currentSlide === menuSlideIndex;
  const isRegalosSlide = currentSlide === regalosSlideIndex;
  const isCierreSlide = currentSlide === cierreSlideIndex;

  const categoriaIndex = isCategoriaSlide ? currentSlide - FIXED_SLIDES_START : 0;
  const currentCategoria = isCategoriaSlide ? categorias[categoriaIndex] : null;

  const getSlideLabel = () => {
    if (isPortadaSlide) return 'Portada';
    if (isQuienesSomosSlide) return 'Quiénes Somos';
    if (isBeneficiosSlide) return '¿Por qué elegirnos?';
    if (isDatosEventoSlide) return 'Datos del Evento';
    if (isCategoriaSlide) return currentCategoria?.nombre ?? 'Servicios';
    if (isTestimoniosSlide) return 'Testimonios';
    if (isFormasDePagoSlide) return 'Formas de Pago';
    if (isMenuSlide) return 'Menú';
    if (isRegalosSlide) return 'Regalos & Extras';
    if (isCierreSlide) return 'Presupuesto';
    return '';
  };

  const goToSlide = useCallback((next: number) => {
    if (!data) return;
    const clamped = Math.max(0, Math.min(next, totalSlides - 1));
    setDirection(next > currentSlide ? 1 : -1);
    setCurrentSlide(clamped);
  }, [data, currentSlide, totalSlides]);

  const goNext = useCallback(() => goToSlide(currentSlide + 1), [goToSlide, currentSlide]);
  const goPrev = useCallback(() => goToSlide(currentSlide - 1), [goToSlide, currentSlide]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const handleGenerateBudget = useCallback(() => {
    // IDs come from server-fetched ServicioEmpresa records (alphanumeric + hyphens/underscores)
    const safeIds = selectedServices.filter(id => /^[\w-]+$/.test(id));
    if (safeIds.length > 0) {
      sessionStorage.setItem('presentacion_servicios_seleccionados', JSON.stringify(safeIds));
    }
    if (clientData.nombre || clientData.fechaEvento || clientData.tipoFiesta) {
      const safeClientData = {
        nombre: clientData.nombre.slice(0, 200),
        fechaEvento: clientData.fechaEvento,
        tipoFiesta: clientData.tipoFiesta.slice(0, 100),
        cantidadInvitados: clientData.cantidadInvitados,
      };
      sessionStorage.setItem('presentacion_cliente_data', JSON.stringify(safeClientData));
    }
    if (selectedMenuId && /^[\w-]+$/.test(selectedMenuId)) {
      sessionStorage.setItem('presentacion_menu_seleccionado', selectedMenuId);
    }
    router.push('/presupuestos/nuevo/crear');
  }, [selectedServices, clientData, selectedMenuId, router]);

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

  const menuOptions = data.menus.map(m => ({ id: m.id, name: m.name }));

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
                style={{ width: `${(currentSlide / (totalSlides - 1)) * 100}%` }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1 text-center">
              {getSlideLabel()}
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
          {isPortadaSlide && (
            <PortadaSlide
              companyInfo={data.companyInfo}
              logoUrl={data.logoUrl}
              tipoFiesta={clientData.tipoFiesta}
              onNext={goNext}
            />
          )}
          {isQuienesSomosSlide && (
            <QuienesSomosSlide companyInfo={data.companyInfo} />
          )}
          {isBeneficiosSlide && (
            <BeneficiosSlide />
          )}
          {isDatosEventoSlide && (
            <DatosEventoSlide
              clientData={clientData}
              onClientDataChange={setClientData}
              onNext={goNext}
            />
          )}
          {isCategoriaSlide && currentCategoria && (
            <CategoriaServiciosSlide
              categoria={currentCategoria.nombre}
              servicios={currentCategoria.servicios}
              selectedServices={selectedServices}
              onToggleSelect={toggleSelect}
              mostrarPrecios={data.mostrarPrecios}
              categoriaIndex={categoriaIndex}
              totalCategorias={categorias.length}
              catalogoFotos={catalogoFotos}
            />
          )}
          {isTestimoniosSlide && (
            <TestimoniosSlide tipoFiesta={clientData.tipoFiesta} />
          )}
          {isFormasDePagoSlide && (
            <FormasDePagoSlide tipoFiesta={clientData.tipoFiesta} />
          )}
          {isMenuSlide && (
            <MenuSlide
              menus={data.menus}
              selectedMenuId={selectedMenuId}
              onSelectMenu={setSelectedMenuId}
              onNext={goNext}
            />
          )}
          {isRegalosSlide && (
            <RegalosSlide
              servicios={data.servicios}
              tipoFiesta={clientData.tipoFiesta}
            />
          )}
          {isCierreSlide && (
            <CierreSlide
              companyInfo={data.companyInfo}
              selectedServices={selectedServices}
              servicios={data.servicios}
              selectedMenuId={selectedMenuId}
              menus={menuOptions}
              tipoFiesta={clientData.tipoFiesta}
              clientData={clientData}
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
                    : 'w-2 bg-white/30 hover:bg-white/60',
                )}
              />
            );
          })}
        </div>

        <Button
          onClick={isCierreSlide ? handleGenerateBudget : goNext}
          size="lg"
          className={cn(
            'h-14 px-8 rounded-2xl text-lg font-bold border-0',
            isCierreSlide
              ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-lg'
              : 'bg-white/15 hover:bg-white/25 text-white border border-white/30',
          )}
        >
          {isCierreSlide ? (
            <>Generar Presupuesto</>
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
