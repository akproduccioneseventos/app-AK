
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save, Users, UserCheck, AlertTriangle, Info } from 'lucide-react';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles'; // Para obtener info de roles
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol'; // Tipo Rol
import { useToast } from '@/hooks/use-toast';
import type { PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import { getFiestaActual, updatePersonalFiestaActual } from '@/app/actions/fiesta-actual';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

interface AssignedStaffUIDetail {
  empleado: Empleado;
  rol?: Rol; // Rol del empleado si tiene uno asignado
  eventSalary: number; // Sueldo específico para este evento
}

export default function AsignarPersonalEventoPage() {
  const { toast } = useToast();
  const [allEmpleados, setAllEmpleados] = useState<Empleado[]>([]);
  const [allRoles, setAllRoles] = useState<Rol[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<Map<string, AssignedStaffUIDetail>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empleadosData, rolesData, fiestaActualData] = await Promise.all([
        getEmpleados(),
        getRoles(),
        getFiestaActual()
      ]);
      
      setAllEmpleados(empleadosData);
      setAllRoles(rolesData);

      const initialAssignedMap = new Map<string, AssignedStaffUIDetail>();
      if (fiestaActualData.personalAsignado && empleadosData.length > 0) {
        fiestaActualData.personalAsignado.forEach(assigned => {
          const empleadoDetail = empleadosData.find(e => e.id === assigned.empleadoId);
          if (empleadoDetail) {
            const rolDetail = empleadoDetail.rolId ? rolesData.find(r => r.id === empleadoDetail.rolId) : undefined;
            initialAssignedMap.set(assigned.empleadoId, {
              empleado: empleadoDetail,
              rol: rolDetail,
              eventSalary: assigned.eventSalary // Usar el sueldo guardado para el evento
            });
          }
        });
      }
      setAssignedStaff(initialAssignedMap);

    } catch (err: any) {
      setError("No se pudieron cargar los datos iniciales. Por favor, intente de nuevo.");
      toast({ title: "Error de Carga", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleToggleAssign = (empleado: Empleado, isAssigned: boolean) => {
    setAssignedStaff(prev => {
      const newMap = new Map(prev);
      if (isAssigned) {
        const rol = empleado.rolId ? allRoles.find(r => r.id === empleado.rolId) : undefined;
        let defaultEventSalary = 0; // Default si no hay rol o es variable
        if (rol && rol.tipoSalario === 'fijo' && typeof rol.montoSalario === 'number') {
          defaultEventSalary = rol.montoSalario;
        }
        newMap.set(empleado.id, { empleado, rol, eventSalary: defaultEventSalary });
      } else {
        newMap.delete(empleado.id);
      }
      return newMap;
    });
  };

  const handleEventSalaryChange = (empleadoId: string, newSalaryStr: string) => {
    const salaryNum = parseFloat(newSalaryStr);
    
    setAssignedStaff(prev => {
      const newMap = new Map(prev);
      const currentAssignment = newMap.get(empleadoId);
      if (currentAssignment) {
        newMap.set(empleadoId, { 
          ...currentAssignment, 
          eventSalary: newSalaryStr === '' || isNaN(salaryNum) ? 0 : salaryNum // Si está vacío o NaN, poner 0 momentáneamente
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
            let fallbackSalary = 0; // Default if no role or variable salary
            if (currentAssignment.rol && currentAssignment.rol.tipoSalario === 'fijo' && typeof currentAssignment.rol.montoSalario === 'number') {
                fallbackSalary = currentAssignment.rol.montoSalario;
            }
            newMap.set(empleadoId, { ...currentAssignment, eventSalary: fallbackSalary });
        }
        return newMap;
    });
  };

  const totalAssignedCount = assignedStaff.size;
  const totalEventCost = Array.from(assignedStaff.values()).reduce((sum, { eventSalary }) => sum + (eventSalary || 0), 0);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const personalToSave: PersonalAsignadoDetalleStorage[] = Array.from(assignedStaff.values()).map(item => ({
      empleadoId: item.empleado.id,
      eventSalary: item.eventSalary // eventSalary ya es numérico o 0
    }));

    try {
      const result = await updatePersonalFiestaActual(personalToSave);
      if (result.success) {
        toast({
          title: "¡Personal Guardado!",
          description: `Se guardaron las asignaciones de ${totalAssignedCount} empleado(s).`,
        });
        // No es necesario recargar datos aquí si la UI ya refleja los cambios y `result.updatedData` es fiable
        // pero para consistencia, se podría llamar a fetchInitialData() o actualizar con result.updatedData si se devolviera.
      } else {
        throw new Error(result.error || "Error desconocido al guardar el personal asignado.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-destructive">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
        <p className="font-semibold">Error al Cargar Datos</p>
        <p className="text-sm">{error}</p>
        <Button onClick={fetchInitialData} className="mt-4">Reintentar</Button>
      </div>
    );
  }

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
            Marca los empleados que participarán en este evento y ajusta su sueldo para el evento si es necesario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allEmpleados.length === 0 ? (
            <div className="py-10 text-center">
              <Info className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No hay personal registrado en el sistema.</p>
              <Link href="/empleados/nuevo" passHref>
                <Button className="mt-6">Añadir Empleado</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">Asignar</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol (Base)</TableHead>
                    <TableHead className="text-right">Sueldo Rol (Base)</TableHead>
                    <TableHead className="text-right w-[200px]">Sueldo Evento (UYU)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEmpleados.map((empleado) => {
                    const isAssigned = assignedStaff.has(empleado.id);
                    const currentAssignment = assignedStaff.get(empleado.id);
                    const rolDelEmpleado = empleado.rolId ? allRoles.find(r => r.id === empleado.rolId) : undefined;
                    const sueldoBaseRol = (rolDelEmpleado && rolDelEmpleado.tipoSalario === 'fijo') ? rolDelEmpleado.montoSalario : undefined;

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
                        <TableCell className="min-w-[120px]">{rolDelEmpleado?.nombre || <span className="italic text-muted-foreground">Sin rol</span>}</TableCell>
                        <TableCell className="text-right min-w-[120px]">
                          {sueldoBaseRol !== undefined ? formatCurrency(sueldoBaseRol) : <span className="italic text-muted-foreground">Variable</span>}
                        </TableCell>
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
            <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Asignaciones de Personal'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
