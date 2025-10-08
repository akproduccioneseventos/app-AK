
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit3, Save, Loader2, AlertTriangle, StickyNote, DollarSign, PlusCircle, Trash2, Percent, Briefcase, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getActivoFijoById, saveActivoFijo, deleteActivoFijo } from '@/app/actions/activos-fijos';
import type { ServicioEmpresa, AnyCategoria, UnidadServicio } from '@/types/empresa';
import { ALL_CATEGORIAS_ACTIVO, ALL_UNIDADES_SERVICIO } from '@/types/empresa';
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


export default function EditarActivoFijoPage({ params: paramsProp }: { params: { id: string } }) {
  const params = React.use(paramsProp);
  const router = useRouter();
  const { toast } = useToast();
  
  const [item, setItem] = useState<ServicioEmpresa | null>(null);
  const [formData, setFormData] = useState<Partial<ServicioEmpresa>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const itemIdFromParams = params.id;

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const loadedItem = await getActivoFijoById(itemIdFromParams);

      if (loadedItem) {
        setItem(loadedItem);
        setFormData({
          ...loadedItem,
          cantidadDisponible: loadedItem.cantidadDisponible,
          valorUnitarioEstimado: loadedItem.valorUnitarioEstimado,
          proveedor: loadedItem.proveedor || '',
        });
      } else {
        setNotFound(true);
        toast({ title: 'Error', description: `No se encontró el ítem con ID ${itemIdFromParams}.`, variant: 'destructive' });
      }
    } catch (error) {
      setNotFound(true);
      toast({ title: 'Error al Cargar', description: 'No se pudo obtener la información del ítem.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [itemIdFromParams, toast]);
  
  useEffect(() => {
    if (itemIdFromParams) {
      loadItem();
    }
  }, [itemIdFromParams, loadItem]);

  const handleFormChange = (field: keyof ServicioEmpresa, value: string | number | undefined) => {
    const isNumericField = ['cantidadDisponible', 'valorUnitarioEstimado'].includes(field as string);
    
    if (isNumericField && typeof value === 'string') {
      const numValue = value === '' ? undefined : Number(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  
  const handleCategoryChange = (value: AnyCategoria | '') => {
    setFormData(prev => ({...prev, categoria: value as AnyCategoria }));
  }

  const backUrl = '/empresa/activos-fijos';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!formData.nombre?.trim() || !formData.tipoItem || !formData.categoria) {
      toast({ title: "Campos Requeridos", description: "Nombre, Tipo y Categoría son obligatorios.", variant: "destructive" });
      return;
    }

    if (!formData.unidad) {
        toast({ title: "Campo Requerido", description: "La unidad es obligatoria para Activos Fijos.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    const itemDataToSave: ServicioEmpresa = {
        ...(item as ServicioEmpresa), 
        ...formData,
        nombre: formData.nombre.trim(),
    };
    
    try {
      const result = await saveActivoFijo(itemDataToSave);
      if (result.success && result.servicio) {
        toast({ title: "¡Ítem Actualizado!", description: `El ítem "${result.servicio.nombre}" ha sido actualizado.` });
        router.push(backUrl);
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el ítem.");
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
      const result = await deleteActivoFijo(item.id);
      if (result.success) {
        toast({ title: "Ítem Eliminado", variant: "destructive" });
        router.push(backUrl);
      } else {
        throw new Error(result.error || "No se pudo eliminar el ítem.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Ítem no encontrado. <Link href={backUrl} className="underline">Volver al catálogo</Link>.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Edit3 className="w-8 h-8 text-primary"/>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando: <span className="text-primary">{item?.nombre}</span>
          </h1>
        </div>
        <Link href={backUrl} passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Activo Fijo</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="item-tipo" className="text-base">Tipo de Ítem *</Label>
                 <Input id="item-tipo-fijo" value={formData.tipoItem || ''} readOnly disabled className="bg-muted/70 font-semibold"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem *</Label>
              <Input id="item-nombre" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} required disabled={isSaving}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={formData.categoria || ''} onValueChange={(value) => handleCategoryChange(value as AnyCategoria)} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria"><SelectValue placeholder="Seleccionar categoría..."/></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_CATEGORIAS_ACTIVO.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="item-cantidad">Cantidad Disponible (Stock)</Label><Input id="item-cantidad" type="number" value={formData.cantidadDisponible ?? ''} onChange={(e) => handleFormChange('cantidadDisponible', e.target.value)} disabled={isSaving}/></div>
                    <div className="space-y-2"><Label htmlFor="item-costo">Costo (UYU)</Label><Input id="item-costo" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} disabled={isSaving}/></div>
                     <div className="space-y-2"><Label htmlFor="item-unidad" className="text-base">Unidad *</Label><Select value={formData.unidad || ''} onValueChange={(value) => handleFormChange('unidad', value as UnidadServicio)} disabled={isSaving} required><SelectTrigger id="item-unidad"><SelectValue /></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u}>{u}</SelectItem>))}</SelectContent></Select></div>
                     <div className="space-y-2"><Label htmlFor="item-proveedor">Proveedor</Label><Input id="item-proveedor" value={formData.proveedor || ''} onChange={(e) => handleFormChange('proveedor', e.target.value)} disabled={isSaving}/></div>
                </div>
            
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-between items-center">
            <Button type="submit" className="w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Guardar Cambios
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" className="w-auto" disabled={isSaving || isDeleting}>
                  {isDeleting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                  Eliminar Ítem
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El ítem "{item?.nombre}" será eliminado permanentemente del catálogo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

