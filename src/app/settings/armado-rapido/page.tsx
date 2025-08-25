
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, AlertTriangle, Package, Trash2, Settings, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const AddOrEditPackageDialog = ({
  pkg,
  onSave,
  onDelete,
  trigger
}: {
  pkg?: PaqueteArmadoRapido;
  onSave: (data: Omit<PaqueteArmadoRapido, 'id' | 'serviciosIncluidos'>) => void;
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
        <DialogHeader><DialogTitle>{pkg ? 'Editar' : 'Nuevo'} Paquete de Servicios</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
            <div className="space-y-1"><Label htmlFor="pkg-name">Nombre</Label><Input id="pkg-name" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="pkg-desc">Descripción</Label><Input id="pkg-desc" value={descripcion} onChange={e => setDescripcion(e.target.value)} /></div>
        </div>
        <DialogFooter className="justify-between">
           {pkg && onDelete && (
                <Button variant="destructive" onClick={() => { onDelete(); setIsOpen(false); }}>Eliminar</Button>
            )}
            <div className="flex gap-2 ml-auto">
             <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
             <Button onClick={handleSave}>Guardar</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// Similar dialog for Menus
const AddOrEditMenuDialog = ({
  menu,
  onSave,
  onDelete,
  trigger
}: {
  menu?: MenuArmadoRapido;
  onSave: (data: Omit<MenuArmadoRapido, 'id' | 'serviciosIncluidos'>) => void;
  onDelete?: () => void;
  trigger: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState(menu?.nombre || '');
  const [descripcion, setDescripcion] = useState(menu?.descripcion || '');
  
  useEffect(() => {
    if (isOpen) {
        setNombre(menu?.nombre || '');
        setDescripcion(menu?.descripcion || '');
    }
  }, [isOpen, menu]);
  
  const handleSave = () => {
    onSave({ nombre, descripcion });
    setIsOpen(false);
  };
  
  return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{menu ? 'Editar' : 'Nuevo'} Menú de Catering</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
            <div className="space-y-1"><Label htmlFor="menu-name">Nombre</Label><Input id="menu-name" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="menu-desc">Descripción</Label><Input id="menu-desc" value={descripcion} onChange={e => setDescripcion(e.target.value)} /></div>
        </div>
        <DialogFooter className="justify-between">
            {menu && onDelete && (
                <Button variant="destructive" onClick={() => { onDelete(); setIsOpen(false); }}>Eliminar</Button>
            )}
            <div className="flex gap-2 ml-auto">
             <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
             <Button onClick={handleSave}>Guardar</Button>
            </div>
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedConfig, fetchedServices] = await Promise.all([
        getArmadoRapidoConfig(),
        getServiciosEmpresa()
      ]);
      setConfig(fetchedConfig);
      setVendibleServices(fetchedServices.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined));
    } catch (err: any) {
      setError("No se pudo cargar la configuración.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleConfigChange = (field: keyof ArmadoRapidoConfig, value: any) => {
    setConfig(prev => (prev ? { ...prev, [field]: value } : null));
  };
  
  const handleSavePackage = (packageId: string | undefined, data: Omit<PaqueteArmadoRapido, 'id' | 'serviciosIncluidos'>) => {
     setConfig(prev => {
        if (!prev) return null;
        if (packageId) {
            return {...prev, paquetes: prev.paquetes.map(p => p.id === packageId ? {...p, ...data} : p)};
        } else {
            const newPackage: PaqueteArmadoRapido = { id: `pkg_${Date.now()}`, ...data, serviciosIncluidos: [] };
            return {...prev, paquetes: [...prev.paquetes, newPackage]};
        }
     });
  };

  const handleSaveMenu = (menuId: string | undefined, data: Omit<MenuArmadoRapido, 'id' | 'serviciosIncluidos'>) => {
     setConfig(prev => {
        if (!prev) return null;
        if (menuId) {
            return {...prev, menus: prev.menus.map(m => m.id === menuId ? {...m, ...data} : m)};
        } else {
            const newMenu: MenuArmadoRapido = { id: `menu_${Date.now()}`, ...data, serviciosIncluidos: [] };
            return {...prev, menus: [...prev.menus, newMenu]};
        }
     });
  };
  
  const handleDelete = (type: 'menu' | 'paquete', id: string) => {
      setConfig(prev => {
          if (!prev) return null;
          if (type === 'menu') return {...prev, menus: prev.menus.filter(m => m.id !== id)};
          if (type === 'paquete') return {...prev, paquetes: prev.paquetes.filter(p => p.id !== id)};
          return prev;
      });
  };

  const handleToggleService = (type: 'menu' | 'paquete', containerId: string, service: ServicioEmpresa) => {
      setConfig(prev => {
          if(!prev) return null;
          const newService: ServicioIncluido = {id: service.id, nombre: service.nombre, precioFijo: service.precioVenta || 0};
          
          if(type === 'menu') {
              const menus = prev.menus.map(m => {
                  if (m.id === containerId) {
                      const isIncluded = m.serviciosIncluidos.some(s => s.id === service.id);
                      const nuevosServicios = isIncluded ? m.serviciosIncluidos.filter(s => s.id !== service.id) : [...m.serviciosIncluidos, newService];
                      return {...m, serviciosIncluidos: nuevosServicios};
                  }
                  return m;
              });
              return {...prev, menus};
          } else { // paquete
               const paquetes = prev.paquetes.map(p => {
                  if (p.id === containerId) {
                      const isIncluded = p.serviciosIncluidos.some(s => s.id === service.id);
                      const nuevosServicios = isIncluded ? p.serviciosIncluidos.filter(s => s.id !== service.id) : [...p.serviciosIncluidos, newService];
                      return {...p, serviciosIncluidos: nuevosServicios};
                  }
                  return p;
              });
              return {...prev, paquetes};
          }
      });
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
  if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;
  if (!config) return <div className="text-center text-muted-foreground p-4">No se encontró la configuración.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1></div>
        <Link href="/settings/budget-display" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>

       <Tabs defaultValue="menus">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menus"><ChefHat className="mr-2"/>Configurar Menús</TabsTrigger>
            <TabsTrigger value="paquetes"><Package className="mr-2"/>Configurar Paquetes de Servicios</TabsTrigger>
        </TabsList>
        <TabsContent value="menus">
            <Card className="shadow-lg mt-4">
                <CardHeader>
                    <CardTitle>Menús de Catering para Armado Rápido</CardTitle>
                    <CardDescription>Crea los menús gastronómicos que los clientes podrán elegir.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddOrEditMenuDialog onSave={(data) => handleSaveMenu(undefined, data)} trigger={<Button><PlusCircle className="mr-2"/>Nuevo Menú</Button>} />
                    <Separator className="my-4"/>
                    <div className="space-y-4">
                      {config.menus.map(menu => (
                        <Card key={menu.id} className="bg-muted/30">
                          <CardHeader className="flex-row justify-between items-center pb-2">
                             <div>
                                <CardTitle className="text-lg">{menu.nombre}</CardTitle>
                                <CardDescription>{menu.descripcion}</CardDescription>
                             </div>
                              <AddOrEditMenuDialog pkg={menu} onSave={(data) => handleSaveMenu(menu.id, data)} onDelete={() => handleDelete('menu', menu.id)} trigger={<Button variant="outline" size="icon"><Settings className="w-4 h-4"/></Button>} />
                          </CardHeader>
                          <CardContent>
                               {menu.serviciosIncluidos.map(s => <Badge key={s.id} variant="secondary" className="mr-1 mb-1">{s.nombre}</Badge>)}
                                <Dialog>
                                    <DialogTrigger asChild><Button variant="link" size="sm">Añadir/Quitar Platos</Button></DialogTrigger>
                                    <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Seleccionar Platos para "{menu.nombre}"</DialogTitle></DialogHeader>
                                        <ScrollArea className="h-96 border rounded-md p-4 mt-4">
                                            {vendibleServices.filter(s => s.categoria === 'Servicio de catering').map(s => (
                                                <div key={s.id} className="flex items-center gap-2 my-1"><Checkbox id={`menu-${menu.id}-serv-${s.id}`} checked={menu.serviciosIncluidos.some(inc => inc.id === s.id)} onCheckedChange={() => handleToggleService('menu', menu.id, s)}/><Label htmlFor={`menu-${menu.id}-serv-${s.id}`}>{s.nombre} - {formatCurrency(s.precioVenta)}</Label></div>
                                            ))}
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="paquetes">
             <Card className="shadow-lg mt-4">
                <CardHeader>
                    <CardTitle>Paquetes de Servicios Adicionales</CardTitle>
                    <CardDescription>Crea los combos de servicios (DJ, Deco, etc.) que complementan el menú.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddOrEditPackageDialog onSave={(data) => handleSavePackage(undefined, data)} trigger={<Button><PlusCircle className="mr-2"/>Nuevo Paquete</Button>} />
                    <Separator className="my-4"/>
                     <div className="space-y-4">
                      {config.paquetes.map(pkg => (
                        <Card key={pkg.id} className="bg-muted/30">
                          <CardHeader className="flex-row justify-between items-center pb-2">
                             <div>
                                <CardTitle className="text-lg">{pkg.nombre}</CardTitle>
                                <CardDescription>{pkg.descripcion}</CardDescription>
                             </div>
                             <AddOrEditPackageDialog pkg={pkg} onSave={(data) => handleSavePackage(pkg.id, data)} onDelete={() => handleDelete('paquete', pkg.id)} trigger={<Button variant="outline" size="icon"><Settings className="w-4 h-4"/></Button>} />
                          </CardHeader>
                           <CardContent>
                               {pkg.serviciosIncluidos.map(s => <Badge key={s.id} variant="secondary" className="mr-1 mb-1">{s.nombre}</Badge>)}
                                <Dialog>
                                    <DialogTrigger asChild><Button variant="link" size="sm">Añadir/Quitar Servicios</Button></DialogTrigger>
                                     <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Seleccionar Servicios para "{pkg.nombre}"</DialogTitle></DialogHeader>
                                        <ScrollArea className="h-96 border rounded-md p-4 mt-4">
                                            {vendibleServices.filter(s => s.categoria !== 'Servicio de catering').map(s => (
                                                <div key={s.id} className="flex items-center gap-2 my-1"><Checkbox id={`pkg-${pkg.id}-serv-${s.id}`} checked={pkg.serviciosIncluidos.some(inc => inc.id === s.id)} onCheckedChange={() => handleToggleService('paquete', pkg.id, s)}/><Label htmlFor={`pkg-${pkg.id}-serv-${s.id}`}>{s.nombre} - {formatCurrency(s.precioVenta)}</Label></div>
                                            ))}
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
       </Tabs>

      <CardFooter className="border-t pt-6">
        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}
            {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </CardFooter>
    </div>
  );
}
