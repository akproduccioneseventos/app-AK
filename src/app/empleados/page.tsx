
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Loader2, UserPlus, Users, Settings2, AlertTriangle, Printer, ArrowLeft, MessageCircle, CalendarDays, Send, History, Phone } from 'lucide-react';
import { getEmpleados, deleteEmpleado as deleteEmpleadoAction } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { getFiestasByEmpleado } from '@/app/actions/personal-fiestas';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { useToast } from '@/hooks/use-toast';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const formatEventDate = (fechaEvento?: string) => {
  if (!fechaEvento) return 'Sin fecha';
  return new Date(fechaEvento + 'T00:00:00').toLocaleDateString('es-UY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const sanitizePhone = (raw: string) => raw.replace(/\D/g, '');

interface WhatsAppDialogState {
  open: boolean;
  empleado: Empleado | null;
  phone: string;
  message: string;
}

interface PartiesDialogState {
  open: boolean;
  empleado: Empleado | null;
  fiestas: FiestaEnPlanificacion[];
  isLoading: boolean;
  summaryPhone: string;
}

export default function EmpleadosPage() {
  const { toast } = useToast();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [whatsAppDialog, setWhatsAppDialog] = useState<WhatsAppDialogState>({
    open: false, empleado: null, phone: '', message: '',
  });

  const [partiesDialog, setPartiesDialog] = useState<PartiesDialogState>({
    open: false, empleado: null, fiestas: [], isLoading: false, summaryPhone: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empleadosData, rolesData] = await Promise.all([
        getEmpleados(),
        getRoles()
      ]);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err: any) {
      setError("No se pudieron cargar los datos de empleados o roles.");
      toast({ title: "Error de Carga", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string, nombre?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteEmpleadoAction(id);
      if (result.success) {
        toast({ title: "Empleado Eliminado", description: `El empleado "${nombre || id}" ha sido eliminado.` });
        await fetchData();
      } else {
        throw new Error(result.error || "Error desconocido al eliminar.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const openWhatsApp = (empleado: Empleado) => {
    const phone = empleado.telefono ? sanitizePhone(empleado.telefono) : '';
    const message = `¡Hola ${empleado.nombre}! Te contactamos desde AK Producciones.`;
    setWhatsAppDialog({ open: true, empleado, phone, message });
  };

  const sendWhatsApp = () => {
    const phone = sanitizePhone(whatsAppDialog.phone);
    if (!phone) {
      toast({ title: 'Teléfono requerido', description: 'Ingresá el número de WhatsApp del empleado.', variant: 'destructive' });
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppDialog.message)}`;
    window.open(url, '_blank');
    setWhatsAppDialog(prev => ({ ...prev, open: false }));
    toast({ title: '✅ WhatsApp abierto', description: `Se abrió WhatsApp para ${whatsAppDialog.empleado?.nombre}.` });
  };

  const openPartiesReport = async (empleado: Empleado) => {
    setPartiesDialog({ open: true, empleado, fiestas: [], isLoading: true, summaryPhone: empleado.telefono ? sanitizePhone(empleado.telefono) : '' });
    try {
      const fiestas = await getFiestasByEmpleado(empleado.id);
      setPartiesDialog(prev => ({ ...prev, fiestas, isLoading: false }));
    } catch {
      setPartiesDialog(prev => ({ ...prev, isLoading: false }));
      toast({ title: 'Error', description: 'No se pudo cargar el historial de eventos.', variant: 'destructive' });
    }
  };

  const sendPartiesSummary = () => {
    const { empleado, fiestas, summaryPhone } = partiesDialog;
    if (!empleado) return;
    const phone = sanitizePhone(summaryPhone);
    if (!phone) {
      toast({ title: 'Teléfono requerido', description: 'Ingresá el número de WhatsApp del empleado.', variant: 'destructive' });
      return;
    }

    const confirmedFiestas = fiestas.filter(f => f.configuracion.fechaEvento);
    const lines = confirmedFiestas.map((f, i) => {
      const cfg = f.configuracion;
      const fecha = formatEventDate(cfg.fechaEvento);
      const asignaciones = (f.personalAsignado || [])
        .filter(p => p.empleadoId === empleado.id)
        .map(p => {
          const rol = roles.find(r => r.id === p.rolId);
          return `  • ${rol?.nombre || 'Rol desconocido'} — $${p.eventSalary?.toLocaleString('es-UY') || '0'}`;
        }).join('\n');
      return `${i + 1}. *${cfg.nombreEvento || 'Evento sin nombre'}*\n   📅 ${fecha}\n   📍 ${cfg.nombreLugar || 'Lugar a confirmar'}${asignaciones ? '\n' + asignaciones : ''}`;
    });

    const message = `¡Hola ${empleado.nombre}! 👋\n\nAcá tenés el resumen de tus próximos eventos confirmados con AK Producciones:\n\n${lines.join('\n\n') || 'Sin eventos próximos registrados.'}\n\n¡Cualquier duda, avisanos! 🎉`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setPartiesDialog(prev => ({ ...prev, open: false }));
    toast({ title: '✅ Resumen enviado', description: `Se abrió WhatsApp para enviar el resumen a ${empleado.nombre}.` });
  };

  const getRolNames = (rolIds?: string[]): string => {
    if (!rolIds || rolIds.length === 0) return 'Sin Rol Asignado';
    return rolIds
      .map(rolId => roles.find(r => r.id === rolId)?.nombre)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Gestión de Personal
            </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Link href="/empleados/reporte">
                <Button variant="secondary"><Printer className="w-4 h-4 mr-2"/>Ver Reporte</Button>
            </Link>
            <Link href="/empleados/roles">
                <Button variant="outline">
                    <Settings2 className="w-5 h-5 mr-2" />
                    Configurar Roles
                </Button>
            </Link>
            <Link href="/empleados/nuevo">
              <Button>
                <UserPlus className="w-5 h-5 mr-2" />
                Añadir Empleado
              </Button>
            </Link>
            <Link href="/empresa">
                <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Empresa</Button>
            </Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Listado de Empleados ({empleados.length})</CardTitle>
          <CardDescription>Consulta y gestiona la información de tu personal. Usá los botones para ver sus fiestas asignadas o enviarles WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando empleados...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Error al Cargar Empleados</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : empleados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Roles Asignados</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleados.map((empleado) => (
                    <TableRow key={empleado.id}>
                      <TableCell className="font-medium min-w-[180px]">{empleado.nombre}</TableCell>
                      <TableCell className="min-w-[120px]">{empleado.cedula || '—'}</TableCell>
                      <TableCell className="min-w-[130px]">
                        {empleado.telefono ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {empleado.telefono}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin teléfono</span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex flex-wrap gap-1">
                           {(empleado.rolIds && empleado.rolIds.length > 0) ? empleado.rolIds.map(rolId => {
                               const rol = roles.find(r => r.id === rolId);
                               return rol ? <Badge key={rolId} variant="secondary">{rol.nombre}</Badge> : null;
                           }) : <span className="text-xs text-muted-foreground">Sin Rol</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right min-w-[180px]">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Ver fiestas asignadas"
                            onClick={() => openPartiesReport(empleado)}
                          >
                            <CalendarDays className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Enviar WhatsApp"
                            onClick={() => openWhatsApp(empleado)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Link href={`/empleados/${empleado.id}/editar`}>
                            <Button variant="outline" size="icon" className="h-8 w-8" aria-label={`Editar ${empleado.nombre}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8" aria-label={`Eliminar ${empleado.nombre}`} disabled={deletingId === empleado.id}>
                                {deletingId === empleado.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El empleado "{empleado.nombre}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(empleado.id, empleado.nombre)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
                                  {deletingId === empleado.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No tenés empleados registrados todavía.</p>
              <Link href="/empleados/nuevo">
                <Button className="mt-6">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Añadir Primer Empleado
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsAppDialog.open} onOpenChange={open => setWhatsAppDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Enviar mensaje por WhatsApp — {whatsAppDialog.empleado?.nombre}
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
              <p className="text-xs text-muted-foreground">Incluí el código de país (ej: 598 para Uruguay).</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="wa-message">Mensaje</Label>
              <Textarea
                id="wa-message"
                rows={4}
                value={whatsAppDialog.message}
                onChange={e => setWhatsAppDialog(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
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

      {/* Parties Report Dialog */}
      <Dialog open={partiesDialog.open} onOpenChange={open => setPartiesDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Fiestas asignadas — {partiesDialog.empleado?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-96 overflow-y-auto">
            {partiesDialog.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Cargando historial...</p>
              </div>
            ) : partiesDialog.fiestas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay fiestas asignadas a este empleado.</p>
            ) : (
              partiesDialog.fiestas.map(fiesta => {
                const cfg = fiesta.configuracion;
                const asignaciones = (fiesta.personalAsignado || []).filter(p => p.empleadoId === partiesDialog.empleado?.id);
                return (
                  <div key={fiesta.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-base">{cfg.nombreEvento || 'Evento sin nombre'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatEventDate(cfg.fechaEvento)}
                        </p>
                        {cfg.nombreLugar && (
                          <p className="text-sm text-muted-foreground">📍 {cfg.nombreLugar}</p>
                        )}
                      </div>
                      <Badge variant={fiesta.estado === 'Confirmada' ? 'default' : 'secondary'}>
                        {fiesta.estado || 'En planificación'}
                      </Badge>
                    </div>
                    {asignaciones.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {asignaciones.map((asig, i) => {
                          const rol = roles.find(r => r.id === asig.rolId);
                          return (
                            <span key={i} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                              {rol?.nombre || 'Rol desconocido'} — ${asig.eventSalary?.toLocaleString('es-UY') || '0'}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {!partiesDialog.isLoading && partiesDialog.fiestas.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium">Enviar resumen por WhatsApp</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: 59899123456 (con código de país)"
                    value={partiesDialog.summaryPhone}
                    onChange={e => setPartiesDialog(prev => ({ ...prev, summaryPhone: e.target.value }))}
                    className="flex-1"
                  />
                  <Button className="bg-green-600 hover:bg-green-700 text-white shrink-0" onClick={sendPartiesSummary}>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartiesDialog(prev => ({ ...prev, open: false }))}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
