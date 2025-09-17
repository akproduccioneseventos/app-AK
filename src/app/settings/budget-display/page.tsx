
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Settings as SettingsIcon, Loader2, AlertTriangle, Percent, Info, Tag, Package, Bot, Sparkles, Code2, Wand2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};


export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'paquete' | 'menu'>('paquete');
  const [currentItem, setCurrentItem] = useState<Partial<PaqueteArmadoRapido | MenuArmadoRapido> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [armadoConfig, serviciosData] = await Promise.all([
        getArmadoRapidoConfig(),
        getServiciosEmpresa()
      ]);
      setConfig(armadoConfig);
      setServiciosCatalogo(serviciosData.filter(s => s.tipoItem === 'Servicio'));
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
    setCurrentItem(item ? {...item} : { nombre: '', serviciosIncluidos: [] });
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
  
  const serviciosAgrupados = React.useMemo(() => {
    return serviciosCatalogo.reduce((acc, servicio) => {
        const categoria = servicio.categoria || 'Otros';
        if (!acc[categoria]) acc[categoria] = [];
        acc[categoria].push(servicio);
        return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [serviciosCatalogo]);
  const categoriasOrdenadas = Object.keys(serviciosAgrupados).sort();

  if (isLoading || !config) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="text-center text-destructive py-10"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold text-lg">{error}</p><Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button></div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Nuevo'} {modalType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle></DialogHeader>
          {currentItem && (
            <form onSubmit={handleSaveItem}>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 py-4">
                <div className="space-y-1"><Label htmlFor="item-name">Nombre</Label><Input id="item-name" value={currentItem.nombre} onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} required/></div>
                <Separator/>
                <Label>Servicios Incluidos</Label>
                 <Accordion type="multiple" className="w-full space-y-2">
                    {categoriasOrdenadas.map(categoria => (
                        <AccordionItem key={categoria} value={categoria} className="border rounded-md shadow-sm bg-muted/20">
                            <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:bg-muted/50 hover:no-underline">{categoria}</AccordionTrigger>
                            <AccordionContent className="px-3 pt-0 pb-2">
                                <div className="space-y-2 pt-2 border-t">
                                 {serviciosAgrupados[categoria].map(servicio => {
                                    const isInItem = currentItem.serviciosIncluidos?.some(s => s.id === servicio.id);
                                    const isRegalo = currentItem.serviciosIncluidos?.find(s => s.id === servicio.id)?.esRegalo || false;
                                    return (
                                        <div key={servicio.id} className="flex items-center justify-between p-2 border rounded-md bg-background">
                                            <div className="flex items-center gap-3">
                                                <Checkbox id={`serv-${servicio.id}`} checked={isInItem} onCheckedChange={(checked) => handleServicioChange(servicio.id, !!checked)}/>
                                                <Label htmlFor={`serv-${servicio.id}`} className="text-xs font-normal">{servicio.nombre}</Label>
                                            </div>
                                            {isInItem && <div className="flex items-center gap-2">
                                                <Switch id={`gift-${servicio.id}`} checked={isRegalo} onCheckedChange={(checked) => handleRegaloChange(servicio.id, !!checked)}/>
                                                <Label htmlFor={`gift-${servicio.id}`} className="text-xs text-green-600 font-medium">Regalo</Label>
                                            </div>}
                                        </div>
                                    )
                                 })}
                                 </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar</Button>
              </DialogFooter>
            </form>
          )}
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
              {config.paquetes.map(pkg => (
                <AccordionItem key={pkg.id} value={pkg.id}>
                    <AccordionTrigger className="p-3 border rounded-md font-semibold text-sm hover:no-underline hover:bg-muted/50 data-[state=open]:rounded-b-none">
                       <div className="flex justify-between items-center w-full">
                         {pkg.nombre}
                         <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                           <Button variant="outline" size="sm" onClick={() => handleOpenModal('paquete', pkg)}>Editar</Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('paquete', pkg.id)} disabled={isSaving}>Eliminar</Button>
                         </div>
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3 border border-t-0 rounded-b-md">
                        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                            {(pkg.serviciosIncluidos || []).map(servicio => {
                                const fullServicio = serviciosCatalogo.find(s => s.id === servicio.id);
                                return (
                                    <li key={servicio.id} className={servicio.esRegalo ? 'text-green-600 font-medium' : ''}>
                                        {fullServicio?.nombre || `ID: ${servicio.id} (no encontrado)`}
                                        {servicio.esRegalo && ' (Regalo)'}
                                    </li>
                                );
                            })}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
              ))}
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
                <AccordionItem key={menu.id} value={menu.id}>
                    <AccordionTrigger className="p-3 border rounded-md font-semibold text-sm hover:no-underline hover:bg-muted/50 data-[state=open]:rounded-b-none">
                       <div className="flex justify-between items-center w-full">
                         {menu.nombre}
                         <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                           <Button variant="outline" size="sm" onClick={() => handleOpenModal('menu', menu)}>Editar</Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('menu', menu.id)} disabled={isSaving}>Eliminar</Button>
                         </div>
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3 border border-t-0 rounded-b-md">
                        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                            {(menu.serviciosIncluidos || []).map(servicio => {
                                const fullServicio = serviciosCatalogo.find(s => s.id === servicio.id);
                                return (
                                    <li key={servicio.id} className={servicio.esRegalo ? 'text-green-600 font-medium' : ''}>
                                        {fullServicio?.nombre || `ID: ${servicio.id} (no encontrado)`}
                                        {servicio.esRegalo && ' (Regalo)'}
                                    </li>
                                );
                            })}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
      </Card>
      
    </div>
  );
}
