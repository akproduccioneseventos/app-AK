
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { getEmpleados } from '@/app/actions/empleados';
import type { Empleado } from '@/types/empleado';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

interface AssignedStaffDetail {
  empleado: Empleado;
  eventSalary: number;
}

export default function AsignarPersonalEventoPage() {
  const { toast } = useToast();
  const [allEmpleados, setAllEmpleados] = useState<Empleado[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<Map<string, AssignedStaffDetail>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEmpleados = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEmpleados();
      setAllEmpleados(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los empleados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  const handleToggleAssign = (empleado: Empleado, isAssigned: boolean) => {
    setAssignedStaff(prev => {
      const newMap = new Map(prev);
      if (isAssigned) {
        newMap.set(empleado.id, { empleado, eventSalary: empleado.sueldoBase });
      } else {
        newMap.delete(empleado.id);
      }
      return newMap;
    });
  };

  const handleEventSalaryChange = (empleadoId: string, newSalary: string) => {
    const salaryNum = parseFloat(newSalary);
    if (isNaN(salaryNum) && newSalary !== '') return; // Allow clearing the input

    setAssignedStaff(prev => {
      const newMap = new Map(prev);
      const currentAssignment = newMap.get(empleadoId);
      if (currentAssignment) {
        newMap.set(empleadoId, { 
          ...currentAssignment, 
          eventSalary: newSalary === '' ? 0 : salaryNum // Store 0 if empty, otherwise the number
        });
      }
      return newMap;
    });
  };
  
  const handleEventSalaryBlur = (empleadoId: string) => {
    setAssignedStaff(prev => {
        const newMap = new Map(prev);
        const currentAssignment = newMap.get(empleadoId);
        if (currentAssignment && (currentAssignment.eventSalary === 0 || isNaN(currentAssignment.eventSalary))) {
            // If salary was cleared or became NaN, revert to base salary
             newMap.set(empleadoId, { ...currentAssignment, eventSalary: currentAssignment.empleado.sueldoBase });
        }
        return newMap;
    });
  };


  const totalAssignedCount = assignedStaff.size;
  const totalEventCost = Array.from(assignedStaff.values()).reduce((sum, { eventSalary }) => sum + (eventSalary || 0), 0);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    // Simulate saving
    console.log("Personal Asignado:", Array.from(assignedStaff.values()));
    console.log("Costo Total de Personal:", totalEventCost);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Asignaciones Guardadas (Simulación)",
      description: `Se asignaron ${totalAssignedCount} empleado(s) con un costo total de ${formatCurrency(totalEventCost)}.`,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Asignar Personal al Evento
          </h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Seleccionar Personal</CardTitle>
          <CardDescription>
            Marca los empleados que participarán en este evento y ajusta su sueldo si es necesario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando lista de personal...</p>
            </div>
          ) : allEmpleados.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No hay personal en tu lista base.</p>
              <Link href="/empleados/nuevo" passHref>
                <Button className="mt-6">
                  Añadir Personal a la Lista General
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">Asignar</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Sueldo Base</TableHead>
                    <TableHead className="text-right w-[200px]">Sueldo Evento (ARS)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEmpleados.map((empleado) => {
                    const isAssigned = assignedStaff.has(empleado.id);
                    const currentAssignment = assignedStaff.get(empleado.id);
                    return (
                      <TableRow key={empleado.id} className={isAssigned ? 'bg-primary/5' : ''}>
                        <TableCell className="text-center">
                          <Checkbox
                            id={`assign-${empleado.id}`}
                            checked={isAssigned}
                            onCheckedChange={(checked) => handleToggleAssign(empleado, Boolean(checked))}
                            aria-label={`Asignar ${empleado.nombre}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium min-w-[150px]">{empleado.nombre}</TableCell>
                        <TableCell className="min-w-[120px]">{empleado.rol}</TableCell>
                        <TableCell className="text-right min-w-[120px]">{formatCurrency(empleado.sueldoBase)}</TableCell>
                        <TableCell className="text-right">
                          {isAssigned ? (
                            <Input
                              type="number"
                              value={currentAssignment?.eventSalary ?? ''}
                              onChange={(e) => handleEventSalaryChange(empleado.id, e.target.value)}
                              onBlur={() => handleEventSalaryBlur(empleado.id)}
                              placeholder="Sueldo evento"
                              className="text-right h-9"
                              min="0"
                              step="any"
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {allEmpleados.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Resumen de Costos de Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Personal Asignado:</span>
              <span className="font-semibold text-lg">{totalAssignedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Costo Total Estimado de Personal para el Evento:</span>
              <span className="font-semibold text-lg text-primary">{formatCurrency(totalEventCost)}</span>
            </div>
             <div className="pt-3">
                <img 
                    src="https://placehold.co/600x200.png" 
                    alt="Equipo trabajando en evento" 
                    className="rounded-md shadow-sm mx-auto"
                    data-ai-hint="team event work"
                />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveChanges} disabled={isSaving || totalAssignedCount === 0} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Asignaciones de Personal'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
