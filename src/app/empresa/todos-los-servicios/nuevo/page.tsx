
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa } from '@/types/empresa';

const categoriasServicio: ServicioEmpresa['categoria'][] = [
  'Catering', 'Bebidas', 'Decoración', 'Audiovisual', 'Música', 'Entretenimiento', 
  'Estructuras', 'Personal', 'Logística', 'Fotografía', 'Filmación', 'Repostería', 
  'Iluminación', 'Equipamiento', 'Estilismo', 'Impresión', 'Merchandising', 'Otros'
];
const unidadesServicio: ServicioEmpresa['unidad'][] = [
  'Por persona', 'Por evento', 'Por hora', 'Global', 'Por proyecto', 'Por día/evento', 'Por viaje', 'Por unidad (variable)', 'Por lote'
];

export default function NuevoServicioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<ServicioEmpresa['categoria'] | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [precioEstimado, setPrecioEstimado] = useState<string>('');
  const [unidad, setUnidad] = useState<ServicioEmpresa['unidad'] | ''>('');

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

    setIsSaving(true);
    const servicioData: Omit<ServicioEmpresa, 'id'> = {
      nombre: nombre.trim(),
      categoria: categoria as ServicioEmpresa['categoria'], // Cast as it's validated
      descripcion: descripcion.trim() || undefined,
      precioEstimado: precioEstimado ? parseFloat(precioEstimado) : undefined,
      unidad: unidad || undefined,
    };

    try {
      const result = await saveServicioEmpresa(servicioData);
      if (result.success && result.id) {
        toast({ title: "¡Servicio Guardado!", description: `El servicio "${servicioData.nombre}" ha sido guardado.` });
        router.push('/empresa/todos-los-servicios');
      } else {
        throw new Error(result.error || "Error desconocido al guardar el servicio.");
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
                placeholder="Ej: Catering Completo para Bodas, Sesión Fotográfica Exterior"
                className="text-base p-3"
                required
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servicio-categoria" className="text-base">Categoría *</Label>
              <Select 
                value={categoria} 
                onValueChange={(value) => setCategoria(value as ServicioEmpresa['categoria'] | '')}
                required
                disabled={isSaving}
              >
                <SelectTrigger id="servicio-categoria" className="text-base p-3 h-auto">
                  <SelectValue placeholder="Seleccionar categoría del servicio" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasServicio.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="servicio-descripcion" className="text-base">Descripción (Opcional)</Label>
              <Textarea 
                id="servicio-descripcion" 
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe brevemente qué incluye el servicio, características especiales, etc." 
                rows={3} 
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="servicio-precio" className="text-base">Precio Estimado (Opcional)</Label>
                <Input 
                  id="servicio-precio" 
                  type="number" 
                  value={precioEstimado}
                  onChange={(e) => setPrecioEstimado(e.target.value)}
                  placeholder="0.00" 
                  min="0"
                  step="any"
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servicio-unidad" className="text-base">Unidad de Precio (Opcional)</Label>
                <Select 
                  value={unidad} 
                  onValueChange={(value) => setUnidad(value as ServicioEmpresa['unidad'] | '')}
                  disabled={isSaving}
                >
                  <SelectTrigger id="servicio-unidad" className="text-base p-3 h-auto">
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesServicio.map(u => (
                      <SelectItem key={u} value={u} className="text-base">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <img 
                src="https://placehold.co/600x200.png" 
                alt="Formulario de servicio" 
                className="mt-6 rounded-md shadow-md mx-auto"
                data-ai-hint="service form illustration"
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
