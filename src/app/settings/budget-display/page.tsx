'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Settings as SettingsIcon, Loader2, AlertTriangle, Percent, Info, Tag, Package, Bot, Sparkles, Code2, Wand2, PlusCircle, Trash2, ChevronDown, Edit, Gift, Search, ChefHat, Eye, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido, PlatoVisible, PromotionalDiscount, ServiceDependency } from '@/types/armado-rapido';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa as saveServicioEmpresaAction } from '@/app/actions/servicios-empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
import { MultiSelect } from '@/components/ui/multi-select'; 
import { saveBudgetDisplaySettings, getBudgetDisplaySettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings } from '@/types/settings';
import { ConfigFormItem } from '@/components/settings/ConfigFormItem';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

// Sub-component for editing a single service
const EditServicioForm: React.FC<{ servicioId: string | null; onUpdate: () => void, onClose: () => void }> = ({ servicioId, onUpdate, onClose }) => {
    const { toast } = useToast();
    const [servicio, setServicio] = useState<Partial<ServicioEmpresa> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (servicioId) {
            getServiciosEmpresa().then(servicios => {
                const s = servicios.find(s => s.id === servicioId);
                if (s) setServicio(s);
            });
        }
    }, [servicioId]);
    
    const handleSaveServicio = async (e: FormEvent) => {
        e.preventDefault();
        if (!servicio) return;
        setIsSaving(true);
        try {
            const result = await saveServicioEmpresaAction(servicio as ServicioEmpresa);
            if (result.success) {
                toast({ title: "Servicio actualizado" });
                onUpdate(); 
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!servicio) return <div className="p-4"><Loader2 className="w-5 h-5 animate-spin"/></div>;

    return (
        <form onSubmit={handleSaveServicio} className="py-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-servicio-nombre">Nombre</Label>
              <Input id="edit-servicio-nombre" value={servicio.nombre || ''} onChange={e => setServicio(s => s ? {...s, nombre: e.target.value} : null)}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-servicio-precio">Precio de Venta</Label>
              <Input id="edit-servicio-precio" type="number" value={servicio.precioVenta ?? servicio.precioPorPersona ?? servicio.precioBase ?? ''} onChange={e => {
                  const val = Number(e.target.value);
                  setServicio(s => s ? { ...s, precioVenta: val, precioPorPersona: val, precioBase: val } : null);
              }}/>
            </div>
             <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : 'Guardar Servicio'}</Button>
        </form>
    );
};

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
    };
};

export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [budgetSettings, setBudgetSettings] = useState<BudgetDisplaySettings | null>(null);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'paquete' | 'menu'>('paquete');
  const [currentItem, setCurrentItem] = useState<Partial<PaqueteArmadoRapido | MenuArmadoRapido> | null>(null);
  
  const [editingServicioId, setEditingServicioId] = useState<string | null>(null);
  const [servicioSearchTerm, setServicioSearchTerm] = useState('');
  const [gastronomiaSearchTerm, setGastronomiaSearchTerm] = useState('');
  const [newDependency, setNewDependency] = useState({ triggerServiceId: '', requiredServiceId: '' });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [armadoConfig, budgetSettingsData, serviciosData, menuData] = await Promise.all([
        getArmadoRapidoConfig(),
        getBudgetDisplaySettings(),
        getServiciosEmpresa(),
        getMenus()
      ]);
      setConfig(armadoConfig);
      setBudgetSettings(budgetSettingsData);
      setServiciosCatalogo(serviciosData.filter(s => s.tipoItem === 'Servicio'));
      setAllMenus(menuData);
    } catch(e: any) {
      setError("No se pudieron cargar los datos.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
    if (!config || !allMenus.length) {
      return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
    }
    const allDishes = allMenus.flatMap(m => m.items);
    const enhancedDishes = allDishes.map(item => ({
        ...item,
        precioVenta: item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100)),
    }));
    return { 
        entradasDisponibles: enhancedDishes.filter(item => item.type === 'Entrada').map(menuItemToServicioEmpresa), 
        principalesDisponibles: enhancedDishes.filter(item => item.type === 'Plato Principal').map(menuItemToServicioEmpresa), 
        menusNinoDisponibles: enhancedDishes.filter(item => item.type === 'Menú Infantil/Adolescente').map(menuItemToServicioEmpresa)
    };
  }, [config, allMenus]);

  const gastronomiaFiltrada = useMemo(() => {
      const lowerCaseSearch = gastronomiaSearchTerm.toLowerCase();
      if (!lowerCaseSearch) return { entradas: entradasDisponibles, principales: principalesDisponibles, infantiles: menusNinoDisponibles };
      return {
          entradas: entradasDisponibles.filter(e => e.nombre.toLowerCase().includes(lowerCaseSearch)),
          principales: principalesDisponibles.filter(p => p.nombre.toLowerCase().includes(lowerCaseSearch)),
          infantiles: menusNinoDisponibles.filter(m => m.nombre.toLowerCase().includes(lowerCaseSearch))
      };
  }, [gastronomiaSearchTerm, entradasDisponibles, principalesDisponibles, menusNinoDisponibles]);

  const handlePlatoVisibilityChange = async (platoId: string, visible: boolean) => {
    if (!config) return;
    const newPlatosVisibles = [...(config.platosVisibles || [])];
    const existingIndex = newPlatosVisibles.findIndex(p => p.id === platoId);
    if (existingIndex > -1) newPlatosVisibles[existingIndex] = { id: platoId, visible };
    else newPlatosVisibles.push({ id: platoId, visible });
    const newConfig = { ...config, platosVisibles: newPlatosVisibles };
    setConfig(newConfig);
    await saveArmadoRapidoConfig(newConfig);
  };

  const isPlatoVisible = (platoId: string) => {
    const setting = config?.platosVisibles?.find(p => p.id === platoId);
    return setting !== undefined ? setting.visible : true; 
  };

  const handleOpenModal = (type: 'paquete' | 'menu', item?: PaqueteArmadoRapido | MenuArmadoRapido) => {
    setModalType(type);
    setCurrentItem(item ? {...item, serviciosIncluidos: item.serviciosIncluidos || []} : { nombre: '', serviciosIncluidos: [] });
    setServicioSearchTerm(''); 
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.nombre || !config) return;
    setIsSaving(true);
    let updatedList = [...(modalType === 'paquete' ? config.paquetes : config.menus)];
    const newItem = { ...currentItem, id: currentItem.id || `new_${modalType}_${Date.now()}` } as any;
    const itemIndex = updatedList.findIndex(p => p.id === newItem.id);
    if(itemIndex > -1) updatedList[itemIndex] = newItem;
    else updatedList.push(newItem);
    const newConfig = { ...config, [modalType === 'paquete' ? 'paquetes' : 'menus']: updatedList };
    const result = await saveArmadoRapidoConfig(newConfig);
    if (result.success) {
        toast({ title: "Guardado con éxito" });
        setIsModalOpen(false);
        await loadData();
    }
    setIsSaving(false);
  };

  const handleBudgetSettingsSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!budgetSettings) return;
    setIsSaving(true);
    const result = await saveBudgetDisplaySettings(budgetSettings);
    if (result.success) toast({ title: "Ajustes de Presupuesto guardados" });
    setIsSaving(false);
  };

  if (isLoading || !config || !budgetSettings) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
           <DialogHeader><DialogTitle>{currentItem?.id ? 'Editar' : 'Nuevo'} {modalType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle></DialogHeader>
           {currentItem && (
                <form onSubmit={handleSaveItem} className="space-y-4 py-4">
                    <div className="space-y-1"><Label>Nombre</Label><Input value={currentItem.nombre || ''} onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} required/></div>
                    <Separator/>
                    <Label>Servicios Incluidos</Label>
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input placeholder="Buscar servicios..." value={servicioSearchTerm} onChange={(e) => setServicioSearchTerm(e.target.value)} className="pl-9"/></div>
                    <ScrollArea className="h-64 border rounded-md p-2">
                        {serviciosCatalogo.filter(s => s.nombre.toLowerCase().includes(servicioSearchTerm.toLowerCase())).map(s => (
                            <div key={s.id} className="flex items-center space-x-2 py-1.5 border-b last:border-b-0">
                                <Checkbox checked={currentItem.serviciosIncluidos?.some(si => si.id === s.id)} onCheckedChange={(checked) => {
                                    const servicios = currentItem.serviciosIncluidos || [];
                                    setCurrentItem(p => p ? ({...p, serviciosIncluidos: checked ? [...servicios, {id: s.id, esRegalo: false}] : servicios.filter(si => si.id !== s.id)}) : null);
                                }}/>
                                <Label className="text-sm font-normal flex-grow cursor-pointer">{s.nombre}</Label>
                            </div>
                        ))}
                    </ScrollArea>
                    <DialogFooter><Button type="submit" disabled={isSaving}>Guardar</Button></DialogFooter>
                </form>
           )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Simulador</h1></div>
        <Link href="/empresa/contabilidad" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

       <form onSubmit={handleBudgetSettingsSave}>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-xl">Ajustes Generales de Presupuestos</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Percent className="w-4 h-4" />Porcentaje de Ajuste Anual (%)</Label>
              <Input type="number" value={budgetSettings?.annualAdjustmentPercentage ?? ''} onChange={e => setBudgetSettings(s => s ? { ...s, annualAdjustmentPercentage: Number(e.target.value) } : null)} />
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Descuentos Promocionales</h4>
              {(budgetSettings.promotionalDiscounts || []).map((discount, index) => (
                <div key={discount.id} className="grid grid-cols-3 gap-3 items-end p-3 bg-muted/30 rounded-xl border relative group">
                    <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const updated = (budgetSettings.promotionalDiscounts || []).filter((_, i) => i !== index);
                        setBudgetSettings({ ...budgetSettings, promotionalDiscounts: updated });
                    }}><X className="w-3 h-3"/></Button>
                    <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre</Label><Input value={discount.name} onChange={e => {
                        const updated = [...(budgetSettings.promotionalDiscounts || [])];
                        updated[index].name = e.target.value;
                        setBudgetSettings({...budgetSettings, promotionalDiscounts: updated});
                    }}/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase">Tipo</Label><Select value={discount.type} onValueChange={v => {
                        const updated = [...(budgetSettings.promotionalDiscounts || [])];
                        updated[index].type = v as any;
                        setBudgetSettings({...budgetSettings, promotionalDiscounts: updated});
                    }}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="percentage">Porcentaje</SelectItem><SelectItem value="fixed">Fijo</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase">Valor</Label><Input type="number" value={discount.value} onChange={e => {
                        const updated = [...(budgetSettings.promotionalDiscounts || [])];
                        updated[index].value = Number(e.target.value);
                        setBudgetSettings({...budgetSettings, promotionalDiscounts: updated});
                    }}/></div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => {
                  const newDisc = { id: `promo_${Date.now()}`, name: '', type: 'percentage' as const, value: 0 };
                  setBudgetSettings({ ...budgetSettings, promotionalDiscounts: [...(budgetSettings.promotionalDiscounts || []), newDisc] });
              }}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Descuento</Button>
            </div>
          </CardContent>
          <CardFooter><Button type="submit" disabled={isSaving}>Guardar Ajustes Globales</Button></CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Visibilidad en Simulador</CardTitle>
          <div className="relative pt-4"><Search className="absolute left-3 top-7 h-4 w-4 text-slate-400"/><Input placeholder="Filtrar platos..." value={gastronomiaSearchTerm} onChange={e => setGastronomiaSearchTerm(e.target.value)} className="pl-10 h-12 rounded-xl bg-slate-50 border-none"/></div>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full space-y-2">
                {['entradas', 'principales', 'infantiles'].map(cat => (
                    <AccordionItem key={cat} value={cat} className="border rounded-xl px-4">
                        <AccordionTrigger className="uppercase font-black text-[10px] tracking-widest text-slate-500">{cat} ({(gastronomiaFiltrada as any)[cat].length})</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(gastronomiaFiltrada as any)[cat].map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                        <Label htmlFor={`v-${p.id}`} className="text-xs font-bold truncate pr-2">{p.nombre}</Label>
                                        <Switch id={`v-${p.id}`} checked={isPlatoVisible(p.id)} onCheckedChange={v => handlePlatoVisibilityChange(p.id, v)} className="scale-75" />
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-xl">Paquetes de Servicios</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => handleOpenModal('paquete')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete</Button>
            <div className="space-y-2">
              {config.paquetes.map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-2xl bg-white shadow-sm">
                    <div><p className="font-bold text-slate-800">{pkg.nombre}</p><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{pkg.serviciosIncluidos.length} servicios</p></div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleOpenModal('paquete', pkg)}>Editar</Button>
                        <Button variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={() => {
                            const updated = config.paquetes.filter(p => p.id !== pkg.id);
                            const newConfig = { ...config, paquetes: updated };
                            setConfig(newConfig);
                            saveArmadoRapidoConfig(newConfig);
                        }}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                </div>
              ))}
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
