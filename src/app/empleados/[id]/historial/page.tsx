'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getEmpleadoById } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { getFiestasByEmpleado } from '@/app/actions/personal-fiestas';
import { getRecibosFirmadosByEmpleado, saveReciboFirmado } from '@/app/actions/recibos-personal';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import type { Empleado, ReciboFirmado } from '@/types/empleado';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Rol } from '@/types/rol';

type HistorialRow = {
  fiestaId: string;
  evento: string;
  fechaEvento?: string;
  tipoEvento: string;
  rol: string;
  montoBase: number;
  recibo?: ReciboFirmado;
};

type ReciboEditable = Pick<ReciboFirmado, 'id' | 'estado' | 'fecha' | 'monto' | 'notas' | 'archivoUrl' | 'archivoNombre'>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(value || 0);

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-UY');
};

export default function EmpleadoHistorialPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const empleadoId = params.id;

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [recibos, setRecibos] = useState<ReciboFirmado[]>([]);
  const [editableByFiesta, setEditableByFiesta] = useState<Record<string, ReciboEditable>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFiestaId, setIsSavingFiestaId] = useState<string | null>(null);
  const [isUploadingFiestaId, setIsUploadingFiestaId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'all' | ReciboFirmado['estado']>('all');

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empleadoData, rolesData, fiestasData, recibosData] = await Promise.all([
        getEmpleadoById(empleadoId),
        getRoles(),
        getFiestasByEmpleado(empleadoId),
        getRecibosFirmadosByEmpleado(empleadoId),
      ]);

      setEmpleado(empleadoData);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setFiestas(Array.isArray(fiestasData) ? fiestasData : []);
      setRecibos(Array.isArray(recibosData) ? recibosData : []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo cargar el historial.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [empleadoId, toast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const historialRows = useMemo<HistorialRow[]>(() => {
    return fiestas
      .flatMap((fiesta) => {
        const asignaciones = (fiesta.personalAsignado || []).filter((p) => p.empleadoId === empleadoId);
        if (asignaciones.length === 0) return [];

        const rolNombres = asignaciones
          .map((asig) => roles.find((r) => r.id === asig.rolId)?.nombre || 'Rol desconocido')
          .filter(Boolean);

        const montoBase = asignaciones.reduce((sum, asig) => sum + Number(asig.eventSalary || 0), 0);
        const recibo = recibos.find((item) => item.fiestaId === fiesta.id);

        return [{
          fiestaId: fiesta.id,
          evento: fiesta.configuracion?.nombreEvento || 'Evento sin nombre',
          fechaEvento: fiesta.configuracion?.fechaEvento,
          tipoEvento: fiesta.configuracion?.tipoCelebracion || '—',
          rol: rolNombres.join(', '),
          montoBase,
          recibo,
        }];
      })
      .sort((a, b) => new Date(b.fechaEvento || 0).getTime() - new Date(a.fechaEvento || 0).getTime());
  }, [empleadoId, fiestas, recibos, roles]);

  useEffect(() => {
    setEditableByFiesta((prev) => {
      const next = { ...prev };
      historialRows.forEach((row) => {
        next[row.fiestaId] = {
          id: row.recibo?.id || prev[row.fiestaId]?.id || '',
          estado: row.recibo?.estado || prev[row.fiestaId]?.estado || 'pendiente',
          fecha: row.recibo?.fecha || prev[row.fiestaId]?.fecha || '',
          monto: row.recibo?.monto ?? prev[row.fiestaId]?.monto ?? row.montoBase,
          notas: row.recibo?.notas || prev[row.fiestaId]?.notas || '',
          archivoUrl: row.recibo?.archivoUrl || prev[row.fiestaId]?.archivoUrl,
          archivoNombre: row.recibo?.archivoNombre || prev[row.fiestaId]?.archivoNombre,
        };
      });
      return next;
    });
  }, [historialRows]);

  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;

    return historialRows.filter((row) => {
      const editable = editableByFiesta[row.fiestaId];
      const estado = editable?.estado || 'pendiente';
      const rowTs = row.fechaEvento ? new Date(`${row.fechaEvento}T00:00:00`).getTime() : 0;
      const inDateRange = rowTs >= from && rowTs <= to;
      const statusMatch = estadoFilter === 'all' || estado === estadoFilter;
      return inDateRange && statusMatch;
    });
  }, [editableByFiesta, estadoFilter, fromDate, historialRows, toDate]);

  const totalCobrado = useMemo(
    () => filteredRows.reduce((sum, row) => sum + Number(editableByFiesta[row.fiestaId]?.monto ?? row.montoBase), 0),
    [editableByFiesta, filteredRows]
  );
  const promedio = filteredRows.length > 0 ? totalCobrado / filteredRows.length : 0;

  const updateEditable = (fiestaId: string, changes: Partial<ReciboEditable>) => {
    setEditableByFiesta((prev) => ({ ...prev, [fiestaId]: { ...prev[fiestaId], ...changes } }));
  };

  const saveRow = async (row: HistorialRow) => {
    const editable = editableByFiesta[row.fiestaId];
    if (!editable) return;
    setIsSavingFiestaId(row.fiestaId);
    try {
      const result = await saveReciboFirmado({
        id: editable.id || undefined,
        fiestaId: row.fiestaId,
        empleadoId,
        monto: Number(editable.monto || 0),
        fecha: editable.fecha || '',
        estado: editable.estado || 'pendiente',
        notas: editable.notas || '',
        archivoUrl: editable.archivoUrl,
        archivoNombre: editable.archivoNombre,
      });

      if (!result.success || !result.recibo) {
        throw new Error(result.error || 'No se pudo guardar el recibo.');
      }

      setRecibos((prev) => {
        const withoutCurrent = prev.filter((item) => item.fiestaId !== row.fiestaId);
        return [...withoutCurrent, result.recibo!];
      });
      updateEditable(row.fiestaId, result.recibo);
      toast({ title: 'Recibo guardado', description: `Se actualizó el recibo de ${row.evento}.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar.', variant: 'destructive' });
    } finally {
      setIsSavingFiestaId(null);
    }
  };

  const uploadAndSaveSignedReceipt = async (row: HistorialRow, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const editable = editableByFiesta[row.fiestaId];
    if ((editable?.estado || 'pendiente') !== 'pagado') {
      toast({ title: 'Estado requerido', description: 'Primero marcá el recibo como "pagado".', variant: 'destructive' });
      return;
    }

    setIsUploadingFiestaId(row.fiestaId);
    try {
      const formData = new FormData();
      formData.append('fiestaId', `personal-recibos/${empleadoId}`);
      formData.append('file', file);
      const uploadResult = await uploadPublicPageAsset(formData);
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'No se pudo subir el archivo.');
      }

      const saveResult = await saveReciboFirmado({
        id: editable?.id || undefined,
        fiestaId: row.fiestaId,
        empleadoId,
        monto: Number(editable?.monto ?? row.montoBase),
        fecha: editable?.fecha || '',
        estado: 'firmado_subido',
        notas: editable?.notas || '',
        archivoUrl: uploadResult.url,
        archivoNombre: file.name,
      });

      if (!saveResult.success || !saveResult.recibo) {
        throw new Error(saveResult.error || 'No se pudo guardar el recibo firmado.');
      }

      setRecibos((prev) => {
        const withoutCurrent = prev.filter((item) => item.fiestaId !== row.fiestaId);
        return [...withoutCurrent, saveResult.recibo!];
      });
      updateEditable(row.fiestaId, saveResult.recibo);
      toast({ title: 'Recibo firmado subido', description: 'El archivo quedó asociado al evento.' });
    } catch (error: any) {
      toast({ title: 'Error de subida', description: error.message || 'No se pudo subir el archivo.', variant: 'destructive' });
    } finally {
      setIsUploadingFiestaId(null);
    }
  };

  const exportPrintable = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=780');
    if (!printWindow) {
      toast({ title: 'No se pudo abrir la ventana de impresión', description: 'Habilitá popups para exportar el historial.', variant: 'destructive' });
      return;
    }

    const escapeHtml = (value: string) =>
      value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

    const rowsHtml = filteredRows
      .map((row, index) => {
        const editable = editableByFiesta[row.fiestaId];
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(row.evento)}</td>
            <td>${escapeHtml(formatDate(row.fechaEvento))}</td>
            <td>${escapeHtml(String(row.tipoEvento || '—'))}</td>
            <td>${escapeHtml(row.rol)}</td>
            <td style="text-align:right">${escapeHtml(formatCurrency(Number(editable?.monto ?? row.montoBase)))}</td>
            <td>${escapeHtml(formatDate(editable?.fecha))}</td>
            <td>${escapeHtml(editable?.estado || 'pendiente')}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Historial de ${escapeHtml(empleado?.nombre || 'Empleado')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 6px; }
            p { margin: 0 0 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f3f4f6; }
            .totals { margin-top: 12px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>AK Producciones — Historial y Recibos de Personal</h1>
          <p><strong>Empleado:</strong> ${escapeHtml(empleado?.nombre || '—')}</p>
          <p><strong>Total fiestas:</strong> ${filteredRows.length}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Rol</th>
                <th>Monto</th>
                <th>Fecha pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <p class="totals">Total cobrado: ${escapeHtml(formatCurrency(totalCobrado))}</p>
          <p class="totals">Promedio por fiesta: ${escapeHtml(formatCurrency(promedio))}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!empleado) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">No se encontró el empleado solicitado.</p>
        <Link href="/empleados">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Personal</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-headline">Historial y recibos — {empleado.nombre}</h1>
          <p className="text-sm text-muted-foreground">Fiestas trabajadas, estados de cobro y recibos firmados por evento.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportPrintable}>
            <Download className="w-4 h-4 mr-2" />
            Exportar / Imprimir
          </Button>
          <Link href="/empleados">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total fiestas trabajadas</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{filteredRows.length}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total cobrado</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(totalCobrado)}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Promedio por fiesta</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(promedio)}</CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fromDate">Desde</Label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="toDate">Hasta</Label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Estado del recibo</Label>
              <Select value={estadoFilter} onValueChange={(value) => setEstadoFilter(value as 'all' | ReciboFirmado['estado'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="firmado_subido">Con recibo firmado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          {filteredRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No hay eventos para los filtros seleccionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Recibo firmado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    const editable = editableByFiesta[row.fiestaId];
                    const status = editable?.estado || 'pendiente';
                    const fileUrl = editable?.archivoUrl;
                    const fileName = editable?.archivoNombre || 'Archivo';
                    return (
                      <TableRow key={row.fiestaId}>
                        <TableCell className="font-medium">{row.evento}</TableCell>
                        <TableCell>{formatDate(row.fechaEvento)}</TableCell>
                        <TableCell>{String(row.tipoEvento || '—')}</TableCell>
                        <TableCell>{row.rol}</TableCell>
                        <TableCell className="min-w-[130px]">
                          <Input
                            type="number"
                            min={0}
                            value={editable?.monto ?? row.montoBase}
                            onChange={(e) => updateEditable(row.fiestaId, { monto: Number(e.target.value || 0) })}
                          />
                        </TableCell>
                        <TableCell className="min-w-[130px]">
                          <Input
                            type="date"
                            value={editable?.fecha || ''}
                            onChange={(e) => updateEditable(row.fiestaId, { fecha: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <Select
                            value={status}
                            onValueChange={(value) => updateEditable(row.fiestaId, { estado: value as ReciboFirmado['estado'] })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="pagado">Pagado</SelectItem>
                              <SelectItem value="firmado_subido">Con recibo firmado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {fileUrl ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 text-sm">
                              {fileName}
                            </a>
                          ) : (
                            <Badge variant="outline">Sin archivo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(status === 'pagado' || status === 'firmado_subido') && (
                              <label className="inline-flex">
                                  <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*,.pdf"
                                  onChange={(e) => uploadAndSaveSignedReceipt(row, e)}
                                />
                                <span className="inline-flex">
                                  <Button variant="outline" size="sm" disabled={isUploadingFiestaId === row.fiestaId}>
                                    {isUploadingFiestaId === row.fiestaId ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4 mr-2" />
                                    )}
                                    {fileUrl ? 'Reemplazar' : 'Subir firmado'}
                                  </Button>
                                </span>
                              </label>
                            )}
                            <Button size="sm" onClick={() => saveRow(row)} disabled={isSavingFiestaId === row.fiestaId}>
                              {isSavingFiestaId === row.fiestaId && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Guardar
                            </Button>
                          </div>
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
    </div>
  );
}
