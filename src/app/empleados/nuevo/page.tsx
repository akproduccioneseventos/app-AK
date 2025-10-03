
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveEmpleado } from '@/app/actions/empleados';
import type { NuevoEmpleadoFormData } from '@/types/empleado';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { getRoles } from '@/app/actions/roles';
import type { Rol } from '@/types/rol';
import { MultiSelect } from '@/components/ui/multi-select';

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | undefined>(undefined);
  const [rolIds, setRolIds] = useState<string[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      setIsLoadingRoles(true);
      try {
        const fetchedRoles = await getRoles();
        setRolesDisponibles(fetchedRoles);
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar los roles disponibles.", variant: "destructive" });
      } finally {
        setIsLoadingRoles(false);
      }
    }
    loadRoles();
  }, [toast]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del empleado.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const empleadoData: NuevoEmpleadoFormData = {
      nombre: nombre.trim(),
      cedula: cedula.trim() || undefined,
      fechaNacimiento: fechaNacimiento ? fechaNacimiento.toISOString() : undefined,
      rolIds: rolIds,
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
  
  const roleOptions = rolesDisponibles.map(r => ({ value: r.id, label: r.nombre }));

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
          <CardDescription>Completa los datos personales y asigna uno o más roles.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="empleado-nombre" className="text-base">Nombre Completo *</Label>
              <Input 
                id="empleado-nombre" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Carlos Rodríguez" 
                className="text-base p-3"
                disabled={isSaving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-roles" className="text-base">Roles Asignados</Label>
              <MultiSelect
                options={roleOptions}
                selected={rolIds}
                onValueChange={setRolIds}
                placeholder={isLoadingRoles ? "Cargando roles..." : (rolesDisponibles.length === 0 ? "No hay roles definidos" : "Seleccionar roles...")}
                className="w-full"
              />
              {rolesDisponibles.length === 0 && !isLoadingRoles && (
                  <p className="text-xs text-muted-foreground">No hay roles creados. <Link href="/empleados/roles" className="underline text-primary">Configurar Roles</Link>.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-cedula" className="text-base">Cédula de Identidad</Label>
              <Input 
                id="empleado-cedula" 
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ej: 1.234.567-8 (sin puntos ni guion)" 
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empleado-fecha-nacimiento" className="text-base">Fecha de Nacimiento</Label>
              <DatePickerDemo 
                selectedDate={fechaNacimiento}
                onDateChange={setFechaNacimiento}
                className={isSaving ? "disabled:opacity-70" : ""}
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
