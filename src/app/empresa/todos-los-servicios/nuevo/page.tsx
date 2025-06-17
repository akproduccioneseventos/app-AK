
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Loader2, PackagePlus, ListFilter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio, TipoItemEmpresa } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO, ALL_TIPOS_ITEM_EMPRESA } from '@/types/empresa';
import { Textarea } from '@/components/ui/textarea';

export default function NuevoItemInventarioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState('');
  const [tipoItem, setTipoItem] = useState<TipoItemEmpresa | ''>('');
  const [categoria, setCategoria] = useState<CategoriaServicio | ''>('');
  const [valorUnitarioEstimado, setValorUnitarioEstimado] = useState<string>('');
  const [cantidadDisponible, setCantidadDisponible] = useState<string>('');
  const [unidad, setUnidad] = useState<UnidadServicio | ''>('');
  const [precioVenta, setPrecioVenta] = useState<string>('');
  const [contactoPrincipal, setContactoPrincipal] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [descripcionServicio, setDescripcionServicio] = useState('');
  const [productosOfrecidos, setProductosOfrecidos] = useState('');


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre del ítem/servicio es obligatorio.", variant: "destructive" });
      return;
    }
    if (!tipoItem) {
        toast({ title: "Tipo de Ítem Requerido", description: "Debes seleccionar un tipo de ítem.", variant: "destructive"});
        return;
    }
    if (!categoria) {
      toast({ title: "Categoría Requerida", description: "Debes seleccionar una categoría.", variant: "destructive" });
      return;
    }
    if (!unidad) {
        toast({ title: "Unidad Requerida", description: "Debes seleccionar una unidad.", variant: "destructive"});
        return;
    }

    setIsSaving(true);
    const itemData: Omit<ServicioEmpresa, 'id'> = {
      nombre: nombre.trim(),
      tipoItem: tipoItem as TipoItemEmpresa,
      categoria: categoria as CategoriaServicio,
      valorUnitarioEstimado: valorUnitarioEstimado ? parseFloat(valorUnitarioEstimado) : undefined,
      cantidadDisponible: cantidadDisponible ? parseInt(cantidadDisponible, 10) : undefined,
      unidad: unidad as UnidadServicio,
      precioVenta: precioVenta ? parseFloat(precioVenta) : undefined,
      contactoPrincipal: contactoPrincipal.trim() || undefined,
      telefonoContacto: telefonoContacto.trim() || undefined,
      emailContacto: emailContacto.trim() || undefined,
      descripcionServicio: descripcionServicio.trim() || undefined,
      productosOfrecidos: productosOfrecidos.trim() || undefined,
    };

    try {
      const result = await saveServicioEmpresa(itemData);
      if (result.success && result.id) {
        toast({ title: "¡Ítem Guardado!", description: `El ítem "${itemData.nombre}" ha sido guardado.` });
        router.push('/empresa/todos-los-servicios');
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
            Añadir Ítem al Catálogo Maestro
          </h1>
        </div>
        <Link href="/empresa/todos-los-servicios" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Catálogo
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalles del Ítem/Servicio</CardTitle>
          <CardDescription>Completa la información para registrar un nuevo activo, insumo o servicio en el catálogo general.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem/Servicio *</Label>
              <Input id="item-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Silla Tiffany, Harina 0000, Servicio de DJ" className="text-base p-3" required disabled={isSaving}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-tipo" className="text-base">Tipo de Ítem *</Label>
                <Select value={tipoItem} onValueChange={(value) => setTipoItem(value as TipoItemEmpresa | '')} required disabled={isSaving}>
                  <SelectTrigger id="item-tipo" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                  <SelectContent>{ALL_TIPOS_ITEM_EMPRESA.map(t => (<SelectItem key={t} value={t} className="text-base">{t}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaServicio | '')} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_CATEGORIAS_SERVICIO.map(cat => (<SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-unidad" className="text-base">Unidad *</Label>
                <Select value={unidad} onValueChange={(value) => setUnidad(value as UnidadServicio | '')} disabled={isSaving} required>
                  <SelectTrigger id="item-unidad" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar unidad..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u} className="text-base">{u}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-precio-venta" className="text-base">Precio de Venta (UYU)</Label>
                <Input id="item-precio-venta" type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} placeholder="0.00 (si aplica)" min="0" step="any" className="text-base p-3" disabled={isSaving}/>
                 <p className="text-xs text-muted-foreground">Precio al que tu empresa vende este ítem o servicio.</p>
              </div>
            </div>
            
            {tipoItem === 'Insumo/Ingrediente' || tipoItem === 'Activo Fijo' ? (
              <>
                <h3 className="text-md font-medium pt-4 border-t text-primary">Detalles de Inventario/Costo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="item-cantidad" className="text-base">Cantidad Disponible (Stock)</Label>
                        <Input id="item-cantidad" type="number" value={cantidadDisponible} onChange={(e) => setCantidadDisponible(e.target.value)} placeholder="Ej: 100" min="0" className="text-base p-3" disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="item-valor-unitario" className="text-base">Valor Unitario Estimado (Costo UYU)</Label>
                        <Input id="item-valor-unitario" type="number" value={valorUnitarioEstimado} onChange={(e) => setValorUnitarioEstimado(e.target.value)} placeholder="0.00" min="0" step="any" className="text-base p-3" disabled={isSaving}/>
                        <p className="text-xs text-muted-foreground">Costo de reposición o valor actual por unidad.</p>
                    </div>
                </div>
              </>
            ) : null}

            {tipoItem === 'Prestador de Servicio' ? (
                <>
                    <h3 className="text-md font-medium pt-4 border-t text-primary">Detalles del Prestador</h3>
                    <div className="space-y-2"><Label htmlFor="item-contacto-ppal">Contacto Principal</Label><Input id="item-contacto-ppal" value={contactoPrincipal} onChange={(e) => setContactoPrincipal(e.target.value)} placeholder="Nombre de la persona de contacto" disabled={isSaving}/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label htmlFor="item-tel-contacto">Teléfono Contacto</Label><Input id="item-tel-contacto" type="tel" value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)} placeholder="09..." disabled={isSaving}/></div>
                        <div className="space-y-2"><Label htmlFor="item-email-contacto">Email Contacto</Label><Input id="item-email-contacto" type="email" value={emailContacto} onChange={(e) => setEmailContacto(e.target.value)} placeholder="correo@proveedor.com" disabled={isSaving}/></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="item-desc-servicio">Descripción del Servicio Ofrecido</Label><Textarea id="item-desc-servicio" value={descripcionServicio} onChange={(e) => setDescripcionServicio(e.target.value)} placeholder="Breve descripción del servicio que presta este proveedor" rows={2} disabled={isSaving}/></div>
                </>
            ) : null}
             <div className="space-y-2">
                <Label htmlFor="item-productos-ofrecidos">Productos/Servicios Detallados (Opcional)</Label>
                <Textarea id="item-productos-ofrecidos" value={productosOfrecidos} onChange={(e) => setProductosOfrecidos(e.target.value)} placeholder="Listado o descripción más detallada de lo que ofrece." rows={2} disabled={isSaving}/>
            </div>

          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Ítem/Servicio'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
