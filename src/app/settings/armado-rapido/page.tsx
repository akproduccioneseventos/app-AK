
'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, Package, Trash2, Settings, ChefHat, Search, ChevronDown, Gift, Info, ShoppingCart, Copy, GripVertical, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, updateArmadoRapidoAndSyncServices } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido, ServicioCategoriaArmadoRapido, TramoDePrecio } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
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


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const CATEGORIAS_MENU: { value: ServicioCategoriaArmadoRapido, label: string }[] = [
    { value: 'Entrada', label: 'Entrada' },
    { value: 'Plato Principal', label: 'Plato Principal' },
    { value: 'Menú Adolescente / Niño', label: 'Menú Adolescente / Niño' },
];

const CATEGORY_ORDER: Record<ServicioCategoriaArmadoRapido, number> = {
    'Entrada': 1,
    'Plato Principal': 2,
    'Menú Adolescente / Niño': 3,
    'Servicio Adicional': 4,
};


function SortableServiceItem({ service, children }: { service: ServicioIncluidoArmadoRapido, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: service.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2">
             <Button variant="ghost" {...attributes} {...listeners} className="h-full px-2 cursor-grab touch-none">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </Button>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
}

function AddOrEditDialog({
    isOpen,
    onOpenChange,
    onSave,
    item: initialItem,
    vendibleServices: initialVendibleServices,
    mode,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (item: MenuArmadoRapido | PaqueteArmadoRapido, updatedServices: ServicioEmpresa[]) => void;
    item: MenuArmadoRapido | PaqueteArmadoRapido | null;
    vendibleServices: ServicioEmpresa[];
    mode: 'menu' | 'paquete';
}) {
    const [localItem, setLocalItem] = useState<MenuArmadoRapido | PaqueteArmadoRapido | null>(initialItem);
    const [searchTerm, setSearchTerm] = useState('');
    const [openCollapsibleId, setOpenCollapsibleId] = useState<string | null>(null);
    const [modifiedServices, setModifiedServices] = useState<Map<string, ServicioEmpresa>>(new Map());
    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        setLocalItem(initialItem);
        setModifiedServices(new Map()); // Reset modifications when item changes
    }, [initialItem]);
    
    const groupedAndSortedServices = useMemo(() => {
        if (!localItem || !localItem.serviciosIncluidos || mode !== 'menu') {
            return { ' ungrouped': localItem?.serviciosIncluidos || [] };
        }
        
        const grouped = localItem.serviciosIncluidos.reduce((acc, service) => {
            const category = service.categoria || 'Servicio Adicional';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(service);
            return acc;
        }, {} as Record<string, ServicioIncluidoArmadoRapido[]>);
        
        // Sort items within each category alphabetically
        for (const category in grouped) {
            grouped[category].sort((a, b) => a.nombre.localeCompare(b.nombre));
        }

        return grouped;

    }, [localItem, mode]);

    const sortedCategoryNames = useMemo(() => {
        return Object.keys(groupedAndSortedServices).sort((a, b) => {
            const orderA = CATEGORY_ORDER[a as ServicioCategoriaArmadoRapido] || 99;
            const orderB = CATEGORY_ORDER[b as ServicioCategoriaArmadoRapido] || 99;
            return orderA - orderB;
        });
    }, [groupedAndSortedServices]);


    if (!localItem) return null;

    const trackModification = (service: ServicioEmpresa) => {
        setModifiedServices(prev => new Map(prev).set(service.id, service));
    };

    const handleToggleService = (service: ServicioEmpresa) => {
        if (!service) return; // Prevent error if service is undefined
        setLocalItem(prev => {
            if (!prev) return null;
            const currentServices = prev.serviciosIncluidos || [];
            const isSelected = currentServices.some(s => s.id === service.id);
            let newServices;
            if (isSelected) {
                newServices = currentServices.filter(s => s.id !== service.id);
            } else {
                newServices = [...currentServices, {
                    id: service.id,
                    nombre: service.nombre,
                    precioFijo: service.precioVenta || 0,
                    categoria: mode === 'menu' ? 'Entrada' : 'Servicio Adicional',
                    calculationMethod: mode === 'paquete' ? 'fijo' : undefined,
                    precioBase: mode === 'paquete' ? service.precioVenta || 0 : undefined,
                    esRegalo: false,
                }];
            }
            return { ...prev, serviciosIncluidos: newServices };
        });
    };
    
     const handleServiceDetailChange = (
      serviceId: string, 
      field: keyof ServicioIncluidoArmadoRapido,
      value: string | number | boolean | TramoDePrecio[] | undefined
    ) => {
      setLocalItem(prev => {
        if (!prev) return null;

        const updatedServiciosIncluidos = prev.serviciosIncluidos.map(s => {
          if (s.id !== serviceId) return s;
          
          const catalogService = initialVendibleServices.find(vs => vs.id === serviceId);
          if(!catalogService) return s; // Should not happen
          
          const updatedService = { ...s, [field]: value };
          
          if (field === 'nombre' && typeof value === 'string') {
              const serviceToUpdateInCatalog = { ...catalogService, nombre: value };
              trackModification(serviceToUpdateInCatalog);
          }
           if (field === 'precioBase' || field === 'precioPorPersona') {
              const serviceToUpdateInCatalog = { ...catalogService, precioVenta: Number(value) || 0 };
              trackModification(serviceToUpdateInCatalog);
           }
            if (field === 'calculationMethod') {
              updatedService.precioBase = undefined;
              updatedService.precioPorPersona = undefined;
              updatedService.invitadosPorUnidad = undefined;
              updatedService.tramosDePrecio = undefined;
              if (value === 'fijo' || value === 'ratio') {
                updatedService.precioBase = catalogService?.precioVenta || 0;
              } else if(value === 'porPersona') {
                updatedService.precioPorPersona = catalogService?.precioVenta || 0;
              }
            }
             if (field === 'esRegalo') {
                const precioOriginal = catalogService?.precioVenta || 0;
                updatedService.precioBase = value ? 0 : precioOriginal;
                updatedService.precioFijo = value ? 0 : precioOriginal;
                updatedService.precioPorPersona = value ? 0 : updatedService.precioPorPersona;
             }
            return updatedService;
          });

          return { ...prev, serviciosIncluidos: updatedServiciosIncluidos };
      })
    };
    
    const handleTramoChange = (serviceId: string, tramoIndex: number, field: 'desde' | 'hasta' | 'precio', value: string) => {
        const newValue = Number(value);
        if (isNaN(newValue)) return;
        
        setLocalItem(prev => {
            if (!prev) return null;
            const newServicios = prev.serviciosIncluidos.map(s => {
                if (s.id !== serviceId) return s;
                const newTramos = (s.tramosDePrecio || []).map((t, i) =>
                    i === tramoIndex ? { ...t, [field]: newValue } : t
                );
                return { ...s, tramosDePrecio: newTramos };
            });
            return { ...prev, serviciosIncluidos: newServicios };
        });
    };
    
    const addTramo = (serviceId: string) => {
      const currentTramos = localItem.serviciosIncluidos.find(s => s.id === serviceId)?.tramosDePrecio || [];
      const lastTramo = currentTramos[currentTramos.length - 1];
      const newDesde = lastTramo ? (lastTramo.hasta || 0) + 1 : 1;
      
      const newTramo: TramoDePrecio = { id: `tramo_${Date.now()}`, desde: newDesde, hasta: newDesde + 49, precio: 0 };
      
      handleServiceDetailChange(serviceId, 'tramosDePrecio', [...currentTramos, newTramo]);
    };
    
    const removeTramo = (serviceId: string, tramoId: string) => {
        const currentTramos = localItem.serviciosIncluidos.find(s => s.id === serviceId)?.tramosDePrecio || [];
        handleServiceDetailChange(serviceId, 'tramosDePrecio', currentTramos.filter(t => t.id !== tramoId));
    };

    const handleCategoryChange = (serviceId: string, newCategory: ServicioCategoriaArmadoRapido) => {
        setLocalItem(prev => {
            if (!prev) return null;
            return {
                ...prev,
                serviciosIncluidos: prev.serviciosIncluidos.map(s => s.id === serviceId ? {...s, categoria: newCategory} : s)
            }
        })
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLocalItem(prev => {
                if (!prev) return null;
                const oldIndex = prev.serviciosIncluidos.findIndex(s => s.id === active.id);
                const newIndex = prev.serviciosIncluidos.findIndex(s => s.id === over.id);
                return { ...prev, serviciosIncluidos: arrayMove(prev.serviciosIncluidos, oldIndex, newIndex) };
            });
        }
    };

    const handleSaveAndExit = () => {
        onSave(localItem, Array.from(modifiedServices.values()));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">{localItem.id && !localItem.id.startsWith('new_') ? 'Editar' : 'Crear'} {mode === 'menu' ? 'Menú de Catering' : 'Paquete de Servicios'}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 py-2 min-h-0">
                    {/* Columna Izquierda: Detalles y Servicios Incluidos */}
                    <div className="flex flex-col gap-4 min-h-0">
                      {mode === 'paquete' && (
                          <div className="space-y-1">
                              <Label>Nombre del Paquete</Label>
                              <Input value={localItem.nombre} onChange={e => setLocalItem(p => p ? { ...p, nombre: e.target.value } : null)} />
                          </div>
                      )}
                      <div className="space-y-1 flex-grow flex flex-col min-h-0">
                        <Label>Servicios Incluidos en este {mode === 'menu' ? 'Menú' : 'Paquete'}</Label>
                         <ScrollArea className="h-full border rounded-md p-2">
                           {(localItem.serviciosIncluidos || []).length === 0 ? <p className="text-sm text-center text-muted-foreground py-4">Añade servicios desde el catálogo.</p> :
                             mode === 'paquete' ? (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={(localItem.serviciosIncluidos || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                        {(localItem.serviciosIncluidos || []).map(s => (
                                            <SortableServiceItem key={s.id} service={s}>
                                                {/* Paquete Item Content */}
                                                <Collapsible onOpenChange={(open) => setOpenCollapsibleId(open ? s.id : null)} className="border rounded-md bg-background px-2 w-full">
                                                <div className="flex items-center gap-3 py-2">
                                                    <Checkbox id={`current-${s.id}`} checked={true} onCheckedChange={() => handleToggleService(initialVendibleServices.find(vs => vs.id === s.id)!)} />
                                                    <div className="flex-grow"><Input value={s.nombre} onChange={(e) => handleServiceDetailChange(s.id, 'nombre', e.target.value)} className="h-7 text-sm font-medium border-none focus-visible:ring-1 focus-visible:ring-ring p-1"/></div>
                                                    <CollapsibleTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs">
                                                            <Edit className="w-3 h-3 mr-1"/> Config
                                                            <ChevronDown className={cn("h-4 w-4 transition-transform ml-1", openCollapsibleId === s.id && "rotate-180")} />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                </div>
                                                <CollapsibleContent className="pt-3 mt-2 border-t space-y-3 px-1 pb-2">
                                                   <div className="space-y-2">
                                                        <div className="flex items-center space-x-2 pt-1">
                                                            <Checkbox id={`es-regalo-serv-${s.id}`} checked={s.esRegalo} onCheckedChange={(checked) => handleServiceDetailChange(s.id, 'esRegalo', !!checked)}/>
                                                            <Label htmlFor={`es-regalo-serv-${s.id}`} className="text-xs font-normal flex items-center gap-1"><Gift className="w-3 h-3"/>Marcar como Regalo</Label>
                                                        </div>
                                                        <Separator/>
                                                        <Select value={s.calculationMethod || 'fijo'} onValueChange={(v) => handleServiceDetailChange(s.id, 'calculationMethod', v)} disabled={s.esRegalo}>
                                                            <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                            <SelectItem value="fijo" className="text-xs">Precio Fijo</SelectItem>
                                                            <SelectItem value="porPersona" className="text-xs">Por Persona</SelectItem>
                                                            <SelectItem value="ratio" className="text-xs">Ratio (ej: 1 por cada X personas)</SelectItem>
                                                            <SelectItem value="tramos" className="text-xs">Por Tramos de Invitados</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                         {s.calculationMethod === 'fijo' && (
                                                            <div className="text-sm p-2 bg-gray-50 rounded-md"> El precio de este servicio es <strong>{formatCurrency(s.precioBase)}</strong>. </div>
                                                         )}
                                                         {s.calculationMethod === 'porPersona' && <Input type="number" placeholder="Precio por Persona" value={s.precioPorPersona || 0} onChange={e => handleServiceDetailChange(s.id, 'precioPorPersona', e.target.value)} className="h-8 text-xs" disabled={s.esRegalo}/>}
                                                         {s.calculationMethod === 'ratio' && ( <div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="Precio Base/Unidad" value={s.precioBase || 0} onChange={e => handleServiceDetailChange(s.id, 'precioBase', e.target.value)} className="h-8 text-xs" disabled={s.esRegalo}/><Input type="number" placeholder="Invitados/Unidad" value={s.invitadosPorUnidad || 0} onChange={e => handleServiceDetailChange(s.id, 'invitadosPorUnidad', e.target.value)} className="h-8 text-xs"/></div> )}
                                                         {s.calculationMethod === 'tramos' && ( <div className="space-y-2"> {(s.tramosDePrecio || []).map((tramo, idx) => ( <div key={tramo.id} className="flex gap-1.5 items-center"><Input type="number" placeholder="Desde" value={tramo.desde} onChange={e=>handleTramoChange(s.id,idx,'desde',e.target.value)} className="h-7 w-16 text-xs"/><Input type="number" placeholder="Hasta" value={tramo.hasta} onChange={e=>handleTramoChange(s.id,idx,'hasta',e.target.value)} className="h-7 w-16 text-xs"/><Input type="number" placeholder="Precio" value={tramo.precio} onChange={e=>handleTramoChange(s.id,idx,'precio',e.target.value)} className="h-7 flex-grow text-xs"/><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTramo(s.id, tramo.id)}><Trash2 className="w-3.5 h-3.5"/></Button></div> ))} <Button type="button" size="sm" variant="outline" onClick={() => addTramo(s.id)} className="text-xs h-7">+ Añadir Tramo</Button> </div> )}
                                                    </div>
                                                </CollapsibleContent>
                                                </Collapsible>
                                            </SortableServiceItem>
                                        ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                             ) : (
                                <div className="space-y-4">
                                    {sortedCategoryNames.map(categoryName => (
                                        <div key={categoryName}>
                                            <h4 className="font-semibold text-sm text-primary mb-2">{categoryName}</h4>
                                            <div className="space-y-2">
                                                {groupedAndSortedServices[categoryName].map(s => (
                                                    <Collapsible key={s.id} onOpenChange={(open) => setOpenCollapsibleId(open ? s.id : null)} className="border rounded-md bg-background px-2 w-full">
                                                        <div className="flex items-center gap-3 py-2">
                                                            <Checkbox id={`current-${s.id}`} checked={true} onCheckedChange={() => handleToggleService(initialVendibleServices.find(vs => vs.id === s.id)!)} />
                                                            <div className="flex-grow"><Label htmlFor={`current-${s.id}`} className="text-sm font-medium cursor-pointer">{s.nombre}</Label></div>
                                                            <CollapsibleTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs">
                                                                    <Edit className="w-3 h-3 mr-1"/> Config
                                                                    <ChevronDown className={cn("h-4 w-4 transition-transform ml-1", openCollapsibleId === s.id && "rotate-180")} />
                                                                </Button>
                                                            </CollapsibleTrigger>
                                                        </div>
                                                         <CollapsibleContent className="pt-3 mt-2 border-t space-y-3 px-1 pb-2">
                                                            <Select value={s.categoria} onValueChange={(val) => handleCategoryChange(s.id, val as ServicioCategoriaArmadoRapido)}>
                                                                <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                                                <SelectContent>{CATEGORIAS_MENU.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                                                            </Select>
                                                            <Input type="number" placeholder="Precio Fijo por Persona" value={s.precioFijo || 0} onChange={e => handleServiceDetailChange(s.id, 'precioFijo', e.target.value)} className="h-8 text-xs"/>
                                                         </CollapsibleContent>
                                                    </Collapsible>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                           }
                         </ScrollArea>
                      </div>
                    </div>
                    {/* Columna Derecha: Catálogo de Servicios */}
                    <div className="flex flex-col gap-2 min-h-0">
                        <Label>Catálogo de Servicios Vendibles</Label>
                        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/></div>
                        <ScrollArea className="h-full border rounded-md p-2">
                          {initialVendibleServices.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                            <div key={s.id} className="flex items-center gap-3 my-1 p-1 hover:bg-muted rounded-md">
                               <Checkbox id={`cat-${s.id}`} checked={(localItem.serviciosIncluidos || []).some(ls => ls.id === s.id)} onCheckedChange={() => handleToggleService(s)}/>
                               <Label htmlFor={`cat-${s.id}`} className="cursor-pointer flex-grow text-sm">{s.nombre} - {formatCurrency(s.precioVenta)}</Label>
                            </div>
                          ))}
                        </ScrollArea>
                    </div>
                </div>
                 <DialogFooter className="flex-shrink-0 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSaveAndExit}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [vendibleServices, setVendibleServices] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentItem, setCurrentItem] = useState<MenuArmadoRapido | PaqueteArmadoRapido | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'menu' | 'paquete'>('menu');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedConfig, fetchedServices] = await Promise.all([ getArmadoRapidoConfig(), getServiciosEmpresa() ]);
      setConfig({
        ...fetchedConfig,
        paquetes: fetchedConfig.paquetes || [],
        menus: fetchedConfig.menus || [],
      });
      setVendibleServices(fetchedServices.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined && s.precioVenta > 0));
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo cargar la configuración.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);
  
  const handleSaveItem = useCallback(async (itemToSave: MenuArmadoRapido | PaqueteArmadoRapido, updatedServices: ServicioEmpresa[]) => {
    if (!config) return;
    
    let newConfig: ArmadoRapidoConfig;
    if (modalMode === 'menu') {
        newConfig = { ...config, menus: [itemToSave as MenuArmadoRapido] };
    } else { // It's a 'paquete'
        const list = [...(config.paquetes || [])];
        const existingIndex = list.findIndex(i => i.id === itemToSave.id);
        if (existingIndex > -1) {
            list[existingIndex] = itemToSave as PaqueteArmadoRapido;
        } else {
            list.push(itemToSave as PaqueteArmadoRapido);
        }
        newConfig = { ...config, paquetes: list };
    }

    try {
        const result = await updateArmadoRapidoAndSyncServices(newConfig, updatedServices);
        if (result.success) {
            toast({ title: "¡Guardado!", description: "La configuración ha sido actualizada." });
            await loadData();
            setIsModalOpen(false);
        } else {
            throw new Error(result.error || "No se pudo guardar la configuración.");
        }
    } catch (err: any) {
        toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    }
  }, [config, modalMode, toast, loadData]);

  const openDialog = (mode: 'menu' | 'paquete', item?: MenuArmadoRapido | PaqueteArmadoRapido) => {
    setModalMode(mode);
    if(mode === 'menu'){
        const menuToEdit = config?.menus[0] || { id: 'menu_catering', nombre: 'Menú de Catering', serviciosIncluidos: [] };
        setCurrentItem(menuToEdit);
    } else {
        setCurrentItem(item || { id: `new_${mode}_${Date.now()}`, nombre: `Nuevo Paquete`, serviciosIncluidos: [] });
    }
    setIsModalOpen(true);
  }
    
  const handleDeleteItem = useCallback(async (type: 'paquete', id: string) => {
      if (!config) return;
      const newConfig = { ...config, paquetes: config.paquetes.filter(i => i.id !== id) };
      const result = await updateArmadoRapidoAndSyncServices(newConfig, []);
      if(result.success) {
        toast({title: "Paquete Eliminado", variant: "destructive"});
        await loadData();
      } else {
        toast({ title: "Error al Eliminar", description: result.error, variant: "destructive"});
      }
  }, [config, loadData, toast]);

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
    
    const result = await updateArmadoRapidoAndSyncServices(newConfig, []);
    if(result.success) {
        toast({ description: "Paquete duplicado." });
        await loadData();
    } else {
       toast({ title: "Error al duplicar", description: result.error, variant: "destructive"});
    }
  }, [config, loadData, toast]);

  if (isLoading || !config) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {isModalOpen && <AddOrEditDialog isOpen={isModalOpen} onOpenChange={setIsModalOpen} item={currentItem} vendibleServices={vendibleServices} mode={modalMode} onSave={handleSaveItem}/>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de "Mi Presupuesto al Instante"</h1></div>
        <div className="flex gap-2">
            <Link href="/empresa/todos-los-servicios/nuevo?type=servicio" passHref>
                <Button variant="outline"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Servicio al Catálogo</Button>
            </Link>
            <Link href="/settings" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
        </div>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><ChefHat className="text-primary"/>Opciones de Catering (Para Paso 3)</CardTitle>
            <CardDescription>Gestiona la lista única de servicios de catering que los clientes podrán elegir. Define el precio por persona de cada opción y clasifícala correctamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button onClick={() => openDialog('menu')} className="w-full"><Settings className="w-4 h-4 mr-2"/>Administrar Opciones de Catering</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes de Servicios (Para Paso 4)</CardTitle>
            <CardDescription>Crea y edita los paquetes de servicios adicionales (DJ, decoración, etc). Define precios fijos, por persona o por ratios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button onClick={() => openDialog('paquete')} className="w-full"><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete Nuevo</Button>
             <Separator/>
             <div className="space-y-3">
              {(config.paquetes || []).map(pkg => (
                 <Card key={pkg.id} className="bg-muted/40">
                    <CardHeader className="flex-row items-center justify-between p-3">
                     <CardTitle className="text-base">{pkg.nombre}</CardTitle>
                     <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicar Paquete" onClick={() => handleDuplicatePackage(pkg.id)}><Copy className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog('paquete', pkg)}><Settings className="w-4 h-4"/></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-4 h-4"/></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>¿Confirmar?</AlertDialogTitle><AlertDialogDescription>Se eliminará el paquete "{pkg.nombre}".</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteItem('paquete', pkg.id)} className="bg-destructive">Eliminar</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </div>
                   </CardHeader>
                   <CardContent className="px-3 pb-3">
                      {pkg.serviciosIncluidos.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                              {pkg.serviciosIncluidos.slice(0, 3).map(s => <li key={s.id} className="flex justify-between"><span>{s.nombre}</span> <Badge variant="outline">{s.calculationMethod}</Badge></li>)}
                              {pkg.serviciosIncluidos.length > 3 && <li className="text-xs text-muted-foreground">...y {pkg.serviciosIncluidos.length - 3} más.</li>}
                          </ul>
                      ) : <p className="text-sm text-muted-foreground">Este paquete no tiene servicios.</p>}
                   </CardContent>
                 </Card>
              ))}
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
