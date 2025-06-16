
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Loader2, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO } from '@/types/empresa';

export default function NuevoItemInventarioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaServicio | ''>('');
  const [valorUnitarioEstimado, setValorUnitarioEstimado] = useState<string>('');
  const [cantidadDisponible, setCantidadDisponible] = useState<string>('');
  const [unidad, setUnidad] = useState<UnidadServicio | ''>('');
  const [precioVenta, setPrecioVenta] = useState<string>(''); // Mantenido si es un servicio que también se vende

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre del ítem/servicio es obligatorio.", variant: "destructive" });
      return;
    }
    if (!categoria) {
      toast({ title: "Categoría Requerida", description: "Debes seleccionar una categoría.", variant: "destructive" });
      return;
    }
    if (!unidad) {
        toast({ title: "Unidad Requerida", description: "Debes seleccionar una unidad de medida/venta.", variant: "destructive"});
        return;
    }

    setIsSaving(true);
    const itemData: Omit<ServicioEmpresa, 'id'> = {
      nombre: nombre.trim(),
      categoria: categoria as CategoriaServicio,
      valorUnitarioEstimado: valorUnitarioEstimado ? parseFloat(valorUnitarioEstimado) : undefined,
      cantidadDisponible: cantidadDisponible ? parseInt(cantidadDisponible, 10) : undefined,
      unidad: unidad as UnidadServicio,
      precioVenta: precioVenta ? parseFloat(precioVenta) : undefined, // Campo opcional para servicios
    };

    try {
      const result = await saveServicioEmpresa(itemData);
      if (result.success && result.id) {
        toast({ title: "¡Ítem Guardado!", description: `El ítem "${itemData.nombre}" ha sido guardado en el inventario.` });
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
            Añadir Nuevo Ítem al Inventario
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
          <CardTitle className="font-headline">Detalles del Ítem/Servicio</CardTitle>
          <CardDescription>Completa la información para registrar un nuevo activo o servicio.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem/Servicio *</Label>
              <Input 
                id="item-nombre" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Silla Tiffany Blanca, Servicio de DJ Base"
                className="text-base p-3"
                required
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select 
                  value={categoria} 
                  onValueChange={(value) => setCategoria(value as CategoriaServicio | '')}
                  required
                  disabled={isSaving}
                >
                  <SelectTrigger id="item-categoria" className="text-base p-3 h-auto">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIAS_SERVICIO.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unidad" className="text-base">Unidad *</Label>
                <Select 
                  value={unidad} 
                  onValueChange={(value) => setUnidad(value as UnidadServicio | '')}
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger id="item-unidad" className="text-base p-3 h-auto">
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_UNIDADES_SERVICIO.map(u => (
                      <SelectItem key={u} value={u} className="text-base">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-cantidad" className="text-base">Cantidad Disponible</Label>
                <Input 
                  id="item-cantidad" 
                  type="number" 
                  value={cantidadDisponible}
                  onChange={(e) => setCantidadDisponible(e.target.value)}
                  placeholder="Ej: 100" 
                  min="0"
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-valor-unitario" className="text-base">Valor Unitario Estimado (UYU)</Label>
                <Input 
                  id="item-valor-unitario" 
                  type="number" 
                  value={valorUnitarioEstimado}
                  onChange={(e) => setValorUnitarioEstimado(e.target.value)}
                  placeholder="0.00" 
                  min="0"
                  step="any"
                  className="text-base p-3"
                  disabled={isSaving}
                />
                 <p className="text-xs text-muted-foreground">Costo de reposición o valor actual por unidad.</p>
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="item-precio-venta" className="text-base">Precio de Venta (Servicios, UYU Opcional)</Label>
                <Input 
                  id="item-precio-venta" 
                  type="number" 
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="0.00" 
                  min="0"
                  step="any"
                  className="text-base p-3"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">Si este ítem es un servicio que se vende, indica su precio.</p>
              </div>

             <img 
                src="https://placehold.co/600x200.png" 
                alt="Ítem de inventario" 
                className="mt-6 rounded-md shadow-md mx-auto"
                data-ai-hint="inventory item box"
            />
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
