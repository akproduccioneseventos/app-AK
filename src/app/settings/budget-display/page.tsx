

'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Settings as SettingsIcon, Loader2, AlertTriangle, Percent, Info, Tag, Package, Bot, Sparkles, Code2, Wand2, PlusCircle, Trash2, ChevronDown, Edit, Gift, Search, ChefHat, Eye } from 'lucide-react';
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


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const getCalculationMethodLabel = (method?: string): string => {
    switch (method) {
        case 'fijo': return 'Precio Fijo';
        case 'porPersona': return 'Por Persona';
        case 'ratio': return 'Por Ratio de Invitados';
        case 'tramos': return 'Por Tramos de Invitados';
        default: return 'No definido';
    }
};

// Sub-component for editing a single service, to be used inside the Sheet
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
        } else {
            setServicio(null);
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
                onUpdate(); // This should trigger a refresh in the parent
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
              <Label htmlFor="edit-servicio-precio">Precio de Venta (Fijo/Por Persona/Base)</Label>
              <Input id="edit-servicio-precio" type="number" value={servicio.precioVenta ?? servicio.precioPorPersona ?? servicio.precioBase ?? ''} onChange={e => {
                  const val = Number(e.target.value);
                  setServicio(s => s ? { ...s, precioVenta: val, precioPorPersona: val, precioBase: val } : null);
              }}/>
            </div>
             <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Guardar Servicio'}</Button>
        </form>
    );
};

const menuItemToServicioEmpresa = (item: MenuItem & { precioVenta: number }): ServicioEmpresa => {
    const precioVenta = item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100));
    return {
        id: item.id,
        nombre: item.name,
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: item.type,
        calculationMethod: 'porPersona',
        precioPorPersona: precioVenta,
        precioVenta: precioVenta,
        precioBase: precioVenta,
        valorUnitarioEstimado: item.totalDishCost,
    };
};

const renderServiciosList = (servicios: ServicioIncluidoArmadoRapido[], catalogo: ServicioEmpresa[]) => {
    if (servicios.length === 0) {
      return <p className="text-xs text-muted-foreground italic">No hay servicios base en este paquete.</p>;
    }
    return (
      <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
        {servicios.map(servicio => {
          const fullServicio = catalogo.find(s => s.id === servicio.id);
          return <li key={servicio.id}>{fullServicio?.nombre || `ID: ${servicio.id} (no encontrado)`}</li>;
        })}
      </ul>
    );
};


export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [budgetSettings, setBudgetSettings] = useState<BudgetDisplaySettings | null>(null);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'paquete' | 'menu'>('paquete');
  const [currentItem, setCurrentItem] = useState<Partial<PaqueteArmadoRapido | MenuArmadoRapido> | null>(null);
  
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false);
  const [editingServicioId, setEditingServicioId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [servicioSearchTerm, setServicioSearchTerm] = useState('');
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);

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
      setError("No se pudieron cargar los datos de configuración.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
    const handleAddDependency = async () => {
    if (!newDependency.triggerServiceId || !newDependency.requiredServiceId || !config) return;
    
    const newDep: ServiceDependency = {
      id: `dep_${Date.now()}`,
      ...newDependency
    };
    
    const newConfig: ArmadoRapidoConfig = {
      ...config,
      serviceDependencies: [...(config.serviceDependencies || []), newDep]
    };
    
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(newConfig);
      if (result.success) {
        toast({ title: "Dependencia añadida" });
        setNewDependency({ triggerServiceId: '', requiredServiceId: '' });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    if (!config) return;

    const newConfig: ArmadoRapidoConfig = {
      ...config,
      serviceDependencies: (config.serviceDependencies || []).filter(d => d.id !== dependencyId)
    };

    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(newConfig);
      if (result.success) {
        toast({ title: "Dependencia eliminada" });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
    if (!config || !allMenus.length) {
      return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
    }
    
    const isPlatoVisible = (platoId: string) => {
        const setting = config.platosVisibles?.find(p => p.id === platoId);
        return setting !== undefined ? setting.visible : true;
    };
    
    const sortByPrice = (a: { precioVenta: number }, b: { precioVenta: number }) => a.precioVenta - b.precioVenta;
    
    const allDishes = Array.from(
        allMenus.flatMap(m => m.items)
        .reduce((map, dish) => {
            if (!map.has(dish.id)) {
                map.set(dish.id, dish);
            }
            return map;
        }, new Map<string, MenuItem>())
        .values()
    );
    
    const visibleDishes = allDishes.filter(d => isPlatoVisible(d.id));

    const lowerCaseSearch = gastronomiaSearchTerm.toLowerCase();
    const filteredDishes = gastronomiaSearchTerm.trim() === ''
        ? visibleDishes 
        : visibleDishes.filter(d => d.name.toLowerCase().includes(lowerCaseSearch));
    
    const enhancedDishes = filteredDishes.map(item => ({
        ...item,
        precioVenta: item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100)),
    }));

    return { 
        entradasDisponibles: enhancedDishes.filter(item => item.type === 'Entrada').map(menuItemToServicioEmpresa).sort(sortByPrice), 
        principalesDisponibles: enhancedDishes.filter(item => item.type === 'Plato Principal').map(menuItemToServicioEmpresa).sort(sortByPrice), 
        menusNinoDisponibles: enhancedDishes.filter(item => item.type === 'Menú Infantil/Adolescente').map(menuItemToServicioEmpresa).sort(sortByPrice)
    };
}, [config, allMenus]);
  

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleOpenModal = (type: 'paquete' | 'menu', item?: PaqueteArmadoRapido | MenuArmadoRapido) => {
    setModalType(type);
    setCurrentItem(item ? {...item, serviciosIncluidos: item.serviciosIncluidos || []} : { nombre: '', serviciosIncluidos: [] });
    setServicioSearchTerm(''); // Reset search on modal open
    setIsModalOpen(true);
  };
  
  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.nombre || !config) return;
    setIsSaving(true);
    
    let updatedList;
    const newItem = {
      ...currentItem,
      id: currentItem.id || `new_${modalType}_${Date.now()}`
    } as PaqueteArmadoRapido | MenuArmadoRapido;

    if (modalType === 'paquete') {
        updatedList = [...config.paquetes];
    } else {
        updatedList = [...config.menus];
    }

    const itemIndex = updatedList.findIndex(p => p.id === newItem.id);
    if(itemIndex > -1) {
        updatedList[itemIndex] = newItem;
    } else {
        updatedList.push(newItem);
    }
    
    const newConfig: ArmadoRapidoConfig = {
      ...config,
      [modalType === 'paquete' ? 'paquetes' : 'menus']: updatedList
    };

    try {
        const result = await saveArmadoRapidoConfig(newConfig);
        if (result.success) {
            toast({ title: `${modalType === 'paquete' ? 'Paquete' : 'Menú'} guardado` });
            setIsModalOpen(false);
            await loadData();
        } else {
            throw new Error(result.error);
        }
    } catch (err: any) {
      toast({ title: `Error al guardar ${modalType}`, description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteItem = async (type: 'paquete' | 'menu', itemId: string) => {
    if (!config) return;
    setIsSaving(true);
    let updatedList;
    if (type === 'paquete') {
      updatedList = config.paquetes.filter(p => p.id !== itemId);
    } else {
      updatedList = config.menus.filter(m => m.id !== itemId);
    }
    const newConfig = { ...config, [type === 'paquete' ? 'paquetes' : 'menus']: updatedList };
    try {
      const result = await saveArmadoRapidoConfig(newConfig);
      if (result.success) {
        toast({ title: `${type === 'paquete' ? 'Paquete' : 'Menú'} Eliminado`, variant: "destructive" });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: `Error al eliminar ${type}`, description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleServicioChange = (servicioId: string, checked: boolean) => {
    setCurrentItem(prev => {
      if(!prev) return null;
      const servicios = prev.serviciosIncluidos || [];
      if(checked) {
        if(!servicios.some(s => s.id === servicioId)) {
          return { ...prev, serviciosIncluidos: [...servicios, { id: servicioId, esRegalo: false }] };
        }
      } else {
        return { ...prev, serviciosIncluidos: servicios.filter(s => s.id !== servicioId) };
      }
      return prev;
    });
  };

  const handleRegaloChange = (servicioId: string, esRegalo: boolean) => {
     setCurrentItem(prev => {
      if(!prev) return null;
      return { ...prev, serviciosIncluidos: (prev.serviciosIncluidos || []).map(s => s.id === servicioId ? {...s, esRegalo} : s) };
    });
  };

  const handlePlatoVisibilityChange = async (platoId: string, visible: boolean) => {
    if (!config) return;

    const newPlatosVisibles = [...(config.platosVisibles || [])];
    const existingIndex = newPlatosVisibles.findIndex(p => p.id === platoId);

    if (existingIndex > -1) {
        newPlatosVisibles[existingIndex] = { id: platoId, visible };
    } else {
        newPlatosVisibles.push({ id: platoId, visible });
    }

    const newConfig = { ...config, platosVisibles: newPlatosVisibles };
    
    // Optimistic UI update
    setConfig(newConfig);

    try {
        await saveArmadoRapidoConfig(newConfig);
    } catch (err: any) {
        toast({ title: "Error", description: "No se pudo guardar el cambio de visibilidad.", variant: "destructive" });
        loadData(); // Revert on error
    }
  };

  const isPlatoVisible = (platoId: string) => {
    const setting = config?.platosVisibles?.find(p => p.id === platoId);
    return setting ? setting.visible : true; // Default to visible if not set
  };

  const getVisibleDishes = (dishList: (ServicioEmpresa)[]) => {
    return dishList; // Show all dishes, visibility is handled by the switch
  };
  
  const serviciosFiltrados = useMemo(() => {
    if (!servicioSearchTerm) return serviciosCatalogo;
    const lowerCaseSearch = servicioSearchTerm.toLowerCase();
    return serviciosCatalogo.filter(s =>
      s.nombre.toLowerCase().includes(lowerCaseSearch) ||
      s.categoria?.toLowerCase().includes(lowerCaseSearch) ||
      s.subcategoria?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [servicioSearchTerm, serviciosCatalogo]);

  const serviciosAgrupadosParaPaquetes = useMemo(() => {
    return serviciosFiltrados.reduce((acc, servicio) => {
        const categoria = servicio.categoria || 'Otros';
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(servicio);
        return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [serviciosFiltrados]);

  const categoriasOrdenadasParaPaquetes = useMemo(() => Object.keys(serviciosAgrupadosParaPaquetes).sort(), [serviciosAgrupadosParaPaquetes]);

  const handleConfigSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(config);
      if (result.success) {
        toast({ title: "Configuración guardada" });
        await loadData();
      } else throw new Error(result.error);
    } catch(err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBudgetSettingsSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!budgetSettings) return;
    setIsSaving(true);
    try {
      const result = await saveBudgetDisplaySettings(budgetSettings);
      if (result.success) {
        toast({ title: "Configuración de Presupuestos guardada" });
        setBudgetSettings(result.settings || null);
      } else throw new Error(result.error);
    } catch(err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscountChange = (index: number, field: keyof PromotionalDiscount, value: any) => {
    if (!budgetSettings) return;
    const updatedDiscounts = [...(budgetSettings.promotionalDiscounts || [])];
    updatedDiscounts[index] = { ...updatedDiscounts[index], [field]: value };
    setBudgetSettings({ ...budgetSettings, promotionalDiscounts: updatedDiscounts });
  };
  
  const addDiscount = () => {
    if (!budgetSettings) return;
    const newDiscount: PromotionalDiscount = { id: `promo_${Date.now()}`, name: '', type: 'percentage', value: 0 };
    setBudgetSettings({ ...budgetSettings, promotionalDiscounts: [...(budgetSettings.promotionalDiscounts || []), newDiscount] });
  };
  
  const removeDiscount = (index: number) => {
    if (!budgetSettings) return;
    const updatedDiscounts = (budgetSettings.promotionalDiscounts || []).filter((_, i) => i !== index);
    setBudgetSettings({ ...budgetSettings, promotionalDiscounts: updatedDiscounts });
  };

  if (isLoading || !config || !budgetSettings) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="text-center text-destructive py-10"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold text-lg">{error}</p><Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button></div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
           <DialogHeader>
                <DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Nuevo'} {modalType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle>
                <DialogDescription>
                    {modalType === 'paquete' ? 'Define el nombre y los servicios que se incluirán en este paquete.' : 'Define un nombre y selecciona los platos que conformarán este menú para el simulador.'}
                </DialogDescription>
            </DialogHeader>
                <Sheet open={!!editingServicioId} onOpenChange={(open) => !open && setEditingServicioId(null)}>
                <SheetContent className="w-full max-w-none sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Editar Servicio</SheetTitle>
                    <SheetDescription>
                      Realiza cambios en el catálogo maestro. Esto afectará a futuros presupuestos.
                    </SheetDescription>
                  </SheetHeader>
                    {editingServicioId && (
                        <EditServicioForm 
                          servicioId={editingServicioId}
                          onUpdate={async () => {
                              await loadData(); // Refresh all data in parent
                          }}
                          onClose={() => setEditingServicioId(null)}
                        />
                    )}
                </SheetContent>
                
                {currentItem && (
                    <form onSubmit={handleSaveItem}>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 py-4">
                        <div className="space-y-1"><Label htmlFor="item-name">Nombre del {modalType === 'paquete' ? 'Paquete' : 'Menú'}</Label><Input id="item-name" value={currentItem.nombre || ''} onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} required/></div>
                        <Separator/>
                        <Label>Servicios Incluidos</Label>
                        
                        {modalType === 'paquete' && (
                            <>
                                { (currentItem.serviciosIncluidos || []).length > 0 && (
                                    <div className="p-3 border rounded-md space-y-3">
                                        <h4 className="text-sm font-medium">Servicios en este paquete</h4>
                                        { (currentItem.serviciosIncluidos || []).map(servicioInfo => {
                                            const servicio = serviciosCatalogo.find(s => s.id === servicioInfo.id);
                                            if (!servicio) return null;
                                            return (
                                                <div key={servicio.id} className="flex items-center justify-between text-sm p-2 border-b last:border-b-0">
                                                    <div>
                                                        <p className="font-medium">{servicio.nombre}</p>
                                                        <p className="text-xs text-muted-foreground">{servicio.categoria}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1.5"><Checkbox id={`gift-${servicio.id}`} checked={servicioInfo.esRegalo} onCheckedChange={(checked) => handleRegaloChange(servicio.id, !!checked)} /><Label htmlFor={`gift-${servicio.id}`} className="text-xs">Regalo</Label></div>
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleServicioChange(servicio.id, false)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Añadir servicios desde el catálogo</h4>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                        <Input 
                                            placeholder="Buscar servicios..."
                                            value={servicioSearchTerm}
                                            onChange={(e) => setServicioSearchTerm(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <ScrollArea className="h-64 border rounded-md p-2">
                                        <div className="space-y-2">
                                            {categoriasOrdenadasParaPaquetes.map(categoria => {
                                                const itemsToShow = serviciosAgrupadosParaPaquetes[categoria];
                                                if (!itemsToShow || itemsToShow.length === 0) return null;
                                                return (
                                                    <div key={categoria} className="space-y-1">
                                                        <h5 className="font-semibold text-xs uppercase text-muted-foreground">{categoria}</h5>
                                                        {itemsToShow.map(servicio => {
                                                            const isInItem = currentItem.serviciosIncluidos?.some(s => s.id === servicio.id);
                                                            return (
                                                                <div key={servicio.id} className="flex items-center space-x-2 py-1">
                                                                    <Checkbox id={`serv-${servicio.id}`} checked={isInItem} onCheckedChange={(checked) => handleServicioChange(servicio.id, !!checked)} />
                                                                    <Label htmlFor={`serv-${servicio.id}`} className="text-sm font-normal flex-grow cursor-pointer">{servicio.nombre}</Label>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar</Button>
                    </DialogFooter>
                    </form>
                )}
              </Sheet>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Simulador</h1></div>
        <Link href="/empresa/contabilidad" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver al Panel Contable</Button></Link>
      </div>

       <form onSubmit={handleConfigSave}>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Ajustes Generales del Simulador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="descuento-general" className="flex items-center gap-2"><Percent className="w-4 h-4"/>Porcentaje de Descuento Ficticio (Ancla) (%)</Label>
                    <Input
                        id="descuento-general"
                        type="number"
                        value={config?.descuentoGeneral ?? ''}
                        onChange={e => setConfig(c => c ? {...c, descuentoGeneral: Number(e.target.value)} : null)}
                        placeholder="Ej: 15"
                    />
                    <p className="text-xs text-muted-foreground">Este es el porcentaje que se mostrará como 'descuento' en el simulador. El sistema aumentará el 'Valor de servicios' para que, tras aplicar este descuento, el total a pagar sea el precio real del catálogo.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="mostrar-precios"
                        checked={config?.mostrarPrecios ?? true}
                        onCheckedChange={checked => setConfig(c => c ? { ...c, mostrarPrecios: checked } : null)}
                    />
                    <Label htmlFor="mostrar-precios">Mostrar precios individuales en la selección de gastronomía</Label>
                </div>
            </CardContent>
             <CardFooter>
                 <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Guardar Ajustes Generales</Button>
            </CardFooter>
        </Card>
      </form>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Dependencias de Servicios</CardTitle>
          <CardDescription>
            Configura reglas para que al seleccionar un plato, otro servicio (ej. "Asado" → "Asador") se añada automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/40 space-y-3">
                <h4 className="font-medium">Añadir Nueva Dependencia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1">
                        <Label htmlFor="trigger-service">Cuando se elija el plato...</Label>
                        <Select value={newDependency.triggerServiceId} onValueChange={(val) => setNewDependency(p => ({ ...p, triggerServiceId: val }))}>
                            <SelectTrigger id="trigger-service"><SelectValue placeholder="Seleccionar plato..." /></SelectTrigger>
                            <SelectContent>
                                {allMenus.map(menu => (
                                    <SelectGroup key={menu.id}>
                                        <SelectLabel>{menu.name}</SelectLabel>
                                        {menu.items.map(item => (
                                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="required-service">Añadir automáticamente el servicio...</Label>
                        <Select value={newDependency.requiredServiceId} onValueChange={(val) => setNewDependency(p => ({ ...p, requiredServiceId: val }))}>
                            <SelectTrigger id="required-service"><SelectValue placeholder="Seleccionar servicio..." /></SelectTrigger>
                            <SelectContent>
                                {serviciosCatalogo.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleAddDependency} disabled={!newDependency.triggerServiceId || !newDependency.requiredServiceId || isSaving}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Añadir Dependencia
                </Button>
            </div>
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Reglas Actuales:</h4>
                {config?.serviceDependencies?.length > 0 ? (
                    config.serviceDependencies.map(dep => {
                        const trigger = allMenus.flatMap(m => m.items).find(i => i.id === dep.triggerServiceId);
                        const required = serviciosCatalogo.find(s => s.id === dep.requiredServiceId);
                        return (
                            <div key={dep.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                                <div className="flex items-center gap-2">
                                    <span>
                                        <span className="font-semibold">{trigger?.name || <span className='text-destructive'>Plato no encontrado</span>}</span> activa a <span className="font-semibold">{required?.name || <span className='text-destructive'>Servicio no encontrado</span>}</span>
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteDependency(dep.id)} disabled={isSaving}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-xs text-center text-muted-foreground py-2">No hay dependencias configuradas.</p>
                )}
            </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Gestión Gastronómica del Simulador</CardTitle>
          <CardDescription>
            Activa o desactiva los platos que estarán disponibles en el simulador. Los platos se gestionan en el <Link href="/empresa/menus" className="text-primary underline hover:text-primary/80">Planificador Gastronómico Maestro</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Accordion type="multiple" defaultValue={['visibility']} className="w-full space-y-4">
              <AccordionItem value="visibility" className="border rounded-md shadow-sm">
                  <AccordionTrigger className="px-3 text-md font-medium hover:no-underline">Visibilidad de Platos</AccordionTrigger>
                  <AccordionContent className="p-3 border-t">
                       <Accordion type="multiple" defaultValue={['entradas']} className="w-full space-y-2">
                        <AccordionItem value="entradas" className="border rounded-md"><AccordionTrigger className="px-3 text-sm font-medium hover:no-underline">Entradas</AccordionTrigger><AccordionContent className="p-3 border-t"><div className="grid grid-cols-2 gap-x-4 gap-y-2">{getVisibleDishes(entradasDisponibles).map(plato => (<div key={plato.id} className="flex items-center space-x-2"><Switch id={`vis-${plato.id}`} checked={isPlatoVisible(plato.id)} onCheckedChange={(v) => handlePlatoVisibilityChange(plato.id, v)}/><Label htmlFor={`vis-${plato.id}`} className="text-xs">{plato.nombre} ({formatCurrency(plato.precioPorPersona || 0)})</Label></div>))}</div></AccordionContent></AccordionItem>
                        <AccordionItem value="principales" className="border rounded-md"><AccordionTrigger className="px-3 text-sm font-medium hover:no-underline">Platos Principales</AccordionTrigger><AccordionContent className="p-3 border-t"><div className="grid grid-cols-2 gap-x-4 gap-y-2">{getVisibleDishes(principalesDisponibles).map(plato => (<div key={plato.id} className="flex items-center space-x-2"><Switch id={`vis-${plato.id}`} checked={isPlatoVisible(plato.id)} onCheckedChange={(v) => handlePlatoVisibilityChange(plato.id, v)}/><Label htmlFor={`vis-${plato.id}`} className="text-xs">{plato.nombre} ({formatCurrency(plato.precioPorPersona || 0)})</Label></div>))}</div></AccordionContent></AccordionItem>
                        <AccordionItem value="infantiles" className="border rounded-md"><AccordionTrigger className="px-3 text-sm font-medium hover:no-underline">Menús Infantiles/Adolescentes</AccordionTrigger><AccordionContent className="p-3 border-t"><div className="grid grid-cols-2 gap-x-4 gap-y-2">{getVisibleDishes(menusNinoDisponibles).map(plato => (<div key={plato.id} className="flex items-center space-x-2"><Switch id={`vis-${plato.id}`} checked={isPlatoVisible(plato.id)} onCheckedChange={(v) => handlePlatoVisibilityChange(plato.id, v)}/><Label htmlFor={`vis-${plato.id}`} className="text-xs">{plato.nombre} ({formatCurrency(plato.precioPorPersona || 0)})</Label></div>))}</div></AccordionContent></AccordionItem>
                      </Accordion>
                  </AccordionContent>
              </AccordionItem>
           </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes de Servicios para Simulador</CardTitle>
            <CardDescription>Crea y gestiona paquetes de servicios predefinidos (discoteca, decoración, etc.) para el simulador de clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => handleOpenModal('paquete')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete</Button>
            <Separator/>
            <Accordion type="multiple" className="w-full space-y-3">
              {config.paquetes.map(pkg => {
                const serviciosNormales = (pkg.serviciosIncluidos || []).filter(s => !s.esRegalo);
                const serviciosRegalo = (pkg.serviciosIncluidos || []).filter(s => s.esRegalo);
                return (
                <AccordionItem key={pkg.id} value={pkg.id} className="border rounded-md shadow-sm">
                    <div className="flex items-center p-3">
                        <AccordionTrigger className="hover:no-underline flex-1 text-left font-semibold text-sm">{pkg.nombre}</AccordionTrigger>
                        <div className="flex gap-2 pl-2">
                           <Button variant="outline" size="sm" onClick={() => handleOpenModal('paquete', pkg)}>Editar</Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('paquete', pkg.id)} disabled={isSaving}>Eliminar</Button>
                        </div>
                    </div>
                    <AccordionContent className="p-3 border-t">
                      {renderServiciosList(serviciosNormales, serviciosCatalogo)}
                      {serviciosRegalo.length > 0 && (
                        <>
                          <Separator className="my-2"/>
                          <h5 className="font-semibold text-xs uppercase text-green-600 flex items-center gap-1.5"><Gift className="w-3.5 h-3.5"/>Regalos</h5>
                          {renderServiciosList(serviciosRegalo, serviciosCatalogo)}
                        </>
                      )}
                    </AccordionContent>
                </AccordionItem>
                )
              })}
            </Accordion>