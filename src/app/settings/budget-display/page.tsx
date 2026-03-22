'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    ArrowLeft, Save, Loader2, Wand2, PlusCircle, Trash2, 
    Percent, Tag, MessageSquare, ListPlus, ShieldCheck, Zap, Info, 
    Package, ChefHat, Layers, Check, Search, Star, Eye, EyeOff, X, Gift
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveArmadoRapidoConfig, getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getBudgetDisplaySettings, saveBudgetDisplaySettings } from '@/app/actions/settings';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido } from '@/types/armado-rapido';
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

export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  
  // Data States
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [budgetSettings, setBudgetSettings] = useState<BudgetDisplaySettings | null>(null);
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [allDishes, setAllDishes] = useState<MenuItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // UI States
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [activePackageId, setActivePackageId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [armadoData, settingsData, servicesData, menusData] = await Promise.all([
        getArmadoRapidoConfig(),
        getBudgetDisplaySettings(),
        getServiciosEmpresa(),
        getMenus()
      ]);
      setConfig(armadoData);
      setBudgetSettings(settingsData);
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

  const handleSaveAll = async () => {
    if (!config || !budgetSettings) return;
    setIsSaving(true);
    try {
      const [res1, res2] = await Promise.all([
        saveArmadoRapidoConfig(config),
        saveBudgetDisplaySettings(budgetSettings)
      ]);
      if (res1.success && res2.success) {
        toast({ title: "Configuración Guardada", description: "Todos los cambios se han aplicado al simulador." });
        await fetchData();
      } else throw new Error("Error al guardar una de las secciones.");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- ACTIONS FOR PACKAGES ---
  const addPackage = () => {
    const newPkg: PaqueteArmadoRapido = {
        id: `pkg_${Date.now()}`,
        nombre: 'Nuevo Paquete',
        serviciosIncluidos: [],
        recommended: false
    };
    setConfig(prev => prev ? ({ ...prev, paquetes: [...prev.paquetes, newPkg] }) : null);
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
    setIsCatalogModalOpen(false);
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
            return { ...prev, platosVisibles: [...currentVisibles, { id: dishId, visible: false }] };
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

  // --- FILTERS ---
  const filteredServices = useMemo(() => {
    const term = catalogSearchTerm.toLowerCase();
    return servicios.filter(s => s.nombre.toLowerCase().includes(term));
  }, [servicios, catalogSearchTerm]);

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12"/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
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

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white">
                <Wand2 className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight font-headline uppercase">Configuración del Simulador</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de Paquetes, Platos y Estrategia de Venta</p>
            </div>
        </div>
        <Link href="/settings" passHref><Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </header>

      <Tabs defaultValue="estrategia" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-2xl h-14 border border-slate-200">
            <TabsTrigger value="estrategia" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Venta PRO</TabsTrigger>
            <TabsTrigger value="paquetes" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Paquetes</TabsTrigger>
            <TabsTrigger value="platos" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Platos Visibles</TabsTrigger>
            <TabsTrigger value="dependencias" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Dependencias</TabsTrigger>
        </TabsList>

        {/* 1. ESTRATEGIA DE VENTA */}
        <TabsContent value="estrategia" className="space-y-6 pt-4 animate-in fade-in duration-500">
            <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <CardTitle className="font-headline text-xl text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary"/> Mensajes de Conversión
                    </CardTitle>
                    <CardDescription>Textos estratégicos que aparecen al finalizar el presupuesto.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensaje Principal de Éxito</Label>
                        <Textarea 
                            value={budgetSettings?.successMessage || ''} 
                            onChange={e => setBudgetSettings(s => s ? { ...s, successMessage: e.target.value } : null)}
                            className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[80px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Condiciones de Reserva (Seña)</Label>
                        <Textarea 
                            value={budgetSettings?.bookingTerms || ''} 
                            onChange={e => setBudgetSettings(s => s ? { ...s, bookingTerms: e.target.value } : null)}
                            className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[80px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensaje de WhatsApp automático</Label>
                        <Textarea 
                            value={budgetSettings?.whatsappMessageTemplate || ''} 
                            onChange={e => setBudgetSettings(s => s ? { ...s, whatsappMessageTemplate: e.target.value } : null)}
                            className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[80px]"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-slate-900 text-white">
                <CardHeader className="p-8 border-b border-white/5">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary"/> Ajustes Globales
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex items-center gap-6">
                        <div className="space-y-2 flex-grow">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ajuste Anual Automático (%)</Label>
                            <Input 
                                type="number" 
                                value={budgetSettings?.annualAdjustmentPercentage ?? 15} 
                                onChange={e => setBudgetSettings(s => s ? { ...s, annualAdjustmentPercentage: Number(e.target.value) } : null)}
                                className="h-12 rounded-xl bg-white/10 border-none text-white font-bold w-32"
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 max-w-sm">
                            <Info className="w-5 h-5 text-primary shrink-0"/>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Este ajuste se aplica si la fecha del evento es posterior al año en que se genera el presupuesto.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 2. GESTIÓN DE PAQUETES */}
        <TabsContent value="paquetes" className="space-y-6 pt-4 animate-in fade-in duration-500">
            <div className="flex justify-end">
                <Button onClick={addPackage} className="rounded-xl font-bold"><PlusCircle className="w-4 h-4 mr-2"/> Crear Paquete</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config?.paquetes.map(pkg => (
                    <Card key={pkg.id} className={cn("border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white", pkg.recommended && "ring-4 ring-primary/20")}>
                        <CardHeader className="bg-slate-50 p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div className="space-y-1">
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
                                <Label className="text-[10px] font-black uppercase text-slate-400">Servicios Incluidos</Label>
                                <ScrollArea className="h-48 border rounded-2xl p-2 bg-slate-50/50 shadow-inner">
                                    <div className="space-y-1">
                                        {pkg.serviciosIncluidos.map(si => {
                                            const serv = servicios.find(s => s.id === si.id);
                                            return (
                                                <div key={si.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-xl">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{serv?.nombre || 'Servicio no encontrado'}</span>
                                                        {si.esRegalo && <Badge className="w-fit h-4 text-[8px] bg-emerald-500 text-white border-none mt-0.5">REGALO</Badge>}
                                                    </div>
                                                    <div className="flex gap-1">
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
        </TabsContent>

        {/* 3. PLATOS VISIBLES */}
        <TabsContent value="platos" className="space-y-6 pt-4 animate-in fade-in duration-500">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary"/> Catálogo Gastronómico en Simulador</CardTitle>
                        <CardDescription>Selecciona qué platos del catálogo maestro serán visibles para el cliente.</CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <Input placeholder="Buscar plato..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="rounded-xl pl-9 bg-white"/>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100">
                                    <TableHead className="pl-8 text-[10px] font-black uppercase">Plato / Tipo</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase">Visible</TableHead>
                                    <TableHead className="text-center text-[10px] font-black uppercase">Recomendado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allDishes.filter(d => d.name.toLowerCase().includes(catalogSearchTerm.toLowerCase())).map(dish => {
                                    const settings = config?.platosVisibles?.find(p => p.id === dish.id) || { id: dish.id, visible: true, recommended: false };
                                    return (
                                        <TableRow key={dish.id} className="border-slate-50 hover:bg-slate-50/50">
                                            <TableCell className="pl-8 py-4">
                                                <p className="font-bold text-slate-800">{dish.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{dish.type}</p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="icon" onClick={() => toggleDishVisibility(dish.id)} className={cn("rounded-xl", settings.visible ? "text-primary bg-primary/5" : "text-slate-300")}>
                                                    {settings.visible ? <Eye className="w-5 h-5"/> : <EyeOff className="w-5 h-5"/>}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="icon" onClick={() => toggleDishRecommended(dish.id)} className={cn("rounded-xl", settings.recommended ? "text-amber-500 bg-amber-50" : "text-slate-300")} disabled={!settings.visible}>
                                                    <Star className={cn("w-5 h-5", settings.recommended && "fill-current")}/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 4. DEPENDENCIAS */}
        <TabsContent value="dependencias" className="space-y-6 pt-4 animate-in fade-in duration-500">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <CardTitle className="font-headline text-xl text-slate-800 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary"/> Reglas Automáticas
                    </CardTitle>
                    <CardDescription>Define servicios que deben añadirse automáticamente según la elección del plato (ej: Asado -> Asador).</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                    {config?.serviceDependencies?.map(dep => (
                        <div key={dep.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Si el cliente elige:</p>
                                    <p className="font-bold text-xs">{allDishes.find(d => d.id === dep.triggerServiceId)?.name || 'Plato no encontrado'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Añadir automáticamente:</p>
                                    <p className="font-bold text-xs text-primary">{servicios.find(s => s.id === dep.requiredServiceId)?.nombre || 'Servicio no encontrado'}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setConfig(prev => prev ? ({...prev, serviceDependencies: prev.serviceDependencies?.filter(d => d.id !== dep.id)}) : null)} className="text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    ))}
                    
                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-4 text-center">Añadir Nueva Regla</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold">Si elige este plato...</Label>
                                <Select onValueChange={(v) => {
                                    const newDep = { id: `dep_${Date.now()}`, triggerServiceId: v, requiredServiceId: '' };
                                    setConfig(prev => prev ? ({...prev, serviceDependencies: [...(prev.serviceDependencies || []), newDep]}) : null);
                                }}>
                                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir plato..."/></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {allDishes.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-center text-slate-300"><ArrowRight className="w-6 h-6"/></div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold">Añadir este servicio...</Label>
                                <p className="text-xs text-muted-foreground p-3 bg-slate-50 rounded-xl italic">Selecciona el plato primero y luego edita el servicio requerido en la lista de arriba.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="max-w-5xl mx-auto flex justify-end">
            <Button onClick={handleSaveAll} disabled={isSaving} size="lg" className="rounded-2xl px-12 h-14 font-black text-base shadow-2xl shadow-primary/30">
                {isSaving ? <Loader2 className="animate-spin mr-3"/> : <Save className="w-5 h-5 mr-3"/>}
                {isSaving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN COMPLETA'}
            </Button>
        </div>
      </div>
    </div>
  );
}
