
'use client';

import { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Wand2, Settings2, PlusCircle, Trash2, Search, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ArmadoRapidoConfig, Paquete, Regla } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [configData, catalogoData] = await Promise.all([
        getArmadoRapidoConfig(),
        getServiciosEmpresa()
      ]);
      setConfig(configData);
      // Filter for only services with a price
      setServiciosCatalogo(catalogoData.filter(s => s.tipoItem === 'Servicio'));
    } catch (err: any) {
      setError("No se pudieron cargar los datos.");
      toast({ title: "Error de Carga", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePackageChange = (packageId: string, field: keyof Paquete, value: string | number) => {
    setConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        paquetes: prev.paquetes.map(p => p.id === packageId ? { ...p, [field]: value } : p)
      };
    });
  };

  const handleToggleServiceInPackage = (packageId: string, serviceId: string) => {
    setConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        paquetes: prev.paquetes.map(p => {
          if (p.id === packageId) {
            const newServicios = new Set(p.serviciosIncluidos);
            if (newServicios.has(serviceId)) {
              newServicios.delete(serviceId);
            } else {
              newServicios.add(serviceId);
            }
            return { ...p, serviciosIncluidos: Array.from(newServicios) };
          }
          return p;
        })
      };
    });
  };
  
  const handleRemoveServiceFromPackage = (packageId: string, serviceId: string) => {
    setConfig(prev => {
      if(!prev) return null;
      return {
        ...prev,
        paquetes: prev.paquetes.map(p => {
          if (p.id === packageId) {
             return { ...p, serviciosIncluidos: p.serviciosIncluidos.filter(id => id !== serviceId) };
          }
          return p;
        })
      }
    });
  }

  const handleSaveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(config);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!", description: "Tus cambios en el Armado Rápido han sido guardados." });
      } else {
        throw new Error(result.error || "No se pudo guardar la configuración.");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCatalogForPackage = useMemo(() => {
    if (!activePackageId) return [];
    const activePackage = config?.paquetes.find(p => p.id === activePackageId);
    if (!activePackage) return [];
    
    return serviciosCatalogo.filter(s => 
      !activePackage.serviciosIncluidos.includes(s.id) &&
      s.nombre.toLowerCase().includes(packageSearchTerm.toLowerCase())
    );
  }, [activePackageId, packageSearchTerm, serviciosCatalogo, config]);

  if (isLoading || !config) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="text-center text-destructive p-6"><AlertTriangle className="w-12 h-12 mx-auto mb-3" />{error}</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1>
        </div>
        <Link href="/settings/budget-display" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Accordion type="multiple" className="w-full space-y-4">
        {config.paquetes.map(pkg => {
          const includedServices = serviciosCatalogo.filter(s => pkg.serviciosIncluidos.includes(s.id));
          return (
          <AccordionItem key={pkg.id} value={pkg.id} className="border rounded-lg shadow-sm">
            <AccordionTrigger 
                className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg"
                onClick={() => setActivePackageId(activePackageId === pkg.id ? null : pkg.id)}
            >
              <div className="flex items-center gap-3">{pkg.nombre}</div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t space-y-6">
               <div className="space-y-1">
                  <Label htmlFor={`pkg-name-${pkg.id}`}>Nombre del Paquete</Label>
                  <Input id={`pkg-name-${pkg.id}`} value={pkg.nombre} onChange={e => handlePackageChange(pkg.id, 'nombre', e.target.value)} />
               </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Servicios Incluidos</h4>
                {includedServices.length > 0 ? (
                  <ul className="space-y-2">
                    {includedServices.map(s => (
                      <li key={s.id} className="flex justify-between items-center p-2 border rounded-md bg-green-50/50">
                        <span className="text-sm">{s.nombre}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveServiceFromPackage(pkg.id, s.id)}><Trash2 className="w-4 h-4"/></Button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No hay servicios en este paquete.</p>}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Añadir Servicios desde Catálogo</h4>
                 <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar servicio para añadir..." value={packageSearchTerm} onChange={e => setPackageSearchTerm(e.target.value)} className="pl-8"/>
                </div>
                <ScrollArea className="h-48 border rounded-md">
                    {filteredCatalogForPackage.length > 0 ? (
                      <ul className="p-2 space-y-1">
                        {filteredCatalogForPackage.map(s => (
                           <li key={s.id} className="flex justify-between items-center p-1.5 hover:bg-muted rounded">
                             <span className="text-sm">{s.nombre}</span>
                             <Button size="sm" variant="secondary" onClick={() => handleToggleServiceInPackage(pkg.id, s.id)}>Añadir</Button>
                           </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">No hay más servicios disponibles o que coincidan.</p>
                    )}
                </ScrollArea>
              </div>
            </AccordionContent>
          </AccordionItem>
          )
        })}
      </Accordion>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSaveConfig} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
          {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </div>
    </div>
  );
}
