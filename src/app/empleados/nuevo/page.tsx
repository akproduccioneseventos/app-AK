
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveEmpleado } from '@/app/actions/empleados';
import type { NuevoEmpleadoFormData } from '@/types/empleado';

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [sueldoBase, setSueldoBase] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombre.trim() || !rol.trim() || !sueldoBase) {
      toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }

    const sueldoNumero = parseFloat(sueldoBase);
    if (isNaN(sueldoNumero) || sueldoNumero < 0) {
      toast({ title: "Sueldo Inválido", description: "El sueldo base debe ser un número positivo.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const empleadoData: NuevoEmpleadoFormData = {
      nombre: nombre.trim(),
      rol: rol.trim(),
      sueldoBase: sueldoNumero,
    };

    try {
      const result = await saveEmpleado(empleadoData);
      if (result.success && result.id) {
        toast({ title: "¡Empleado Guardado!", description: `El empleado "${empleadoData.nombre}" ha sido guardado.` });
        router.push('/empleados');
      } else {
        throw new Error(result.error || "Error desconocido al guardar el empleado.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Añadir Nuevo Empleado
          </h1>
        </div>
        <Link href="/empleados" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Empleados
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Información del Empleado</CardTitle>
          <CardDescription>Completa los datos para registrar un nuevo miembro del personal.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="empleado-nombre" className="text-base">Nombre Completo</Label>
              <Input 
                id="empleado-nombre" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Carlos Rodríguez" 
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-rol" className="text-base">Rol / Cargo</Label>
              <Input 
                id="empleado-rol" 
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                placeholder="Ej: Mozo, DJ, Cocinero, Fotógrafo" 
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-sueldo" className="text-base">Sueldo Base (ARS)</Label>
              <Input 
                id="empleado-sueldo" 
                type="number"
                value={sueldoBase}
                onChange={(e) => setSueldoBase(e.target.value)}
                placeholder="Ej: 2500" 
                min="0"
                step="any"
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
             <div className="pt-4">
              <Image 
                src="https://placehold.co/600x200.png" 
                alt="Employee management" 
                width={600}
                height={200}
                className="rounded-md shadow-sm mx-auto"
                data-ai-hint="employee management team"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Empleado'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
