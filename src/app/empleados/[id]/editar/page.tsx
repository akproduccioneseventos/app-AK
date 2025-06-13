
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, Edit3, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmpleadoById, saveEmpleado, deleteEmpleado as deleteEmpleadoAction } from '@/app/actions/empleados';
import type { Empleado } from '@/types/empleado';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditarEmpleadoPage({ params: paramsProp }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsProp);
  const router = useRouter();
  const { toast } = useToast();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [sueldoBase, setSueldoBase] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadEmpleado() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const loadedEmpleado = await getEmpleadoById(params.id);
        if (loadedEmpleado) {
          setEmpleado(loadedEmpleado);
          setNombre(loadedEmpleado.nombre);
          setRol(loadedEmpleado.rol);
          setSueldoBase(loadedEmpleado.sueldoBase.toString());
        } else {
          setNotFound(true);
          toast({ title: 'Error', description: `No se encontró el empleado con ID ${params.id}.`, variant: 'destructive' });
        }
      } catch (error) {
        console.error("Error al cargar el empleado:", error);
        setNotFound(true);
        toast({ title: 'Error al Cargar Empleado', description: 'No se pudo obtener el empleado.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      loadEmpleado();
    }
  }, [params.id, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!empleado || !nombre.trim() || !rol.trim() || !sueldoBase) {
      toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }

    const sueldoNumero = parseFloat(sueldoBase);
    if (isNaN(sueldoNumero) || sueldoNumero < 0) {
      toast({ title: "Sueldo Inválido", description: "El sueldo base debe ser un número positivo.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const empleadoData: Empleado = {
      ...empleado,
      nombre: nombre.trim(),
      rol: rol.trim(),
      sueldoBase: sueldoNumero,
    };

    try {
      const result = await saveEmpleado(empleadoData);
      if (result.success && result.empleado) {
        toast({ title: "¡Empleado Actualizado!", description: `El empleado "${result.empleado.nombre}" ha sido actualizado.` });
        setEmpleado(result.empleado); // Actualizar estado local con los datos guardados
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el empleado.");
      }
    } catch (error: any) {
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!empleado) return;
    setIsDeleting(true);
    try {
      const result = await deleteEmpleadoAction(empleado.id);
      if (result.success) {
        toast({ title: '¡Empleado Eliminado!', description: `El empleado "${empleado.nombre}" ha sido eliminado.` });
        router.push('/empleados');
      } else {
        throw new Error(result.error || 'Error desconocido al eliminar el empleado.');
      }
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="ml-4 text-xl">Cargando datos del empleado...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Empleado no Encontrado</h1>
        <p className="text-muted-foreground mb-6">
          El empleado con ID <span className="font-mono bg-muted px-1 rounded">{params.id}</span> no pudo ser encontrado.
        </p>
        <Link href="/empleados" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Empleados
          </Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando: <span className="text-primary">{empleado?.nombre || params.id}</span>
          </h1>
        </div>
        <Link href="/empleados" passHref>
          <Button variant="outline" disabled={isSaving || isDeleting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información del Empleado</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="empleado-nombre" className="text-base">Nombre Completo</Label>
              <Input 
                id="empleado-nombre" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="text-base p-3"
                disabled={isSaving || isDeleting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-rol" className="text-base">Rol / Cargo</Label>
              <Input 
                id="empleado-rol" 
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="text-base p-3"
                disabled={isSaving || isDeleting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-sueldo" className="text-base">Sueldo Base (ARS)</Label>
              <Input 
                id="empleado-sueldo" 
                type="number"
                value={sueldoBase}
                onChange={(e) => setSueldoBase(e.target.value)}
                min="0"
                step="any"
                className="text-base p-3"
                disabled={isSaving || isDeleting}
              />
            </div>
            <div className="pt-4">
              <Image 
                src="https://placehold.co/600x200.png" 
                alt="Employee data update" 
                width={600}
                height={200}
                className="rounded-md shadow-sm mx-auto"
                data-ai-hint="employee data team"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isDeleting}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" className="w-full sm:w-auto" disabled={isSaving || isDeleting}>
                  {isDeleting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                  {isDeleting ? 'Eliminando...' : 'Eliminar Empleado'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El empleado "{empleado?.nombre}" será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

