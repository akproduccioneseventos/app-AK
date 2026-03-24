'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Users, UserCheck, AlertTriangle, Info, RefreshCw, UserPlus, Trash2 } from 'lucide-react';
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
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface RequiredRole {
  roleId: string;
  roleName: string;
  quantity: number;
  sourceItem: string;
  customSalary?: number;
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

      if (presupuestoData) {
        const requirements: RequiredRole[] = [];
        const totalGuests = (presupuestoData.invitadosAdultos || 0) + (presupuestoData.invitadosNinos || 0) + (presupuestoData.invitadosAdolescentes || 0);

        const findAndAdd = (search: string, qty: number, source: string, salary?: number) => {
            const rol = rolesData.find(r => r.nombre.toLowerCase().includes(search.toLowerCase()));
            if (rol) {
                requirements.push({ 
                    roleId: rol.id, 
                    roleName: rol.nombre, 
                    quantity: qty, 
                    sourceItem: source,
                    customSalary: salary 
                });
            }
        };

        // 1. Regla Utileros: 1 cada 25 invitados
        const numUtileros = Math.ceil(totalGuests / 25);
        findAndAdd('Utilero', numUtileros, 'Regla automática (1 cada 25 invitados)');

        // 2. Regla Barman (Solo si hay barra/tragos)
        const hasBarra = presupuestoData.itemsPresupuestados.some(item => 
            item.nombreServicio.toLowerCase().includes('barra') || 
            item.nombreServicio.toLowerCase().includes('trago') ||
            item.nombreServicio.toLowerCase().includes('licuado')
        );
        if (hasBarra) {
            let numBarmen = 1;
            if (totalGuests > 150) numBarmen = 3;
            else if (totalGuests > 60) numBarmen = 2;
            findAndAdd('Barman', numBarmen, 'Servicio de Barra contratado');
        }

        // 3. Procesar items del presupuesto
        presupuestoData.itemsPresupuestados.forEach(item => {
          const name = item.nombreServicio.toLowerCase();
          const cat = (item.categoriaServicio || '').toLowerCase();
          
          if (name.includes('discoteca') || cat.includes('discoteca') || name.includes(' dj')) {
            findAndAdd('DJ', 1, item.nombreServicio);
          }
          if (name.includes('decoración') || name.includes('ambientación') || cat.includes('decoración')) {
            findAndAdd('Decoradora', 1, item.nombreServicio);
            findAndAdd('Ayudante de Decoración', 1, item.nombreServicio);
          }
          if (name.includes('mozo')) {
            findAndAdd('Mozo', item.quantity, item.nombreServicio);
          }
          if (name.includes('asado') || name.includes('asador')) {
            findAndAdd('Asador', 1, item.nombreServicio);
          }
          
          // FOTOGRAFÍA (Desglosada)
          if (name.includes('fotografía') || cat.includes('fotografía')) {
              if (name.includes('exteriores')) {
                  findAndAdd('Fotógrafo', 1, 'Sesión de Exteriores', 2000);
              } else if (name.includes('civil')) {
                  findAndAdd('Fotógrafo', 1, 'Cobertura de Civil', 2000);
              } else if (name.includes('iglesia')) {
                  findAndAdd('Fotógrafo', 1, 'Cobertura de Iglesia', 2000);
              } else {
                  findAndAdd('Fotógrafo', 1, item.nombreServicio);
              }
          }

          if (name.includes('cocina') || name.includes('chef')) {
            findAndAdd('Cocinero/Cheff', item.cantidad || 1, item.nombreServicio);
          }
          if (name.includes('portero') || name.includes('seguridad')) {
            findAndAdd('Personal de Seguridad / Portero', item.cantidad || 1, item.nombreServicio);
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

  const handleUpdateAssignment = async (index: number, empleadoId: string | null, rolId: string, defaultSalary?: number) => {
    const updatedStaff = [...assignedStaff];
    
    if (empleadoId === null) {
        updatedStaff.splice(index, 1);
    } else if (index >= updatedStaff.length) {
        const rol = allRoles.find(r => r.id === rolId);
        updatedStaff.push({
            empleadoId,
            rolId,
            eventSalary: (defaultSalary ?? rol?.sueldoPorEvento) || 0
        });
    } else {
        const rol = allRoles.find(r => r.id === rolId);
        updatedStaff[index] = {
            ...updatedStaff[index],
            empleadoId,
            rolId,
            eventSalary: (defaultSalary ?? rol?.sueldoPorEvento) || updatedStaff[index].eventSalary
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

  const getEmployeesByRole = (roleId: string) => {
      return allEmpleados.filter(e => e.rolIds?.includes(roleId));
  };

  const assignmentRows = useMemo(() => {
      let rows: { type: 'required' | 'extra', roleId: string, roleName: string, assignedId?: string, salary: number, originalIndex?: number, source: string }[] = [];
      const tempAssigned = [...assignedStaff];

      requiredRoles.forEach(req => {
          for (let i = 0; i < req.quantity; i++) {
              const matchIndex = tempAssigned.findIndex(a => a.rolId === req.roleId);
              const rol = allRoles.find(r => r.id === req.roleId);
              const defaultSalary = req.customSalary ?? rol?.sueldoPorEvento ?? 0;

              if (matchIndex > -1) {
                  const assigned = tempAssigned[matchIndex];
                  const realIndex = assignedStaff.findIndex(a => a === assigned);
                  rows.push({ type: 'required', roleId: req.roleId, roleName: req.roleName, assignedId: assigned.empleadoId, salary: assigned.eventSalary, originalIndex: realIndex, source: req.sourceItem });
                  tempAssigned.splice(matchIndex, 1);
              } else {
                  rows.push({ type: 'required', roleId: req.roleId, roleName: req.roleName, salary: defaultSalary, source: req.sourceItem });
              }
          }
      });

      tempAssigned.forEach(extra => {
          const realIndex = assignedStaff.findIndex(a => a === extra);
          const rol = allRoles.find(r => r.id === extra.rolId);
          rows.push({ type: 'extra', roleId: extra.rolId, roleName: rol?.nombre || 'Rol Desconocido', assignedId: extra.empleadoId, salary: extra.eventSalary, originalIndex: realIndex, source: 'Manual' });
      });

      return rows;
  }, [requiredRoles, assignedStaff, allRoles]);

  const totalEventCost = useMemo(() => {
      return assignmentRows.reduce((sum, row) => {
          const rol = allRoles.find(r => r.id === row.roleId);
          const aportes = (row.salary * (rol?.porcentajeAportesPatronales || 0)) / 100;
          return sum + row.salary + aportes;
      }, 0);
  }, [assignmentRows, allRoles]);

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
                  <TableHead className="w-[220px]">Rol Requerido</TableHead>
                  <TableHead>Empleado Asignado</TableHead>
                  <TableHead className="text-right">Sueldo Evento</TableHead>
                  <TableHead className="text-right">Aportes (Extra)</TableHead>
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
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.source}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <Select 
                          value={row.assignedId || 'ninguno'}
                          onValueChange={(val) => handleUpdateAssignment(row.originalIndex ?? assignedStaff.length, val === 'ninguno' ? null : val, row.roleId, row.salary)}
                         >
                          <SelectTrigger className={cn("h-9", !row.assignedId && "border-amber-200 text-amber-600 italic")}>
                              <SelectValue placeholder={filteredEmpleados.length > 0 ? "Seleccionar..." : "No hay personal"} />
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
                       <TableCell className="text-right font-mono text-xs text-muted-foreground">
                         +{formatCurrency(aportes)}
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
          <div className="mt-4">
              <Button variant="outline" size="sm" onClick={addManualAssignment} className="border-dashed">
                  <UserPlus className="w-4 h-4 mr-2"/> Añadir Personal Extra Manual
              </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline flex items-center justify-between">
              <span>Costo de Personal + Aportes</span>
              <span className="text-primary">{formatCurrency(totalEventCost)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
              <span>Puestos Cubiertos:</span>
              <span className="font-bold text-foreground">{filledCount} de {assignmentRows.length}</span>
          </div>
          <p className="text-xs italic border-t pt-2">El total proyectado incluye sueldos y aportes patronales para todos los puestos requeridos según el presupuesto e invitados.</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pb-6">
          <Link href={`/fiestas/nueva/personal/recibos?fiestaId=${fiestaId}`} passHref>
              <Button variant="secondary" size="lg">
                  <UserCheck className="w-5 h-5 mr-2" /> Ver Recibos de Pago
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
