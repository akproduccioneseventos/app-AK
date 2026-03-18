
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
    ArrowLeft, ArrowRight, Save, Loader2, Wand2, PlusCircle, Trash2, 
    Search, Percent, Tag, X, Check, ChevronDown, Package, Edit, 
    Gift, Copy, ChefHat, Info, Zap, Link2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServiceDependency } from '@/types/armado-rapido';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServicioEmpresa } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
import { saveBudgetDisplaySettings, getBudgetDisplaySettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings } from '@/types/settings';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  const handleBudgetSettingsSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!budgetSettings) return;
    setIsSaving(true);
    const result = await saveBudgetDisplaySettings(budgetSettings);
    if (result.success) toast({ title: "Ajustes de Presupuesto guardados" });
    setIsSaving(false);
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

  const handleDuplicatePackage = async (paquete: PaqueteArmadoRapido) => {
    if (!config) return;
    const newPaquete: PaqueteArmadoRapido = {
      ...paquete,
      id: `pkg_copy_${Date.now()}`,
      nombre: `[COPIA] ${paquete.nombre}`,
    };
    const newConfig = { ...config, paquetes: [...config.paquetes, newPaquete] };
    setConfig(newConfig);
    const result = await saveArmadoRapidoConfig(newConfig);
    if (result.success) {
      toast({ title: "Paquete duplicado" });
      await loadData();
    }
  };

  const handlePlatoVisibilityChange = async (platoId: string, visible: boolean) => {
    if (!config) return;
    const currentList = config.platosVisibles || [];
    const index = currentList.findIndex(p => p.id === platoId);
    let newList = [...currentList];
    if (index > -1) newList[index] = { id: platoId, visible };
    else newList.push({ id: platoId, visible });
    
    const newConfig = { ...config, platosVisibles: newList };
    setConfig(newConfig);
    await saveArmadoRapidoConfig(newConfig);
  };

  const handleAddDependency = async (triggerId: string, requiredId: string) => {
    if (!config) return;
    const newDep: ServiceDependency = {
        id: `dep_${Date.now()}`,
        triggerServiceId: triggerId,
        requiredServiceId: requiredId
    };
    const newConfig = { ...config, serviceDependencies: [...(config.serviceDependencies || []), newDep] };
    setConfig(newConfig);
    const result = await saveArmadoRapidoConfig(newConfig);
    if (result.success) toast({ title: "Regla inteligente creada" });
  };

  const handleDeleteDependency = async (depId: string) => {
    if (!config) return;
    const newConfig = { ...config, serviceDependencies: config.serviceDependencies?.filter(d => d.id !== depId) };
    setConfig(newConfig);
    await saveArmadoRapidoConfig(newConfig);
    toast({ title: "Regla eliminada" });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-32">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
           <DialogHeader className="p-6 pb-2">
             <DialogTitle className="text-2xl font-headline">{currentItem?.id ? 'Editar' : 'Nuevo'} {modalType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle>
           </DialogHeader>
           
           {currentItem && (
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form id="package-form" onSubmit={handleSaveItem} className="space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Nombre del Paquete</Label>
                            <Input 
                                value={currentItem.nombre || ''} 
                                onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} 
                                className="h-12 rounded-xl bg-slate-50 border-none text-lg font-bold" 
                                required
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Servicios Seleccionados ({currentItem.serviciosIncluidos?.length || 0})</Label>
                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-xl p-2 bg-slate-50/50">
                                {currentItem.serviciosIncluidos?.map(si => {
                                    const original = allAvailableItemsForSelection.find(i => i.id === si.id);
                                    return (
                                        <div key={si.id} className="flex items-center justify-between p-2 bg-white rounded-lg border shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                                                    setCurrentItem(prev => prev ? ({...prev, serviciosIncluidos: prev.serviciosIncluidos?.filter(item => item.id !== si.id)}) : null);
                                                }}><Trash2 className="w-4 h-4"/></Button>
                                                <span className="text-sm font-bold">{original?.nombre || si.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox 
                                                    id={`regalo-${si.id}`} 
                                                    checked={si.esRegalo} 
                                                    onCheckedChange={(val) => {
                                                        setCurrentItem(prev => prev ? ({
                                                            ...prev,
                                                            serviciosIncluidos: prev.serviciosIncluidos?.map(item => item.id === si.id ? {...item, esRegalo: !!val} : item)
                                                        }) : null);
                                                    }}
                                                />
                                                <Label htmlFor={`regalo-${si.id}`} className="text-[10px] font-bold uppercase cursor-pointer">Regalo</Label>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!currentItem.serviciosIncluidos || currentItem.serviciosIncluidos.length === 0) && (
                                    <p className="text-center py-8 text-xs text-muted-foreground italic">Sin servicios seleccionados</p>
                                )}
                            </div>
                        </div>

                        <Separator/>
                        
                        <div className="space-y-3">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <PlusCircle className="w-4 h-4 text-primary"/> Añadir Servicios del Catálogo
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                <Input 
                                    placeholder="Buscar servicios..." 
                                    value={servicioSearchTerm} 
                                    onChange={(e) => setServicioSearchTerm(e.target.value)} 
                                    className="pl-9 h-11 rounded-xl bg-slate-50 border-none shadow-inner"
                                />
                            </div>
                            <ScrollArea className="h-64 border rounded-2xl p-2 bg-white">
                                {allAvailableItemsForSelection.filter(s => s.nombre.toLowerCase().includes(servicioSearchTerm.toLowerCase())).map(s => (
                                    <div key={s.id} className="flex items-center space-x-2 py-2 px-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                                        <Checkbox 
                                            id={`catalog-${s.id}`}
                                            checked={currentItem.serviciosIncluidos?.some(si => si.id === s.id)} 
                                            onCheckedChange={(checked) => {
                                                setCurrentItem(prev => {
                                                    if (!prev) return null;
                                                    const servicios = prev.serviciosIncluidos || [];
                                                    return {
                                                        ...prev,
                                                        serviciosIncluidos: checked 
                                                            ? [...servicios, {id: s.id, esRegalo: false}] 
                                                            : servicios.filter(si => si.id !== s.id)
                                                    };
                                                });
                                            }}
                                        />
                                        <Label htmlFor={`catalog-${s.id}`} className="text-sm font-medium flex-grow cursor-pointer">{s.nombre}</Label>
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter">{s.categoria}</Badge>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </form>
                </div>
           )}

           <DialogFooter className="p-6 border-t bg-slate-50/50">
                <Button type="submit" form="package-form" disabled={isSaving} className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20">
                    {isSaving ? <Loader2 className="animate-spin mr-3"/> : <Save className="w-5 h-5 mr-3"/>}
                    GUARDAR CAMBIOS
                </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white">
                <Wand2 className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight font-headline uppercase">Simulador de Presupuestos</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuración Maestra</p>
            </div>
        </div>
        <Link href="/empresa/contabilidad" passHref><Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

      <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100"><CardTitle className="font-headline text-xl text-slate-800">Ajustes del Simulador</CardTitle></CardHeader>
        <CardContent className="p-8 space-y-8">
            <form onSubmit={handleBudgetSettingsSave} className="space-y-6">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"><Percent className="w-4 h-4 text-primary" />Porcentaje de Ajuste Anual (%)</Label>
                    <Input type="number" value={budgetSettings?.annualAdjustmentPercentage ?? ''} onChange={e => setBudgetSettings(s => s ? { ...s, annualAdjustmentPercentage: Number(e.target.value) } : null)} className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-lg font-bold" />
                </div>
                <div className="flex justify-end"><Button type="submit" disabled={isSaving} className="rounded-xl font-bold">Actualizar Globales</Button></div>
            </form>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Descuentos Promocionales</h4>
              <div className="grid grid-cols-1 gap-3">
                {(budgetSettings?.promotionalDiscounts || []).map((discount, index) => (
                    <div key={discount.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white border shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => {
                            setBudgetSettings(prev => {
                                if (!prev) return null;
                                const updated = (prev.promotionalDiscounts || []).filter((_, i) => i !== index);
                                return { ...prev, promotionalDiscounts: updated };
                            });
                        }}><X className="w-4 h-4"/></Button>
                        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Nombre</Label><Input value={discount.name} onChange={e => {
                            setBudgetSettings(prev => {
                                if (!prev) return null;
                                const updated = [...(prev.promotionalDiscounts || [])];
                                updated[index].name = e.target.value;
                                return { ...prev, promotionalDiscounts: updated };
                            });
                        }} className="rounded-lg h-9 bg-white"/></div>
                        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Tipo</Label><Select value={discount.type} onValueChange={v => {
                            setBudgetSettings(prev => {
                                if (!prev) return null;
                                const updated = [...(prev.promotionalDiscounts || [])];
                                updated[index].type = v as any;
                                return { ...prev, promotionalDiscounts: updated };
                            });
                        }}><SelectTrigger className="rounded-lg h-9 bg-white"><SelectValue/></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="percentage">Porcentaje (%)</SelectItem><SelectItem value="fixed">Monto Fijo ($)</SelectItem></SelectContent></Select></div>
                        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Valor</Label><Input type="number" value={discount.value} onChange={e => {
                            setBudgetSettings(prev => {
                                if (!prev) return null;
                                const updated = [...(prev.promotionalDiscounts || [])];
                                updated[index].value = Number(e.target.value);
                                return { ...prev, promotionalDiscounts: updated };
                            });
                        }} className="rounded-lg h-9 bg-white font-bold"/></div>
                    </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold border-dashed border-primary/30 text-primary" onClick={() => {
                  const newDisc = { id: `promo_${Date.now()}`, name: 'Nueva Promo', type: 'percentage' as const, value: 0 };
                  setBudgetSettings(prev => {
                      if (!prev) return null;
                      return { ...prev, promotionalDiscounts: [...(prev.promotionalDiscounts || []), newDisc] };
                  });
              }}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Descuento</Button>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
              <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="font-headline text-2xl text-slate-800">Paquetes Disponibles</CardTitle>
                    <CardDescription>Configura los paquetes predefinidos para el simulador público.</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenModal('paquete')} className="rounded-xl font-bold h-11"><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete</Button>
              </div>
          </CardHeader>
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {config?.paquetes?.map(pkg => (
                <AccordionItem key={pkg.id} value={pkg.id} className="border rounded-[1.5rem] bg-white shadow-sm px-6 group hover:border-primary/30 transition-all overflow-hidden">
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="flex-1 hover:no-underline py-5">
                      <div className="flex flex-col items-start text-left space-y-1">
                        <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{pkg.nombre}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{pkg.serviciosIncluidos.length} servicios configurados</p>
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); handleDuplicatePackage(pkg); }} title="Duplicar"><Copy className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 text-primary" onClick={(e) => { e.stopPropagation(); handleOpenModal('paquete', pkg); }} title="Editar"><Edit className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="text-destructive rounded-xl h-9 w-9 hover:bg-red-50" onClick={(e) => {
                            e.stopPropagation();
                            if(config) {
                                const updated = config.paquetes.filter(p => p.id !== pkg.id);
                                saveArmadoRapidoConfig({ ...config, paquetes: updated }).then(loadData);
                            }
                        }} title="Eliminar"><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                  <AccordionContent className="pb-6 pt-0 border-t border-slate-50">
                    <ul className="space-y-2 mt-4">
                        {pkg.serviciosIncluidos.map(s => {
                            const original = allAvailableItemsForSelection.find(i => i.id === s.id);
                            return (
                                <li key={s.id} className={cn(
                                    "text-xs font-bold uppercase tracking-tight flex items-center justify-between p-3 rounded-xl border",
                                    s.esRegalo ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-600"
                                )}>
                                    <span className="flex items-center gap-3">
                                        {s.esRegalo ? <Gift className="w-4 h-4" /> : <Package className="w-4 h-4 opacity-40" />}
                                        {original?.nombre || s.id}
                                    </span>
                                    {s.esRegalo && <Badge className="bg-rose-600 text-white border-none font-black text-[8px] px-2 py-0.5">REGALO</Badge>}
                                </li>
                            );
                        })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
      </Card>

      <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
              <CardTitle className="font-headline text-2xl text-slate-800 flex items-center gap-3">
                  <ChefHat className="w-7 h-7 text-primary"/> Visibilidad de Platos
              </CardTitle>
              <CardDescription>Activa o desactiva qué platos de tu catálogo maestro pueden ver los clientes.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
              <Accordion type="multiple" defaultValue={['Entrada', 'Plato Principal', 'Postre']} className="w-full space-y-4">
                  {['Entrada', 'Plato Principal', 'Postre', 'Menú Infantil/Adolescente'].map(cat => {
                      const dishes = allMenus.flatMap(m => m.items).filter(i => i.type === cat);
                      if (dishes.length === 0) return null;
                      return (
                          <AccordionItem key={cat} value={cat} className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
                              <AccordionTrigger className="px-6 py-4 hover:bg-slate-50/50 hover:no-underline">
                                  <span className="text-xs font-black uppercase tracking-widest text-slate-800">{cat} ({dishes.length})</span>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6 pt-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {dishes.map(plato => {
                                          const isVisible = config?.platosVisibles?.find(p => p.id === plato.id)?.visible ?? true;
                                          return (
                                              <div key={plato.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                  <Label htmlFor={`visible-${plato.id}`} className="text-xs font-bold text-slate-700 cursor-pointer flex-grow">{plato.name}</Label>
                                                  <Switch 
                                                      id={`visible-${plato.id}`} 
                                                      checked={isVisible} 
                                                      onCheckedChange={(val) => handlePlatoVisibilityChange(plato.id, val)} 
                                                      className="scale-75"
                                                  />
                                              </div>
                                          )
                                      })}
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      )
                  })}
              </Accordion>
          </CardContent>
      </Card>

      <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-slate-900 text-white">
          <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="font-headline text-2xl flex items-center gap-3">
                  <Zap className="w-7 h-7 text-primary"/> Reglas de Inteligencia Automática
              </CardTitle>
              <CardDescription className="text-slate-400">Define asociaciones automáticas de servicios (ej: Asado -> Añadir Asador).</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5 space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Si el cliente elige:</Label>
                      <Select id="trigger-select">
                          <SelectTrigger className="h-11 rounded-xl bg-white/10 border-none text-white"><SelectValue placeholder="Elegir plato/servicio..." /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                              {allAvailableItemsForSelection.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="md:col-span-1 flex justify-center pb-3 text-primary"><Link2 className="w-5 h-5"/></div>
                  <div className="md:col-span-5 space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Incluir automáticamente:</Label>
                      <Select id="required-select">
                          <SelectTrigger className="h-11 rounded-xl bg-white/10 border-none text-white"><SelectValue placeholder="Servicio necesario..." /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                              {serviciosCatalogo.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="md:col-span-1">
                      <Button onClick={() => {
                          const t = (document.getElementById('trigger-select') as HTMLSelectElement)?.value;
                          const r = (document.getElementById('required-select') as HTMLSelectElement)?.value;
                          if (t && r) handleAddDependency(t, r);
                      }} size="icon" className="h-11 w-11 rounded-xl shadow-xl shadow-primary/20"><PlusCircle/></Button>
                  </div>
              </div>

              <div className="space-y-3 pt-4">
                  {config?.serviceDependencies?.map(dep => (
                      <div key={dep.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-4 text-sm font-bold">
                              <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[9px]">{findItemName(dep.triggerServiceId)}</Badge>
                              <ArrowRight className="w-4 h-4 text-slate-600"/>
                              <span className="text-slate-300">{findItemName(dep.requiredServiceId)}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDependency(dep.id)} className="text-rose-400 opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg"><Trash2 className="w-4 h-4"/></Button>
                      </div>
                  ))}
                  {(!config?.serviceDependencies || config.serviceDependencies.length === 0) && (
                      <p className="text-center py-10 text-slate-500 italic text-sm">No has definido reglas de inteligencia aún.</p>
                  )}
              </div>
          </CardContent>
          <CardFooter className="bg-black/20 p-6 flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl"><Info className="w-5 h-5 text-primary"/></div>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                  Estas reglas garantizan que servicios críticos se cobren siempre que el cliente seleccione los servicios base correspondientes.
              </p>
          </CardFooter>
      </Card>

      <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-[1.5rem]">
          <Info className="h-5 w-5 text-blue-600" />
          <div>
              <AlertTitle className="font-black uppercase text-xs tracking-widest">Sincronización Total</AlertTitle>
              <AlertDescription className="text-sm font-medium opacity-80 leading-relaxed">
                  Los ajustes realizados aquí impactan directamente en el simulador público. Recuerda revisar los precios en el Catálogo Maestro periódicamente.
              </AlertDescription>
          </div>
      </Alert>
    </div>
  );
}
