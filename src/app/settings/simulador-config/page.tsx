
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, Package, Trash2, Settings, ChefHat, Search, ChevronDown, Gift, Info, ShoppingCart, Copy, GripVertical, Edit, DollarSign, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa, deleteServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO } from '@/types/empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { Switch } from '@/components/ui/switch';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

function SortableServiceItem({ service, children }: { service: ServicioIncluidoArmadoRapido, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: service.id });
    const style = { transform: transform ? CSS.Transform.toString(transform) : undefined, transition };

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2">
             <div {...attributes} {...listeners} className="h-full px-2 cursor-grab touch-none flex items-center justify-center pt-2">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
}

function AddOrEditPackageDialog({
    isOpen,
    onOpenChange,
    onSave,
    item: initialItem,
    vendibleServices: initialVendibleServices,
    refreshCatalog
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (item: PaqueteArmadoRapido) => void;
    item: PaqueteArmadoRapido | null;
    vendibleServices: ServicioEmpresa[];
    refreshCatalog: () => Promise<void>;
}) {
    const [localItem, setLocalItem] = useState<PaqueteArmadoRapido | null>(null);
    const [vendibleServices, setVendibleServices] = useState<ServicioEmpresa[]>(initialVendibleServices);
    const [searchTerm, setSearchTerm] = useState('');
    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        setVendibleServices(initialVendibleServices);
    }, [initialVendibleServices]);
    
     useEffect(() => {
        if (isOpen && initialItem) {
            setLocalItem(JSON.parse(JSON.stringify(initialItem)));
        }
    }, [isOpen, initialItem]);

    const filteredCatalog = useMemo(() => {
        if (!searchTerm) return vendibleServices;
        const lowerSearch = searchTerm.toLowerCase();
        return vendibleServices.filter(s => s.nombre.toLowerCase().includes(lowerSearch) || 
                                              (s.categoria && s.categoria.toLowerCase().includes(lowerSearch)));
    }, [vendibleServices, searchTerm]);

    if (!localItem) return null;

    const handleToggleService = (service: ServicioEmpresa, isChecked: boolean) => {
      setLocalItem(prev => {
        if (!prev) return null;
        if (isChecked) {
          if (prev.serviciosIncluidos.some(s => s.id === service.id)) return prev;
          return {...prev, serviciosIncluidos: [...prev.serviciosIncluidos, { id: service.id, esRegalo: false }]};
        } else {
          return {...prev, serviciosIncluidos: prev.serviciosIncluidos.filter(s => s.id !== service.id)};
        }
      });
    };
    
    const handleToggleGift = (serviceId: string) => {
       setLocalItem(prev => {
           if (!prev) return null;
           return {
               ...prev,
               serviciosIncluidos: prev.serviciosIncluidos.map(s => s.id === serviceId ? {...s, esRegalo: !s.esRegalo} : s)
           }
       })
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (localItem && over && active.id !== over.id) {
            setLocalItem(prev => {
                if (!prev) return null;
                const oldIndex = prev.serviciosIncluidos.findIndex(s => s.id === active.id);
                const newIndex = prev.serviciosIncluidos.findIndex(s => s.id === over.id);
                return { ...prev, serviciosIncluidos: arrayMove(prev.serviciosIncluidos, oldIndex, newIndex) };
            });
        }
    };

    const handleSaveAndExit = () => {
        if (!localItem) return;
        onSave(localItem);
    };

    const includedServiceDetails = localItem.serviciosIncluidos.map(incServ => ({
        ...incServ,
        details: vendibleServices.find(s => s.id === incServ.id)
    })).filter(item => item.details);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">{localItem.id.startsWith('new_') ? 'Crear' : 'Editar'} Paquete de Servicios</DialogTitle>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 py-2 min-h-0">
                    <div className="flex flex-col gap-4 min-h-0">
                        <div className="space-y-1">
                            <Label>Nombre del Paquete</Label>
                            <Input value={localItem.nombre} onChange={e => setLocalItem(p => p ? { ...p, nombre: e.target.value } : null)} />
                        </div>
                        <div className="space-y-1 flex-grow flex flex-col min-h-0">
                            <Label>Servicios Incluidos ({localItem.serviciosIncluidos.length})</Label>
                            <ScrollArea className="h-full border rounded-md p-2">
                                {includedServiceDetails.length === 0 ? <p className="text-sm text-center text-muted-foreground py-4">Añade servicios desde el catálogo.</p> : (
                                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                                        <SortableContext items={localItem.serviciosIncluidos} strategy={verticalListSortingStrategy}>
                                            {includedServiceDetails.map(service => (
                                                <SortableServiceItem key={service.id} service={service}>
                                                    <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 w-full">
                                                        <Checkbox id={`gift-${service.id}`} checked={service.esRegalo} onCheckedChange={() => handleToggleGift(service.id)}/>
                                                        <Label htmlFor={`gift-${service.id}`} className="flex-grow cursor-pointer text-sm">{service.details?.nombre}</Label>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleToggleService(service.details!, false)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                                    </div>
                                                </SortableServiceItem>
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 min-h-0">
                        <Label>Catálogo de Servicios</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                                <Input placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/>
                            </div>
                            <Button variant="ghost" size="icon" onClick={refreshCatalog} title="Actualizar Catálogo"><RefreshCw className="w-4 h-4"/></Button>
                        </div>
                        <ScrollArea className="h-full border rounded-md p-2">
                          {filteredCatalog.length > 0 ? filteredCatalog.map(s => {
                            if(!s) return null;
                            const isSelected = localItem.serviciosIncluidos.some(ls => ls.id === s.id);
                            return (
                                <div key={s.id} className="flex items-center gap-3 my-1 p-1 hover:bg-muted rounded-md group">
                                <Checkbox id={`cat-${s.id}`} checked={isSelected} onCheckedChange={(checked) => handleToggleService(s, !!checked)} />
                                <Label htmlFor={`cat-${s.id}`} className="cursor-pointer flex-grow text-sm">{s.nombre} - {formatCurrency(s.precioVenta)}</Label>
                                </div>
                            )
                          }) : <p className="text-sm text-center text-muted-foreground p-4">No se encontraron servicios.</p>}
                        </ScrollArea>
                    </div>
                </div>
                 <DialogFooter className="flex-shrink-0 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSaveAndExit}>Guardar Paquete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentItem, setCurrentItem] = useState<PaqueteArmadoRapido | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if(showLoading) setIsLoading(true);
    try {
      const [fetchedConfig, fetchedServices] = await Promise.all([ getArmadoRapidoConfig(), getServiciosEmpresa() ]);
      setConfig({
        ...fetchedConfig,
        paquetes: fetchedConfig.paquetes || [],
      });
      setServiciosCatalogo(fetchedServices);
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo cargar la configuración.", variant: "destructive" });
    } finally {
      if(showLoading) setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);
  
  const handleSaveConfig = useCallback(async (newConfig: ArmadoRapidoConfig) => {
    try {
        const result = await saveArmadoRapidoConfig(newConfig);
        if (result.success) {
            toast({ title: "¡Guardado!", description: "La configuración ha sido actualizada." });
            await loadData(false);
        } else {
            throw new Error(result.error || "No se pudo guardar la configuración.");
        }
    } catch (err: any) {
        toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    }
  }, [loadData, toast]);

  const handleSaveItem = useCallback(async (itemToSave: PaqueteArmadoRapido) => {
    if (!config) return;
    
    let newConfig: ArmadoRapidoConfig;
    const list = [...(config.paquetes || [])];
    const existingIndex = list.findIndex(i => i.id === itemToSave.id);
    if (existingIndex > -1) {
        list[existingIndex] = itemToSave as PaqueteArmadoRapido;
    } else {
        list.push(itemToSave as PaqueteArmadoRapido);
    }
    newConfig = { ...config, paquetes: list };

    await handleSaveConfig(newConfig);
    setIsModalOpen(false);

  }, [config, handleSaveConfig]);

  const openDialog = (item?: PaqueteArmadoRapido) => {
    setCurrentItem(item || { id: `new_paquete_${Date.now()}`, nombre: `Nuevo Paquete`, serviciosIncluidos: [] });
    setIsModalOpen(true);
  }
    
  const handleDeleteItem = useCallback(async (id: string) => {
      if (!config) return;
      const newConfig = { ...config, paquetes: config.paquetes.filter(i => i.id !== id) };
      await handleSaveConfig(newConfig);
      toast({title: "Paquete Eliminado", variant: "destructive"});
  }, [config, handleSaveConfig, toast]);

  const handleDuplicatePackage = useCallback(async (packageId: string) => {
    if (!config) return;
    const packageToCopy = config.paquetes.find(p => p.id === packageId);
    if (!packageToCopy) return;

    const newPackage: PaqueteArmadoRapido = {
      ...JSON.parse(JSON.stringify(packageToCopy)),
      id: `new_paquete_${Date.now()}`,
      nombre: `${packageToCopy.nombre} (Copia)`,
    };

    const originalIndex = config.paquetes.findIndex(p => p.id === packageId);
    const newPackages = [...config.paquetes];
    newPackages.splice(originalIndex + 1, 0, newPackage);
    const newConfig = { ...config, paquetes: newPackages };
    
    await handleSaveConfig(newConfig);
    toast({ description: "Paquete duplicado." });
  }, [config, handleSaveConfig, toast]);


  if (isLoading || !config) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  
  const vendibleServices = serviciosCatalogo.filter(s => s.tipoItem === 'Servicio');
  const sortedPaquetes = [...(config.paquetes || [])].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {isModalOpen && <AddOrEditPackageDialog 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        item={currentItem as PaqueteArmadoRapido | null} 
        vendibleServices={vendibleServices} 
        onSave={handleSaveItem} 
        onServiceDeleted={(deletedId: string) => setServiciosCatalogo(prev => prev.filter(s => s.id !== deletedId))}
        refreshCatalog={async () => {
            const services = await getServiciosEmpresa();
            setServiciosCatalogo(services);
            toast({ title: "Catálogo actualizado." });
        }}
      />}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configurar Paquetes Base para Presupuestos</h1></div>
        <Link href="/settings/budget-display" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes de Servicios</CardTitle>
          <CardDescription>
            Crea y gestiona los paquetes (Básico, Premium, etc.) que se usarán como punto de partida en el creador de presupuestos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button onClick={() => openDialog()} className="w-full sm:w-auto"><PlusCircle className="w-4 h-4 mr-2"/>Crear Nuevo Paquete</Button>
           <Separator/>
           <div className="space-y-3">
            {sortedPaquetes.map(pkg => {
              return (
               <Collapsible key={pkg.id} className="border rounded-lg shadow-sm bg-muted/40 overflow-hidden">
                  <CollapsibleTrigger className="flex items-center justify-between p-3 w-full hover:bg-muted/60">
                   <span className="font-semibold">{pkg.nombre}</span>
                   <div className='flex items-center'>
                     <p className="text-xs text-muted-foreground mr-2">{pkg.serviciosIncluidos.length} servicios</p>
                     <ChevronDown className="w-4 h-4" />
                   </div>
                 </CollapsibleTrigger>
                 <CollapsibleContent className="p-3 border-t">
                    <div className="flex justify-end gap-1 mb-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicar Paquete" onClick={() => handleDuplicatePackage(pkg.id)}><Copy className="w-4 h-4"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(pkg)}><Settings className="w-4 h-4"/></Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-4 h-4"/></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Confirmar?</AlertDialogTitle><AlertDialogDescription>Se eliminará el paquete "{pkg.nombre}".</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteItem('paquete', pkg.id)} className="bg-destructive">Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                   </div>
                    {pkg.serviciosIncluidos.length > 0 ? (
                        <ul className="text-sm space-y-1">
                          {pkg.serviciosIncluidos.map(s => <li key={s.id} className="flex items-center gap-1.5">{s.esRegalo ? <Gift className="w-3.5 h-3.5 text-primary"/> : <Check className="w-3.5 h-3.5 text-green-500"/>}{vendibleServices.find(vs => vs.id === s.id)?.nombre || s.id}</li>)}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">Este paquete no tiene servicios.</p>}
                 </CollapsibleContent>
               </Collapsible>
              );
            })}
           </div>
        </CardContent>
       </Card>
    </div>
  );
}
