
'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, Package, Trash2, Settings, ChefHat, Search, ChevronDown, Gift, Info, ShoppingCart, Copy, GripVertical, Edit, DollarSign, Check } from 'lucide-react';
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
import React from 'react';


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

function SortableServiceItem({ service, children }: { service: ServicioIncluidoArmadoRapido, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: service.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

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
      categoria: categoria as CategoriaServicio,
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
  
  const existingCategories = useMemo(() => {
    const categories = new Set(vendibleServices.map(s => s.categoria));
    categories.add('Servicio de catering');
    return Array.from(categories).sort();
  }, [vendibleServices]);


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
    const { toast } = useToast();

    // Separate state for regular services and gifts to manage reordering correctly
    const [regularServices, setRegularServices] = useState<ServicioIncluidoArmadoRapido[]>([]);
    const [giftServices, setGiftServices] = useState<ServicioIncluidoArmadoRapido[]>([]);


    useEffect(() => {
        if (initialItem) {
            const syncedServices = initialItem.serviciosIncluidos.map(service => {
                const catalogService = vendibleServices.find(vs => vs.id === service.id);
                return {
                    ...service,
                    nombre: catalogService?.nombre || service.nombre,
                    precioBase: service.precioBase ?? catalogService?.precioVenta,
                    precioFijo: service.precioFijo ?? catalogService?.precioVenta,
                    precioPorPersona: service.precioPorPersona ?? catalogService?.precioVenta,
                };
            });
            setLocalItem({ ...initialItem, serviciosIncluidos: syncedServices });
            setRegularServices(syncedServices.filter(s => !s.esRegalo));
            setGiftServices(syncedServices.filter(s => s.esRegalo));
        } else {
            setLocalItem(null);
            setRegularServices([]);
            setGiftServices([]);
        }
        setModifiedServices(new Map());
    }, [initialItem, isOpen, vendibleServices]);
    
    const regularServiceGroups = useMemo(() => {
      return regularServices.reduce(
          (acc, service) => {
              let category: string;
               if (mode === 'menu') {
                  category = service.categoria || 'Servicio Adicional';
              } else { // paquete
                  const catalogService = vendibleServices.find(vs => vs.id === service.id);
                  category = catalogService?.categoria || 'Otros';
              }

              if (!acc[category]) {
                  acc[category] = [];
              }
              acc[category].push(service);
              return acc;
          }, {} as Record<string, ServicioIncluidoArmadoRapido[]>
      );
    }, [regularServices, vendibleServices, mode]);

    const filteredCatalog = useMemo(() => {
        let catalogToShow = vendibleServices;

        if (!searchTerm) return catalogToShow;
        const lowerSearch = searchTerm.toLowerCase();
        return catalogToShow.filter(
            s => s.nombre.toLowerCase().includes(lowerSearch) || 
                 (s.categoria && s.categoria.toLowerCase().includes(lowerSearch))
        );
    }, [vendibleServices, searchTerm, mode]);

    if (!localItem) return null;

    const trackModification = (serviceId: string, updatedFields: Partial<ServicioEmpresa>) => {
      const catalogService = vendibleServices.find(vs => vs.id === serviceId);
      if (!catalogService) return;
      const existingMod = modifiedServices.get(serviceId) || catalogService;
      const updatedService = { ...existingMod, ...updatedFields };
      setModifiedServices(prev => new Map(prev).set(serviceId, updatedService));
    };

    const handleToggleService = (service: ServicioEmpresa, isChecked: boolean) => {
      const isAlreadyInList = regularServices.some(s => s.id === service.id) || giftServices.some(s => s.id === service.id);
      
      if (isChecked && isAlreadyInList) {
          toast({ title: "Servicio ya en la lista.", variant: "default" });
          return;
      }
      if (isChecked) {
        const newService: ServicioIncluidoArmadoRapido = {
            id: service.id,
            nombre: service.nombre,
            categoria: mode === 'menu' ? (service.subcategoria as ServicioCategoriaArmadoRapido || 'Entrada') : 'Servicio Adicional',
            calculationMethod: mode === 'paquete' ? 'fijo' : undefined,
            esRegalo: false,
            precioFijo: service.precioVenta,
            precioBase: service.precioVenta,
            precioPorPersona: service.precioVenta,
        };
        setRegularServices(prev => [...prev, newService]);
      } else {
        // This will remove it regardless if it's a gift or not
        setRegularServices(prev => prev.filter(s => s.id !== service.id));
        setGiftServices(prev => prev.filter(s => s.id !== service.id));
      }
    };
    
    const handleRemoveService = (serviceId: string) => {
        setRegularServices(prev => prev.filter(s => s.id !== serviceId));
        setGiftServices(prev => prev.filter(s => s.id !== serviceId));
    };
    
     const handleServiceDetailChange = (
      serviceId: string, 
      field: keyof ServicioIncluidoArmadoRapido,
      value: string | number | boolean | TramoDePrecio[] | undefined
    ) => {
      const isGiftField = field === 'esRegalo';
      const isCurrentlyGift = giftServices.some(s => s.id === serviceId);
      const isBecomingGift = isGiftField && !!value;
      const isNoLongerGift = isGiftField && !value;

      let serviceToUpdate: ServicioIncluidoArmadoRapido | undefined;
      
      if(isNoLongerGift) {
          serviceToUpdate = giftServices.find(s => s.id === serviceId);
          setGiftServices(prev => prev.filter(s => s.id !== serviceId));
      } else if (isBecomingGift) {
          serviceToUpdate = regularServices.find(s => s.id === serviceId);
          setRegularServices(prev => prev.filter(s => s.id !== serviceId));
      } else if(isCurrentlyGift) {
          setGiftServices(prev => prev.map(s => s.id === serviceId ? {...s, [field]: value} : s));
      } else {
          setRegularServices(prev => prev.map(s => s.id === serviceId ? {...s, [field]: value} : s));
      }

      if(serviceToUpdate){
         let updatedService = { ...serviceToUpdate, [field]: value };
          if(isGiftField){
              updatedService.precioUnitarioPresupuesto = isBecomingGift ? 0 : updatedService.precioUnitarioOriginal;
          }
          if(isBecomingGift){
              setGiftServices(prev => [...prev, updatedService]);
          } else { // Is no longer gift
              setRegularServices(prev => [...prev, updatedService]);
          }
      }

      const priceFields: (keyof ServicioIncluidoArmadoRapido)[] = ['precioBase', 'precioPorPersona', 'precioFijo'];
      if (priceFields.includes(field)) {
         const numericValue = Number(value);
          if (!isNaN(numericValue)) {
              trackModification(serviceId, { precioVenta: numericValue });
          }
      }
    };
    
    const handleTramoChange = (serviceId: string, tramoId: string, field: 'desde' | 'hasta' | 'precio', value: string) => {
        const numericValue = parseInt(value, 10);
        const finalValue = isNaN(numericValue) ? 0 : numericValue;
        setRegularServices(prev => prev.map(s => {
            if (s.id !== serviceId) return s;
            const newTramos = (s.tramosDePrecio || []).map(t => {
                if (t.id !== tramoId) return t;
                return { ...t, [field]: finalValue };
            });
            return { ...s, tramosDePrecio: newTramos };
        }));
    };
    
    const addTramo = (serviceId: string) => {
      const currentTramos = regularServices.find(s => s.id === serviceId)?.tramosDePrecio || [];
      const lastTramo = currentTramos[currentTramos.length - 1];
      const newDesde = lastTramo ? (Number(lastTramo.hasta) || 0) + 1 : 1;
      const newTramo: TramoDePrecio = { id: `tramo_${Date.now()}`, desde: newDesde, hasta: newDesde + 49, precio: 0 };
      handleServiceDetailChange(serviceId, 'tramosDePrecio', [...currentTramos, newTramo]);
    };
    
    const removeTramo = (serviceId: string, tramoId: string) => {
        const currentTramos = regularServices.find(s => s.id === serviceId)?.tramosDePrecio || [];
        handleServiceDetailChange(serviceId, 'tramosDePrecio', currentTramos.filter(t => t.id !== tramoId));
    };

    const handleCategoryChange = (serviceId: string, newCategory: ServicioCategoriaArmadoRapido) => {
        setRegularServices(prev => prev.map(s => s.id === serviceId ? {...s, categoria: newCategory} : s))
    }

    const handleDragEnd = (event: DragEndEvent, listType: 'regular' | 'gift') => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const setList = listType === 'regular' ? setRegularServices : setGiftServices;
            setList((items) => {
                const oldIndex = items.findIndex(s => s.id === active.id);
                const newIndex = items.findIndex(s => s.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveAndExit = () => {
        const allServices = [...regularServices, ...giftServices];
        const finalItem = {
            ...localItem,
            serviciosIncluidos: allServices.map(s => ({
                ...s,
                tramosDePrecio: (s.tramosDePrecio || []).map(t => ({
                    ...t, 
                    desde: Number(t.desde) || 0,
                    hasta: Number(t.hasta) || 0,
                    precio: Number(t.precio) || 0 
                }))
            }))
        };
        onSave(finalItem, Array.from(modifiedServices.values()));
    };

     const renderServiceCard = (service: ServicioIncluidoArmadoRapido) => {
        return (
            <React.Fragment key={service.id}>
                <SortableServiceItem service={service}>
                    <Card className={cn("bg-background w-full", service.esRegalo && "border-destructive/50 bg-destructive/5")}>
                        <CardContent className="p-2 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="flex-grow">
                                    <Input value={service.nombre} onChange={(e) => handleServiceDetailChange(service.id, 'nombre', e.target.value)} className="h-7 text-sm font-medium border-none focus-visible:ring-1 focus-visible:ring-ring p-1"/>
                                </div>
                                <Collapsible onOpenChange={(open) => setOpenCollapsibleId(open ? service.id : null)}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs">
                                            <Edit className="w-3 h-3 mr-1"/> Config
                                            <ChevronDown className={cn("h-4 w-4 transition-transform ml-1", openCollapsibleId === service.id && "rotate-180")} />
                                        </Button>
                                    </CollapsibleTrigger>
                                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveService(service.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                    <CollapsibleContent asChild>
                                        <div className="pt-2 mt-2 border-t space-y-3 px-1 pb-1">
                                            {mode === 'menu' && (
                                                <Select value={service.categoria} onValueChange={(val) => handleCategoryChange(service.id, val as ServicioCategoriaArmadoRapido)}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                                    <SelectContent>{CATEGORIAS_MENU.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                            )}
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id={`es-regalo-serv-${service.id}`} checked={service.esRegalo} onCheckedChange={(checked) => handleServiceDetailChange(service.id, 'esRegalo', !!checked)}/>
                                                <Label htmlFor={`es-regalo-serv-${service.id}`} className="text-xs font-normal flex items-center gap-1 text-primary"><Gift className="w-3 h-3"/>Marcar como Regalo (Precio = $0)</Label>
                                            </div>
                                            
                                            {mode === 'menu' && <Input type="number" placeholder="Precio Fijo por Persona" value={service.precioFijo ?? ''} onChange={e => handleServiceDetailChange(service.id, 'precioFijo', e.target.value)} className="h-8 text-xs" disabled={service.esRegalo} />}
                                            
                                            {mode === 'paquete' && (
                                                <>
                                                    <Separator/>
                                                    <Select value={service.calculationMethod || 'fijo'} onValueChange={(v) => handleServiceDetailChange(service.id, 'calculationMethod', v)} disabled={service.esRegalo}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                                        <SelectContent>
                                                        <SelectItem value="fijo" className="text-xs">Precio Fijo</SelectItem>
                                                        <SelectItem value="porPersona" className="text-xs">Por Persona</SelectItem>
                                                        <SelectItem value="ratio" className="text-xs">Ratio (ej: 1 por cada X personas)</SelectItem>
                                                        <SelectItem value="tramos" className="text-xs">Por Tramos de Invitados</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {service.calculationMethod === 'fijo' && (<div className="text-sm p-2 bg-gray-50 rounded-md"> <Label className="text-xs text-muted-foreground">Precio Base</Label> <Input type="number" placeholder="Precio Base" value={service.precioBase ?? ''} onChange={e => handleServiceDetailChange(service.id, 'precioBase', e.target.value)} className="h-8 text-sm" disabled={service.esRegalo}/></div> )}
                                                    {service.calculationMethod === 'porPersona' && <Input type="number" placeholder="Precio por Persona" value={service.precioPorPersona ?? ''} onChange={e => handleServiceDetailChange(service.id, 'precioPorPersona', e.target.value)} className="h-8 text-xs" disabled={service.esRegalo}/>}
                                                    {service.calculationMethod === 'ratio' && ( <div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="Precio Base/Unidad" value={service.precioBase ?? 0} onChange={e => handleServiceDetailChange(service.id, 'precioBase', e.target.value)} className="h-8 text-sm" disabled={service.esRegalo}/><Input type="number" placeholder="Invitados/Unidad" value={service.invitadosPorUnidad || 0} onChange={e => handleServiceDetailChange(service.id, 'invitadosPorUnidad', e.target.value)} className="h-8 text-sm"/></div> )}
                                                    {service.calculationMethod === 'tramos' && ( <div className="space-y-2"> {(service.tramosDePrecio || []).map((tramo, idx) => ( <div key={tramo.id} className="flex gap-1.5 items-center"><Input type="number" placeholder="Desde" value={tramo.desde} onChange={e=>handleTramoChange(service.id,tramo.id,'desde', e.target.value)} className="h-7 w-16 text-xs"/><Input type="number" placeholder="Hasta" value={tramo.hasta} onChange={e=>handleTramoChange(service.id,tramo.id,'hasta', e.target.value)} className="h-7 w-16 text-xs"/><Input type="number" placeholder="Precio" value={tramo.precio} onChange={e=>handleTramoChange(service.id,tramo.id,'precio', e.target.value)} className="h-7 w-24 text-xs" disabled={service.esRegalo}/><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTramo(service.id, tramo.id)}><Trash2 className="w-3.5 h-3.5"/></Button></div> ))} <Button type="button" size="sm" variant="outline" onClick={() => addTramo(service.id)} className="text-xs h-7">+ Añadir Tramo</Button></div> )}
                                                </>
                                            )}
                                         </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </CardContent>
                    </Card>
                </SortableServiceItem>
            </React.Fragment>
        );
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">{localItem.id && !localItem.id.startsWith('new_') ? 'Editar' : 'Crear'} {mode === 'menu' ? 'Menú de Catering' : 'Paquete de Servicios'}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 py-2 min-h-0">
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
                           {regularServices.length === 0 && giftServices.length === 0 ? <p className="text-sm text-center text-muted-foreground py-4">Añade servicios desde el catálogo.</p> : (
                            <div className="space-y-4">
                                {Object.keys(regularServiceGroups).length > 0 && (
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'regular')}>
                                        <div className="space-y-2">
                                            {Object.entries(regularServiceGroups).map(([category, services]) => (
                                                <div key={category}>
                                                    <h4 className='font-semibold text-sm my-2 border-b text-primary'>{category}</h4>
                                                    <SortableContext items={services.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                                        {services.map(service => renderServiceCard(service))}
                                                    </SortableContext>
                                                </div>
                                            ))}
                                        </div>
                                    </DndContext>
                                )}
                                {giftServices.length > 0 && (
                                    <div>
                                        <h4 className='font-semibold text-sm my-2 border-b text-destructive'>Regalos Incluidos</h4>
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'gift')}>
                                            <SortableContext items={giftServices.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                                {giftServices.map(service => renderServiceCard(service))}
                                            </SortableContext>
                                        </DndContext>
                                    </div>
                                )}
                            </div>
                           )}
                         </ScrollArea>
                      </div>
                    </div>
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
                            const isSelected = regularServices.some(ls => ls.id === s.id) || giftServices.some(gs => gs.id === s.id);
                            return (
                                <div key={s.id} className="flex items-center gap-3 my-1 p-1 hover:bg-muted rounded-md">
                                <Checkbox id={`cat-${s.id}`} checked={isSelected} onCheckedChange={(checked) => handleToggleService(s, !!checked)} />
                                <Label htmlFor={`cat-${s.id}`} className="cursor-pointer flex-grow text-sm">{s.nombre} - {formatCurrency(s.precioVenta)}</Label>
                                {isSelected && <Check className="w-4 h-4 text-primary" />}
                                </div>
                            )
                          }) : <p className="text-sm text-center text-muted-foreground p-4">No se encontraron servicios.</p>}
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
    const catalogService = serviciosCatalogo.find(s => s.id === service.id);
    const priceFromCatalog = catalogService?.precioVenta;
    
    if (service.esRegalo) return 'Regalo';
  
    switch (service.calculationMethod) {
      case 'fijo': return formatCurrency(service.precioBase ?? priceFromCatalog);
      case 'porPersona': return `${formatCurrency(service.precioPorPersona ?? priceFromCatalog)} p/p`;
      case 'ratio': return `${formatCurrency(service.precioBase ?? priceFromCatalog)} c/${service.invitadosPorUnidad} inv.`;
      case 'tramos': return 'Por Tramos';
      default: return formatCurrency(service.precioFijo ?? priceFromCatalog);
    }
  };

  const getGroupedAndSortedPackageServices = (pkg: PaqueteArmadoRapido) => {
    const regularServices = pkg.serviciosIncluidos.filter(s => !s.esRegalo);
    const giftServices = pkg.serviciosIncluidos.filter(s => s.esRegalo);
    
    const groupedRegular = regularServices.reduce((acc, service) => {
        const catalogService = serviciosCatalogo.find(vs => vs.id === service.id);
        const category = catalogService?.categoria || 'Otros';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(service);
        return acc;
    }, {} as Record<string, ServicioIncluidoArmadoRapido[]>);
    
    return { groupedRegular, giftServices };
  };

  if (isLoading || !config) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  
  const vendibleServices = serviciosCatalogo.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined && s.precioVenta > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {isModalOpen && <AddOrEditDialog isOpen={isModalOpen} onOpenChange={setIsModalOpen} item={currentItem} vendibleServices={vendibleServices} mode={modalMode} onSave={handleSaveItem} onServiceCreated={loadData}/>}
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
              {(config.paquetes || []).map(pkg => {
                const { groupedRegular, giftServices } = getGroupedAndSortedPackageServices(pkg);
                return (
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
                          <div className="space-y-3 text-sm">
                            {Object.entries(groupedRegular).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, services]) => (
                                <div key={category}>
                                    <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">{category}</h4>
                                    <ul className="pl-2 space-y-1">
                                        {services.map(s => (
                                            <li key={s.id} className="flex justify-between items-center p-1">
                                                <span>{s.nombre}</span>
                                                <Badge variant='secondary' className="text-xs">{getPriceDisplay(s)}</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                            {giftServices.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-xs text-red-600 uppercase tracking-wider">Regalos Incluidos</h4>
                                    <ul className="pl-2 space-y-1">
                                        {giftServices.map(s => (
                                            <li key={s.id} className="flex justify-between items-center p-1 text-red-600 font-medium">
                                                <span className="flex items-center gap-1.5"><Gift className="w-3.5 h-3.5"/>{s.nombre}</span>
                                                <Badge variant='destructive' className="text-xs">{getPriceDisplay(s)}</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                          </div>
                      ) : <p className="text-sm text-muted-foreground">Este paquete no tiene servicios.</p>}
                   </CollapsibleContent>
                 </Collapsible>
                );
              })}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
