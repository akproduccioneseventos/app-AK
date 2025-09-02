
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, Package, Trash2, Settings, ChefHat, Search, ChevronDown, Gift, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
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
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const CATEGORIAS_MENU: { value: ServicioCategoriaArmadoRapido, label: string }[] = [
    { value: 'Entrada', label: 'Entrada' },
    { value: 'Plato Principal', label: 'Plato Principal' },
    { value: 'Menú Adolescente / Niño', label: 'Menú Adolescente / Niño' },
];

function AddOrEditDialog({
    isOpen,
    onOpenChange,
    onSave,
    item,
    vendibleServices,
    mode,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (item: MenuArmadoRapido | PaqueteArmadoRapido) => void;
    item: MenuArmadoRapido | PaqueteArmadoRapido | null;
    vendibleServices: ServicioEmpresa[];
    mode: 'menu' | 'paquete';
}) {
    const [localItem, setLocalItem] = useState<MenuArmadoRapido | PaqueteArmadoRapido | null>(item);
    const [searchTerm, setSearchTerm] = useState('');
    const [openCollapsibleId, setOpenCollapsibleId] = useState<string | null>(null);

    useEffect(() => {
        setLocalItem(item);
    }, [item]);

    if (!localItem) return null;

    const handleToggleService = (service: ServicioEmpresa) => {
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
      value: string | number | boolean
    ) => {
      setLocalItem(prev => {
        if (!prev) return null;
        return {
          ...prev,
          serviciosIncluidos: prev.serviciosIncluidos.map(s => {
            if (s.id !== serviceId) return s;
            const updatedService = { ...s, [field]: value };
            if (field === 'calculationMethod') {
              updatedService.precioBase = undefined;
              updatedService.precioPorPersona = undefined;
              updatedService.invitadosPorUnidad = undefined;
              updatedService.tramosDePrecio = undefined;
              if (value === 'fijo' || value === 'ratio') {
                const catalogService = vendibleServices.find(vs => vs.id === serviceId);
                updatedService.precioBase = catalogService?.precioVenta || 0;
              }
            }
             if (field === 'esRegalo') {
                updatedService.precioBase = value ? 0 : (vendibleServices.find(vs => vs.id === serviceId)?.precioVenta || 0);
             }
            return updatedService;
          })
        }
      })
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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">{localItem.id && !localItem.id.startsWith('new_') ? 'Editar' : 'Crear'} {mode === 'menu' ? 'Menú de Catering' : 'Paquete de Servicios'}</DialogTitle>
                     <DialogDescription>
                        {mode === 'menu' 
                          ? "Gestiona todas las opciones de catering que tus clientes podrán elegir en el Armado Rápido."
                          : "Define los paquetes de servicios adicionales como discoteca, fotografía, etc."}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 py-2 min-h-0">
                    {/* Columna Izquierda: Detalles y Servicios Incluidos */}
                    <div className="flex flex-col gap-4 min-h-0">
                      {mode === 'paquete' && (
                        <>
                          <div className="space-y-1">
                              <Label>Nombre del Paquete</Label>
                              <Input value={localItem.nombre} onChange={e => setLocalItem(p => p ? { ...p, nombre: e.target.value } : null)} />
                          </div>
                          <div className="space-y-1">
                              <Label>Descripción</Label>
                              <Input value={localItem.descripcion || ''} onChange={e => setLocalItem(p => p ? { ...p, descripcion: e.target.value } : null)} />
                          </div>
                        </>
                      )}
                      <div className="space-y-1 flex-grow flex flex-col min-h-0">
                        <Label>Servicios Incluidos en este {mode === 'menu' ? 'Menú' : 'Paquete'}</Label>
                         <ScrollArea className="h-full border rounded-md p-2">
                           {(localItem.serviciosIncluidos || []).length === 0 ? <p className="text-sm text-center text-muted-foreground py-4">Añade servicios desde el catálogo.</p> :
                            <div className="space-y-2">
                              {(localItem.serviciosIncluidos || []).map(s => (
                                <Collapsible key={s.id} onOpenChange={(open) => setOpenCollapsibleId(open ? s.id : null)} className="border rounded-md bg-background p-2">
                                  <div className="flex items-center gap-3">
                                    <Checkbox id={`current-${s.id}`} checked={true} onCheckedChange={() => handleToggleService(vendibleServices.find(vs => vs.id === s.id)!)} />
                                    <Label htmlFor={`current-${s.id}`} className="flex-grow cursor-pointer">{s.nombre}</Label>
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs">
                                        Configurar Precio
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", openCollapsibleId === s.id && "rotate-180")} />
                                      </Button>
                                    </CollapsibleTrigger>
                                  </div>
                                  <CollapsibleContent className="pt-3 mt-2 border-t space-y-3">
                                      {mode === 'menu' ? (
                                          <Select value={s.categoria} onValueChange={(val) => handleCategoryChange(s.id, val as ServicioCategoriaArmadoRapido)}>
                                              <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                              <SelectContent>{CATEGORIAS_MENU.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                                          </Select>
                                      ) : (
                                          <div className="space-y-2">
                                              <Select value={s.calculationMethod || 'fijo'} onValueChange={(v) => handleServiceDetailChange(s.id, 'calculationMethod', v)}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="fijo" className="text-xs">Precio Fijo</SelectItem>
                                                  <SelectItem value="porPersona" className="text-xs">Por Persona</SelectItem>
                                                  <SelectItem value="ratio" className="text-xs">Ratio (ej: 1 por cada X personas)</SelectItem>
                                                  <SelectItem value="tramos" className="text-xs">Por Tramos de Invitados</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              {s.calculationMethod === 'fijo' && <Input type="number" placeholder="Precio Fijo" value={s.precioBase || 0} onChange={e => handleServiceDetailChange(s.id, 'precioBase', e.target.value)} className="h-8 text-xs"/>}
                                              {s.calculationMethod === 'porPersona' && <Input type="number" placeholder="Precio por Persona" value={s.precioPorPersona || 0} onChange={e => handleServiceDetailChange(s.id, 'precioPorPersona', e.target.value)} className="h-8 text-xs"/>}
                                              {s.calculationMethod === 'ratio' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input type="number" placeholder="Precio Base/Unidad" value={s.precioBase || 0} onChange={e => handleServiceDetailChange(s.id, 'precioBase', e.target.value)} className="h-8 text-xs"/>
                                                    <Input type="number" placeholder="Invitados/Unidad" value={s.invitadosPorUnidad || 0} onChange={e => handleServiceDetailChange(s.id, 'invitadosPorUnidad', e.target.value)} className="h-8 text-xs"/>
                                                </div>
                                              )}
                                              {/* Tramo editor is complex, skipping for now */}
                                              <div className="flex items-center space-x-2 pt-1">
                                                  <Checkbox id={`serv-regalo-${s.id}`} checked={s.esRegalo} onCheckedChange={(checked) => handleServiceDetailChange(s.id, 'esRegalo', !!checked)}/>
                                                  <Label htmlFor={`serv-regalo-${s.id}`} className="text-xs font-normal flex items-center gap-1"><Gift className="w-3 h-3"/>Es Regalo</Label>
                                              </div>
                                          </div>
                                      )}
                                  </CollapsibleContent>
                                </Collapsible>
                              ))}
                             </div>
                           }
                         </ScrollArea>
                      </div>
                    </div>
                    {/* Columna Derecha: Catálogo de Servicios */}
                    <div className="flex flex-col gap-2 min-h-0">
                        <Label>Catálogo de Servicios Vendibles</Label>
                        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/></div>
                        <ScrollArea className="h-full border rounded-md p-2">
                          {vendibleServices.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
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
                    <Button onClick={() => onSave(localItem)}>Guardar</Button>
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
  const [isSaving, setIsSaving] = useState(false);
  
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
  
  const openDialog = (mode: 'menu' | 'paquete', item?: MenuArmadoRapido | PaqueteArmadoRapido) => {
    setModalMode(mode);
    if(mode === 'menu'){
        const menuToEdit = config?.menus[0] || { id: 'menu_catering', nombre: 'Menú de Catering', descripcion: 'Opciones de catering para el armado rápido', serviciosIncluidos: [] };
        setCurrentItem(menuToEdit);
    } else {
        setCurrentItem(item || { id: `new_${mode}_${Date.now()}`, nombre: `Nuevo Paquete`, serviciosIncluidos: [] });
    }
    setIsModalOpen(true);
  }
  
  const handleSaveItem = (item: MenuArmadoRapido | PaqueteArmadoRapido) => {
      const listKey = modalMode === 'menu' ? 'menus' : 'paquetes';
      setConfig(prev => {
          if (!prev) return null;
          if(listKey === 'menus'){
            return {...prev, menus: [item as MenuArmadoRapido]};
          }
          const list = prev[listKey] || [];
          const existingIndex = list.findIndex(i => i.id === item.id);
          if (existingIndex > -1) {
              list[existingIndex] = item as any;
          } else {
              list.push(item as any);
          }
          return {...prev, [listKey]: [...list]};
      });
      setIsModalOpen(false);
  }
  
  const handleDeleteItem = (type: 'paquete', id: string) => {
      setConfig(prev => {
          if (!prev) return null;
          return { ...prev, paquetes: prev.paquetes.filter(i => i.id !== id) }
      });
  }

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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog('paquete', pkg)}><Settings className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem('paquete', pkg.id)}><Trash2 className="w-4 h-4"/></Button>
                     </div>
                   </CardHeader>
                   <CardContent className="px-3 pb-3">
                      <p className="text-xs text-muted-foreground italic mb-2">{pkg.descripcion || 'Sin descripción'}</p>
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

      <CardFooter className="border-t pt-6">
        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}
            {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </CardFooter>
    </div>
  );
}
