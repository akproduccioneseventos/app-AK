'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, Search, Download, Filter, Clock, Loader2, ArrowRight, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getAuditLogs } from '@/app/actions/audit-log';
import { getFinancialIntegrityReport } from '@/app/actions/financial-integrity';
import type { FinancialIntegrityReport } from '@/lib/commercial-flow/financial-integrity';
import type { AuditLog, ModuloSistema } from '@/types/audit-log';

const MODULOS: ModuloSistema[] = [
  'fiesta', 'presupuesto', 'invitados', 'catering', 'tareas', 'personal',
  'costos', 'documentos', 'decoracion', 'proveedores', 'sistema', 'playbook', 'aprobacion',
];

const moduloBadgeColor: Record<ModuloSistema, string> = {
  fiesta: 'bg-blue-100 text-blue-800',
  presupuesto: 'bg-green-100 text-green-800',
  invitados: 'bg-purple-100 text-purple-800',
  catering: 'bg-orange-100 text-orange-800',
  tareas: 'bg-yellow-100 text-yellow-800',
  personal: 'bg-pink-100 text-pink-800',
  costos: 'bg-red-100 text-red-800',
  documentos: 'bg-slate-100 text-slate-800',
  decoracion: 'bg-fuchsia-100 text-fuchsia-800',
  proveedores: 'bg-teal-100 text-teal-800',
  sistema: 'bg-gray-100 text-gray-800',
  playbook: 'bg-indigo-100 text-indigo-800',
  aprobacion: 'bg-amber-100 text-amber-800',
};

const formatDate = (ts: string) => {
  try {
    return new Date(ts).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return ts;
  }
};

const csvCell = (value: unknown) => {
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  return `"${text.replace(/"/g, '""')}"`;
};

function AuditoriaContent() {
  const searchParams = useSearchParams();
  const fiestaIdFromUrl = searchParams.get('fiestaId') ?? '';
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fiestaId: fiestaIdFromUrl,
    modulo: '' as ModuloSistema | '',
    desde: '',
    hasta: '',
  });
  const [search, setSearch] = useState('');
  const [financialReport, setFinancialReport] = useState<FinancialIntegrityReport | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({
        fiestaId: filters.fiestaId || undefined,
        modulo: filters.modulo || undefined,
        desde: filters.desde || undefined,
        hasta: filters.hasta || undefined,
      });
      setLogs(data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los logs de auditoría.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runFinancialAudit = async () => {
    setFinancialLoading(true);
    try {
      const result = await getFinancialIntegrityReport();
      if (!result.success || !result.report) throw new Error(result.error || 'No se pudo completar el control.');
      setFinancialReport(result.report);
      toast({
        title: result.report.counts.errors === 0 ? 'Control financiero correcto' : 'Control financiero completado',
        description: `${result.report.counts.errors} error(es) y ${result.report.counts.warnings} advertencia(s).`,
      });
    } catch (error) {
      toast({
        title: 'No se pudo revisar',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setFinancialLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Fecha', 'Usuario', 'Rol', 'Modulo', 'Accion', 'Descripcion', 'Valor antes', 'Valor despues'];
    const rows = filteredLogs.map((log) => [
      formatDate(log.timestamp),
      log.usuario,
      log.rolUsuario,
      log.modulo,
      log.accion,
      log.descripcion,
      log.valorAntes,
      log.valorDespues,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-ak-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ title: 'Exportacion lista', description: `${filteredLogs.length} registro(s) descargados en CSV.` });
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.usuario.toLowerCase().includes(term) ||
      log.accion.toLowerCase().includes(term) ||
      log.descripcion.toLowerCase().includes(term) ||
      log.modulo.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Registro de Auditoría</h1>
        </div>
        <p className="text-muted-foreground">
          Historial inmutable de todas las acciones realizadas en el sistema.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Control de numeros y vinculos
              </CardTitle>
              <CardDescription>
                Revisa presupuestos, pagos, facturas y fiestas con los datos actuales, sin modificarlos.
              </CardDescription>
            </div>
            <Button onClick={runFinancialAudit} disabled={financialLoading} size="sm">
              {financialLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
              Revisar ahora
            </Button>
          </div>
        </CardHeader>
        {financialReport && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div><p className="text-xs text-muted-foreground">Presupuestos</p><p className="text-xl font-semibold">{financialReport.counts.presupuestos}</p></div>
              <div><p className="text-xs text-muted-foreground">Facturas</p><p className="text-xl font-semibold">{financialReport.counts.facturas}</p></div>
              <div><p className="text-xs text-muted-foreground">Fiestas</p><p className="text-xl font-semibold">{financialReport.counts.fiestas}</p></div>
              <div><p className="text-xs text-muted-foreground">Errores</p><p className="text-xl font-semibold text-red-600">{financialReport.counts.errors}</p></div>
              <div><p className="text-xs text-muted-foreground">Advertencias</p><p className="text-xl font-semibold text-amber-600">{financialReport.counts.warnings}</p></div>
            </div>

            {financialReport.issues.length === 0 ? (
              <div className="flex items-center gap-2 border-t pt-4 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> No se detectaron diferencias contables ni vinculos rotos.
              </div>
            ) : (
              <div className="overflow-x-auto border-t pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialReport.issues.slice(0, 50).map((issue, index) => (
                      <TableRow key={`${issue.scope}-${issue.entityId}-${index}`}>
                        <TableCell>
                          <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'} className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> {issue.severity === 'error' ? 'Error' : 'Revisar'}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{issue.scope}</TableCell>
                        <TableCell className="font-mono text-xs">{issue.entityId}</TableCell>
                        <TableCell className="min-w-[280px] text-sm">
                          {issue.message}
                          {(issue.expected !== undefined || issue.actual !== undefined) && (
                            <span className="block text-xs text-muted-foreground">
                              Esperado: {String(issue.expected ?? '-')} | Guardado: {String(issue.actual ?? '-')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {financialReport.issues.length > 50 && (
                  <p className="pt-3 text-xs text-muted-foreground">Se muestran los primeros 50 de {financialReport.issues.length} hallazgos.</p>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">ID del Evento</label>
              <Input
                placeholder="fiesta_1234..."
                value={filters.fiestaId}
                onChange={(e) => setFilters(f => ({ ...f, fiestaId: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Módulo</label>
              <Select
                value={filters.modulo}
                onValueChange={(v) => setFilters(f => ({ ...f, modulo: v === 'todos' ? '' : v as ModuloSistema }))}
              >
                <SelectTrigger><SelectValue placeholder="Todos los módulos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los módulos</SelectItem>
                  {MODULOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={filters.desde}
                onChange={(e) => setFilters(f => ({ ...f, desde: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={filters.hasta}
                onChange={(e) => setFilters(f => ({ ...f, hasta: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={load} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar en resultados..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-10 w-10 mb-3 opacity-30" />
              <p>No se encontraron registros de auditoría.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Fecha</span>
                    </TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cambio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{log.usuario}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.rolUsuario}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${moduloBadgeColor[log.modulo]}`}>{log.modulo}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.accion}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{log.descripcion}</TableCell>
                      <TableCell className="text-xs">
                        {(log.valorAntes || log.valorDespues) && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <span className="truncate max-w-[60px]">{log.valorAntes || '—'}</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[60px] font-medium text-foreground">{log.valorDespues || '—'}</span>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-3 text-right">
        {filteredLogs.length} registro(s) encontrado(s)
      </p>
    </div>
  );
}

export default function AuditoriaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AuditoriaContent />
    </Suspense>
  );
}
