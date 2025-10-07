'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit3, Save, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServicioEmpresaById, saveServicioEmpresa, deleteServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, TramoDePrecio } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO } from '@/types/empresa';
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
import { Separator } from '@/components/ui/separator';

export default function EditarServicioPage({ params: paramsProp }: { params: { id: string } }) {
  const params = React.use(paramsProp); 
  const router = useRouter();
  const { toast } = useToast();
  
  const [item, setItem] = useState<ServicioEmpresa | null>(null);
  const [formData, setFormData] = useState<Partial<ServicioEmpresa>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const itemId = params.id;

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedItem = await getServicioEmpresaById(itemId);
      if (loadedItem) {
        setItem(loadedItem);
        setFormData(loadedItem);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
      toast({ title: 'Error al Cargar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [itemId, toast]);
  
  useEffect(() => {
    if (itemId) loadItem();
  }, [itemId, loadItem]);

  const handleFormChange = (field: keyof ServicioEmpresa, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTramoChange = (index: number, field: keyof TramoDePrecio, value: string) => {
    setFormData(prev => {
        const nuevosTramos = [...(prev.tramosDePrecio || [])];
        nuevosTramos[index] = {...nuevosTramos[index], [field]: Number(value) || 0 };
        return {...prev, tramosDePrecio: nuevosTramos};
    });
  };

  const addTramo = () => {
    setFormData(prev => ({...prev, tramosDePrecio: [...(prev.tramosDePrecio || []), {id: `tramo_${Date.now()}`, desde: 0, hasta: 0, precio: 0}]}));
  };

  const removeTramo = (index: number) => {
    setFormData(prev => ({...prev, tramosDePrecio: (prev.tramosDePrecio || []).filter((_, i) => i !== index)}));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nombre?.trim() || !formData.categoria) {
      toast({ title: "Campos Requeridos", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await saveServicioEmpresa(formData as ServicioEmpresa);
      if (result.success) {
        toast({ title: "¡Servicio Actualizado!" });
        router.push('/empresa/servicios');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
        const result = await deleteServicioEmpresa(item.id);
        if (result.success) {
            toast({ title: "Servicio Eliminado", variant: "destructive" });
            router.push('/empresa/servicios');
        } else {
            throw new Error(result.error);
        }
    } catch (err: any) {
        toast({ title: "Error al Eliminar", description: err.message, variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  if (notFound) return <div className="text-center p-4"><AlertTriangle className="mx-auto w-8 h-8 text-destructive"/>Servicio no encontrado.</div>;
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><Edit3 className="w-8 h-8 text-primary"/> Editando Servicio</h1>
        <Link href="/empresa/servicios" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader><CardTitle>{formData.nombre}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2"><Label htmlFor="item-nombre">Nombre del Servicio *</Label><Input id="item-nombre" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} required /></div>
             <div className="space-y-2"><Label htmlFor="item-categoria">Categoría *</Label><Select value={formData.categoria || ''} onValueChange={(value) => handleFormChange('categoria', value as CategoriaServicio)} required><SelectTrigger id="item-categoria"><SelectValue /></SelectTrigger><SelectContent>{ALL_CATEGORIAS_SERVICIO.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
             <div className="space-y-2"><Label htmlFor="item-subcategoria">Subcategoría</Label><Input id="item-subcategoria" value={formData.subcategoria || ''} onChange={(e) => handleFormChange('subcategoria', e.target.value)} /></div>
             <div className="space-y-2"><Label htmlFor="item-costo">Costo Interno (UYU)</Label><Input id="item-costo" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.valueAsNumber)} /></div>
            
             <Separator/>
             
             <div className="space-y-3">
                 <Label className="font-medium">Cálculo de Precio de Venta *</Label>
                 <Select value={formData.calculationMethod} onValueChange={(v) => handleFormChange('calculationMethod', v)} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="fijo">Precio Fijo</SelectItem><SelectItem value="porPersona">Por Persona</SelectItem><SelectItem value="ratio">Por Ratio de Invitados</SelectItem><SelectItem value="tramos">Por Tramos de Invitados</SelectItem></SelectContent></Select>
             </div>
             
            {formData.calculationMethod === 'fijo' && (<div className="space-y-2"><Label htmlFor="precio-venta">Precio de Venta (Fijo)</Label><Input id="precio-venta" type="number" value={formData.precioVenta ?? ''} onChange={(e) => handleFormChange('precioVenta', e.target.valueAsNumber)} min="0" step="any"/></div>)}
            {formData.calculationMethod === 'porPersona' && (<div className="space-y-2"><Label htmlFor="precio-persona">Precio Por Persona</Label><Input id="precio-persona" type="number" value={formData.precioPorPersona ?? ''} onChange={(e) => handleFormChange('precioPorPersona', e.target.valueAsNumber)} min="0" step="any"/></div>)}
            {formData.calculationMethod === 'ratio' && (<div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="ratio-base">Precio Base (por unidad)</Label><Input id="ratio-base" type="number" value={formData.precioBase ?? ''} onChange={(e) => handleFormChange('precioBase', e.target.valueAsNumber)} min="0" step="any"/></div><div className="space-y-2"><Label htmlFor="ratio-invitados">Invitados por Unidad</Label><Input id="ratio-invitados" type="number" value={formData.invitadosPorUnidad ?? ''} onChange={(e) => handleFormChange('invitadosPorUnidad', e.target.valueAsNumber)} min="1"/></div></div>)}
            {formData.calculationMethod === 'tramos' && (
                <div className="space-y-3">
                    {formData.tramosDePrecio?.map((tramo, index) => (
                        <div key={tramo.id} className="flex items-end gap-2 p-2 border rounded-md"><div className="space-y-1"><Label htmlFor={`tramo-desde-${index}`}>Desde</Label><Input id={`tramo-desde-${index}`} type="number" value={tramo.desde} onChange={e => handleTramoChange(index, 'desde', e.target.value)} className="w-20"/></div><div className="space-y-1"><Label htmlFor={`tramo-hasta-${index}`}>Hasta</Label><Input id={`tramo-hasta-${index}`} type="number" value={tramo.hasta} onChange={e => handleTramoChange(index, 'hasta', e.target.value)} className="w-20"/></div><div className="space-y-1 flex-grow"><Label htmlFor={`tramo-precio-${index}`}>Precio</Label><Input id={`tramo-precio-${index}`} type="number" value={tramo.precio} onChange={e => handleTramoChange(index, 'precio', e.target.value)}/></div><Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeTramo(index)} disabled={(formData.tramosDePrecio?.length || 0) <= 1}><Trash2 className="w-4 h-4"/></Button></div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTramo}>Añadir Tramo</Button>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Guardar Cambios</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" disabled={isDeleting}>{isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Eliminar Servicio</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará "{formData.nombre}" permanentemente.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
