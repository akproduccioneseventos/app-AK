
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Users, UserCheck, AlertTriangle, Info, Printer, RefreshCw, ClipboardCheck } from 'lucide-react';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { useToast } from '@/hooks/use-toast';
import type { PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import { getFiestaById, updatePersonalFiestaActual } from '@/app/actions/fiesta-actual';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

interface AssignedStaffUIDetail {
  empleadoId: string;
  nombre: string;
  rolId: string;
  rolNombre: string;
  eventSalary: number;
  employerContribution: number;
}

interface RequiredRole {
  roleName: string;
  quantity: number;
  sourceItem: string;
}

export default function AsignarPersonalEventoPage() {
  const { toast } = useToast();
  const [allEmpleados, setAllEmpleados] = useState<Empleado[]>([]);
  const [allRoles, setAllRoles] = useState<Rol[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<Map<string, AssignedStaffUIDetail>>(new Map());
  const [requiredRoles, setRequiredRoles] = useState<RequiredRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const fiestaId = new URLSearchParams(window.location.search).get('fiestaId');
      if (!fiestaId) throw new Error("ID de fiesta no encontrado");
      
      const fiestaActual = await getFiestaById(fiestaId);
      if (!fiestaActual) throw new Error("Fiesta no encontrada");

      const [empleadosData, rolesData, presupuestoData] = await Promise.all([
        getEmpleados(),
        getRoles(),
        fiestaActual.presupuestoId ? getPresupuestoById(fiestaActual.presupuestoId) : Promise.resolve(null)
      ]);
      
      setAllEmpleados(empleadosData);
      setAllRoles(rolesData);

      // Detect Required Roles from Budget
      if (presupuestoData) {
        const requirements: RequiredRole[] = [];
        presupuestoData.itemsPresupuestados.forEach(item => {
          const name = item.nombreServicio.toLowerCase();
          const cat = (item.categoriaServicio || '').toLowerCase();
          
          if (name.includes('discoteca') || cat.includes('discoteca')) {
            requirements.push({ roleName: 'DJ', quantity: 1, sourceItem: item.nombreServicio });
          }
          if (name.includes('decoración') || name.includes('ambientación') || cat.includes('decoración')) {
            requirements.push({ roleName: 'Decoradora', quantity: 1, sourceItem: item.nombreServicio });
            requirements.push({ roleName: 'Ayudante de Decoración', quantity: 1, sourceItem: item.nombreServicio });
          }
          if (name.includes('mozo')) {
            requirements.push({ roleName: 'Mozo', quantity: item.cantidad, sourceItem: item.nombreServicio });
          }
          if (name.includes('asado') || name.includes('asador')) {
            requirements.push({ roleName: 'Asador', quantity: 1, sourceItem: item.nombreServicio });
          }
          if (cat.includes('fotografía')) {
            requirements.push({ roleName: 'Fotógrafo', quantity: 1, sourceItem: item.nombreServicio });
          }
          if (cat.includes('filmación') || name.includes('video')) {
            requirements.push({ roleName: 'Camarógrafo / Videógrafo', quantity: 1, sourceItem: item.nombreServicio });
          }
          if (name.includes('cocina') || name.includes('chef')) {
            requirements.push({ roleName: 'Cocinero/Cheff', quantity: item.cantidad, sourceItem: item.nombreServicio });
          }
          if (name.includes('portero') || name.includes('seguridad')) {
            requirements.push({ roleName: 'Personal de Seguridad / Portero', quantity: item.cantidad, sourceItem: item.nombreServicio });
          }
        });
        setRequiredRoles(requirements);
      }

      const initialAssignedMap = new Map<string, AssignedStaffUIDetail>();
      
      if (fiestaActual.personalAsignado && fiestaActual.personalAsignado.length > 0) {
        fiestaActual.personalAsignado.forEach(assigned => {
          const empleadoDetail = empleadosData.find(e => e.id === assigned.empleadoId);
          if (empleadoDetail) {
            const rolDetail = rolesData.find(r => r.id === assigned.rolId);
            const eventSalary = assigned.eventSalary;
            const aportes = (eventSalary * (rolDetail?.porcentajeAportesPatronales ?? 0)) / 100;
            initialAssignedMap.set(assigned.empleadoId, {
              empleadoId: empleadoDetail.id,
              nombre: empleadoDetail.nombre,
              rolId: assigned.rolId,
              rolNombre: rolDetail?.nombre || 'Rol Desconocido',
              eventSalary: eventSalary,
              employerContribution: aportes,
            });
          }
        });
      }

      setAssignedStaff(initialAssignedMap);

    } catch (err: any) {
      setError("No se pudieron cargar los datos iniciales.");
      toast({ title: "Error de Carga", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleAssignmentChange = (empleado: Empleado, selectedRolId: string) => {
    setAssignedStaff(prev => {
        const newMap = new Map(prev);
        if (selectedRolId === "ninguno") {
            newMap.delete(empleado.id);
        } else {
            const rol = allRoles.find(r => r.id === selectedRolId);
            if(rol) {
                const eventSalary = rol.sueldoPorEvento;
                const employerContribution = (eventSalary * (rol.porcentajeAportesPatronales || 0)) / 100;
                newMap.set(empleado.id, {
                    empleadoId: empleado.id,
                    nombre: empleado.nombre,
                    rolId: rol.id,
                    rolNombre: rol.nombre,
                    eventSalary,
                    employerContribution
                });
            }
        }
        return newMap;
    });
  }

  const handleEventSalaryChange = (empleadoId: string, newSalaryStr: string) => {
    const salaryNum = parseFloat(newSalaryStr);
    const finalSalary = newSalaryStr === '' || isNaN(salaryNum) ? 0 : salaryNum;

    setAssignedStaff(prev => {
      const newMap = new Map(prev);
      const currentAssignment = newMap.get(empleadoId);
      if (currentAssignment) {
        const rol = allRoles.find(r => r.id === currentAssignment.rolId);
        const aportes = (finalSalary * (rol?.porcentajeAportesPatronales ?? 0)) / 100;
        newMap.set(empleadoId, { 
          ...currentAssignment, 
          eventSalary: finalSalary,
          employerContribution: aportes,
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
            const rol = allRoles.find(r => r.id === currentAssignment.rolId);
            const fallbackSalary = rol?.sueldoPorEvento ?? 0;
            const aportes = (fallbackSalary * (rol?.porcentajeAportesPatronales ?? 0)) / 100;
            newMap.set(empleadoId, { ...currentAssignment, eventSalary: fallbackSalary, employerContribution: aportes });
        }
        return newMap;
    });
  };

  const totalAssignedCount = assignedStaff.size;
  const totalSalaryCost = Array.from(assignedStaff.values()).reduce((sum, { eventSalary }) => sum + (eventSalary || 0), 0);
  const totalContributionCost = Array.from(assignedStaff.values()).reduce((sum, { employerContribution }) => sum + (employerContribution || 0), 0);
  const totalEventCost = totalSalaryCost + totalContributionCost;

  const handleSaveChanges = async () => {
    const fiestaId = new URLSearchParams(window.location.search).get('fiestaId');
    if (!fiestaId) return;
    
    setIsSaving(true);
    const personalToSave: PersonalAsignadoDetalleStorage[] = Array.from(assignedStaff.values()).map(item => ({
      empleadoId: item.empleadoId,
      rolId: item.rolId,
      eventSalary: item.eventSalary
    }));

    try {
      const result = await updatePersonalFiestaActual(fiestaId, personalToSave);
      if (result.success) {
        toast({
          title: "¡Personal Guardado!",
          description: `Se guardaron las asignaciones de ${totalAssignedCount} empleado(s).`,
        });
      } else {
        throw new Error(result.error || "No se pudo guardar el personal asignado.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
        <Link href={`/fiestas/nueva?fiestaId=${new URLSearchParams(window.location.search).get('fiestaId')}`} passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      {requiredRoles.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" /> Personal Requerido según Presupuesto
            </CardTitle>
            <CardDescription>Roles detectados automáticamente para este evento.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {requiredRoles.map((req, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1 bg-white border-primary/20 text-primary">
                  {req.quantity}x {req.roleName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Seleccionar Personal</CardTitle>
            <CardDescription>
                Asigna un empleado a cada rol contratado. Luego define su pago final para el evento.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchInitialData(true)}>
              <RefreshCw className="w-4 h-4 mr-2"/> Sincronizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol en el Evento</TableHead>
                  <TableHead className="text-right">Pago Evento (UYU)</TableHead>
                  <TableHead className="text-right">Aportes Patronales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEmpleados.map((empleado) => {
                  const assignedDetail = assignedStaff.get(empleado.id);
                  const isAssigned = !!assignedDetail;

                  return (
                    <TableRow key={empleado.id} className={isAssigned ? 'bg-primary/5' : ''}>
                      <TableCell className="font-medium min-w-[180px]">{empleado.nombre}</TableCell>
                      <TableCell className="min-w-[200px]">
                         <Select 
                          value={assignedDetail?.rolId || 'ninguno'}
                          onValueChange={(value) => handleAssignmentChange(empleado, value)}
                          disabled={!empleado.rolIds || empleado.rolIds.length === 0}
                         >
                          <SelectTrigger className="text-xs h-9">
                              <SelectValue placeholder="No Asignado" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="ninguno">No Asignado</SelectItem>
                              {empleado.rolIds?.map(rolId => {
                                  const rol = allRoles.find(r => r.id === rolId);
                                  return rol ? <SelectItem key={rolId} value={rolId}>{rol.nombre}</SelectItem> : null
                              })}
                          </SelectContent>
                         </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAssigned ? (
                          <Input
                            type="number"
                            value={assignedDetail.eventSalary ?? ''}
                            onChange={(e) => handleEventSalaryChange(empleado.id, e.target.value)}
                            onBlur={() => handleEventSalaryBlur(empleado.id)}
                            placeholder="Pago evento"
                            className="text-right h-9 max-w-[120px] ml-auto"
                            min="0"
                            step="any"
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                       <TableCell className="text-right min-w-[140px] font-mono">
                         {isAssigned ? formatCurrency(assignedDetail.employerContribution ?? 0) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Resumen de Costos de Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Total de Personal Asignado:</span><span className="font-semibold text-lg">{totalAssignedCount}</span></div>
          <div className="flex justify-between items-center border-t pt-3 mt-2"><span className="font-bold text-primary">COSTO TOTAL ESTIMADO:</span><span className="font-bold text-lg text-primary">{formatCurrency(totalEventCost)}</span></div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full sm:w-auto" size="lg">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar Asignaciones'}
          </Button>
          <Link href={`/fiestas/nueva/personal/recibos?fiestaId=${new URLSearchParams(window.location.search).get('fiestaId')}`} passHref>
              <Button variant="secondary" className="w-full sm:w-auto" size="lg">
                  <Printer className="w-5 h-5 mr-2" />
                  Generar Recibos
              </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
