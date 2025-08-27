
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, Package, Trash2, Settings, ChefHat, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido, ServicioCategoriaArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const CATEGORIAS_PRESUPUESTO: { value: ServicioCategoriaArmadoRapido, label: string }[] = [
    { value: 'Entrada', label: 'Entrada' },
    { value: 'Plato Principal', label: 'Plato Principal' },
    { value: 'Menú Adolescente', label: 'Menú Adolescente' },
    { value: 'Menú Niño', label: 'Menú Niño' },
    { value: 'Servicio Adicional', label: 'Servicio Adicional' },
];

function AddOrEditDialog({
  isOpen, onOpenChange, onSave, item, vendibleServices, itemType
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (itemData: any) => void;
  item: Partial<PaqueteArmadoRapido> | Partial<MenuArmadoRapido> | null;
  vendibleServices: ServicioEmpresa[];
  itemType: 'paquete' | 'menu';
}) {
  const [localItem, setLocalItem] = useState<Partial<PaqueteArmadoRapido> | Partial<MenuArmadoRapido> | null>(item);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => { setLocalItem(item); }, [item]);

  const handleToggleService = (service: ServicioEmpresa) => {
    setLocalItem(prev => {
      if (!prev) return null;
      const servicios = prev.serviciosIncluidos || [];
      const isIncluded = servicios.some(s => s.id === service.id);
      let newServicios;
      if (isIncluded) {
        newServicios = servicios.filter(s => s.id !== service.id);
      } else {
        const defaultCategory = itemType === 'menu' ? 'Entrada' : 'Servicio Adicional';
        const newService: ServicioIncluidoArmadoRapido = {
          id: service.id,
          nombre: service.nombre,
          precioFijo: service.precioVenta || 0,
          categoria: defaultCategory,
        };
        newServicios = [...servicios, newService];
      }
      return { ...prev, serviciosIncluidos: newServicios };
    });
  };
  
   const handleServiceCategoryChange = (serviceId: string, newCategory: ServicioCategoriaArmadoRapido) => {
    setLocalItem(prev => {
      if (!prev) return null;
      const updatedServicios = (prev.serviciosIncluidos || []).map(s => 
        s.id === serviceId ? { ...s, categoria: newCategory } : s
      );
      return { ...prev, serviciosIncluidos: updatedServicios };
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!localItem || !localItem.nombre?.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" }); return;
    }
    onSave(localItem);
  };
  
  const filteredServices = vendibleServices.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!localItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{localItem.id ? 'Editar' : 'Crear'} {itemType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle>
          <DialogDescription>Define un {itemType} para el cotizador rápido.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
          <div className="space-y-4 flex flex-col">
              <div className="space-y-1"><Label htmlFor="item-name">Nombre*</Label><Input id="item-name" value={localItem.nombre || ''} onChange={e => setLocalItem(p => p ? {...p, nombre: e.target.value} : null)} required /></div>
              <div className="space-y-1"><Label htmlFor="item-desc">Descripción</Label><Input id="item-desc" value={localItem.descripcion || ''} onChange={e => setLocalItem(p => p ? {...p, descripcion: e.target.value} : null)}/></div>
              <Separator />
              <Label>Servicios Incluidos</Label>
               <div className="flex-grow min-h-0">
                <ScrollArea className="h-full border rounded-md p-2">
                  {(localItem.serviciosIncluidos || []).length === 0 ? <p className="text-sm text-center text-muted-foreground py-4">Añade servicios desde el catálogo.</p> :
                   <div className="space-y-2">
                     {(localItem.serviciosIncluidos || []).map(s => (
                       <Card key={s.id} className="p-2 bg-background">
                          <p className="font-medium text-sm">{s.nombre}</p>
                           {itemType === 'menu' && (
                                <div className="mt-2">
                                <Label className="text-xs">Categoría en Presupuesto</Label>
                                <Select value={s.categoria} onValueChange={(val) => handleServiceCategoryChange(s.id, val as ServicioCategoriaArmadoRapido)}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIAS_PRESUPUESTO.map(cat => <SelectItem key={cat.value} value={cat.value} className="text-xs">{cat.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                </div>
                            )}
                       </Card>
                     ))}
                   </div>
                  }
                </ScrollArea>
              </div>
          </div>
          <div className="space-y-2 flex flex-col">
              <Label htmlFor="service-search">Catálogo de Servicios Vendibles</Label>
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input id="service-search" placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/></div>
              <div className="flex-grow min-h-0">
                <ScrollArea className="h-full border rounded-md p-2">
                    {filteredServices.map(s => (<div key={s.id} className="flex items-center gap-2 my-1"><Checkbox id={`serv-${s.id}`} checked={localItem.serviciosIncluidos?.some(inc => inc.id === s.id)} onCheckedChange={() => handleToggleService(s)}/><Label htmlFor={`serv-${s.id}`} className="cursor-pointer">{s.nombre} - {formatCurrency(s.precioVenta)}</Label></div>))}
                </ScrollArea>
              </div>
          </div>
        </form>
        <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSubmit}>Guardar</Button></DialogFooter>
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
  const [currentItem, setCurrentItem] = useState<Partial<PaqueteArmadoRapido> | Partial<MenuArmadoRapido> | null>(null);
  const [itemType, setItemType] = useState<'paquete' | 'menu'>('paquete');


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
  
  const handleSaveChanges = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(config);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!" });
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

  const handleOpenDialog = (type: 'paquete' | 'menu', item?: PaqueteArmadoRapido | MenuArmadoRapido) => {
    setItemType(type);
    setCurrentItem(item || { nombre: '', descripcion: '', serviciosIncluidos: [] });
    setIsModalOpen(true);
  };
  
  const handleSaveItem = (itemData: Omit<PaqueteArmadoRapido, 'id'> | PaqueteArmadoRapido | Omit<MenuArmadoRapido, 'id'> | MenuArmadoRapido) => {
    setConfig(prevConfig => {
        if (!prevConfig) return null;

        const listKey = itemType === 'paquete' ? 'paquetes' : 'menus';
        const list = prevConfig[listKey] || [];
        
        if ('id' in itemData && itemData.id) { // Editing
            const index = list.findIndex((p: any) => p.id === itemData.id);
            if (index > -1) (list[index] as any) = itemData;
        } else { // Adding
            const newItem = { ...itemData, id: `${itemType}_${Date.now()}`};
            list.push(newItem as any);
        }
        return { ...prevConfig, [listKey]: [...list] };
    });
    setIsModalOpen(false);
  };

  const handleDeleteItem = (type: 'paquete' | 'menu', itemId: string) => {
    setConfig(prev => {
        if (!prev) return null;
        const listKey = type === 'paquete' ? 'paquetes' : 'menus';
        return { ...prev, [listKey]: (prev[listKey] || []).filter((p: any) => p.id !== itemId) };
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !config) return <div className="text-center text-destructive p-4">Error al cargar datos.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AddOrEditDialog isOpen={isModalOpen} onOpenChange={setIsModalOpen} onSave={handleSaveItem} item={currentItem} vendibleServices={vendibleServices} itemType={itemType}/>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1></div>
        <Link href="/settings/budget-display" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MENUS COLUMN */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><ChefHat className="text-primary"/>Menús de Catering para el Paso 2</CardTitle>
            <CardDescription>Crea los menús base. El cliente elegirá uno de estos y luego los platos específicos de las categorías que hayas definido (Entrada, Plato Principal, etc.).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <Button onClick={() => handleOpenDialog('menu')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Menú Nuevo</Button>
              <Separator />
              <div className="space-y-3">
                {(config.menus || []).map(menu => (
                  <Card key={menu.id} className="bg-muted/30">
                    <CardHeader className="flex-row items-center justify-between p-3">
                        <div><CardTitle className="text-lg">{menu.nombre}</CardTitle><CardDescription className="text-xs">{menu.descripcion}</CardDescription></div>
                        <div className="flex gap-2"><Button variant="outline" size="icon" onClick={() => handleOpenDialog('menu', menu)}><Settings className="w-4 h-4"/></Button><Button variant="destructive" size="icon" onClick={() => handleDeleteItem('menu', menu.id)}><Trash2 className="w-4 h-4"/></Button></div>
                    </CardHeader>
                    <CardContent className="p-3 border-t">
                      {menu.serviciosIncluidos.length > 0 ? (<ul className="space-y-1 text-sm">{menu.serviciosIncluidos.map(s => <li key={s.id} className="flex justify-between"><span>{s.nombre}</span> <Badge variant="outline">{s.categoria}</Badge></li>)}</ul>) : <p className="text-sm text-muted-foreground">Este menú no tiene platos.</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
          </CardContent>
        </Card>

        {/* PAQUETES COLUMN */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes de Servicios para el Paso 3</CardTitle>
            <CardDescription>Crea los paquetes de servicios adicionales (DJ, foto, etc.) para el tercer paso del cotizador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <Button onClick={() => handleOpenDialog('paquete')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete Nuevo</Button>
              <Separator />
              <div className="space-y-3">
                {(config.paquetes || []).map(pkg => (
                  <Card key={pkg.id} className="bg-muted/30">
                    <CardHeader className="flex-row items-center justify-between p-3">
                        <div><CardTitle className="text-lg">{pkg.nombre}</CardTitle><CardDescription className="text-xs">{pkg.descripcion}</CardDescription></div>
                        <div className="flex gap-2"><Button variant="outline" size="icon" onClick={() => handleOpenDialog('paquete', pkg)}><Settings className="w-4 h-4"/></Button><Button variant="destructive" size="icon" onClick={() => handleDeleteItem('paquete', pkg.id)}><Trash2 className="w-4 h-4"/></Button></div>
                    </CardHeader>
                    <CardContent className="p-3 border-t">
                      {pkg.serviciosIncluidos.length > 0 ? (<ul className="space-y-1 text-sm">{pkg.serviciosIncluidos.map(s => <li key={s.id} className="flex justify-between"><span>{s.nombre}</span> <span>{formatCurrency(s.precioFijo)}</span></li>)}</ul>) : <p className="text-sm text-muted-foreground">Este paquete no tiene servicios.</p>}
                    </CardContent>
                  </Card>
                ))}
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
