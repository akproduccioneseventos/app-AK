
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Settings as SettingsIcon, Loader2, AlertTriangle, Percent, Info, Tag, Package, Bot, Sparkles, Code2, Wand2, PlusCircle, Trash2, ChevronDown, Edit, Gift, Search, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa as saveServicioEmpresaAction } from '@/app/actions/servicios-empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
import { MultiSelect } from '@/components/ui/multi-select';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const getCalculationMethodLabel = (method?: string): string => {
    switch (method) {
        case 'fijo': return 'Precio Fijo';
        case 'porPersona': return 'Por Persona';
        case 'ratio': return 'Por Ratio de Invitados';
        case 'tramos': return 'Por Tramos de Invitados';
        default: return 'No definido';
    }
}

// Sub-component for editing a single service, to be used inside the Sheet
const EditServicioForm: React.FC<{ servicioId: string | null; onUpdate: () => void, onClose: () => void }> = ({ servicioId, onUpdate, onClose }) => {
    const { toast } = useToast();
    const [servicio, setServicio] = useState<Partial<ServicioEmpresa> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (servicioId) {
            getServiciosEmpresa().then(servicios => {
                const s = servicios.find(s => s.id === servicioId);
                if (s) setServicio(s);
            });
        } else {
            setServicio(null);
        }
    }, [servicioId]);
    
    const handleSaveServicio = async (e: FormEvent) => {
        e.preventDefault();
        if (!servicio) return;
        setIsSaving(true);
        try {
            const result = await saveServicioEmpresaAction(servicio as ServicioEmpresa);
            if (result.success) {
                toast({ title: "Servicio actualizado" });
                onUpdate(); // This should trigger a refresh in the parent
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!servicio) return <div className="p-4"><Loader2 className="w-5 h-5 animate-spin"/></div>;

    return (
        <form onSubmit={handleSaveServicio} className="py-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-servicio-nombre">Nombre</Label>
              <Input id="edit-servicio-nombre" value={servicio.nombre || ''} onChange={e => setServicio(s => s ? {...s, nombre: e.target.value} : null)}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-servicio-precio">Precio de Venta (Fijo/Por Persona/Base)</Label>
              <Input id="edit-servicio-precio" type="number" value={servicio.precioVenta ?? servicio.precioPorPersona ?? servicio.precioBase ?? ''} onChange={e => {
                  const val = Number(e.target.value);
                  setServicio(s => s ? { ...s, precioVenta: val, precioPorPersona: val, precioBase: val } : null);
              }}/>
            </div>
             <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Guardar Servicio'}</Button>
        </form>
    );
};


export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'paquete' | 'menu'>('paquete');
  const [currentItem, setCurrentItem] = useState<Partial<PaqueteArmadoRapido | MenuArmadoRapido> | null>(null);
  
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false);
  const [editingServicioId, setEditingServicioId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [servicioSearchTerm, setServicioSearchTerm] = useState('');
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);

  const { entradas, platosPrincipales, menusInfantiles } = useMemo(() => {
    const menuEntradas = allMenus.find(m => m.name === 'Menú de Entradas');
    const menuPrincipales = allMenus.find(m => m.name === 'Menú de Platos Principales');

    const entradas = menuEntradas ? menuEntradas.items : [];
    
    let principales: MenuItem[] = [];
    let infantiles: MenuItem[] = [];

    if (menuPrincipales) {
      principales = menuPrincipales.items.filter(item => item.type === 'Plato Principal');
      infantiles = menuPrincipales.items.filter(item => item.type === 'Menú Infantil');
    }
    
    return { entradas, platosPrincipales: principales, menusInfantiles: infantiles };
  }, [allMenus]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [armadoConfig, serviciosData, menuData] = await Promise.all([
        getArmadoRapidoConfig(),
        getServiciosEmpresa(),
        getMenus()
      ]);
      setConfig(armadoConfig);
      setServiciosCatalogo(serviciosData.filter(s => s.tipoItem === 'Servicio'));
      setAllMenus(menuData);
    } catch(e: any) {
      setError("No se pudieron cargar los datos de configuración.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleOpenModal = (type: 'paquete' | 'menu', item?: PaqueteArmadoRapido | MenuArmadoRapido) => {
    setModalType(type);
    setCurrentItem(item ? {...item, serviciosIncluidos: item.serviciosIncluidos || []} : { nombre: '', serviciosIncluidos: [] });
    setServicioSearchTerm(''); // Reset search on modal open
    setIsModalOpen(true);
  };
  
  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.nombre || !config) return;
    setIsSaving(true);
    
    let updatedList;
    const newItem = {
      ...currentItem,
      id: currentItem.id || `new_${modalType}_${Date.now()}`
    } as PaqueteArmadoRapido | MenuArmadoRapido;

    if (modalType === 'paquete') {
        updatedList = [...config.paquetes];
    } else {
        updatedList = [...config.menus];
    }

    const itemIndex = updatedList.findIndex(p => p.id === newItem.id);
    if(itemIndex > -1) {
        updatedList[itemIndex] = newItem;
    } else {
        updatedList.push(newItem);
    }
    
    const newConfig: ArmadoRapidoConfig = {
      ...config,
      [modalType === 'paquete' ? 'paquetes' : 'menus']: updatedList
    };

    try {
        const result = await saveArmadoRapidoConfig(newConfig);
        if (result.success) {
            toast({ title: `${modalType === 'paquete' ? 'Paquete' : 'Menú'} guardado` });
            setIsModalOpen(false);
            await loadData();
        } else {
            throw new Error(result.error);
        }
    } catch (err: any) {
      toast({ title: `Error al guardar ${modalType}`, description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteItem = async (type: 'paquete' | 'menu', itemId: string) => {
    if (!config) return;
    setIsSaving(true);
    let updatedList;
    if (type === 'paquete') {
      updatedList = config.paquetes.filter(p => p.id !== itemId);
    } else {
      updatedList = config.menus.filter(m => m.id !== itemId);
    }
    const newConfig = { ...config, [type === 'paquete' ? 'paquetes' : 'menus']: updatedList };
    try {
      const result = await saveArmadoRapidoConfig(newConfig);
      if (result.success) {
        toast({ title: `${type === 'paquete' ? 'Paquete' : 'Menú'} Eliminado`, variant: "destructive" });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: `Error al eliminar ${type}`, description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleServicioChange = (servicioId: string, checked: boolean) => {
    setCurrentItem(prev => {
      if(!prev) return null;
      const servicios = prev.serviciosIncluidos || [];
      if(checked) {
        if(!servicios.some(s => s.id === servicioId)) {
          return { ...prev, serviciosIncluidos: [...servicios, { id: servicioId, esRegalo: false }] };
        }
      } else {
        return { ...prev, serviciosIncluidos: servicios.filter(s => s.id !== servicioId) };
      }
      return prev;
    });
  };
  
  const handleRegaloChange = (servicioId: string, esRegalo: boolean) => {
     setCurrentItem(prev => {
      if(!prev) return null;
      return { ...prev, serviciosIncluidos: (prev.serviciosIncluidos || []).map(s => s.id === servicioId ? {...s, esRegalo} : s) };
    });
  };
  
  const serviciosFiltrados = useMemo(() => {
    if (!servicioSearchTerm) return serviciosCatalogo;
    const lowerCaseSearch = servicioSearchTerm.toLowerCase();
    return serviciosCatalogo.filter(s =>
      s.nombre.toLowerCase().includes(lowerCaseSearch) ||
      s.categoria?.toLowerCase().includes(lowerCaseSearch) ||
      s.subcategoria?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [servicioSearchTerm, serviciosCatalogo]);
  
  const serviciosAgrupadosParaPaquetes = useMemo(() => {
    return serviciosFiltrados.reduce((acc, servicio) => {
        const categoria = servicio.categoria || 'Otros';
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(servicio);
        return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [serviciosFiltrados]);

  const categoriasOrdenadasParaPaquetes = useMemo(() => Object.keys(serviciosAgrupadosParaPaquetes).sort(), [serviciosAgrupadosParaPaquetes]);

  if (isLoading || !config) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="text-center text-destructive py-10"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold text-lg">{error}</p><Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button></div>;
  }
  
  const renderServiciosList = (servicios: ServicioIncluidoArmadoRapido[]) => {
    const grouped = servicios.reduce((acc, s) => {
      const fullServicio = serviciosCatalogo.find(sc => sc.id === s.id);
      if (fullServicio) {
        const categoria = fullServicio.categoria || 'Otros Servicios';
        if (!acc[categoria]) {
          acc[categoria] = [];
        }
        acc[categoria].push(fullServicio);
      }
      return acc;
    }, {} as Record<string, ServicioEmpresa[]>);

    return Object.keys(grouped).sort().map(categoria => (
      <div key={categoria} className="mb-2">
        <h5 className="font-semibold text-xs uppercase text-muted-foreground">{categoria}</h5>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1 mt-1">
          {grouped[categoria].map(servicio => <li key={servicio.id}>{servicio.nombre}</li>)}
        </ul>
      </div>
    ));
  };


  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
           <DialogHeader>
                <DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Nuevo'} {modalType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle>
                <DialogDescription>
                    {modalType === 'paquete' ? 'Define el nombre y los servicios que se incluirán en este paquete.' : 'Define un nombre y selecciona los platos que conformarán este menú para el simulador.'}
                </DialogDescription>
            </DialogHeader>
            <Sheet open={!!editingServicioId} onOpenChange={(open) => !open && setEditingServicioId(null)}>
                <SheetContent className="w-full max-w-none sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Editar Servicio</SheetTitle>
                    <SheetDescription>
                      Realiza cambios en el catálogo maestro. Esto afectará a futuros presupuestos.
                    </SheetDescription>
                  </SheetHeader>
                    {editingServicioId && (
                        <EditServicioForm 
                          servicioId={editingServicioId}
                          onUpdate={async () => {
                              await loadData(); // Refresh all data in parent
                          }}
                          onClose={() => setEditingServicioId(null)}
                        />
                    )}
                </SheetContent>
                
                {currentItem && (
                    <form onSubmit={handleSaveItem}>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 py-4">
                        <div className="space-y-1"><Label htmlFor="item-name">Nombre del {modalType === 'paquete' ? 'Paquete' : 'Menú'}</Label><Input id="item-name" value={currentItem.nombre || ''} onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} required/></div>
                        <Separator/>
                        <Label>Servicios Incluidos</Label>
                        
                        {modalType === 'menu' ? (
                            <div className="p-3 border rounded-md space-y-4">
                               <div className='space-y-2'>
                                  <Label>Entradas (Selección múltiple)</Label>
                                  <MultiSelect
                                    options={entradas.map(e => ({ value: e.id, label: e.name }))}
                                    selected={(currentItem.serviciosIncluidos || []).map(s => s.id)}
                                    onValueChange={(selected) => {
                                        const currentNonEntradas = (currentItem.serviciosIncluidos || []).filter(s => !entradas.some(e => e.id === s.id));
                                        const newServicios = [...currentNonEntradas, ...selected.map(id => ({id, esRegalo: false}))];
                                        setCurrentItem(p => p ? {...p, serviciosIncluidos: newServicios} : null);
                                    }}
                                    placeholder="Selecciona las entradas..."
                                    className="w-full"
                                  />
                                </div>
                                <div className='space-y-2'>
                                  <Label>Plato Principal (Selección única)</Label>
                                   <Select
                                        onValueChange={(value) => {
                                          const currentNonPrincipales = (currentItem.serviciosIncluidos || []).filter(s => !platosPrincipales.some(p => p.id === s.id));
                                          const newServicios = value ? [...currentNonPrincipales, { id: value, esRegalo: false }] : currentNonPrincipales;
                                          setCurrentItem(p => p ? {...p, serviciosIncluidos: newServicios} : null);
                                        }}
                                        value={(currentItem.serviciosIncluidos || []).find(s => platosPrincipales.some(p => p.id === s.id))?.id || ''}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecciona un plato principal..."/></SelectTrigger>
                                        <SelectContent>
                                            {platosPrincipales.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className='space-y-2'>
                                  <Label>Menú Infantil/Adolescente</Label>
                                   <Select
                                        onValueChange={(value) => {
                                          const currentNonInfantiles = (currentItem.serviciosIncluidos || []).filter(s => !menusInfantiles.some(m => m.id === s.id));
                                          const newServicios = value ? [...currentNonInfantiles, { id: value, esRegalo: false }] : currentNonInfantiles;
                                          setCurrentItem(p => p ? {...p, serviciosIncluidos: newServicios} : null);
                                        }}
                                        value={(currentItem.serviciosIncluidos || []).find(s => menusInfantiles.some(m => m.id === s.id))?.id || ''}
                                  >
                                    <SelectTrigger><SelectValue placeholder="Selecciona un menú..."/></SelectTrigger>
                                    <SelectContent>
                                      {menusInfantiles.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                    <Input 
                                        placeholder="Buscar servicios..."
                                        value={servicioSearchTerm}
                                        onChange={(e) => setServicioSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Accordion type="multiple" className="w-full space-y-2" defaultValue={categoriasOrdenadasParaPaquetes}>
                                    {categoriasOrdenadasParaPaquetes.map(categoria => {
                                        const itemsToShow = serviciosAgrupadosParaPaquetes[categoria];
                                        if (!itemsToShow || itemsToShow.length === 0) return null;
                                        
                                        return (
                                        <AccordionItem key={categoria} value={categoria} className="border rounded-md shadow-sm bg-muted/20">
                                            <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:bg-muted/50 hover:no-underline">{categoria}</AccordionTrigger>
                                            <AccordionContent className="px-3 pt-0 pb-2">
                                                <div className="space-y-2 pt-2 border-t">
                                                {itemsToShow.map(servicio => {
                                                    const isInItem = currentItem.serviciosIncluidos?.some(s => s.id === servicio.id);
                                                    const isRegalo = currentItem.serviciosIncluidos?.find(s => s.id === servicio.id)?.esRegalo || false;
                                                    return (
                                                        <div key={servicio.id} className="p-2 border rounded-md bg-background">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-3">
                                                                    <Checkbox id={`serv-${servicio.id}`} checked={isInItem} onCheckedChange={(checked) => handleServicioChange(servicio.id, !!checked)} className="mt-1"/>
                                                                    <div>
                                                                        <Label htmlFor={`serv-${servicio.id}`} className="font-normal">{servicio.nombre}</Label>
                                                                        <p className="text-xs text-muted-foreground">{getCalculationMethodLabel(servicio.calculationMethod)}: {formatCurrency(servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase)}</p>
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" type="button" onClick={() => setEditingServicioId(servicio.id)}>
                                                                    <Edit className="w-3.5 h-3.5"/>
                                                                </Button>
                                                            </div>
                                                            {isInItem && (
                                                              <div className="flex items-center gap-2 pl-7 pt-2 mt-2 border-t">
                                                                <Switch id={`gift-${servicio.id}`} checked={isRegalo} onCheckedChange={(checked) => handleRegaloChange(servicio.id, !!checked)}/>
                                                                <Label htmlFor={`gift-${servicio.id}`} className="text-xs text-green-600 font-medium flex items-center gap-1.5"><Gift className="w-3 h-3"/>Marcar como Regalo</Label>
                                                              </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar</Button>
                    </DialogFooter>
                    </form>
                )}
              </Sheet>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><SettingsIcon className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Paquetes y Simulador</h1></div>
        <Link href="/settings" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>
      
       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes de Servicios para Simulador</CardTitle>
            <CardDescription>Crea y gestiona paquetes de servicios predefinidos para el simulador de clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => handleOpenModal('paquete')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete</Button>
            <Separator/>
            <Accordion type="multiple" className="w-full space-y-3">
              {config.paquetes.map(pkg => {
                const serviciosNormales = (pkg.serviciosIncluidos || []).filter(s => !s.esRegalo);
                const serviciosRegalo = (pkg.serviciosIncluidos || []).filter(s => s.esRegalo);
                return (
                <AccordionItem key={pkg.id} value={pkg.id} className="border rounded-md shadow-sm">
                    <div className="flex items-center p-3">
                        <AccordionTrigger className="hover:no-underline flex-1 text-left font-semibold text-sm">{pkg.nombre}</AccordionTrigger>
                        <div className="flex gap-2 pl-2">
                           <Button variant="outline" size="sm" onClick={() => handleOpenModal('paquete', pkg)}>Editar</Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('paquete', pkg.id)} disabled={isSaving}>Eliminar</Button>
                        </div>
                    </div>
                    <AccordionContent className="p-3 border-t">
                      {renderServiciosList(serviciosNormales)}
                      {serviciosRegalo.length > 0 && (
                        <>
                          <Separator className="my-2" />
                          <h5 className="font-semibold text-xs uppercase text-green-600 flex items-center gap-1.5"><Gift className="w-3.5 h-3.5"/>Regalos</h5>
                          <ul className="text-xs text-green-700 list-disc pl-5 space-y-1 mt-1">
                            {serviciosRegalo.map(servicio => {
                                const fullServicio = serviciosCatalogo.find(s => s.id === servicio.id);
                                return <li key={servicio.id} className="font-medium">{fullServicio?.nombre || `ID: ${servicio.id} (no encontrado)`}</li>;
                            })}
                          </ul>
                        </>
                      )}
                    </AccordionContent>
                </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
      </Card>

      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Wand2 className="text-primary"/>Menús para Simulador</CardTitle>
            <CardDescription>Configura los menús que aparecerán como opción en el simulador de presupuesto para clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => handleOpenModal('menu')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Menú de Simulador</Button>
            <Separator/>
            <Accordion type="multiple" className="w-full space-y-3">
             {config.menus.map(menu => (
                <AccordionItem key={menu.id} value={menu.id} className="border rounded-md shadow-sm">
                    <div className="flex items-center p-3 font-semibold text-sm">
                        <AccordionTrigger className="hover:no-underline flex-1 text-left">{menu.nombre}</AccordionTrigger>
                        <div className="flex gap-2 pl-2">
                           <Button variant="outline" size="sm" onClick={() => handleOpenModal('menu', menu)}>Editar</Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('menu', menu.id)} disabled={isSaving}>Eliminar</Button>
                        </div>
                    </div>
                    <AccordionContent className="p-3 border-t">
                      <p className="text-xs text-muted-foreground">{menu.descripcion || 'Sin descripción'}</p>
                      <Separator className="my-2"/>
                      {renderServiciosList((menu.serviciosIncluidos || []))}
                    </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
      </Card>
    </div>
  );
}
