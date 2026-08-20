'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Loader2,
  DollarSign,
  Users,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getServiciosEmpresaPublicos } from '@/app/actions/servicios-empresa';
import { getCompanyInfoPublica, getInvoiceTemplateSettings, getBudgetDisplaySettings } from '@/app/actions/settings';
import { getMenusPublicos } from '@/app/actions/menus-catering';
import { getCatalogoFotos } from '@/app/actions/catalogo-fotos';
import { getPresentacionLedSettings } from '@/app/actions/contenido-publico';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { CatalogoFoto } from '@/types/catalogo';
import type { PresentacionLedSettings } from '@/types/contenido-publico';
import { cn } from '@/lib/utils';

// Slide components
import { PortadaSlide } from './slides/portada-slide';
import { BeneficiosSlide } from './slides/beneficios-slide';
import { DatosEventoSlide } from './slides/datos-evento-slide';
import { SalonSlide } from './slides/salon-slide';
import { EquipoSlide } from './slides/equipo-slide';
import { CategoriaServiciosSlide } from './slides/categoria-servicios-slide';
import { EntradaSlide } from './slides/entradas-slide';
import { MenuAdolescenteSlide } from './slides/menu-adolescente-slide';
import { MenuAdultoSlide } from './slides/menu-adulto-slide';
import { RegalosSlide } from './slides/regalos-slide';
import { TestimoniosSlide } from './slides/testimonios-slide';
import { EmpresasSlide } from './slides/empresas-slide';
import { CierreSlide } from './slides/cierre-slide';
import { PlanPagosSlide } from './slides/plan-pagos-slide';
import { ContratarnosSlide } from './slides/contratarnos-slide';
import { GaleriaLightboxModal } from './components/galeria-lightbox-modal';

// Types
import type { PageData, ClientData, CategoriaServicio, ResourceSummary } from './lib/tipos';
import { calcularTotalServicioLed } from './lib/calculos';


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
/** Event duration (hours) from which 2 entradas are required instead of 1 */
const ENTRADA_DUAL_DURATION_THRESHOLD = 4;
// Fixed slides: portada(0), beneficios(1), datos(2), salon(3)
const SALON_SLIDE_INDEX = 3;
const DYNAMIC_START = 4; // = FIXED_SLIDES_START

// ---- Helpers ----

function isSafeImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return /^https?:\/\//i.test(url) || url.startsWith('/') || /^data:image\//i.test(url);
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
const FIXED_SLIDES_START = 5; // portada(0), beneficios(1), datos evento(2), salon(3), equipo(4)
const FIXED_SLIDES_END = 4;   // regalos, presupuesto, plan de pagos, contratarnos

// ---- Main Component ----

export default function PresentacionLedPage() {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [catalogoFotos, setCatalogoFotos] = useState<CatalogoFoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedTeenMenuId, setSelectedTeenMenuId] = useState<string | null>(null);
  const [selectedEntradasIds, setSelectedEntradasIds] = useState<string[]>([]);
  // entradasCount is derived from duration (1 if < ENTRADA_DUAL_DURATION_THRESHOLD hours, 2 otherwise)
  const [presentacionSettings, setPresentacionSettings] = useState<PresentacionLedSettings | null>(null);
  const [clientData, setClientData] = useState<ClientData>({
    nombre: '', fechaEvento: '', tipoFiesta: '', cantidadInvitados: '', invitadosAdultos: '', invitadosAdolescentes: '', duracionHoras: '', tieneSalon: undefined, salon: '',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCategoria, setGalleryCategoria] = useState('');
  const [showBudgetPanel, setShowBudgetPanel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [servicios, companyInfo, invoiceSettings, budgetSettings, menus, catalogoData, ledSettings] = await Promise.all([
        getServiciosEmpresaPublicos(),
        getCompanyInfoPublica(),
        getInvoiceTemplateSettings(),
        getBudgetDisplaySettings(),
        getMenusPublicos().catch(() => [] as FullMenu[]),
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
      setLoadError(null);
    } catch (e) {
      // Este catalogo se usa en el salon, con el cliente al lado y con la senal
      // que haya. Sin este aviso, si una carga fallaba la pantalla quedaba en
      // blanco para siempre y no habia forma de saber si esperar o reintentar.
      console.error('[presentacion-led] no se pudo cargar la presentacion', e);
      setLoadError('No pudimos cargar la presentacion. Revisa la senal y proba de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reintento automatico cada 10 segundos si falló la carga o no hay datos
  useEffect(() => {
    if (!loadError || data) return;
    const interval = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadError, data, load]);

  // Derive category groups from servicios
  const categorias = useMemo<CategoriaServicio[]>(() => {
    if (!data) return [];
    const grouped = groupServicesByCategory(data.servicios);
    const menuCategories = grouped.filter(isMenuCategory);
    const ordered = sortCategoriesByFlow(grouped.filter((c) => !isMenuCategory(c)));
    return [...menuCategories, ...ordered];
  }, [data]);

  const adultMenuOptions = useMemo<FullMenu[]>(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return data.menus.flatMap(menu => menu.items
      .filter(item => item.type === 'Plato Principal' && !seen.has(item.id))
      .map(item => {
        seen.add(item.id);
        return {
          id: item.id,
          name: item.name,
          description: item.notes || menu.description,
          imageUrl: item.imageUrl,
          featured: item.isFeatured || menu.featured,
          items: [item],
        };
      }));
  }, [data]);
  const selectedMenu = useMemo(
    () => adultMenuOptions.find((menu) => menu.id === selectedMenuId) ?? null,
    [adultMenuOptions, selectedMenuId],
  );
  const adolescentMenuOptions = useMemo(() => {
    if (!data) return [] as MenuItem[];
    const seen = new Set<string>();
    const result: MenuItem[] = [];
    for (const menu of data.menus) {
      for (const item of menu.items) {
        if ((item.type === 'Menú Infantil/Adolescente' || item.type === 'Menú Infantil') && !seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        }
      }
    }
    return result;
  }, [data]);
  const adolescentCount = Number(clientData.invitadosAdolescentes || '0');

  // Collect entrada items from all menus before calculating the live total.
  const todasLasEntradas = useMemo<MenuItem[]>(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const result: MenuItem[] = [];
    for (const menu of data.menus) {
      for (const item of menu.items) {
        if (item.type === 'Entrada' && !seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        }
      }
    }
    return result;
  }, [data]);

  /**
   * Precio por persona de un menu: la suma de lo que sale cada plato.
   *
   * Se usa el precio de venta sugerido de cada plato. Si un plato no lo tiene
   * cargado, se cae a su costo, que es preferible a contarlo como cero: un plato
   * en cero baja el total y el numero que ve el cliente queda por debajo del real.
   */
  const precioPorPersonaDeMenu = (platos: MenuItem[] | undefined) =>
    (platos ?? []).reduce(
      (suma, plato) => suma + (Number(plato.suggestedSellingPrice) || Number(plato.totalDishCost) || 0),
      0,
    );
  const requireTeenMenu = adolescentCount > 0 && adolescentMenuOptions.length > 0;

  /**
   * El total que se le muestra al cliente en la tablet.
   *
   * Antes sumaba unicamente los servicios. El menu se elegia en pantalla, se veia
   * elegido, y su precio no entraba nunca: el numero que leia el cliente quedaba
   * por debajo del real y habia que corregirselo para arriba en la cara, que es la
   * peor forma de perder una venta.
   *
   * Ahora suma los servicios con su metodo real, las entradas para todos los invitados,
   * el menu de adultos por cada adulto y el menu adolescente por cada adolescente.
   */
  const totalEstimadoConMenu = useMemo(() => {
    const adultos = Math.max(0, Number(clientData.invitadosAdultos || '0'));
    const adolescentes = Math.max(0, Number(clientData.invitadosAdolescentes || '0'));
    const servicios = selectedServices.reduce((acc, id) => {
      const srv = data?.servicios.find(s => s.id === id);
      return srv ? acc + calcularTotalServicioLed(srv, adultos, adolescentes) : acc;
    }, 0);

    const entradas = selectedEntradasIds.reduce((acc, id) => {
      const entrada = todasLasEntradas.find(item => item.id === id);
      return acc + precioPorPersonaDeMenu(entrada ? [entrada] : []) * (adultos + adolescentes);
    }, 0);
    const menuAdultos = precioPorPersonaDeMenu(selectedMenu?.items) * adultos;

    const platoAdolescente = adolescentMenuOptions.find(opt => opt.id === selectedTeenMenuId);
    const menuAdolescentes = precioPorPersonaDeMenu(platoAdolescente ? [platoAdolescente] : []) * adolescentCount;

    return Math.round(servicios + entradas + menuAdultos + menuAdolescentes);
  }, [
    selectedServices,
    data?.servicios,
    selectedEntradasIds,
    todasLasEntradas,
    clientData.invitadosAdultos,
    clientData.invitadosAdolescentes,
    selectedMenu,
    adolescentMenuOptions,
    selectedTeenMenuId,
    adolescentCount,
  ]);
  useEffect(() => {
    if (!selectedTeenMenuId) return;
    const stillExists = adolescentMenuOptions.some((opt) => opt.id === selectedTeenMenuId);
    if (!stillExists) {
      setSelectedTeenMenuId(null);
    }
  }, [adolescentMenuOptions, selectedTeenMenuId]);

  const dynamicSlides = useMemo<Array<{ type: 'entradas' | 'menu-adolescente' | 'menu-adulto' | 'categoria'; categoria?: CategoriaServicio }>>(() => {
    const categorySlides = categorias.filter((c) => {
      if (isMenuCategory(c)) return false;
      const n = normalizeCategory(c.nombre);
      // Hide catering/personal from category slides (handled separately in menu flow)
      if (n.includes('catering') || n.includes('gastronomia') || n.includes('personal')) return false;
      return true;
    });
    return [
      { type: 'entradas' },
      { type: 'menu-adulto' },
      { type: 'menu-adolescente' },
      ...categorySlides.map((categoria) => ({ type: 'categoria' as const, categoria })),
    ];
  }, [categorias]);

  const requiredEntradasCount: 1 | 2 = Number(clientData.duracionHoras) >= ENTRADA_DUAL_DURATION_THRESHOLD ? 2 : 1;

  const resourceSummary = useMemo<ResourceSummary>(() => {
    const adultos = Math.max(0, Number(clientData.invitadosAdultos || '0'));
    const ninos = Math.max(0, Number(clientData.invitadosAdolescentes || '0'));
    const invitados = adultos + ninos;
    const mesas = Math.max(1, Math.ceil(invitados / 10));
    const mozos = Math.max(1, Math.ceil(invitados / 10));
    const vajilla = invitados * Math.max(1, requiredEntradasCount + MAIN_DISHES_PER_PERSON);
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
  }, [clientData.invitadosAdultos, clientData.invitadosAdolescentes, requiredEntradasCount, selectedServices, data?.servicios, selectedMenu]);

  const dynamicStartIndex = FIXED_SLIDES_START;
  const dynamicEndIndex = dynamicStartIndex + dynamicSlides.length;
  const regalosSlideIndex = dynamicEndIndex;
  const testimoniosSlideIndex = regalosSlideIndex + 1;
  const empresasSlideIndex = testimoniosSlideIndex + 1;
  const cierreSlideIndex = empresasSlideIndex + 1;
  const planPagosSlideIndex = cierreSlideIndex + 1;
  const contratarnosSlideIndex = planPagosSlideIndex + 1;

  const totalSlides = data ? contratarnosSlideIndex + 1 : 0;

  const isPortadaSlide = currentSlide === 0;
  const isBeneficiosSlide = currentSlide === 1;
  const isDatosEventoSlide = currentSlide === 2;
  const isSalonSlide = currentSlide === 3;
  const isEquipoSlide = currentSlide === 4;
  const isDynamicSlide = currentSlide >= dynamicStartIndex && currentSlide < dynamicEndIndex;
  const dynamicIndex = isDynamicSlide ? currentSlide - dynamicStartIndex : -1;
  const currentDynamicSlide = isDynamicSlide ? dynamicSlides[dynamicIndex] : null;
  const categoriaSlidesCount = dynamicSlides.filter((s) => s.type === 'categoria').length;
  const categoriaIndex = currentDynamicSlide?.type === 'categoria'
    ? dynamicSlides.slice(0, dynamicIndex + 1).filter((s) => s.type === 'categoria').length - 1
    : 0;
  const currentCategoria = currentDynamicSlide?.type === 'categoria' ? currentDynamicSlide.categoria || null : null;
  const isRegalosSlide = currentSlide === regalosSlideIndex;
  const isTestimoniosSlide = currentSlide === testimoniosSlideIndex;
  const isEmpresasSlide = currentSlide === empresasSlideIndex;
  const isCierreSlide = currentSlide === cierreSlideIndex;
  const isPlanPagosSlide = currentSlide === planPagosSlideIndex;
  const isContratarnosSlide = currentSlide === contratarnosSlideIndex;
  const canAdvanceFromDatos = Boolean(
    clientData.nombre.trim()
    && clientData.tipoFiesta
    && clientData.fechaEvento
    && Number(clientData.invitadosAdultos) > 0
    && clientData.duracionHoras !== '',
  );

  // Gallery handler — opens inline lightbox instead of navigating away
  const handleOpenGallery = useCallback((categoria: string) => {
    setGalleryCategoria(categoria);
    setGalleryOpen(true);
  }, []);

  const galleryFotos = useMemo(() => {
    if (!galleryCategoria) return catalogoFotos;
    const norm = galleryCategoria.toLowerCase();
    const byCategory = catalogoFotos.filter(
      (f) => f.categoriaServicio.toLowerCase() === norm,
    );
    return byCategory.length > 0 ? byCategory : catalogoFotos;
  }, [catalogoFotos, galleryCategoria]);

  const canAdvanceFromEntradas = todasLasEntradas.length === 0 || selectedEntradasIds.length >= requiredEntradasCount;

  const canAdvanceFromTeenMenu = !requireTeenMenu || !!selectedTeenMenuId;
  const nextDisabled = false; // Free navigation — vendor can move to any slide at any time

  const getSlideLabel = () => {
    if (isPortadaSlide) return 'Portada';
    if (isBeneficiosSlide) return '¿Por qué elegirnos?';
    if (isDatosEventoSlide) return 'Datos del Evento';
    if (isSalonSlide) return 'Nuestro Salón';
    if (isEquipoSlide) return 'Hay Equipo';
    if (currentDynamicSlide?.type === 'entradas') return 'Entradas';
    if (currentDynamicSlide?.type === 'menu-adolescente') return 'Menú adolescente';
    if (currentDynamicSlide?.type === 'menu-adulto') return 'Menú adultos';
    if (currentDynamicSlide?.type === 'categoria') return currentCategoria?.nombre ?? 'Servicios';
    if (isRegalosSlide) return 'Regalos';
    if (isTestimoniosSlide) return 'Testimonios';
    if (isEmpresasSlide) return 'Empresas Colaboradoras';
    if (isCierreSlide) return 'Presupuesto';
    if (isPlanPagosSlide) return 'Plan de Pagos';
    if (isContratarnosSlide) return 'Contratarnos';
    return '';
  };

  const goToSlide = useCallback((next: number) => {
    if (!data) return;
    const clamped = Math.max(0, Math.min(next, totalSlides - 1));
    setDirection(next > currentSlide ? 1 : -1);
    setCurrentSlide(clamped);
    // Save current slide for gallery "back to presentation" button
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('presentacion_slide_actual', String(clamped));
    }
  }, [data, currentSlide, totalSlides]);

  const isSlideVisible = useCallback((index: number) => {
    if (index === SALON_SLIDE_INDEX && clientData.tieneSalon === true) {
      return false;
    }

    // Check if it's a dynamic slide
    if (index >= DYNAMIC_START && index < dynamicEndIndex) {
      const dynIndex = index - DYNAMIC_START;
      const slide = dynamicSlides[dynIndex];
      if (slide.type === 'menu-adolescente' && !requireTeenMenu) {
        return false;
      }
    }

    return true;
  }, [clientData.tieneSalon, requireTeenMenu, dynamicSlides, dynamicEndIndex]);

  const goNext = useCallback(() => {
    let next = currentSlide + 1;
    while (next < totalSlides && !isSlideVisible(next)) {
      next++;
    }
    if (next < totalSlides) {
      goToSlide(next);
    }
  }, [currentSlide, totalSlides, isSlideVisible, goToSlide]);

  const goPrev = useCallback(() => {
    let prev = currentSlide - 1;
    while (prev >= 0 && !isSlideVisible(prev)) {
      prev--;
    }
    if (prev >= 0) {
      goToSlide(prev);
    }
  }, [currentSlide, isSlideVisible, goToSlide]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const toggleEntrada = useCallback((id: string) => {
    setSelectedEntradasIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const handleGenerateBudget = useCallback(() => {
    // IDs come from server-fetched ServicioEmpresa records (alphanumeric + hyphens/underscores)
    const safeIds = Array.from(new Set([...selectedServices, ...selectedEntradasIds])).filter(id => /^[\w-]+$/.test(id));
    if (safeIds.length > 0) {
      sessionStorage.setItem('presentacion_servicios_seleccionados', JSON.stringify(safeIds));
    }
    if (selectedEntradasIds.length > 0) {
      sessionStorage.setItem('presentacion_entradas_seleccionadas', JSON.stringify(selectedEntradasIds));
    }
    if (clientData.nombre || clientData.fechaEvento || clientData.tipoFiesta) {
      const safeClientData = {
        nombre: clientData.nombre.slice(0, 200),
        fechaEvento: clientData.fechaEvento,
        tipoFiesta: clientData.tipoFiesta.slice(0, 100),
        cantidadInvitados: clientData.cantidadInvitados,
        invitadosAdultos: clientData.invitadosAdultos,
        invitadosAdolescentes: clientData.invitadosAdolescentes,
        duracionHoras: clientData.duracionHoras,
        tieneSalon: clientData.tieneSalon,
        salon: clientData.salon.slice(0, 200),
      };
      sessionStorage.setItem('presentacion_cliente_data', JSON.stringify(safeClientData));
    }
    if (selectedMenuId && /^[\w-]+$/.test(selectedMenuId)) {
      sessionStorage.setItem('presentacion_menu_seleccionado', selectedMenuId);
    }
    sessionStorage.setItem('presentacion_menu_entradas', String(requiredEntradasCount));
    if (selectedTeenMenuId && /^[\w-]+$/.test(selectedTeenMenuId)) {
      sessionStorage.setItem('presentacion_menu_adolescente', selectedTeenMenuId);
    }
    const params = new URLSearchParams();
    if (clientData.nombre.trim()) params.set('leadName', clientData.nombre.trim());
    if (clientData.fechaEvento) params.set('fecha', clientData.fechaEvento);
    if (clientData.tipoFiesta.trim()) params.set('tipoFiesta', clientData.tipoFiesta.trim());
    if (clientData.duracionHoras) params.set('duracionHoras', clientData.duracionHoras);
    if (clientData.salon.trim()) params.set('salon', clientData.salon.trim());
    if (clientData.invitadosAdultos) params.set('adultos', clientData.invitadosAdultos);
    if (clientData.invitadosAdolescentes) params.set('ninos', clientData.invitadosAdolescentes);
    safeIds.forEach((id) => params.append('servicios', id));
    if (selectedMenuId && /^[\w-]+$/.test(selectedMenuId)) params.set('menuId', selectedMenuId);
    if (selectedTeenMenuId && /^[\w-]+$/.test(selectedTeenMenuId)) params.set('teenMenuId', selectedTeenMenuId);
    const query = params.toString();
    router.push(query ? `/presupuestos/nuevo/crear?${query}` : '/presupuestos/nuevo/crear');
  }, [selectedServices, selectedEntradasIds, clientData, selectedMenuId, selectedTeenMenuId, requiredEntradasCount, router]);

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

  if (loading && !loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
          <p className="text-white/60 text-lg">Cargando presentación...</p>
        </div>
      </div>
    );
  }

  // Antes esto devolvia una pantalla en blanco: el catalogo se usa delante del
  // cliente y quedaba sin nada, sin explicacion y sin forma de reintentar.
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-6">
        <div className="flex max-w-md flex-col items-center gap-5 text-center">
          <p className="text-xl font-bold text-white">
            {loadError ?? 'No pudimos cargar la presentacion.'}
          </p>
          <p className="text-white/60">
            Suele ser la senal del salon. Reintentando automaticamente cada 10 segundos...
          </p>
          <button
            type="button"
            onClick={load}
            className="min-h-12 rounded-xl bg-indigo-500 px-8 text-base font-bold text-white flex items-center justify-center gap-2 hover:bg-indigo-600 transition"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Reintentar ahora
          </button>
        </div>
      </div>
    );
  }

  const menuOptions = adultMenuOptions.map(menu => ({ id: menu.id, name: menu.name }));

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
            <Image src={data.logoUrl} alt="Logo" width={160} height={40} className="h-10 w-auto object-contain" unoptimized />
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

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="text-white/60 hover:text-white hover:bg-white/10 border border-white/10 h-9 px-3 text-xs rounded-lg font-semibold"
          >
            <a href="/marketing/demo-tecnologia">
              Demo Comercial
            </a>
          </Button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
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
          {isEquipoSlide && (
            <EquipoSlide
              tipoFiesta={clientData.tipoFiesta}
              equipoSettings={presentacionSettings?.equipo}
            />
          )}
          {currentDynamicSlide?.type === 'entradas' && (
            <EntradaSlide
              entradas={todasLasEntradas}
              selectedIds={selectedEntradasIds}
              requiredCount={requiredEntradasCount}
              ledFotoMap={presentacionSettings?.ledFotosMenuItems || {}}
              mostrarPrecios={data.mostrarPrecios}
              onToggle={toggleEntrada}
              onNext={goNext}
            />
          )}
          {currentDynamicSlide?.type === 'menu-adolescente' && (
            <MenuAdolescenteSlide
              adolescentesCount={adolescentCount}
              options={adolescentMenuOptions}
              selectedOptionId={selectedTeenMenuId}
              ledFotoMap={presentacionSettings?.ledFotosMenuItems || {}}
              mostrarPrecios={data.mostrarPrecios}
              onSelect={setSelectedTeenMenuId}
              onNext={goNext}
            />
          )}
          {currentDynamicSlide?.type === 'menu-adulto' && (
            <MenuAdultoSlide
              menus={adultMenuOptions}
              selectedMenuId={selectedMenuId}
              ledFotoMap={presentacionSettings?.ledFotosMenuItems || {}}
              mostrarPrecios={data.mostrarPrecios}
              onSelect={setSelectedMenuId}
              onNext={goNext}
            />
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
              ledFotoMap={presentacionSettings?.ledFotosServicios || {}}
              onOpenGallery={handleOpenGallery}
            />
          )}
          {isRegalosSlide && (
            <RegalosSlide
              servicios={data.servicios}
              tipoFiesta={clientData.tipoFiesta}
              catalogoFotos={catalogoFotos}
              ledFotoMap={presentacionSettings?.ledFotosServicios || {}}
            />
          )}
          {isTestimoniosSlide && (
            <TestimoniosSlide tipoFiesta={clientData.tipoFiesta} />
          )}
          {isEmpresasSlide && (
            <EmpresasSlide logos={presentacionSettings?.empresasColaboradoras} />
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
              totalEstimado={totalEstimadoConMenu}
              resourceSummary={resourceSummary}
              onGenerateBudget={handleGenerateBudget}
              onPrint={handlePrint}
              onPlanPagos={handlePlanPagos}
              onContrato={handleContrato}
              mostrarPrecios={data.mostrarPrecios}
            />
          )}
          {isPlanPagosSlide && (
            <PlanPagosSlide
              companyInfo={data.companyInfo}
              tipoFiesta={clientData.tipoFiesta}
              clienteNombre={clientData.nombre}
              fechaEvento={clientData.fechaEvento}
              totalEstimado={totalEstimadoConMenu}
              mostrarPrecios={data.mostrarPrecios}
              imagenFondoUrl={presentacionSettings?.planPagosImagenUrl}
              onContrato={handleContrato}
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
      <div className="absolute bottom-5 sm:bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-3 sm:gap-4 px-4">
        <Button
          onClick={goPrev}
          disabled={currentSlide === 0}
          variant="ghost"
          size="lg"
          className="h-12 sm:h-14 px-5 sm:px-8 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-base sm:text-lg font-semibold"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5 sm:mr-2" />
          Anterior
        </Button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 mx-2 sm:mx-4">
          {Array.from({ length: Math.min(totalSlides, 9) }).map((_, i) => {
            const slideIdx = totalSlides <= 9 ? i : Math.round(i * (totalSlides - 1) / 8);
            return (
              <button
                key={i}
                onClick={() => goToSlide(slideIdx)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  currentSlide === slideIdx
                    ? 'w-6 sm:w-8 bg-white'
                    : 'w-2 bg-white/30 hover:bg-white/60',
                )}
              />
            );
          })}
        </div>

        <Button
          onClick={isContratarnosSlide ? handleCierreCta : goNext}
          disabled={!isContratarnosSlide && (nextDisabled || currentSlide >= totalSlides - 1)}
          size="lg"
          className={cn(
            'h-12 sm:h-14 px-5 sm:px-8 rounded-2xl text-base sm:text-lg font-bold border-0',
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
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 ml-1.5 sm:ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/20 text-xs pointer-events-none">
        ← → Navegar · F Pantalla completa
      </div>

      {/* ── Floating real-time budget bar ── */}
      {selectedServices.length > 0 && data.mostrarPrecios && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/90 px-5 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">Cotización</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-lg font-black text-white">
              ${totalEstimadoConMenu.toLocaleString('es-UY')}
            </span>
            <div className="h-4 w-px bg-white/20" />
            <button
              onClick={() => setShowBudgetPanel((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold text-white/70 transition-all hover:bg-white/20 hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Ajustar
            </button>
            <span className="text-xs text-white/40">{selectedServices.length} servicio{selectedServices.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Quick adjust panel */}
          <AnimatePresence>
            {showBudgetPanel && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-1/2 mb-3 w-72 -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-white">Ajuste rápido</span>
                  <button onClick={() => setShowBudgetPanel(false)} className="text-white/40 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/50">Adultos</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setClientData((d) => ({ ...d, invitadosAdultos: String(Math.max(0, Number(d.invitadosAdultos || 0) - 10)) }))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >-</button>
                      <span className="flex-1 text-center text-base font-black text-white">{clientData.invitadosAdultos || 0}</span>
                      <button
                        onClick={() => setClientData((d) => ({ ...d, invitadosAdultos: String(Number(d.invitadosAdultos || 0) + 10) }))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >+</button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/50">Adolescentes</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setClientData((d) => ({ ...d, invitadosAdolescentes: String(Math.max(0, Number(d.invitadosAdolescentes || 0) - 5)) }))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >-</button>
                      <span className="flex-1 text-center text-base font-black text-white">{clientData.invitadosAdolescentes || 0}</span>
                      <button
                        onClick={() => setClientData((d) => ({ ...d, invitadosAdolescentes: String(Number(d.invitadosAdolescentes || 0) + 5) }))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >+</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-black text-emerald-300">
                      {Number(clientData.invitadosAdultos || 0) + Number(clientData.invitadosAdolescentes || 0)} invitados totales
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Gallery Lightbox Modal ── */}
      <GaleriaLightboxModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        fotos={galleryFotos}
        categoriaLabel={galleryCategoria || 'Galería'}
      />
    </div>
  );
}
