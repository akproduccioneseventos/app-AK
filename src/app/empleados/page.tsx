
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
import { Edit, Trash2, Loader2, UserPlus, Users, Settings2, AlertTriangle, Printer, ArrowLeft, MessageCircle, CalendarDays, Send, Phone, Mail, Download, History } from 'lucide-react';
import { getEmpleados, deleteEmpleado as deleteEmpleadoAction } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { getFiestasByEmpleado } from '@/app/actions/personal-fiestas';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
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
  summaryEmail: string;
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
    open: false, empleado: null, fiestas: [], isLoading: false, summaryPhone: '', summaryEmail: '',
  });
  const [historyLogoUrl, setHistoryLogoUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empleadosData, rolesData, settings] = await Promise.all([
        getEmpleados(),
        getRoles(),
        getInvoiceTemplateSettings(),
      ]);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setHistoryLogoUrl(settings.logoUrl ?? null);
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
    setPartiesDialog({
      open: true,
      empleado,
      fiestas: [],
      isLoading: true,
      summaryPhone: empleado.telefono ? sanitizePhone(empleado.telefono) : '',
      summaryEmail: empleado.email?.trim() || '',
    });
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

  const getPartiesRows = (fiestas: FiestaEnPlanificacion[], empleadoId?: string) => {
    if (!empleadoId) return [];
    return fiestas.flatMap(fiesta => {
      const cfg = fiesta.configuracion;
      const asignaciones = (fiesta.personalAsignado || []).filter(p => p.empleadoId === empleadoId);
      if (asignaciones.length === 0) {
        return [{
          id: `${fiesta.id}-sin-rol`,
          evento: cfg.nombreEvento || 'Evento sin nombre',
          fecha: formatEventDate(cfg.fechaEvento),
          lugar: cfg.nombreLugar || 'Lugar a confirmar',
          rol: 'Sin rol',
          monto: 0,
        }];
      }
      return asignaciones.map((asig, index) => {
        const rol = roles.find(r => r.id === asig.rolId);
        return {
          id: `${fiesta.id}-${index}`,
          evento: cfg.nombreEvento || 'Evento sin nombre',
          fecha: formatEventDate(cfg.fechaEvento),
          lugar: cfg.nombreLugar || 'Lugar a confirmar',
          rol: rol?.nombre || 'Rol desconocido',
          monto: asig.eventSalary || 0,
        };
      });
    });
  };

  const buildPartiesSummaryText = () => {
    const { empleado, fiestas } = partiesDialog;
    if (!empleado) return '';
    const rows = getPartiesRows(fiestas, empleado.id);
    const total = rows.reduce((sum, row) => sum + row.monto, 0);
    const lines = rows.map((row, i) => `${i + 1}. ${row.fecha} — ${row.evento} (${row.rol}) ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(row.monto)}`);
    return [
      `Empleado: ${empleado.nombre}`,
      `Cédula: ${empleado.cedula || '—'}`,
      '',
      ...lines,
      '',
      `Total acumulado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(total)}`,
    ].join('\n');
  };

  const sendPartiesByEmail = () => {
    const { empleado, summaryEmail } = partiesDialog;
    if (!empleado) return;
    const email = summaryEmail.trim();
    const emailValidator = document.createElement('input');
    emailValidator.type = 'email';
    emailValidator.value = email;
    if (!email || !emailValidator.checkValidity()) {
      toast({ title: 'Email inválido', description: 'Ingresá un email válido para enviar el historial.', variant: 'destructive' });
      return;
    }
    const subject = `Historial de eventos — ${empleado.nombre}`;
    const body = buildPartiesSummaryText();
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const printPartiesHistory = () => {
    const { empleado, fiestas } = partiesDialog;
    if (!empleado) return;
    const rows = getPartiesRows(fiestas, empleado.id);
    const total = rows.reduce((sum, row) => sum + row.monto, 0);

    const escapeHtml = (value: string) =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast({ title: 'No se pudo abrir la ventana de impresión', variant: 'destructive' });
      return;
    }

    const logoBlock = historyLogoUrl
      ? `<img src="${escapeHtml(historyLogoUrl)}" alt="AK Producciones" style="max-height:64px; max-width:180px;" />`
      : '<h2 style="margin:0;">AK Producciones</h2>';

    const tableRows = rows.map(row => `
      <tr>
        <td>${escapeHtml(row.evento)}</td>
        <td>${escapeHtml(row.fecha)}</td>
        <td>${escapeHtml(row.lugar)}</td>
        <td>${escapeHtml(row.rol)}</td>
        <td style="text-align:right">${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(row.monto)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Historial de eventos — ${escapeHtml(empleado.nombre)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 13px; }
            th { background: #f3f4f6; text-align: left; }
            tfoot td { font-weight: 700; background: #f9fafb; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoBlock}
            <div style="text-align:right">
              <h1 style="margin:0;font-size:20px;">Historial de eventos</h1>
              <p style="margin:2px 0 0;color:#4b5563;">${new Date().toLocaleDateString('es-UY')}</p>
            </div>
          </div>
          <p><strong>Empleado:</strong> ${escapeHtml(empleado.nombre)}</p>
          <p><strong>Cédula:</strong> ${escapeHtml(empleado.cedula || '—')}</p>
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Lugar</th>
                <th>Rol</th>
                <th style="text-align:right">Monto</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="4">Total acumulado</td>
                <td style="text-align:right">${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(total)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 150);
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
            <Link href="/empresa/empleados/reporte">
                <Button variant="secondary"><Printer className="w-4 h-4 mr-2"/>Ver Reporte de Personal</Button>
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
          <CardDescription>Consulta y gestiona la información de tu personal. Accedé al historial de fiestas y recibos firmados de cada empleado desde la tabla.</CardDescription>
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
                      <TableCell className="font-medium min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                            {empleado.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={empleado.photoUrl} alt={empleado.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-slate-400 text-xs font-bold">{empleado.nombre.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {empleado.nombre}
                        </div>
                      </TableCell>
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
                          <Link href={`/empleados/${empleado.id}/historial`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              title="Ver historial y recibos"
                              aria-label={`Historial de ${empleado.nombre}`}
                            >
                              <History className="w-4 h-4" />
                            </Button>
                          </Link>
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
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Lugar</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPartiesRows(partiesDialog.fiestas, partiesDialog.empleado?.id).map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.evento}</TableCell>
                        <TableCell>{row.fecha}</TableCell>
                        <TableCell>{row.lugar}</TableCell>
                        <TableCell>{row.rol}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(row.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          {!partiesDialog.isLoading && partiesDialog.fiestas.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium">Total acumulado</p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(
                      getPartiesRows(partiesDialog.fiestas, partiesDialog.empleado?.id).reduce((sum, row) => sum + row.monto, 0)
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="parties-email">Email para enviar historial</Label>
                  <Input
                    id="parties-email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={partiesDialog.summaryEmail}
                    onChange={e => setPartiesDialog(prev => ({ ...prev, summaryEmail: e.target.value }))}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={sendPartiesByEmail}>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar por Email
                  </Button>
                  <Button variant="outline" onClick={printPartiesHistory}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
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
