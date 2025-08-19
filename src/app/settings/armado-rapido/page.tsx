
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Wand2, PlusCircle, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import type { ArmadoRapidoConfig, PaqueteArmadoRapido } from '@/app/actions/armado-rapido';
import { loadArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [catalogo, setCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [configData, catalogoData] = await Promise.all([
        loadArmadoRapidoConfig(),
        getServiciosEmpresa(),
      ]);
      setConfig(configData);
      setCatalogo(catalogoData);
    } catch (e: any) {
      setError("No se pudieron cargar los datos necesarios.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  const handlePackageNameChange = (packageId: string, newName: string) => {
    if (!config) return;
    const newConfig = {
      ...config,
      paquetes: config.paquetes.map(p => p.id === packageId ? { ...p, nombre: newName } : p)
    };
    setConfig(newConfig);
  }

  const handleAddServiceToPackage = (packageId: string, service: ServicioEmpresa) => {
    if (!config) return;
    const newConfig = {
      ...config,
      paquetes: config.paquetes.map(p => {
        if (p.id === packageId) {
          if (p.serviciosIncluidos.some(s => s.id === service.id)) {
            toast({description: "Este servicio ya está en el paquete.", variant: 'default'});
            return p;
          }
          return {
            ...p,
            serviciosIncluidos: [...p.serviciosIncluidos, { id: service.id, nombre: service.nombre }]
          };
        }
        return p;
      })
    };
    setConfig(newConfig);
  };

  const handleRemoveServiceFromPackage = (packageId: string, serviceId: string) => {
    if (!config) return;
    const newConfig = {
      ...config,
      paquetes: config.paquetes.map(p => 
        p.id === packageId 
        ? { ...p, serviciosIncluidos: p.serviciosIncluidos.filter(s => s.id !== serviceId) } 
        : p
      )
    };
    setConfig(newConfig);
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(config);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!", description: "Tus paquetes de armado rápido han sido actualizados." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const vendibleServices = useMemo(() => {
    return catalogo.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined && s.precioVenta > 0);
  }, [catalogo]);
  

  if (isLoading || !config) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="text-center py-10"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold">{error}</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1>
        </div>
        <Link href="/settings/budget-display" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Accordion type="multiple" className="w-full space-y-4" defaultValue={config.paquetes.map(p => p.id)}>
        {config.paquetes.map(pkg => {
            const includedServiceIds = new Set(pkg.serviciosIncluidos.map(s => s.id));
            const availableServices = vendibleServices.filter(s => 
                !includedServiceIds.has(s.id) &&
                s.nombre.toLowerCase().includes((searchTerms[pkg.id] || '').toLowerCase())
            );

            return (
                <AccordionItem key={pkg.id} value={pkg.id} className="border rounded-lg shadow-sm">
                    <AccordionTrigger className="px-4 py-3 text-lg font-semibold text-primary hover:bg-muted/30 hover:no-underline">
                        {pkg.nombre}
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-2 border-t space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor={`package-name-${pkg.id}`}>Nombre del Paquete</Label>
                            <Input 
                                id={`package-name-${pkg.id}`} 
                                value={pkg.nombre} 
                                onChange={(e) => handlePackageNameChange(pkg.id, e.target.value)}
                            />
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="font-medium">Servicios Incluidos ({pkg.serviciosIncluidos.length})</h4>
                                <ScrollArea className="h-60 border rounded-md p-2">
                                    {pkg.serviciosIncluidos.length > 0 ? (
                                        pkg.serviciosIncluidos.map(service => (
                                            <div key={service.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                                                <span className="text-sm">{service.nombre}</span>
                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveServiceFromPackage(pkg.id, service.id)}>Quitar</Button>
                                            </div>
                                        ))
                                    ) : <p className="text-sm text-muted-foreground text-center p-4">No hay servicios.</p>}
                                </ScrollArea>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-medium">Añadir Servicios desde Catálogo</h4>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Buscar servicio para añadir..." 
                                        className="pl-8"
                                        value={searchTerms[pkg.id] || ''}
                                        onChange={e => setSearchTerms(prev => ({...prev, [pkg.id]: e.target.value}))}
                                    />
                                </div>
                                <ScrollArea className="h-[200px] border rounded-md p-2">
                                     {availableServices.length > 0 ? (
                                        availableServices.map(service => (
                                            <div key={service.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                                                <span className="text-sm">{service.nombre}</span>
                                                <Button variant="secondary" size="sm" onClick={() => handleAddServiceToPackage(pkg.id, service)}>Añadir</Button>
                                            </div>
                                        ))
                                    ) : <p className="text-sm text-muted-foreground text-center p-4">No hay más servicios disponibles o que coincidan.</p>}
                                </ScrollArea>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )
        })}
      </Accordion>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSaveConfig} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Guardar Toda la Configuración
        </Button>
      </div>
    </div>
  );
}
