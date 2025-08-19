
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioPaquete } from '@/app/actions/armado-rapido';
import { loadArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';

// Componente para el modal de edición de un paquete
function EditPackageModal({
  pkg,
  allServices,
  onPackageUpdate,
  children
}: {
  pkg: PaqueteArmadoRapido;
  allServices: ServicioEmpresa[];
  onPackageUpdate: (updatedPackage: PaqueteArmadoRapido) => void;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [packageName, setPackageName] = useState(pkg.nombre);
  const [includedServices, setIncludedServices] = useState<ServicioPaquete[]>(pkg.serviciosIncluidos);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPackageName(pkg.nombre);
      setIncludedServices(pkg.serviciosIncluidos);
      setSearchTerm('');
    }
  }, [isOpen, pkg]);

  const includedServiceIds = useMemo(() => new Set(includedServices.map(s => s.id)), [includedServices]);

  const availableServices = useMemo(() => {
    return allServices
        .filter(s => !includedServiceIds.has(s.id))
        .filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allServices, includedServiceIds, searchTerm]);

  const addService = (service: ServicioEmpresa) => {
    setIncludedServices(prev => [...prev, { id: service.id, nombre: service.nombre }]);
  };

  const removeService = (serviceId: string) => {
    setIncludedServices(prev => prev.filter(s => s.id !== serviceId));
  };
  
  const handleSave = () => {
    onPackageUpdate({
      ...pkg,
      nombre: packageName,
      serviciosIncluidos: includedServices,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Editando Paquete: {pkg.nombre}</DialogTitle>
          <DialogDescription>Añade o quita servicios y cambia el nombre del paquete.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="pkg-name">Nombre del Paquete</Label>
                <Input id="pkg-name" value={packageName} onChange={e => setPackageName(e.target.value)} />
            </div>
            <Separator/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna de Servicios Incluidos */}
                <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Servicios Incluidos ({includedServices.length})</h4>
                    <ScrollArea className="h-72 border rounded-md p-2">
                        {includedServices.length > 0 ? (
                            includedServices.map(service => (
                                <div key={service.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                                    <span className="text-sm">{service.nombre}</span>
                                    <Button variant="ghost" size="sm" onClick={() => removeService(service.id)}>Quitar</Button>
                                </div>
                            ))
                        ) : <p className="text-sm text-muted-foreground text-center p-4">Añade servicios desde el catálogo.</p>}
                    </ScrollArea>
                </div>
                {/* Columna del Catálogo */}
                <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Añadir Servicios desde Catálogo</h4>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar servicio..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[240px] border rounded-md p-2">
                         {availableServices.length > 0 ? (
                            availableServices.map(service => (
                                <div key={service.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                                    <span className="text-sm">{service.nombre}</span>
                                    <Button variant="secondary" size="sm" onClick={() => addService(service)}>Añadir</Button>
                                </div>
                            ))
                        ) : <p className="text-sm text-muted-foreground text-center p-4">No hay más servicios disponibles o que coincidan.</p>}
                    </ScrollArea>
                </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSave}>Guardar Cambios del Paquete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [catalogo, setCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        }
    });
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
        <Link href="/settings/budget-display" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Paquetes Predefinidos</CardTitle>
                <CardDescription>Administra los paquetes que se ofrecerán en la herramienta de Armado Rápido de Presupuestos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {config.paquetes.map(pkg => (
                    <Card key={pkg.id} className="bg-muted/30">
                        <CardHeader className="flex flex-row justify-between items-center p-4">
                            <div>
                                <CardTitle className="text-lg">{pkg.nombre}</CardTitle>
                                <CardDescription className="text-xs">{pkg.serviciosIncluidos.length} servicios incluidos</CardDescription>
                            </div>
                            <EditPackageModal
                                pkg={pkg}
                                allServices={vendibleServices}
                                onPackageUpdate={handlePackageUpdate}
                            >
                                <Button variant="secondary">Administrar Paquete</Button>
                            </EditPackageModal>
                        </CardHeader>
                    </Card>
                ))}
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
