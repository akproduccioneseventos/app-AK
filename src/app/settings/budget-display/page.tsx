
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Wand2, PlusCircle, Trash2, Search, Percent, Tag, X, Check, ChevronDown, Package, Edit, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServiceDependency } from '@/types/armado-rapido';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa as saveServicioEmpresaAction } from '@/app/actions/servicios-empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServicioEmpresa, AnyCategoria } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
import { saveBudgetDisplaySettings, getBudgetDisplaySettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings } from '@/types/settings';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
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

  const allAvailableItemsForSelection = useMemo(() => {
    const allDishes = allMenus.flatMap(m => m.items).map(item => menuItemToServicioEmpresa({
        ...item,
        precioVenta: item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100)),
    }));
    return [...serviciosCatalogo, ...allDishes];
  }, [serviciosCatalogo, allMenus]);

  const findItemName = useCallback((id: string) => {
      return allAvailableItemsForSelection.find(i => i.id === id)?.nombre || id;
  }, [allAvailableItemsForSelection]);

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

  const handleAddDependency = async () => {
      if (!config || !newDependency.triggerServiceId || !newDependency.requiredServiceId) return;
      const newDep: ServiceDependency = {
          id: `dep_${Date.now()}`,
          triggerServiceId: newDependency.triggerServiceId,
          requiredServiceId: newDependency.requiredServiceId,
      };
      const newConfig = { ...config, serviceDependencies: [...(config.serviceDependencies || []), newDep] };
      setConfig(newConfig);
      await saveArmadoRapidoConfig(newConfig);
      setNewDependency({ triggerServiceId: '', requiredServiceId: '' });
      toast({ title: "Dependencia añadida" });
  };

  const handleDeleteDependency = async (id: string) => {
      if (!config) return;
      const updated = (config.serviceDependencies || []).filter(d => d.id !== id);
      const newConfig = { ...config, serviceDependencies: updated };
      setConfig(newConfig);
      await saveArmadoRapidoConfig(newConfig);
      toast({ title: "Dependencia eliminada" });
  };

  if (isLoading || !config || !budgetSettings) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl border-none shadow-2xl">
           <DialogHeader><DialogTitle className="font-headline text-2xl">{currentItem?.id ? 'Editar' : 'Nuevo'} {modalType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle></DialogHeader>
           {currentItem && (
                <form onSubmit={handleSaveItem} className="space-y-6 py-4">
                    <div className="space-y-1.5"><Label className="text-xs uppercase font-black tracking-widest text-slate-400">Nombre del Paquete</Label><Input value={currentItem.nombre || ''} onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} className="h-12 rounded-xl bg-slate-50 border-none text-lg font-bold" required/></div>
                    
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Servicios Seleccionados ({currentItem.serviciosIncluidos?.length || 0})</Label>
                        <ScrollArea className="h-48 border rounded-2xl bg-slate-50 p-2">
                            {currentItem.serviciosIncluidos && currentItem.serviciosIncluidos.length > 0 ? (
                                <div className="space-y-2">
                                    {currentItem.serviciosIncluidos.map(si => (
                                        <div key={si.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                                            <div className="flex items-center gap-3">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50 rounded-lg" onClick={() => {
                                                    setCurrentItem(p => p ? ({...p, serviciosIncluidos: p.serviciosIncluidos?.filter(item => item.id !== si.id)}) : null);
                                                }}>
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                                <span className={cn("text-xs font-bold uppercase", si.esRegalo && "text-rose-600")}>{findItemName(si.id)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 pr-2">
                                                <Checkbox 
                                                    id={`regalo-${si.id}`} 
                                                    checked={si.esRegalo} 
                                                    onCheckedChange={(val) => {
                                                        setCurrentItem(p => p ? ({
                                                            ...p,
                                                            serviciosIncluidos: p.serviciosIncluidos?.map(item => item.id === si.id ? {...item, esRegalo: !!val} : item)
                                                        }) : null);
                                                    }}
                                                />
                                                <Label htmlFor={`regalo-${si.id}`} className="text-[9px] font-black uppercase text-slate-400 cursor-pointer">Es Regalo</Label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
                                    <Package className="w-8 h-8"/>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin servicios</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <Separator/>
                    <div className="space-y-3">
                        <Label className="text-sm font-bold">Añadir Servicios del Catálogo</Label>
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><Input placeholder="Buscar servicios..." value={servicioSearchTerm} onChange={(e) => setServicioSearchTerm(e.target.value)} className="pl-9 h-11 rounded-xl bg-slate-50 border-none"/></div>
                        <ScrollArea className="h-48 border rounded-xl p-2">
                            {allAvailableItemsForSelection.filter(s => s.nombre.toLowerCase().includes(servicioSearchTerm.toLowerCase())).map(s => (
                                <div key={s.id} className="flex items-center space-x-2 py-2 px-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                                    <Checkbox checked={currentItem.serviciosIncluidos?.some(si => si.id === s.id)} onCheckedChange={(checked) => {
                                        const servicios = currentItem.serviciosIncluidos || [];
                                        setCurrentItem(p => p ? ({...p, serviciosIncluidos: checked ? [...servicios, {id: s.id, esRegalo: false}] : servicios.filter(si => si.id !== s.id)}) : null);
                                    }}/>
                                    <Label className="text-sm font-medium flex-grow cursor-pointer">{s.nombre}</Label>
                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-slate-200">{s.categoria}</Badge>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                    <DialogFooter className="pt-2"><Button onClick={handleSaveItem} disabled={isSaving} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Guardar Paquete</Button></DialogFooter>
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
          <CardDescription>Usa los interruptores para activar o desactivar platos del simulador público. Los platos no se borrarán del catálogo.</CardDescription>
          <div className="relative pt-4"><Search className="absolute left-3 top-7 h-4 w-4 text-slate-400"/><Input placeholder="Filtrar platos..." value={gastronomiaSearchTerm} onChange={e => setGastronomiaSearchTerm(e.target.value)} className="pl-10 h-12 rounded-xl bg-slate-50 border-none"/></div>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full space-y-2">
                {['entradas', 'principales', 'infantiles'].map(cat => (
                    <AccordionItem key={cat} value={cat} className="border rounded-xl px-4">
                        <AccordionTrigger className="uppercase font-black text-[10px] tracking-widest text-slate-500">{cat} ({(gastronomiaFiltrada as any)[cat === 'entradas' ? 'entradas' : cat === 'principales' ? 'principales' : 'infantiles'].length})</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(gastronomiaFiltrada as any)[cat === 'entradas' ? 'entradas' : cat === 'principales' ? 'principales' : 'infantiles'].map((p: any) => (
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
          <CardHeader>
              <CardTitle className="font-headline text-xl">Paquetes de Servicios</CardTitle>
              <CardDescription>Configura los paquetes predefinidos que los clientes pueden elegir en el simulador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={() => handleOpenModal('paquete')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete</Button>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {config.paquetes.map(pkg => (
                <AccordionItem key={pkg.id} value={pkg.id} className="border rounded-3xl bg-white shadow-sm px-4 group hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="flex-1 hover:no-underline py-4">
                      <div className="flex flex-col items-start text-left space-y-1">
                        <p className="font-black text-slate-800 text-base uppercase tracking-tight">{pkg.nombre}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{pkg.serviciosIncluidos.length} servicios configurados</p>
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={(e) => { e.stopPropagation(); handleOpenModal('paquete', pkg); }}><Edit className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="text-destructive rounded-xl h-8 w-8 hover:bg-red-50" onClick={(e) => {
                            e.stopPropagation();
                            const updated = config.paquetes.filter(p => p.id !== pkg.id);
                            const newConfig = { ...config, paquetes: updated };
                            setConfig(newConfig);
                            saveArmadoRapidoConfig(newConfig);
                        }}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                  <AccordionContent className="pb-4 pt-0">
                    <ul className="space-y-2 border-t pt-4">
                        {pkg.serviciosIncluidos.map(s => (
                            <li key={s.id} className={cn(
                                "text-xs font-bold uppercase tracking-tight flex items-center justify-between p-2 rounded-xl transition-colors",
                                s.esRegalo ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                            )}>
                                <span className="flex items-center gap-2">
                                    {s.esRegalo ? <Gift className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                                    {findItemName(s.id)}
                                </span>
                                {s.esRegalo && <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">REGALO</span>}
                            </li>
                        ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
      </Card>

      <Card className="shadow-lg border-primary/20">
          <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                  <Package className="text-primary w-6 h-6"/> Dependencias Automáticas (Lógica de Negocio)
              </CardTitle>
              <CardDescription>
                  Define qué servicios se deben añadir automáticamente al seleccionar otro (ej: si el cliente elige Asado, sumar Asador).
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/30 p-4 rounded-2xl">
                  <div className="md:col-span-5 space-y-1.5">
                      <Label className="text-[10px] uppercase font-black tracking-widest">Si se elige...</Label>
                      <Select value={newDependency.triggerServiceId} onValueChange={v => setNewDependency(p => ({...p, triggerServiceId: v}))}>
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Elegir plato/servicio..."/></SelectTrigger>
                          <SelectContent>
                              {allAvailableItemsForSelection.map(i => <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="md:col-span-1 text-center pb-2 text-slate-400 font-bold">→</div>
                  <div className="md:col-span-5 space-y-1.5">
                      <Label className="text-[10px] uppercase font-black tracking-widest">Añadir automáticamente</Label>
                      <Select value={newDependency.requiredServiceId} onValueChange={v => setNewDependency(p => ({...p, requiredServiceId: v}))}>
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Elegir servicio..."/></SelectTrigger>
                          <SelectContent>
                              {serviciosCatalogo.map(i => <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="md:col-span-1">
                      <Button onClick={handleAddDependency} disabled={!newDependency.triggerServiceId || !newDependency.requiredServiceId} size="icon" className="h-10 w-10 rounded-xl">
                          <PlusCircle className="w-5 h-5"/>
                      </Button>
                  </div>
              </div>

              <div className="space-y-2">
                  {(config.serviceDependencies || []).map(dep => (
                      <div key={dep.id} className="flex items-center justify-between p-4 border rounded-2xl bg-white group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-3 text-sm font-bold">
                              <span className="text-primary">{findItemName(dep.triggerServiceId)}</span>
                              <span className="text-slate-300">activa a</span>
                              <span className="text-emerald-600">{findItemName(dep.requiredServiceId)}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDependency(dep.id)} className="text-destructive opacity-0 group-hover:opacity-100 rounded-xl">
                              <Trash2 className="w-4 h-4"/>
                          </Button>
                      </div>
                  ))}
                  {(config.serviceDependencies || []).length === 0 && (
                      <p className="text-center text-slate-400 py-8 text-xs font-medium italic">No hay dependencias configuradas.</p>
                  )}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
