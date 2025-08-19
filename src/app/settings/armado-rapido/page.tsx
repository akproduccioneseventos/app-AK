
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, AlertTriangle, Package, Trash2, Edit, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioIncluido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
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
      precioBase: service.precioVenta,
      precioPorPersona: 0,
    };
    const currentPackage = config?.paquetes.find(p => p.id === packageId);
    if(currentPackage) {
        handlePackageChange(packageId, {
            serviciosIncluidos: [...currentPackage.serviciosIncluidos, newService]
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
            <Accordion type="single" collapsible className="w-full space-y-4">
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
                                  <ScrollArea className="h-64 border rounded-lg p-2">
                                      {pkg.serviciosIncluidos.length > 0 ? (
                                          <ul className="space-y-2">
                                              {pkg.serviciosIncluidos.map(s => (
                                                  <li key={s.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                                      <span>{s.nombre}</span>
                                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveServiceFromPackage(pkg.id, s.id)}><Trash2 className="w-4 h-4" /></Button>
                                                  </li>
                                              ))}
                                          </ul>
                                      ) : <p className="text-center text-muted-foreground p-4">No hay servicios en este paquete.</p>}
                                  </ScrollArea>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <h3 className="font-semibold text-foreground">Catálogo de Servicios Disponibles</h3>
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Buscar servicio para añadir..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9 mb-2"
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
