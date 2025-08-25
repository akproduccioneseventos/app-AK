'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, AlertTriangle, Package, Trash2, Edit, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioIncluido, CalculationMethod, TierPrecio } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};


// Component for editing a single service within a package
const EditServicioIncluido = ({ service, baseService, onUpdate, onRemove }: { service: ServicioIncluido, baseService?: ServicioEmpresa, onUpdate: (updatedService: ServicioIncluido) => void, onRemove: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState(service);

  const handleSave = () => {
    onUpdate(editedService);
    setIsEditing(false);
  };

  const handleTierChange = (tierId: string, field: 'desde' | 'hasta' | 'precio', value: number) => {
    const newTiers = (editedService.tramosDePrecio || []).map(t =>
      t.id === tierId ? { ...t, [field]: value } : t
    );
    setEditedService(prev => ({ ...prev!, tramosDePrecio: newTiers }));
  };
  
  const handleAddTier = () => {
    const lastTier = (editedService.tramosDePrecio || []).slice(-1)[0];
    const newTier: TierPrecio = { 
        id: `tier_${Date.now()}`, 
        desde: (lastTier?.hasta || 0) + 1, 
        hasta: (lastTier?.hasta || 0) + 50, 
        precio: 0 
    };
    setEditedService(prev => ({...prev!, tramosDePrecio: [...(prev!.tramosDePrecio || []), newTier]}));
  };

  const handleRemoveTier = (tierId: string) => {
    setEditedService(prev => ({...prev!, tramosDePrecio: (prev!.tramosDePrecio || []).filter(t => t.id !== tierId)}));
  };

  if (!isEditing) {
    return (
      <div className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
        <span>{service.nombre}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8" onClick={() => setIsEditing(true)}><Settings className="w-4 h-4 mr-2"/>Configurar</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onRemove}><Trash2 className="w-4 h-4"/></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-2 border-primary/20 rounded-md bg-background space-y-3 shadow-md">
        <p className="font-medium text-sm">{service.nombre}</p>
        <Select
            value={editedService.calculationMethod}
            onValueChange={(value) => setEditedService(prev => ({ ...prev!, calculationMethod: value as CalculationMethod }))}
        >
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="fijo">Costo Fijo</SelectItem>
                <SelectItem value="por_persona">Costo por Persona</SelectItem>
                <SelectItem value="ratio">Ratio (Ej: 1 cada X invitados)</SelectItem>
                <SelectItem value="escalonado">Tramos de Precio (Escalonado)</SelectItem>
            </SelectContent>
        </Select>

        {editedService.calculationMethod === 'fijo' && (
            <div className="space-y-1"><Label>Costo Fijo</Label><Input type="number" value={editedService.costoFijo || ''} onChange={e => setEditedService(p => ({...p!, costoFijo: Number(e.target.value)}))}/></div>
        )}
        {editedService.calculationMethod === 'por_persona' && (
            <div className="space-y-1"><Label>Costo por Persona</Label><Input type="number" value={editedService.costoPorPersona || ''} onChange={e => setEditedService(p => ({...p!, costoPorPersona: Number(e.target.value)}))}/></div>
        )}
        {editedService.calculationMethod === 'ratio' && (
             <div className="space-y-2 p-2 border rounded-md bg-blue-50/50 border-blue-200">
                <div className="space-y-1">
                    <Label className="text-xs">Costo por Unidad (del Catálogo)</Label>
                    <Input type="text" value={formatCurrency(baseService?.precioVenta || 0)} disabled className="font-semibold bg-white/50"/>
                </div>
                <div className="space-y-1">
                    <Label>Invitados por Unidad</Label>
                    <Input type="number" placeholder="Ej: 25" value={editedService.invitadosPorUnidad || ''} onChange={e => setEditedService(p => ({...p!, invitadosPorUnidad: Number(e.target.value)}))}/>
                </div>
            </div>
        )}
         {editedService.calculationMethod === 'escalonado' && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Tramos de Precio por Rango de Invitados</h5>
              <div className="grid grid-cols-4 gap-2 items-center">
                <div></div>
                <Label className="text-xs text-center">Desde (inv.)</Label>
                <Label className="text-xs text-center">Hasta (inv.)</Label>
                <Label className="text-xs text-center">Precio Fijo</Label>
              </div>
              {(editedService.tramosDePrecio || []).sort((a,b) => a.desde - b.desde).map(tier => (
                <div key={tier.id} className="grid grid-cols-4 gap-2 items-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveTier(tier.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                    <Input type="number" value={tier.desde} onChange={e => handleTierChange(tier.id, 'desde', Number(e.target.value))} className="h-8" placeholder="1"/>
                    <Input type="number" value={tier.hasta} onChange={e => handleTierChange(tier.id, 'hasta', Number(e.target.value))} className="h-8" placeholder="80"/>
                    <Input type="number" value={tier.precio} onChange={e => handleTierChange(tier.id, 'precio', Number(e.target.value))} className="h-8" placeholder="10000"/>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={handleAddTier}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Tramo</Button>
            </div>
          )}

        <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave}>Guardar Servicio</Button>
        </div>
    </div>
  );
};


export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [vendibleServices, setVendibleServices] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    setConfig(prev => {
      if (!prev) return null;
      return {...prev, [field]: value };
    });
  };

  const handlePackageChange = (packageId: string, updatedPackageData: Partial<PaqueteArmadoRapido>) => {
    setConfig(prev => {
        if(!prev) return null;
        return {
            ...prev,
            paquetes: prev.paquetes.map(pkg => pkg.id === packageId ? {...pkg, ...updatedPackageData} : pkg)
        }
    })
  }
  
  const handleAddPackage = () => {
    const newPackage: PaqueteArmadoRapido = {
      id: `paquete_${Date.now()}`,
      nombre: `Nuevo Paquete #${(config?.paquetes.length || 0) + 1}`,
      serviciosIncluidos: [],
    };
    setConfig(prev => prev ? ({ ...prev, paquetes: [...prev.paquetes, newPackage] }) : null);
  };
  
  const handleDeletePackage = (packageId: string) => {
    setConfig(prev => prev ? ({ ...prev, paquetes: prev.paquetes.filter(p => p.id !== packageId)}) : null);
  };


  const handleAddServiceToPackage = (packageId: string, service: ServicioEmpresa) => {
    const newService: ServicioIncluido = {
      id: service.id,
      nombre: service.nombre,
      calculationMethod: 'fijo', // Default calculation method
      costoFijo: service.precioVenta,
    };
    const currentPackage = config?.paquetes.find(p => p.id === packageId);
    if(currentPackage) {
        if(currentPackage.serviciosIncluidos.some(s => s.id === newService.id)) {
            toast({description: "Este servicio ya está en el paquete.", variant: "default"});
            return;
        }
        handlePackageChange(packageId, {
            serviciosIncluidos: [...currentPackage.serviciosIncluidos, newService]
        });
    }
  };
  
  const handleUpdateServiceInPackage = (packageId: string, updatedService: ServicioIncluido) => {
      const currentPackage = config?.paquetes.find(p => p.id === packageId);
      if(currentPackage) {
          handlePackageChange(packageId, {
              serviciosIncluidos: currentPackage.serviciosIncluidos.map(s => s.id === updatedService.id ? updatedService : s)
          });
      }
  };
  
  const handleRemoveServiceFromPackage = (packageId: string, serviceId: string) => {
      const currentPackage = config?.paquetes.find(p => p.id === packageId);
      if(currentPackage) {
          handlePackageChange(packageId, {
              serviciosIncluidos: currentPackage.serviciosIncluidos.filter(s => s.id !== serviceId)
          });
      }
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
  
   if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;
  }
  if (!config) {
    return <div className="text-center text-muted-foreground p-4">No se encontró la configuración.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1>
        </div>
        <Link href="/settings/budget-display" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Paquetes de Presupuesto Rápido</CardTitle>
          <CardDescription>Crea y edita los paquetes que tus clientes podrán seleccionar.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full space-y-4">
                {config.paquetes.map(pkg => {
                    const includedServiceIds = new Set(pkg.serviciosIncluidos.map(s => s.id));
                    const availableServices = vendibleServices.filter(s => 
                        !includedServiceIds.has(s.id) &&
                        s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    
                    return (
                        <AccordionItem value={pkg.id} key={pkg.id} className="border rounded-lg shadow-sm">
                            <AccordionTrigger className="p-4 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                                {pkg.nombre}
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border-t">
                              <div className="flex items-end gap-2 mb-4">
                                <div className="space-y-2 flex-grow">
                                  <Label htmlFor={`pkg-name-${pkg.id}`}>Nombre del Paquete</Label>
                                  <Input
                                    id={`pkg-name-${pkg.id}`}
                                    value={pkg.nombre}
                                    onChange={(e) => handlePackageChange(pkg.id, { nombre: e.target.value })}
                                  />
                                </div>
                                <Button variant="destructive" size="icon" onClick={() => handleDeletePackage(pkg.id)}>
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                              </div>
                              <Separator className="my-4"/>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <h3 className="font-semibold text-foreground">Servicios Incluidos ({pkg.serviciosIncluidos.length})</h3>
                                  <ScrollArea className="h-64 border rounded-lg p-2 bg-muted/20">
                                      {pkg.serviciosIncluidos.length > 0 ? (
                                          <ul className="space-y-2">
                                              {pkg.serviciosIncluidos.map(s => (
                                                  <li key={s.id}>
                                                      <EditServicioIncluido
                                                          service={s}
                                                          baseService={vendibleServices.find(vs => vs.id === s.id)}
                                                          onUpdate={(updatedS) => handleUpdateServiceInPackage(pkg.id, updatedS)}
                                                          onRemove={() => handleRemoveServiceFromPackage(pkg.id, s.id)}
                                                      />
                                                  </li>
                                              ))}
                                          </ul>
                                      ) : <p className="text-center text-muted-foreground p-4">No hay servicios en este paquete.</p>}
                                  </ScrollArea>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <h3 className="font-semibold text-foreground">Catálogo de Servicios Disponibles</h3>
                                    <div className="relative">
                                      <Input
                                        placeholder="Buscar servicio para añadir..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="mb-2"
                                      />
                                    </div>
                                    <ScrollArea className="flex-grow border rounded-lg p-2">
                                        {availableServices.length > 0 ? (
                                            <ul className="space-y-2">
                                                {availableServices.map(s => (
                                                    <li key={s.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/30">
                                                        <div>
                                                            <p>{s.nombre}</p>
                                                            <p className="text-xs text-muted-foreground">{formatCurrency(s.precioVenta)}</p>
                                                        </div>
                                                        <Button variant="outline" size="sm" onClick={() => handleAddServiceToPackage(pkg.id, s)}>Añadir</Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-center text-muted-foreground p-4">No hay más servicios disponibles para añadir.</p>}
                                    </ScrollArea>
                                </div>
                              </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
             <Button variant="outline" onClick={handleAddPackage} className="mt-4"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Nuevo Paquete</Button>
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
