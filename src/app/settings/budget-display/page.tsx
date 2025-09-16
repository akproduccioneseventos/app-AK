
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
import type { BudgetDisplaySettings } from '@/types/settings';
import { defaultBudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings, saveBudgetDisplaySettings } from '@/app/actions/settings';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { PaqueteArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';


export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BudgetDisplaySettings>(defaultBudgetDisplaySettings);
  const [paquetes, setPaquetes] = useState<PaqueteArmadoRapido[]>([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPaquete, setCurrentPaquete] = useState<Partial<PaqueteArmadoRapido> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedSettings, armadoConfig, catalogo] = await Promise.all([
        getBudgetDisplaySettings(),
        getArmadoRapidoConfig(),
        getServiciosEmpresa(),
      ]);
      setSettings(fetchedSettings);
      setPaquetes(armadoConfig.paquetes || []);
      setServiciosCatalogo(catalogo.filter(s => s.tipoItem === 'Servicio'));
    } catch (err: any) {
      setError("No se pudieron cargar las configuraciones.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePaquete = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPaquete || !currentPaquete.nombre?.trim() || !currentPaquete.serviciosIncluidos?.length) {
      toast({ title: "Datos incompletos", description: "El paquete debe tener un nombre y al menos un servicio.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const newPaquetes = [...paquetes];
    if (currentPaquete.id) {
      const index = newPaquetes.findIndex(p => p.id === currentPaquete.id);
      if (index > -1) newPaquetes[index] = currentPaquete as PaqueteArmadoRapido;
      else newPaquetes.push({ ...currentPaquete, id: `pkg_${Date.now()}` } as PaqueteArmadoRapido);
    } else {
      newPaquetes.push({ ...currentPaquete, id: `pkg_${Date.now()}` } as PaqueteArmadoRapido);
    }

    try {
      const result = await saveArmadoRapidoConfig({ ...await getArmadoRapidoConfig(), paquetes: newPaquetes });
      if(result.success) {
        toast({title: "Paquete Guardado"});
        setIsModalOpen(false);
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al guardar paquete", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOpenModal = (paquete?: PaqueteArmadoRapido) => {
    if(paquete) {
      setCurrentPaquete(JSON.parse(JSON.stringify(paquete))); // Deep copy to avoid direct state mutation
    } else {
      setCurrentPaquete({ nombre: '', serviciosIncluidos: [] });
    }
    setIsModalOpen(true);
  }

  const handleDeletePaquete = async (id: string) => {
    const newPaquetes = paquetes.filter(p => p.id !== id);
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig({ ...await getArmadoRapidoConfig(), paquetes: newPaquetes });
      if (result.success) {
        toast({ title: "Paquete Eliminado", variant: "destructive" });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch(err:any){
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleServicioPaqueteChange = (servicioId: string, checked: boolean) => {
    setCurrentPaquete(prev => {
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
  
  const handleRegaloPaqueteChange = (servicioId: string, esRegalo: boolean) => {
     setCurrentPaquete(prev => {
      if(!prev) return null;
      return { ...prev, serviciosIncluidos: (prev.serviciosIncluidos || []).map(s => s.id === servicioId ? {...s, esRegalo} : s) };
    });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="text-center text-destructive py-10"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold text-lg">{error}</p><Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button></div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-headline">{currentPaquete?.id ? 'Editar' : 'Nuevo'} Paquete</DialogTitle></DialogHeader>
          {currentPaquete && (
            <form onSubmit={handleSavePaquete}>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 py-4">
                <div className="space-y-1"><Label htmlFor="pkg-name">Nombre del Paquete</Label><Input id="pkg-name" value={currentPaquete.nombre} onChange={e => setCurrentPaquete(p => p ? {...p, nombre: e.target.value} : null)} required/></div>
                <Separator/>
                <Label>Servicios Incluidos</Label>
                <div className="space-y-2">
                  {serviciosCatalogo.map(servicio => {
                    const isInPaquete = currentPaquete.serviciosIncluidos?.some(s => s.id === servicio.id);
                    const isRegalo = currentPaquete.serviciosIncluidos?.find(s => s.id === servicio.id)?.esRegalo || false;
                    return (
                      <div key={servicio.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-3">
                          <Checkbox id={`serv-${servicio.id}`} checked={isInPaquete} onCheckedChange={(checked) => handleServicioPaqueteChange(servicio.id, !!checked)}/>
                          <Label htmlFor={`serv-${servicio.id}`} className="text-sm font-medium">{servicio.nombre}</Label>
                        </div>
                        {isInPaquete && <div className="flex items-center gap-2">
                          <Checkbox id={`gift-${servicio.id}`} checked={isRegalo} onCheckedChange={(checked) => handleRegaloPaqueteChange(servicio.id, !!checked)}/>
                          <Label htmlFor={`gift-${servicio.id}`} className="text-xs">Es Regalo</Label>
                        </div>}
                      </div>
                    )
                  })}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : null} Guardar Paquete</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><SettingsIcon className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Simulador</h1></div>
        <Link href="/empresa/contabilidad" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>
      
       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes Base</CardTitle>
            <CardDescription>Crea y gestiona paquetes de servicios predefinidos para agilizar la creación de presupuestos en el simulador y la central.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => handleOpenModal()}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete</Button>
            <Separator/>
            <div className="space-y-2">
              {paquetes.map(pkg => (
                <div key={pkg.id} className="flex justify-between items-center p-3 border rounded-md">
                  <p className="font-semibold text-sm">{pkg.nombre}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(pkg)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePaquete(pkg.id)} disabled={isSaving}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
      </Card>
      
    </div>
  );
}
