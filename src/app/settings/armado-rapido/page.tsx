
'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, Package, Trash2, Settings, ChefHat, Search, ChevronDown, Gift, Info, ShoppingCart, Copy, GripVertical, Edit, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, updateArmadoRapidoAndSyncServices } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido, ServicioCategoriaArmadoRapido, TramoDePrecio } from '@/types/armado-rapido';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
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
    { value: 'Servicio Adicional', label: 'Servicio Adicional (Bebidas, etc.)'}
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

function AddNewServiceDialog({
  onServiceCreated,
  serviceType,
  vendibleServices = []
}: { 
  onServiceCreated: (newService: ServicioEmpresa) => void,
  serviceType: 'catering' | 'general',
  vendibleServices?: ServicioEmpresa[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [categoria, setCategoria] = useState<ServicioCategoriaArmadoRapido | CategoriaServicio>('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveNewService = async () => {
    if (!nombre.trim() || !precioVenta.trim() || !categoria.trim()) {
      toast({ title: "Datos incompletos", description: "Nombre, precio y categoría son obligatorios.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const newServiceData: Omit<ServicioEmpresa, 'id'> = {
      nombre,
      precioVenta: parseFloat(precioVenta),
      categoria: serviceType === 'catering' ? 'Servicio de catering' : (categoria as CategoriaServicio),
      subcategoria: serviceType === 'catering' ? categoria : undefined,
      tipoItem: 'Servicio',
      unidad: serviceType === 'catering' ? 'Por persona' : 'Por evento',
    };
    try {
      const result = await saveServicioEmpresa(newServiceData);
      if (result.success && result.servicio) {
        toast({ title: "Servicio Creado" });
        onServiceCreated(result.servicio);
        setIsOpen(false);
        setNombre('');
        setPrecioVenta('');
        setCategoria('');
      } else {
        throw new Error(result.error || "No se pudo crear el servicio.");
      }
    } catch (err: any) {
       toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const existingCategories = useMemo(() => Array.from(new Set(vendibleServices.filter(s => s.categoria !== 'Servicio de catering').map(s => s.categoria))), [vendibleServices]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (open) setCategoria(''); setIsOpen(open); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full text-xs">
          <PlusCircle className="w-4 h-4 mr-2" />Crear Nuevo Servicio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Servicio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1"><Label htmlFor="new-serv-name">Nombre del Servicio*</Label><Input id="new-serv-name" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="new-serv-price">Precio Base*</Label><Input id="new-serv-price" type="number" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="new-serv-cat">Categoría*</Label>
          {serviceType === 'catering' ? (
            <Select value={categoria} onValueChange={(v) => setCategoria(v as ServicioCategoriaArmadoRapido)}><SelectTrigger><SelectValue placeholder="Seleccionar subcategoría..." /></SelectTrigger><SelectContent>{CATEGORIAS_MENU.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select>
          ) : (
             <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaServicio)}><SelectTrigger><SelectValue placeholder="Seleccionar categoría existente..."/></SelectTrigger><SelectContent>{existingCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSaveNewService} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddOrEditDialog({
    isOpen,
    onOpenChange,
    onSave,
    item: initialItem,
    vendibleServices,
    mode,
    onServiceCreated
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (item: MenuArmadoRapido | PaqueteArmadoRapido, updatedServices: ServicioEmpresa[]) => void;
    item: MenuArmadoRapido | PaqueteArmadoRapido | null;
    vendibleServices: ServicioEmpresa[];
    mode: 'menu' | 'paquete';
    onServiceCreated: () => void;
}) {
    const [localItem, setLocalItem] = useState<MenuArmadoRapido | PaqueteArmadoRapido | null>(initialItem);
    const [searchTerm, setSearchTerm] = useState('');
    const [openCollapsibleId, setOpenCollapsibleId] = useState<string | null>(null);
    const [modifiedServices, setModifiedServices] = useState<Map<string, ServicioEmpresa>>(new Map());
    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        if (initialItem) {
            const syncedServices = initialItem.serviciosIncluidos.map(service => {
                const catalogService = vendibleServices.find(vs => vs.id === service.id);
                if (catalogService) {
                    return {
                        ...service,
                        // Always sync name and price from catalog
                        nombre: catalogService.nombre,
                        precioFijo: catalogService.precioVenta || service.precioFijo,
                        precioBase: service.calculationMethod === 'fijo' || service.calculationMethod === 'ratio' ? catalogService.precioVenta || service.precioBase : service.precioBase,
                        precioPorPersona: service.calculationMethod === 'porPersona' ? catalogService.precioVenta || service.precioPorPersona : service.precioPorPersona,
                    };
                }
                return service;
            });
            setLocalItem({ ...initialItem, serviciosIncluidos: syncedServices });
        } else {
            setLocalItem(null);
        }
        setModifiedServices(new Map());
    }, [initialItem, vendibleServices, isOpen]); // Rerun when dialog opens
    
    const filteredCatalog = useMemo(() => {
        return vendibleServices.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [vendibleServices, searchTerm]);

    const groupedAndSortedServices = useMemo(() => {
        if (!localItem || !localItem.serviciosIncluidos) {
            return {};
        }
        
        const services = [...localItem.serviciosIncluidos];

        if (mode === 'menu') {
            const grouped = services.reduce((acc, service) => {
                const category = service.categoria || 'Servicio Adicional';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(service);
                return acc;
            }, {} as Record<string, ServicioIncluidoArmadoRapido[]>);
            
            for (const category in grouped) {
                grouped[category].sort((a, b) => a.nombre.localeCompare(b.nombre));
            }
          
          return grouped;
        }

        // For packages, sort by category, then name, and push gifts to the end.
        services.sort((a, b) => {
            if (a.esRegalo && !b.esRegalo) return 1;
            if (!a.esRegalo && b.esRegalo) return -1;
            
            const categoryA = vendibleServices.find(s => s.id === a.id)?.categoria || 'Z';
            const categoryB = vendibleServices.find(s => s.id === b.id)?.categoria || 'Z';

            if (categoryA < categoryB) return -1;
            if (categoryA > categoryB) return 1;
            
            return a.nombre.localeCompare(b.nombre);
        });

        return {'Paquete de Servicios': services};

    }, [localItem, mode, vendibleServices]);

    const sortedCategoryNames = useMemo(() => {
        return Object.keys(groupedAndSortedServices).sort((a, b) => {
            if (a === 'Paquete de Servicios') return -1;
            if (b === 'Paquete de Servicios') return 1;
            const orderA = CATEGORY_ORDER[a as ServicioCategoriaArmadoRapido] || 99;
            const orderB = CATEGORY_ORDER[b as ServicioCategoriaArmadoRapido] || 99;
            return orderA - orderB;
        });
    }, [groupedAndSortedServices]);


    if (!localItem) return null;

    const trackModification = (service: ServicioEmpresa) => {
        setModifiedServices(prev => new Map(prev).set(service.id, service));
    };

    const handleToggleService = (service: ServicioEmpresa | undefined) => {
        if (!service) return;
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
                    categoria: mode === 'menu' ? (service.subcategoria as ServicioCategoriaArmadoRapido || 'Entrada') : 'Servicio Adicional',
                    calculationMethod: mode === 'paquete' ? 'fijo' : undefined,
                    esRegalo: false,
                    // Prices are no longer stored here; they will be read from the catalog.
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
          
          let updatedService = { ...s, [field]: value };
          
          // Track modifications to the master catalog service
          const catalogService = vendibleServices.find(vs => vs.id === serviceId);
          if(catalogService) {
              if (field === 'nombre' && typeof value === 'string') {
                  const serviceToUpdateInCatalog = { ...catalogService, nombre: value };
                  trackModification(serviceToUpdateInCatalog);
              }
              // Price editing now directly updates the master catalog
              if (field === 'precioBase' || field === 'precioPorPersona' || (field === 'precioFijo' && mode === 'menu')) {
                  const numericValue = Number(value) || 0;
                  const serviceToUpdateInCatalog = { ...catalogService, precioVenta: numericValue };
                  trackModification(serviceToUpdateInCatalog);
              }
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
        const itemToReturn = JSON.parse(JSON.stringify(localItem));
        // Remove pricing data before saving to enforce reading from catalog
        itemToReturn.serviciosIncluidos = itemToReturn.serviciosIncluidos.map((s: any) => {
            delete s.precioFijo;
            delete s.precioBase;
            delete s.precioPorPersona;
            return s;
        });
        onSave(itemToReturn, Array.from(modifiedServices.values()));
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
                             (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={(localItem.serviciosIncluidos || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                        {sortedCategoryNames.map(categoryName => (
                                          <div key={categoryName}>
                                            {mode === 'menu' && <h4 className="font-semibold text-primary text-sm my-2 border-b">{categoryName}</h4>}
                                            {(groupedAndSortedServices[categoryName] || []).map(s => (
                                                <SortableServiceItem key={s.id} service={s}>
                                                    <Card className={cn("bg-background w-full", s.esRegalo && "border-destructive/50 bg-destructive/5")}>
                                                        <CardContent className="p-2 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                 <div className="flex-grow">
                                                                    <Input value={s.nombre} onChange={(e) => handleServiceDetailChange(s.id, 'nombre', e.target.value)} className="h-7 text-sm font-medium border-none focus-visible:ring-1 focus-visible:ring-ring p-1"/>
                                                                </div>
                                                                <Collapsible onOpenChange={(open) => setOpenCollapsibleId(open ? s.id : null)}>
                                                                    <CollapsibleTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs">
                                                                            <Edit className="w-3 h-3 mr-1"/> Config
                                                                            <ChevronDown className={cn("h-4 w-4 transition-transform ml-1", openCollapsibleId === s.id && "rotate-180")} />
                                                                        </Button>
                                                                    </CollapsibleTrigger>
                                                                    <CollapsibleContent asChild>
                                                                         <div className="pt-2 mt-2 border-t space-y-3 px-1 pb-1">
                                                                            {mode === 'menu' && (
                                                                                <Select value={s.categoria} onValueChange={(val) => handleCategoryChange(s.id, val as ServicioCategoriaArmadoRapido)}>
                                                                                    <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                                                                    <SelectContent>{CATEGORIAS_MENU.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                                                                                </Select>
                                                                            )}
                                                                            <div className="flex items-center space-x-2">
                                                                                <Checkbox id={`es-regalo-serv-${s.id}`} checked={s.esRegalo} onCheckedChange={(checked) => handleServiceDetailChange(s.id, 'esRegalo', !!checked)}/>
                                                                                <Label htmlFor={`es-regalo-serv-${s.id}`} className="text-xs font-normal flex items-center gap-1"><Gift className="w-3 h-3"/>Marcar como Regalo</Label>
                                                                            </div>
                                                                            
                                                                            {mode === 'menu' && <Input type="number" placeholder="Precio Fijo por Persona" value={vendibleServices.find(vs=>vs.id===s.id)?.precioVenta || 0} onChange={e => handleServiceDetailChange(s.id, 'precioFijo', e.target.value)} className="h-8 text-xs" disabled={s.esRegalo} />}
                                                                            
                                                                            {mode === 'paquete' && (
                                                                                <>
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
                                                                                    {s.calculationMethod === 'fijo' && (<div className="text-sm p-2 bg-gray-50 rounded-md"> <Label className="text-xs text-muted-foreground">Precio Base</Label> <Input type="number" placeholder="Precio Base" value={vendibleServices.find(vs=>vs.id===s.id)?.precioVenta || 0} onChange={e => handleServiceDetailChange(s.id, 'precioBase', e.target.value)} className="h-8 text-sm" disabled={s.esRegalo}/></div> )}
                                                                                    {s.calculationMethod === 'porPersona' && <Input type="number" placeholder="Precio por Persona" value={s.precioPorPersona || 0} onChange={e => handleServiceDetailChange(s.id, 'precioPorPersona', e.target.value)} className="h-8 text-xs" disabled={s.esRegalo}/>}
                                                                                    {s.calculationMethod === 'ratio' && ( <div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="Precio Base/Unidad" value={s.precioBase || 0} onChange={e => handleServiceDetailChange(s.id, 'precioBase', e.target.value)} className="h-8 text-xs" disabled={s.esRegalo}/><Input type="number" placeholder="Invitados/Unidad" value={s.invitadosPorUnidad || 0} onChange={e => handleServiceDetailChange(s.id, 'invitadosPorUnidad', e.target.value)} className="h-8 text-xs"/></div> )}
                                                                                    {s.calculationMethod === 'tramos' && ( <div className="space-y-2"> {(s.tramosDePrecio || []).map((tramo, idx) => ( <div key={tramo.id} className="flex gap-1.5 items-center"><Input type="number" placeholder="Desde" value={tramo.desde} onChange={e=>handleTramoChange(s.id,idx,'desde',e.target.value)} className="h-7 w-16 text-xs"/><Input type="number" placeholder="Hasta" value={tramo.hasta} onChange={e=>handleTramoChange(s.id,idx,'hasta',e.target.value)} className="h-7 w-16 text-xs"/><Input type="number" placeholder="Precio" value={tramo.precio} onChange={e=>handleTramoChange(s.id,idx,'precio',e.target.value)} className="h-7 flex-grow text-xs" disabled={s.esRegalo}/><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTramo(s.id, tramo.id)}><Trash2 className="w-3.5 h-3.5"/></Button></div> ))} <Button type="button" size="sm" variant="outline" onClick={() => addTramo(s.id)} className="text-xs h-7">+ Añadir Tramo</Button> </div> )}
                                                                                </>
                                                                            )}
                                                                         </div>
                                                                    </CollapsibleContent>
                                                                </Collapsible>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </SortableServiceItem>
                                            ))}
                                          </div>
                                        ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                             )
                           }
                         </ScrollArea>
                      </div>
                    </div>
                    {/* Columna Derecha: Catálogo de Servicios */}
                    <div className="flex flex-col gap-2 min-h-0">
                        <Label>Catálogo de Servicios</Label>
                        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/></div>
                        <AddNewServiceDialog 
                          onServiceCreated={onServiceCreated} 
                          serviceType={mode === 'menu' ? 'catering' : 'general'}
                          vendibleServices={vendibleServices}
                        />
                        <ScrollArea className="h-full border rounded-md p-2">
                          {filteredCatalog.length > 0 ? filteredCatalog.map(s => {
                            if(!s) return null;
                            return (
                                <div key={s.id} className="flex items-center gap-3 my-1 p-1 hover:bg-muted rounded-md">
                                <Checkbox id={`cat-${s.id}`} checked={(localItem.serviciosIncluidos || []).some(ls => ls.id === s.id)} onCheckedChange={() => handleToggleService(s)}/>
                                <Label htmlFor={`cat-${s.id}`} className="cursor-pointer flex-grow text-sm">{s.nombre} - {formatCurrency(s.precioVenta)}</Label>
                                </div>
                            )
                          }) : <p className="text-sm text-center text-muted-foreground p-4">No hay servicios que coincidan.</p>}
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
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
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
      setServiciosCatalogo(fetchedServices);
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

  const getPriceDisplay = (service: ServicioIncluidoArmadoRapido): string => {
    if (service.esRegalo) return 'Regalo';
    const catalogService = serviciosCatalogo.find(s => s.id === service.id);
    const priceFromCatalog = catalogService?.precioVenta;
  
    switch (service.calculationMethod) {
      case 'fijo': return formatCurrency(priceFromCatalog);
      case 'porPersona': return `${formatCurrency(priceFromCatalog)} p/p`;
      case 'ratio': return `${formatCurrency(priceFromCatalog)} c/${service.invitadosPorUnidad} inv.`;
      case 'tramos': return 'Por Tramos';
      default: return formatCurrency(priceFromCatalog);
    }
  };

  if (isLoading || !config) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  
  const vendibleServices = serviciosCatalogo.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined && s.precioVenta > 0);
  const cateringServices = vendibleServices.filter(s => s.categoria === 'Servicio de catering');
  const otherServices = vendibleServices.filter(s => s.categoria !== 'Servicio de catering');


  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {isModalOpen && <AddOrEditDialog isOpen={isModalOpen} onOpenChange={setIsModalOpen} item={currentItem} vendibleServices={modalMode === 'menu' ? cateringServices : otherServices} mode={modalMode} onSave={handleSaveItem} onServiceCreated={loadData}/>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración Simulador de Presupuesto</h1></div>
        <div className="flex gap-2">
            <Link href="/empresa/todos-los-servicios/nuevo?type=servicio" passHref>
                <Button variant="outline"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Servicio al Catálogo</Button>
            </Link>
            <Link href="/settings/budget-display" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
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
                 <Collapsible key={pkg.id} className="border rounded-lg shadow-sm bg-muted/40 overflow-hidden">
                    <CollapsibleTrigger className="flex items-center justify-between p-3 w-full hover:bg-muted/60">
                     <span className="font-semibold">{pkg.nombre}</span>
                     <ChevronDown className="w-4 h-4" />
                   </CollapsibleTrigger>
                   <CollapsibleContent className="p-3 border-t">
                      <div className="flex justify-end gap-1 mb-2">
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
                      {pkg.serviciosIncluidos.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                              {pkg.serviciosIncluidos.map(s => (
                                <li key={s.id} className={cn("flex justify-between items-center p-1 rounded", s.esRegalo && "text-red-600 font-medium")}>
                                    <span className="flex items-center gap-1.5">{s.esRegalo && <Gift className="w-3.5 h-3.5"/>}{s.nombre}</span>
                                    <Badge variant={s.esRegalo ? 'destructive' : 'secondary'} className="text-xs">{getPriceDisplay(s)}</Badge>
                                </li>
                              ))}
                          </ul>
                      ) : <p className="text-sm text-muted-foreground">Este paquete no tiene servicios.</p>}
                   </CollapsibleContent>
                 </Collapsible>
              ))}
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
