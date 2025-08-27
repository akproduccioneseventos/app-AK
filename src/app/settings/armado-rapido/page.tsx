
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, AlertTriangle, Package, Trash2, Settings, GripVertical, Check, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const NewServiceModal = ({ onServiceCreated }: { onServiceCreated: (newService: ServicioEmpresa) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newServiceData, setNewServiceData] = useState<Partial<Omit<ServicioEmpresa, 'id'>>>({
        tipoItem: 'Servicio',
        nombre: '',
        categoria: 'Otros servicios',
        unidad: 'Por evento',
        precioVenta: 0,
        notas: '',
    });
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServiceData.nombre || !newServiceData.categoria || !newServiceData.unidad || (newServiceData.precioVenta ?? -1) < 0) {
            toast({ title: "Datos incompletos", description: "Nombre, categoría, unidad y precio son requeridos.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const result = await saveServicioEmpresa(newServiceData as Omit<ServicioEmpresa, 'id'>);
            if (result.success && result.servicio) {
                toast({ title: "Servicio Creado", description: `"${result.servicio.nombre}" ha sido añadido al catálogo.` });
                onServiceCreated(result.servicio);
                setIsOpen(false);
                setNewServiceData({ tipoItem: 'Servicio', nombre: '', categoria: 'Otros servicios', unidad: 'Por evento', precioVenta: 0, notas: '' });
            } else {
                throw new Error(result.error || "No se pudo crear el servicio.");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary"><PlusCircle className="w-4 h-4 mr-2"/>Crear Nuevo Servicio</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Crear Nuevo Servicio en Catálogo</DialogTitle><DialogDescription>Este servicio se guardará y estará disponible para añadir a cualquier paquete.</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 py-2">
                    <div className="space-y-1"><Label htmlFor="new-serv-name">Nombre del Servicio *</Label><Input id="new-serv-name" value={newServiceData.nombre} onChange={e => setNewServiceData(p => ({...p, nombre: e.target.value}))} required/></div>
                    <div className="space-y-1"><Label htmlFor="new-serv-cat">Categoría *</Label><Select value={newServiceData.categoria} onValueChange={(val) => setNewServiceData(p => ({...p, categoria: val as CategoriaServicio}))}><SelectTrigger id="new-serv-cat"><SelectValue/></SelectTrigger><SelectContent>{['Servicio de catering', 'Servicio de filmación', 'Servicio de fotografía', 'Servicio de decoración', 'Servicio de entretenimiento', 'Servicio de bebidas', 'Servicio de discoteca', 'Servicio de repostería', 'Regalo exclusivo', 'Personal', 'Otros servicios'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label htmlFor="new-serv-unidad">Unidad *</Label><Select value={newServiceData.unidad} onValueChange={val => setNewServiceData(p => ({...p, unidad: val as UnidadServicio}))}><SelectTrigger id="new-serv-unidad"><SelectValue/></SelectTrigger><SelectContent>{['Unidad', 'Set', 'Metro', 'Kg', 'Litro', 'Caja', 'Rollo', 'Docena', 'Por persona', 'Por evento', 'Gramos', 'Cc', 'Pack'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label htmlFor="new-serv-price">Precio Venta *</Label><Input id="new-serv-price" type="number" value={newServiceData.precioVenta || ''} onChange={e => setNewServiceData(p => ({...p, precioVenta: parseFloat(e.target.value) || 0}))} required/></div>
                    </div>
                     <div className="space-y-1"><Label htmlFor="new-serv-notes">Descripción (Opcional)</Label><Textarea id="new-serv-notes" value={newServiceData.notas} onChange={e => setNewServiceData(p => ({...p, notas: e.target.value}))} rows={2}/></div>
                    <DialogFooter><DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Crear y Añadir'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const DraggableServiceItem = ({ item, onRemove }: { item: ServicioIncluidoArmadoRapido, onRemove: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 border rounded-md bg-background">
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-grab" {...listeners} {...attributes}><GripVertical className="w-4 h-4 text-muted-foreground"/></Button>
            <span className="text-sm flex-grow">{item.nombre}</span>
            <span className="text-xs font-mono text-muted-foreground">{formatCurrency(item.precioFijo)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={onRemove}><Trash2 className="w-3.5 h-3.5"/></Button>
        </div>
    )
}

const AddOrEditPackageDialog = ({
  pkg, onSave, onDelete, trigger
}: {
  pkg?: PaqueteArmadoRapido;
  onSave: (data: Pick<PaqueteArmadoRapido, 'nombre' | 'descripcion'>) => void;
  onDelete?: () => void;
  trigger: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState(pkg?.nombre || '');
  const [descripcion, setDescripcion] = useState(pkg?.descripcion || '');
  
  useEffect(() => {
    if (isOpen) {
        setNombre(pkg?.nombre || '');
        setDescripcion(pkg?.descripcion || '');
    }
  }, [isOpen, pkg]);

  const handleSave = () => {
    onSave({ nombre, descripcion });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{pkg ? 'Editar' : 'Nuevo'} Paquete</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
            <div className="space-y-1"><Label htmlFor="pkg-name">Nombre</Label><Input id="pkg-name" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="pkg-desc">Descripción</Label><Input id="pkg-desc" value={descripcion} onChange={e => setDescripcion(e.target.value)} /></div>
        </div>
        <DialogFooter className="justify-between">
           {pkg && onDelete && <Button variant="destructive" onClick={() => { onDelete(); setIsOpen(false); }}>Eliminar</Button>}
           <div className="flex gap-2 ml-auto"><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSave}>Guardar</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [vendibleServices, setVendibleServices] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedConfig, fetchedServices] = await Promise.all([ getArmadoRapidoConfig(), getServiciosEmpresa() ]);
      setConfig(fetchedConfig);
      setVendibleServices(fetchedServices.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined));
    } catch (err: any) {
      setError("No se pudo cargar la configuración.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);
  
  const handleConfigChange = (field: keyof ArmadoRapidoConfig, value: any) => {
    setConfig(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handlePackageChange = (packageId: string, data: Partial<Omit<PaqueteArmadoRapido, 'id' | 'serviciosIncluidos'> & { serviciosIncluidos: ServicioIncluidoArmadoRapido[] }>) => {
    setConfig(prev => {
      if(!prev) return null;
      return {...prev, paquetes: prev.paquetes.map(p => p.id === packageId ? {...p, ...data} : p)};
    });
  };
  
  const handleSavePackage = (packageId: string | undefined, data: Pick<PaqueteArmadoRapido, 'nombre' | 'descripcion'>) => {
     setConfig(prev => {
        if (!prev) return null;
        if (packageId) {
            return {...prev, paquetes: prev.paquetes.map(p => p.id === packageId ? {...p, ...data} : p)};
        } else {
            const newPackage: PaqueteArmadoRapido = { id: `pkg_${Date.now()}`, ...data, serviciosIncluidos: [], incluyeSeleccionMenu: false };
            return {...prev, paquetes: [...prev.paquetes, newPackage]};
        }
     });
  };
  
  const handleDeletePackage = (id: string) => {
      setConfig(prev => {
          if (!prev) return null;
          return {...prev, paquetes: prev.paquetes.filter(p => p.id !== id)};
      });
  };

  const handleToggleService = (packageId: string, service: ServicioEmpresa) => {
      setConfig(prev => {
          if(!prev) return null;
          const paquetes = prev.paquetes.map(p => {
              if (p.id === packageId) {
                  const isIncluded = p.serviciosIncluidos.some(s => s.id === service.id);
                  const nuevosServicios = isIncluded 
                      ? p.serviciosIncluidos.filter(s => s.id !== service.id) 
                      : [...p.serviciosIncluidos, {
                          id: service.id,
                          nombre: service.nombre,
                          precioFijo: service.precioVenta || 0,
                          categoria: 'Servicio Adicional', // default category
                      }];
                  return {...p, serviciosIncluidos: nuevosServicios};
              }
              return p;
          });
          return {...prev, paquetes};
      });
  };

  const handleServiceCategoryChange = (packageId: string, serviceId: string, newCategory: ServicioIncluidoArmadoRapido['categoria']) => {
    setConfig(prev => {
        if (!prev) return null;
        return {
            ...prev,
            paquetes: prev.paquetes.map(p => {
                if (p.id === packageId) {
                    return {
                        ...p,
                        serviciosIncluidos: p.serviciosIncluidos.map(s => 
                            s.id === serviceId ? { ...s, categoria: newCategory } : s
                        )
                    };
                }
                return p;
            })
        };
    });
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const packageId = over?.data.current?.sortable.containerId;
    
    if (packageId && active.id !== over?.id) {
        setConfig(prev => {
            if(!prev) return null;
            const paquetes = prev.paquetes.map(p => {
                if (p.id === packageId) {
                    const oldIndex = p.serviciosIncluidos.findIndex(s => s.id === active.id);
                    const newIndex = p.serviciosIncluidos.findIndex(s => s.id === over.id);
                    if (oldIndex > -1 && newIndex > -1) {
                        return {...p, serviciosIncluidos: arrayMove(p.serviciosIncluidos, oldIndex, newIndex)};
                    }
                }
                return p;
            });
            return {...prev, paquetes};
        })
    }
  };

  const handleServiceCreated = (newService: ServicioEmpresa) => {
    setVendibleServices(prev => [newService, ...prev]);
  };

  const handleSaveChanges = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(config);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!", description: "Tus paquetes de armado rápido han sido actualizados." });
        loadData();
      } else {
        throw new Error(result.error || "No se pudo guardar la configuración.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !config) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error || 'No se pudo cargar la configuración.'}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1></div>
        <Link href="/settings/budget-display" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
            <CardHeader><CardTitle>Paquetes de Armado Rápido</CardTitle><CardDescription>Crea y configura los paquetes que tus clientes podrán elegir.</CardDescription></CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <AddOrEditPackageDialog onSave={(data) => handleSavePackage(undefined, data)} trigger={<Button><PlusCircle className="mr-2"/>Nuevo Paquete</Button>} />
                    <NewServiceModal onServiceCreated={handleServiceCreated} />
                </div>
                <Separator className="my-4"/>
                <div className="space-y-4">
                  {config.paquetes.map(pkg => (
                    <Accordion key={pkg.id} type="single" collapsible>
                      <AccordionItem value="item-1" className="border rounded-md">
                        <div className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-t-md">
                            <AccordionTrigger className="p-0 hover:no-underline flex-grow">
                               <div className="text-left">
                                    <p className="font-semibold">{pkg.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{pkg.descripcion}</p>
                               </div>
                            </AccordionTrigger>
                           <AddOrEditPackageDialog pkg={pkg} onSave={(data) => handleSavePackage(pkg.id, data)} onDelete={() => handleDeletePackage(pkg.id)} trigger={<Button variant="ghost" size="icon"><Settings className="w-4 h-4"/></Button>} />
                        </div>
                        <AccordionContent className="p-3 border-t">
                            <div className="flex items-center space-x-2 mb-3">
                              <Switch id={`incluye-menu-${pkg.id}`} checked={pkg.incluyeSeleccionMenu} onCheckedChange={(checked) => handlePackageChange(pkg.id, { incluyeSeleccionMenu: checked })} />
                              <Label htmlFor={`incluye-menu-${pkg.id}`} className="font-medium text-sm">Incluir Selección de Menú de Catering</Label>
                            </div>

                            <h4 className="text-sm font-medium mb-2">Servicios Incluidos</h4>
                             <Dialog>
                                <DialogTrigger asChild><Button variant="outline" size="sm">Añadir/Quitar Servicios</Button></DialogTrigger>
                                <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Seleccionar Servicios para "{pkg.nombre}"</DialogTitle></DialogHeader>
                                    <ScrollArea className="h-96 border rounded-md p-4 mt-4">
                                        {vendibleServices.map(s => (
                                            <div key={s.id} className="flex items-center gap-2 my-1"><Checkbox id={`pkg-${pkg.id}-serv-${s.id}`} checked={pkg.serviciosIncluidos.some(inc => inc.id === s.id)} onCheckedChange={() => handleToggleService(pkg.id, s)}/><Label htmlFor={`pkg-${pkg.id}-serv-${s.id}`}>{s.nombre} - {formatCurrency(s.precioVenta)}</Label></div>
                                        ))}
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>
                             <div className="mt-3 space-y-2">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={pkg.serviciosIncluidos.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        {pkg.serviciosIncluidos.map(s => (
                                            <div key={s.id} className="flex gap-2 items-center">
                                                <div className="w-48">
                                                    <Select value={s.categoria} onValueChange={(val) => handleServiceCategoryChange(pkg.id, s.id, val as any)}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Entrada">Entrada</SelectItem>
                                                            <SelectItem value="Plato Principal">Plato Principal</SelectItem>
                                                            <SelectItem value="Postre">Postre</SelectItem>
                                                            <SelectItem value="Menú Adolescente">Menú Adolescente</SelectItem>
                                                            <SelectItem value="Menú Niño">Menú Niño</SelectItem>
                                                            <SelectItem value="Servicio Adicional">Servicio Adicional</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DraggableServiceItem item={s} onRemove={() => handleToggleService(pkg.id, {id: s.id} as ServicioEmpresa)}/>
                                            </div>
                                        ))}
                                    </SortableContext>
                                </DndContext>
                             </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </div>
            </CardContent>
        </Card>
        
        <Card className="shadow-lg">
            <CardHeader><CardTitle>Configuración Global</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="descuento-general">Descuento General (%)</Label>
                    <Input id="descuento-general" type="number" value={config.descuentoGeneral || ''} onChange={e => handleConfigChange('descuentoGeneral', Number(e.target.value) || undefined)} placeholder="Ej: 10 para 10%"/>
                </div>
            </CardContent>
        </Card>
      </div>

      <CardFooter className="border-t pt-6">
        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}
            {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </CardFooter>
    </div>
  );
}
