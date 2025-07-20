
'use client';

import { useState, type FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Loader2, PackagePlus, ListFilter, StickyNote, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio, TipoItemEmpresa } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO, ALL_TIPOS_ITEM_EMPRESA } from '@/types/empresa';
import { Textarea } from '@/components/ui/textarea';

function NuevoItemInventarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState('');
  const [tipoItem, setTipoItem] = useState<TipoItemEmpresa | ''>('Insumo/Ingrediente');
  const [categoria, setCategoria] = useState<CategoriaServicio | ''>('');
  const [valorUnitarioEstimado, setValorUnitarioEstimado] = useState<string>('');
  const [cantidadDisponible, setCantidadDisponible] = useState<string>('');
  const [unidad, setUnidad] = useState<UnidadServicio | ''>('');
  const [notas, setNotas] = useState('');
  const [precioVenta, setPrecioVenta] = useState<string>('');
  const [subcategoria, setSubcategoria] = useState('');

  useEffect(() => {
    const tipoQueryParam = searchParams.get('tipo');
    if (tipoQueryParam && ALL_TIPOS_ITEM_EMPRESA.includes(tipoQueryParam as TipoItemEmpresa)) {
      setTipoItem(tipoQueryParam as TipoItemEmpresa);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !tipoItem || !categoria || !unidad) {
      toast({ title: "Campos Requeridos", description: "Nombre, Tipo, Categoría y Unidad son obligatorios.", variant: "destructive" });
      return;
    }
    if (tipoItem === 'Servicio' && (!precioVenta || parseFloat(precioVenta) <= 0)) {
        toast({ title: "Precio Requerido", description: "Los servicios deben tener un precio de venta mayor a cero.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const itemData: Omit<ServicioEmpresa, 'id'> = {
      nombre: nombre.trim(),
      tipoItem: tipoItem as TipoItemEmpresa,
      categoria: categoria as CategoriaServicio,
      subcategoria: subcategoria.trim() || undefined,
      valorUnitarioEstimado: valorUnitarioEstimado ? parseFloat(valorUnitarioEstimado) : undefined,
      cantidadDisponible: cantidadDisponible ? parseInt(cantidadDisponible, 10) : undefined,
      unidad: unidad as UnidadServicio,
      notas: notas.trim() || undefined,
      precioVenta: precioVenta ? parseFloat(precioVenta) : undefined,
    };

    try {
      const result = await saveServicioEmpresa(itemData);
      if (result.success && result.id) {
        toast({ title: "¡Ítem Guardado!", description: `El ítem "${itemData.nombre}" ha sido guardado.` });
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackagePlus className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Añadir Ítem al Inventario General
          </h1>
        </div>
        <Link href="/empresa/todos-los-servicios" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inventario
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalles del Ítem</CardTitle>
          <CardDescription>Completa la información para registrar un nuevo activo, insumo o servicio en el inventario.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-tipo" className="text-base">Tipo de Ítem *</Label>
                <Select value={tipoItem} onValueChange={(value) => setTipoItem(value as TipoItemEmpresa | '')} required disabled={isSaving}>
                  <SelectTrigger id="item-tipo" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                  <SelectContent>{ALL_TIPOS_ITEM_EMPRESA.map(t => (<SelectItem key={t} value={t} className="text-base">{t}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem *</Label>
                <Input id="item-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Silla Tiffany, Servicio DJ" className="text-base p-3" required disabled={isSaving}/>
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaServicio | '')} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_CATEGORIAS_SERVICIO.map(cat => (<SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-subcategoria" className="text-base">Subcategoría (Opcional)</Label>
                <Input id="item-subcategoria" value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} placeholder="Ej: Plato Principal, Mobiliario" className="text-base p-3" disabled={isSaving}/>
              </div>
            </div>
            {tipoItem === 'Servicio' && (
                <div className="space-y-2 p-3 border rounded-md border-primary/30 bg-primary/5">
                    <Label htmlFor="item-precio-venta" className="text-base flex items-center gap-2 text-primary">
                        <DollarSign className="w-5 h-5"/>Precio de Venta (UYU) *
                    </Label>
                    <Input id="item-precio-venta" type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" required disabled={isSaving}/>
                    <p className="text-xs text-muted-foreground">Este es el precio que se usará al añadir el servicio a un presupuesto.</p>
                </div>
            )}
            
            {(tipoItem === 'Activo Fijo' || tipoItem === 'Insumo/Ingrediente') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="item-cantidad" className="text-base">Cantidad Disponible (Stock)</Label>
                      <Input id="item-cantidad" type="number" value={cantidadDisponible} onChange={(e) => setCantidadDisponible(e.target.value)} placeholder="Ej: 100" min="0" className="text-base p-3" disabled={isSaving}/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="item-valor-unitario" className="text-base">Valor Unitario (Costo UYU)</Label>
                      <Input id="item-valor-unitario" type="number" value={valorUnitarioEstimado} onChange={(e) => setValorUnitarioEstimado(e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" disabled={isSaving}/>
                      <p className="text-xs text-muted-foreground">Costo de reposición o valor actual por unidad.</p>
                  </div>
              </div>
            )}

             <div className="space-y-2">
                <Label htmlFor="item-unidad" className="text-base">Unidad *</Label>
                <Select value={unidad} onValueChange={(value) => setUnidad(value as UnidadServicio | '')} disabled={isSaving} required>
                  <SelectTrigger id="item-unidad" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar unidad..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u} className="text-base">{u}</SelectItem>))}</SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="item-notas" className="text-base">Observaciones (Opcional)</Label>
              <Textarea id="item-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Anotaciones sobre el estado, ubicación, proveedor sugerido, etc." rows={3} disabled={isSaving}/>
            </div>
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

