'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Edit3, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmpleadoById, saveEmpleado, deleteEmpleado as deleteEmpleadoAction } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { DatePickerDemo } from '@/components/date-picker-demo';
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
import { MultiSelect } from '@/components/ui/multi-select';

export default function EditarEmpleadoPage({ params: paramsProp }: { params: { id: string } }) {
  const params = React.use(paramsProp);
  const router = useRouter();
  const { toast } = useToast();
  
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);

  // Form state
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | undefined>(undefined);
  const [rolIds, setRolIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const [loadedEmpleado, fetchedRoles] = await Promise.all([
        getEmpleadoById(params.id),
        getRoles()
      ]);

      setRolesDisponibles(fetchedRoles);

      if (loadedEmpleado) {
        setEmpleado(loadedEmpleado);
        setNombre(loadedEmpleado.nombre);
        setCedula(loadedEmpleado.cedula);
        setFechaNacimiento(loadedEmpleado.fechaNacimiento ? new Date(loadedEmpleado.fechaNacimiento) : undefined);
        setRolIds(loadedEmpleado.rolIds || []);
      } else {
        setNotFound(true);
        toast({ title: 'Error', description: `No se encontró el empleado con ID ${params.id}.`, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error al cargar datos del empleado o roles:", error);
      setNotFound(true); // Consider it not found on error
      toast({ title: 'Error al Cargar Datos', description: 'No se pudo obtener la información del empleado o los roles.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id, loadData]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!empleado || !nombre.trim()) {
      toast({ title: "Campos incompletos", description: "Por favor, completa el Nombre.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const empleadoData: Empleado = {
      ...empleado,
      nombre: nombre.trim(),
      cedula: cedula.trim(),
      fechaNacimiento: fechaNacimiento ? fechaNacimiento.toISOString() : '',
      rolIds: rolIds,
    };

    try {
      const result = await saveEmpleado(empleadoData);
      if (result.success && result.empleado) {
        toast({ title: "¡Empleado Actualizado!", description: `El empleado "${result.empleado.nombre}" ha sido actualizado.` });
        setEmpleado(result.empleado);
        setRolIds(result.empleado.rolIds || []);
        router.push('/empleados');
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
  
  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Empleado no encontrado. <Link href="/empleados" className="underline">Volver a empleados</Link>.</div>;

  const roleOptions = rolesDisponibles.map(r => ({ value: r.id, label: r.nombre }));

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
          <Button variant="outline" disabled={isSaving || isDeleting}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información del Empleado</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="empleado-nombre" className="text-base">Nombre Completo *</Label>
              <Input id="empleado-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="text-base p-3" disabled={isSaving || isDeleting} required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-roles" className="text-base">Roles Asignados</Label>
              <MultiSelect
                options={roleOptions}
                selected={rolIds}
                onValueChange={setRolIds}
                placeholder={isLoading ? "Cargando roles..." : (rolesDisponibles.length === 0 ? "No hay roles definidos" : "Seleccionar roles...")}
                className="w-full"
              />
              {rolesDisponibles.length === 0 && !isLoading && (
                  <p className="text-xs text-muted-foreground">No hay roles creados. <Link href="/empleados/roles" className="underline text-primary">Configurar Roles</Link>.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-cedula" className="text-base">Cédula de Identidad</Label>
              <Input id="empleado-cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} className="text-base p-3" disabled={isSaving || isDeleting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-fechaNacimiento" className="text-base">Fecha de Nacimiento</Label>
              <DatePickerDemo selectedDate={fechaNacimiento} onDateChange={setFechaNacimiento} className={isSaving || isDeleting ? "disabled:opacity-70" : ""} />
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
