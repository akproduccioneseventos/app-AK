
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, Package, Trash2, Settings, GripVertical, BookOpen, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioIncluidoArmadoRapido, ServicioCategoriaArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa, CategoriaServicio as CategoriaServicioEmpresa, UnidadServicio } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};


const CATEGORIAS_PRESUPUESTO: { value: ServicioCategoriaArmadoRapido, label: string }[] = [
    { value: 'Entrada', label: 'Entrada' },
    { value: 'Plato Principal', label: 'Plato Principal' },
    { value: 'Menú Niño y Adolescente', label: 'Menú Niño y Adolescente' },
    { value: 'Servicio Adicional', label: 'Servicio Adicional' },
];


function SortableServiceItem({ service, onRemove }: { service: ServicioIncluidoArmadoRapido, onRemove: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: service.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} className="p-2 border rounded-md bg-background flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" {...listeners} {...attributes} className="cursor-grab h-7 w-7"><GripVertical className="w-4 h-4"/></Button>
                <div>
                  <p className="text-sm font-medium">{service.nombre}</p>
                  <Badge variant="secondary" className="text-xs">{service.categoria}</Badge>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{formatCurrency(service.precioFijo)}</p>
                <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive"><Trash2 className="w-4 h-4"/></Button>
            </div>
        </div>
    );
}

function AddOrEditPackageDialog({
  isOpen, onOpenChange, onSave, pkg, vendibleServices
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pkgData: Omit<PaqueteArmadoRapido, 'id'> | PaqueteArmadoRapido) => void;
  pkg: Partial<PaqueteArmadoRapido> | null;
  vendibleServices: ServicioEmpresa[];
}) {
  const [localPkg, setLocalPkg] = useState<Partial<PaqueteArmadoRapido> | null>(pkg);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => { setLocalPkg(pkg); }, [pkg]);

  const handleToggleService = (service: ServicioEmpresa) => {
    setLocalPkg(prev => {
      if (!prev) return null;
      const servicios = prev.serviciosIncluidos || [];
      const isIncluded = servicios.some(s => s.id === service.id);
      let newServicios;
      if (isIncluded) {
        newServicios = servicios.filter(s => s.id !== service.id);
      } else {
        const newService: ServicioIncluidoArmadoRapido = {
          id: service.id,
          nombre: service.nombre,
          precioFijo: service.precioVenta || 0,
          categoria: 'Servicio Adicional' // Default, can be changed
        };
        newServicios = [...servicios, newService];
      }
      return { ...prev, serviciosIncluidos: newServicios };
    });
  };
  
  const handleCategoryChange = (serviceId: string, newCategory: ServicioCategoriaArmadoRapido) => {
     setLocalPkg(prev => {
        if (!prev || !prev.serviciosIncluidos) return prev;
        const newServicios = prev.serviciosIncluidos.map(s => 
            s.id === serviceId ? {...s, categoria: newCategory} : s
        );
        return {...prev, serviciosIncluidos: newServicios};
     });
  };

  const handlePriceChange = (serviceId: string, newPrice: string) => {
    const priceNum = parseFloat(newPrice) || 0;
     setLocalPkg(prev => {
        if (!prev || !prev.serviciosIncluidos) return prev;
        const newServicios = prev.serviciosIncluidos.map(s => 
            s.id === serviceId ? {...s, precioFijo: priceNum} : s
        );
        return {...prev, serviciosIncluidos: newServicios};
     });
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!localPkg || !localPkg.nombre?.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" }); return;
    }
    onSave(localPkg as PaqueteArmadoRapido);
  };
  
  const filteredServices = vendibleServices.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!localPkg) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle>{localPkg.id ? 'Editar' : 'Crear'} Paquete</DialogTitle><DialogDescription>Define un paquete de servicios para el cotizador rápido.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
          {/* Left Column: Package Details */}
          <div className="space-y-4 flex flex-col">
              <div className="space-y-1"><Label htmlFor="pkg-name">Nombre del Paquete*</Label><Input id="pkg-name" value={localPkg.nombre || ''} onChange={e => setLocalPkg(p => p ? {...p, nombre: e.target.value} : null)} required /></div>
              <div className="space-y-1"><Label htmlFor="pkg-desc">Descripción</Label><Input id="pkg-desc" value={localPkg.descripcion || ''} onChange={e => setLocalPkg(p => p ? {...p, descripcion: e.target.value} : null)}/></div>
              <div className="flex items-center space-x-2">
                <Checkbox id="incluye-menu" checked={localPkg.incluyeSeleccionMenu} onCheckedChange={(checked) => setLocalPkg(p => p ? {...p, incluyeSeleccionMenu: !!checked} : null)}/>
                <Label htmlFor="incluye-menu">Este paquete es un Menú de Catering (para Paso 2)</Label>
              </div>
              <Separator />
              <Label>Servicios Incluidos en el Paquete</Label>
               <div className="flex-grow min-h-0">
                <ScrollArea className="h-full border rounded-md p-2">
                  {(localPkg.serviciosIncluidos || []).length === 0 ? <p className="text-sm text-center text-muted-foreground py-4">Añade servicios desde el catálogo.</p> :
                   <div className="space-y-2">
                     {(localPkg.serviciosIncluidos || []).map(s => (
                       <Card key={s.id} className="p-2">
                          <div className="grid grid-cols-2 gap-2">
                              <div className="col-span-2"><p className="font-medium text-sm">{s.nombre}</p></div>
                              <div className="space-y-1"><Label className="text-xs">Categoría</Label><Select value={s.categoria} onValueChange={(val) => handleCategoryChange(s.id, val as ServicioCategoriaArmadoRapido)}><SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger><SelectContent>{CATEGORIAS_PRESUPUESTO.map(c=><SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                              <div className="space-y-1"><Label className="text-xs">Precio Fijo</Label><Input type="number" value={s.precioFijo} onChange={e=>handlePriceChange(s.id, e.target.value)} className="h-8 text-xs"/></div>
                          </div>
                       </Card>
                     ))}
                   </div>
                  }
                </ScrollArea>
              </div>
          </div>
          {/* Right Column: Service Catalog */}
          <div className="space-y-2 flex flex-col">
              <Label htmlFor="service-search">Catálogo de Servicios Vendibles</Label>
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input id="service-search" placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/></div>
              <div className="flex-grow min-h-0">
                <ScrollArea className="h-full border rounded-md p-2">
                    {filteredServices.map(s => (<div key={s.id} className="flex items-center gap-2 my-1"><Checkbox id={`serv-${s.id}`} checked={localPkg.serviciosIncluidos?.some(inc => inc.id === s.id)} onCheckedChange={() => handleToggleService(s)}/><Label htmlFor={`serv-${s.id}`}>{s.nombre} - {formatCurrency(s.precioVenta)}</Label></div>))}
                </ScrollArea>
              </div>
          </div>
        </form>
        <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSubmit}>Guardar Paquete</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [vendibleServices, setVendibleServices] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPkg, setCurrentPkg] = useState<Partial<PaqueteArmadoRapido> | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedConfig, fetchedServices] = await Promise.all([ getArmadoRapidoConfig(), getServiciosEmpresa() ]);
      setConfig({
        ...fetchedConfig,
        paquetes: fetchedConfig.paquetes || [],
        menus: fetchedConfig.menus || [],
      });
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

  const handleAddOrEditPackage = (pkg?: PaqueteArmadoRapido) => {
    setCurrentPkg(pkg || { nombre: '', descripcion: '', serviciosIncluidos: [], incluyeSeleccionMenu: false });
    setIsModalOpen(true);
  };
  
  const handleSavePackage = (pkgData: Omit<PaqueteArmadoRapido, 'id'> | PaqueteArmadoRapido) => {
    setConfig(prevConfig => {
        if (!prevConfig) return null;
        const paquetes = prevConfig.paquetes || [];
        if ('id' in pkgData) { // Editing
            const index = paquetes.findIndex(p => p.id === pkgData.id);
            if (index > -1) paquetes[index] = pkgData;
        } else { // Adding
            const newPkg = { ...pkgData, id: `pkg_${Date.now()}`};
            paquetes.push(newPkg);
        }
        return { ...prevConfig, paquetes: [...paquetes] };
    });
    setIsModalOpen(false);
  };
  
  const handleDeletePackage = (pkgId: string) => {
    setConfig(prev => {
        if (!prev) return null;
        return { ...prev, paquetes: (prev.paquetes || []).filter(p => p.id !== pkgId) };
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !config) return <div className="text-center text-destructive p-4">Error al cargar datos.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {currentPkg && <AddOrEditPackageDialog isOpen={isModalOpen} onOpenChange={setIsModalOpen} onSave={handleSavePackage} pkg={currentPkg} vendibleServices={vendibleServices}/>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1></div>
        <Link href="/settings/budget-display" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Descuento General</CardTitle>
          <CardDescription>Aplica un descuento porcentual a todas las cotizaciones generadas con esta herramienta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1">
             <Label htmlFor="descuento-general">Descuento General (%)</Label>
             <Input id="descuento-general" type="number" value={config.descuentoGeneral || ''} onChange={e => handleConfigChange('descuentoGeneral', Number(e.target.value) || undefined)} placeholder="Ej: 10 para 10%"/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Configurar Paquetes</CardTitle>
          <CardDescription>Crea y edita los paquetes de servicios que tus clientes podrán elegir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button onClick={() => handleAddOrEditPackage()}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete Nuevo</Button>
            <Separator />
            <div className="space-y-3">
              {(config.paquetes || []).map(pkg => (
                <Card key={pkg.id} className="bg-muted/30">
                  <CardHeader className="flex-row items-center justify-between p-3">
                      <div>
                          <CardTitle className="text-lg">{pkg.nombre}</CardTitle>
                          <CardDescription className="text-xs">{pkg.descripcion}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleAddOrEditPackage(pkg)}><Settings className="w-4 h-4"/></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeletePackage(pkg.id)}><Trash2 className="w-4 h-4"/></Button>
                      </div>
                  </CardHeader>
                  <CardContent className="p-3 border-t">
                      {pkg.serviciosIncluidos.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                              {pkg.serviciosIncluidos.map(s => <li key={s.id} className="flex justify-between"><span>{s.nombre} <Badge variant="outline" className="text-xs">{s.categoria}</Badge></span> <span>{formatCurrency(s.precioFijo)}</span></li>)}
                          </ul>
                      ) : <p className="text-sm text-muted-foreground">Este paquete no tiene servicios.</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
        </CardContent>
      </Card>
      
      <CardFooter className="border-t pt-6">
        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}
            {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </CardFooter>
    </div>
  );
}
