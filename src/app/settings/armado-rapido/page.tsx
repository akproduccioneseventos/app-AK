
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, Package, ListChecks, PlusCircle, Trash2, Loader2, Save, Edit, ChevronDown } from 'lucide-react';
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
import { ConfigFormItem } from '@/components/settings/ConfigFormItem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function ArmadoRapidoConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig>({ paquetes: [], reglas: { dinamicas: [], condicionales: [] } });
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for package editing sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Paquete | null>(null);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configData, serviciosData] = await Promise.all([
        getArmadoRapidoConfig(),
        getServiciosEmpresa(),
      ]);
      setConfig(configData);
      setServicios(serviciosData.filter(s => s.precioVenta !== undefined));
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
      const newPackage: Paquete = { id: `pkg_${Date.now()}`, nombre: 'Nuevo Paquete', descripcion: 'Descripción del nuevo paquete', serviciosIncluidosIds: [], costoFijoAdicional: 0 };
      setConfig(prev => ({...prev, paquetes: [...prev.paquetes, newPackage]}));
  }
  const deletePackage = (id: string) => setConfig(prev => ({...prev, paquetes: prev.paquetes.filter(p => p.id !== id)}));
  
  const openEditPackageSheet = (paquete: Paquete) => {
    setEditingPackage({ ...paquete });
    setIsSheetOpen(true);
  };

  const handleUpdateEditingPackage = (field: keyof Omit<Paquete, 'id' | 'serviciosIncluidosIds'>, value: string | number) => {
      setEditingPackage(prev => prev ? {...prev, [field]: value} : null);
  };

  const handleToggleServiceInSheet = (serviceId: string) => {
      setEditingPackage(prev => {
          if (!prev) return null;
          const currentIds = new Set(prev.serviciosIncluidosIds);
          if (currentIds.has(serviceId)) {
            currentIds.delete(serviceId);
          } else {
            currentIds.add(serviceId);
          }
          return { ...prev, serviciosIncluidosIds: Array.from(currentIds) };
      });
  };
  
  const handleSavePackageChanges = () => {
      if (!editingPackage) return;
      setConfig(prev => ({
          ...prev,
          paquetes: prev.paquetes.map(p => p.id === editingPackage.id ? editingPackage : p)
      }));
      setIsSheetOpen(false);
      setEditingPackage(null);
  };


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
        newRules[type].splice(index, 1);
        return {...prev, reglas: newRules};
    });
  }
  
  const handleRuleChange = (type: 'dinamicas' | 'condicionales', index: number, field: string, value: string | number) => {
    setConfig(prev => {
      const newRules = { ...prev.reglas };
      const ruleToUpdate = { ...newRules[type][index] };
      (ruleToUpdate as any)[field] = value;
      newRules[type][index] = ruleToUpdate as any;
      return { ...prev, reglas: newRules };
    });
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="font-headline text-lg">Editar Paquete: {editingPackage?.nombre}</SheetTitle>
                </SheetHeader>
                {editingPackage && (
                    <div className="py-4 space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="pkg-name">Nombre del Paquete</Label>
                            <Input id="pkg-name" value={editingPackage.nombre} onChange={e => handleUpdateEditingPackage('nombre', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pkg-desc">Descripción</Label>
                            <Input id="pkg-desc" value={editingPackage.descripcion} onChange={e => handleUpdateEditingPackage('descripcion', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pkg-costo">Costo Fijo Adicional</Label>
                            <Input id="pkg-costo" type="number" value={editingPackage.costoFijoAdicional || ''} onChange={e => handleUpdateEditingPackage('costoFijoAdicional', Number(e.target.value))} />
                        </div>
                         <div className="space-y-2">
                            <Label className="font-medium">Servicios Incluidos</Label>
                            <ScrollArea className="h-64 w-full rounded-md border p-2">
                                <div className="space-y-1">
                                {servicios.map(s => (
                                    <div key={s.id} className="flex items-center space-x-2 p-1 rounded hover:bg-muted">
                                        <Checkbox 
                                            id={`service-${editingPackage?.id}-${s.id}`} 
                                            checked={editingPackage?.serviciosIncluidosIds.includes(s.id)}
                                            onCheckedChange={() => handleToggleServiceInSheet(s.id)}
                                        />
                                        <Label htmlFor={`service-${editingPackage?.id}-${s.id}`} className="font-normal text-sm cursor-pointer">{s.nombre}</Label>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}
                <SheetFooter>
                    <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
                    <Button type="button" onClick={handleSavePackageChanges}>Guardar Paquete</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
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
          <CardDescription>Define los combos que se mostrarán a tus clientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {config.paquetes.map(paquete => (
                <ConfigFormItem 
                    key={paquete.id} 
                    title={paquete.nombre} 
                    onDelete={() => deletePackage(paquete.id)}
                    description={`${paquete.descripcion} (${paquete.serviciosIncluidosIds.length} servicios)`}
                >
                   <Button onClick={() => openEditPackageSheet(paquete)} className="w-full">
                       <Edit className="w-4 h-4 mr-2"/> Editar Paquete y Servicios
                   </Button>
                </ConfigFormItem>
            ))}
            <Button variant="outline" onClick={addPackage} className="w-full"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Paquete</Button>
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
                <ConfigFormItem key={i} title={`Regla Dinámica #${i+1}`} onDelete={() => deleteRule('dinamicas', i)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Select value={regla.servicioCatalogoId} onValueChange={v => handleRuleChange('dinamicas', i, 'servicioCatalogoId', v)}>
                           <SelectTrigger><SelectValue placeholder="Seleccionar servicio..."/></SelectTrigger>
                           <SelectContent>{servicios.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                       </Select>
                       <Input type="number" placeholder="Invitados por unidad" value={regla.invitadosPorUnidad} onChange={e => handleRuleChange('dinamicas', i, 'invitadosPorUnidad', Number(e.target.value))}/>
                    </div>
                </ConfigFormItem>
            ))}
            <Button variant="outline" onClick={() => addRule('dinamicas')} className="w-full"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Regla Dinámica</Button>
            <Separator/>
            <h4 className="font-semibold text-md">Reglas Condicionales (Por Umbral)</h4>
             {config.reglas.condicionales.map((regla, i) => (
                <ConfigFormItem key={i} title={`Regla Condicional #${i+1}`} onDelete={() => deleteRule('condicionales', i)}>
                    <div className="space-y-3">
                      <Input type="number" placeholder="Umbral de Invitados" value={regla.umbralInvitados} onChange={e => handleRuleChange('condicionales', i, 'umbralInvitados', Number(e.target.value))}/>
                      <Select value={regla.servicioMenorId} onValueChange={v => handleRuleChange('condicionales', i, 'servicioMenorId', v)}><SelectTrigger><SelectValue placeholder="Servicio si es MENOR O IGUAL al umbral..."/></SelectTrigger><SelectContent>{servicios.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select>
                      <Select value={regla.servicioMayorId} onValueChange={v => handleRuleChange('condicionales', i, 'servicioMayorId', v)}><SelectTrigger><SelectValue placeholder="Servicio si es MAYOR al umbral..."/></SelectTrigger><SelectContent>{servicios.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select>
                    </div>
                </ConfigFormItem>
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
