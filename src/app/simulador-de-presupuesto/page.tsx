
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    ArrowLeft, ArrowRight, Wand2, Loader2, PartyPopper, Users, 
    Save, Clock, CalendarDays, Search, Check, Info, TrendingUp, 
    Share2, Printer, Gift, ListPlus, ShieldCheck, Zap, Star, Percent,
    ChevronDown,
    UserMinus,
    X,
    MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateBudgetAndLeadFromSimulator } from '@/app/actions/armado-rapido';
import { checkDateAvailability } from '@/app/actions/simulador-v2';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getSocialConnections } from '@/app/actions/social-connections';
import { getInvoiceTemplateSettings, getBudgetDisplaySettings } from '@/app/actions/settings';
import type { SocialConnection, BudgetDisplaySettings } from '@/types/settings';
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
import { getMenus } from '@/app/actions/menus-catering';
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
  simulatorDetailsToBudgetItems,
} from '@/lib/simulator/pricing';

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

const DURATION_OPTIONS = [
    { value: 3, title: 'Menos de 4 horas', subtitle: 'Fiesta chica', detail: '1 entrada habilitada' },
    { value: 5, title: 'Mas de 4 horas', subtitle: 'Fiesta grande', detail: '2 entradas habilitadas' },
] as const;

const menuItemToServicioEmpresa = (item: MenuItem & { precioVenta: number }): ServicioEmpresa => {
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
        imageUrl: getCateringDishImage(item),
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
function SimuladorContent() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const currentYear = new Date().getFullYear();

    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [budgetSettings, setBudgetSettings] = useState<BudgetDisplaySettings>(defaultBudgetDisplaySettings);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
    const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
    const [whatsappNumber, setWhatsappNumber] = useState<string>('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteContacto, setClienteContacto] = useState('');
    const [eventoTipo, setEventoTipo] = useState('Cumpleaños');
    const [adultos, setAdultos] = useState<number>(50);
    const [ninosYAdolescentes, setNinosYAdolescentes] = useState<number>(0);
    const [duracionHoras, setDuracionHoras] = useState<number>(5);
    const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
    const [selectedEntradas, setSelectedEntradas] = useState<string[]>([]);
    const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');
    const [selectedInfantil, setSelectedInfantil] = useState<string>('');
    const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
    const [dateSuggestions, setDateSuggestions] = useState<string[]>([]);
    const [dateWarning, setDateWarning] = useState('');
    
    const [gastronomiaSearchTerm, setGastronomiaSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPresupuestoId, setGeneratedPresupuestoId] = useState<string | null>(null);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);

    const [formData, setFormData] = useState<{serviciosSeleccionados: Map<string, ServicioSeleccionadoValue>}>({serviciosSeleccionados: new Map()});
    
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
            setIsLoading(true);
            try {
                const [armadoConfig, bSettings, serviciosData, socialConnections, templateSettings, menuData] = await Promise.all([
                    getArmadoRapidoConfig(),
                    getBudgetDisplaySettings(),
                    getServiciosEmpresa(),
                    getSocialConnections(),
                    getInvoiceTemplateSettings(),
                    getMenus(),
                ]);
                setConfig(armadoConfig);
                setBudgetSettings(bSettings);
                setServiciosCatalogo((Array.isArray(serviciosData) ? serviciosData : []).filter(s => s.tipoItem === 'Servicio'));
                setAllMenus(Array.isArray(menuData) ? menuData : []);
                const whatsappConnection = (Array.isArray(socialConnections) ? socialConnections : []).find(c => c.platform === 'WhatsApp' && c.isConnected);
                if (whatsappConnection?.phoneNumber) {
                    setWhatsappNumber(whatsappConnection.phoneNumber);
                }
                setLogoUrl(templateSettings.logoUrl || null);
            } catch (error) {
                console.error("Initial load failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);
    
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
            eventoFecha,
            annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
            currentYear,
        });
    }, [config, allSimuladorServices, adultos, ninosYAdolescentes, selectedPaqueteId, formData.serviciosSeleccionados, eventoFecha, currentYear, budgetSettings.annualAdjustmentPercentage]);
    
    const handleNext = async () => {
        if (step === 1 && (!clienteNombre.trim() || !/^\d{9}$/.test(clienteContacto.trim()) || adultos <= 0)) {
            toast({ title: "Datos incompletos", description: "Ingresa tu nombre, celular (9 dígitos) y cantidad de adultos.", variant: "destructive" });
            return;
        }
        if (step === 1 && !eventoFecha) {
            toast({ title: "Fecha requerida", description: "La fecha del evento es obligatoria para continuar.", variant: "destructive" });
            return;
        }
        if (step === 2) {
            if (!selectedPrincipal || selectedEntradas.length !== maxEntradas) {
                toast({ title: "Selección incompleta", description: `Elige plato principal y exactamente ${maxEntradas} entrada(s).`, variant: "destructive" });
                return;
            }
            if (ninosYAdolescentes > 0 && !selectedInfantil) {
                toast({ title: "Menú infantil requerido", description: `Por favor elige un menú para los niños.`, variant: "destructive" });
                return;
            }
        }
        if (step === 3 && !selectedPaqueteId) {
            toast({ title: "Paquete requerido", description: "Elige un paquete de servicios para continuar.", variant: "destructive" });
            return;
        }

        if (step === 3) {
            setIsGenerating(true);
            const selectedPackageName = config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre;
            const data = {
                clienteNombre,
                clienteContacto,
                eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
                adultos,
                ninos: ninosYAdolescentes,
                subtotal: stats.subtotalVenta,
                costoEstimado: stats.totalFinal,
                descuentoGeneral: stats.discountPercentage,
                ajusteAnualActivo: stats.annualProjection.applies,
                ajusteAnualPorcentaje: stats.annualProjection.adjustmentPct,
                serviciosIncluidos: stats.detallados.map(s => s.id),
                paqueteNombre: selectedPackageName ? `${selectedPackageName} — ${eventoTipo}` : undefined,
                items: simulatorDetailsToBudgetItems(stats.detallados)
            };
            try {
                const result = await generateBudgetAndLeadFromSimulator(data, {
                    source: 'simulator_common',
                    eventoTipo,
                });
                if (result.success && result.presupuestoId) {
                    setGeneratedPresupuestoId(result.presupuestoId);
                    if (result.token) setGeneratedToken(result.token);
                    setStep(4);
                } else throw new Error(result.error || "Error al generar.");
            } catch (e: any) {
                toast({ title: "Error", description: e.message, variant: "destructive" });
            } finally {
                setIsGenerating(false);
            }
        } else setStep(s => s + 1);
    };

    const handlePrev = () => { if (step > 1) setStep(s => s - 1); };

    const handleEventoFechaChange = useCallback(async (date: Date | undefined) => {
        setEventoFecha(date);
        if (!date) {
            setDateWarning('');
            setDateSuggestions([]);
            return;
        }
        const availability = await checkDateAvailability(date.toISOString());
        if (availability.isOccupied) {
            setDateWarning('⚠️ Fecha no disponible. Te sugerimos estas fechas cercanas:');
            setDateSuggestions(availability.suggestions || []);
        } else {
            setDateWarning('');
            setDateSuggestions([]);
        }
    }, []);

    const handleWhatsAppQuickConsult = () => {
        if (!whatsappNumber) return;
        const texto = `¡Hola! Estuve viendo el simulador de presupuestos y tengo una consulta rápida. Mi nombre es ${clienteNombre}.`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`, '_blank');
    };

    const handleShareBudgetWhatsApp = () => {
        if (!generatedPresupuestoId) return;
        const url = `${window.location.origin}/presupuestos/${generatedPresupuestoId}/ver?cliente=1&token=${generatedToken || ''}`;
        const texto = [
            `Hola! Te comparto el presupuesto formal de AK Producciones.`,
            `Cliente: ${clienteNombre}`,
            `Total vigente: ${formatCurrency(stats.totalFinal)}`,
            stats.precioPorPersona > 0 ? `Valor por persona: ${formatCurrency(stats.precioPorPersona)}` : '',
            `Ver presupuesto: ${url}`,
        ].filter(Boolean).join('\n');
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    };

    const handleDownloadBudgetPdf = () => {
        if (!generatedPresupuestoId) return;
        window.open(`/presupuestos/${generatedPresupuestoId}/ver?imprimir=1&cliente=1&direct=1&token=${generatedToken || ''}`, '_blank');
    };

    const calculatePackageEstimatedPrice = (paquete: PaqueteArmadoRapido) => {
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
            eventoFecha,
            annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
            currentYear,
        }).totalFinal;
    };

    const handleSwitchPackage = async (paqueteId: string) => {
        if (!config) return;
        setIsGenerating(true);
        setSelectedPaqueteId(paqueteId);
        
        const newPackageName = config.paquetes.find(p => p.id === paqueteId)?.nombre;
        
        // Calculate new pricing stats
        const newStats = calculateSimulatorPricing({
            config,
            services: allSimuladorServices,
            adultos,
            ninosYAdolescentes,
            selectedPaqueteId: paqueteId,
            selectedServices: Array.from(formData.serviciosSeleccionados.entries()).map(([id, data]) => ({
                id,
                esRegalo: data.esRegalo,
            })),
            eventoFecha,
            annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
            currentYear,
        });

        const data = {
            clienteNombre,
            clienteContacto,
            eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
            adultos,
            ninos: ninosYAdolescentes,
            subtotal: newStats.subtotalVenta,
            costoEstimado: newStats.totalFinal,
            descuentoGeneral: newStats.discountPercentage,
            ajusteAnualActivo: newStats.annualProjection.applies,
            ajusteAnualPorcentaje: newStats.annualProjection.adjustmentPct,
            serviciosIncluidos: newStats.detallados.map(s => s.id),
            paqueteNombre: newPackageName ? `${newPackageName} — ${eventoTipo}` : undefined,
            items: simulatorDetailsToBudgetItems(newStats.detallados)
        };

        try {
            const result = await generateBudgetAndLeadFromSimulator(data, {
                source: 'simulator_common',
                eventoTipo,
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

    const sortedPaquetes = useMemo(() => {
        return (config?.paquetes || []).filter((p) => isPackageApplicableToEventType(p, eventoTipo));
    }, [config?.paquetes, eventoTipo]);

    useEffect(() => {
        if (!selectedPaqueteId) return;
        if (!sortedPaquetes.some((p) => p.id === selectedPaqueteId)) {
            setSelectedPaqueteId('');
        }
    }, [selectedPaqueteId, sortedPaquetes]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    
    if (step === 4 && generatedPresupuestoId) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-2 sm:px-4 print:bg-white print:p-0">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-3xl space-y-8">
                    
                    <div className="flex justify-center mb-2 print:hidden">
                      <CompanyLogo size="sm" src={logoUrl || undefined} className="opacity-40" />
                    </div>
                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                        <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center space-y-8">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <PartyPopper className="w-12 h-12 text-primary animate-bounce"/>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-3xl sm:text-4xl font-black font-headline tracking-tighter text-slate-900 uppercase">
                                    ¡Tu presupuesto está listo!
                                </h2>
                                <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                                    {budgetSettings.successMessage}
                                </p>
                            </div>
                            
                            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Button
                                    onClick={handleShareBudgetWhatsApp}
                                    className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest"
                                >
                                    <Share2 className="w-4 h-4 mr-2"/> Compartir por WhatsApp
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleWhatsAppQuickConsult}
                                    className="h-12 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs uppercase tracking-widest"
                                >
                                    <MessageSquare className="w-4 h-4 mr-2"/> Coordinar una Reunión
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleDownloadBudgetPdf}
                                  className="h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
                                >
                                    <Printer className="w-4 h-4 mr-2"/> Descargar PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-3xl print:shadow-none border border-slate-200 rounded-[2.5rem] overflow-hidden bg-white print:bg-white">
                        <CardHeader className="text-center bg-slate-800 p-6 sm:p-10 border-b border-slate-700 print:bg-white print:border-slate-200">
                            <div className="flex justify-center mb-4">
                              <CompanyLogo size="sm" src={logoUrl || undefined} className="brightness-0 invert opacity-80 print:brightness-100 print:invert-0" />
                            </div>
                            <CardTitle className="font-headline text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white print:text-slate-900">Presupuesto Estimado</CardTitle>
                            <p className="text-slate-400 font-medium text-sm mt-2 print:text-slate-600">AK Producciones Eventos — Salto, Uruguay</p>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-10 print:p-2 space-y-10">
                            <div className="border border-slate-200 rounded-[2rem] overflow-x-auto print:border-slate-300">
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
                                                <TableRow className="bg-slate-50 border-y border-slate-200">
                                                  <TableCell colSpan={(budgetSettings.showIndividualPrices ?? true) ? 3 : 1} className="font-black text-[10px] uppercase text-slate-700 pl-8 tracking-widest py-2">{categoria}</TableCell>
                                                </TableRow>
                                                {items.map(item => (
                                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                        <TableCell className="pl-8 py-4">
                                                            <div className="flex items-center gap-2">
                                                              <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                                                            </div>
                                                            {(budgetSettings.showIndividualPrices ?? true) && (
                                                              <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                                                {formatCurrency(item.precioUnitario)}{esCategoriaGastronomica(item.categoria, item.calculationMethod) ? ' / PP' : ' c/u'}
                                                              </p>
                                                            )}
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
                                    </TableBody>
                                </Table>
                            </div>
                            
                            <div className="w-full max-w-sm ml-auto space-y-3 py-8 px-10 bg-slate-800 text-white rounded-[2rem] shadow-xl border border-slate-700 print:bg-white print:text-slate-900 print:border-slate-300">
                                {(budgetSettings.showIndividualPrices ?? true) && (
                                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest print:text-slate-600">
                                      <span>Subtotal Servicios:</span>
                                      <span>{formatCurrency(stats.subtotalBruto)}</span>
                                  </div>
                                )}
                                {stats.ahorroRegalos > 0 && (
                                    <div className="flex justify-between items-center text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                                        <span>Ahorro Regalos Incluidos:</span>
                                        <span>-{formatCurrency(stats.ahorroRegalos)}</span>
                                    </div>
                                )}
                                {stats.descPromo > 0 && (
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-400 tracking-widest">
                                        <span>Bonificación Especial ({stats.discountPercentage}%):</span>
                                        <span>-{formatCurrency(stats.descPromo)}</span>
                                    </div>
                                )}
                                <Separator className="bg-white/10 print:bg-slate-300" />
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-black uppercase tracking-tighter text-white print:text-slate-900">Precio vigente:</span>
                                    <span className="text-3xl font-black text-white print:text-slate-900">{formatCurrency(stats.totalFinal)}</span>
                                </div>
                                {stats.precioPorPersona > 0 && (
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest print:text-slate-600">
                                        <span>Valor aprox. por persona:</span>
                                        <span>{formatCurrency(stats.precioPorPersona)}</span>
                                    </div>
                                )}
                            </div>
                            {stats.annualProjection.applies && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
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

                            {sortedPaquetes.filter(p => p.id !== selectedPaqueteId).length > 0 && (
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4 print:hidden">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        ¿Querés comparar con otros paquetes para esta misma configuración?
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {sortedPaquetes
                                            .filter(p => p.id !== selectedPaqueteId)
                                            .map(p => {
                                                const estimatedPrice = calculatePackageEstimatedPrice(p);
                                                return (
                                                    <div key={p.id} className="flex flex-col justify-between p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.nombre}</span>
                                                            <p className="text-lg font-black text-slate-800">{formatCurrency(estimatedPrice)}</p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isGenerating}
                                                            onClick={() => handleSwitchPackage(p.id)}
                                                            className="mt-3 w-full rounded-xl font-bold uppercase tracking-wider text-[10px] border-primary text-primary hover:bg-primary/5 h-10"
                                                        >
                                                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500"/> : `Cambiar a ${p.nombre}`}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-slate-50 p-8 border-t flex flex-col items-center gap-4">
                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 w-full">
                                <h4 className="text-[10px] font-black uppercase text-blue-800 tracking-widest mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Condiciones de Reserva</h4>
                                <p className="text-xs text-blue-700 leading-relaxed font-medium">{budgetSettings.bookingTerms}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 print:hidden">
                              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">Iniciar Nueva Simulación</Button>
                              <a
                                href="https://akproduccioneseventos.com/#faq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 hover:bg-primary/5 transition-colors"
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
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-2 sm:p-6 lg:p-8 gap-4">
            {/* Chat Simulator Banner */}
            <div className="w-full max-w-3xl print:hidden">
              <Link href="/simulador-ak">
                <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-violet-600 to-primary text-white rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl hover:from-violet-500 hover:to-primary/90 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 shrink-0 text-yellow-300" />
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

            <Card className="w-full max-w-3xl shadow-3xl rounded-[3rem] overflow-hidden border-none bg-white">
                <CardHeader className="text-center bg-slate-50 p-6 sm:p-10 border-b border-slate-200">
                    <div className="flex justify-center mb-4">
                      <CompanyLogo size="sm" src={logoUrl || undefined} className="opacity-50" />
                    </div>
                    <Wand2 className="w-12 h-12 mx-auto text-slate-600 mb-4"/>
                    <CardTitle className="font-headline text-3xl sm:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Tu Gran Evento</CardTitle>
                    <CardDescription className="text-base sm:text-xl font-bold text-slate-400 uppercase tracking-widest mt-2">Paso {step} de 3: {['Tus Datos', 'El Menú', 'El Paquete'][step-1]}</CardDescription>
                    <div className="mt-8">
                        <Progress value={(step / 3) * 100} className="h-2 bg-slate-200" />
                    </div>
                </CardHeader>
                
                <CardContent className="p-6 sm:p-10">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</Label><Input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ej: Ana García" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-lg font-bold px-6"/></div>
                                <div className="space-y-2.5"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp (9 dígitos)</Label><Input type="tel" value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} placeholder="098355530" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-lg font-bold px-6"/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nº Adultos</Label><Input type="number" value={adultos} onChange={e => setAdultos(Number(e.target.value))} className="h-14 rounded-2xl font-black bg-slate-50 border-none shadow-inner text-xl text-primary px-6"/></div>
                                <div className="space-y-2.5"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nº Niños/Adolescentes</Label><Input type="number" value={ninosYAdolescentes} onChange={e => setNinosYAdolescentes(Number(e.target.value))} className="h-14 rounded-2xl font-black bg-slate-50 border-none shadow-inner text-xl text-primary px-6"/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Evento</Label>
                                    <Select value={eventoTipo} onValueChange={setEventoTipo}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                                            <SelectItem value="Cumpleaños infantil">Cumpleaños infantil</SelectItem>
                                            <SelectItem value="15 años">15 años</SelectItem>
                                            <SelectItem value="Boda">Boda</SelectItem>
                                            <SelectItem value="Evento empresarial">Empresarial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duracion del evento</Label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {DURATION_OPTIONS.map(option => {
                                            const selected = duracionHoras === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setDuracionHoras(option.value)}
                                                    className={cn(
                                                        'h-full rounded-2xl border-2 bg-white px-4 py-3 text-left transition-all',
                                                        selected
                                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-950 shadow-lg shadow-indigo-100'
                                                            : 'border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-slate-50'
                                                    )}
                                                >
                                                    <span className="flex items-center justify-between gap-3">
                                                        <span className="text-sm font-black">{option.title}</span>
                                                        {selected && <Check className="h-5 w-5 text-indigo-600" />}
                                                    </span>
                                                    <span className="mt-1 block text-xs font-bold text-slate-500">{option.subtitle}</span>
                                                    <span className="mt-2 block text-xs text-slate-500">{option.detail}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fecha del Evento *</Label>
                                <DatePickerDemo selectedDate={eventoFecha} onDateChange={handleEventoFechaChange} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner"/>
                                {dateWarning && (
                                    <div className="p-3 rounded-xl border border-amber-400/40 bg-amber-500/10">
                                        <p className="text-amber-800 text-xs font-bold">{dateWarning}</p>
                                        {dateSuggestions.length > 0 && (
                                          <div className="flex flex-wrap gap-2 mt-2">
                                              {dateSuggestions.map((date) => (
                                                  <button
                                                      key={date}
                                                      type="button"
                                                      className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold"
                                                      onClick={() => {
                                                          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                                                              handleEventoFechaChange(new Date(`${date}T12:00:00`));
                                                          }
                                                      }}
                                                  >
                                                      {date}
                                                  </button>
                                              ))}
                                          </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                                <Input placeholder="Busca tu plato favorito..." value={gastronomiaSearchTerm} onChange={e => setGastronomiaSearchTerm(e.target.value)} className="pl-12 h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-lg font-bold"/>
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
                                                "group relative p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-4",
                                                selectedEntradas.includes(s.id) ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : "border-slate-100 hover:border-primary/20 bg-slate-50/50",
                                                isRecommended && !selectedEntradas.includes(s.id) && "border-amber-200 bg-amber-50/30 shadow-md"
                                            )}>
                                                {isRecommended && (
                                                    <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg z-10 animate-bounce">RECOMENDADO</div>
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
                                                "group relative p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-4",
                                                selectedPrincipal === s.id ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : "border-slate-100 hover:border-primary/20 bg-slate-50/50",
                                                isRecommended && selectedPrincipal !== s.id && "border-amber-200 bg-amber-50/30 shadow-md"
                                            )}>
                                                {isRecommended && (
                                                    <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg z-10 animate-bounce">RECOMENDADO</div>
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
                                            const imageUrl = safeImageUrl(s.imageUrl);
                                            return (
                                                <label key={s.id} className={cn(
                                                    "group relative p-5 border-2 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-4",
                                                    selectedInfantil === s.id ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-900/5" : "border-slate-100 hover:border-purple-200 bg-slate-50/50",
                                                    isRecommended && selectedInfantil !== s.id && "border-amber-200 bg-amber-50/30 shadow-md"
                                                )}>
                                                    {isRecommended && (
                                                        <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg z-10 animate-bounce">RECOMENDADO</div>
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
                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                            <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter text-center">Selecciona tu Paquete de Servicios</h3>
                            <RadioGroup value={selectedPaqueteId} onValueChange={setSelectedPaqueteId} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sortedPaquetes.map(p => {
                                    const sortedIncluded = [...p.serviciosIncluidos].sort((a, b) => {
                                        if (a.esRegalo && !b.esRegalo) return 1;
                                        if (!a.esRegalo && b.esRegalo) return -1;
                                        const sA = allSimuladorServices.find(os => os.id === a.id);
                                        const sB = allSimuladorServices.find(os => os.id === b.id);
                                        return (sA?.categoria || '').localeCompare(sB?.categoria || '');
                                    });

                                    const estimatedTotal = calculatePackageEstimatedPrice(p);

                                    return (
                                        <label key={p.id} className={cn(
                                            "p-6 sm:p-8 border-2 rounded-[2.5rem] cursor-pointer transition-all flex flex-col gap-6 relative overflow-hidden",
                                            selectedPaqueteId === p.id ? "border-primary bg-primary/5 shadow-2xl scale-[1.02]" : "border-slate-100 hover:border-primary/20 bg-white",
                                            p.recommended && selectedPaqueteId !== p.id && "border-amber-200 ring-4 ring-amber-50 shadow-xl"
                                        )}>
                                            {p.recommended && (
                                                <div className="absolute top-3 right-3 bg-primary text-white text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-2xl z-10 animate-pulse">
                                                    MÁS ELEGIDO
                                                </div>
                                            )}
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-black uppercase tracking-tight text-xl text-slate-800 leading-none">{p.nombre}</p>
                                                    <p className="text-sm font-black text-primary">{formatCurrency(estimatedTotal)} <span className="text-[8px] uppercase tracking-widest text-slate-400 ml-1">Presupuesto Estimado</span></p>
                                                </div>
                                                <RadioGroupItem value={p.id} className="h-6 w-6"/>
                                            </div>
                                            
                                            <div className="space-y-3">
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
                                            </div>
                                            {selectedPaqueteId === p.id && <div className="absolute -bottom-2 -right-2 p-4 opacity-10 rotate-12"><PartyPopper className="w-20 h-20 text-primary"/></div>}
                                        </label>
                                    );
                                })}
                            </RadioGroup>
                            {sortedPaquetes.length === 0 && (
                                <p className="text-center text-sm text-slate-500">No hay paquetes aplicables para el tipo de evento seleccionado.</p>
                            )}
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                              <strong>Precios {currentYear}</strong>
                              {stats.annualProjection.applies
                                ? <> — Ajuste anual proyectado del <strong>{stats.annualProjection.adjustmentPct}%</strong> para eventos en {stats.annualProjection.eventYear}.</>
                                : <> — El total mostrado corresponde al precio vigente.</>}
                            </div>
                        </div>
                    )}
                </CardContent>
                
                <CardFooter className="p-6 sm:p-10 border-t bg-slate-50 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
                    <Button variant="ghost" onClick={handlePrev} disabled={step === 1} className="w-full sm:w-auto rounded-xl h-14 px-8 font-bold text-slate-400">ANTERIOR</Button>
                    <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                        <Button onClick={handleNext} disabled={isGenerating} className="w-full sm:w-auto rounded-2xl h-16 px-12 font-black text-lg shadow-2xl shadow-primary/30 transition-transform active:scale-95">
                            {isGenerating ? <Loader2 className="animate-spin mr-3"/> : null}
                            {step === 3 ? "GENERAR PRESUPUESTO" : "SIGUIENTE PASO"}
                            {step < 3 && <ArrowRight className="ml-3 w-6 h-6"/>}
                        </Button>
                        <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded-full border shadow-sm">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Presupuesto Estimado:</p>
                            <p className="text-sm font-black text-primary">{formatCurrency(stats.totalFinal)}</p>
                        </div>
                    </div>
                </CardFooter>
            </Card>
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
