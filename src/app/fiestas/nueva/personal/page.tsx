'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save, Users, UserCheck, AlertTriangle, Info, RefreshCw, UserPlus, Trash2, MessageCircle, Send, CalendarDays, History } from 'lucide-react';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { useToast } from '@/hooks/use-toast';
import type { PersonalAsignadoDetalleStorage, FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById, updatePersonalFiestaActual } from '@/app/actions/fiesta-actual';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getFiestasByEmpleado } from '@/app/actions/personal-fiestas';
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

interface WhatsAppDialogState {
  open: boolean;
  empleado: Empleado | null;
  roleName: string;
  salary: number;
  message: string;
  phone: string;
}

interface RegistroFiestasDialogState {
  open: boolean;
  empleado: Empleado | null;
  fiestas: FiestaEnPlanificacion[];
  isLoading: boolean;
  summaryPhone: string;
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
  const [currentFiesta, setCurrentFiesta] = useState<FiestaEnPlanificacion | null>(null);

  const [whatsAppDialog, setWhatsAppDialog] = useState<WhatsAppDialogState>({
    open: false,
    empleado: null,
    roleName: '',
    salary: 0,
    message: '',
    phone: '',
  });

  const [registroDialog, setRegistroDialog] = useState<RegistroFiestasDialogState>({
    open: false,
    empleado: null,
    fiestas: [],
    isLoading: false,
    summaryPhone: '',
  });

  const fetchInitialData = useCallback(async (showLoading = true) => {
    if (!fiestaId) return;
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const fiestaActual = await getFiestaById(fiestaId);
      if (!fiestaActual) throw new Error("Fiesta no encontrada");
      setCurrentFiesta(fiestaActual);

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
            findAndAdd('Cocinero/Chef', item.cantidad || 1, item.nombreServicio);
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
    let newlyAssignedEmpleadoId: string | null = null;
    let assignedSalary = 0;
    
    if (empleadoId === null) {
        updatedStaff.splice(index, 1);
    } else if (index >= updatedStaff.length) {
        const rol = allRoles.find(r => r.id === rolId);
        assignedSalary = (defaultSalary ?? rol?.sueldoPorEvento) || 0;
        updatedStaff.push({
            empleadoId,
            rolId,
            eventSalary: assignedSalary
        });
        newlyAssignedEmpleadoId = empleadoId;
    } else {
        const rol = allRoles.find(r => r.id === rolId);
        assignedSalary = (defaultSalary ?? rol?.sueldoPorEvento) || updatedStaff[index].eventSalary;
        updatedStaff[index] = {
            ...updatedStaff[index],
            empleadoId,
            rolId,
            eventSalary: assignedSalary
        };
        newlyAssignedEmpleadoId = empleadoId;
    }
    
    setAssignedStaff(updatedStaff);
    await handleAutoSave(updatedStaff);

    if (newlyAssignedEmpleadoId && currentFiesta) {
        const empleado = allEmpleados.find(e => e.id === newlyAssignedEmpleadoId);
        const rol = allRoles.find(r => r.id === rolId);
        if (empleado && rol) {
            openWhatsAppDialog(empleado, rol.nombre, assignedSalary);
        }
    }
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

  const buildWhatsAppMessage = useCallback((
    empleado: Empleado,
    roleName: string,
    salary: number,
    fiesta: FiestaEnPlanificacion
  ): string => {
    const cfg = fiesta.configuracion;
    const fecha = cfg.fechaEvento
      ? new Date(cfg.fechaEvento + 'T00:00:00').toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Fecha a confirmar';
    const horario = cfg.horaInicio ? `${cfg.horaInicio}${cfg.horaFin ? ` - ${cfg.horaFin}` : ''}` : 'Horario a confirmar';
    const lugar = [cfg.nombreLugar, cfg.direccionLugar].filter(Boolean).join(', ') || 'Lugar a confirmar';

    return `¡Hola ${empleado.nombre}! 👋

Te confirmamos tu asignación al siguiente evento:

📅 *Evento:* ${cfg.nombreEvento || 'Sin nombre'}
🗓️ *Fecha:* ${fecha}
🕐 *Horario:* ${horario}
📍 *Lugar:* ${lugar}
👔 *Rol:* ${roleName}
💰 *Honorario:* ${formatCurrency(salary)}

Por favor confirmá tu asistencia respondiendo este mensaje.
¡Gracias y hasta pronto!`;
  }, []);

  const openWhatsAppDialog = useCallback((empleado: Empleado, roleName: string, salary: number) => {
    if (!currentFiesta) return;
    const message = buildWhatsAppMessage(empleado, roleName, salary, currentFiesta);
    setWhatsAppDialog({ open: true, empleado, roleName, salary, message, phone: '' });
  }, [currentFiesta, buildWhatsAppMessage]);

  const sendWhatsApp = () => {
    const phone = whatsAppDialog.phone.replace(/\D/g, '');
    if (!phone) {
      toast({ title: 'Teléfono requerido', description: 'Ingresá el número de WhatsApp del empleado.', variant: 'destructive' });
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppDialog.message)}`;
    window.open(url, '_blank');
    setWhatsAppDialog(prev => ({ ...prev, open: false }));
  };

  const openRegistroFiestas = async (empleado: Empleado) => {
    setRegistroDialog({ open: true, empleado, fiestas: [], isLoading: true, summaryPhone: '' });
    try {
      const fiestas = await getFiestasByEmpleado(empleado.id);
      setRegistroDialog(prev => ({ ...prev, fiestas, isLoading: false }));
    } catch {
      setRegistroDialog(prev => ({ ...prev, isLoading: false }));
      toast({ title: 'Error', description: 'No se pudo cargar el historial de eventos.', variant: 'destructive' });
    }
  };

  const sendRegistroWhatsApp = () => {
    const { empleado, fiestas, summaryPhone } = registroDialog;
    if (!empleado) return;
    const phone = summaryPhone.replace(/\D/g, '');
    if (!phone) {
      toast({ title: 'Teléfono requerido', description: 'Ingresá el número de WhatsApp del empleado.', variant: 'destructive' });
      return;
    }
    const lines = fiestas.map((f, i) => {
      const cfg = f.configuracion;
      const fecha = cfg.fechaEvento
        ? new Date(cfg.fechaEvento + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'Sin fecha';
      const asignaciones = (f.personalAsignado || [])
        .filter(p => p.empleadoId === empleado.id)
        .map(p => {
          const rol = allRoles.find(r => r.id === p.rolId);
          return `  • ${rol?.nombre || 'Rol desconocido'} — ${formatCurrency(p.eventSalary)}`;
        })
        .join('\n');
      return `${i + 1}. *${cfg.nombreEvento || 'Sin nombre'}* (${fecha})\n${asignaciones}`;
    });

    const message = `¡Hola ${empleado.nombre}! 👋\n\nEste es tu registro de eventos contratados:\n\n${lines.join('\n\n')}\n\nCualquier consulta no dudes en escribirnos. ¡Gracias!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setRegistroDialog(prev => ({ ...prev, open: false }));
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
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
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
                  <TableHead className="w-[100px]"></TableHead>
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
                          <div className="flex items-center gap-1">
                              {row.assignedId && (() => {
                                  const emp = allEmpleados.find(e => e.id === row.assignedId);
                                  return emp ? (
                                      <>
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-green-600 hover:text-green-700"
                                              title="Enviar WhatsApp"
                                              onClick={() => openWhatsAppDialog(emp, row.roleName, row.salary)}
                                          >
                                              <MessageCircle className="w-4 h-4" />
                                          </Button>
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                              title="Registro de eventos"
                                              onClick={() => openRegistroFiestas(emp)}
                                          >
                                              <History className="w-4 h-4" />
                                          </Button>
                                      </>
                                  ) : null;
                              })()}
                              {row.type === 'extra' && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleUpdateAssignment(row.originalIndex!, null, row.roleId)}>
                                      <Trash2 className="w-4 h-4"/>
                                  </Button>
                              )}
                          </div>
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
          <Link href={`/fiestas/nueva/personal/recibos?fiestaId=${fiestaId}`}>
              <Button variant="secondary" size="lg">
                  <UserCheck className="w-5 h-5 mr-2" /> Ver Recibos de Pago
              </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsAppDialog.open} onOpenChange={open => setWhatsAppDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Enviar mensaje por WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="wa-phone">Número de WhatsApp</Label>
              <Input
                id="wa-phone"
                placeholder="Ej: 59899123456 (con código de país)"
                value={whatsAppDialog.phone}
                onChange={e => setWhatsAppDialog(prev => ({ ...prev, phone: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Incluí el código de país sin el &quot;+&quot;. Ej: 598 para Uruguay.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="wa-message">Mensaje</Label>
              <Textarea
                id="wa-message"
                rows={10}
                value={whatsAppDialog.message}
                onChange={e => setWhatsAppDialog(prev => ({ ...prev, message: e.target.value }))}
                className="text-sm font-mono"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWhatsAppDialog(prev => ({ ...prev, open: false }))}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={sendWhatsApp}>
              <Send className="w-4 h-4 mr-2" />
              Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registro de Fiestas Dialog */}
      <Dialog open={registroDialog.open} onOpenChange={open => setRegistroDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Registro de eventos — {registroDialog.empleado?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-96 overflow-y-auto">
            {registroDialog.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : registroDialog.fiestas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay eventos registrados para este empleado.</p>
            ) : (
              <div className="space-y-3">
                {registroDialog.fiestas.map(fiesta => {
                  const cfg = fiesta.configuracion;
                  const fecha = cfg.fechaEvento
                    ? new Date(cfg.fechaEvento + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Sin fecha';
                  const asignaciones = (fiesta.personalAsignado || []).filter(
                    p => p.empleadoId === registroDialog.empleado?.id
                  );
                  return (
                    <div key={fiesta.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{cfg.nombreEvento || 'Sin nombre'}</span>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {fecha}
                        </Badge>
                      </div>
                      {asignaciones.map((a, i) => {
                        const rol = allRoles.find(r => r.id === a.rolId);
                        return (
                          <div key={i} className="flex items-center justify-between text-xs text-muted-foreground pl-1">
                            <span>{rol?.nombre || 'Rol desconocido'}</span>
                            <span className="font-mono">{formatCurrency(a.eventSalary)}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {!registroDialog.isLoading && registroDialog.fiestas.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-1">
                <Label htmlFor="registro-phone">Enviar resumen por WhatsApp</Label>
                <Input
                  id="registro-phone"
                  placeholder="Ej: 59899123456 (con código de país)"
                  value={registroDialog.summaryPhone}
                  onChange={e => setRegistroDialog(prev => ({ ...prev, summaryPhone: e.target.value }))}
                />
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={sendRegistroWhatsApp}>
                <Send className="w-4 h-4 mr-2" />
                Enviar resumen por WhatsApp
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegistroDialog(prev => ({ ...prev, open: false }))}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
