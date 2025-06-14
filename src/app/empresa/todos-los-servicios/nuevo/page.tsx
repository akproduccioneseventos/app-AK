
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Loader2, Sparkles, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO } from '@/types/empresa';
import { Separator } from '@/components/ui/separator';

// Definir las subcategorías de catering aquí para el dropdown
const CATERING_SUBCATEGORIES = [
  'Entrada',
  'Mobiliario',
  'Vajilla',
  'Mantelería',
  'Entrada plato principal',
  'Personal'
] as const;

type CateringSubCategory = typeof CATERING_SUBCATEGORIES[number] | '';

export default function NuevoServicioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaServicio | ''>('');
  const [precioVenta, setPrecioVenta] = useState<string>('');
  const [costoReal, setCostoReal] = useState<string>('');
  const [unidad, setUnidad] = useState<UnidadServicio | ''>('');

  // Estados para la lógica condicional de catering
  const [cateringSubCategory, setCateringSubCategory] = useState<CateringSubCategory>('');
  const [cateringPersonalDetail, setCateringPersonalDetail] = useState('');

  const handleCategoriaChange = (value: CategoriaServicio | '') => {
    setCategoria(value);
    if (value !== 'Servicio de catering') {
      setCateringSubCategory(''); // Reset subcategory if main category changes
      setCateringPersonalDetail('');
    }
  };
  
  const handleUnidadChange = (value: UnidadServicio | '') => {
    setUnidad(value);
    // Si la unidad cambia y ya no es "Por evento", limpiar el detalle de personal
    if (categoria === 'Servicio de catering' && cateringSubCategory === 'Personal' && value !== 'Por evento') {
      setCateringPersonalDetail('');
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre del servicio es obligatorio.", variant: "destructive" });
      return;
    }
    if (!categoria) {
      toast({ title: "Categoría Requerida", description: "Debes seleccionar una categoría para el servicio.", variant: "destructive" });
      return;
    }
    if (!unidad) {
        toast({ title: "Unidad Requerida", description: "Debes seleccionar una unidad de precio.", variant: "destructive"});
        return;
    }
    // Validación adicional si es Catering > Personal > Por Evento y el detalle está vacío
    if (categoria === 'Servicio de catering' && cateringSubCategory === 'Personal' && unidad === 'Por evento' && !cateringPersonalDetail.trim()) {
       toast({ title: "Detalle de Personal Requerido", description: "Por favor, ingresa el detalle del personal para este servicio de catering.", variant: "destructive"});
       return;
    }


    setIsSaving(true);
    // Por ahora, cateringSubCategory y cateringPersonalDetail no se guardan en la base de datos.
    // Se podrían añadir al objeto `ServicioEmpresa` si se decide persistirlos.
    // Si se guardan, el nombre del servicio podría ser más genérico y estos campos darían el detalle.
    // Ejemplo: Nombre="Servicio de Mozos", Detalle="5 mozos".
    const servicioData: Omit<ServicioEmpresa, 'id'> = {
      nombre: nombre.trim(),
      categoria: categoria as CategoriaServicio, 
      precioVenta: precioVenta ? parseFloat(precioVenta) : undefined,
      costoReal: costoReal ? parseFloat(costoReal) : undefined,
      unidad: unidad as UnidadServicio,
    };

    try {
      const result = await saveServicioEmpresa(servicioData);
      if (result.success && result.id) {
        toast({ title: "¡Servicio Guardado!", description: `El servicio "${servicioData.nombre}" ha sido guardado.` });
        router.push('/empresa/todos-los-servicios');
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
          <PlusCircle className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Añadir Nuevo Servicio
          </h1>
        </div>
        <Link href="/empresa/todos-los-servicios" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Todos los Servicios
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalles del Servicio</CardTitle>
          <CardDescription>Completa la información para registrar un nuevo servicio ofrecido por tu empresa.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="servicio-nombre" className="text-base">Nombre del Servicio *</Label>
              <Input 
                id="servicio-nombre" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Sesión Fotográfica Exterior Completa"
                className="text-base p-3"
                required
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servicio-categoria" className="text-base">Categoría *</Label>
              <Select 
                value={categoria} 
                onValueChange={(value) => handleCategoriaChange(value as CategoriaServicio | '')}
                required
                disabled={isSaving}
              >
                <SelectTrigger id="servicio-categoria" className="text-base p-3 h-auto">
                  <SelectValue placeholder="Seleccionar categoría del servicio" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIAS_SERVICIO.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Submenú para Servicio de catering */}
            {categoria === 'Servicio de catering' && (
              <div className="space-y-3 p-4 border rounded-md bg-muted/50">
                 <Label htmlFor="catering-subcategoria" className="text-base font-medium">Subcategoría de Catering</Label>
                 <Select
                    value={cateringSubCategory}
                    onValueChange={(value) => setCateringSubCategory(value as CateringSubCategory)}
                    disabled={isSaving}
                 >
                    <SelectTrigger id="catering-subcategoria" className="text-base p-3 h-auto">
                       <SelectValue placeholder="Seleccionar subcategoría de catering" />
                    </SelectTrigger>
                    <SelectContent>
                       {CATERING_SUBCATEGORIES.map(subCat => (
                         <SelectItem key={subCat} value={subCat} className="text-base">{subCat}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="servicio-unidad" className="text-base">Unidad de Precio *</Label>
                <Select 
                  value={unidad} 
                  onValueChange={(value) => handleUnidadChange(value as UnidadServicio | '')}
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger id="servicio-unidad" className="text-base p-3 h-auto">
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

            {/* Campo condicional para detalle de personal en catering */}
            {categoria === 'Servicio de catering' && cateringSubCategory === 'Personal' && unidad === 'Por evento' && (
              <div className="space-y-2 p-4 border rounded-md bg-muted/50">
                <Label htmlFor="catering-personal-detail" className="text-base font-medium">
                  <Users className="inline-block w-5 h-5 mr-2 text-primary/80" />
                  Detalle del Personal (ej: 5 mozos) *
                </Label>
                <Input
                  id="catering-personal-detail"
                  value={cateringPersonalDetail}
                  onChange={(e) => setCateringPersonalDetail(e.target.value)}
                  placeholder="Indicar cantidad y tipo de personal"
                  className="text-base p-3"
                  disabled={isSaving}
                  required={true} // Hacerlo requerido si se muestra
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="servicio-precio-venta" className="text-base">Precio de Venta</Label>
                <Input 
                  id="servicio-precio-venta" 
                  type="number" 
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="0.00" 
                  min="0"
                  step="any"
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servicio-costo-real" className="text-base">Costo Real del Servicio</Label>
                <Input 
                  id="servicio-costo-real" 
                  type="number" 
                  value={costoReal}
                  onChange={(e) => setCostoReal(e.target.value)}
                  placeholder="0.00" 
                  min="0"
                  step="any"
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
            </div>
             <img 
                src="https://placehold.co/600x200.png" 
                alt="Formulario de servicio" 
                className="mt-6 rounded-md shadow-md mx-auto"
                data-ai-hint="service form abstract"
            />
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Servicio'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
