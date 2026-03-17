
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Wand2, PlusCircle, Trash2, Search, Percent, Tag, X, Check, ChevronDown, Package, Edit, Gift, Copy } from 'lucide-react';
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

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Modal de Paquetes/Menús */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
           <DialogHeader className="p-6 pb-2">
             <DialogTitle className="text-2xl font-headline">{currentItem?.id ? 'Editar' : 'Nuevo'} {modalType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle>
           </DialogHeader>
           
           {currentItem && (
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form id="package-form" onSubmit={handleSaveItem} className="space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Nombre</Label>
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
                    GUARDAR PAQUETE
                </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Simulador de Presupuestos</h1></div>
        <Link href="/empresa/contabilidad" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

      {/* Ajustes Globales */}
      <form onSubmit={handleBudgetSettingsSave}>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-xl">Ajustes de Presupuestos</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Percent className="w-4 h-4" />Porcentaje de Ajuste Anual (%)</Label>
              <Input type="number" value={budgetSettings?.annualAdjustmentPercentage ?? ''} onChange={e => setBudgetSettings(s => s ? { ...s, annualAdjustmentPercentage: Number(e.target.value) } : null)} />
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Descuentos Promocionales</h4>
              {(budgetSettings?.promotionalDiscounts || []).map((discount, index) => (
                <div key={discount.id} className="grid grid-cols-3 gap-3 items-end p-3 bg-muted/30 rounded-xl border relative group">
                    <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        setBudgetSettings(prev => {
                            if (!prev) return null;
                            const updated = (prev.promotionalDiscounts || []).filter((_, i) => i !== index);
                            return { ...prev, promotionalDiscounts: updated };
                        });
                    }}><X className="w-3 shadow-sm h-3"/></Button>
                    <div className="space-y-1"><Label className="text-[10px] uppercase">Nombre</Label><Input value={discount.name} onChange={e => {
                        setBudgetSettings(prev => {
                            if (!prev) return null;
                            const updated = [...(prev.promotionalDiscounts || [])];
                            updated[index].name = e.target.value;
                            return { ...prev, promotionalDiscounts: updated };
                        });
                    }}/></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase">Tipo</Label><Select value={discount.type} onValueChange={v => {
                        setBudgetSettings(prev => {
                            if (!prev) return null;
                            const updated = [...(prev.promotionalDiscounts || [])];
                            updated[index].type = v as any;
                            return { ...prev, promotionalDiscounts: updated };
                        });
                    }}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="percentage">Porcentaje</SelectItem><SelectItem value="fixed">Fijo</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase">Valor</Label><Input type="number" value={discount.value} onChange={e => {
                        setBudgetSettings(prev => {
                            if (!prev) return null;
                            const updated = [...(prev.promotionalDiscounts || [])];
                            updated[index].value = Number(e.target.value);
                            return { ...prev, promotionalDiscounts: updated };
                        });
                    }}/></div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => {
                  const newDisc = { id: `promo_${Date.now()}`, name: '', type: 'percentage' as const, value: 0 };
                  setBudgetSettings(prev => {
                      if (!prev) return null;
                      return { ...prev, promotionalDiscounts: [...(prev.promotionalDiscounts || []), newDisc] };
                  });
              }}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Descuento</Button>
            </div>
          </CardContent>
          <CardFooter><Button type="submit" disabled={isSaving}>Guardar Ajustes Globales</Button></CardFooter>
        </Card>
      </form>

      {/* Paquetes */}
      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-xl">Paquetes Disponibles</CardTitle>
              <CardDescription>Configura los paquetes predefinidos para el simulador público.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={() => handleOpenModal('paquete')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete</Button>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {config?.paquetes?.map(pkg => (
                <AccordionItem key={pkg.id} value={pkg.id} className="border rounded-3xl bg-white shadow-sm px-4 group hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="flex-1 hover:no-underline py-4">
                      <div className="flex flex-col items-start text-left space-y-1">
                        <p className="font-black text-slate-800 text-base uppercase tracking-tight">{pkg.nombre}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{pkg.serviciosIncluidos.length} servicios</p>
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={(e) => { e.stopPropagation(); handleDuplicatePackage(pkg); }}><Copy className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={(e) => { e.stopPropagation(); handleOpenModal('paquete', pkg); }}><Edit className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="text-destructive rounded-xl h-8 w-8 hover:bg-red-50" onClick={(e) => {
                            e.stopPropagation();
                            if(config) {
                                const updated = config.paquetes.filter(p => p.id !== pkg.id);
                                saveArmadoRapidoConfig({ ...config, paquetes: updated }).then(loadData);
                            }
                        }}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                  <AccordionContent className="pb-4 pt-0">
                    <ul className="space-y-2 border-t pt-4">
                        {pkg.serviciosIncluidos.map(s => {
                            const original = allAvailableItemsForSelection.find(i => i.id === s.id);
                            return (
                                <li key={s.id} className={cn(
                                    "text-xs font-bold uppercase tracking-tight flex items-center justify-between p-2 rounded-xl",
                                    s.esRegalo ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                                )}>
                                    <span className="flex items-center gap-2">
                                        {s.esRegalo ? <Gift className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                                        {original?.nombre || s.id}
                                    </span>
                                    {s.esRegalo && <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">REGALO</span>}
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
    </div>
  );
}
