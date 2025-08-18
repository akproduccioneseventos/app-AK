
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, Package, ListChecks, PlusCircle, Trash2, Loader2, Save, Search, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  getArmadoRapidoConfig,
  saveArmadoRapidoConfig,
  type ArmadoRapidoConfig,
  type Paquete,
  type ReglaDinamica,
  type ReglaCondicional,
} from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa } from '@/types/empresa';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Component for editing a single package
const PackageEditor = ({
  paquete,
  servicios,
  onPackageChange,
  onDelete
}: {
  paquete: Paquete;
  servicios: ServicioEmpresa[];
  onPackageChange: (updatedPackage: Paquete) => void;
  onDelete: (packageId: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPackageChange({ ...paquete, nombre: e.target.value });
  };
  
  const includedServices = useMemo(() => {
    return paquete.serviciosIncluidosIds
      .map(id => servicios.find(s => s.id === id))
      .filter((s): s is ServicioEmpresa => !!s);
  }, [paquete.serviciosIncluidosIds, servicios]);

  const availableServices = useMemo(() => {
    const includedIds = new Set(paquete.serviciosIncluidosIds);
    return servicios.filter(s =>
      !includedIds.has(s.id) &&
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [paquete.serviciosIncluidosIds, servicios, searchTerm]);

  const addService = (service: ServicioEmpresa) => {
    if (!paquete.serviciosIncluidosIds.includes(service.id)) {
      onPackageChange({
        ...paquete,
        serviciosIncluidosIds: [...paquete.serviciosIncluidosIds, service.id]
      });
    }
  };

  const removeService = (serviceId: string) => {
    onPackageChange({
      ...paquete,
      serviciosIncluidosIds: paquete.serviciosIncluidosIds.filter(id => id !== serviceId)
    });
  };

  return (
    <AccordionItem value={paquete.id} className="border-b-0">
      <Card className="shadow-sm">
        <AccordionTrigger className="p-3 hover:no-underline">
          <div className="flex w-full justify-between items-center">
            <h4 className="font-semibold text-foreground flex items-center gap-2"><Package className="w-4 h-4"/>{paquete.nombre}</h4>
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{paquete.serviciosIncluidosIds.length} servicio(s)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 border-t">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor={`pkg-name-${paquete.id}`}>Nombre del Paquete</Label>
              <Input id={`pkg-name-${paquete.id}`} value={paquete.nombre} onChange={handleNameChange} />
            </div>

            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Servicios Incluidos ({includedServices.length})</Label>
                <ScrollArea className="h-48 rounded-md border p-2">
                  {includedServices.length > 0 ? (
                    <ul className="space-y-1">
                      {includedServices.map(s => (
                        <li key={s.id} className="flex items-center justify-between p-1.5 text-sm">
                          <span>{s.nombre}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeService(s.id)}><X className="w-4 h-4"/></Button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-center text-xs text-muted-foreground pt-4">Añade servicios del catálogo.</p>}
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <Label>Añadir Servicios desde Catálogo</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                  <Input placeholder="Buscar servicio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/>
                </div>
                <ScrollArea className="h-40 rounded-md border">
                  {availableServices.length > 0 ? (
                     <ul className="space-y-1 p-2">
                      {availableServices.map(s => (
                        <li key={s.id} className="flex items-center justify-between p-1.5 text-sm">
                          <span>{s.nombre}</span>
                          <Button size="sm" variant="outline" onClick={() => addService(s)}>Añadir</Button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-center text-xs text-muted-foreground pt-4">No hay más servicios disponibles.</p>}
                </ScrollArea>
              </div>
            </div>
             <div className="flex justify-end pt-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2"/>Eliminar Paquete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará el paquete "{paquete.nombre}". Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(paquete.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};


export default function ArmadoRapidoConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig>({ paquetes: [], reglas: { dinamicas: [], condicionales: [] } });
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configData, serviciosData] = await Promise.all([
        getArmadoRapidoConfig(),
        getServiciosEmpresa(),
      ]);
      setConfig(configData);
      setServicios(serviciosData);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar la configuración o los servicios.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveArmadoRapidoConfig(config);
    if (result.success) {
      toast({ title: "Configuración Guardada", description: "Las reglas y paquetes se han actualizado." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  const addPackage = () => {
      const newPackage: Paquete = { id: `pkg_${Date.now()}`, nombre: 'Nuevo Paquete', serviciosIncluidosIds: [] };
      setConfig(prev => ({...prev, paquetes: [...prev.paquetes, newPackage]}));
  }
  
  const handlePackageChange = (updatedPackage: Paquete) => {
    setConfig(prev => ({
        ...prev,
        paquetes: prev.paquetes.map(p => p.id === updatedPackage.id ? updatedPackage : p)
    }));
  }

  const deletePackage = (id: string) => setConfig(prev => ({...prev, paquetes: prev.paquetes.filter(p => p.id !== id)}));

  const addRule = (type: 'dinamicas' | 'condicionales') => {
      if(type === 'dinamicas') {
        const newRule: ReglaDinamica = { servicioCatalogoId: '', invitadosPorUnidad: 1 };
        setConfig(prev => ({...prev, reglas: {...prev.reglas, dinamicas: [...prev.reglas.dinamicas, newRule]}}));
      } else {
        const newRule: ReglaCondicional = { umbralInvitados: 50, servicioMenorId: '', servicioMayorId: '' };
        setConfig(prev => ({...prev, reglas: {...prev.reglas, condicionales: [...prev.reglas.condicionales, newRule]}}));
      }
  }
  const deleteRule = (type: 'dinamicas' | 'condicionales', index: number) => {
    setConfig(prev => {
        const newRules = {...prev.reglas};
        (newRules[type] as any[]).splice(index, 1);
        return {...prev, reglas: newRules};
    });
  }
  
  const handleRuleChange = (type: 'dinamicas' | 'condicionales', index: number, field: string, value: string | number) => {
    setConfig(prev => {
      const newRules = { ...prev.reglas };
      const ruleToUpdate = { ...(newRules[type] as any[])[index] };
      (ruleToUpdate as any)[field] = value;
      (newRules[type] as any[])[index] = ruleToUpdate;
      return { ...prev, reglas: newRules };
    });
  };
  
  const serviciosDeVenta = useMemo(() => servicios.filter(s => s.tipoItem === 'Servicio'), [servicios]);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1>
        </div>
        <Link href="/settings/budget-display" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Config. Presupuestos</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes</CardTitle>
          <CardDescription>Define los combos que se mostrarán a tus clientes. Expande cada paquete para editar sus servicios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Accordion type="multiple" className="space-y-3">
              {config.paquetes.map(paquete => (
                  <PackageEditor
                      key={paquete.id}
                      paquete={paquete}
                      servicios={serviciosDeVenta}
                      onPackageChange={handlePackageChange}
                      onDelete={deletePackage}
                  />
              ))}
            </Accordion>
            <Button variant="outline" onClick={addPackage} className="w-full"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Nuevo Paquete</Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><ListChecks className="text-primary"/>Reglas de Cálculo Automático</CardTitle>
          <CardDescription>Define cómo se calculan las cantidades de ciertos servicios basados en el número de invitados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <h4 className="font-semibold text-md">Reglas Dinámicas (Por Cantidad)</h4>
            {config.reglas.dinamicas.map((regla, i) => (
                <div key={`dinamica-${i}`} className="p-3 border rounded-md bg-muted/30">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Regla Dinámica #{i+1}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRule('dinamicas', i)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Select value={regla.servicioCatalogoId} onValueChange={v => handleRuleChange('dinamicas', i, 'servicioCatalogoId', v)}>
                           <SelectTrigger><SelectValue placeholder="Seleccionar servicio..."/></SelectTrigger>
                           <SelectContent>{serviciosDeVenta.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                       </Select>
                       <Input type="number" placeholder="Invitados por unidad" value={regla.invitadosPorUnidad} onChange={e => handleRuleChange('dinamicas', i, 'invitadosPorUnidad', Number(e.target.value))}/>
                    </div>
                </div>
            ))}
            <Button variant="outline" onClick={() => addRule('dinamicas')} className="w-full"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Regla Dinámica</Button>
            <Separator/>
            <h4 className="font-semibold text-md">Reglas Condicionales (Por Umbral)</h4>
             {config.reglas.condicionales.map((regla, i) => (
                <div key={`condicional-${i}`} className="p-3 border rounded-md bg-muted/30">
                     <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Regla Condicional #{i+1}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRule('condicionales', i)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                    <div className="space-y-3">
                      <Input type="number" placeholder="Umbral de Invitados" value={regla.umbralInvitados} onChange={e => handleRuleChange('condicionales', i, 'umbralInvitados', Number(e.target.value))}/>
                      <Select value={regla.servicioMenorId} onValueChange={v => handleRuleChange('condicionales', i, 'servicioMenorId', v)}><SelectTrigger><SelectValue placeholder="Servicio si es MENOR O IGUAL al umbral..."/></SelectTrigger><SelectContent>{serviciosDeVenta.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select>
                      <Select value={regla.servicioMayorId} onValueChange={v => handleRuleChange('condicionales', i, 'servicioMayorId', v)}><SelectTrigger><SelectValue placeholder="Servicio si es MAYOR al umbral..."/></SelectTrigger><SelectContent>{serviciosDeVenta.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>
            ))}
            <Button variant="outline" onClick={() => addRule('condicionales')} className="w-full"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Regla Condicional</Button>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button size="lg" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
            Guardar Toda la Configuración
        </Button>
      </div>
    </div>
  );
}
