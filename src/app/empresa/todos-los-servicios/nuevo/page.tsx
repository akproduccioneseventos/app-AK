
'use client';

import React, { useState, type FormEvent, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, PackagePlus, DollarSign, Trash2, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio, TipoItemEmpresa, TramoDePrecio, CategoriaInsumo, CategoriaActivo } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO, ALL_TIPOS_ITEM_EMPRESA, ALL_CATEGORIAS_INSUMO, ALL_CATEGORIAS_ACTIVO } from '@/types/empresa';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

function NuevoItemInventarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Unified state object
  const [formData, setFormData] = useState<Partial<ServicioEmpresa>>({
    nombre: '',
    tipoItem: 'Activo Fijo',
    categoria: 'Mobiliario',
    cantidadDisponible: undefined,
    valorUnitarioEstimado: undefined,
    proveedor: '',
    unidad: 'Unidad',
    notas: '',
    calculationMethod: 'fijo',
    precioVenta: undefined,
    precioBase: undefined,
    precioPorPersona: undefined,
    invitadosPorUnidad: undefined,
    tramosDePrecio: [],
  });

  React.useEffect(() => {
    const typeFromQuery = searchParams.get('type') as TipoItemEmpresa | null;
    if (typeFromQuery && ALL_TIPOS_ITEM_EMPRESA.includes(typeFromQuery)) {
      setFormData(prev => ({...prev, tipoItem: typeFromQuery}));
    }
  }, [searchParams]);

  const handleFormChange = (field: keyof ServicioEmpresa, value: any) => {
     if (typeof value === 'string' && ['cantidadDisponible', 'valorUnitarioEstimado', 'precioVenta', 'precioBase', 'precioPorPersona', 'invitadosPorUnidad'].includes(field)) {
      const numValue = value === '' ? undefined : Number(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleTipoItemChange = (value: TipoItemEmpresa) => {
    setFormData(prev => ({
        ...prev,
        tipoItem: value,
        categoria: value === 'Servicio' ? 'Otros servicios' : value === 'Activo Fijo' ? 'Mobiliario' : 'Otro Insumo',
    }));
  };

  const handleCalculationMethodChange = (value: ServicioEmpresa['calculationMethod']) => {
    setFormData(prev => ({...prev, calculationMethod: value}));
  };

  const addTramo = () => {
    setFormData(prev => ({
        ...prev,
        tramosDePrecio: [...(prev.tramosDePrecio || []), { id: `tramo_${Date.now()}`, desde: 0, hasta: 0, precio: 0 }]
    }));
  };
  const removeTramo = (tramoId: string) => {
    setFormData(prev => ({
        ...prev,
        tramosDePrecio: (prev.tramosDePrecio || []).filter(t => t.id !== tramoId)
    }));
  };
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
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nombre?.trim() || !formData.tipoItem || !formData.categoria) {
      toast({ title: "Campos Requeridos", description: "Nombre, Tipo y Categoría son obligatorios.", variant: "destructive" });
      return;
    }

    if (formData.tipoItem !== 'Servicio' && !formData.unidad) {
        toast({ title: "Campo Requerido", description: "La unidad es obligatoria para Insumos y Activos.", variant: "destructive" });
        return;
    }
    
    if (formData.tipoItem === 'Servicio' && (formData.calculationMethod === 'fijo' ? formData.precioVenta === undefined : false)) {
        toast({ title: "Precio Requerido", description: "Define un precio para el servicio de tipo fijo.", variant: "destructive" });
        return;
    }
     if (formData.tipoItem === 'Servicio' && (formData.calculationMethod === 'porPersona' ? formData.precioPorPersona === undefined : false)) {
        toast({ title: "Precio Requerido", description: "Define un precio para el servicio de tipo por persona.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    
    const dataToSave: Omit<ServicioEmpresa, 'id'> = {
      ...formData,
      nombre: formData.nombre.trim(),
      tipoItem: formData.tipoItem,
      categoria: formData.categoria,
      unidad: formData.tipoItem === 'Servicio' ? undefined : formData.unidad,
    } as Omit<ServicioEmpresa, 'id'>;


    try {
      const result = await saveServicioEmpresa(dataToSave);
      if (result.success && result.id) {
        toast({ title: "¡Ítem Guardado!", description: `El ítem "${dataToSave.nombre}" ha sido añadido.` });
        
        let redirectUrl = '/empresa/todos-los-servicios';
        if(formData.tipoItem === 'Insumo/Ingrediente' || formData.tipoItem === 'Bebida (Insumo)') {
          redirectUrl = '/empresa/insumos';
        } else if (formData.tipoItem === 'Servicio') {
          redirectUrl = '/empresa/servicios';
        }
        
        router.push(redirectUrl);
      } else {
        toast({ title: "Error al Guardar", description: result.error || "No se pudo guardar el ítem.", variant: "destructive"});
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const isServicio = formData.tipoItem === 'Servicio';
  
  let backUrl = '/empresa/todos-los-servicios';
  if(formData.tipoItem === 'Insumo/Ingrediente' || formData.tipoItem === 'Bebida (Insumo)') {
    backUrl = '/empresa/insumos';
  } else if (isServicio) {
    backUrl = '/empresa/servicios';
  }
  
  const currentCategories = useMemo(() => {
    switch (formData.tipoItem) {
        case 'Servicio': return ALL_CATEGORIAS_SERVICIO;
        case 'Activo Fijo': return ALL_CATEGORIAS_ACTIVO;
        case 'Insumo/Ingrediente':
        case 'Bebida (Insumo)':
        default: return ALL_CATEGORIAS_INSUMO;
    }
  }, [formData.tipoItem]);


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackagePlus className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Añadir Nuevo Ítem al Catálogo
          </h1>
        </div>
        <Link href={backUrl} passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalles del Ítem</CardTitle>
          <CardDescription>Completa la información del nuevo activo, insumo o servicio que ofrece tu empresa.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="item-tipo" className="text-base">Tipo de Ítem *</Label>
                <Select value={formData.tipoItem} onValueChange={(value) => handleTipoItemChange(value as TipoItemEmpresa)} required disabled={isSaving}>
                  <SelectTrigger id="item-tipo" className="text-base p-3 h-auto"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_TIPOS_ITEM_EMPRESA.map(t => (<SelectItem key={t} value={t} className="text-base">{t}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem *</Label>
              <Input id="item-nombre" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} placeholder="Ej: Silla Tiffany, Servicio de DJ" className="text-base p-3" required disabled={isSaving}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={formData.categoria || ''} onValueChange={(value) => handleFormChange('categoria', value)} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{currentCategories.map(cat => (<SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
             
            {isServicio ? (
                <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calculation-method" className="text-base text-primary font-semibold">Método de Cálculo del Precio *</Label>
                    <Select value={formData.calculationMethod} onValueChange={(val) => handleCalculationMethodChange(val as ServicioEmpresa['calculationMethod'])} required disabled={isSaving}>
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
                  <div className="space-y-2"><Label htmlFor="item-costo-servicio" className="text-base flex items-center gap-2"><DollarSign className="w-5 h-5"/>Costo Estimado para la Empresa (Opcional)</Label><Input id="item-costo-servicio" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" disabled={isSaving}/></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="item-cantidad">Cantidad Disponible (Stock)</Label><Input id="item-cantidad" type="number" value={formData.cantidadDisponible ?? ''} onChange={(e) => handleFormChange('cantidadDisponible', e.target.value)} placeholder="Ej: 150" min="0" className="text-base p-3" disabled={isSaving}/></div>
                    <div className="space-y-2"><Label htmlFor="item-valor-unitario">Costo (UYU)</Label><Input id="item-valor-unitario" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" disabled={isSaving}/></div>
                     <div className="space-y-2"><Label htmlFor="item-unidad" className="text-base">Unidad *</Label><Select value={formData.unidad || ''} onValueChange={(value) => handleFormChange('unidad', value as UnidadServicio)} disabled={isSaving} required={!isServicio}><SelectTrigger id="item-unidad" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar unidad..."/></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u} className="text-base">{u}</SelectItem>))}</SelectContent></Select></div>
                     <div className="space-y-2"><Label htmlFor="item-proveedor">Proveedor</Label><Input id="item-proveedor" value={formData.proveedor || ''} onChange={(e) => handleFormChange('proveedor', e.target.value)} placeholder="Ej: Coca-Cola, Cristalería El Sol" className="text-base p-3" disabled={isSaving}/></div>
                </div>
            )}
            <div className="space-y-2"><Label htmlFor="item-notas">Notas</Label><Textarea id="item-notas" value={formData.notas || ''} onChange={(e) => handleFormChange('notas', e.target.value)} placeholder="Notas adicionales sobre el ítem..." rows={3} className="text-base p-3" disabled={isSaving}/></div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Ítem'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NuevoItemInventarioPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NuevoItemInventarioContent/>
        </Suspense>
    )
}
