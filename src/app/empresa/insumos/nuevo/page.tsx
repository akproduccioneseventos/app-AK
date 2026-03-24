
'use client';

import React, { useState, type FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveInsumo } from '@/app/actions/insumos';
import type { ServicioEmpresa, AnyCategoria, UnidadServicio, CategoriaInsumo } from '@/types/empresa';
import { ALL_CATEGORIAS_INSUMO, ALL_UNIDADES_SERVICIO } from '@/types/empresa';

function NuevoInsumoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const categoriaParam = searchParams.get('categoria');
  const subcategoriaParam = searchParams.get('subcategoria');

  // Unified state object
  const [formData, setFormData] = useState<Partial<ServicioEmpresa>>({
    nombre: '',
    tipoItem: 'Insumo/Ingrediente',
    categoria: 'Insumos varios',
    subcategoria: '',
    cantidadDisponible: 1,
    valorUnitarioEstimado: 0,
    proveedor: '',
    unidad: 'Unidad',
    notas: '',
  });

  useEffect(() => {
    if(subcategoriaParam) {
        setFormData(prev => ({...prev, subcategoria: subcategoriaParam}));
    }
    if (categoriaParam) {
        setFormData(prev => ({...prev, categoria: categoriaParam as CategoriaInsumo}));
    }
  }, [subcategoriaParam, categoriaParam]);

  const handleFormChange = (field: keyof ServicioEmpresa, value: any) => {
     if (typeof value === 'string' && ['cantidadDisponible', 'valorUnitarioEstimado'].includes(field)) {
      const numValue = value === '' ? undefined : Number(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
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
      tipoItem: 'Insumo/Ingrediente',
      categoria: formData.categoria,
    } as Omit<ServicioEmpresa, 'id'>;


    try {
      const result = await saveInsumo(dataToSave);
      if (result.success && result.id) {
        toast({ title: "¡Ítem Guardado!", description: `El ítem "${dataToSave.nombre}" ha sido añadido.` });
        if (searchParams.get('from') === 'gastronomia') {
            router.push('/empresa/menus');
        } else {
            router.push('/empresa/insumos');
        }
      } else {
        toast({ title: "Error al Guardar", description: result.error || "No se pudo guardar el ítem.", variant: "destructive"});
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const backUrl = searchParams.get('from') === 'gastronomia' ? '/empresa/menus' : '/empresa/insumos';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackagePlus className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Añadir Nuevo Insumo
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
          <CardTitle className="font-headline">Detalles del Insumo</CardTitle>
          <CardDescription>Completa la información del nuevo insumo/ingrediente para tu catálogo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem *</Label>
              <Input id="item-nombre" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} placeholder="Ej: Harina 000, Chocolate Cobertura" className="text-base p-3" required disabled={isSaving}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={formData.categoria || ''} onValueChange={(value) => handleFormChange('categoria', value as AnyCategoria)} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_CATEGORIAS_INSUMO.map(cat => (<SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                    <Label htmlFor="item-subcategoria" className="text-base">Subcategoría (Opcional)</Label>
                    <Input id="item-subcategoria" value={formData.subcategoria || ''} onChange={(e) => handleFormChange('subcategoria', e.target.value)} placeholder="Ej: Mesa de Postres, Candy Bar" className="text-base p-3" disabled={isSaving}/>
              </div>
            </div>
             
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="item-cantidad">Cantidad Disponible (Stock)</Label><Input id="item-cantidad" type="number" value={formData.cantidadDisponible ?? ''} onChange={(e) => handleFormChange('cantidadDisponible', e.target.value)} placeholder="Ej: 150" min="0" className="text-base p-3" disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="item-valor-unitario">Valor Unitario (Costo UYU)</Label><Input id="item-valor-unitario" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" disabled={isSaving}/></div>
                 <div className="space-y-2"><Label htmlFor="item-unidad" className="text-base">Unidad *</Label><Select value={formData.unidad || ''} onValueChange={(value) => handleFormChange('unidad', value as UnidadServicio)} disabled={isSaving} required><SelectTrigger id="item-unidad" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar unidad..."/></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u} className="text-base">{u}</SelectItem>))}</SelectContent></Select></div>
                 <div className="space-y-2"><Label htmlFor="item-proveedor">Proveedor</Label><Input id="item-proveedor" value={formData.proveedor || ''} onChange={(e) => handleFormChange('proveedor', e.target.value)} placeholder="Ej: Importadora del Este" className="text-base p-3" disabled={isSaving}/></div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Insumo'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NuevoInsumoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NuevoInsumoContent/>
        </Suspense>
    )
}
