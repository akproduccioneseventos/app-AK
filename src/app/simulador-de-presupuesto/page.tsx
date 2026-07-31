
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
    FileDown,
    MapPin,
    PackageCheck,
    Utensils,
    UtensilsCrossed,
    X,
    MessageSquare,
    Sparkles,
    Laptop,
    HeartHandshake,
    Settings2,
    Plus,
    Trash2,
    AlertTriangle,
    ChevronDown,
    Timer,
    HelpCircle,
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
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
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
import {
  getPackageChangeResult,
  getPackageRecommendations,
  getRemovablePackageServices,
  getTierMissingServices,
} from '@/lib/simulator/package-customization';
import { downloadSimulatorBudgetPdf } from '@/lib/budget/simulator-budget-pdf';

const COMMERCIAL_TIMER_SECONDS = 15 * 60;
const COMMERCIAL_TIMER_STORAGE_KEY = 'ak-simulator-commercial-timer';
const LEAD_PROGRESS_WAIT_MS = 4500;

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const formatCountdown = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
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
    timeoutMs = 20000,
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
        imageUrl: getCateringDishImage(item) || item.imageUrl,
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
    const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
    const [salonChoice, setSalonChoice] = useState<'propio' | 'club' | ''>(prefillSalonChoice);
    const [excludedPackageServiceIds, setExcludedPackageServiceIds] = useState<string[]>([]);
    const [dateSuggestions, setDateSuggestions] = useState<string[]>([]);
    const [dateWarning, setDateWarning] = useState('');
    const [dateAvailabilityStatus, setDateAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'occupied' | 'error'>('idle');
    const dateAvailabilityRequestRef = useRef(0);

    const [gastronomiaSearchTerm, setGastronomiaSearchTerm] = useState('');
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{
        nombre?: boolean;
        contacto?: boolean;
        adultos?: boolean;
        fecha?: boolean;
        salon?: boolean;
    }>({});

    const [isLoading, setIsLoading] = useState(true);
    const [errorLoading, setErrorLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingProgress, setIsSavingProgress] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<SimulatorDetailedService | null>(null);
    const [isUpgradePromptOpen, setIsUpgradePromptOpen] = useState(false);
    const [hasSeenUpgradePrompt, setHasSeenUpgradePrompt] = useState(false);
    const [generatedPresupuestoId, setGeneratedPresupuestoId] = useState<string | null>(null);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [commercialTimerEndsAt, setCommercialTimerEndsAt] = useState<number | null>(null);
    const [commercialTimerSeconds, setCommercialTimerSeconds] = useState(COMMERCIAL_TIMER_SECONDS);

    const [existingBudgets, setExistingBudgets] = useState<any[]>([]);
    const [isSearchingBudgets, setIsSearchingBudgets] = useState(false);

    const [formData, setFormData] = useState<{serviciosSeleccionados: Map<string, ServicioSeleccionadoValue>}>({serviciosSeleccionados: new Map()});
    const submissionIdRef = useRef(
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `visual_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    );

    const maxEntradas = useMemo(() => (duracionHoras > 4 ? 2 : 1), [duracionHoras]);

    useEffect(() => {
        const handleOpenFaq = () => setIsFaqOpen(true);
        window.addEventListener('ak-open-faq', handleOpenFaq);
        return () => window.removeEventListener('ak-open-faq', handleOpenFaq);
    }, []);

    // La sugerencia de paquete superior solo aparece mientras el visitante sigue
    // revisando el paso 5. Si ya avanzo a generar su presupuesto, el temporizador
    // se cancela para que el modal nunca tape el resultado final.
    useEffect(() => {
        if (step !== 5) {
            setIsUpgradePromptOpen(false);
            return;
        }
        if (hasSeenUpgradePrompt) return;
        const timer = setTimeout(() => {
            setIsUpgradePromptOpen(true);
            setHasSeenUpgradePrompt(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [step, hasSeenUpgradePrompt]);

    useEffect(() => {
        const stored = Number(window.sessionStorage.getItem(COMMERCIAL_TIMER_STORAGE_KEY));
        if (Number.isFinite(stored) && stored > Date.now()) {
            setCommercialTimerEndsAt(stored);
            setCommercialTimerSeconds(Math.max(0, Math.ceil((stored - Date.now()) / 1000)));
        }
    }, []);

    useEffect(() => {
        if (!commercialTimerEndsAt) return;
        const updateTimer = () => {
            setCommercialTimerSeconds(Math.max(0, Math.ceil((commercialTimerEndsAt - Date.now()) / 1000)));
        };
        updateTimer();
        const interval = window.setInterval(updateTimer, 1000);
        return () => window.clearInterval(interval);
    }, [commercialTimerEndsAt]);

    const startCommercialTimer = useCallback(() => {
        if (commercialTimerEndsAt && commercialTimerEndsAt > Date.now()) return;
        const expiresAt = Date.now() + COMMERCIAL_TIMER_SECONDS * 1000;
        window.sessionStorage.setItem(COMMERCIAL_TIMER_STORAGE_KEY, String(expiresAt));
        setCommercialTimerEndsAt(expiresAt);
        setCommercialTimerSeconds(COMMERCIAL_TIMER_SECONDS);
    }, [commercialTimerEndsAt]);

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
        return [];
    }, []);

    const clubUruguayDetails = useMemo(() => {
        const club = config?.clubUruguayConfig;
        if (salonChoice !== 'club') return null;
        const precioReal = 36000;
        const precioBasePromo = 16900;
        
        const eventYear = eventoFecha ? new Date(eventoFecha).getFullYear() : 2026;
        const diffYears = Math.max(0, eventYear - 2026);
        const adjustmentPct = DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE || 15;
        const multiplier = 1 + (diffYears * (adjustmentPct / 100));
        const costoFinal = Math.round(precioBasePromo * multiplier);

        return {
            nombre: 'Salón Club Uruguay',
            precioReal,
            precioPromo: precioBasePromo,
            costo: costoFinal,
            eventYear,
            diffYears,
            aclaracion: `El alquiler del Salón Club Uruguay (Precio Real: ${formatCurrency(precioReal)}, Precio Promo: ${formatCurrency(precioBasePromo)}${diffYears > 0 ? `, con ajuste ${eventYear}: ${formatCurrency(costoFinal)}` : ''}) NO se suma en el total de este presupuesto de AK Producciones. Se abona mediante contrato y recibo de alquiler independiente directamente en la administración del Club Uruguay.`,
        };
    }, [config?.clubUruguayConfig, salonChoice, eventoFecha]);

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

    const tierMissingData = useMemo(() => {
        if (!config || !allSimuladorServices.length || !selectedPaqueteId) {
            return { nextPackageName: '', targetPackageId: '', missingServices: [] };
        }
        return getTierMissingServices(config, selectedPaqueteId, allSimuladorServices);
    }, [config, selectedPaqueteId, allSimuladorServices]);

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
        const currentSelectedIds = new Set([
            ...Array.from(formData.serviciosSeleccionados.keys()),
            ...selectedEntradas,
            ...(selectedPrincipal ? [selectedPrincipal] : []),
            ...(selectedInfantil ? [selectedInfantil] : []),
        ]);
        return getPackageRecommendations({
            currentPackage,
            otherPackages: config.paquetes.filter(packageItem => packageItem.id !== selectedPaqueteId),
            services: serviciosCatalogo,
            selectedServiceIds: currentSelectedIds,
            visibleServiceIds: budgetSettings.serviciosAdicionalesVisibles?.length
                ? budgetSettings.serviciosAdicionalesVisibles
                : null,
            limit: 3,
        });
    }, [
        budgetSettings.serviciosAdicionalesVisibles,
        config,
        formData.serviciosSeleccionados,
        selectedEntradas,
        selectedInfantil,
        selectedPaqueteId,
        selectedPrincipal,
        serviciosCatalogo,
    ]);

    const selectPackage = (paqueteId: string) => {
        const currentPackage = config?.paquetes.find(packageItem => packageItem.id === selectedPaqueteId);
        const nextPackage = config?.paquetes.find(packageItem => packageItem.id === paqueteId);
        if (currentPackage?.id === nextPackage?.id) {
            return {
                nextPackage,
                nextManualServices: new Map(formData.serviciosSeleccionados),
                packageChange: {
                    selectedServiceIds: Array.from(formData.serviciosSeleccionados.keys()),
                    excludedPackageServiceIds,
                },
            };
        }
        const packageChange = getPackageChangeResult({
            currentPackage,
            nextPackage,
            selectedServiceIds: formData.serviciosSeleccionados.keys(),
        });
        const nextManualServices = new Map<string, ServicioSeleccionadoValue>();

        packageChange.selectedServiceIds.forEach((serviceId) => {
            const selected = formData.serviciosSeleccionados.get(serviceId);
            if (selected) nextManualServices.set(serviceId, selected);
        });

        setSelectedPaqueteId(paqueteId);
        setExcludedPackageServiceIds(packageChange.excludedPackageServiceIds);
        setFormData(previous => ({
            ...previous,
            serviciosSeleccionados: nextManualServices,
        }));

        return { nextPackage, nextManualServices, packageChange };
    };

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
            const persistence = captureSimulatorLeadProgress({
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
            let timeout: ReturnType<typeof setTimeout> | undefined;
            const result = await Promise.race([
                persistence,
                new Promise<{ success: true; deferred: true }>((resolve) => {
                    timeout = setTimeout(
                        () => resolve({ success: true, deferred: true }),
                        LEAD_PROGRESS_WAIT_MS,
                    );
                }),
            ]);
            if (timeout) clearTimeout(timeout);

            if ('deferred' in result) {
                void persistence
                    .then((lateResult) => {
                        if (!lateResult.success) {
                            console.warn('[simulador] El guardado diferido del prospecto no se completo.', lateResult.error);
                        }
                    })
                    .catch((error) => {
                        console.warn('[simulador] El guardado diferido del prospecto fallo.', error);
                    });
                return;
            }
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
            const errors: { nombre?: boolean; contacto?: boolean; adultos?: boolean; fecha?: boolean; salon?: boolean } = {};
            if (clienteNombre.trim().length < 2) errors.nombre = true;
            const cleanPhone = clienteContacto.replace(/\D/g, '');
            if (cleanPhone.length < 7) errors.contacto = true;
            if (adultos <= 0) errors.adultos = true;
            if (!eventoFecha) errors.fecha = true;
            if (!salonChoice) errors.salon = true;

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                const missingItems: string[] = [];
                if (errors.nombre) missingItems.push("tu nombre");
                if (errors.contacto) missingItems.push("un celular WhatsApp de contacto");
                if (errors.adultos) missingItems.push("la cantidad de adultos");
                if (errors.salon) missingItems.push("la opción de salón de fiestas");
                if (errors.fecha) missingItems.push("la fecha del evento");

                const descriptionText = missingItems.length === 1
                    ? `Te falta completar: ${missingItems[0]}.`
                    : `Te falta completar: ${missingItems.join(", ")}.`;

                toast({
                    title: "Faltan datos para continuar",
                    description: descriptionText,
                    variant: "destructive",
                });
                return;
            }
            setFieldErrors({});

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
            } catch (error: any) {
                console.warn("Save progress non-blocking fallback:", error);
            }
            setStep(3);
            return;
        }

        if (step === 3) {
            if (!selectedPrincipal && principalesDisponibles.length > 0) {
                setSelectedPrincipal(principalesDisponibles[0].id);
            }
            if (selectedEntradas.length === 0 && entradasDisponibles.length > 0) {
                setSelectedEntradas([entradasDisponibles[0].id]);
            }
            if (ninosYAdolescentes > 0 && !selectedInfantil && menusNinoDisponibles.length > 0) {
                setSelectedInfantil(menusNinoDisponibles[0].id);
            }
            setStep(4);
            return;
        }

        if (step === 4) {
            if (!selectedPaqueteId && sortedPaquetes.length > 0) {
                const recommended = sortedPaquetes.find(p => p.recommended) || sortedPaquetes[0];
                if (recommended) selectPackage(recommended.id);
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
                    startCommercialTimer();
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
        if (!generatedPresupuestoId || isDownloadingPdf) return;
        setIsDownloadingPdf(true);
        try {
            const publicUrl = `${window.location.origin}/presupuestos/${generatedPresupuestoId}/ver?cliente=1&token=${generatedToken || ''}`;
            const packageName = config?.paquetes.find(packageItem => packageItem.id === selectedPaqueteId)?.nombre;
            await downloadSimulatorBudgetPdf({
                documentId: generatedPresupuestoId,
                publicUrl,
                clientName: clienteNombre,
                eventType: eventoTipo,
                eventDate: eventoFecha,
                adults: adultos,
                childrenAndTeens: ninosYAdolescentes,
                packageName,
                items: stats.detallados,
                salonDetails: clubUruguayDetails || undefined,
                stats,
                bookingTerms: budgetSettings.bookingTerms,
            });
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
        const { nextPackage: newPackage, nextManualServices } = selectPackage(paqueteId);
        const newPackageName = newPackage?.nombre;

        // Calculate new pricing stats
        const newStats = calculateSimulatorPricing({
            config,
            services: allSimuladorServices,
            adultos,
            ninosYAdolescentes,
            selectedPaqueteId: paqueteId,
            excludedPackageServiceIds: [],
            selectedServices: Array.from(nextManualServices.entries()).map(([id, data]) => ({
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
            selectedServiceIds: Array.from(nextManualServices.keys()),
            excludedPackageServiceIds: [],
            paqueteId,
            paqueteNombre: newPackageName ? `${newPackageName} — ${eventoTipo}` : undefined,
            includeClubUruguay: salonChoice === 'club',
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
                                data-testid="simulator-cover-start"
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

                             {/* Non-invasive Auto-Save & Contact Banner */}
                             <div className="w-full max-w-2xl mx-auto rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                                 <div className="flex items-center gap-3.5">
                                     <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 shrink-0 shadow-inner">
                                         <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                     </div>
                                     <div>
                                         <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                                             ✅ Presupuesto registrado con éxito
                                         </h4>
                                         <p className="text-xs text-slate-300 font-semibold mt-0.5">
                                             Guardá tu copia oficial en PDF o hablá directo con AK por WhatsApp para congelar la tarifa.
                                         </p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                     <Button
                                         type="button"
                                         onClick={handleDownloadBudgetPdf}
                                         disabled={isDownloadingPdf}
                                         className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs gap-2 border border-slate-700 shadow-md transition"
                                     >
                                         {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-amber-400" />}
                                         <span>Guardar PDF</span>
                                     </Button>
                                     <Button
                                         type="button"
                                         onClick={handleShareBudgetWhatsApp}
                                         className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-xs gap-2 shadow-lg transition transform hover:scale-105"
                                     >
                                         <MessageSquare className="w-4 h-4" />
                                         <span>WhatsApp AK</span>
                                     </Button>
                                 </div>
                             </div>

                            <div className="mx-auto w-full max-w-lg space-y-4 rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-50 via-white to-amber-50 p-6 text-left shadow-lg relative overflow-hidden animate-pulse">
                                <div className="flex items-center justify-between border-b border-red-200 pb-3">
                                    <h3 className="text-xs font-black uppercase text-red-700 flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-red-600 animate-spin" />
                                        Asegurá tu promoción antes de que termine el tiempo
                                    </h3>
                                    <span className="rounded-xl bg-red-700 px-3 py-1 font-mono text-sm font-black text-white shadow-md">
                                        {commercialTimerSeconds > 0 ? formatCountdown(commercialTimerSeconds) : '15:00'}
                                    </span>
                                </div>
                                <div className="space-y-2 text-xs leading-relaxed text-slate-700">
                                    <p className="font-bold text-slate-900">
                                        ⏳ Aprovechá estos <strong>15 minutos</strong> para mantener la promoción y los descuentos incluidos en tu presupuesto.
                                    </p>
                                    <p className="text-slate-600">
                                        Coordiná una entrevista sin costo con AK Producciones, contanos cómo imaginás tu fiesta y recibí asesoramiento para elegir la fecha, los servicios y la mejor opción para tu presupuesto.
                                    </p>
                                    <p className="font-black text-red-700">
                                        📲 Comunicate ahora y empezá a organizar tu fiesta completa con todo resuelto en un solo lugar.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleShareBudgetWhatsApp}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-700 text-sm font-black uppercase tracking-wider text-white shadow-md hover:bg-red-800 transition"
                                >
                                    <MessageSquare className="h-4 w-4" /> Consultar disponibilidad por WhatsApp
                                </Button>
                            </div>

                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <Button
                                    onClick={handleShareBudgetWhatsApp}
                                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 shadow-md"
                                >
                                    <Share2 className="w-4 h-4 shrink-0"/> <span className="truncate">Compartir WhatsApp</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleWhatsAppQuickConsult}
                                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                    <MessageSquare className="w-4 h-4 shrink-0"/> <span className="truncate">Coordinar Reunión</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleDownloadBudgetPdf}
                                  disabled={isDownloadingPdf}
                                  className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-slate-300 px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-sm"
                                >
                                    {isDownloadingPdf
                                        ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                        : <FileDown className="h-4 w-4 shrink-0" />}
                                    <span className="truncate">Descargar PDF</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsFaqOpen(true)}
                                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 hover:bg-red-100 shadow-sm"
                                >
                                    <HelpCircle className="w-4 h-4 shrink-0 text-red-600"/> <span className="truncate">Preguntas Frecuentes</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm print:bg-white print:shadow-none">
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
                            <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600"/>
                                    Reservá tu fecha y asegurá la promoción
                                </h4>
                                <div className="space-y-2 text-xs font-semibold leading-relaxed text-slate-700 text-left">
                                    <p>Confirmá tu evento con una seña de solo $5.000 y la firma del contrato. La fecha se reserva para la primera persona que complete ambos pasos.</p>
                                    <p>El presupuesto tiene una validez de 30 días, manteniendo durante ese período el precio promocional y todos los regalos incluidos.</p>
                                    <p>Los valores corresponden a eventos realizados en 2026. Para fechas desde 2027 se aplicará un ajuste acumulativo del 15% por cada año adicional.</p>
                                    <p className="font-bold text-slate-900 pt-1">No dejes pasar tu fecha: firmá el contrato, aboná la seña y empezá a preparar tu fiesta con AK Producciones.</p>
                                </div>
                                {budgetSettings.bookingTerms && (
                                    <p className="mt-3 text-xs leading-relaxed text-slate-500 border-t pt-2">{budgetSettings.bookingTerms}</p>
                                )}
                            </div>
                            <div data-pdf-exclude="true" className="flex flex-col sm:flex-row items-center gap-3 print:hidden">
                              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-md text-xs font-bold text-slate-500">Iniciar nueva simulación</Button>
                              <Button
                                type="button"
                                onClick={() => setIsFaqOpen(true)}
                                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-red-600 to-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-md hover:from-red-700 hover:to-amber-700 transition-all transform hover:scale-105"
                              >
                                <Info className="w-4 h-4" /> Preguntas Frecuentes
                              </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="ak-public-page flex min-h-screen flex-col items-center justify-center gap-4 p-2 sm:p-6 lg:p-8">
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
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto py-2 text-left">
                            {/* Hero PRO Card with Nano Banana Image & Neurosales Headline */}
                            <div className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 text-white shadow-2xl">
                                <div className="relative min-h-[340px] sm:min-h-[420px] w-full overflow-hidden flex flex-col justify-end p-6 sm:p-10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/media/catalogo-servicios/simulador_hero_pro.jpg"
                                        alt="AK Producciones - Tu evento soñado en Salto"
                                        className="absolute inset-0 h-full w-full object-cover object-center opacity-50 scale-105 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/20" />
                                    
                                    <div className="relative z-10 space-y-4">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-300 backdrop-blur-md">
                                            <Sparkles className="h-4 w-4 text-amber-400" />
                                            Presupuesto Transparente · AK Producciones Salto
                                        </div>
                                        
                                        <h1 className="font-headline text-2xl sm:text-4xl font-black leading-tight text-white tracking-tight">
                                            Diseñá tu fiesta inolvidable en Salto sin estrés, con costo real y garantía absoluta
                                        </h1>
                                        
                                        <p className="text-xs sm:text-base font-semibold text-slate-200 leading-relaxed max-w-2xl">
                                            Olvidate de contratar 10 proveedores distintos y sufrir sorpresas a último momento. Con AK Producciones tenés gastronomía propia, discoteca VIP, luces robotizadas, salón emblemático y tecnología interactiva coordinados por un único equipo responsable.
                                        </p>

                                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => setStep(2)}
                                                data-testid="simulator-first-step-cta"
                                                className="h-14 px-8 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                <span>Cotizar Mi Fiesta en 2 Minutos</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </Button>
                                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 justify-center">
                                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                                Sin compromiso · Guardado automático
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Neuro-Differentiators Grid */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Lo que nos diferencia y te garantiza tranquilidad total
                                    </h3>
                                    <span className="text-xs font-bold text-slate-500 hidden sm:inline-block">Garantía In-House AK</span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700 font-black">
                                                <PartyPopper className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm">Un Solo Equipo, Cero Estrés</h4>
                                                <p className="text-[11px] font-bold text-indigo-700">Producción 100% propia in-house</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 font-semibold leading-relaxed pt-1">
                                            El día de tu fiesta tu única tarea es disfrutar. Gastronomía, discoteca, luces robotizadas, ambientación y coordinación técnica corren por cuenta del mismo equipo.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-amber-300 hover:shadow-md transition space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800 font-black">
                                                <UtensilsCrossed className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm">Gastronomía Exquisita & Abundante</h4>
                                                <p className="text-[11px] font-bold text-amber-700">Calidad y cantidad garantizadas</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 font-semibold leading-relaxed pt-1">
                                            Recepción completa, plato principal caliente, mesa buffet, postres de autor y trasnoche servidos con la máxima exigencia para que nadie se quede con hambre ni dudas.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-purple-300 hover:shadow-md transition space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700 font-black">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm">Experiencia VIP & Tecnología Única</h4>
                                                <p className="text-[11px] font-bold text-purple-600">Muro Social & Pase QR Individual</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 font-semibold leading-relaxed pt-1">
                                            Hacé que tu evento sea inolvidable: Muro Social interactivo en pantalla gigante donde tus invitados suben fotos en vivo, pases QR en celular, fotocabinas y Portal del Cliente.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800 font-black">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm">Transparencia & Ajustes Informados</h4>
                                                <p className="text-[11px] font-bold text-emerald-600">Sin letras chicas ni cargos sorpresa</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 font-semibold leading-relaxed pt-1">
                                            Ves el precio vigente, la proyección anual para la fecha elegida y las condiciones de seña que se confirman en el contrato.
                                        </p>
                                    </div>
                                </div>

                                {/* Exclusive Club Uruguay Banner */}
                                <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400 text-slate-950 font-black shrink-0 shadow-md">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-sm">Locación Emblemática: Salón Club Uruguay 50% OFF</h4>
                                            <p className="text-xs text-slate-600 font-semibold">Al contratar la producción integral de tu fiesta con AK, accedés al salón más prestigioso y céntrico de Salto con bonificación exclusiva del 50%.</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="h-12 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shrink-0 transition shadow-md"
                                    >
                                        Cotizar Ahora →
                                    </Button>
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
                                    <Input id="simulator-name" value={clienteNombre} onChange={e => { setClienteNombre(e.target.value); setFieldErrors(prev => ({ ...prev, nombre: false })); }} placeholder="Ej: Ana García" className={cn("h-12 rounded-md bg-white text-slate-900", fieldErrors.nombre && "border-red-500 focus-visible:ring-red-500")} />
                                    {fieldErrors.nombre && <p className="text-xs font-bold text-red-600 mt-1">⚠️ Ingresá tu nombre completo para continuar.</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="simulator-phone">WhatsApp</Label>
                                    <Input id="simulator-phone" type="tel" value={clienteContacto} onChange={e => { setClienteContacto(e.target.value); setFieldErrors(prev => ({ ...prev, contacto: false })); }} placeholder="099 123 456 o +598 99 123 456" className={cn("h-12 rounded-md bg-white text-slate-900", fieldErrors.contacto && "border-red-500 focus-visible:ring-red-500")} />
                                    {fieldErrors.contacto ? (
                                        <p className="text-xs font-bold text-red-600 mt-1">⚠️ Ingresá un WhatsApp uruguayo válido (Ej: 099 123 456).</p>
                                    ) : (
                                        <p className="text-[10px] text-slate-500 font-semibold">Acepta número uruguayo con espacios, guiones o prefijo +598.</p>
                                    )}
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
                                        <Input type="number" min={1} value={adultos} onChange={e => { setAdultos(Math.max(0, Number(e.target.value))); setFieldErrors(prev => ({ ...prev, adultos: false })); }} className={cn("h-12 rounded-md bg-white text-slate-900", fieldErrors.adultos && "border-red-500 focus-visible:ring-red-500")} />
                                        {fieldErrors.adultos && <p className="text-xs font-bold text-red-600 mt-1">⚠️ Indicá al menos 1 adulto.</p>}
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
                                    <button type="button" onClick={() => { setSalonChoice('propio'); setFieldErrors(prev => ({ ...prev, salon: false })); }} className={cn('rounded-2xl border p-5 text-left transition flex flex-col h-32 justify-between', salonChoice === 'propio' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300', fieldErrors.salon && "border-red-500 bg-red-50/50")}>
                                        <MapPin className="h-6 w-6 text-primary" />
                                        <div>
                                            <p className="text-sm font-black text-slate-900">Tengo salón o locación propia</p>
                                            <p className="mt-1 text-xs text-slate-400 font-semibold">No se adiciona costo por locación.</p>
                                        </div>
                                    </button>
                                    <button type="button" onClick={() => { setSalonChoice('club'); setFieldErrors(prev => ({ ...prev, salon: false })); }} disabled={!config?.clubUruguayConfig?.activo} className={cn('rounded-2xl border p-5 text-left disabled:opacity-50 transition flex flex-col h-32 justify-between relative', salonChoice === 'club' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300', fieldErrors.salon && "border-red-500 bg-red-50/50")}>
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
                                {fieldErrors.salon && <p className="text-xs font-bold text-red-600 mt-1">⚠️ Seleccioná tu opción de salón de fiestas.</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Fecha del evento</Label>
                                <DatePickerDemo selectedDate={eventoFecha} onDateChange={(date) => { handleEventoFechaChange(date); setFieldErrors(prev => ({ ...prev, fecha: false })); }} className={cn("h-12 rounded-xl bg-white text-slate-900 border-slate-200", fieldErrors.fecha && "border-red-500 focus-visible:ring-red-500")} />
                                {fieldErrors.fecha && <p className="text-xs font-bold text-red-600 mt-1">⚠️ Seleccioná la fecha prevista para tu evento.</p>}
                                {dateWarning && (
                                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                                        <p className="text-sm font-bold text-amber-900">{dateWarning}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {dateSuggestions.map(date => (
                                                <button key={date} type="button" className="rounded-md bg-white px-3 py-2 text-xs font-bold text-amber-900 shadow-sm border" onClick={() => { handleEventoFechaChange(new Date(`${date}T12:00:00`)); setFieldErrors(prev => ({ ...prev, fecha: false })); }}>
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
                                                 isRecommended && !selectedEntradas.includes(s.id) && "border-amber-400 bg-amber-50/40 shadow-md"
                                            )}>
                                                {isRecommended && (
                                                     <div className="absolute -top-3.5 left-4 z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-200 animate-pulse">
                                                         <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" /> ⭐ RECOMENDADO PRO
                                                     </div>
                                                )}
                                                {imageUrl && (
                                                  <div className="h-20 w-24 rounded-2xl overflow-hidden border bg-white shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageUrl} alt={s.nombre} className="h-full w-full object-cover" />
                                                  </div>
                                                )}
                                                <Checkbox checked={selectedEntradas.includes(s.id)} onCheckedChange={v => handleEntradaChange(s.id, !!v)} className="h-6 w-6 rounded-lg"/>
                                                <div className="flex flex-col flex-grow min-w-0">
                                                    <span className={cn("text-sm font-black uppercase tracking-tight truncate", isRecommended ? "text-amber-950 font-black" : "text-slate-700")}>{s.nombre}</span>
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
                                                 isRecommended && selectedPrincipal !== s.id && "border-amber-400 bg-amber-50/40 shadow-md"
                                            )}>
                                                {isRecommended && (
                                                     <div className="absolute -top-3.5 left-4 z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-200 animate-pulse">
                                                         <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" /> ⭐ RECOMENDADO PRO
                                                     </div>
                                                )}
                                                {imageUrl && (
                                                  <div className="h-20 w-24 rounded-2xl overflow-hidden border bg-white shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageUrl} alt={s.nombre} className="h-full w-full object-cover" />
                                                  </div>
                                                )}
                                                <RadioGroupItem value={s.id} className="h-6 w-6"/>
                                                <div className="flex flex-col flex-grow min-w-0">
                                                    <span className={cn("text-sm font-black uppercase tracking-tight truncate", isRecommended ? "text-amber-950 font-black" : "text-slate-700")}>{s.nombre}</span>
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
                                                     isRecommended && selectedInfantil !== s.id && "border-amber-400 bg-amber-50/40 shadow-md"
                                                )}>
                                                    {isRecommended && (
                                                         <div className="absolute -top-3.5 left-4 z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-200 animate-pulse">
                                                             <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" /> ⭐ RECOMENDADO PRO
                                                         </div>
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
                                    selectPackage(value);
                                    setExpandedPackageId(null);
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
                                    const estimatedPricePerPerson = estimatedTotal / Math.max(1, adultos + ninosYAdolescentes);
                                    const includedServices = sortedIncluded
                                        .map(serviceItem => ({
                                            serviceItem,
                                            service: allSimuladorServices.find(candidate => candidate.id === serviceItem.id),
                                        }))
                                        .filter((item): item is { serviceItem: typeof sortedIncluded[number]; service: ServicioEmpresa } => Boolean(item.service));
                                    const giftCount = includedServices.filter(item => item.serviceItem.esRegalo).length;
                                    const isExpanded = expandedPackageId === p.id;
                                    const visibleIncluded = isExpanded ? includedServices : includedServices.slice(0, 3);

                                    return (
                                        <label key={p.id} className={cn(
                                            "relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl border p-6 transition-all duration-300 sm:p-8",
                                            selectedPaqueteId === p.id ? "border-2 border-red-600 bg-red-50/90 shadow-xl" : "border-slate-200 bg-white hover:border-slate-400",
                                            p.recommended && selectedPaqueteId !== p.id && "border-2 border-amber-400 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white shadow-xl shadow-amber-500/20"
                                        )}>
                                            {p.recommended && (
                                                <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/40 border border-amber-200 animate-pulse">
                                                    <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" /> ⭐ RECOMENDADO PRO · MÁS ELEGIDO
                                                </div>
                                            )}
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-black uppercase tracking-tight text-xl text-slate-800 leading-none">{p.nombre}</p>
                                                    <p className="text-sm font-black text-primary">{formatCurrency(estimatedTotal)} <span className="text-[8px] uppercase tracking-widest text-slate-400 ml-1">Presupuesto Estimado</span></p>
                                                    <p className="text-[10px] font-bold text-slate-500">{formatCurrency(estimatedPricePerPerson)} por persona</p>
                                                </div>
                                                <RadioGroupItem value={p.id} className="h-6 w-6"/>
                                            </div>

                                            <div className="space-y-3 border-t border-slate-200 pt-4">
                                                <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-600">
                                                    <span>{includedServices.length} servicios{giftCount > 0 ? ` · ${giftCount} regalo${giftCount === 1 ? '' : 's'}` : ''}</span>
                                                    {includedServices.length > 3 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                setExpandedPackageId(current => current === p.id ? null : p.id);
                                                            }}
                                                            className="h-8 gap-1 px-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                                                        >
                                                            {isExpanded ? 'Ver resumen' : 'Ver todo'}
                                                            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                                                        </Button>
                                                    )}
                                                </div>
                                                <ul className="space-y-2 text-[10px] font-bold uppercase tracking-tight text-slate-600">
                                                    {visibleIncluded.map(({ serviceItem, service }) => (
                                                            <li key={serviceItem.id} className={cn(
                                                                "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                                                                serviceItem.esRegalo
                                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                                    : "border-slate-200 bg-slate-50 text-slate-700"
                                                            )}>
                                                                <div className="flex min-w-0 items-center gap-2">
                                                                    {serviceItem.esRegalo
                                                                        ? <Gift className="h-3.5 w-3.5 shrink-0"/>
                                                                        : <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700"/>}
                                                                    <span className="whitespace-normal">{service.nombre}</span>
                                                                </div>
                                                                {serviceItem.esRegalo && (
                                                                    <Badge className="h-5 shrink-0 border-none bg-emerald-700 px-2 text-[8px] font-black text-white">
                                                                        REGALO
                                                                    </Badge>
                                                                )}
                                                            </li>
                                                        ))}
                                                </ul>
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

                            {salonChoice === 'club' && clubUruguayDetails && (
                                <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-6 text-left shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white font-black text-xl shadow-sm">
                                                🏛️
                                            </span>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-base">{clubUruguayDetails.nombre}</h3>
                                                <p className="text-xs font-bold text-amber-900 mt-0.5">Contrato y recibo de alquiler independiente directo con el Club Uruguay</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-xs text-amber-800/60 line-through font-bold">{formatCurrency(clubUruguayDetails.precioReal)}</span>
                                                <Badge className="bg-amber-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm">
                                                    Promo: {formatCurrency(clubUruguayDetails.precioPromo)}
                                                </Badge>
                                            </div>
                                            {clubUruguayDetails.diffYears > 0 && (
                                                <p className="text-[10px] font-black text-amber-900 mt-1 uppercase">
                                                    Con ajuste {clubUruguayDetails.eventYear} (+{clubUruguayDetails.diffYears * 15}%): {formatCurrency(clubUruguayDetails.costo)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs font-semibold leading-relaxed text-amber-950 border-t border-amber-200/80 pt-3">
                                        {clubUruguayDetails.aclaracion}
                                    </p>
                                </div>
                            )}

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
                                        <Search className="w-[18px] h-[18px] text-slate-500"/> Personalizá tu fiesta con más servicios
                                    </h4>

                                    {tierMissingData.missingServices.length > 0 && (
                                        <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-r from-red-800 via-red-700 to-rose-800 p-6 text-white shadow-2xl space-y-4 text-left animate-in fade-in duration-300">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400 text-slate-950 font-black shrink-0 shadow-lg">
                                                        <Zap className="w-6 h-6 text-slate-950 fill-slate-950 animate-bounce" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black uppercase tracking-wide text-amber-300 flex items-center gap-2">
                                                            🔥 ¡Subí tu evento al Plan {tierMissingData.nextPackageName}!
                                                        </h4>
                                                        <p className="text-xs text-white/90 font-semibold mt-0.5">
                                                            Llevá tu fiesta al siguiente nivel. Agregá estos servicios clave incluidos en el paquete {tierMissingData.nextPackageName} y asegurá una experiencia inolvidable para todos tus invitados:
                                                        </p>
                                                    </div>
                                                </div>
                                                {tierMissingData.targetPackageId && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleSwitchPackage(tierMissingData.targetPackageId)}
                                                        className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl transition-all transform hover:scale-105 active:scale-95 shrink-0"
                                                    >
                                                        ⚡ Pasarme al Plan {tierMissingData.nextPackageName}
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {tierMissingData.missingServices.map(service => {
                                                    const isSelected = stats.detallados.some(s => s.id === service.id);
                                                    const calculated = getSimulatorServiceCalculatedData(service, adultos, ninosYAdolescentes);
                                                    return (
                                                        <div
                                                            key={service.id}
                                                            className={cn(
                                                                "flex items-center justify-between gap-3 rounded-2xl p-4 transition-all border",
                                                                isSelected ? "bg-emerald-500/25 border-emerald-400 text-white shadow-lg" : "bg-black/30 border-white/20 text-white hover:bg-black/40 hover:border-amber-300/50"
                                                            )}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <span className="block font-black text-xs text-white truncate">{service.nombre}</span>
                                                                <span className="block text-[10px] text-amber-300 font-black mt-0.5">+{formatCurrency(calculated.total)}</span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => handleToggleServiceInBudget(service.id, isSelected ? 'exclude' : 'include')}
                                                                className={cn(
                                                                    "h-9 px-4 text-xs font-black rounded-xl transition shadow-md shrink-0",
                                                                    isSelected ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950" : "bg-amber-400 hover:bg-amber-300 text-slate-950"
                                                                )}
                                                            >
                                                                {isSelected ? 'Agregado ✓' : 'Sumar +'}
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
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
                                                    onClick={() => void handleSwitchPackage(p.id)}
                                                    disabled={isGenerating}
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
                            
                            <div className="pt-2 flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsFaqOpen(true)}
                                    className="rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-950 font-black text-xs uppercase tracking-widest px-6 py-3 shadow-md transition-all hover:scale-105"
                                >
                                    <HelpCircle className="w-4 h-4 mr-2 text-indigo-600 animate-pulse" />
                                    Ver Preguntas Frecuentes (FAQ)
                                </Button>
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

            <Dialog open={isFaqOpen} onOpenChange={setIsFaqOpen}>
                <DialogContent className="max-w-xl rounded-2xl bg-white p-6 sm:p-8 text-left shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-900">
                            <Info className="h-6 w-6 text-red-600" /> Preguntas Frecuentes
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 font-semibold">
                            Respuestas claras a las consultas habituales sobre la reserva y vigencia de tu evento.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="font-black text-sm text-slate-900">1. ¿Cómo solicito la reserva de mi fecha?</h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600 font-semibold">
                                Con una seña de $5.000 podés solicitar la reserva de la fecha y de todos los servicios incluidos. La reserva queda confirmada únicamente cuando AK valida la fecha, antes de registrar el pago definitivo.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="font-black text-sm text-slate-900">2. ¿Cuánto tiempo dura la validez del presupuesto?</h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600 font-semibold">
                                El presupuesto es válido por 30 días para mantener el precio de la promoción y los regalos incluidos en tu propuesta.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="font-black text-sm text-slate-900">3. ¿Cómo funciona la locación del Salón Club Uruguay?</h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600 font-semibold">
                                El costo del alquiler del Salón Club Uruguay no se incluye en la suma de este presupuesto porque se abona mediante un contrato y recibo de alquiler independiente directamente en la administración del Club Uruguay.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="font-black text-sm text-slate-900">4. ¿Cómo aplica el ajuste para eventos en 2027 o 2028?</h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600 font-semibold">
                                El total mostrado corresponde al precio promocional vigente del año 2026. Para eventos en años posteriores (2027 en adelante), se aplica un ajuste del 15% por cada año adicional transcurrido.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="font-black text-sm text-slate-900">5. ¿Puedo modificar menús o agregar adicionales después?</h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600 font-semibold">
                                ¡Sí! Podés personalizar menús, tecnología y opcionales hasta 30 días antes del evento.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => setIsFaqOpen(false)}
                            className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs uppercase tracking-wider h-11 px-6 shadow-md transition"
                        >
                            ← Volver a mi Presupuesto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dynamic Package-Specific Upgrade Prompt Modal */}
            <Dialog open={isUpgradePromptOpen} onOpenChange={setIsUpgradePromptOpen}>
                <DialogContent className="max-w-md rounded-3xl bg-slate-950 text-white p-6 border-2 border-amber-400 shadow-2xl">
                    <DialogHeader className="text-left space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/20 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300 backdrop-blur-md">
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                            ⚡ UPGRADE PARA TU {config?.paquetes?.find(p => p.id === selectedPaqueteId)?.nombre || 'PAQUETE ELEGIDO'}
                        </div>
                        <DialogTitle className="text-xl font-black text-white leading-tight">
                            {tierMissingData.missingServices.length > 0
                                ? `¿Querés sumar los extras del Plan ${tierMissingData.nextPackageName}?`
                                : `🌟 ¡Elegiste la propuesta más completa para tu fiesta!`}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-semibold text-slate-300 leading-relaxed">
                            {tierMissingData.missingServices.length > 0
                                ? `El Plan ${tierMissingData.nextPackageName} incluye servicios clave para potenciar la ambientación y diversión de tus invitados.`
                                : `Tenés la cobertura más avanzada de AK Producciones. Podés descargar tu presupuesto oficial en PDF o coordinar con nuestro equipo por WhatsApp.`}
                        </DialogDescription>
                    </DialogHeader>

                    {tierMissingData.missingServices.length > 0 && (
                        <div className="my-3 space-y-2 text-left">
                            {tierMissingData.missingServices.slice(0, 2).map(service => {
                                const calculated = getSimulatorServiceCalculatedData(service, adultos, ninosYAdolescentes);
                                return (
                                    <div key={service.id} className="p-3.5 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent flex items-center justify-between text-xs">
                                        <div className="min-w-0 flex-1 pr-2">
                                            <span className="font-black text-white block text-xs truncate">{service.nombre}</span>
                                            <span className="text-[10px] text-amber-300 font-bold">+{formatCurrency(calculated.total)}</span>
                                        </div>
                                        <Badge className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase shrink-0">Incluido en {tierMissingData.nextPackageName}</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
                        {tierMissingData.targetPackageId ? (
                            <Button
                                type="button"
                                onClick={() => {
                                    handleSwitchPackage(tierMissingData.targetPackageId!);
                                    setIsUpgradePromptOpen(false);
                                    toast({
                                        title: `Actualizado a Plan ${tierMissingData.nextPackageName}`,
                                        description: "Se incluyeron todos los servicios adicionales del paquete superior.",
                                    });
                                }}
                                className="w-full h-12 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition transform hover:scale-105"
                            >
                                ⚡ Pasarme al Plan {tierMissingData.nextPackageName} con 1-Click
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={() => setIsUpgradePromptOpen(false)}
                                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl"
                            >
                                Ver Presupuesto Completo →
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsUpgradePromptOpen(false)}
                            className="w-full text-slate-400 hover:text-white font-bold text-xs"
                        >
                            Mantener mi selección actual
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sticky Mobile Conversion Bar — Step 6 (budget generated) */}
            {step === 6 && generatedPresupuestoId && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-slate-950/95 border-t-2 border-amber-400/40 backdrop-blur-xl shadow-2xl lg:hidden animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest truncate">✅ Presupuesto listo</p>
                            <p className="text-xs font-black text-white truncate">{formatCurrency(stats.totalFinal)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDownloadBudgetPdf}
                                disabled={isDownloadingPdf}
                                className="h-11 px-3.5 rounded-xl border-slate-700 bg-slate-900 text-white font-black text-xs gap-1.5 shadow-md"
                            >
                                {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-amber-400" />}
                                <span>PDF</span>
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleShareBudgetWhatsApp}
                                className="h-11 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-xs gap-1.5 shadow-lg"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span>WhatsApp</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Mobile Total Bar — Step 5 (reviewing budget) */}
            {step === 5 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl shadow-2xl lg:hidden animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest truncate">📋 Tu presupuesto actual</p>
                            <p className="text-xs font-black text-white truncate">{formatCurrency(stats.totalFinal)} · {formatCurrency(stats.precioPorPersona)} p/p</p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => handleNext()}
                            disabled={isGenerating}
                            className="h-11 px-5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-xs gap-1.5 shadow-lg shrink-0"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            <span>Generar</span>
                        </Button>
                    </div>
                </div>
            )}
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
