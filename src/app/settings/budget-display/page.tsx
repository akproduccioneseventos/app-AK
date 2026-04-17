'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft, ArrowRight, Save, Loader2, Wand2, PlusCircle, Trash2, 
    Percent, Tag, MessageSquare, ListPlus, ShieldCheck, Zap, Info, 
    Package, ChefHat, Layers, Check, Search, Star, Eye, EyeOff, X, Gift, Building2,
    ChevronsUp, ChevronsDown, Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveArmadoRapidoConfig, getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getBudgetDisplaySettings, saveBudgetDisplaySettings } from '@/app/actions/settings';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido } from '@/types/armado-rapido';
import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import { isPackageApplicableToEventType } from '@/types/armado-rapido';
import type { BudgetDisplaySettings } from '@/types/settings';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu, MenuItem } from '@/types/catering';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const PACKAGE_EVENT_SECTIONS = [
  { value: 'all', label: 'Todos', eventType: '' },
  { value: '15', label: '15 años', eventType: '15 años' },
  { value: 'boda', label: 'Boda', eventType: 'Boda' },
  { value: 'cumple-infantil', label: 'Cumpleaños infantil', eventType: 'Cumpleaños infantil' },
  { value: 'cumple', label: 'Cumpleaños', eventType: 'Cumpleaños' },
  { value: 'empresarial', label: 'Empresarial', eventType: 'Evento empresarial' },
] as const;

const deepClone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const generateClientSideId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${suffix}`;
  }
  return `${prefix}_${Date.now()}`;
};

export default function BudgetDisplaySettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Data States
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [budgetSettings, setBudgetSettings] = useState<BudgetDisplaySettings | null>(null);
  const [initialConfig, setInitialConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [initialBudgetSettings, setInitialBudgetSettings] = useState<BudgetDisplaySettings | null>(null);
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [allDishes, setAllDishes] = useState<MenuItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // UI States
  const [dishSearchTerm, setDishSearchTerm] = useState('');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [activePackageSection, setActivePackageSection] = useState<(typeof PACKAGE_EVENT_SECTIONS)[number]['value']>('all');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [newDepTrigger, setNewDepTrigger] = useState('');
  const [newDepRequired, setNewDepRequired] = useState('');
  const [packageCopyTargets, setPackageCopyTargets] = useState<Record<string, (typeof PACKAGE_EVENT_SECTIONS)[number]['value']>>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [armadoData, settingsData, servicesData, menusData] = await Promise.all([
        getArmadoRapidoConfig(),
        getBudgetDisplaySettings(),
        getServiciosEmpresa(),
        getMenus()
      ]);
      const normalizedConfig: ArmadoRapidoConfig = {
        ...armadoData,
        clubUruguayConfig: {
          ...defaultClubUruguayConfig,
          ...(armadoData.clubUruguayConfig || {}),
          prestaciones: (armadoData.clubUruguayConfig?.prestaciones || defaultClubUruguayConfig.prestaciones)
            .map((p) => p.trim())
            .filter(Boolean),
        },
      };
      setConfig(normalizedConfig);
      setBudgetSettings(settingsData);
      setInitialConfig(deepClone(normalizedConfig));
      setInitialBudgetSettings(deepClone(settingsData));
      setServicios(servicesData.filter(s => s.tipoItem === 'Servicio'));
      setAllDishes(menusData.flatMap(m => m.items));
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar la configuración.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveAll = async (onSuccess?: () => void) => {
    if (!config || !budgetSettings) return;
    setIsSaving(true);
    try {
      const [res1, res2] = await Promise.all([
        saveArmadoRapidoConfig(config),
        saveBudgetDisplaySettings(budgetSettings)
      ]);
      if (res1.success && res2.success) {
        toast({ title: "Configuración Guardada", description: "Todos los cambios se han aplicado al simulador." });
        setInitialConfig(deepClone(config));
        setInitialBudgetSettings(deepClone(budgetSettings));
        onSuccess?.();
      } else throw new Error("Error al guardar una de las secciones.");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- ACTIONS FOR PACKAGES ---
  const addPackage = (sectionValue: (typeof PACKAGE_EVENT_SECTIONS)[number]['value']) => {
    const section = PACKAGE_EVENT_SECTIONS.find((s) => s.value === sectionValue) || PACKAGE_EVENT_SECTIONS[0];
    const newPkg: PaqueteArmadoRapido = {
        id: `pkg_${Date.now()}`,
        nombre: 'Nuevo Paquete',
        serviciosIncluidos: [],
        recommended: false,
        tiposDeEventoAplicables: section.eventType ? [section.eventType] : [],
    };
    setConfig(prev => prev ? ({ ...prev, paquetes: [...prev.paquetes, newPkg] }) : null);
    setActivePackageSection(sectionValue);
  };

  const removePackage = (id: string) => {
    setConfig(prev => prev ? ({ ...prev, paquetes: prev.paquetes.filter(p => p.id !== id) }) : null);
  };

  const togglePackageRecommended = (id: string) => {
    setConfig(prev => {
        if (!prev) return null;
        return {
            ...prev,
            paquetes: prev.paquetes.map(p => ({
                ...p,
                recommended: p.id === id ? !p.recommended : false // Only one recommended at a time
            }))
        };
    });
  };

  const removeServiceFromPackage = (pkgId: string, serviceId: string) => {
    setConfig(prev => {
        if (!prev) return null;
        return {
            ...prev,
            paquetes: prev.paquetes.map(p => p.id === pkgId ? {
                ...p,
                serviciosIncluidos: p.serviciosIncluidos.filter(s => s.id !== serviceId)
            } : p)
        };
    });
  };

  const toggleServiceGift = (pkgId: string, serviceId: string) => {
    setConfig(prev => {
        if (!prev) return null;
        return {
            ...prev,
            paquetes: prev.paquetes.map(p => p.id === pkgId ? {
                ...p,
                serviciosIncluidos: p.serviciosIncluidos.map(s => s.id === serviceId ? { ...s, esRegalo: !s.esRegalo } : s)
            } : p)
        };
    });
  };

  const addServiceToPackage = (service: ServicioEmpresa) => {
    if (!activePackageId || !config) return;
    setConfig({
        ...config,
        paquetes: config.paquetes.map(p => p.id === activePackageId ? {
            ...p,
            serviciosIncluidos: [...p.serviciosIncluidos, { id: service.id, esRegalo: false }]
        } : p)
    });
    setCatalogSearchTerm('');
    setIsCatalogModalOpen(false);
  };

  const getPackageSectionValue = (pkg: PaqueteArmadoRapido): (typeof PACKAGE_EVENT_SECTIONS)[number]['value'] => {
    const tipos = (pkg.tiposDeEventoAplicables || []).map((t) => t.trim()).filter(Boolean);
    if (tipos.length === 0) return 'all';
    const matched = PACKAGE_EVENT_SECTIONS.find(
      (section) => section.eventType && isPackageApplicableToEventType(pkg, section.eventType)
    );
    return matched?.value || 'all';
  };

  const updatePackageEventType = (pkgId: string, sectionValue: (typeof PACKAGE_EVENT_SECTIONS)[number]['value']) => {
    const section = PACKAGE_EVENT_SECTIONS.find((s) => s.value === sectionValue) || PACKAGE_EVENT_SECTIONS[0];
    setConfig(prev => prev ? ({
      ...prev,
      paquetes: prev.paquetes.map((pkg) => pkg.id === pkgId ? {
        ...pkg,
        tiposDeEventoAplicables: section.eventType ? [section.eventType] : [],
      } : pkg)
    }) : null);
  };

  const duplicatePackageToSection = (pkg: PaqueteArmadoRapido, sectionValue: (typeof PACKAGE_EVENT_SECTIONS)[number]['value']) => {
    const section = PACKAGE_EVENT_SECTIONS.find((s) => s.value === sectionValue) || PACKAGE_EVENT_SECTIONS[0];
    const newPkg: PaqueteArmadoRapido = {
      ...pkg,
      id: generateClientSideId('pkg_copy'),
      nombre: `${pkg.nombre} (${section.label})`,
      recommended: false,
      tiposDeEventoAplicables: section.eventType ? [section.eventType] : [],
      serviciosIncluidos: (pkg.serviciosIncluidos || []).map((serv) => ({ ...serv })),
    };
    setConfig(prev => prev ? ({ ...prev, paquetes: [...prev.paquetes, newPkg] }) : null);
    setActivePackageSection(sectionValue);
  };

  // --- ACTIONS FOR DISHES ---
  const toggleDishVisibility = (dishId: string) => {
    setConfig(prev => {
        if (!prev) return null;
        const currentVisibles = prev.platosVisibles || [];
        const index = currentVisibles.findIndex(p => p.id === dishId);
        if (index > -1) {
            const updated = [...currentVisibles];
            updated[index] = { ...updated[index], visible: !updated[index].visible };
            return { ...prev, platosVisibles: updated };
        } else {
            return { ...prev, platosVisibles: [...currentVisibles, { id: dishId, visible: false, recommended: false }] };
        }
    });
  };

  const toggleDishRecommended = (dishId: string) => {
    setConfig(prev => {
        if (!prev) return null;
        const currentVisibles = prev.platosVisibles || [];
        const index = currentVisibles.findIndex(p => p.id === dishId);
        if (index > -1) {
            const updated = [...currentVisibles];
            updated[index] = { ...updated[index], recommended: !updated[index].recommended };
            return { ...prev, platosVisibles: updated };
        } else {
            return { ...prev, platosVisibles: [...currentVisibles, { id: dishId, visible: true, recommended: true }] };
        }
    });
  };

  const addDependency = () => {
    if (!newDepTrigger || !newDepRequired) return;
    const newDep = {
      id: `dep_${Date.now()}`,
      triggerServiceId: newDepTrigger,
      requiredServiceId: newDepRequired,
    };
    setConfig(prev => prev ? ({ ...prev, serviceDependencies: [...(prev.serviceDependencies || []), newDep] }) : null);
    setNewDepTrigger('');
    setNewDepRequired('');
  };

  const getDependencyName = (id: string, type: 'trigger' | 'required') => {
    if (type === 'trigger') return allDishes.find(d => d.id === id)?.name;
    return servicios.find(s => s.id === id)?.nombre || allDishes.find(d => d.id === id)?.name;
  };

  // --- FILTERS ---
  const hasUnsavedChanges = useMemo(() => {
    if (!config || !budgetSettings || !initialConfig || !initialBudgetSettings) return false;
    return JSON.stringify(config) !== JSON.stringify(initialConfig) || JSON.stringify(budgetSettings) !== JSON.stringify(initialBudgetSettings);
  }, [config, budgetSettings, initialConfig, initialBudgetSettings]);

  const selectedSection = PACKAGE_EVENT_SECTIONS.find((s) => s.value === activePackageSection) || PACKAGE_EVENT_SECTIONS[0];

  const visiblePackages = useMemo(() => {
    const paquetes = config?.paquetes || [];
    if (!selectedSection.eventType) {
      return paquetes.filter((pkg) => (pkg.tiposDeEventoAplicables || []).length === 0);
    }
    return paquetes.filter((pkg) => {
      const tipos = pkg.tiposDeEventoAplicables || [];
      return tipos.length > 0 && isPackageApplicableToEventType(pkg, selectedSection.eventType);
    });
  }, [config?.paquetes, selectedSection.eventType]);

  const filteredServices = useMemo(() => {
    const term = catalogSearchTerm.toLowerCase();
    return servicios.filter(s => s.nombre.toLowerCase().includes(term));
  }, [servicios, catalogSearchTerm]);

  const handleCatalogModalOpenChange = (open: boolean) => {
    setIsCatalogModalOpen(open);
    if (!open) setCatalogSearchTerm('');
  };

  const handleBackNavigation = () => {
    if (!hasUnsavedChanges) {
      router.push('/settings');
      return;
    }
    setShowUnsavedDialog(true);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12"/></div>;

  return (
    <div className="space-y-6 md:space-y-8 pb-32">
      <Dialog open={isCatalogModalOpen} onOpenChange={handleCatalogModalOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Añadir Servicio al Paquete</DialogTitle></DialogHeader>
            <div className="py-2 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <Input placeholder="Buscar servicio..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="pl-9"/>
                </div>
                <ScrollArea className="h-64 border rounded-xl p-2">
                    <div className="space-y-1">
                        {filteredServices.map(s => (
                            <Button key={s.id} variant="ghost" className="w-full justify-start text-left h-auto py-2" onClick={() => addServiceToPackage(s)}>
                                <div>
                                    <p className="font-bold text-sm">{s.nombre}</p>
                                    <p className="text-[10px] uppercase text-muted-foreground">{s.categoria}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </DialogContent>
      </Dialog>

      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white shrink-0">
                <Wand2 className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
                <h1 className="text-xl md:text-3xl font-black tracking-tight font-headline uppercase">Configuración del Simulador</h1>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de Paquetes, Platos y Estrategia</p>
            </div>
        </div>
        <Button variant="outline" className="rounded-xl w-full md:w-auto" onClick={handleBackNavigation}>
          <ArrowLeft className="w-4 h-4 mr-2" />Volver
        </Button>
      </header>

      <Tabs defaultValue="estrategia" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-100 p-1 rounded-2xl h-auto md:h-14 border border-slate-200">
            <TabsTrigger value="estrategia" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">Venta PRO</TabsTrigger>
            <TabsTrigger value="paquetes" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">Paquetes</TabsTrigger>
            <TabsTrigger value="platos" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">Platos</TabsTrigger>
            <TabsTrigger value="dependencias" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">Reglas</TabsTrigger>
        </TabsList>

        {/* 1. ESTRATEGIA DE VENTA */}
        <TabsContent value="estrategia" className="space-y-6 pt-4 animate-in fade-in duration-500">
            <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 md:p-8">
                    <CardTitle className="font-headline text-lg md:text-xl text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary"/> Mensajes de Conversión
                    </CardTitle>
                    <CardDescription className="text-xs">Textos estratégicos que aparecen al finalizar el presupuesto.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensaje Principal de Éxito</Label>
                        <Textarea 
                            value={budgetSettings?.successMessage || ''} 
                            onChange={e => setBudgetSettings(s => s ? { ...s, successMessage: e.target.value } : null)}
                            className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[80px] text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Condiciones de Reserva (Seña)</Label>
                        <Textarea 
                            value={budgetSettings?.bookingTerms || ''} 
                            onChange={e => setBudgetSettings(s => s ? { ...s, bookingTerms: e.target.value } : null)}
                            className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[80px] text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensaje de WhatsApp automático</Label>
                        <Textarea 
                            value={budgetSettings?.whatsappMessageTemplate || ''} 
                            onChange={e => setBudgetSettings(s => s ? { ...s, whatsappMessageTemplate: e.target.value } : null)}
                            className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[80px] text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Características de la Empresa (Beneficios)</Label>
                        <Textarea 
                            value={budgetSettings?.valuePropositions?.join('\n') || ''} 
                            onChange={e => setBudgetSettings(s => s ? { 
                                ...s, 
                                valuePropositions: e.target.value.split('\n').filter(line => line.trim())
                            } : null)}
                            className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[120px] text-sm"
                            placeholder={"Equipamiento profesional de alta gama\nPersonal capacitado\nGarantía de satisfacción"}
                        />
                        <p className="text-[10px] text-slate-500">Escribe una característica por línea. Estas viñetas se mostrarán al final de los presupuestos manuales y del simulador.</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden bg-slate-900 text-white">
                <CardHeader className="p-6 md:p-8 border-b border-white/5">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary"/> Ajustes Globales
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="space-y-2 shrink-0">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ajuste anual de precios de la empresa (%)</Label>
                            <Input 
                                type="number" 
                                value={budgetSettings?.annualAdjustmentPercentage ?? 15} 
                                onChange={e => setBudgetSettings(s => s ? { ...s, annualAdjustmentPercentage: Number(e.target.value) } : null)}
                                className="h-12 rounded-xl bg-white/10 border-none text-white font-bold w-full md:w-32"
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 max-w-full md:max-w-sm">
                            <Info className="w-5 h-5 text-primary shrink-0"/>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Porcentaje que se aplica automáticamente a presupuestos de años futuros (actualmente {budgetSettings?.annualAdjustmentPercentage ?? 15}%).</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="space-y-1 mr-4">
                            <p className="text-sm font-black uppercase tracking-widest text-white">Mostrar Precios Individuales</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Si está desactivado, el presupuesto solo muestra el total, descuentos y regalos — sin desglosar precios por servicio. Útil por estrategia de venta.</p>
                        </div>
                        <Switch
                            checked={budgetSettings?.showIndividualPrices ?? true}
                            onCheckedChange={v => setBudgetSettings(s => s ? { ...s, showIndividualPrices: v } : null)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 md:p-8">
                <CardTitle className="font-headline text-lg md:text-xl text-slate-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> Club Uruguay
                </CardTitle>
                <CardDescription className="text-xs">
                  Configuración del salón para ofrecer en el simulador cuando el cliente no tiene salón.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-700">Activo</p>
                    <p className="text-[10px] text-slate-500">Si está desactivado, no se ofrece Club Uruguay en el simulador.</p>
                  </div>
                  <Switch
                    checked={config?.clubUruguayConfig?.activo ?? defaultClubUruguayConfig.activo}
                    onCheckedChange={(activo) =>
                      setConfig((prev) => prev ? ({
                        ...prev,
                        clubUruguayConfig: {
                          ...defaultClubUruguayConfig,
                          ...(prev.clubUruguayConfig || {}),
                          activo,
                        },
                      }) : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio del salón</Label>
                  <Input
                    type="number"
                    value={config?.clubUruguayConfig?.precio ?? defaultClubUruguayConfig.precio}
                    onChange={(e) => {
                      const precio = Number(e.target.value) || 0;
                      setConfig((prev) => prev ? ({
                        ...prev,
                        clubUruguayConfig: {
                          ...defaultClubUruguayConfig,
                          ...(prev.clubUruguayConfig || {}),
                          precio,
                        },
                      }) : null);
                    }}
                    className="h-12 rounded-xl bg-slate-50 border-none shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prestaciones</Label>
                  <Textarea
                    value={(config?.clubUruguayConfig?.prestaciones || defaultClubUruguayConfig.prestaciones).join('\n')}
                    onChange={(e) =>
                      setConfig((prev) => prev ? ({
                        ...prev,
                        clubUruguayConfig: {
                          ...defaultClubUruguayConfig,
                          ...(prev.clubUruguayConfig || {}),
                          prestaciones: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                        },
                      }) : null)
                    }
                    className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[120px] text-sm"
                    placeholder={'Capacidad 50-200 personas\nUbicación céntrica\nAire acondicionado'}
                  />
                  <p className="text-[10px] text-slate-500">Escribe una prestación por línea.</p>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* 2. GESTIÓN DE PAQUETES */}
        <TabsContent value="paquetes" className="space-y-6 pt-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <Tabs value={activePackageSection} onValueChange={(v) => setActivePackageSection(v as (typeof PACKAGE_EVENT_SECTIONS)[number]['value'])} className="w-full">
                    <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full h-auto bg-slate-100 rounded-2xl p-1">
                        {PACKAGE_EVENT_SECTIONS.map((section) => (
                            <TabsTrigger key={section.value} value={section.value} className="rounded-xl text-[10px] py-2 font-black uppercase tracking-widest">
                                {section.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <Button onClick={() => addPackage(activePackageSection)} className="rounded-xl font-bold w-full md:w-auto">
                  <PlusCircle className="w-4 h-4 mr-2"/> Crear Paquete
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visiblePackages.map(pkg => (
                     <Card key={pkg.id} className={cn("border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white", pkg.recommended && "ring-4 ring-primary/20")}>
                        <CardHeader className="bg-slate-50 p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div className="space-y-1 flex-grow">
                                <Input 
                                    value={pkg.nombre} 
                                    onChange={e => setConfig(prev => prev ? ({...prev, paquetes: prev.paquetes.map(p => p.id === pkg.id ? {...p, nombre: e.target.value} : p)}) : null)}
                                    className="font-black uppercase tracking-tight text-slate-800 border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-lg"
                                />
                                <div className="flex items-center gap-2">
                                    <Switch checked={pkg.recommended} onCheckedChange={() => togglePackageRecommended(pkg.id)} />
                                    <Label className="text-[10px] font-black uppercase text-primary">RECOMENDADO</Label>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removePackage(pkg.id)} className="text-slate-300 hover:text-destructive"><Trash2 className="w-4 h-4"/></Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de fiesta</Label>
                                <Select
                                  value={getPackageSectionValue(pkg)}
                                  onValueChange={(value) => updatePackageEventType(pkg.id, value as (typeof PACKAGE_EVENT_SECTIONS)[number]['value'])}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo de fiesta" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PACKAGE_EVENT_SECTIONS.map((section) => (
                                      <SelectItem key={section.value} value={section.value}>
                                        {section.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Copiar paquete a otro tipo</Label>
                                <div className="flex gap-2">
                                  <Select
                                    value={packageCopyTargets[pkg.id] || getPackageSectionValue(pkg)}
                                    onValueChange={(value) =>
                                      setPackageCopyTargets((prev) => ({
                                        ...prev,
                                        [pkg.id]: value as (typeof PACKAGE_EVENT_SECTIONS)[number]['value'],
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Elegir destino" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PACKAGE_EVENT_SECTIONS.map((section) => (
                                        <SelectItem key={section.value} value={section.value}>
                                          {section.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => duplicatePackageToSection(pkg, packageCopyTargets[pkg.id] || getPackageSectionValue(pkg))}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copiar
                                  </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Servicios Incluidos</Label>
                                <ScrollArea className="h-48 border rounded-2xl p-2 bg-slate-50/50 shadow-inner">
                                    <div className="space-y-1">
                                        {pkg.serviciosIncluidos.map(si => {
                                            const serv = servicios.find(s => s.id === si.id);
                                            return (
                                                <div key={si.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-xl">
                                                    <div className="flex flex-col min-w-0 flex-grow">
                                                        <span className="text-xs font-bold text-slate-700 truncate">{serv?.nombre || 'Servicio no encontrado'}</span>
                                                        {si.esRegalo && <Badge className="w-fit h-4 text-[8px] bg-emerald-500 text-white border-none mt-0.5">REGALO</Badge>}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-lg", si.esRegalo ? "text-emerald-600 bg-emerald-50" : "text-slate-300")} onClick={() => toggleServiceGift(pkg.id, si.id)} title="Marcar como regalo"><Gift className="w-3.5 h-3.5"/></Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300 hover:text-rose-600" onClick={() => removeServiceFromPackage(pkg.id, si.id)}><X className="w-3.5 h-3.5"/></Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                            <Button variant="outline" className="w-full rounded-xl border-dashed border-primary/30 text-primary font-bold" onClick={() => { setActivePackageId(pkg.id); setIsCatalogModalOpen(true); }}>
                                <PlusCircle className="w-4 h-4 mr-2"/> Añadir Servicio
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {visiblePackages.length === 0 && (
              <Card className="border border-dashed rounded-2xl">
                <CardContent className="py-8 text-center text-sm text-slate-500">
                  No hay paquetes configurados en la sección <strong>{selectedSection.label}</strong>.
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* 3. PLATOS VISIBLES */}
        <TabsContent value="platos" className="space-y-6 pt-4 animate-in fade-in duration-500">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary"/> Catálogo Gastronómico en Simulador</CardTitle>
                        <CardDescription className="text-xs">Selecciona qué platos del catálogo maestro serán visibles para el cliente.</CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <Input placeholder="Buscar plato..." value={dishSearchTerm} onChange={e => setDishSearchTerm(e.target.value)} className="rounded-xl pl-9 bg-white h-10"/>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[60vh]">
                        <div className="min-w-full inline-block align-middle">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-100">
                                        <TableHead className="pl-6 text-[10px] font-black uppercase">Plato / Tipo</TableHead>
                                        <TableHead className="text-center text-[10px] font-black uppercase w-16">Visible</TableHead>
                                        <TableHead className="text-center text-[10px] font-black uppercase w-16">Reco.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allDishes.filter(d => d.name.toLowerCase().includes(dishSearchTerm.toLowerCase())).map(dish => {
                                        const settings = config?.platosVisibles?.find(p => p.id === dish.id) || { id: dish.id, visible: true, recommended: false };
                                        return (
                                            <TableRow key={dish.id} className="border-slate-50 hover:bg-slate-50/50">
                                                <TableCell className="pl-6 py-4">
                                                    <p className="font-bold text-slate-800 text-xs">{dish.name}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{dish.type}</p>
                                                </TableCell>
                                                <TableCell className="text-center px-2">
                                                    <Button variant="ghost" size="icon" onClick={() => toggleDishVisibility(dish.id)} className={cn("rounded-xl h-8 w-8", settings.visible ? "text-primary bg-primary/5" : "text-slate-300")}>
                                                        {settings.visible ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-center px-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleDishRecommended(dish.id)}
                                                        className={cn(
                                                            "rounded-xl h-8 w-8",
                                                            settings.recommended ? "text-amber-600 bg-amber-100 hover:bg-amber-200" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                        )}
                                                        title={settings.recommended ? "Quitar recomendación" : "Marcar como recomendado"}
                                                        disabled={!settings.visible}
                                                    >
                                                        <Star className={cn("w-4 h-4", settings.recommended && "fill-current")}/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 4. DEPENDENCIAS */}
        <TabsContent value="dependencias" className="space-y-6 pt-4 animate-in fade-in duration-500">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 md:p-8">
                    <CardTitle className="font-headline text-lg md:text-xl text-slate-800 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary"/> Reglas Automáticas
                    </CardTitle>
                    <CardDescription className="text-xs">Define servicios que deben añadirse automáticamente según la elección del plato (ej: Asado {'->'} Asador).</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-4">
                    {config?.serviceDependencies?.map(dep => (
                        <div key={dep.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Si el cliente elige:</p>
                                    <p className="font-bold text-xs">{getDependencyName(dep.triggerServiceId, 'trigger') || 'Plato no encontrado'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Añadir automáticamente:</p>
                                    <p className="font-bold text-xs text-primary">{getDependencyName(dep.requiredServiceId, 'required') || 'Servicio no encontrado'}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setConfig(prev => prev ? ({...prev, serviceDependencies: prev.serviceDependencies?.filter(d => d.id !== dep.id)}) : null)} className="text-slate-300 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    ))}
                    
                    <div className="pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-4 text-center tracking-widest">Añadir Nueva Regla</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold">Si elige este plato...</Label>
                                <Select value={newDepTrigger} onValueChange={setNewDepTrigger}>
                                    <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Elegir plato..."/></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {allDishes.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-center text-slate-300 py-2 md:py-0">
                                <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold">Añadir este servicio...</Label>
                                <Select value={newDepRequired} onValueChange={setNewDepRequired}>
                                    <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Elegir servicio..."/></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {servicios.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={addDependency} disabled={!newDepTrigger || !newDepRequired} className="rounded-xl font-bold">
                                Agregar Regla
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {hasUnsavedChanges ? 'Hay cambios sin guardar' : 'Todos los cambios guardados'}
            </p>
            <Button 
                onClick={async () => { await handleSaveAll(); }} 
                disabled={isSaving} 
                size="lg" 
                className="rounded-2xl w-full md:w-auto px-12 h-14 font-black text-base shadow-2xl shadow-primary/30"
            >
                {isSaving ? <Loader2 className="animate-spin mr-3"/> : <Save className="w-5 h-5 mr-3"/>}
                {isSaving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
            </Button>
        </div>
      </div>

      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambios sin guardar</DialogTitle>
            <DialogDescription>
              Tenés cambios pendientes. ¿Querés guardarlos antes de salir?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>Cancelar</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowUnsavedDialog(false);
                router.push('/settings');
              }}
            >
              No guardar
            </Button>
            <Button
              onClick={() => handleSaveAll(() => {
                setShowUnsavedDialog(false);
                router.push('/settings');
              })}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Guardar y salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
