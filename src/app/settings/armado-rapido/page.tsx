
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

// Simplified component for displaying a list of services in a category
const ServiceList = ({ title, items, onAdd, onDelete, onEdit, itemType }: { 
    title: string;
    items: (ServicioIncluidoArmadoRapido)[];
    onAdd: () => void;
    onDelete: (itemId: string) => void;
    onEdit: (item: ServicioIncluidoArmadoRapido) => void;
    itemType: 'menu' | 'paquete';
}) => (
    <Card className="bg-muted/30 h-full flex flex-col">
        <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            <Button onClick={onAdd} size="sm" className="w-full mb-3"><PlusCircle className="w-4 h-4 mr-2"/>Añadir desde Catálogo</Button>
            {items.length > 0 ? (
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm p-2 border rounded-md bg-background">
                            <span>{item.nombre}</span>
                            <div className="flex items-center gap-1">
                                <Badge variant="outline">{item.categoria}</Badge>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}><Settings className="w-4 h-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-xs text-center text-muted-foreground py-4">No hay servicios en esta lista.</p>}
        </CardContent>
    </Card>
);

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [vendibleServices, setVendibleServices] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'menu' | 'paquete'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState<Map<string, {categoria: ServicioCategoriaArmadoRapido}>>(new Map());
  

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedConfig, fetchedServices] = await Promise.all([ getArmadoRapidoConfig(), getServiciosEmpresa() ]);
      setConfig({
        ...fetchedConfig,
        paquetes: fetchedConfig.paquetes || [],
        menus: fetchedConfig.menus || [],
      });
      setVendibleServices(fetchedServices.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined));
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo cargar la configuración.", variant: "destructive" });
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

  const openServiceSelectorModal = (type: 'menu' | 'paquete') => {
      setModalMode(type);
      const listKey = type === 'menu' ? 'menus' : 'paquetes';
      // For menus, we assume a single menu config. For packages, we'd need to know which one.
      // Let's simplify: there's ONE menu list and ONE package list to add to.
      const currentList = config?.[listKey]?.[0]?.serviciosIncluidos || [];
      const initialSelection = new Map(currentList.map(s => [s.id, { categoria: s.categoria }]));
      setSelectedServices(initialSelection);
      setSearchTerm('');
      setIsModalOpen(true);
  }

  const handleToggleServiceSelection = (service: ServicioEmpresa) => {
    setSelectedServices(prev => {
        const newMap = new Map(prev);
        if (newMap.has(service.id)) {
            newMap.delete(service.id);
        } else {
            const defaultCategory = modalMode === 'menu' ? 'Entrada' : 'Servicio Adicional';
            newMap.set(service.id, { categoria: defaultCategory });
        }
        return newMap;
    });
  };

  const handleSaveSelection = () => {
    const listKey = modalMode === 'menu' ? 'menus' : 'paquetes';
    const newServiciosIncluidos = Array.from(selectedServices.entries()).map(([serviceId, data]) => {
        const serviceData = vendibleServices.find(s => s.id === serviceId);
        return {
            id: serviceId,
            nombre: serviceData?.nombre || 'Servicio Desconocido',
            precioFijo: serviceData?.precioVenta || 0,
            categoria: data.categoria
        };
    });

    setConfig(prevConfig => {
      if (!prevConfig) return null;
      // We are simplifying to have only ONE menu and ONE package for configuration ease.
      // This can be expanded later if multiple package/menu options are needed.
      const updatedList = prevConfig[listKey] || [];
      if (updatedList.length === 0) {
        updatedList.push({ id: `${modalMode}_0`, nombre: modalMode === 'menu' ? 'Oferta Gastronómica' : 'Servicios Adicionales', serviciosIncluidos: newServiciosIncluidos });
      } else {
        updatedList[0].serviciosIncluidos = newServiciosIncluidos;
      }
      return { ...prevConfig, [listKey]: [...updatedList] };
    });
    
    setIsModalOpen(false);
    toast({title: "Lista actualizada", description: "No olvides guardar los cambios generales."});
  };

  const handleDeleteFromList = (type: 'menu' | 'paquete', serviceId: string) => {
    setConfig(prev => {
        if (!prev) return null;
        const listKey = type === 'menu' ? 'menus' : 'paquetes';
        const list = prev[listKey] || [];
        if (list.length > 0) {
            list[0].serviciosIncluidos = list[0].serviciosIncluidos.filter(s => s.id !== serviceId);
        }
        return { ...prev, [listKey]: [...list] };
    });
  };

  if (isLoading || !config) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const getServicesByCategory = (type: 'menu' | 'paquete', category: ServicioCategoriaArmadoRapido): ServicioIncluidoArmadoRapido[] => {
      const listKey = type === 'menu' ? 'menus' : 'paquetes';
      if (!config?.[listKey]?.[0]) return [];
      return config[listKey][0].serviciosIncluidos.filter(s => s.categoria === category);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
            <DialogHeader><DialogTitle>Seleccionar Servicios del Catálogo</DialogTitle><DialogDescription>Elige los servicios que quieres ofrecer en esta lista.</DialogDescription></DialogHeader>
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/></div>
            <div className="flex-grow min-h-0">
                <ScrollArea className="h-full border rounded-md p-2">
                    {vendibleServices.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                        <div key={s.id} className="flex items-center gap-3 my-1 p-1 hover:bg-muted rounded-md">
                            <Checkbox id={`sel-${s.id}`} checked={selectedServices.has(s.id)} onCheckedChange={() => handleToggleServiceSelection(s)}/>
                            <Label htmlFor={`sel-${s.id}`} className="cursor-pointer flex-grow">{s.nombre} - {formatCurrency(s.precioVenta)}</Label>
                        </div>
                    ))}
                </ScrollArea>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveSelection}>Añadir Seleccionados</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1></div>
        <Link href="/settings" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>

       <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><ChefHat className="text-primary"/>Oferta Gastronómica (Paso 2)</CardTitle>
            <CardDescription>Aquí defines todas las opciones de comida que aparecerán en el cotizador. Agrúpalas por categoría para que el cliente pueda elegir.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ServiceList 
                title="Lista de Entradas" 
                items={getServicesByCategory('menu', 'Entrada')}
                onAdd={() => openServiceSelectorModal('menu')}
                onDelete={(id) => handleDeleteFromList('menu', id)}
                onEdit={() => {}} // Simplified: edit is done via the full selector
                itemType="menu"
            />
             <ServiceList 
                title="Lista de Platos Principales" 
                items={getServicesByCategory('menu', 'Plato Principal')}
                onAdd={() => openServiceSelectorModal('menu')}
                onDelete={(id) => handleDeleteFromList('menu', id)}
                onEdit={() => {}}
                itemType="menu"
            />
             <ServiceList 
                title="Lista Menú Niños/Adolescentes" 
                items={[...getServicesByCategory('menu', 'Menú Niño'), ...getServicesByCategory('menu', 'Menú Adolescente')]}
                onAdd={() => openServiceSelectorModal('menu')}
                onDelete={(id) => handleDeleteFromList('menu', id)}
                onEdit={() => {}}
                itemType="menu"
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes de Servicios Adicionales (Paso 3)</CardTitle>
            <CardDescription>Crea los paquetes con servicios como DJ, decoración, fotografía, etc. El cliente elegirá uno de estos paquetes.</CardDescription>
          </CardHeader>
           <CardContent className="space-y-4">
               <Button onClick={() => openServiceSelectorModal('paquete')}><PlusCircle className="w-4 h-4 mr-2"/>Configurar Servicios del Paquete</Button>
               <Separator/>
                {(config.paquetes[0]?.serviciosIncluidos || []).length > 0 ? (
                    <ul className="space-y-1 text-sm">
                        {(config.paquetes[0].serviciosIncluidos).map(s => (
                            <li key={s.id} className="flex justify-between items-center p-2 border rounded-md">
                                <span>{s.nombre}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteFromList('paquete', s.id)}><Trash2 className="w-4 h-4"/></Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No hay servicios en el paquete adicional.</p>
                )}
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
