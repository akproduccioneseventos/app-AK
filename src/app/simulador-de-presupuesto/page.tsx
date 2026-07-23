
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ArrowLeft, ArrowRight, Loader2, PartyPopper, Users,
    Clock, CalendarDays, Search, Check, Info,
    Share2, Gift, ListPlus, ShieldCheck, Zap, Star,
    Building2,
    CheckCircle2,
    ChevronDown,
    FileDown,
    MapPin,
    PackageCheck,
    Utensils,
    X,
    MessageSquare,
    Sparkles,
    Laptop,
    HeartHandshake,
    Settings2,
    Plus,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { captureSimulatorLeadProgress, generateBudgetAndLeadFromSimulator, getPublicBudgetsByPhone } from '@/app/actions/armado-rapido';
import { checkDateAvailability } from '@/app/actions/simulador-v2';
import { getPublicSimulatorBootstrap } from '@/app/actions/public-simulator-bootstrap';
import type { BudgetDisplaySettings } from '@/types/settings';
import { defaultBudgetDisplaySettings } from '@/types/settings';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido } from '@/types/armado-rapido';
import { isPackageApplicableToEventType } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FullMenu, MenuItem } from '@/types/catering';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { getGuestCountForItem } from '@/lib/calculations';
import { cn } from '@/lib/utils';
import {
  DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
} from '@/lib/budget/formal-budget';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { CompanyLogo } from '@/components/company-logo';
import { getCateringDishImage, getCateringMenuImage } from '@/lib/catering/menu-images';
import {
  calculateSimulatorPricing,
  getSimulatorServiceCalculatedData,
  simulatorDetailsToBudgetItems,
  type SimulatorDetailedService,
} from '@/lib/simulator/pricing';
import { commercialAttributionFromSearchParams } from '@/lib/commercial/acquisition';
import { isValidUruguayMobile, normalizeUruguayPhone, toWhatsAppNumber } from '@/lib/commercial/contact';
import { getRemovablePackageServices, isPremiumSimulatorPackage } from '@/lib/simulator/package-customization';

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const safeImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('/')) return url;
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol) ? url : undefined;
    } catch {
        return undefined;
    }
};

const getServiceOrDishImage = (s?: { id?: string; nombre?: string; title?: string; imageUrl?: string }): string => {
    if (!s) return '/media/catalogo-servicios/blog_presupuesto.png';
    const safe = safeImageUrl(s.imageUrl);
    if (safe) return safe;
    const dishImg = getCateringDishImage({ id: s.id || '', imageUrl: s.imageUrl });
    if (dishImg) return dishImg;

    const text = (s.nombre || s.title || '').toLowerCase();
    if (/(boda|casamiento)/.test(text)) return '/media/catalogo-servicios/boda_persuasiva.png';
    if (/(15|quince)/.test(text)) return '/media/catalogo-servicios/quinceanera_persuasiva.png';
    if (/(corporat|empres)/.test(text)) return '/media/catalogo-servicios/corporativo_persuasivo.png';
    if (/(cumple|social)/.test(text)) return '/media/catalogo-servicios/social_persuasivo.png';
    if (/(tecnolog|interact|muro|portal|qr|cabina|espejo|360)/.test(text)) return '/media/catalogo-servicios/tecnologia_fiesta.png';
    if (/(salon|salón|club|uruguay)/.test(text)) return '/media/catalogo-servicios/blog_salon.png';
    if (/(disco|música|dj|sonido|iluminac|pista|robot|luz)/.test(text)) return '/media/catalogo-servicios/blog_iluminacion.png';
    if (/(bar|trago|bebida|coctel|cóctel)/.test(text)) return '/media/catalogo-servicios/blog_bebidas.png';
    if (/(catering|comida|menu|menú|plato|bocado|entrada|asado|parrilla|kebab|shawarma|lunch)/.test(text)) return '/media/catalogo-servicios/blog_comida.png';
    if (/(torta|dulce|candy|postre|reposteria)/.test(text)) return '/media/catalogo-servicios/social_persuasivo.png';
    if (/(decor|ambient|mesa|flores)/.test(text)) return '/media/catalogo-servicios/blog_salon.png';
    return '/media/catalogo-servicios/blog_presupuesto.png';
};

async function withFallbackTimeout<T>(
    promise: Promise<T>,
    fallback: T,
    timeoutMs = 12000,
): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((resolve) => {
                timeout = setTimeout(() => resolve(fallback), timeoutMs);
            }),
        ]);
    } catch {
        return fallback;
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

const DURATION_OPTIONS = [
    { value: 3, title: 'Menos de 4 horas', subtitle: 'Fiesta chica', detail: '1 entrada habilitada' },
    { value: 5, title: 'Mas de 4 horas', subtitle: 'Fiesta grande', detail: '2 entradas habilitadas' },
] as const;

const STEP_LABELS = ['Presentación', 'Datos', 'Menú', 'Paquete', 'Edición'] as const;

const formatCategoriaText = (cat?: string): string => {
    if (!cat) return '';
    return cat === 'Servicio de catering' ? 'Servicio de comida' : cat;
};

const CATEGORY_STYLES: Record<string, { icon: React.ComponentType<any>; color: string; border: string; bg: string; text: string }> = {
  'Servicio de catering': { icon: Utensils, color: 'from-amber-500 to-orange-600', border: 'border-orange-100', bg: 'bg-orange-50/50', text: 'text-orange-900' },
  'Servicios adicionales': { icon: Plus, color: 'from-blue-500 to-indigo-600', border: 'border-blue-100', bg: 'bg-blue-50/50', text: 'text-blue-900' },
  'Otros servicios': { icon: Settings2, color: 'from-emerald-500 to-teal-600', border: 'border-emerald-100', bg: 'bg-emerald-50/50', text: 'text-emerald-900' },
  'Ambientación': { icon: Star, color: 'from-purple-500 to-fuchsia-600', border: 'border-fuchsia-100', bg: 'bg-fuchsia-50/50', text: 'text-fuchsia-900' },
  'Regalos Incluidos': { icon: Gift, color: 'from-pink-500 to-rose-600', border: 'border-rose-100', bg: 'bg-rose-50/50', text: 'text-rose-900' },
};

const getCategoryStyle = (category: string) => {
  return CATEGORY_STYLES[category] || { icon: CheckCircle2, color: 'from-slate-500 to-slate-700', border: 'border-slate-100', bg: 'bg-slate-50/50', text: 'text-slate-900' };
};

const menuItemToServicioEmpresa = (item: MenuItem & { precioVenta: number; imageUrl?: string }): ServicioEmpresa => {
    return {
        id: item.id,
        nombre: item.name,
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: item.type,
        calculationMethod: 'porPersona',
        precioPorPersona: item.precioVenta,
        precioVenta: item.precioVenta,
        precioBase: item.precioVenta,
        valorUnitarioEstimado: item.totalDishCost,
        imageUrl: item.imageUrl || getCateringDishImage(item),
        isFeatured: item.isFeatured,
    };
};

type ServicioSeleccionadoValue = {
    cantidad: number;
    precioUnitarioOriginal: number;
    precioUnitarioPresupuesto: number;
    nombreServicio: string;
    unidad?: string;
    categoriaServicio?: string;
    subcategoria?: string;
    esRegalo: boolean;
    calculationMethod?: string;
    precioPorPersona?: number;
    precioBase?: number;
    invitadosPorUnidad?: number;
    tramosDePrecio?: any[];
};

const menuItemToServicioSeleccionado = (item: ServicioEmpresa, invitados: number): ServicioSeleccionadoValue => {
    return {
        cantidad: invitados,
        precioUnitarioOriginal: item.precioPorPersona || item.precioVenta || 0,
        precioUnitarioPresupuesto: item.precioPorPersona || item.precioVenta || 0,
        nombreServicio: item.nombre,
        unidad: 'personas',
        categoriaServicio: item.categoria,
        subcategoria: item.subcategoria,
        esRegalo: false,
        calculationMethod: 'porPersona',
        precioPorPersona: item.precioPorPersona || 0,
    };
};

/** Returns true if the category or calculation method indicates a per-person food/catering item. */
function esCategoriaGastronomica(categoria: string, calculationMethod?: string): boolean {
  const lower = categoria.toLowerCase();
  return (
    lower.includes('gastronom') ||
    lower.includes('catering') ||
    lower.includes('menú') ||
    lower.includes('menu') ||
    lower.includes('comida') ||
    lower.includes('bebida') ||
    lower.includes('trago') ||
    lower.includes('hamburguesa') ||
    lower.includes('pizza') ||
    calculationMethod === 'porPersona'
  );
}

function normalizePrefillEventType(type?: string | null): string {
    const normalizedType = (type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (normalizedType.includes('15') || normalizedType.includes('xv') || normalizedType.includes('quince')) return '15 años';
    if (normalizedType.includes('boda') || normalizedType.includes('casamiento')) return 'Boda';
    if (normalizedType.includes('infantil')) return 'Cumpleaños infantil';
    if (normalizedType.includes('empresa') || normalizedType.includes('corporativo')) return 'Evento empresarial';
    return 'Cumpleaños';
}

function SimuladorContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const prefillName = searchParams.get('name')?.slice(0, 120) || '';
    const prefillGuests = Math.max(1, Math.min(1000, Math.round(Number(searchParams.get('guests')) || 50)));
    const prefillEventType = normalizePrefillEventType(searchParams.get('eventType'));
    const prefillSalonChoice: 'club' | '' = searchParams.get('salon')?.toLowerCase() === 'club' ? 'club' : '';
    const acquisition = useMemo(() => ({
        ...commercialAttributionFromSearchParams(searchParams, 'landing'),
        entryPath: searchParams.get('entry') || '/simulador-de-presupuesto',
        simulatorMode: 'visual' as const,
    }), [searchParams]);
    const [hasStarted, setHasStarted] = useState(false);
    const [step, setStep] = useState(1);
    const currentYear = new Date().getFullYear();

    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [budgetSettings, setBudgetSettings] = useState<BudgetDisplaySettings>(defaultBudgetDisplaySettings);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
    const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
    const [whatsappNumber, setWhatsappNumber] = useState<string>('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const [clienteNombre, setClienteNombre] = useState(prefillName);
    const [clienteContacto, setClienteContacto] = useState('');
    const [marketingConsent, setMarketingConsent] = useState(true);
    const [eventoTipo, setEventoTipo] = useState(prefillEventType);
    const [adultos, setAdultos] = useState<number>(prefillGuests);
    const [ninosYAdolescentes, setNinosYAdolescentes] = useState<number>(0);
    const [duracionHoras, setDuracionHoras] = useState<number>(5);
    const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
    const [selectedEntradas, setSelectedEntradas] = useState<string[]>([]);
    const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');
    const [selectedInfantil, setSelectedInfantil] = useState<string>('');
    const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
    const [salonChoice, setSalonChoice] = useState<'propio' | 'club' | ''>(prefillSalonChoice);
    const [excludedPackageServiceIds, setExcludedPackageServiceIds] = useState<string[]>([]);
    const [dateSuggestions, setDateSuggestions] = useState<string[]>([]);
    const [dateWarning, setDateWarning] = useState('');
    const [dateAvailabilityStatus, setDateAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'occupied' | 'error'>('idle');
    const dateAvailabilityRequestRef = useRef(0);

    const [gastronomiaSearchTerm, setGastronomiaSearchTerm] = useState('');
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [errorLoading, setErrorLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingProgress, setIsSavingProgress] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<SimulatorDetailedService | null>(null);
    const [generatedPresupuestoId, setGeneratedPresupuestoId] = useState<string | null>(null);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const budgetDocumentRef = useRef<HTMLDivElement>(null);

    const [existingBudgets, setExistingBudgets] = useState<any[]>([]);
    const [isSearchingBudgets, setIsSearchingBudgets] = useState(false);

    const [formData, setFormData] = useState<{serviciosSeleccionados: Map<string, ServicioSeleccionadoValue>}>({serviciosSeleccionados: new Map()});
    const submissionIdRef = useRef(
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `visual_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    );

    const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

    const maxEntradas = useMemo(() => (duracionHoras > 4 ? 2 : 1), [duracionHoras]);

    const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
        if (!config || !allMenus.length) {
            return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
        }

        const getPlatoSettings = (platoId: string) => {
            return config.platosVisibles?.find(p => p.id === platoId) || { id: platoId, visible: true, recommended: false };
        };

        const sortDishes = (a: ServicioEmpresa, b: ServicioEmpresa) => {
            const setA = getPlatoSettings(a.id);
            const setB = getPlatoSettings(b.id);
            const featuredA = Boolean(a.isFeatured || setA.recommended);
            const featuredB = Boolean(b.isFeatured || setB.recommended);
            if (featuredA && !featuredB) return -1;
            if (!featuredA && featuredB) return 1;
            const pA = a.precioPorPersona || a.precioVenta || 0;
            const pB = b.precioPorPersona || b.precioVenta || 0;
            return pB - pA;
        };

        const allDishes = Array.from(
            allMenus.flatMap(menu => (menu.items || []).map(dish => ({
                ...dish,
                imageUrl: getCateringDishImage(dish) || getCateringMenuImage(menu),
                isFeatured: Boolean(dish.isFeatured || menu.featured),
            })))
            .reduce((map, dish) => {
                if (!map.has(dish.id)) { map.set(dish.id, dish); }
                return map;
            }, new Map<string, MenuItem>())
            .values()
        );

        const visibleDishes = allDishes.filter(d => getPlatoSettings(d.id).visible);
        const lowerCaseSearch = gastronomiaSearchTerm.toLowerCase();
        const filteredDishes = gastronomiaSearchTerm.trim() === '' ? visibleDishes : visibleDishes.filter(d => d.name.toLowerCase().includes(lowerCaseSearch));

        const enhancedDishes = filteredDishes.map(item => ({
            ...item,
            precioVenta: item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100)),
        }));

        return {
            entradasDisponibles: enhancedDishes.filter(item => item.type === 'Entrada').map(menuItemToServicioEmpresa).sort(sortDishes),
            principalesDisponibles: enhancedDishes.filter(item => item.type === 'Plato Principal').map(menuItemToServicioEmpresa).sort(sortDishes),
            menusNinoDisponibles: enhancedDishes.filter(item => item.type === 'Menú Infantil/Adolescente' || item.type === 'Menú Infantil').map(menuItemToServicioEmpresa).sort(sortDishes)
        };
    }, [config, allMenus, gastronomiaSearchTerm]);

    useEffect(() => {
        const loadInitialData = async () => {
            setErrorLoading(false);
            setIsLoading(true);
            try {
                const bootstrap = await withFallbackTimeout(
                    getPublicSimulatorBootstrap(),
                    null,
                );

                if (!bootstrap || bootstrap.services.length === 0) {
                    throw new Error("No se pudo cargar el catálogo de servicios.");
                }

                setConfig(bootstrap.config);
                setBudgetSettings(bootstrap.budgetSettings);
                setServiciosCatalogo(bootstrap.services);
                setAllMenus(bootstrap.menus);
                if (bootstrap.whatsappNumber) {
                    setWhatsappNumber(bootstrap.whatsappNumber);
                }
                setLogoUrl(bootstrap.logoUrl);
            } catch (error) {
                console.error("Initial load failed", error);
                setErrorLoading(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (isValidUruguayMobile(clienteContacto)) {
            const fetchBudgets = async () => {
                setIsSearchingBudgets(true);
                try {
                    const res = await getPublicBudgetsByPhone(clienteContacto);
                    if (res.success && res.budgets) {
                        setExistingBudgets(res.budgets);
                    } else {
                        setExistingBudgets([]);
                    }
                } catch (error) {
                    console.error("Error searching budgets:", error);
                    setExistingBudgets([]);
                } finally {
                    setIsSearchingBudgets(false);
                }
            };
            fetchBudgets();
        } else {
            setExistingBudgets([]);
        }
    }, [clienteContacto]);

    useEffect(() => {
        setSelectedEntradas(prev => {
            if (prev.length > maxEntradas) {
                const truncated = prev.slice(0, maxEntradas);
                setFormData(formDataPrev => {
                    const newSelected = new Map(formDataPrev.serviciosSeleccionados);
                    const removed = prev.filter(id => !truncated.includes(id));
                    removed.forEach(id => newSelected.delete(id));
                    return { ...formDataPrev, serviciosSeleccionados: newSelected };
                });
                return truncated;
            }
            return prev;
        });
    }, [maxEntradas]);

    const handleEntradaChange = (servicioId: string, checked: boolean) => {
        if (checked) {
            if (selectedEntradas.length >= maxEntradas) {
                toast({ title: "Límite alcanzado", description: `Puedes seleccionar hasta ${maxEntradas} entrada(s).` });
                return;
            }
            const newSelected = [...selectedEntradas, servicioId];
            setSelectedEntradas(newSelected);
            handleGastronomicSelectionChange('entradas', newSelected);
        } else {
            const newSelected = selectedEntradas.filter(id => id !== servicioId);
            setSelectedEntradas(newSelected);
            handleGastronomicSelectionChange('entradas', newSelected);
        }
    };

    const handleGastronomicSelectionChange = (type: 'entradas' | 'principal' | 'infantil', selectedIds: string | string[]) => {
      setFormData(prev => {
        const newSelected = new Map(prev.serviciosSeleccionados);
        const allDishes = [...entradasDisponibles, ...principalesDisponibles, ...menusNinoDisponibles];

        if (type === 'entradas') {
            const currentEntradas = Array.from(newSelected.keys()).filter(id => entradasDisponibles.some(e => e.id === id));
            const removedEntradas = currentEntradas.filter(id => !selectedIds.includes(id));
            removedEntradas.forEach(id => newSelected.delete(id));
        } else if (type === 'principal') {
            principalesDisponibles.forEach(item => newSelected.delete(item.id));
        } else if (type === 'infantil') {
            menusNinoDisponibles.forEach(item => newSelected.delete(item.id));
        }

        const idsToAdd = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
        idsToAdd.forEach(id => {
            const dishToAdd = allDishes.find(d => d.id === id);
            if (dishToAdd) {
                const invitados = getGuestCountForItem(dishToAdd as any, adultos, 0, ninosYAdolescentes);
                newSelected.set(dishToAdd.id, menuItemToServicioSeleccionado(dishToAdd, invitados));
            }
        });
        return { ...prev, serviciosSeleccionados: newSelected };
      });
    };

    const allSimuladorServices = useMemo(() => {
        return [...entradasDisponibles, ...principalesDisponibles, ...menusNinoDisponibles, ...serviciosCatalogo];
    }, [entradasDisponibles, principalesDisponibles, menusNinoDisponibles, serviciosCatalogo]);

    const clubUruguaySyntheticService = useMemo(() => {
        const club = config?.clubUruguayConfig;
        if (!club?.activo || salonChoice !== 'club') return [];
        return [{
            servicio: {
                id: 'serv_salon_club_uruguay',
                nombre: 'Salón Club Uruguay',
                tipoItem: 'Servicio' as const,
                categoria: 'Otros servicios' as const,
                precioVenta: Number(club.precio) || 0,
                precioBase: Number(club.precio) || 0,
                calculationMethod: 'fijo' as const,
            },
        }];
    }, [config?.clubUruguayConfig, salonChoice]);

    const technologyServices = useMemo(() => {
        if (budgetSettings?.serviciosAdicionalesVisibles !== undefined && budgetSettings?.serviciosAdicionalesVisibles !== null) {
            const visibleIds = new Set(budgetSettings.serviciosAdicionalesVisibles);
            return serviciosCatalogo
                .filter(service => visibleIds.has(service.id))
                .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || a.nombre.localeCompare(b.nombre));
        }
        const technologyPattern = /\b(led|pantalla|totem|t[oó]tem|360|fotocabina|foto cabina|espejo|muro social|plataforma)\b/i;
        return serviciosCatalogo
            .filter(service =>
                technologyPattern.test(`${service.nombre} ${service.categoria || ''} ${service.subcategoria || ''} ${service.notas || ''}`)
            )
            .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || a.nombre.localeCompare(b.nombre));
    }, [serviciosCatalogo, budgetSettings?.serviciosAdicionalesVisibles]);

    const toggleTechnologyService = useCallback((service: ServicioEmpresa, selected: boolean) => {
        setFormData(previous => {
            const next = new Map(previous.serviciosSeleccionados);
            if (!selected) {
                next.delete(service.id);
                return { ...previous, serviciosSeleccionados: next };
            }
            const calculated = getSimulatorServiceCalculatedData(service, adultos, ninosYAdolescentes);
            next.set(service.id, {
                cantidad: calculated.qty,
                precioUnitarioOriginal: calculated.unitPrice,
                precioUnitarioPresupuesto: calculated.unitPrice,
                nombreServicio: service.nombre,
                unidad: service.unidad,
                categoriaServicio: service.categoria,
                subcategoria: service.subcategoria,
                esRegalo: false,
                calculationMethod: service.calculationMethod,
                precioPorPersona: service.precioPorPersona,
                precioBase: service.precioBase,
                invitadosPorUnidad: service.invitadosPorUnidad,
                tramosDePrecio: service.tramosDePrecio,
            });
            return { ...previous, serviciosSeleccionados: next };
        });
    }, [adultos, ninosYAdolescentes]);

    const suggestedServices = useMemo(() => {
        if (!config || !selectedPaqueteId) return [];
        const currentPackage = config?.paquetes?.find(p => p.id === selectedPaqueteId);
        const otherPackages = config?.paquetes?.filter(p => p.id !== selectedPaqueteId) || [];

        const otherServicesIds = new Set<string>();
        otherPackages.forEach(p => {
            p.serviciosIncluidos?.forEach(s => otherServicesIds.add(s.id));
        });

        if (currentPackage) {
            currentPackage.serviciosIncluidos?.forEach(s => otherServicesIds.delete(s.id));
        }

        const currentSelectedIds = new Set([
            ...Array.from(formData.serviciosSeleccionados.keys()),
            ...selectedEntradas,
            ...(selectedPrincipal ? [selectedPrincipal] : []),
            ...(selectedInfantil ? [selectedInfantil] : []),
        ]);

        currentSelectedIds.forEach(id => otherServicesIds.delete(id));

        const suggested = serviciosCatalogo.filter(s => otherServicesIds.has(s.id));

        const packageServiceIds = new Set(currentPackage?.serviciosIncluidos?.map(s => s.id) || []);

        if (suggested.length < 3) {
            const popularIds = ['serv_barra_tragos', 'serv_pista_led', 'serv_plataforma_360', 'serv_cabina_fotos'];
            popularIds.forEach(id => {
                if (!currentSelectedIds.has(id) && !packageServiceIds.has(id) && !suggested.some(s => s.id === id)) {
                    const serv = serviciosCatalogo.find(s => s.id === id);
                    if (serv) suggested.push(serv);
                }
            });
        }

        return suggested.slice(0, 4);
    }, [config, selectedPaqueteId, serviciosCatalogo, selectedEntradas, selectedPrincipal, selectedInfantil, formData.serviciosSeleccionados]);

    const handleToggleServiceInBudget = useCallback((serviceId: string, action: 'include' | 'exclude') => {
        const packageItem = config?.paquetes?.find(p => p.id === selectedPaqueteId);
        const isFromPackage = packageItem?.serviciosIncluidos.some(s => s.id === serviceId);

        if (action === 'exclude') {
            if (isFromPackage) {
                if (!excludedPackageServiceIds.includes(serviceId)) {
                    setExcludedPackageServiceIds(prev => [...prev, serviceId]);
                }
            } else {
                if (formData.serviciosSeleccionados.has(serviceId)) {
                    setFormData(prev => {
                        const newMap = new Map(prev.serviciosSeleccionados);
                        newMap.delete(serviceId);
                        return { ...prev, serviciosSeleccionados: newMap };
                    });
                }
                if (selectedEntradas.includes(serviceId)) {
                    setSelectedEntradas(prev => prev.filter(id => id !== serviceId));
                }
                if (selectedPrincipal === serviceId) {
                    setSelectedPrincipal('');
                }
                if (selectedInfantil === serviceId) {
                    setSelectedInfantil('');
                }
            }
        } else { // 'include'
            if (isFromPackage) {
                setExcludedPackageServiceIds(prev => prev.filter(id => id !== serviceId));
            } else {
                const service = allSimuladorServices.find(s => s.id === serviceId);
                if (service) {
                    if (service.subcategoria === 'Entrada') {
                        if (selectedEntradas.length < maxEntradas) {
                            setSelectedEntradas(prev => [...prev, serviceId]);
                        }
                    } else if (service.subcategoria === 'Plato Principal') {
                        setSelectedPrincipal(serviceId);
                    } else if (service.subcategoria === 'Menú Infantil/Adolescente' || service.subcategoria === 'Menú Infantil') {
                        setSelectedInfantil(serviceId);
                    } else {
                        setFormData(prev => {
                            const newMap = new Map(prev.serviciosSeleccionados);
                            newMap.set(serviceId, {
                                cantidad: adultos + ninosYAdolescentes,
                                precioUnitarioOriginal: service.precioPorPersona || service.precioVenta || 0,
                                precioUnitarioPresupuesto: service.precioPorPersona || service.precioVenta || 0,
                                nombreServicio: service.nombre,
                                esRegalo: false,
                                calculationMethod: service.calculationMethod,
                                categoriaServicio: service.categoria,
                                subcategoria: service.subcategoria,
                            });
                            return { ...prev, serviciosSeleccionados: newMap };
                        });
                    }
                }
            }
        }
    }, [config, selectedPaqueteId, excludedPackageServiceIds, formData.serviciosSeleccionados, selectedEntradas, selectedPrincipal, selectedInfantil, allSimuladorServices, adultos, ninosYAdolescentes, maxEntradas]);

    const stats = useMemo(() => {
        const pricingConfig = config || { menus: [], paquetes: [], descuentoGeneral: 15 };
        return calculateSimulatorPricing({
            config: pricingConfig,
            services: allSimuladorServices,
            adultos,
            ninosYAdolescentes,
            selectedPaqueteId,
            selectedServices: Array.from(formData.serviciosSeleccionados.entries()).map(([id, data]) => ({
                id,
                esRegalo: data.esRegalo,
            })),
            excludedPackageServiceIds,
            syntheticServices: clubUruguaySyntheticService,
            eventoFecha,
            annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
            currentYear,
        });
    }, [config, allSimuladorServices, adultos, ninosYAdolescentes, selectedPaqueteId, formData.serviciosSeleccionados, excludedPackageServiceIds, clubUruguaySyntheticService, eventoFecha, currentYear, budgetSettings.annualAdjustmentPercentage]);

    const saveProgress = async (includeEventDetails: boolean) => {
        setIsSavingProgress(true);
        try {
            const result = await captureSimulatorLeadProgress({
                clienteNombre: clienteNombre.trim(),
                clienteContacto: normalizeUruguayPhone(clienteContacto),
                eventoTipo: includeEventDetails ? eventoTipo : undefined,
                eventoFecha: includeEventDetails && eventoFecha ? eventoFecha.toISOString() : undefined,
                invitados: includeEventDetails ? adultos + ninosYAdolescentes : undefined,
                salonFiestas: includeEventDetails
                    ? salonChoice === 'club' ? 'Club Uruguay' : 'Locación propia'
                    : undefined,
                acquisition,
                marketingConsent,
            });
            if (!result.success) throw new Error(result.error);
        } finally {
            setIsSavingProgress(false);
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
            return;
        }

        if (step === 2) {
            if (clienteNombre.trim().length < 3 || !isValidUruguayMobile(clienteContacto)) {
                toast({
                    title: "Revisá tus datos",
                    description: "Ingresá tu nombre y un celular uruguayo válido para continuar.",
                    variant: "destructive",
                });
                return;
            }
            if (adultos <= 0 || !eventoFecha || !salonChoice) {
                toast({
                    title: "Completá los datos del evento",
                    description: "Indicá invitados, fecha y si ya tenés salón o querés Club Uruguay.",
                    variant: "destructive",
                });
                return;
            }
            if (dateAvailabilityStatus === 'checking') {
                toast({
                    title: "Estamos verificando la fecha",
                    description: "Esperá un instante para confirmar la disponibilidad.",
                });
                return;
            }
            if (dateAvailabilityStatus === 'occupied') {
                toast({
                    title: "Elegí una fecha disponible",
                    description: "La fecha seleccionada ya está ocupada. Podés elegir una alternativa sugerida.",
                    variant: "destructive",
                });
                return;
            }
            try {
                await saveProgress(true);
                setStep(3);
            } catch (error: any) {
                toast({ title: "No pudimos guardar el evento", description: error.message, variant: "destructive" });
            }
            return;
        }

        if (step === 3) {
            if (!selectedPrincipal || selectedEntradas.length !== maxEntradas) {
                toast({ title: "Selección incompleta", description: `Elegí plato principal y exactamente ${maxEntradas} entrada(s).`, variant: "destructive" });
                return;
            }
            if (ninosYAdolescentes > 0 && !selectedInfantil) {
                toast({ title: "Menú infantil requerido", description: "Elegí un menú para niños y adolescentes.", variant: "destructive" });
                return;
            }
            setStep(4);
            return;
        }

        if (step === 4) {
            if (sortedPaquetes.length > 0 && !selectedPaqueteId) {
                toast({ title: "Paquete requerido", description: "Elegí un paquete de servicios para continuar.", variant: "destructive" });
                return;
            }
            setStep(5);
            return;
        }

        if (step === 5) {
            setIsGenerating(true);
            const selectedPackageName = config?.paquetes?.find(p => p.id === selectedPaqueteId)?.nombre;
            const data = {
                submissionId: submissionIdRef.current,
                clienteNombre,
                clienteContacto: normalizeUruguayPhone(clienteContacto),
                eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
                adultos,
                ninos: ninosYAdolescentes,
                subtotal: stats.subtotalVenta,
                costoEstimado: stats.totalFinal,
                descuentoGeneral: stats.discountPercentage,
                ajusteAnualActivo: stats.annualProjection.applies,
                ajusteAnualPorcentaje: stats.annualProjection.adjustmentPct,
                serviciosIncluidos: stats.detallados.map(s => s.id),
                selectedServiceIds: Array.from(formData.serviciosSeleccionados.keys()),
                excludedPackageServiceIds,
                paqueteId: selectedPaqueteId,
                paqueteNombre: selectedPackageName ? `${selectedPackageName} — ${eventoTipo}` : undefined,
                includeClubUruguay: salonChoice === 'club',
                items: simulatorDetailsToBudgetItems(stats.detallados),
            };
            try {
                const result = await generateBudgetAndLeadFromSimulator(data, {
                    source: 'simulator_common',
                    eventoTipo,
                    acquisition,
                    salonFiestas: salonChoice === 'club' ? 'Club Uruguay' : 'Locación propia',
                });
                if (result.success && result.presupuestoId) {
                    setGeneratedPresupuestoId(result.presupuestoId);
                    if (result.token) setGeneratedToken(result.token);
                    setStep(6);
                } else throw new Error(result.error || "Error al generar.");
            } catch (e: any) {
                toast({ title: "Error", description: e.message, variant: "destructive" });
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handlePrev = () => { if (step > 1) setStep(s => s - 1); };

    const handleEventoFechaChange = useCallback(async (date: Date | undefined) => {
        const requestId = ++dateAvailabilityRequestRef.current;
        setEventoFecha(date);
        if (!date) {
            setDateWarning('');
            setDateSuggestions([]);
            setDateAvailabilityStatus('idle');
            return;
        }
        setDateAvailabilityStatus('checking');
        setDateWarning('Verificando disponibilidad...');
        setDateSuggestions([]);
        try {
            const availability = await checkDateAvailability(date.toISOString());
            if (requestId !== dateAvailabilityRequestRef.current) return;
            if (availability.isOccupied) {
                setDateWarning('⚠️ Fecha no disponible. Te sugerimos estas fechas cercanas:');
                setDateSuggestions(availability.suggestions || []);
                setDateAvailabilityStatus('occupied');
            } else {
                setDateWarning('');
                setDateSuggestions([]);
                setDateAvailabilityStatus('available');
            }
        } catch (error) {
            if (requestId !== dateAvailabilityRequestRef.current) return;
            console.error('[Simulador] Error checking date availability:', error);
            setDateWarning('No pudimos verificar la disponibilidad ahora. Podés continuar y AK confirmará la fecha antes de la reserva.');
            setDateSuggestions([]);
            setDateAvailabilityStatus('error');
        }
    }, []);

    const handleConfirmDeleteService = async () => {
        if (!serviceToDelete || !config) return;
        const serviceId = serviceToDelete.id;
        setIsGenerating(true);

        const packageItem = config?.paquetes?.find(p => p.id === selectedPaqueteId);
        const isFromPackage = packageItem?.serviciosIncluidos.some(s => s.id === serviceId);

        let newExcluded = [...excludedPackageServiceIds];
        let newSelectedServicesMap = new Map(formData.serviciosSeleccionados);
        let newSelectedEntradas = [...selectedEntradas];
        let newSelectedPrincipal = selectedPrincipal;
        let newSelectedInfantil = selectedInfantil;

        if (isFromPackage) {
            if (!newExcluded.includes(serviceId)) {
                newExcluded.push(serviceId);
            }
            setExcludedPackageServiceIds(newExcluded);
        } else {
            newSelectedServicesMap.delete(serviceId);
            setFormData(prev => ({ ...prev, serviciosSeleccionados: newSelectedServicesMap }));

            if (newSelectedEntradas.includes(serviceId)) {
                newSelectedEntradas = newSelectedEntradas.filter(id => id !== serviceId);
                setSelectedEntradas(newSelectedEntradas);
            }
            if (newSelectedPrincipal === serviceId) {
                newSelectedPrincipal = '';
                setSelectedPrincipal('');
            }
            if (newSelectedInfantil === serviceId) {
                newSelectedInfantil = '';
                setSelectedInfantil('');
            }
        }

        const newStats = calculateSimulatorPricing({
            config,
            services: allSimuladorServices,
            adultos,
            ninosYAdolescentes,
            selectedPaqueteId,
            selectedServices: Array.from(newSelectedServicesMap.entries()).map(([id, d]) => ({
                id,
                esRegalo: d.esRegalo,
            })),
            excludedPackageServiceIds: newExcluded,
            syntheticServices: clubUruguaySyntheticService,
            eventoFecha,
            annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
            currentYear,
        });

        const selectedPackageName = config.paquetes.find(p => p.id === selectedPaqueteId)?.nombre;
        const data = {
            submissionId: submissionIdRef.current,
            clienteNombre,
            clienteContacto: normalizeUruguayPhone(clienteContacto),
            eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
            adultos,
            ninos: ninosYAdolescentes,
            subtotal: newStats.subtotalVenta,
            costoEstimado: newStats.totalFinal,
            descuentoGeneral: newStats.discountPercentage,
            ajusteAnualActivo: newStats.annualProjection.applies,
            ajusteAnualPorcentaje: newStats.annualProjection.adjustmentPct,
            serviciosIncluidos: newStats.detallados.map(s => s.id),
            selectedServiceIds: Array.from(newSelectedServicesMap.keys()),
            excludedPackageServiceIds: newExcluded,
            paqueteId: selectedPaqueteId,
            paqueteNombre: selectedPackageName ? `${selectedPackageName} — ${eventoTipo}` : undefined,
            includeClubUruguay: salonChoice === 'club',
            items: simulatorDetailsToBudgetItems(newStats.detallados),
        };

        try {
            const result = await generateBudgetAndLeadFromSimulator(data, {
                source: 'simulator_common',
                eventoTipo,
                acquisition,
                salonFiestas: salonChoice === 'club' ? 'Club Uruguay' : 'Locación propia',
            });
            if (result.success && result.presupuestoId) {
                setGeneratedPresupuestoId(result.presupuestoId);
                if (result.token) setGeneratedToken(result.token);
            } else throw new Error(result.error || "Error al actualizar.");
        } catch (e: any) {
            toast({ title: "Error al actualizar presupuesto", description: e.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
            setServiceToDelete(null);
        }
    };

    const handleWhatsAppQuickConsult = () => {
        const destination = toWhatsAppNumber(whatsappNumber);
        const texto = `¡Hola AK Producciones! Soy ${clienteNombre}. Quiero coordinar una reunión para revisar el presupuesto de mi ${eventoTipo}.`;
        window.open(`https://wa.me/${destination}?text=${encodeURIComponent(texto)}`, '_blank');
    };

    const handleShareBudgetWhatsApp = () => {
        if (!generatedPresupuestoId) return;
        const url = `${window.location.origin}/presupuestos/${generatedPresupuestoId}/ver?cliente=1&token=${generatedToken || ''}`;
        const eventDateLabel = eventoFecha
            ? new Intl.DateTimeFormat('es-UY').format(eventoFecha)
            : 'a confirmar';
        const texto = [
            `¡Hola AK Producciones! Soy ${clienteNombre}.`,
            `Armé mi presupuesto formal para un ${eventoTipo} el ${eventDateLabel}.`,
            `Total vigente: ${formatCurrency(stats.totalFinal)}`,
            stats.precioPorPersona > 0 ? `Valor por persona: ${formatCurrency(stats.precioPorPersona)}` : '',
            `Quiero solicitar la reserva de la fecha y conocer las condiciones de la seña de $5.000.`,
            `Ver presupuesto: ${url}`,
        ].filter(Boolean).join('\n');
        const destination = toWhatsAppNumber(whatsappNumber);
        window.open(`https://wa.me/${destination}?text=${encodeURIComponent(texto)}`, '_blank');
    };

    const handleDownloadBudgetPdf = async () => {
        if (!generatedPresupuestoId || !budgetDocumentRef.current || isDownloadingPdf) return;
        setIsDownloadingPdf(true);
        try {
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            await pdf.html(budgetDocumentRef.current, {
                autoPaging: 'text',
                margin: [12, 12, 16, 12],
                width: 186,
                windowWidth: 1024,
                html2canvas: {
                    backgroundColor: '#ffffff',
                    scale: 0.8,
                    useCORS: true,
                    ignoreElements: (element: Element) => element.hasAttribute('data-pdf-exclude'),
                },
            });
            const totalPages = pdf.getNumberOfPages();
            for (let page = 1; page <= totalPages; page += 1) {
                pdf.setPage(page);
                pdf.setFontSize(8);
                pdf.setTextColor(100);
                pdf.text(`Página ${page} de ${totalPages}`, 198, 285, { align: 'right' });
            }
            pdf.save(`presupuesto-ak-${generatedPresupuestoId}.pdf`);
        } catch (error: any) {
            toast({
                title: 'No pudimos descargar el PDF',
                description: error.message || 'Intentá nuevamente.',
                variant: 'destructive',
            });
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const calculatePackageEstimatedPrice = useCallback((paquete: PaqueteArmadoRapido) => {
        if (!config || !allSimuladorServices.length) return 0;

        return calculateSimulatorPricing({
            config,
            services: allSimuladorServices,
            adultos,
            ninosYAdolescentes,
            selectedPaqueteId: paquete.id,
            selectedServices: Array.from(formData.serviciosSeleccionados.entries()).map(([id, data]) => ({
                id,
                esRegalo: data.esRegalo,
            })),
            syntheticServices: clubUruguaySyntheticService,
            eventoFecha,
            annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
            currentYear,
        }).totalFinal;
    }, [config, allSimuladorServices, adultos, ninosYAdolescentes, formData.serviciosSeleccionados, clubUruguaySyntheticService, eventoFecha, budgetSettings.annualAdjustmentPercentage, currentYear]);

    const packageSummaries = useMemo(() => {
        const summaries = new Map<string, { total: number }>();
        if (!config) return summaries;
        config.paquetes.forEach(p => {
            const total = calculatePackageEstimatedPrice(p);
            summaries.set(p.id, { total });
        });
        return summaries;
    }, [config, calculatePackageEstimatedPrice]);

    const handleSwitchPackage = async (paqueteId: string) => {
        if (!config) return;
        setIsGenerating(true);
        setSelectedPaqueteId(paqueteId);
        setExcludedPackageServiceIds([]);

        const newPackageName = config.paquetes.find(p => p.id === paqueteId)?.nombre;

        // Calculate new pricing stats
        const newStats = calculateSimulatorPricing({
            config,
            services: allSimuladorServices,
            adultos,
            ninosYAdolescentes,
            selectedPaqueteId: paqueteId,
            excludedPackageServiceIds: [],
            selectedServices: Array.from(formData.serviciosSeleccionados.entries()).map(([id, data]) => ({
                id,
                esRegalo: data.esRegalo,
            })),
            syntheticServices: clubUruguaySyntheticService,
            eventoFecha,
            annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
            currentYear,
        });

        const data = {
            submissionId: submissionIdRef.current,
            clienteNombre,
            clienteContacto: normalizeUruguayPhone(clienteContacto),
            eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
            adultos,
            ninos: ninosYAdolescentes,
            subtotal: newStats.subtotalVenta,
            costoEstimado: newStats.totalFinal,
            descuentoGeneral: newStats.discountPercentage,
            ajusteAnualActivo: newStats.annualProjection.applies,
            ajusteAnualPorcentaje: newStats.annualProjection.adjustmentPct,
            serviciosIncluidos: newStats.detallados.map(s => s.id),
            selectedServiceIds: Array.from(formData.serviciosSeleccionados.keys()),
            excludedPackageServiceIds: [],
            paqueteId,
            paqueteNombre: newPackageName ? `${newPackageName} — ${eventoTipo}` : undefined,
            items: simulatorDetailsToBudgetItems(newStats.detallados)
        };

        try {
            const result = await generateBudgetAndLeadFromSimulator(data, {
                source: 'simulator_common',
                eventoTipo,
                acquisition,
                salonFiestas: salonChoice === 'club' ? 'Club Uruguay' : 'Locación propia',
            });
            if (result.success && result.presupuestoId) {
                setGeneratedPresupuestoId(result.presupuestoId);
                if (result.token) setGeneratedToken(result.token);
                toast({ title: "Presupuesto actualizado", description: `Se ha cambiado al paquete ${newPackageName} con éxito.` });
            } else throw new Error(result.error || "Error al generar.");
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleToggleExcludedService = async (serviceId: string, remove: boolean) => {
        if (!config || !selectedPaqueteId) return;
        setIsGenerating(true);

        let newExcluded = [...excludedPackageServiceIds];
        if (remove) {
            if (!newExcluded.includes(serviceId)) {
                newExcluded.push(serviceId);
            }
        } else {
            newExcluded = newExcluded.filter(id => id !== serviceId);
        }

        setExcludedPackageServiceIds(newExcluded);

        // Compute updated stats
        const newStats = calculateSimulatorPricing({
            config,
            services: allSimuladorServices,
            adultos,
            ninosYAdolescentes,
            selectedPaqueteId,
            selectedServices: Array.from(formData.serviciosSeleccionados.entries()).map(([id, data]) => ({
                id,
                esRegalo: data.esRegalo,
            })),
            excludedPackageServiceIds: newExcluded,
            syntheticServices: clubUruguaySyntheticService,
            eventoFecha,
            annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
            currentYear,
        });

        const selectedPackageName = config.paquetes.find(p => p.id === selectedPaqueteId)?.nombre;
        const data = {
            submissionId: submissionIdRef.current,
            clienteNombre,
            clienteContacto: normalizeUruguayPhone(clienteContacto),
            eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
            adultos,
            ninos: ninosYAdolescentes,
            subtotal: newStats.subtotalVenta,
            costoEstimado: newStats.totalFinal,
            descuentoGeneral: newStats.discountPercentage,
            ajusteAnualActivo: newStats.annualProjection.applies,
            ajusteAnualPorcentaje: newStats.annualProjection.adjustmentPct,
            serviciosIncluidos: newStats.detallados.map(s => s.id),
            selectedServiceIds: Array.from(formData.serviciosSeleccionados.keys()),
            excludedPackageServiceIds: newExcluded,
            paqueteId: selectedPaqueteId,
            paqueteNombre: selectedPackageName ? `${selectedPackageName} — ${eventoTipo}` : undefined,
            includeClubUruguay: salonChoice === 'club',
            items: simulatorDetailsToBudgetItems(newStats.detallados),
        };

        try {
            const result = await generateBudgetAndLeadFromSimulator(data, {
                source: 'simulator_common',
                eventoTipo,
                acquisition,
                salonFiestas: salonChoice === 'club' ? 'Club Uruguay' : 'Locación propia',
            });
            if (result.success && result.presupuestoId) {
                setGeneratedPresupuestoId(result.presupuestoId);
                if (result.token) setGeneratedToken(result.token);
            } else throw new Error(result.error || "Error al actualizar.");
        } catch (e: any) {
            toast({ title: "Error al personalizar el paquete", description: e.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const sortedPaquetes = useMemo(() => {
        return (config?.paquetes || []).filter((p) => isPackageApplicableToEventType(p, eventoTipo));
    }, [config?.paquetes, eventoTipo]);

    const selectedPackage = useMemo(
        () => sortedPaquetes.find(packageItem => packageItem.id === selectedPaqueteId),
        [selectedPaqueteId, sortedPaquetes]
    );
    const isPremiumPackage = isPremiumSimulatorPackage(selectedPackage?.nombre);
    const removablePackageServices = useMemo(() => {
        return getRemovablePackageServices(selectedPackage, allSimuladorServices, {
            serviceDependencies: config?.serviceDependencies,
        });
    }, [allSimuladorServices, config?.serviceDependencies, selectedPackage]);
    const removedServiceDetails = useMemo(() => (
        excludedPackageServiceIds
            .map(id => removablePackageServices.find(service => service.id === id))
            .filter((service): service is ServicioEmpresa => Boolean(service))
            .map(service => {
                const calculated = getSimulatorServiceCalculatedData(service, adultos, ninosYAdolescentes);
                return {
                    id: service.id,
                    name: service.nombre,
                    deduction: Math.round(calculated.total * (1 - stats.discountPercentage / 100)),
                };
            })
    ), [adultos, excludedPackageServiceIds, ninosYAdolescentes, removablePackageServices, stats.discountPercentage]);

    const packageServicesRemovable = useMemo(() => {
        if (!selectedPackage) return [];
        return (selectedPackage.serviciosIncluidos || [])
            .map(s => s ? allSimuladorServices.find(os => os.id === s.id) : undefined)
            .filter((s): s is ServicioEmpresa => s !== undefined && removablePackageServices.some(rps => rps.id === s.id));
    }, [selectedPackage, allSimuladorServices, removablePackageServices]);

    const manuallyAddedServices = useMemo(() => {
        return Array.from(formData.serviciosSeleccionados.entries())
            .map(([id, data]) => {
                const service = allSimuladorServices.find(os => os.id === id);
                return service ? { service, data } : null;
            })
            .filter((s): s is { service: ServicioEmpresa; data: ServicioSeleccionadoValue } => Boolean(s));
    }, [formData.serviciosSeleccionados, allSimuladorServices]);

    const filteredSearchServices = useMemo(() => {
        if (serviceSearchTerm.trim() === '') return [];
        const term = serviceSearchTerm.toLowerCase();
        return allSimuladorServices.filter(service => {
            const isActive = formData.serviciosSeleccionados.has(service.id) ||
                             (selectedPackage?.serviciosIncluidos.some(s => s.id === service.id) && !excludedPackageServiceIds.includes(service.id));
            if (isActive) return false;

            return service.nombre.toLowerCase().includes(term) ||
                   (service.categoria || '').toLowerCase().includes(term) ||
                   (service.subcategoria || '').toLowerCase().includes(term);
        }).slice(0, 5);
    }, [serviceSearchTerm, allSimuladorServices, formData.serviciosSeleccionados, selectedPackage, excludedPackageServiceIds]);

    const isServiceRemovable = useCallback((item: SimulatorDetailedService) => {
        const isActive = (id: string) => {
            return stats.detallados.some(s => s.id === id);
        };
        const isRequiredDependency = config?.serviceDependencies?.some(dep =>
            dep.requiredServiceId === item.id && isActive(dep.triggerServiceId)
        );
        if (isRequiredDependency) return false;

        const packageItem = config?.paquetes?.find(p => p.id === selectedPaqueteId);
        const isFromPackage = packageItem?.serviciosIncluidos.some(s => s.id === item.id);
        if (isFromPackage) {
            return removablePackageServices.some(s => s.id === item.id);
        }

        return true;
    }, [config, selectedPaqueteId, removablePackageServices, stats.detallados]);

    const groupedDetallados = useMemo(() => {
        const groups: Record<string, any[]> = {};
        for (const item of stats.detallados) {
            const cat = item.categoria || 'Otros';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        }
        return groups;
    }, [stats.detallados]);

    useEffect(() => {
        if (!selectedPaqueteId) return;
        if (!sortedPaquetes.some((p) => p.id === selectedPaqueteId)) {
            setSelectedPaqueteId('');
            setExcludedPackageServiceIds([]);
        }
    }, [selectedPaqueteId, sortedPaquetes]);

    useEffect(() => {
        setExcludedPackageServiceIds(previous =>
            previous.filter(id => removablePackageServices.some(service => service.id === id))
        );
    }, [removablePackageServices]);

    useEffect(() => {
        if (!generatedPresupuestoId || !config) return;

        const timer = setTimeout(async () => {
            const selectedPackageName = config.paquetes.find(p => p.id === selectedPaqueteId)?.nombre;
            const data = {
                submissionId: submissionIdRef.current,
                clienteNombre,
                clienteContacto: normalizeUruguayPhone(clienteContacto),
                eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
                adultos,
                ninos: ninosYAdolescentes,
                subtotal: stats.subtotalVenta,
                costoEstimado: stats.totalFinal,
                descuentoGeneral: stats.discountPercentage,
                ajusteAnualActivo: stats.annualProjection.applies,
                ajusteAnualPorcentaje: stats.annualProjection.adjustmentPct,
                serviciosIncluidos: stats.detallados.map(s => s.id),
                selectedServiceIds: Array.from(formData.serviciosSeleccionados.keys()),
                excludedPackageServiceIds,
                paqueteId: selectedPaqueteId,
                paqueteNombre: selectedPackageName ? `${selectedPackageName} — ${eventoTipo}` : undefined,
                includeClubUruguay: salonChoice === 'club',
                items: simulatorDetailsToBudgetItems(stats.detallados),
            };

            try {
                await generateBudgetAndLeadFromSimulator(data, {
                    source: 'simulator_common',
                    eventoTipo,
                    acquisition,
                    salonFiestas: salonChoice === 'club' ? 'Club Uruguay' : 'Locación propia',
                });
            } catch (e) {
                console.error("Failed to auto-sync budget changes:", e);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [
        generatedPresupuestoId,
        config,
        selectedPaqueteId,
        excludedPackageServiceIds,
        formData.serviciosSeleccionados,
        clienteNombre,
        clienteContacto,
        eventoFecha,
        adultos,
        ninosYAdolescentes,
        salonChoice,
        eventoTipo,
        stats,
        acquisition,
    ]);

    if (errorLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
                <div className="max-w-md space-y-4">
                    <AlertTriangle className="mx-auto h-16 w-16 text-amber-600" />
                    <h2 className="text-2xl font-black uppercase tracking-tight">Error de conexión</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        No pudimos cargar el catálogo de servicios de AK Producciones. Verificá tu conexión a internet e intentalo de nuevo.
                    </p>
                    <Button onClick={() => window.location.reload()} className="mt-4 bg-red-700 hover:bg-red-800 text-white font-black px-6 h-12 rounded-lg transition">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <main className="min-h-screen bg-slate-950 text-white">
                <section
                    className="relative min-h-[78vh] overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/media/catalogo-servicios/discoteca-salon-ak-02.jpeg')" }}
                >
                    <div className="absolute inset-0 bg-black/65" />
                    <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-24 sm:px-8 lg:px-12">
                        <div className="max-w-3xl">
                            <CompanyLogo size="md" src={logoUrl || undefined} className="mb-8 brightness-0 invert" />
                            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
                                Presupuesto para tu evento
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-xl">
                                Armá una propuesta con gastronomía, salón, tecnología y servicios reales de AK Producciones. Vas a ver el precio vigente, el valor por persona y la proyección para la fecha elegida.
                            </p>
                            <Button
                                onClick={() => setHasStarted(true)}
                                className="mt-8 h-14 rounded-md bg-red-600 px-8 text-base font-black text-white hover:bg-red-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparando catálogo...</>
                                ) : (
                                    <>Comenzar mi presupuesto <ArrowRight className="ml-2 h-5 w-5" /></>
                                )}
                            </Button>
                        </div>
                    </div>
                </section>
                <section className="border-t border-white/10 bg-white text-slate-900">
                    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
                        {[
                            [PackageCheck, 'Organización integral', 'Un solo equipo para coordinar todo.'],
                            [Utensils, 'Gastronomía real', 'Menús configurados desde el catálogo AK.'],
                            [Zap, 'Tecnología y diversión', 'Experiencias para invitados y clientes.'],
                            [ShieldCheck, 'Trayectoria y respaldo', 'Presupuesto registrado y revisable.'],
                        ].map(([Icon, title, description]) => {
                            const BenefitIcon = Icon as typeof PackageCheck;
                            return (
                                <div key={String(title)} className="min-h-40 bg-white p-5 sm:p-6">
                                    <BenefitIcon className="h-6 w-6 text-red-600" />
                                    <p className="mt-4 text-sm font-black">{String(title)}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{String(description)}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        );
    }

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;

    if (step === 6 && generatedPresupuestoId) {
        return (
            <div className="ak-public-page flex min-h-screen flex-col items-center px-2 py-10 sm:px-4 print:bg-white print:p-0">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-3xl space-y-8">

                    <div className="flex justify-center mb-2 print:hidden">
                      <CompanyLogo size="sm" src={logoUrl || undefined} className="opacity-40" />
                    </div>
                    <Card className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                        <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center space-y-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                                <CheckCircle2 className="h-7 w-7 text-emerald-700"/>
                            </div>
                            <div className="space-y-3">
                                <h2 className="font-headline text-3xl font-bold text-slate-900 sm:text-4xl">
                                    ¡Tu presupuesto está listo!
                                </h2>
                                <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed mb-6">
                                    {budgetSettings.successMessage}
                                </p>
                            </div>

                            <div className="mx-auto w-full max-w-lg space-y-4 rounded-md border border-slate-200 bg-slate-50 p-6 text-left">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-slate-700 shadow-sm">
                                        <ShieldCheck className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">Próximo paso: confirmar disponibilidad</p>
                                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                                            El presupuesto es válido por 30 días. Con una seña de $5.000 podés solicitar la reserva; AK confirma la fecha y las condiciones antes de registrar el pago.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleShareBudgetWhatsApp}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-red-700 text-sm font-bold text-white hover:bg-red-800"
                                >
                                    <MessageSquare className="h-4 w-4" /> Consultar disponibilidad por WhatsApp
                                </Button>
                            </div>

                            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Button
                                    onClick={handleShareBudgetWhatsApp}
                                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-2 text-xs font-bold text-white hover:bg-emerald-800"
                                >
                                    <Share2 className="w-4 h-4 shrink-0"/> <span className="truncate">Compartir por WhatsApp</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleWhatsAppQuickConsult}
                                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-md border-slate-300 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    <MessageSquare className="w-4 h-4 shrink-0"/> <span className="truncate">Coordinar una Reunión</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleDownloadBudgetPdf}
                                  disabled={isDownloadingPdf}
                                  className="flex h-12 w-full items-center justify-center gap-1.5 rounded-md px-2 text-xs font-bold"
                                >
                                    {isDownloadingPdf
                                        ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                        : <FileDown className="h-4 w-4 shrink-0" />}
                                    <span className="truncate">Descargar PDF</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card ref={budgetDocumentRef} className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm print:bg-white print:shadow-none">
                        <CardHeader className="text-center bg-white p-6 sm:p-10 border-b border-slate-200">
                            <div className="flex justify-center mb-4">
                              <CompanyLogo size="sm" src={logoUrl || undefined} className="print:brightness-100" />
                            </div>
                            <CardTitle className="font-headline text-2xl font-bold text-slate-900 sm:text-3xl">Presupuesto estimado</CardTitle>
                            <p className="text-slate-500 font-semibold text-sm mt-2">AK Producciones Eventos — Salto, Uruguay</p>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-10 print:p-2 space-y-10">
                            <div className="grid gap-4 border-b border-slate-200 pb-6 text-sm text-slate-700 sm:grid-cols-2" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cliente</p>
                                    <p className="mt-1 font-bold text-slate-900">{clienteNombre}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evento</p>
                                    <p className="mt-1 font-bold text-slate-900">{eventoTipo}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha prevista</p>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {eventoFecha ? new Intl.DateTimeFormat('es-UY').format(eventoFecha) : 'A confirmar'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Invitados</p>
                                    <p className="mt-1 font-semibold text-slate-800">{adultos + ninosYAdolescentes} personas</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Referencia</p>
                                    <p className="mt-1 font-mono text-xs text-slate-600">{generatedPresupuestoId}</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto rounded-md border border-slate-200 print:border-slate-300">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200">
                                            <TableHead className="font-black text-[10px] uppercase pl-8 py-4 min-w-[200px] text-slate-600">Servicio / Categoría</TableHead>
                                            {(budgetSettings.showIndividualPrices ?? true) && (
                                              <>
                                                <TableHead className="text-center font-black text-[10px] uppercase text-slate-600">Cant.</TableHead>
                                                <TableHead className="text-right pr-8 font-black text-[10px] uppercase min-w-[120px] text-slate-600">Subtotal</TableHead>
                                              </>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(stats.agrupados).map(([categoria, items]) => (
                                            <React.Fragment key={categoria}>
                                                <TableRow className="bg-slate-50 border-y border-slate-200" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                                  <TableCell colSpan={(budgetSettings.showIndividualPrices ?? true) ? 3 : 1} className="font-black text-[10px] uppercase text-slate-700 pl-8 tracking-widest py-2">{categoria}</TableCell>
                                                </TableRow>
                                                {items.map(item => (
                                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-100" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                                        <TableCell className="pl-8 py-4">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div>
                                                                    <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                                                                    {(budgetSettings.showIndividualPrices ?? true) && (
                                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                                                            {formatCurrency(item.precioUnitario)}{esCategoriaGastronomica(item.categoria, item.calculationMethod) ? ' / PP' : ' c/u'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {isServiceRemovable(item) && (
                                                                    <Button
                                                                        data-pdf-exclude="true"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setServiceToDelete(item)}
                                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full print:hidden shrink-0"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        {(budgetSettings.showIndividualPrices ?? true) && (
                                                          <>
                                                            <TableCell className="text-center text-sm font-black text-slate-400">{item.cantidad}</TableCell>
                                                            <TableCell className="text-right pr-8">
                                                                {item.esRegalo ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] line-through text-slate-300 font-bold">{formatCurrency(item.costoTotal)}</span>
                                                                        <span className="text-[10px] font-black text-green-600 tracking-tighter uppercase">Sin Costo</span>
                                                                    </div>
                                                                ) : <span className="text-sm font-black text-slate-700">{formatCurrency(item.costoTotal)}</span>}
                                                            </TableCell>
                                                          </>
                                                        )}
                                                        {!(budgetSettings.showIndividualPrices ?? true) && item.esRegalo && (
                                                          <TableCell className="text-right pr-8">
                                                            <span className="text-[10px] font-black text-green-600 tracking-tighter uppercase">Sin Costo</span>
                                                          </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                        {removedServiceDetails.length > 0 && (
                                            <>
                                                <TableRow data-pdf-exclude="true" className="border-y border-red-200 bg-red-50 print:hidden">
                                                    <TableCell colSpan={(budgetSettings.showIndividualPrices ?? true) ? 3 : 1} className="py-2 pl-8 text-[10px] font-black uppercase tracking-widest text-red-700">
                                                        Servicios retirados
                                                    </TableCell>
                                                </TableRow>
                                                {removedServiceDetails.map(item => (
                                                    <TableRow key={item.id} data-pdf-exclude="true" className="border-slate-100 print:hidden">
                                                        <TableCell className="py-4 pl-8">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-500 line-through">{item.name}</p>
                                                                    <p className="text-[10px] font-bold uppercase text-red-600">Retirado por el cliente</p>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setExcludedPackageServiceIds(prev => prev.filter(id => id !== item.id));
                                                                    }}
                                                                    className="h-8 px-3 text-[10px] font-black uppercase border-red-200 text-red-700 hover:bg-red-50 rounded-xl print:hidden shrink-0"
                                                                >
                                                                    Agregar
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        {(budgetSettings.showIndividualPrices ?? true) && (
                                                            <>
                                                                <TableCell className="text-center text-sm text-slate-400">—</TableCell>
                                                                <TableCell className="pr-8 text-right text-sm font-black text-red-600">-{formatCurrency(item.deduction)}</TableCell>
                                                            </>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="ml-auto w-full max-w-sm space-y-3 rounded-md border border-slate-200 bg-slate-50 px-8 py-6 text-slate-900" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                {(budgetSettings.showIndividualPrices ?? true) && (
                                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                       <span>Subtotal Servicios:</span>
                                       <span>{formatCurrency(stats.subtotalBruto)}</span>
                                   </div>
                                 )}
                                 {stats.ahorroRegalos > 0 && (
                                     <div className="flex items-center justify-between text-[10px] font-bold uppercase text-emerald-700">
                                         <span>Ahorro Regalos Incluidos:</span>
                                         <span>-{formatCurrency(stats.ahorroRegalos)}</span>
                                     </div>
                                 )}
                                 {stats.descPromo > 0 && (
                                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-600 tracking-widest">
                                         <span>Bonificación Especial ({stats.discountPercentage}%):</span>
                                         <span>-{formatCurrency(stats.descPromo)}</span>
                                     </div>
                                 )}
                                 {(stats.ahorroRegalos + stats.descPromo) > 0 && (
                                     <div className="flex justify-between items-center rounded-md bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase text-emerald-800 tracking-widest border border-emerald-100">
                                         <span>Ahorro total:</span>
                                         <span>{formatCurrency(stats.ahorroRegalos + stats.descPromo)}</span>
                                     </div>
                                 )}
                                 <Separator className="bg-slate-200" />
                                 <div className="flex justify-between items-center pt-2">
                                     <span className="text-sm font-black uppercase tracking-tighter text-slate-700">Precio vigente:</span>
                                     <span className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalFinal)}</span>
                                 </div>
                                 {stats.precioPorPersona > 0 && (
                                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                         <span>Valor aprox. por persona:</span>
                                         <span>{formatCurrency(stats.precioPorPersona)}</span>
                                     </div>
                                 )}
                            </div>
                            {stats.annualProjection.applies && (
                                <div className="rounded-md border border-slate-200 bg-white p-4 text-sm" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        Proyeccion de ajuste anual ({stats.annualProjection.adjustmentPct}%)
                                    </p>
                                    <div className="space-y-2">
                                        {stats.annualProjection.rows.map(row => (
                                            <div key={row.year} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                <span className="font-semibold text-slate-600">Total estimado {row.year}</span>
                                                <span className="font-black text-slate-900">{formatCurrency(row.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-xs font-medium text-slate-500">
                                        El presupuesto principal muestra el precio vigente {stats.annualProjection.currentYear}. El ajuste futuro es informativo y se aplica por contrato si la fecha pasa a otro anio.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-slate-50 p-8 border-t flex flex-col items-center gap-4">
                            <div className="w-full rounded-md border border-slate-200 bg-white p-6">
                                <h4 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-700"><Info className="w-4 h-4"/> Condiciones de reserva</h4>
                                <p className="text-xs font-medium leading-relaxed text-slate-600">
                                    {stats.annualProjection.applies ? (
                                        <>Con una seña de $5.000 podés solicitar la reserva de la fecha y del servicio. El presupuesto es válido por 30 días para mantener el precio de la promoción y los regalos incluidos. Los eventos programados para años posteriores al vigente tendrán un ajuste anual proyectado del {stats.annualProjection.adjustmentPct}% de acuerdo a lo establecido en el contrato.</>
                                    ) : (
                                        <>Con una seña de $5.000 podés solicitar la reserva de la fecha y del servicio. El presupuesto es válido por 30 días para mantener el precio de la promoción y los regalos incluidos. El total mostrado corresponde al precio vigente del año {currentYear}.</>
                                    )}
                                </p>
                                {budgetSettings.bookingTerms && (
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{budgetSettings.bookingTerms}</p>
                                )}
                            </div>
                            <div data-pdf-exclude="true" className="flex flex-col sm:flex-row items-center gap-3 print:hidden">
                              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-md text-xs font-bold text-slate-500">Iniciar nueva simulación</Button>
                              <a
                                href="https://akproduccioneseventos.com/#faq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                              >
                                <Info className="w-3.5 h-3.5" /> Preguntas Frecuentes
                              </a>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="ak-public-page flex min-h-screen flex-col items-center justify-center gap-4 p-2 sm:p-6 lg:p-8">
            {/* Chat Simulator Banner */}
            <div className="w-full max-w-3xl print:hidden">
              <Link href="/simulador-ak">
                <div className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-5 py-4 text-white shadow-lg transition-all hover:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 shrink-0 text-emerald-300" />
                    <div>
                      <p className="font-black text-sm">También podés armarlo con el Asistente AK</p>
                      <p className="text-xs text-white/70">La IA usa los mismos paquetes, servicios y precios de este simulador manual</p>
                    </div>
                  </div>
                  <div className="shrink-0 bg-white/20 group-hover:bg-white/30 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors">
                    Probar IA →
                  </div>
                </div>
              </Link>
            </div>

            <Card className="w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                <CardHeader className="text-center bg-slate-50 p-6 sm:p-10 border-b border-slate-200">
                    <div className="flex justify-center mb-4">
                      <CompanyLogo size="sm" src={logoUrl || undefined} className="opacity-50" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 sm:text-3xl">Armá tu presupuesto</CardTitle>
                    <CardDescription className="mt-2 text-sm font-bold text-slate-500">
                        Paso {step} de 5 · {STEP_LABELS[step - 1]}
                    </CardDescription>
                    <div className="mt-6">
                        <Progress value={(step / 5) * 100} className="h-2 bg-slate-200" />
                    </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-10">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto py-4">
                            <div className="text-center space-y-4">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                                    <Sparkles className="h-6 w-6 text-red-700" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">La fiesta de tus sueños, planificada sin estrés</h2>
                                <p className="text-lg font-bold text-primary">Elegí lo que te gusta, calculá el costo al instante y armá una experiencia inolvidable.</p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 pt-4">
                                <div className="flex items-start gap-4 border-b border-slate-200 py-4 text-left">
                                    <div className="shrink-0 rounded-md bg-slate-100 p-3 text-slate-700">
                                        <PartyPopper className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider mb-1">Todos los Servicios</h4>
                                        <p className="text-xs leading-relaxed text-slate-600 font-semibold">Comida completa, barra de tragos, discoteca, iluminación, decoración y más. Todo en un solo lugar.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 border-b border-slate-200 py-4 text-left">
                                    <div className="shrink-0 rounded-md bg-slate-100 p-3 text-slate-700">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider mb-1">Equipo de Organización</h4>
                                        <p className="text-xs leading-relaxed text-slate-600 font-semibold">Un equipo profesional a cargo de coordinar y planificar cada detalle de tu evento de principio a fin.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 border-b border-slate-200 py-4 text-left">
                                    <div className="shrink-0 rounded-md bg-slate-100 p-3 text-slate-700">
                                        <Laptop className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider mb-1">Tecnología de Organización</h4>
                                        <p className="text-xs leading-relaxed text-slate-600 font-semibold">Plataforma digital para la gestión de invitados, control de accesos por QR y herramientas interactivas.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 border-b border-slate-200 py-4 text-left">
                                    <div className="shrink-0 rounded-md bg-slate-100 p-3 text-slate-700">
                                        <HeartHandshake className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider mb-1">Experiencia del Cliente e Invitado</h4>
                                        <p className="text-xs leading-relaxed text-slate-600 font-semibold">Nos enfocamos en crear momentos inolvidables tanto para vos como para cada uno de tus invitados.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-between gap-5 rounded-md border border-slate-800 bg-slate-950 p-6 text-left text-white sm:flex-row">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-md bg-white/10 p-3">
                                        <MapPin className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/70">Locación</h4>
                                        <h3 className="font-black text-lg">Salón de Fiestas: Club Uruguay</h3>
                                        <p className="text-xs text-white/70 font-semibold">El salón más distinguido con servicio integral.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Ingresá tus datos y los del evento</h2>
                                <p className="mt-1 text-sm text-slate-500">Guardamos tu avance de forma segura y calculamos los precios según la locación y cantidad de invitados.</p>
                            </div>

                            {/* Datos de Contacto */}
                            <div className="grid gap-5 md:grid-cols-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="space-y-2">
                                    <Label htmlFor="simulator-name">Nombre completo</Label>
                                    <Input id="simulator-name" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ej: Ana García" className="h-12 rounded-md bg-white text-slate-900" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="simulator-phone">WhatsApp</Label>
                                    <Input id="simulator-phone" type="tel" value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} placeholder="099 123 456 o +598 99 123 456" className="h-12 rounded-md bg-white text-slate-900" />
                                    <p className="text-[10px] text-slate-500 font-semibold">Acepta número uruguayo con espacios, guiones o prefijo +598.</p>
                                </div>
                            </div>

                            {/* Buscador de presupuestos anteriores */}
                            {isSearchingBudgets && (
                                <div className="flex items-center justify-center py-4 text-sm text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2"/>
                                    Buscando presupuestos anteriores...
                                </div>
                            )}

                            {!isSearchingBudgets && existingBudgets.length > 0 && (
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-3 text-left">
                                    <div className="flex items-center gap-2 text-emerald-800">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0"/>
                                        <p className="text-sm font-black uppercase tracking-tight">¡Encontramos presupuestos anteriores asociados a tu celular!</p>
                                    </div>
                                    <p className="text-xs text-slate-600 font-semibold">Detectamos que ya habías simulado. Podés continuar con la simulación actual o hacer click en cualquier presupuesto para reabrirlo:</p>
                                    <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                                        {existingBudgets.map((b) => {
                                            const formattedDate = b.eventoFecha ? new Intl.DateTimeFormat('es-UY').format(new Date(b.eventoFecha)) : 'A confirmar';
                                            return (
                                                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-emerald-100 rounded-xl hover:shadow-md transition-all">
                                                    <div className="space-y-0.5 text-left">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presupuesto #{b.numero}</span>
                                                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{b.eventoTipo} · {formattedDate}</p>
                                                        <p className="text-xs font-black text-emerald-700">{formatCurrency(b.totalConDescuento)}</p>
                                                    </div>
                                                    <Link href={`/presupuestos/${b.id}/ver?cliente=1&token=${b.token}`} target="_blank" className="shrink-0">
                                                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest">
                                                            Ver Presupuesto
                                                        </Button>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Detalles del Evento */}
                            <div className="grid gap-5 md:grid-cols-2 pt-4">
                                <div className="space-y-2">
                                    <Label>Tipo de evento</Label>
                                    <Select value={eventoTipo} onValueChange={setEventoTipo}>
                                        <SelectTrigger className="h-12 rounded-md bg-white text-slate-900"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                                            <SelectItem value="Cumpleaños infantil">Cumpleaños infantil</SelectItem>
                                            <SelectItem value="15 años">15 años</SelectItem>
                                            <SelectItem value="Boda">Boda</SelectItem>
                                            <SelectItem value="Evento empresarial">Empresarial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Adultos</Label>
                                        <Input type="number" min={1} value={adultos} onChange={e => setAdultos(Math.max(0, Number(e.target.value)))} className="h-12 rounded-md bg-white text-slate-900" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Niños y adolescentes</Label>
                                        <Input type="number" min={0} value={ninosYAdolescentes} onChange={e => setNinosYAdolescentes(Math.max(0, Number(e.target.value)))} className="h-12 rounded-md bg-white text-slate-900" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Duración del evento</Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {DURATION_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setDuracionHoras(option.value)}
                                            className={cn(
                                                'rounded-2xl border p-4 text-left transition flex flex-col justify-between h-20',
                                                duracionHoras === option.value ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-400'
                                            )}
                                        >
                                            <span className="flex items-center justify-between gap-3 text-sm font-black text-slate-900 w-full">
                                                {option.title}
                                                {duracionHoras === option.value && <Check className="h-5 w-5 text-primary" />}
                                            </span>
                                            <span className="block text-xs text-slate-500 font-semibold">{option.detail}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Salón de fiestas</Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button type="button" onClick={() => setSalonChoice('propio')} className={cn('rounded-2xl border p-5 text-left transition flex flex-col h-32 justify-between', salonChoice === 'propio' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300')}>
                                        <MapPin className="h-6 w-6 text-primary" />
                                        <div>
                                            <p className="text-sm font-black text-slate-900">Tengo salón o locación propia</p>
                                            <p className="mt-1 text-xs text-slate-400 font-semibold">No se adiciona costo por locación.</p>
                                        </div>
                                    </button>
                                    <button type="button" onClick={() => setSalonChoice('club')} disabled={!config?.clubUruguayConfig?.activo} className={cn('rounded-2xl border p-5 text-left disabled:opacity-50 transition flex flex-col h-32 justify-between relative', salonChoice === 'club' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300')}>
                                        <div className="absolute top-3 right-3 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                            50% OFF
                                        </div>
                                        <Building2 className="h-6 w-6 text-primary" />
                                        <div>
                                            <p className="text-sm font-black text-slate-900">Quiero Club Uruguay</p>
                                            <p className="mt-1 text-[10px] text-slate-400 font-semibold leading-normal">
                                                <span className="line-through mr-1">{formatCurrency((config?.clubUruguayConfig?.precio || 20000) * 2)}</span>
                                                <span className="font-bold text-amber-600">{formatCurrency(config?.clubUruguayConfig?.precio || 0)}</span>
                                                <span className="ml-1">agregados.</span>
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Fecha del evento</Label>
                                <DatePickerDemo selectedDate={eventoFecha} onDateChange={handleEventoFechaChange} className="h-12 rounded-xl bg-white text-slate-900 border-slate-200" />
                                {dateWarning && (
                                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                                        <p className="text-sm font-bold text-amber-900">{dateWarning}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {dateSuggestions.map(date => (
                                                <button key={date} type="button" className="rounded-md bg-white px-3 py-2 text-xs font-bold text-amber-900 shadow-sm border" onClick={() => handleEventoFechaChange(new Date(`${date}T12:00:00`))}>
                                                    {new Intl.DateTimeFormat('es-UY').format(new Date(`${date}T12:00:00`))}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                                <Input placeholder="Busca tu plato favorito..." value={gastronomiaSearchTerm} onChange={e => setGastronomiaSearchTerm(e.target.value)} className="pl-12 h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-lg font-bold text-slate-900"/>
                            </div>

                            <div className="space-y-6">
                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                                    <div className="w-2 h-6 bg-primary rounded-full"></div> ENTRADAS (Elige {maxEntradas})
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {entradasDisponibles.map(s => {
                                        const isRecommended = Boolean(s.isFeatured || config?.platosVisibles?.find(p => p.id === s.id)?.recommended);
                                        const imageUrl = safeImageUrl(s.imageUrl);
                                        return (
                                            <label key={s.id} className={cn(
                                                 "group relative flex cursor-pointer items-center gap-4 rounded-md border p-5 transition-colors",
                                                 selectedEntradas.includes(s.id) ? "border-red-700 bg-red-50" : "border-slate-200 bg-white hover:border-slate-400",
                                                 isRecommended && !selectedEntradas.includes(s.id) && "border-slate-300 bg-slate-50"
                                            )}>
                                                {isRecommended && (
                                                     <div className="absolute -top-3 left-4 z-10 rounded-sm border border-slate-300 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-700">Recomendado</div>
                                                )}
                                                {imageUrl && (
                                                  <div className="h-20 w-24 rounded-2xl overflow-hidden border bg-white shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageUrl} alt={s.nombre} className="h-full w-full object-cover" />
                                                  </div>
                                                )}
                                                <Checkbox checked={selectedEntradas.includes(s.id)} onCheckedChange={v => handleEntradaChange(s.id, !!v)} className="h-6 w-6 rounded-lg"/>
                                                <div className="flex flex-col flex-grow min-w-0">
                                                    <span className={cn("text-sm font-black uppercase tracking-tight truncate", isRecommended ? "text-amber-900" : "text-slate-700")}>{s.nombre}</span>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{formatCurrency(s.precioPorPersona || s.precioVenta)} p/p</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                                    <div className="w-2 h-6 bg-primary rounded-full"></div> PLATO PRINCIPAL (Adultos)
                                </Label>
                                <RadioGroup value={selectedPrincipal} onValueChange={v => { setSelectedPrincipal(v); handleGastronomicSelectionChange('principal', v); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {principalesDisponibles.map(s => {
                                        const isRecommended = Boolean(s.isFeatured || config?.platosVisibles?.find(p => p.id === s.id)?.recommended);
                                        const imageUrl = safeImageUrl(s.imageUrl);
                                        return (
                                            <label key={s.id} className={cn(
                                                 "group relative flex cursor-pointer items-center gap-4 rounded-md border p-5 transition-colors",
                                                 selectedPrincipal === s.id ? "border-red-700 bg-red-50" : "border-slate-200 bg-white hover:border-slate-400",
                                                 isRecommended && selectedPrincipal !== s.id && "border-slate-300 bg-slate-50"
                                            )}>
                                                {isRecommended && (
                                                     <div className="absolute -top-3 left-4 z-10 rounded-sm border border-slate-300 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-700">Recomendado</div>
                                                )}
                                                {imageUrl && (
                                                  <div className="h-20 w-24 rounded-2xl overflow-hidden border bg-white shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageUrl} alt={s.nombre} className="h-full w-full object-cover" />
                                                  </div>
                                                )}
                                                <RadioGroupItem value={s.id} className="h-6 w-6"/>
                                                <div className="flex flex-col flex-grow min-w-0">
                                                    <span className={cn("text-sm font-black uppercase tracking-tight truncate", isRecommended ? "text-amber-900" : "text-slate-700")}>{s.nombre}</span>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{formatCurrency(s.precioPorPersona || s.precioVenta)} p/p</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </RadioGroup>
                            </div>

                            {ninosYAdolescentes > 0 && (
                                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 flex items-center gap-3">
                                        <div className="w-2 h-6 bg-purple-500 rounded-full"></div> MENÚ INFANTIL
                                    </Label>
                                    <RadioGroup value={selectedInfantil} onValueChange={v => { setSelectedInfantil(v); handleGastronomicSelectionChange('infantil', v); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {menusNinoDisponibles.map(s => {
                                            const isRecommended = Boolean(s.isFeatured || config?.platosVisibles?.find(p => p.id === s.id)?.recommended);
                                            const imageUrl = getServiceOrDishImage(s);
                                            return (
                                                <label key={s.id} className={cn(
                                                     "group relative flex cursor-pointer items-center gap-4 rounded-md border p-5 transition-colors",
                                                     selectedInfantil === s.id ? "border-red-700 bg-red-50" : "border-slate-200 bg-white hover:border-slate-400",
                                                     isRecommended && selectedInfantil !== s.id && "border-slate-300 bg-slate-50"
                                                )}>
                                                    {isRecommended && (
                                                         <div className="absolute -top-3 left-4 z-10 rounded-sm border border-slate-300 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-700">Recomendado</div>
                                                    )}
                                                    {imageUrl && (
                                                      <div className="h-20 w-24 rounded-2xl overflow-hidden border bg-white shrink-0">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={imageUrl} alt={s.nombre} className="h-full w-full object-cover" />
                                                      </div>
                                                    )}
                                                    <RadioGroupItem value={s.id} className="h-6 w-6 border-purple-300"/>
                                                    <div className="flex flex-col flex-grow min-w-0">
                                                        <span className={cn("text-sm font-black uppercase tracking-tight truncate", isRecommended ? "text-amber-900" : "text-slate-700")}>{s.nombre}</span>
                                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{formatCurrency(s.precioPorPersona || s.precioVenta)} p/p</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </RadioGroup>
                                </div>
                            )}
                        </div>
                    )}
                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 text-left">
                            <h3 className="text-center text-xl font-bold text-slate-900">Seleccioná tu paquete de servicios</h3>
                            <RadioGroup
                                value={selectedPaqueteId}
                                onValueChange={value => {
                                    setSelectedPaqueteId(value);
                                    setExcludedPackageServiceIds([]);
                                    const pkg = config?.paquetes?.find(item => item.id === value);
                                    if (pkg) {
                                        setFormData(prev => {
                                            const newSelected = new Map(prev.serviciosSeleccionados);
                                            pkg.serviciosIncluidos?.forEach((item: any) => newSelected.delete(item.id));
                                            return { ...prev, serviciosSeleccionados: newSelected };
                                        });
                                    }
                                }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {sortedPaquetes.map(p => {
                                    const sortedIncluded = [...p.serviciosIncluidos].sort((a, b) => {
                                        if (a.esRegalo && !b.esRegalo) return 1;
                                        if (!a.esRegalo && b.esRegalo) return -1;
                                        const sA = allSimuladorServices.find(os => os.id === a.id);
                                        const sB = allSimuladorServices.find(os => os.id === b.id);
                                        return (sA?.categoria || '').localeCompare(sB?.categoria || '');
                                    });

                                    const estimatedTotal = calculatePackageEstimatedPrice(p);
                                    const isExpanded = !!expandedPackages[p.id];

                                    return (
                                        <label key={p.id} className={cn(
                                            "relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-md border p-6 transition-colors sm:p-8",
                                            selectedPaqueteId === p.id ? "border-red-700 bg-red-50" : "border-slate-200 bg-white hover:border-slate-400",
                                            p.recommended && selectedPaqueteId !== p.id && "border-slate-400 bg-slate-50"
                                        )}>
                                            {p.recommended && (
                                                <div className="absolute right-3 top-3 z-10 rounded-sm bg-slate-900 px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest text-white sm:text-[9px]">
                                                    Más elegido
                                                </div>
                                            )}
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-black uppercase tracking-tight text-xl text-slate-800 leading-none">{p.nombre}</p>
                                                    <p className="text-sm font-black text-primary">{formatCurrency(estimatedTotal)} <span className="text-[8px] uppercase tracking-widest text-slate-400 ml-1">Presupuesto Estimado</span></p>
                                                </div>
                                                <RadioGroupItem value={p.id} className="h-6 w-6"/>
                                            </div>

                                            <div className="space-y-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setExpandedPackages(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                                                    }}
                                                    className="flex items-center gap-1.5 text-xs font-black text-primary hover:text-red-700 transition"
                                                >
                                                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                                                    {isExpanded ? "Ocultar servicios incluidos" : "Ver servicios incluidos"}
                                                </button>

                                                <AnimatePresence initial={false}>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="overflow-hidden space-y-3 pt-2"
                                                        >
                                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                                <ListPlus className="w-3 h-3"/> Servicios Incluidos:
                                                            </Label>
                                                            <ScrollArea className="h-48 pr-3 border rounded-2xl bg-white shadow-inner p-2">
                                                                <ul className="text-[10px] space-y-2 text-slate-500 font-bold uppercase tracking-tight">
                                                                    {sortedIncluded.map(s => {
                                                                        const serv = allSimuladorServices.find(os => os.id === s.id);
                                                                        return serv && (
                                                                            <li key={s.id} className={cn(
                                                                                "flex items-center justify-between gap-3 p-2 rounded-xl border",
                                                                                s.esRegalo ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                            )}>
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    {s.esRegalo ? <Gift className="w-3.5 h-3.5 shrink-0"/> : <Check className="w-3.5 h-3.5 opacity-40 shrink-0"/>}
                                                                                    <span className="truncate">{serv.nombre}</span>
                                                                                </div>
                                                                                {s.esRegalo && <Badge className="bg-emerald-600 text-white border-none font-black text-[8px] px-1.5 h-4">REGALO</Badge>}
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            </ScrollArea>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </label>
                                    );
                                })}
                            </RadioGroup>
                            {sortedPaquetes.length === 0 && (
                                <p className="text-center text-sm text-slate-500">No hay paquetes aplicables para el tipo de evento seleccionado.</p>
                            )}

                            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                              <strong>Precios {currentYear}</strong>
                              {stats.annualProjection.applies
                                ? <> — Ajuste anual proyectado del <strong>{stats.annualProjection.adjustmentPct}%</strong> para eventos en {stats.annualProjection.eventYear}.</>
                                : <> — El total corresponde al precio vigente.</>}
                            </div>
                        </div>
                    )}
                    {step === 5 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 text-left">
                            <div className="border-b border-slate-100 pb-5">
                                <h2 className="text-3xl font-bold text-slate-900">Personalización de tu presupuesto</h2>
                                <p className="mt-2 text-sm text-slate-500 font-semibold leading-relaxed">
                                    ¡Llegamos a la etapa final! Ajustá la fecha y los invitados, quitá opcionales de tu paquete o agregá extras a tu gusto. El total se recalcula al instante.
                                </p>
                            </div>

                            <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-6">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <CalendarDays className="w-[18px] h-[18px] text-slate-500"/> Información General del Evento
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-3 items-end">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600">Fecha del evento</Label>
                                        <DatePickerDemo selectedDate={eventoFecha} onDateChange={handleEventoFechaChange} className="h-12 rounded-xl bg-white text-slate-900 border-slate-200 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600">Invitados Adultos</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={adultos || ''}
                                            onChange={e => setAdultos(Math.max(1, Number(e.target.value) || 0))}
                                            className="h-12 rounded-xl bg-white text-slate-900 border-slate-200 focus-visible:ring-primary font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600">Niños y Adolescentes</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={ninosYAdolescentes || ''}
                                            onChange={e => setNinosYAdolescentes(Math.max(0, Number(e.target.value) || 0))}
                                            className="h-12 rounded-xl bg-white text-slate-900 border-slate-200 focus-visible:ring-primary font-bold"
                                        />
                                    </div>
                                </div>
                                {dateWarning && (
                                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                                        <p className="text-sm font-bold text-amber-900">{dateWarning}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {dateSuggestions.map(date => (
                                                <button key={date} type="button" className="rounded-md bg-white px-3 py-2 text-xs font-bold text-amber-900 shadow-sm border hover:bg-amber-100 transition" onClick={() => handleEventoFechaChange(new Date(`${date}T12:00:00`))}>
                                                    {new Intl.DateTimeFormat('es-UY').format(new Date(`${date}T12:00:00`))}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 pl-2">
                                    <ListPlus className="w-[18px] h-[18px] text-slate-500" /> Servicios contratados en tu propuesta
                                </h3>

                                {Object.entries(groupedDetallados).map(([category, items]) => {
                                    const activeItems = items.filter(item => !excludedPackageServiceIds.includes(item.id));
                                    if (activeItems.length === 0) return null;

                                    const style = getCategoryStyle(category);
                                    const CatIcon = style.icon;

                                    return (
                                        <div key={category} className="relative space-y-4 overflow-hidden rounded-md border border-slate-200 bg-white p-6">
                                            <div className="absolute left-0 top-0 h-full w-1 bg-slate-800" />
                                            <div className="flex items-center justify-between border-b pb-3 pl-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white">
                                                        <CatIcon className="w-4 h-4" />
                                                    </span>
                                                    <span className="font-black text-slate-800 text-xs uppercase tracking-wider">{formatCategoriaText(category)}</span>
                                                </div>
                                                <Badge className="bg-slate-100 text-[9px] font-bold text-slate-600 hover:bg-slate-100">{activeItems.length} activos</Badge>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {activeItems.map(item => {
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white"
                                                        >
                                                            <div className="min-w-0 flex-1 text-left">
                                                                <span className="block font-black text-slate-800 text-xs truncate">
                                                                    {item.nombre}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                                    <span className={item.esRegalo ? "text-emerald-600 font-black" : ""}>{item.esRegalo ? "Regalo incluido" : (item.subcategoria || formatCategoriaText(item.categoria) || 'Servicio activo')}</span>
                                                                    {!item.esRegalo && (
                                                                        <>
                                                                            <span>•</span>
                                                                            {item.id === 'serv_salon_club_uruguay' ? (
                                                                                <span className="text-slate-500 font-bold">
                                                                                    <span className="line-through text-slate-400 mr-1">{formatCurrency(item.costoTotal * 2)}</span>
                                                                                    <span className="text-amber-600 font-black">{formatCurrency(item.costoTotal)} (50% OFF)</span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className="font-bold text-slate-700">{formatCurrency(item.costoTotal)}</span>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {isServiceRemovable(item) && (
                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => setServiceToDelete(item)}
                                                                    className="h-8 w-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                                                                    title="Retirar servicio"
                                                                >
                                                                    <Trash2 className="w-4 h-4"/>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {excludedPackageServiceIds.length > 0 && (
                                <div className="p-6 bg-slate-50/50 border border-dashed border-slate-300 rounded-[2rem] space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 text-left">
                                        <Info className="w-[18px] h-[18px] text-slate-500" />
                                        <span>Servicios retirados del paquete (Opcionales)</span>
                                        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 font-black text-[9px]">{excludedPackageServiceIds.length}</Badge>
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {excludedPackageServiceIds.map(excludedId => {
                                            const service = allSimuladorServices.find(s => s.id === excludedId);
                                            if (!service) return null;
                                            const calculated = getSimulatorServiceCalculatedData(service, adultos, ninosYAdolescentes);
                                            return (
                                                <div
                                                    key={excludedId}
                                                    className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-3.5 opacity-70 hover:opacity-100 transition-all duration-200"
                                                >
                                                    <div className="min-w-0 flex-1 text-left">
                                                        <span className="block font-black text-slate-400 line-through text-xs truncate">
                                                            {service.nombre}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <span>{service.subcategoria || formatCategoriaText(service.categoria)}</span>
                                                            <span>•</span>
                                                            <span className="text-slate-500 font-bold">-{formatCurrency(calculated.total)}</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleToggleServiceInBudget(excludedId, 'include')}
                                                        className="h-8 w-8 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                                                        title="Volver a agregar"
                                                    >
                                                        <Plus className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6 rounded-md border border-slate-200 bg-white p-6">
                                <div className="space-y-4">
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
                                        <Search className="w-[18px] h-[18px] text-slate-500"/> ¿Querés agregar algún servicio extra?
                                    </h4>
                                    <div className="relative">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                            <Input
                                                type="text"
                                                placeholder="Buscá servicios adicionales por nombre (ej: cabina, plataforma, barra, cascada)..."
                                                value={serviceSearchTerm}
                                                onChange={e => setServiceSearchTerm(e.target.value)}
                                                onFocus={() => setIsSearchFocused(true)}
                                                onBlur={() => {
                                                    setTimeout(() => setIsSearchFocused(false), 200);
                                                }}
                                                className="h-12 pl-12 rounded-xl border-slate-200 bg-white text-slate-900 focus-visible:ring-primary"
                                            />
                                            {serviceSearchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setServiceSearchTerm('')}
                                                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        {isSearchFocused && filteredSearchServices.length > 0 && (
                                            <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="p-3 bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Servicios encontrados ({filteredSearchServices.length})
                                                </div>
                                                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                                    {filteredSearchServices.map(service => {
                                                        const calculated = getSimulatorServiceCalculatedData(service, adultos, ninosYAdolescentes);
                                                        return (
                                                            <button
                                                                key={service.id}
                                                                type="button"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                }}
                                                                onClick={() => {
                                                                    handleToggleServiceInBudget(service.id, 'include');
                                                                    setServiceSearchTerm('');
                                                                    setIsSearchFocused(false);
                                                                    toast({
                                                                        title: "Servicio agregado",
                                                                        description: `${service.nombre} se agregó al presupuesto.`,
                                                                    });
                                                                }}
                                                                className="w-full p-4 text-left hover:bg-slate-50 flex items-center justify-between gap-4 transition"
                                                            >
                                                                <div>
                                                                    <span className="block text-sm font-bold text-slate-800">{service.nombre}</span>
                                                                    <span className="block text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                                                                        {formatCategoriaText(service.categoria)} {service.subcategoria ? `· ${service.subcategoria}` : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className="block font-black text-sm text-primary">{formatCurrency(calculated.total)}</span>
                                                                    <span className="block text-[9px] text-primary font-bold uppercase tracking-wider mt-0.5">Agregar +</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {suggestedServices.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 text-left">
                                            <Sparkles className="h-3.5 w-3.5 text-slate-600" /> Recomendados para tu evento:
                                        </h5>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {suggestedServices.map(service => {
                                                const calculated = getSimulatorServiceCalculatedData(service, adultos, ninosYAdolescentes);
                                                return (
                                                    <div key={service.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-400 hover:shadow-md transition duration-200">
                                                        <div className="min-w-0 flex-1 text-left">
                                                            <span className="block font-black text-xs text-slate-800 truncate">{service.nombre}</span>
                                                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{formatCategoriaText(service.categoria)}</span>
                                                            <span className="block text-xs font-black text-primary mt-1">{formatCurrency(calculated.total)}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                handleToggleServiceInBudget(service.id, 'include');
                                                                toast({
                                                                    title: "Servicio agregado",
                                                                    description: `${service.nombre} se agregó al presupuesto.`,
                                                                });
                                                            }}
                                                            className="rounded-xl bg-slate-950 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 h-9 transition shrink-0"
                                                        >
                                                            Agregar +
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm space-y-4">
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider text-left">¿Querés comparar con otros paquetes?</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {config?.paquetes?.filter(p => p.id !== selectedPaqueteId).map(p => {
                                        const totalInvitados = adultos + ninosYAdolescentes;
                                        const precioActual = stats.totalFinal;
                                        const precioAlternativo = packageSummaries.get(p.id)?.total || 0;
                                        const diffTotal = precioAlternativo - precioActual;
                                        const diffPorPersona = Math.round(Math.abs(diffTotal) / (totalInvitados || 1));
                                        const esMejora = diffTotal > 0;
                                        return (
                                            <div key={p.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl flex flex-col justify-between gap-4 hover:bg-slate-50 transition duration-200 text-left">
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alternativa</span>
                                                    <h5 className="text-base font-bold text-slate-800">{p.nombre}</h5>
                                                    <p className="mt-2 text-xl font-black text-primary">{formatCurrency(precioAlternativo)}</p>
                                                    <p className="mt-0.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                                        {esMejora
                                                            ? `+ ${formatCurrency(diffPorPersona)} por persona`
                                                            : `- ${formatCurrency(diffPorPersona)} por persona`}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        setSelectedPaqueteId(p.id);
                                                        setExcludedPackageServiceIds([]);
                                                        setFormData(prev => {
                                                            const newSelected = new Map(prev.serviciosSeleccionados);
                                                            p.serviciosIncluidos?.forEach((item: any) => newSelected.delete(item.id));
                                                            return { ...prev, serviciosSeleccionados: newSelected };
                                                        });
                                                        toast({
                                                            title: "Paquete cambiado",
                                                            description: `Cambiado a ${p.nombre} con éxito.`
                                                        });
                                                    }}
                                                    className="rounded-xl font-black uppercase tracking-widest text-[9px] h-9 w-full bg-slate-900 hover:bg-red-700 text-white transition"
                                                >
                                                    Cambiar a {p.nombre}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                                <strong>Precios {currentYear}</strong>
                                {stats.annualProjection.applies
                                    ? <> — El presupuesto lleva un ajuste anual proyectado del <strong>{stats.annualProjection.adjustmentPct}%</strong> para eventos en {stats.annualProjection.eventYear}.</>
                                    : <> — El total mostrado corresponde al precio vigente.</>}
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-6 sm:p-10 border-t bg-slate-50 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        <Button variant="ghost" onClick={handlePrev} disabled={step === 1 || isSavingProgress || isGenerating} className="w-full sm:w-auto rounded-md h-12 px-7 font-bold text-slate-500">Anterior</Button>
                        {stats.ahorroRegalos > 0 && (
                            <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-bold text-emerald-800">
                                🎁 ¡Ahorrás {formatCurrency(stats.ahorroRegalos)} en regalos incluidos!
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                        <Button onClick={handleNext} disabled={isGenerating || isSavingProgress} className="w-full sm:w-auto rounded-md h-14 px-10 font-black text-base">
                            {(isGenerating || isSavingProgress) ? <Loader2 className="animate-spin mr-3"/> : null}
                            {step === 5 ? "Generar presupuesto" : "Continuar"}
                            {step < 5 && <ArrowRight className="ml-3 w-5 h-5"/>}
                        </Button>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-md border">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total vigente:</p>
                            <p className="text-sm font-black text-primary">{formatCurrency(stats.totalFinal)}</p>
                            {stats.precioPorPersona > 0 && <p className="text-xs font-bold text-slate-500">{formatCurrency(stats.precioPorPersona)} p/p</p>}
                        </div>
                    </div>
                </CardFooter>
            </Card>

            <Dialog open={serviceToDelete !== null} onOpenChange={(open) => { if (!open) setServiceToDelete(null); }}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 font-black uppercase text-base flex items-center gap-2">
                            ⚠️ ¿Eliminar servicio?
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 text-sm font-semibold">
                            ¿Estás seguro de que deseas eliminar el servicio <span className="text-rose-600 font-bold">"{serviceToDelete?.nombre}"</span> de tu presupuesto?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setServiceToDelete(null)} className="rounded-xl font-bold">
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmDeleteService} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ArmadoRapidoPage() {
    return (
        <Suspense fallback={null}>
            <SimuladorContent />
        </Suspense>
    );
}
