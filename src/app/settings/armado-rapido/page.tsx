
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Wand2, PlusCircle, Trash2, Search, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioPaquete } from '@/app/actions/armado-rapido';
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

  const vendibleServices = useMemo(() => {
    return catalogo.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined && s.precioVenta > 0);
  }, [catalogo]);

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

  const handlePackageUpdate = (updatedPackage: PaqueteArmadoRapido) => {
    if (!config) return;
    setConfig(prevConfig => {
      if (!prevConfig) return null;
      return {
        ...prevConfig,
        paquetes: prevConfig.paquetes.map(p => p.id === updatedPackage.id ? updatedPackage : p)
      };
    });
  };

  const addServiceToPackage = (pkgId: string, service: ServicioEmpresa) => {
    const pkg = config?.paquetes.find(p => p.id === pkgId);
    if (!pkg) return;

    const updatedPackage = {
      ...pkg,
      serviciosIncluidos: [...pkg.serviciosIncluidos, { id: service.id, nombre: service.nombre }]
    };
    handlePackageUpdate(updatedPackage);
  };

  const removeServiceFromPackage = (pkgId: string, serviceId: string) => {
    const pkg = config?.paquetes.find(p => p.id === pkgId);
    if (!pkg) return;
    
    const updatedPackage = {
      ...pkg,
      serviciosIncluidos: pkg.serviciosIncluidos.filter(s => s.id !== serviceId)
    };
    handlePackageUpdate(updatedPackage);
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
        <Link href="/settings" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Paquetes Predefinidos</CardTitle>
          <CardDescription>Administra los paquetes que se ofrecerán en la herramienta de Armado Rápido de Presupuestos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-3">
            {config.paquetes.map(pkg => {
              const includedServiceIds = new Set(pkg.serviciosIncluidos.map(s => s.id));
              const currentSearchTerm = searchTerms[pkg.id] || '';
              
              const availableServices = vendibleServices.filter(s => {
                  const isInPackage = includedServiceIds.has(s.id);
                  const matchesSearch = s.nombre.toLowerCase().includes(currentSearchTerm.toLowerCase());
                  return !isInPackage && matchesSearch;
              });

              return (
                <AccordionItem key={pkg.id} value={pkg.id}>
                  <AccordionTrigger className="p-4 bg-muted/30 hover:bg-muted/50 text-lg font-medium">{pkg.nombre}</AccordionTrigger>
                  <AccordionContent className="p-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Servicios Incluidos ({pkg.serviciosIncluidos.length})</h4>
                        <ScrollArea className="h-72 border rounded-md p-2">
                          {pkg.serviciosIncluidos.length > 0 ? (
                            pkg.serviciosIncluidos.map(service => (
                              <div key={service.id} className="flex items-center justify-between p-2 hover:bg-background rounded">
                                <span className="text-sm">{service.nombre}</span>
                                <Button variant="destructive" size="sm" onClick={() => removeServiceFromPackage(pkg.id, service.id)}>Quitar</Button>
                              </div>
                            ))
                          ) : <p className="text-sm text-muted-foreground text-center p-4">Añade servicios desde el catálogo.</p>}
                        </ScrollArea>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Añadir Servicios desde Catálogo</h4>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Buscar servicio..."
                            className="pl-8"
                            value={currentSearchTerm}
                            onChange={(e) => setSearchTerms(prev => ({...prev, [pkg.id]: e.target.value}))}
                          />
                        </div>
                        <ScrollArea className="h-[240px] border rounded-md p-2">
                          {availableServices.length > 0 ? (
                            availableServices.map(service => (
                              <div key={service.id} className="flex items-center justify-between p-2 hover:bg-background rounded">
                                <span className="text-sm">{service.nombre}</span>
                                <Button variant="secondary" size="sm" onClick={() => addServiceToPackage(pkg.id, service)}>Añadir</Button>
                              </div>
                            ))
                          ) : <p className="text-sm text-muted-foreground text-center p-4">No hay más servicios disponibles o que coincidan.</p>}
                        </ScrollArea>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSaveConfig} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Guardar Toda la Configuración
        </Button>
      </div>
    </div>
  );
}
    