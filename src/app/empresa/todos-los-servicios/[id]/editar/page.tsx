
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit3, Save, Loader2, PackagePlus, AlertTriangle, StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa, getServicioEmpresaById } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio, TipoItemEmpresa } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO, ALL_TIPOS_ITEM_EMPRESA } from '@/types/empresa';
import { Textarea } from '@/components/ui/textarea';

export default function EditarItemInventarioPage({ params: paramsProp }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsProp);
  const router = useRouter();
  const { toast } = useToast();
  
  const [item, setItem] = useState<ServicioEmpresa | null>(null);
  const [formData, setFormData] = useState<Partial<ServicioEmpresa>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const itemIdFromParams = params.id;

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const loadedItem = await getServicioEmpresaById(itemIdFromParams);
      if (loadedItem) {
        setItem(loadedItem);
        setFormData({
            ...loadedItem,
            cantidadDisponible: loadedItem.cantidadDisponible ?? undefined,
            valorUnitarioEstimado: loadedItem.valorUnitarioEstimado ?? undefined
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

  const handleFormChange = (field: keyof ServicioEmpresa, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!formData.nombre?.trim() || !formData.tipoItem || !formData.categoria || !formData.unidad) {
      toast({ title: "Campos Requeridos", description: "Nombre, Tipo, Categoría y Unidad son obligatorios.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const itemDataToSave: ServicioEmpresa = {
        ...item,
        ...formData,
        nombre: formData.nombre.trim(),
        tipoItem: formData.tipoItem,
        categoria: formData.categoria,
        unidad: formData.unidad,
        cantidadDisponible: formData.cantidadDisponible !== undefined ? Number(formData.cantidadDisponible) : undefined,
        valorUnitarioEstimado: formData.valorUnitarioEstimado !== undefined ? Number(formData.valorUnitarioEstimado) : undefined,
        notas: formData.notas?.trim() || undefined,
    };

    try {
      const result = await saveServicioEmpresa(itemDataToSave);
      if (result.success && result.servicio) {
        toast({ title: "¡Ítem Actualizado!", description: `El ítem "${result.servicio.nombre}" ha sido actualizado.` });
        router.push('/empresa/todos-los-servicios');
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el ítem.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Ítem no encontrado. <Link href="/empresa/todos-los-servicios" className="underline">Volver al catálogo</Link>.</div>;


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando: <span className="text-primary">{item?.nombre}</span>
          </h1>
        </div>
        <Link href="/empresa/todos-los-servicios" passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Ítem del Inventario</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem *</Label>
              <Input id="item-nombre" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} required disabled={isSaving}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-tipo" className="text-base">Tipo de Ítem *</Label>
                <Select value={formData.tipoItem || ''} onValueChange={(value) => handleFormChange('tipoItem', value as TipoItemEmpresa)} required disabled={isSaving}>
                  <SelectTrigger id="item-tipo"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_TIPOS_ITEM_EMPRESA.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Servicio/Categoría *</Label>
                <Select value={formData.categoria || ''} onValueChange={(value) => handleFormChange('categoria', value as CategoriaServicio)} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria"><SelectValue/></SelectTrigger>
                  <SelectContent>{ALL_CATEGORIAS_SERVICIO.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="item-cantidad">Cantidad Disponible (Stock)</Label>
                    <Input id="item-cantidad" type="number" value={formData.cantidadDisponible ?? ''} onChange={(e) => handleFormChange('cantidadDisponible', e.target.value)} disabled={isSaving}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item-valor-unitario">Valor Unitario (Costo UYU)</Label>
                    <Input id="item-valor-unitario" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} disabled={isSaving}/>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="item-unidad" className="text-base">Unidad *</Label>
                <Select value={formData.unidad || ''} onValueChange={(value) => handleFormChange('unidad', value as UnidadServicio)} disabled={isSaving} required>
                  <SelectTrigger id="item-unidad"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u}>{u}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-notas" className="text-base">Observaciones (Opcional)</Label>
              <Textarea id="item-notas" value={formData.notas || ''} onChange={(e) => handleFormChange('notas', e.target.value)} rows={3} disabled={isSaving}/>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Guardar Cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

