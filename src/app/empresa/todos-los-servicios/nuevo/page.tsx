
'use client';

import React, { useState, type FormEvent, Suspense } from 'react';
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
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio, TipoItemEmpresa, TramoDePrecio } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO, ALL_TIPOS_ITEM_EMPRESA } from '@/types/empresa';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const CATERING_SUBCATEGORIES = ['Entrada', 'Plato Principal', 'Menú Niños/Adolescentes', 'Personal'];
const REPOSTERIA_SUBCATEGORIES = ['Torta Principal', 'Mesa de Postres', 'Souvenirs Comestibles'];


function NuevoItemInventarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState('');
  const [tipoItem, setTipoItem] = useState<TipoItemEmpresa>('Activo Fijo');
  const [categoria, setCategoria] = useState<CategoriaServicio | ''>('');
  const [valorUnitarioEstimado, setValorUnitarioEstimado] = useState<string>('');
  const [subcategoria, setSubcategoria] = useState('');
  const [cantidadDisponible, setCantidadDisponible] = useState<string>('');
  const [unidad, setUnidad] = useState<UnidadServicio | ''>('');
  
  const [calculationMethod, setCalculationMethod] = useState<ServicioEmpresa['calculationMethod']>('fijo');
  const [precioVenta, setPrecioVenta] = useState<string>('');
  const [precioBase, setPrecioBase] = useState<string>('');
  const [precioPorPersona, setPrecioPorPersona] = useState<string>('');
  const [invitadosPorUnidad, setInvitadosPorUnidad] = useState<string>('');
  const [tramosDePrecio, setTramosDePrecio] = useState<TramoDePrecio[]>([]);

  
  React.useEffect(() => {
    const typeFromQuery = searchParams.get('type');
    if (typeFromQuery && ALL_TIPOS_ITEM_EMPRESA.includes(typeFromQuery as TipoItemEmpresa)) {
      setTipoItem(typeFromQuery as TipoItemEmpresa);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !tipoItem || !categoria) {
      toast({ title: "Campos Requeridos", description: "Nombre, Tipo y Categoría son obligatorios.", variant: "destructive" });
      return;
    }

    if (tipoItem !== 'Servicio' && !unidad) {
        toast({ title: "Campo Requerido", description: "La unidad es obligatoria para Insumos y Activos.", variant: "destructive" });
        return;
    }
    
    if (tipoItem === 'Servicio' && (calculationMethod === 'fijo' ? !precioVenta : false)) {
        toast({ title: "Precio Requerido", description: "Define un precio para el servicio de tipo fijo.", variant: "destructive" });
        return;
    }
     if (tipoItem === 'Servicio' && (calculationMethod === 'porPersona' ? !precioPorPersona : false)) {
        toast({ title: "Precio Requerido", description: "Define un precio para el servicio de tipo por persona.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const itemData: Omit<ServicioEmpresa, 'id'> = {
      nombre: nombre.trim(),
      tipoItem: tipoItem,
      categoria: categoria as CategoriaServicio,
      subcategoria: subcategoria.trim() || undefined,
      cantidadDisponible: cantidadDisponible ? parseInt(cantidadDisponible, 10) : undefined,
      valorUnitarioEstimado: valorUnitarioEstimado ? parseFloat(valorUnitarioEstimado) : undefined,
      unidad: tipoItem === 'Servicio' ? undefined : unidad as UnidadServicio,
      
      calculationMethod: tipoItem === 'Servicio' ? calculationMethod : undefined,
      precioVenta: (calculationMethod === 'fijo' && precioVenta) ? parseFloat(precioVenta) : undefined,
      precioBase: (calculationMethod === 'ratio' && precioBase) ? parseFloat(precioBase) : undefined,
      precioPorPersona: (calculationMethod === 'porPersona' && precioPorPersona) ? parseFloat(precioPorPersona) : undefined,
      invitadosPorUnidad: (calculationMethod === 'ratio' && invitadosPorUnidad) ? parseInt(invitadosPorUnidad, 10) : undefined,
      tramosDePrecio: (calculationMethod === 'tramos' && tramosDePrecio.length > 0) ? tramosDePrecio.map(t => ({...t, desde: Number(t.desde) || 0, hasta: Number(t.hasta) || 0, precio: Number(t.precio) || 0})) : undefined,
    };

    try {
      const result = await saveServicioEmpresa(itemData);
      if (result.success && result.id) {
        toast({ title: "¡Ítem Guardado!", description: `El ítem "${itemData.nombre}" ha sido añadido al catálogo.` });
        const redirectUrl = tipoItem === 'Servicio' ? '/empresa/servicios' : '/empresa/todos-los-servicios';
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

  const handleCategoryChange = (value: CategoriaServicio | '') => {
    setCategoria(value);
    setSubcategoria(''); 
  };

  const addTramo = () => {
    setTramosDePrecio([...tramosDePrecio, { id: `tramo_${Date.now()}`, desde: 0, hasta: 0, precio: 0 }]);
  };
  const removeTramo = (tramoId: string) => {
    setTramosDePrecio(tramosDePrecio.filter(t => t.id !== tramoId));
  };
  const handleTramoChange = (tramoId: string, field: 'desde' | 'hasta' | 'precio', value: string) => {
    const numericValue = parseInt(value, 10);
    const finalValue = isNaN(numericValue) ? 0 : numericValue;

    setTramosDePrecio(tramosDePrecio.map(t => 
        t.id === tramoId ? { ...t, [field]: finalValue } : t
    ));
  };

  const isCatering = categoria === 'Servicio de catering';
  const isReposteria = categoria === 'Servicio de repostería';
  const isServicio = tipoItem === 'Servicio';
  const backUrl = isServicio ? '/empresa/servicios' : '/empresa/todos-los-servicios';

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
                <Select value={tipoItem} onValueChange={(value) => setTipoItem(value as TipoItemEmpresa)} required disabled={isSaving}>
                  <SelectTrigger id="item-tipo" className="text-base p-3 h-auto"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_TIPOS_ITEM_EMPRESA.map(t => (<SelectItem key={t} value={t} className="text-base">{t}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem *</Label>
              <Input id="item-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Silla Tiffany, Manteles Blancos, Servicio de DJ" className="text-base p-3" required disabled={isSaving}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={categoria} onValueChange={handleCategoryChange} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_CATEGORIAS_SERVICIO.map(cat => (<SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-subcategoria" className="text-base">Subcategoría</Label>
                {isCatering ? (
                    <Select value={subcategoria} onValueChange={(val) => setSubcategoria(val)}>
                        <SelectTrigger id="item-subcategoria"><SelectValue placeholder="General"/></SelectTrigger>
                        <SelectContent>{CATERING_SUBCATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                    </Select>
                ) : isReposteria ? (
                    <Select value={subcategoria} onValueChange={(val) => setSubcategoria(val)}>
                        <SelectTrigger id="item-subcategoria"><SelectValue placeholder="General"/></SelectTrigger>
                        <SelectContent>{REPOSTERIA_SUBCATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                    </Select>
                ) : (
                    <Input id="item-subcategoria" value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} placeholder="Ej: Mobiliario, Decoración de Mesas" className="text-base p-3" disabled={isSaving}/>
                )}
              </div>
            </div>
             
            {isServicio ? (
                <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calculation-method" className="text-base text-primary font-semibold">Método de Cálculo del Precio *</Label>
                    <Select value={calculationMethod} onValueChange={(val) => setCalculationMethod(val as ServicioEmpresa['calculationMethod'])} required disabled={isSaving}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fijo">Precio Fijo</SelectItem>
                        <SelectItem value="porPersona">Precio por Persona</SelectItem>
                        <SelectItem value="ratio">Ratio (ej: 1 cada X invitados)</SelectItem>
                        <SelectItem value="tramos">Por Tramos de Invitados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {calculationMethod === 'fijo' && (
                    <div className="space-y-2"><Label htmlFor="item-precioVenta">Precio de Venta Fijo (UYU) *</Label><Input id="item-precioVenta" type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} required disabled={isSaving} min="0" step="any"/></div>
                  )}
                  {calculationMethod === 'porPersona' && (
                    <div className="space-y-2"><Label htmlFor="item-precioPorPersona">Precio por Persona (UYU) *</Label><Input id="item-precioPorPersona" type="number" value={precioPorPersona} onChange={(e) => setPrecioPorPersona(e.target.value)} required disabled={isSaving} min="0" step="any"/></div>
                  )}
                  {calculationMethod === 'ratio' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label htmlFor="item-precioBaseRatio" className="text-xs">Precio por Unidad</Label><Input id="item-precioBaseRatio" type="number" value={precioBase} onChange={e => setPrecioBase(e.target.value)} required min="0" step="any"/></div>
                      <div className="space-y-1"><Label htmlFor="item-invitadosUnidad" className="text-xs">Invitados por Unidad</Label><Input id="item-invitadosUnidad" type="number" value={invitadosPorUnidad} onChange={e => setInvitadosPorUnidad(e.target.value)} required min="1"/></div>
                    </div>
                  )}
                  {calculationMethod === 'tramos' && (
                    <div className="space-y-3">
                        <Label>Tramos de Precios</Label>
                        {tramosDePrecio.map(tramo => (
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
                  <div className="space-y-2"><Label htmlFor="item-costo-servicio" className="text-base flex items-center gap-2"><DollarSign className="w-5 h-5"/>Costo Estimado para la Empresa (Opcional)</Label><Input id="item-costo-servicio" type="number" value={valorUnitarioEstimado} onChange={(e) => setValorUnitarioEstimado(e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" disabled={isSaving}/></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="item-cantidad">Cantidad Disponible (Stock)</Label><Input id="item-cantidad" type="number" value={cantidadDisponible} onChange={(e) => setCantidadDisponible(e.target.value)} placeholder="Ej: 150" min="0" className="text-base p-3" disabled={isSaving}/></div>
                    <div className="space-y-2"><Label htmlFor="item-valor-unitario">Valor Unitario (Costo UYU)</Label><Input id="item-valor-unitario" type="number" value={valorUnitarioEstimado} onChange={(e) => setValorUnitarioEstimado(e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" disabled={isSaving}/></div>
                     <div className="space-y-2"><Label htmlFor="item-unidad" className="text-base">Unidad *</Label><Select value={unidad} onValueChange={(value) => setUnidad(value as UnidadServicio)} disabled={isSaving} required={!isServicio}><SelectTrigger id="item-unidad" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar unidad..."/></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u} className="text-base">{u}</SelectItem>))}</SelectContent></Select></div>
                </div>
            )}
            
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Ítem en Catálogo'}
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
