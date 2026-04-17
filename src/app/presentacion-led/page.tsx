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
import { getPresentacionLedSettings } from '@/app/actions/contenido-publico';
import type { FullMenu } from '@/types/catering';
import type { CatalogoFoto } from '@/types/catalogo';
import type { PresentacionLedSettings } from '@/types/contenido-publico';
import { cn } from '@/lib/utils';

// Slide components
import { PortadaSlide } from './slides/portada-slide';
import { BeneficiosSlide } from './slides/beneficios-slide';
import { DatosEventoSlide } from './slides/datos-evento-slide';
import { SalonSlide } from './slides/salon-slide';
import { CategoriaServiciosSlide } from './slides/categoria-servicios-slide';
import { MenuSlide } from './slides/menu-slide';
import { MenuAdolescenteSlide } from './slides/menu-adolescente-slide';
import { RecursosSlide } from './slides/recursos-slide';
import { RegalosSlide } from './slides/regalos-slide';
import { CierreSlide } from './slides/cierre-slide';
import { ContratarnosSlide } from './slides/contratarnos-slide';

// Types
import type { PageData, ClientData, CategoriaServicio, ResourceSummary } from './lib/tipos';


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
const NEXT_SLIDE_OFFSET = 1;
const SKIP_TEEN_MENU_OFFSET = 2;
const MAIN_DISHES_PER_PERSON = 1;

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

function normalizeCategory(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function sortCategoriesByFlow(categorias: CategoriaServicio[]): CategoriaServicio[] {
  const orderedPatterns = [
    ['personal'],
    ['catering', 'gastronomia', 'gastronomía'],
    ['barra', 'tragos'],
    ['discoteca'],
    ['dj'],
    ['fotografia'],
    ['filmacion'],
    ['decoracion'],
    ['entretenimiento'],
    ['reposteria'],
  ];

  const getPriority = (name: string) => {
    const n = normalizeCategory(name);
    const idx = orderedPatterns.findIndex((patterns) => patterns.some((p) => n.includes(p)));
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  return [...categorias].sort((a, b) => {
    const pa = getPriority(a.nombre);
    const pb = getPriority(b.nombre);
    if (pa !== pb) return pa - pb;
    return a.nombre.localeCompare(b.nombre);
  });
}

function isMenuCategory(categoria: CategoriaServicio): boolean {
  return normalizeCategory(categoria.nombre).includes('menu');
}

// ---- Slide index constants ----
const FIXED_SLIDES_START = 4; // portada, beneficios, datos evento, salon
const FIXED_SLIDES_END = 3;   // regalos, presupuesto, contratarnos

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
  const [selectedTeenMenuId, setSelectedTeenMenuId] = useState<string | null>(null);
  const [entradasCount, setEntradasCount] = useState<1 | 2>(1);
  const [presentacionSettings, setPresentacionSettings] = useState<PresentacionLedSettings | null>(null);
  const [clientData, setClientData] = useState<ClientData>({
    nombre: '', fechaEvento: '', tipoFiesta: '', cantidadInvitados: '', invitadosAdolescentes: '', duracionHoras: '', salon: '', ciudad: '',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [servicios, companyInfo, invoiceSettings, budgetSettings, menus, catalogoData, ledSettings] = await Promise.all([
          getServiciosEmpresa(),
          getCompanyInfo(),
          getInvoiceTemplateSettings(),
          getBudgetDisplaySettings(),
          getMenus().catch(() => [] as FullMenu[]),
          getCatalogoFotos().catch(() => [] as CatalogoFoto[]),
          getPresentacionLedSettings(),
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
        setPresentacionSettings(ledSettings);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derive category groups from servicios
  const categorias = useMemo<CategoriaServicio[]>(() => {
    if (!data) return [];
    const grouped = groupServicesByCategory(data.servicios);
    const menuCategories = grouped.filter(isMenuCategory);
    const ordered = sortCategoriesByFlow(grouped.filter((c) => !isMenuCategory(c)));
    return [...menuCategories, ...ordered];
  }, [data]);

  const selectedMenu = useMemo(
    () => data?.menus.find((m) => m.id === selectedMenuId) ?? null,
    [data?.menus, selectedMenuId],
  );
  const adolescentMenuOptions = useMemo(() => {
    if (!selectedMenu) return [] as { id: string; name: string }[];
    return selectedMenu.items
      .filter((item) => item.type === 'Menú Infantil/Adolescente' || item.type === 'Menú Infantil')
      .map((item) => ({ id: item.id, name: item.name }));
  }, [selectedMenu]);
  const adolescentCount = Number(clientData.invitadosAdolescentes || '0');
  const requireTeenMenu = adolescentCount > 0 && adolescentMenuOptions.length > 0;
  useEffect(() => {
    if (!selectedTeenMenuId) return;
    const stillExists = adolescentMenuOptions.some((opt) => opt.id === selectedTeenMenuId);
    if (!stillExists) {
      setSelectedTeenMenuId(null);
    }
  }, [adolescentMenuOptions, selectedTeenMenuId]);

  const dynamicSlides = useMemo<Array<{ type: 'menu-principal' | 'menu-adolescente' | 'recursos' | 'categoria'; categoria?: CategoriaServicio }>>(() => {
    const categorySlides = categorias.filter((c) => !isMenuCategory(c));
    return [
      { type: 'menu-principal' },
      { type: 'menu-adolescente' },
      { type: 'recursos' },
      ...categorySlides.map((categoria) => ({ type: 'categoria' as const, categoria })),
    ];
  }, [categorias]);

  const resourceSummary = useMemo<ResourceSummary>(() => {
    const invitados = Math.max(0, Number(clientData.cantidadInvitados || '0'));
    const mesas = Math.max(1, Math.ceil(invitados / 10));
    const mozos = Math.max(1, Math.ceil(invitados / 10));
    const vajilla = invitados * Math.max(1, entradasCount + MAIN_DISHES_PER_PERSON);
    const manteleria = mesas;
    const requiereAsador = Boolean(
      selectedServices.some((id) => {
        const srv = data?.servicios.find((s) => s.id === id);
        const text = `${srv?.nombre || ''} ${srv?.categoria || ''}`.toLowerCase();
        return text.includes('asado') || text.includes('parrilla') || text.includes('asador');
      }) || selectedMenu?.name.toLowerCase().includes('asado') || selectedMenu?.description?.toLowerCase().includes('parrilla'),
    );
    return {
      invitadosTotales: invitados,
      mesas,
      sillas: invitados,
      vajilla,
      manteleria,
      mozos,
      requiereAsador,
    };
  }, [clientData.cantidadInvitados, entradasCount, selectedServices, data?.servicios, selectedMenu]);

  const totalSlides = data ? FIXED_SLIDES_START + dynamicSlides.length + FIXED_SLIDES_END : 0;

  const dynamicStartIndex = FIXED_SLIDES_START;
  const dynamicEndIndex = dynamicStartIndex + dynamicSlides.length;
  const regalosSlideIndex = dynamicEndIndex;
  const cierreSlideIndex = regalosSlideIndex + 1;
  const contratarnosSlideIndex = cierreSlideIndex + 1;

  const isPortadaSlide = currentSlide === 0;
  const isBeneficiosSlide = currentSlide === 1;
  const isDatosEventoSlide = currentSlide === 2;
  const isSalonSlide = currentSlide === 3;
  const isDynamicSlide = currentSlide >= dynamicStartIndex && currentSlide < dynamicEndIndex;
  const dynamicIndex = isDynamicSlide ? currentSlide - dynamicStartIndex : -1;
  const currentDynamicSlide = isDynamicSlide ? dynamicSlides[dynamicIndex] : null;
  const categoriaSlidesCount = dynamicSlides.filter((s) => s.type === 'categoria').length;
  const categoriaIndex = currentDynamicSlide?.type === 'categoria'
    ? dynamicSlides.slice(0, dynamicIndex + 1).filter((s) => s.type === 'categoria').length - 1
    : 0;
  const currentCategoria = currentDynamicSlide?.type === 'categoria' ? currentDynamicSlide.categoria || null : null;
  const isRegalosSlide = currentSlide === regalosSlideIndex;
  const isCierreSlide = currentSlide === cierreSlideIndex;
  const isContratarnosSlide = currentSlide === contratarnosSlideIndex;
  const canAdvanceFromDatos = Boolean(
    clientData.nombre.trim()
    && clientData.tipoFiesta
    && clientData.fechaEvento
    && Number(clientData.cantidadInvitados) > 0
    && Number(clientData.duracionHoras) > 0,
  );
  const canAdvanceFromTeenMenu = !requireTeenMenu || !!selectedTeenMenuId;
  const nextDisabled = (
    (isDatosEventoSlide && !canAdvanceFromDatos)
    || (currentDynamicSlide?.type === 'menu-principal' && !selectedMenuId)
    || (currentDynamicSlide?.type === 'menu-adolescente' && !canAdvanceFromTeenMenu)
  );

  const getSlideLabel = () => {
    if (isPortadaSlide) return 'Portada';
    if (isBeneficiosSlide) return '¿Por qué elegirnos?';
    if (isDatosEventoSlide) return 'Datos del Evento';
    if (isSalonSlide) return 'Nuestro Salón';
    if (currentDynamicSlide?.type === 'menu-principal') return 'Menú principal y entradas';
    if (currentDynamicSlide?.type === 'menu-adolescente') return 'Menú adolescente';
    if (currentDynamicSlide?.type === 'recursos') return 'Cálculo automático';
    if (currentDynamicSlide?.type === 'categoria') return currentCategoria?.nombre ?? 'Servicios';
    if (isRegalosSlide) return 'Regalos';
    if (isCierreSlide) return 'Presupuesto';
    if (isContratarnosSlide) return 'Contratarnos';
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
        invitadosAdolescentes: clientData.invitadosAdolescentes,
        duracionHoras: clientData.duracionHoras,
        salon: clientData.salon.slice(0, 200),
        ciudad: clientData.ciudad.slice(0, 120),
      };
      sessionStorage.setItem('presentacion_cliente_data', JSON.stringify(safeClientData));
    }
    if (selectedMenuId && /^[\w-]+$/.test(selectedMenuId)) {
      sessionStorage.setItem('presentacion_menu_seleccionado', selectedMenuId);
    }
    sessionStorage.setItem('presentacion_menu_entradas', String(entradasCount));
    if (selectedTeenMenuId && /^[\w-]+$/.test(selectedTeenMenuId)) {
      sessionStorage.setItem('presentacion_menu_adolescente', selectedTeenMenuId);
    }
    router.push('/presupuestos/nuevo/crear');
  }, [selectedServices, clientData, selectedMenuId, selectedTeenMenuId, entradasCount, router]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePlanPagos = useCallback(() => {
    const params = new URLSearchParams();
    if (clientData.nombre) params.set('cliente', clientData.nombre.slice(0, 200));
    if (clientData.fechaEvento) params.set('fecha', clientData.fechaEvento);
    const query = params.toString();
    router.push(query ? `/presupuestos/nuevo/crear?${query}` : '/presupuestos/nuevo/crear');
  }, [clientData, router]);

  const handleContrato = useCallback(() => {
    const params = new URLSearchParams();
    params.set('doc', 'contrato');
    if (clientData.nombre) params.set('cliente', clientData.nombre.slice(0, 200));
    if (clientData.fechaEvento) params.set('fecha', clientData.fechaEvento);
    router.push(`/presupuestos/nuevo/crear?${params.toString()}`);
  }, [router, clientData.nombre, clientData.fechaEvento]);

  const handleCierreCta = useCallback(() => {
    const action = presentacionSettings?.cierre?.ctaAccion || 'generar-presupuesto';
    if (action === 'whatsapp') {
      const text = encodeURIComponent('Hola, quiero avanzar con la contratación de mi evento.');
      window.open(`https://wa.me/59898355530?text=${text}`, '_blank');
      return;
    }
    if (action === 'contacto') {
      window.location.href = 'mailto:info@akproducciones.uy';
      return;
    }
    handleGenerateBudget();
  }, [presentacionSettings?.cierre?.ctaAccion, handleGenerateBudget]);

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
              tituloPrincipal={presentacionSettings?.portada.tituloPrincipal}
              subtitulo={presentacionSettings?.portada.subtitulo}
              imagenFondoUrl={presentacionSettings?.portada.imagenFondoUrl}
              colorAcento={presentacionSettings?.portada.colorAcento}
              onNext={goNext}
            />
          )}
          {isBeneficiosSlide && (
            <BeneficiosSlide
              beneficios={presentacionSettings?.porQueElegirnos.beneficios}
              imagenLateralUrl={presentacionSettings?.porQueElegirnos.imagenLateralUrl}
            />
          )}
          {isDatosEventoSlide && (
            <DatosEventoSlide
              clientData={clientData}
              onClientDataChange={setClientData}
              onNext={goNext}
            />
          )}
          {isSalonSlide && (
            <SalonSlide
              catalogoFotos={catalogoFotos}
              companyInfo={data.companyInfo}
              tipoFiesta={clientData.tipoFiesta}
              titulo={presentacionSettings?.salon.titulo}
              descripcion={presentacionSettings?.salon.descripcion}
              fotosPersonalizadas={presentacionSettings?.salon.fotos}
            />
          )}
          {currentDynamicSlide?.type === 'menu-principal' && (
            <MenuSlide
              menus={data.menus}
              selectedMenuId={selectedMenuId}
              entradasCount={entradasCount}
              adolescentesCount={adolescentCount}
              onSelectMenu={setSelectedMenuId}
              onChangeEntradasCount={setEntradasCount}
              onNext={() => goToSlide(currentSlide + (requireTeenMenu ? NEXT_SLIDE_OFFSET : SKIP_TEEN_MENU_OFFSET))}
            />
          )}
          {currentDynamicSlide?.type === 'menu-adolescente' && (
            <MenuAdolescenteSlide
              adolescentesCount={adolescentCount}
              options={adolescentMenuOptions}
              selectedOptionId={selectedTeenMenuId}
              onSelect={setSelectedTeenMenuId}
              onNext={goNext}
            />
          )}
          {currentDynamicSlide?.type === 'recursos' && (
            <RecursosSlide summary={resourceSummary} onNext={goNext} />
          )}
          {currentDynamicSlide?.type === 'categoria' && currentCategoria && (
            <CategoriaServiciosSlide
              categoria={currentCategoria.nombre}
              servicios={currentCategoria.servicios}
              selectedServices={selectedServices}
              onToggleSelect={toggleSelect}
              mostrarPrecios={data.mostrarPrecios}
              categoriaIndex={categoriaIndex}
              totalCategorias={categoriaSlidesCount}
              catalogoFotos={catalogoFotos}
              tipoFiesta={clientData.tipoFiesta}
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
              selectedTeenMenuName={adolescentMenuOptions.find((o) => o.id === selectedTeenMenuId)?.name || null}
              resourceSummary={resourceSummary}
              onGenerateBudget={handleGenerateBudget}
              onPrint={handlePrint}
              onPlanPagos={handlePlanPagos}
              onContrato={handleContrato}
              mostrarPrecios={data.mostrarPrecios}
            />
          )}
          {isContratarnosSlide && (
            <ContratarnosSlide
              titulo={presentacionSettings?.cierre.titulo || 'Contratarnos'}
              mensaje={presentacionSettings?.cierre.mensaje || 'Estamos listos para ayudarte con tu evento.'}
              ctaTexto={presentacionSettings?.cierre.ctaTexto || 'Generar Presupuesto Manual'}
              onCtaAction={handleCierreCta}
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
          onClick={isContratarnosSlide ? handleCierreCta : goNext}
          disabled={!isContratarnosSlide && nextDisabled}
          size="lg"
          className={cn(
            'h-14 px-8 rounded-2xl text-lg font-bold border-0',
            isContratarnosSlide
              ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-lg'
              : 'bg-white/15 hover:bg-white/25 text-white border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isContratarnosSlide ? (
            <>{presentacionSettings?.cierre.ctaTexto || 'Contratarnos'}</>
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
