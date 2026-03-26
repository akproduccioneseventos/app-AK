
'use client';

import React, { useState, type FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Sparkles, PlusCircle, Trash2, Truck, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import { getProveedores } from '@/app/actions/proveedores';
import type { ServicioEmpresa, AnyCategoria, TramoDePrecio, TipoCosto } from '@/types/empresa';
import type { Proveedor } from '@/types/proveedor';
import { ALL_CATEGORIAS_SERVICIO } from '@/types/empresa';
import { Separator } from '@/components/ui/separator';

function NuevoServicioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Default state from query params
  const categoriaParam = searchParams.get('categoria');
  const subcategoriaParam = searchParams.get('subcategoria');

  // Unified state object
  const [formData, setFormData] = useState<Partial<ServicioEmpresa>>({
    nombre: '',
    tipoItem: 'Servicio',
    categoria: 'Otros servicios',
    subcategoria: '',
    calculationMethod: 'fijo',
    precioVenta: 0,
    tipoCosto: 'Proveedor',
    proveedor: '',
    tramosDePrecio: [{id: 'tramo_1', desde: 0, hasta: 50, precio: 0}],
  });
  
  useEffect(() => {
    async function loadData() {
        try {
            const res = await getProveedores();
            setProveedores(res);
        } catch (e) {}
    }
    loadData();

    if(categoriaParam) {
        setFormData(prev => ({...prev, categoria: categoriaParam as AnyCategoria}));
    }
    if(subcategoriaParam) {
        setFormData(prev => ({...prev, subcategoria: subcategoriaParam}));
    }
  }, [categoriaParam, subcategoriaParam])
  
  const backUrl = (categoriaParam && subcategoriaParam) 
    ? `/empresa/servicios/${categoriaParam}/${subcategoriaParam}`
    : '/empresa/servicios';

  const handleFormChange = (field: keyof ServicioEmpresa, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
  }

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
  }

  const removeTramo = (indexToRemove: number) => {
    setFormData(prev => {
        if(!prev.tramosDePrecio || prev.tramosDePrecio.length <= 1) return prev;
        const nuevosTramos = prev.tramosDePrecio.filter((_, index) => index !== indexToRemove);
        return {...prev, tramosDePrecio: nuevosTramos};
    });
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nombre?.trim() || !formData.categoria) {
      toast({ title: "Campos Requeridos", description: "Nombre y Categoría son obligatorios.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    
    const dataToSave: Omit<ServicioEmpresa, 'id'> = {
      ...formData,
      nombre: formData.nombre.trim(),
      tipoItem: 'Servicio',
      categoria: formData.categoria,
    } as Omit<ServicioEmpresa, 'id'>;


    try {
      const result = await saveServicioEmpresa(dataToSave);
      if (result.success && result.id) {
        toast({ title: "¡Servicio Guardado!", description: `El servicio "${dataToSave.nombre}" ha sido añadido.` });
        router.push(backUrl);
      } else {
        toast({ title: "Error al Guardar", description: result.error || "No se pudo guardar el servicio.", variant: "destructive"});
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
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Añadir Nuevo Servicio
          </h1>
        </div>
        <Link href={backUrl}>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Detalles del Servicio</CardTitle>
          <CardDescription>Completa la información del nuevo servicio que ofrecerás.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Servicio *</Label>
              <Input id="item-nombre" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} placeholder="Ej: Barra de Tragos Premium" className="text-base p-3" required disabled={isSaving}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={formData.categoria || ''} onValueChange={(value) => handleFormChange('categoria', value as AnyCategoria)} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_CATEGORIAS_SERVICIO.map(cat => (<SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                    <Label htmlFor="item-subcategoria" className="text-base">Subcategoría (Opcional)</Label>
                    <Input id="item-subcategoria" value={formData.subcategoria || ''} onChange={(e) => handleFormChange('subcategoria', e.target.value)} placeholder="Ej: Mesa de Postres, Candy Bar" className="text-base p-3" disabled={isSaving}/>
                </div>
            </div>

            <Separator/>
            
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Save className="w-4 h-4"/> Configuración Financiera (Costos)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Costo</Label>
                        <Select value={formData.tipoCosto} onValueChange={v => handleFormChange('tipoCosto', v as TipoCosto)}>
                            <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Personal">Personal (Sueldo + Aportes)</SelectItem>
                                <SelectItem value="Proveedor">Proveedor Externo (Servicio)</SelectItem>
                                <SelectItem value="Insumo">Insumo / Mercadería</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proveedor / Responsable</Label>
                        <Select value={formData.proveedor || ''} onValueChange={v => handleFormChange('proveedor', v)}>
                            <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Elegir..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin asignar</SelectItem>
                                {proveedores.map(p => (
                                    <SelectItem key={p.id} value={p.nombreEmpresa || p.nombre || ''}>{p.nombreEmpresa || p.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item-costo" className="text-base">Valor de Costo Unitario (UYU)</Label>
                    <Input id="item-costo" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3 font-bold" disabled={isSaving}/>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Este valor se usará para calcular automáticamente la rentabilidad del evento.</p>
                </div>
            </div>
             
             <Separator/>
             
             <div className="space-y-3">
                 <Label className="text-base font-medium">Cálculo de Precio de Venta *</Label>
                 <Select value={formData.calculationMethod} onValueChange={(v) => handleFormChange('calculationMethod', v)} disabled={isSaving} required>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fijo">Precio Fijo</SelectItem>
                        <SelectItem value="porPersona">Por Persona</SelectItem>
                        <SelectItem value="ratio">Por Ratio de Invitados</SelectItem>
                        <SelectItem value="tramos">Por Tramos de Invitados</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
             
            {formData.calculationMethod === 'fijo' && (
                <div className="space-y-2"><Label htmlFor="precio-venta">Precio de Venta (Fijo)</Label><Input id="precio-venta" type="number" value={formData.precioVenta ?? ''} onChange={(e) => handleFormChange('precioVenta', e.target.value)} disabled={isSaving} min="0" step="any" className="h-12 rounded-xl text-lg font-bold"/></div>
            )}
             {formData.calculationMethod === 'porPersona' && (
                <div className="space-y-2"><Label htmlFor="precio-persona">Precio Por Persona</Label><Input id="precio-persona" type="number" value={formData.precioPorPersona ?? ''} onChange={(e) => handleFormChange('precioPorPersona', e.target.value)} disabled={isSaving} min="0" step="any" className="h-12 rounded-xl text-lg font-bold"/></div>
            )}
            {formData.calculationMethod === 'ratio' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="ratio-base">Precio Base (por unidad)</Label><Input id="ratio-base" type="number" value={formData.precioBase ?? ''} onChange={(e) => handleFormChange('precioBase', e.target.value)} disabled={isSaving} min="0" step="any" className="h-12 rounded-xl text-lg font-bold"/></div>
                    <div className="space-y-2"><Label htmlFor="ratio-invitados">Invitados por Unidad</Label><Input id="ratio-invitados" type="number" value={formData.invitadosPorUnidad ?? ''} onChange={(e) => handleFormChange('invitadosPorUnidad', e.target.value)} disabled={isSaving} min="1" className="h-12 rounded-xl"/></div>
                </div>
            )}
             {formData.calculationMethod === 'tramos' && (
                <div className="space-y-3">
                    {formData.tramosDePrecio?.map((tramo, index) => (
                        <div key={tramo.id} className="flex items-end gap-2 p-2 border rounded-md">
                            <div className="space-y-1"><Label htmlFor={`tramo-desde-${index}`}>Desde</Label><Input id={`tramo-desde-${index}`} type="number" value={tramo.desde} onChange={e => handleTramoChange(index, 'desde', e.target.value)} className="w-20"/></div>
                            <div className="space-y-1"><Label htmlFor={`tramo-hasta-${index}`}>Hasta</Label><Input id={`tramo-hasta-${index}`} type="number" value={tramo.hasta} onChange={e => handleTramoChange(index, 'hasta', e.target.value)} className="w-20"/></div>
                            <div className="space-y-1 flex-grow"><Label htmlFor={`tramo-precio-${index}`}>Precio</Label><Input id={`tramo-precio-${index}`} type="number" value={tramo.precio} onChange={e => handleTramoChange(index, 'precio', e.target.value)}/></div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeTramo(index)} disabled={(formData.tramosDePrecio?.length || 0) <= 1}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTramo}>Añadir Tramo</Button>
                </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto h-12 rounded-xl" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <PlusCircle className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Crear Servicio'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NuevoServicioPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NuevoServicioContent/>
        </Suspense>
    )
}
