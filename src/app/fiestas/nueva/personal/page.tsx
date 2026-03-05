
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Users, UserCheck, AlertTriangle, Info, Printer, RefreshCw, ClipboardCheck, UserPlus, Trash2, UserSearch } from 'lucide-react';
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
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

interface RequiredRole {
  roleId: string;
  roleName: string;
  quantity: number;
  sourceItem: string;
}

function AsignarPersonalEventoContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [allEmpleados, setAllEmpleados] = useState<Empleado[]>([]);
  const [allRoles, setAllRoles] = useState<Rol[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<PersonalAsignadoDetalleStorage[]>([]);
  const [requiredRoles, setRequiredRoles] = useState<RequiredRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async (showLoading = true) => {
    if (!fiestaId) return;
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const fiestaActual = await getFiestaById(fiestaId);
      if (!fiestaActual) throw new Error("Fiesta no encontrada");

      const [empleadosData, rolesData, presupuestoData] = await Promise.all([
        getEmpleados(),
        getRoles(),
        fiestaActual.presupuestoId ? getPresupuestoById(fiestaActual.presupuestoId) : Promise.resolve(null)
      ]);
      
      setAllEmpleados(empleadosData);
      setAllRoles(rolesData);
      setAssignedStaff(fiestaActual.personalAsignado || []);

      // Detect Required Roles from Budget + Automatic Rules
      if (presupuestoData) {
        const requirements: RequiredRole[] = [];
        const totalGuests = (presupuestoData.invitadosAdultos || 0) + (presupuestoData.invitadosNinos || 0) + (presupuestoData.invitadosAdolescentes || 0);

        // 1. Automatic Utility Rule: 1 per 25 guests
        const numUtileros = Math.ceil(totalGuests / 25);
        const utileroRol = rolesData.find(r => r.nombre.toLowerCase().includes('utilero'));
        if (numUtileros > 0 && utileroRol) {
            requirements.push({ 
                roleId: utileroRol.id,
                roleName: 'Utilero', 
                quantity: numUtileros, 
                sourceItem: 'Regla automática (1 cada 25 invitados)' 
            });
        }

        presupuestoData.itemsPresupuestados.forEach(item => {
          const name = item.nombreServicio.toLowerCase();
          const cat = (item.categoriaServicio || '').toLowerCase();
          
          const findAndAdd = (search: string, qty: number) => {
              const rol = rolesData.find(r => r.nombre.toLowerCase().includes(search.toLowerCase()));
              if (rol) {
                  requirements.push({ roleId: rol.id, roleName: rol.nombre, quantity: qty, sourceItem: item.nombreServicio });
              }
          };

          if (name.includes('discoteca') || cat.includes('discoteca') || name.includes(' dj')) {
            findAndAdd('DJ', 1);
          }
          if (name.includes('decoración') || name.includes('ambientación') || cat.includes('decoración')) {
            findAndAdd('Decoradora', 1);
            findAndAdd('Ayudante de Decoración', 1);
          }
          if (name.includes('mozo')) {
            findAndAdd('Mozo', item.cantidad);
          }
          if (name.includes('asado') || name.includes('asador')) {
            findAndAdd('Asador', 1);
          }
          if (name.includes('fotografía') || cat.includes('fotografía')) {
            findAndAdd('Fotógrafo', 1);
          }
          if (name.includes('filmación') || name.includes('video') || cat.includes('filmación')) {
            findAndAdd('Camarógrafo / Videógrafo', 1);
          }
          if (name.includes('cocina') || name.includes('chef')) {
            findAndAdd('Cocinero/Cheff', item.cantidad || 1);
          }
          if (name.includes('portero') || name.includes('seguridad')) {
            findAndAdd('Personal de Seguridad / Portero', item.cantidad || 1);
          }
        });
        setRequiredRoles(requirements);
      }

    } catch (err: any) {
      setError("No se pudieron cargar los datos iniciales.");
      toast({ title: "Error de Carga", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleAutoSave = async (updatedStaff: PersonalAsignadoDetalleStorage[]) => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updatePersonalFiestaActual(fiestaId, updatedStaff);
      if (!result.success) throw new Error(result.error || "No se pudo guardar automáticamente.");
    } catch (error: any) {
      toast({ title: "Error en auto-guardado", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAssignment = async (index: number, empleadoId: string | null, rolId: string) => {
    const updatedStaff = [...assignedStaff];
    
    if (empleadoId === null) {
        // Remove assignment
        updatedStaff.splice(index, 1);
    } else if (index >= updatedStaff.length) {
        // New assignment
        const rol = allRoles.find(r => r.id === rolId);
        updatedStaff.push({
            empleadoId,
            rolId,
            eventSalary: rol?.sueldoPorEvento || 0
        });
    } else {
        // Update existing slot
        const rol = allRoles.find(r => r.id === rolId);
        updatedStaff[index] = {
            ...updatedStaff[index],
            empleadoId,
            rolId,
            eventSalary: rol?.sueldoPorEvento || updatedStaff[index].eventSalary
        };
    }
    
    setAssignedStaff(updatedStaff);
    await handleAutoSave(updatedStaff);
  };

  const handleSalaryChange = async (index: number, newSalary: number) => {
      const updatedStaff = [...assignedStaff];
      updatedStaff[index].eventSalary = newSalary;
      setAssignedStaff(updatedStaff);
      await handleAutoSave(updatedStaff);
  };

  const addManualAssignment = () => {
      const firstRole = allRoles[0];
      if (firstRole) {
          const updatedStaff = [...assignedStaff, { empleadoId: '', rolId: firstRole.id, eventSalary: firstRole.sueldoPorEvento }];
          setAssignedStaff(updatedStaff);
      }
  };

  // Helper to filter employees by role
  const getEmployeesByRole = (roleId: string) => {
      return allEmpleados.filter(e => e.rolIds?.includes(roleId));
  };

  // Build the list of rows to display based on requirements
  const assignmentRows = useMemo(() => {
      let rows: { type: 'required' | 'extra', roleId: string, roleName: string, assignedId?: string, salary: number, originalIndex?: number }[] = [];
      
      const tempAssigned = [...assignedStaff];

      // 1. Process Required Roles
      requiredRoles.forEach(req => {
          for (let i = 0; i < req.quantity; i++) {
              const matchIndex = tempAssigned.findIndex(a => a.rolId === req.roleId);
              if (matchIndex > -1) {
                  const assigned = tempAssigned[matchIndex];
                  const realIndex = assignedStaff.findIndex(a => a === assigned);
                  rows.push({ type: 'required', roleId: req.roleId, roleName: req.roleName, assignedId: assigned.empleadoId, salary: assigned.eventSalary, originalIndex: realIndex });
                  tempAssigned.splice(matchIndex, 1);
              } else {
                  const rol = allRoles.find(r => r.id === req.roleId);
                  rows.push({ type: 'required', roleId: req.roleId, roleName: req.roleName, salary: rol?.sueldoPorEvento || 0 });
              }
          }
      });

      // 2. Process Remaining (Extra) Assignments
      tempAssigned.forEach(extra => {
          const realIndex = assignedStaff.findIndex(a => a === extra);
          const rol = allRoles.find(r => r.id === extra.rolId);
          rows.push({ type: 'extra', roleId: extra.rolId, roleName: rol?.nombre || 'Rol Desconocido', assignedId: extra.empleadoId, salary: extra.eventSalary, originalIndex: realIndex });
      });

      return rows;
  }, [requiredRoles, assignedStaff, allRoles]);

  const totalEventCost = useMemo(() => {
      let total = 0;
      
      // Calculate total for required roles based on default role salary
      requiredRoles.forEach(req => {
          const rol = allRoles.find(r => r.id === req.roleId);
          if (rol) {
              const unitSalary = rol.sueldoPorEvento;
              const unitAportes = (unitSalary * (rol.porcentajeAportesPatronales || 0)) / 100;
              total += (unitSalary + unitAportes) * req.quantity;
          }
      });

      // Calculate total for extra roles added manually
      const tempAssigned = [...assignedStaff];
      requiredRoles.forEach(req => {
          for (let i = 0; i < req.quantity; i++) {
              const matchIdx = tempAssigned.findIndex(a => a.rolId === req.roleId);
              if (matchIdx > -1) tempAssigned.splice(matchIdx, 1);
          }
      });
      
      tempAssigned.forEach(extra => {
          const rol = allRoles.find(r => r.id === extra.rolId);
          const aportes = (extra.eventSalary * (rol?.porcentajeAportesPatronales || 0)) / 100;
          total += extra.eventSalary + aportes;
      });

      return total;
  }, [requiredRoles, assignedStaff, allRoles]);

  const filledCount = useMemo(() => assignedStaff.filter(s => !!s.empleadoId).length, [assignedStaff]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Asignar Personal al Evento</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Lista de Personal por Rol</CardTitle>
            <CardDescription>Asigna nombres a los puestos requeridos. Solo verás empleados capacitados para cada rol.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-primary"/>}
            <Button variant="ghost" size="sm" onClick={() => fetchInitialData(true)}><RefreshCw className="w-4 h-4 mr-2"/>Sincronizar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Rol Requerido</TableHead>
                  <TableHead>Empleado Asignado</TableHead>
                  <TableHead className="text-right">Sueldo Evento</TableHead>
                  <TableHead className="text-right">Aportes (Estimado)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentRows.map((row, idx) => {
                  const filteredEmpleados = getEmployeesByRole(row.roleId);
                  const rol = allRoles.find(r => r.id === row.roleId);
                  const aportes = (row.salary * (rol?.porcentajeAportesPatronales || 0)) / 100;

                  return (
                    <TableRow key={idx} className={cn(!row.assignedId && "bg-amber-50/10", row.type === 'extra' && "bg-blue-50/20")}>
                      <TableCell className="font-medium py-4">
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2">
                                {row.roleName}
                                {row.type === 'extra' && <Badge variant="outline" className="text-[10px] h-4">EXTRA</Badge>}
                            </span>
                            {row.type === 'required' && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{idx + 1} de {requiredRoles.find(r=>r.roleId===row.roleId)?.quantity} puestos</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                         <Select 
                          value={row.assignedId || 'ninguno'}
                          onValueChange={(val) => handleUpdateAssignment(row.originalIndex ?? assignedStaff.length, val === 'ninguno' ? null : val, row.roleId)}
                         >
                          <SelectTrigger className={cn("h-9", !row.assignedId && "border-amber-200 text-amber-600 italic")}>
                              <SelectValue placeholder={filteredEmpleados.length > 0 ? "Seleccionar empleado..." : "No hay empleados con este rol"} />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="ninguno">-- Sin Asignar --</SelectItem>
                              {filteredEmpleados.map(emp => (
                                  <SelectItem key={emp.id} value={emp.id}>{emp.nombre}</SelectItem>
                              ))}
                          </SelectContent>
                         </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={row.salary || ''}
                              onChange={(e) => handleSalaryChange(row.originalIndex!, Number(e.target.value))}
                              className="h-8 w-24 text-right text-xs"
                              disabled={!row.assignedId}
                            />
                        </div>
                      </TableCell>
                       <TableCell className="text-right font-mono text-xs">
                         {formatCurrency(aportes)}
                      </TableCell>
                      <TableCell>
                          {row.type === 'extra' && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleUpdateAssignment(row.originalIndex!, null, row.roleId)}>
                                  <Trash2 className="w-4 h-4"/>
                              </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-start">
              <Button variant="outline" size="sm" onClick={addManualAssignment} className="border-dashed">
                  <UserPlus className="w-4 h-4 mr-2"/> Añadir Personal Extra Manual
              </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline flex items-center justify-between">
              <span>Resumen Financiero Personal</span>
              <span className="text-primary">{formatCurrency(totalEventCost)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
              <span className="text-muted-foreground">Puestos Cubiertos:</span>
              <span className="font-bold">{filledCount} de {assignmentRows.length}</span>
          </div>
          <p className="text-xs text-muted-foreground italic border-t pt-2">El costo total incluye los sueldos previstos para todos los puestos requeridos más el porcentaje estimado de aportes patronales.</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pb-6">
          <Link href={`/fiestas/nueva/personal/recibos?fiestaId=${fiestaId}`} passHref>
              <Button variant="secondary" size="lg">
                  <Printer className="w-5 h-5 mr-2" /> Generar Recibos de Pago
              </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AsignarPersonalEventoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <AsignarPersonalEventoContent />
        </Suspense>
    )
}
