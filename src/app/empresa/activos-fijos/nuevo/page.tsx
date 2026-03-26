
'use client';

import React, { useState, type FormEvent, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, PackagePlus, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveActivoFijo } from '@/app/actions/activos-fijos';
import type { ServicioEmpresa, AnyCategoria, UnidadServicio, TramoDePrecio } from '@/types/empresa';
import { ALL_CATEGORIAS_ACTIVO, ALL_UNIDADES_SERVICIO } from '@/types/empresa';
import { Separator } from '@/components/ui/separator';


function NuevoActivoFijoContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Unified state object
  const [formData, setFormData] = useState<Partial<ServicioEmpresa>>({
    nombre: '',
    tipoItem: 'Activo Fijo',
    categoria: 'Mobiliario',
    cantidadDisponible: 1,
    valorUnitarioEstimado: 0,
    unidad: 'Unidad',
    notas: '',
    calculationMethod: 'fijo',
    cantidad: 1,
    tramosDePrecio: [{id: 'tramo_1', desde: 0, hasta: 50, precio: 0}],
  });

  const handleFormChange = (field: keyof ServicioEmpresa, value: any) => {
     if (typeof value === 'string' && ['cantidadDisponible', 'valorUnitarioEstimado', 'invitadosPorUnidad', 'cantidad'].includes(field)) {
      const numValue = value === '' ? undefined : Number(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  
  const handleTramoChange = (index: number, field: keyof TramoDePrecio, value: string) => {
    setFormData(prev => {
        const nuevosTramos = [...(prev.tramosDePrecio || [])];
        const numValue = Number(value);
        if(!isNaN(numValue)) {
            nuevosTramos[index] = {...nuevosTramos[index], [field]: numValue };
            return {...prev, tramosDePrecio: nuevosTramos};
        }
        return prev;
    })
  };

  const addTramo = () => {
    setFormData(prev => {
        const lastTramo = prev.tramosDePrecio?.[prev.tramosDePrecio.length - 1];
        const newDesde = lastTramo ? lastTramo.hasta + 1 : 0;
        const newTramo: TramoDePrecio = {
            id: `tramo_${Date.now()}`,
            desde: newDesde,
            hasta: newDesde + 49,
            precio: 0
        };
        return {...prev, tramosDePrecio: [...(prev.tramosDePrecio || []), newTramo]};
    });
  };

  const removeTramo = (indexToRemove: number) => {
    setFormData(prev => {
        if(!prev.tramosDePrecio || prev.tramosDePrecio.length <= 1) return prev;
        const nuevosTramos = prev.tramosDePrecio.filter((_, index) => index !== indexToRemove);
        return {...prev, tramosDePrecio: nuevosTramos};
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nombre?.trim() || !formData.categoria) {
      toast({ title: "Campos Requeridos", description: "Nombre y Categoría son obligatorios.", variant: "destructive" });
      return;
    }
    
    if (!formData.unidad) {
        toast({ title: "Campo Requerido", description: "La unidad es obligatoria.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    
    const dataToSave: Omit<ServicioEmpresa, 'id'> = {
      ...formData,
      nombre: formData.nombre.trim(),
      tipoItem: 'Activo Fijo',
      categoria: formData.categoria,
    } as Omit<ServicioEmpresa, 'id'>;


    try {
      const result = await saveActivoFijo(dataToSave);
      if (result.success && result.id) {
        toast({ title: "¡Activo Guardado!", description: `El activo "${dataToSave.nombre}" ha sido añadido.` });
        router.push('/empresa/activos-fijos');
      } else {
        toast({ title: "Error al Guardar", description: result.error || "No se pudo guardar el activo.", variant: "destructive"});
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackagePlus className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Añadir Nuevo Activo Fijo
          </h1>
        </div>
        <Link href="/empresa/activos-fijos">
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalles del Activo</CardTitle>
          <CardDescription>Completa la información del nuevo activo para tu inventario.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem *</Label>
              <Input id="item-nombre" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} placeholder="Ej: Silla Tiffany, Mantel Redondo" className="text-base p-3" required disabled={isSaving}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={formData.categoria || ''} onValueChange={(value) => handleFormChange('categoria', value as AnyCategoria)} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_CATEGORIAS_ACTIVO.map(cat => (<SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
               <div className="space-y-2"><Label htmlFor="item-unidad" className="text-base">Unidad *</Label><Select value={formData.unidad || ''} onValueChange={(value) => handleFormChange('unidad', value as UnidadServicio)} disabled={isSaving} required><SelectTrigger id="item-unidad" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar unidad..."/></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u} className="text-base">{u}</SelectItem>))}</SelectContent></Select></div>
            </div>
             
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="item-cantidad">Cantidad Disponible (Stock)</Label><Input id="item-cantidad" type="number" value={formData.cantidadDisponible ?? ''} onChange={(e) => handleFormChange('cantidadDisponible', e.target.value)} placeholder="Ej: 150" min="0" className="text-base p-3" disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="item-valor-unitario">Costo Interno (UYU)</Label><Input id="item-valor-unitario" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" disabled={isSaving}/></div>
            </div>

            <Separator/>
             
             <div className="space-y-3">
                 <Label className="text-base font-medium">Método de Cálculo de Cantidad (para Lista de Carga)</Label>
                 <Select value={formData.calculationMethod} onValueChange={(v) => handleFormChange('calculationMethod', v)} disabled={isSaving}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fijo">Cantidad Fija</SelectItem>
                        <SelectItem value="porPersona">Por Persona</SelectItem>
                        <SelectItem value="ratio">Por Ratio de Invitados</SelectItem>
                        <SelectItem value="tramos">Por Tramos de Invitados</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
             
            {formData.calculationMethod === 'fijo' && (
                <div className="space-y-2"><Label htmlFor="cantidad-fija">Cantidad a Cargar</Label><Input id="cantidad-fija" type="number" value={formData.cantidad ?? 1} onChange={(e) => handleFormChange('cantidad', e.target.value)} disabled={isSaving} min="1"/><p className="text-xs text-muted-foreground">Cantidad fija a cargar siempre.</p></div>
            )}
            {formData.calculationMethod === 'porPersona' && (
                 <p className="text-sm text-muted-foreground italic bg-blue-50 p-3 rounded-md">La cantidad se calculará como 1 por cada invitado.</p>
            )}
            {formData.calculationMethod === 'ratio' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="ratio-base">Cantidad por Ratio</Label><Input id="ratio-base" type="number" value={formData.cantidad ?? 1} onChange={(e) => handleFormChange('cantidad', e.target.value)} disabled={isSaving} min="1"/></div>
                    <div className="space-y-2"><Label htmlFor="ratio-invitados">Invitados por Unidad</Label><Input id="ratio-invitados" type="number" value={formData.invitadosPorUnidad ?? ''} onChange={(e) => handleFormChange('invitadosPorUnidad', e.target.value)} disabled={isSaving} min="1"/></div>
                </div>
            )}
             {formData.calculationMethod === 'tramos' && (
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Define la cantidad a cargar para cada rango de invitados.</p>
                    {formData.tramosDePrecio?.map((tramo, index) => (
                        <div key={tramo.id} className="flex items-end gap-2 p-2 border rounded-md">
                            <div className="space-y-1"><Label htmlFor={`tramo-desde-${index}`}>Desde</Label><Input id={`tramo-desde-${index}`} type="number" value={tramo.desde} onChange={e => handleTramoChange(index, 'desde', e.target.value)} className="w-20"/></div>
                            <div className="space-y-1"><Label htmlFor={`tramo-hasta-${index}`}>Hasta</Label><Input id={`tramo-hasta-${index}`} type="number" value={tramo.hasta} onChange={e => handleTramoChange(index, 'hasta', e.target.value)} className="w-20"/></div>
                            <div className="space-y-1 flex-grow"><Label htmlFor={`tramo-cantidad-${index}`}>Cantidad</Label><Input id={`tramo-cantidad-${index}`} type="number" value={tramo.precio} onChange={e => handleTramoChange(index, 'precio', e.target.value)}/></div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeTramo(index)} disabled={(formData.tramosDePrecio?.length || 0) <= 1}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTramo}>Añadir Tramo</Button>
                </div>
            )}

          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Activo'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NuevoActivoFijoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NuevoActivoFijoContent/>
        </Suspense>
    )
}
