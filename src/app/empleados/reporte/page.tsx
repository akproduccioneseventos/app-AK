'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Loader2, AlertTriangle, Info, Eye, Download, Mail, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type EmpleadoHistorialItem = {
  fiestaId: string;
  nombreEvento: string;
  fecha: string;
  lugar: string;
  rol: string;
  montoCobrado: number;
  aportesPatronales: number;
  totalConAportes: number;
  timestamp: number;
};

type EmpleadoResumen = {
  empleado: Empleado;
  historial: EmpleadoHistorialItem[];
  totalFiestas: number;
  totalCobrado: number;
  totalConAportes: number;
  ultimoEvento: string;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 });

const parseDateParts = (date?: string) => {
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
};

const getDateTimestamp = (date?: string) => {
  const parsed = parseDateParts(date);
  if (!parsed) return 0;
  return Date.UTC(parsed.year, parsed.month - 1, parsed.day);
};

const formatDate = (date?: string) => {
  if (!date) return '—';
  const timestamp = getDateTimestamp(date);
  if (!timestamp) return '—';
  return new Intl.DateTimeFormat('es-UY', { timeZone: 'UTC' }).format(new Date(timestamp));
};

const sanitizePhone = (raw?: string) => (raw || '').replace(/\D/g, '');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export default function ReporteEmpleadosPage() {
  const { toast } = useToast();
  const [allItems, setAllItems] = useState<Empleado[]>([]);
  const [allRoles, setAllRoles] = useState<Rol[]>([]);
  const [allFiestas, setAllFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empleadosData, rolesData, fiestasData] = await Promise.all([
        getEmpleados(),
        getRoles(),
        getAllFiestas(),
      ]);
      setAllItems(Array.isArray(empleadosData) ? empleadosData : []);
      setAllRoles(Array.isArray(rolesData) ? rolesData : []);
      setAllFiestas(Array.isArray(fiestasData) ? fiestasData : []);
    } catch (err: any) {
      setError("No se pudo cargar la información del reporte de personal.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const getRolNames = (rolIds?: string[]) => {
    if (!rolIds || rolIds.length === 0) return 'Sin roles';
    return rolIds.map(id => allRoles.find(r => r.id === id)?.nombre || 'Desconocido').join(', ');
  };

  const resumenes = useMemo<EmpleadoResumen[]>(() => {
    return allItems.map((empleado) => {
      const historial = allFiestas.flatMap((fiesta) => {
        const asignaciones = (fiesta.personalAsignado || []).filter((p) => p.empleadoId === empleado.id);
        if (asignaciones.length === 0) return [];

        return asignaciones.map((asignacion) => {
          const rol = allRoles.find((r) => r.id === asignacion.rolId);
          const montoCobrado = Number(asignacion.eventSalary || 0);
          const aportesPatronales = (montoCobrado * Number(rol?.porcentajeAportesPatronales || 0)) / 100;
          const fecha = fiesta.configuracion?.fechaEvento || '';

          return {
            fiestaId: fiesta.id,
            nombreEvento: fiesta.configuracion?.nombreEvento || 'Evento sin nombre',
            fecha,
            lugar: fiesta.configuracion?.nombreLugar || '—',
            rol: rol?.nombre || 'Rol desconocido',
            montoCobrado,
            aportesPatronales,
            totalConAportes: montoCobrado + aportesPatronales,
            timestamp: getDateTimestamp(fecha),
          };
        });
      }).sort((a, b) => b.timestamp - a.timestamp);

      const totalCobrado = historial.reduce((sum, item) => sum + item.montoCobrado, 0);
      const totalConAportes = historial.reduce((sum, item) => sum + item.totalConAportes, 0);

      return {
        empleado,
        historial,
        totalFiestas: historial.length,
        totalCobrado,
        totalConAportes,
        ultimoEvento: historial[0]?.fecha || '',
      };
    });
  }, [allFiestas, allItems, allRoles]);

  const selectedResumen = useMemo(
    () => resumenes.find((item) => item.empleado.id === selectedEmpleadoId) || null,
    [resumenes, selectedEmpleadoId]
  );

  const handleDownloadPDF = (resumen: EmpleadoResumen) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Error', description: 'No se pudo abrir la ventana de impresión.', variant: 'destructive' });
      return;
    }

    const rowsHtml = resumen.historial.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.nombreEvento)}</td>
        <td>${escapeHtml(formatDate(item.fecha))}</td>
        <td>${escapeHtml(item.lugar)}</td>
        <td>${escapeHtml(item.rol)}</td>
        <td>${escapeHtml(formatCurrency(item.montoCobrado))}</td>
        <td>${escapeHtml(formatCurrency(item.aportesPatronales))}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Historial ${escapeHtml(resumen.empleado.nombre)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
          h1 { margin: 0 0 8px; color: #4f46e5; }
          h2 { margin: 0 0 8px; }
          p { margin: 0 0 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #6366f1; color: white; }
          .total { font-weight: bold; background: #f3f4f6; padding: 8px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <h1>AK Producciones — Historial de Personal</h1>
        <h2>${escapeHtml(resumen.empleado.nombre)}</h2>
        <p>C.I.: ${escapeHtml(resumen.empleado.cedula || '—')}</p>
        <p>Roles: ${escapeHtml(getRolNames(resumen.empleado.rolIds))}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre del Evento</th>
              <th>Fecha</th>
              <th>Lugar</th>
              <th>Rol</th>
              <th>Monto Cobrado</th>
              <th>Aportes Patronales</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <p class="total">Total fiestas: ${resumen.totalFiestas}</p>
        <p class="total">Total cobrado: ${escapeHtml(formatCurrency(resumen.totalCobrado))}</p>
        <p class="total">Total con aportes: ${escapeHtml(formatCurrency(resumen.totalConAportes))}</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSendEmail = (resumen: EmpleadoResumen) => {
    const email = (resumen.empleado.email || '').trim();
    if (email.length === 0) {
      toast({ title: 'Email requerido', description: 'El empleado no tiene email cargado.', variant: 'destructive' });
      return;
    }
    const subject = `Historial de trabajo - ${resumen.empleado.nombre}`;
    const bodyLines = [
      `Empleado: ${resumen.empleado.nombre}`,
      `Cédula: ${resumen.empleado.cedula || '—'}`,
      `Roles: ${getRolNames(resumen.empleado.rolIds)}`,
      '',
      `Total de fiestas: ${resumen.totalFiestas}`,
      `Total cobrado: ${formatCurrency(resumen.totalCobrado)}`,
      `Total con aportes: ${formatCurrency(resumen.totalConAportes)}`,
      '',
      'Detalle por fiesta:',
      ...resumen.historial.map((item, index) =>
        `${index + 1}. ${item.nombreEvento} | ${formatDate(item.fecha)} | ${item.lugar} | ${item.rol} | ${formatCurrency(item.montoCobrado)}`
      ),
    ];
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  };

  const handleSendWhatsApp = (resumen: EmpleadoResumen) => {
    const phone = sanitizePhone(resumen.empleado.telefono);
    if (!phone) {
      toast({ title: 'Teléfono requerido', description: 'El empleado no tiene teléfono cargado.', variant: 'destructive' });
      return;
    }
    const message = [
      `Hola ${resumen.empleado.nombre},`,
      '',
      'Te compartimos tu historial de AK Producciones:',
      `• Total de fiestas: ${resumen.totalFiestas}`,
      `• Total cobrado: ${formatCurrency(resumen.totalCobrado)}`,
      `• Total con aportes: ${formatCurrency(resumen.totalConAportes)}`,
    ].join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Error al Generar Reporte</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Link href="/empleados">
            <Button variant="outline" className="mt-4">Volver</Button>
          </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold font-headline">Reporte completo de personal</h1>
        </div>
        <Link href="/empleados">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Personal</Button>
        </Link>
      </div>

      {resumenes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border rounded-lg">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay personal registrado para generar el reporte.</p>
        </div>
      ) : (
        <Table>
          <TableCaption>Vista general de todo el personal y sus fiestas trabajadas.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Total fiestas</TableHead>
              <TableHead>Total cobrado</TableHead>
              <TableHead>Último evento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resumenes.map((item) => (
              <TableRow key={item.empleado.id}>
                <TableCell className="font-medium">{item.empleado.nombre}</TableCell>
                <TableCell>{item.empleado.cedula || '—'}</TableCell>
                <TableCell>{item.totalFiestas}</TableCell>
                <TableCell>{formatCurrency(item.totalCobrado)}</TableCell>
                <TableCell>{formatDate(item.ultimoEvento)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedEmpleadoId(item.empleado.id)}>
                    <Eye className="w-4 h-4 mr-1.5" />
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!selectedResumen} onOpenChange={(open) => !open && setSelectedEmpleadoId(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              Historial de {selectedResumen?.empleado.nombre}
            </DialogTitle>
          </DialogHeader>

          {selectedResumen && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p><span className="font-semibold">C.I.:</span> {selectedResumen.empleado.cedula || '—'}</p>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="font-semibold">Roles:</span>
                  {(selectedResumen.empleado.rolIds || []).length > 0 ? (
                    selectedResumen.empleado.rolIds?.map((rolId) => {
                      const rol = allRoles.find((r) => r.id === rolId);
                      return rol ? <Badge key={rolId} variant="secondary">{rol.nombre}</Badge> : null;
                    })
                  ) : (
                    <span className="text-muted-foreground">Sin roles</span>
                  )}
                </div>
              </div>

              {selectedResumen.historial.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md p-6 text-center">
                  Este empleado todavía no tiene fiestas trabajadas.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Nombre del Evento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Lugar</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Monto Cobrado</TableHead>
                      <TableHead>Aportes Patronales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedResumen.historial.map((fiesta, index) => (
                      <TableRow key={`${fiesta.fiestaId}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{fiesta.nombreEvento}</TableCell>
                        <TableCell>{formatDate(fiesta.fecha)}</TableCell>
                        <TableCell>{fiesta.lugar}</TableCell>
                        <TableCell>{fiesta.rol}</TableCell>
                        <TableCell>{formatCurrency(fiesta.montoCobrado)}</TableCell>
                        <TableCell>{formatCurrency(fiesta.aportesPatronales)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="rounded-md bg-muted p-3 text-sm">
                <p><span className="font-semibold">Total fiestas:</span> {selectedResumen.totalFiestas}</p>
                <p><span className="font-semibold">Total cobrado:</span> {formatCurrency(selectedResumen.totalCobrado)}</p>
                <p><span className="font-semibold">Total con aportes:</span> {formatCurrency(selectedResumen.totalConAportes)}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {selectedResumen && (
              <>
                <Button variant="outline" onClick={() => handleDownloadPDF(selectedResumen)}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button variant="outline" onClick={() => handleSendEmail(selectedResumen)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar por Email
                </Button>
                <Button variant="outline" onClick={() => handleSendWhatsApp(selectedResumen)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar por WhatsApp
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => setSelectedEmpleadoId(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
