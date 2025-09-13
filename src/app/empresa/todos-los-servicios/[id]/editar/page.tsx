'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit3, Save, Loader2, AlertTriangle, StickyNote, DollarSign, PlusCircle, Trash2, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa, getServicioEmpresaById } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio, TipoItemEmpresa, TramoDePrecio } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO, ALL_TIPOS_ITEM_EMPRESA } from '@/types/empresa';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const CATERING_SUBCATEGORIES = ['Entrada', 'Plato Principal', 'Menú Niños/Adolescentes', 'Personal'];
const REPOSTERIA_SUBCATEGORIES = ['Torta Principal', 'Mesa de Postres', 'Souvenirs Comestibles'];


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
            calculationMethod: loadedItem.calculationMethod || 'fijo',
            tramosDePrecio: loadedItem.tramosDePrecio || [],
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCategoryChange = (value: CategoriaServicio | '') => {
    setFormData(prev => ({...prev, categoria: value as CategoriaServicio, subcategoria: '' }));
  }

  const handleTramoChange = (tramoId: string, field: 'desde' | 'hasta' | 'precio', value: string) => {
    const numericValue = parseInt(value, 10);
    const finalValue = isNaN(numericValue) ? 0 : numericValue;

    setFormData(prev => ({
      ...prev,
      tramosDePrecio: (prev.tramosDePrecio || []).map(t => 
        t.id === tramoId ? { ...t, [field]: finalValue } : t
      )
    }));
  };

  const addTramo = () => {
    const newTramo: TramoDePrecio = { id: `tramo_${Date.now()}`, desde: 0, hasta: 0, precio: 0 };
    setFormData(prev => ({
      ...prev,
      tramosDePrecio: [...(prev.tramosDePrecio || []), newTramo]
    }));
  };

  const removeTramo = (tramoId: string) => {
    setFormData(prev => ({
      ...prev,
      tramosDePrecio: (prev.tramosDePrecio || []).filter(t => t.id !== tramoId)
    }));
  };
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!formData.nombre?.trim() || !formData.tipoItem || !formData.categoria) {
      toast({ title: "Campos Requeridos", description: "Nombre, Tipo y Categoría son obligatorios.", variant: "destructive" });
      return;
    }

    if (formData.tipoItem !== 'Servicio' && !formData.unidad) {
        toast({ title: "Campo Requerido", description: "La unidad es obligatoria para Insumos y Activos.", variant: "destructive" });
        return;
    }
    
    if (formData.tipoItem === 'Servicio' && (formData.calculationMethod === 'fijo' ? !formData.precioVenta : false) && (formData.calculationMethod === 'porPersona' ? !formData.precioPorPersona : false)) {
        toast({ title: "Precio Requerido", description: "El precio de venta es obligatorio para este método de cálculo.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const itemDataToSave: ServicioEmpresa = {
        ...(item as ServicioEmpresa), 
        ...formData,
        nombre: formData.nombre.trim(),
        tipoItem: formData.tipoItem,
        categoria: formData.categoria,
        unidad: formData.tipoItem === 'Servicio' ? undefined : formData.unidad,
        subcategoria: formData.subcategoria?.trim() || undefined,
        cantidadDisponible: formData.cantidadDisponible !== undefined ? Number(formData.cantidadDisponible) : undefined,
        valorUnitarioEstimado: formData.valorUnitarioEstimado !== undefined ? Number(formData.valorUnitarioEstimado) : undefined,
        precioVenta: formData.precioVenta !== undefined ? Number(formData.precioVenta) : undefined,
        precioBase: formData.precioBase !== undefined ? Number(formData.precioBase) : undefined,
        precioPorPersona: formData.precioPorPersona !== undefined ? Number(formData.precioPorPersona) : undefined,
        invitadosPorUnidad: formData.invitadosPorUnidad !== undefined ? Number(formData.invitadosPorUnidad) : undefined,
        notas: formData.notas?.trim() || undefined,
    };
    
    try {
      const result = await saveServicioEmpresa(itemDataToSave);
      if (result.success && result.servicio) {
        toast({ title: "¡Ítem Actualizado!", description: `El ítem "${result.servicio.nombre}" ha sido actualizado.` });
        const redirectUrl = result.servicio.tipoItem === 'Servicio' ? '/empresa/servicios' : '/empresa/todos-los-servicios';
        router.push(redirectUrl);
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
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Ítem no encontrado. <Link href="/empresa/todos-los-servicios" className="underline">Volver al inventario</Link>.</div>;

  const isCatering = formData.categoria === 'Servicio de catering';
  const isReposteria = formData.categoria === 'Servicio de repostería';
  const isServicio = formData.tipoItem === 'Servicio';
  const backUrl = isServicio ? '/empresa/servicios' : '/empresa/todos-los-servicios';


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-primary" />
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
          <CardTitle className="font-headline">Actualizar Ítem del Catálogo</CardTitle>
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
                <Select value={formData.categoria || ''} onValueChange={(value) => handleCategoryChange(value as CategoriaServicio)} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria"><SelectValue/></SelectTrigger>
                  <SelectContent>{ALL_CATEGORIAS_SERVICIO.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-subcategoria" className="text-base">Subcategoría</Label>
                {isCatering ? (
                    <Select value={formData.subcategoria || ''} onValueChange={(value) => handleFormChange('subcategoria', value)}>
                        <SelectTrigger id="item-subcategoria"><SelectValue placeholder="General"/></SelectTrigger>
                        <SelectContent>{CATERING_SUBCATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                    </Select>
                ) : isReposteria ? (
                    <Select value={formData.subcategoria || ''} onValueChange={(value) => handleFormChange('subcategoria', value)}>
                        <SelectTrigger id="item-subcategoria"><SelectValue placeholder="General"/></SelectTrigger>
                        <SelectContent>{REPOSTERIA_SUBCATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                    </Select>
                ) : (
                    <Input id="item-subcategoria" value={formData.subcategoria || ''} onChange={(e) => handleFormChange('subcategoria', e.target.value)} disabled={isSaving}/>
                )}
              </div>
            </div>
             
            {isServicio ? (
                <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calculation-method" className="text-base text-primary font-semibold">Método de Cálculo del Precio *</Label>
                    <Select value={formData.calculationMethod || 'fijo'} onValueChange={(val) => handleFormChange('calculationMethod', val as ServicioEmpresa['calculationMethod'])} required disabled={isSaving}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fijo">Precio Fijo</SelectItem>
                        <SelectItem value="porPersona">Precio por Persona</SelectItem>
                        <SelectItem value="ratio">Ratio (ej: 1 cada X invitados)</SelectItem>
                        <SelectItem value="tramos">Por Tramos de Invitados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.calculationMethod === 'fijo' && (
                    <div className="space-y-2"><Label htmlFor="item-precioVenta">Precio de Venta Fijo (UYU) *</Label><Input id="item-precioVenta" type="number" value={formData.precioVenta ?? ''} onChange={(e) => handleFormChange('precioVenta', e.target.value)} required disabled={isSaving} min="0" step="any"/></div>
                  )}
                  {formData.calculationMethod === 'porPersona' && (
                    <div className="space-y-2"><Label htmlFor="item-precioPorPersona">Precio por Persona (UYU) *</Label><Input id="item-precioPorPersona" type="number" value={formData.precioPorPersona ?? ''} onChange={(e) => handleFormChange('precioPorPersona', e.target.value)} required disabled={isSaving} min="0" step="any"/></div>
                  )}
                  {formData.calculationMethod === 'ratio' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label htmlFor="item-precioBaseRatio" className="text-xs">Precio por Unidad</Label><Input id="item-precioBaseRatio" type="number" value={formData.precioBase ?? ''} onChange={e => handleFormChange('precioBase', e.target.value)} required min="0" step="any"/></div>
                      <div className="space-y-1"><Label htmlFor="item-invitadosUnidad" className="text-xs">Invitados por Unidad</Label><Input id="item-invitadosUnidad" type="number" value={formData.invitadosPorUnidad ?? ''} onChange={e => handleFormChange('invitadosPorUnidad', e.target.value)} required min="1"/></div>
                    </div>
                  )}
                  {formData.calculationMethod === 'tramos' && (
                    <div className="space-y-3">
                        <Label>Tramos de Precios</Label>
                        {(formData.tramosDePrecio || []).map(tramo => (
                            <div key={tramo.id} className="flex items-end gap-2 p-2 border rounded bg-background">
                                <div className="space-y-1"><Label htmlFor={`tramo-desde-${tramo.id}`} className="text-xs">Desde</Label><Input id={`tramo-desde-${tramo.id}`} type="number" value={tramo.desde} onChange={e=>handleTramoChange(tramo.id, 'desde', e.target.value)} className="h-8"/></div>
                                <div className="space-y-1"><Label htmlFor={`tramo-hasta-${tramo.id}`} className="text-xs">Hasta</Label><Input id={`tramo-hasta-${tramo.id}`} type="number" value={tramo.hasta} onChange={e=>handleTramoChange(tramo.id, 'hasta', e.target.value)} className="h-8"/></div>
                                <div className="space-y-1 flex-grow"><Label htmlFor={`tramo-precio-${tramo.id}`} className="text-xs">Precio</Label><Input id={`tramo-precio-${tramo.id}`} type="number" value={tramo.precio} onChange={e=>handleTramoChange(tramo.id, 'precio', e.target.value)} className="h-8"/></div>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTramo(tramo.id)}><Trash2 className="w-4 h-4"/></Button>
                            </div>
                        ))}
                        <Button type="button" size="sm" variant="outline" onClick={addTramo}>+ Añadir Tramo</Button>
                    </div>
                  )}

                  <Separator/>
                  <div className="space-y-2"><Label htmlFor="item-costo-servicio" className="text-base flex items-center gap-2"><DollarSign className="w-5 h-5"/>Costo Estimado para la Empresa</Label><Input id="item-costo-servicio" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} placeholder="0.00" min="0" step="any" disabled={isSaving}/></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="item-cantidad">Cantidad Disponible (Stock)</Label><Input id="item-cantidad" type="number" value={formData.cantidadDisponible ?? ''} onChange={(e) => handleFormChange('cantidadDisponible', e.target.value)} disabled={isSaving}/></div>
                    <div className="space-y-2"><Label htmlFor="item-valor-unitario">Valor Unitario (Costo UYU)</Label><Input id="item-valor-unitario" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} disabled={isSaving}/></div>
                     <div className="space-y-2"><Label htmlFor="item-unidad" className="text-base">Unidad *</Label><Select value={formData.unidad || ''} onValueChange={(value) => handleFormChange('unidad', value as UnidadServicio)} disabled={isSaving} required={!isServicio}><SelectTrigger id="item-unidad"><SelectValue /></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u}>{u}</SelectItem>))}</SelectContent></Select></div>
                </div>
            )}
            
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
