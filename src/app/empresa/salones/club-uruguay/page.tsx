'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Star,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestas } from '@/app/actions/fiesta-actual';
import { isClubUruguay } from '@/lib/club-uruguay';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString(
      'es-UY',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    );
  } catch {
    return dateStr;
  }
}

function estadoBadge(estado?: string) {
  const map: Record<string, string> = {
    'En Planificación': 'bg-blue-100 text-blue-700',
    Confirmado: 'bg-green-100 text-green-700',
    Realizado: 'bg-slate-100 text-slate-600',
    Cancelado: 'bg-red-100 text-red-600',
  };
  const cls = (estado && map[estado]) || 'bg-slate-100 text-slate-500';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{estado || 'Sin estado'}</span>;
}

function exportCSV(fiestas: FiestaEnPlanificacion[]) {
  const header = ['Cliente', 'Evento', 'Tipo', 'Fecha', 'Estado', 'Invitados'];
  const rows = fiestas.map((f) => [
    f.configuracion.clienteNombre || f.configuracion.nombreEvento || '',
    f.configuracion.nombreEvento || '',
    f.configuracion.tipoCelebracion || '',
    formatDate(f.configuracion.fechaEvento),
    f.estado || '',
    String(f.configuracion.invitadosEstimados || 0),
  ]);
  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'club-uruguay-fiestas.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClubUruguayPage() {
  const { toast } = useToast();
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiestas = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getFiestas(true);
      const cu = all.filter((f) => isClubUruguay(f.configuracion.nombreLugar));
      setFiestas(cu);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las fiestas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFiestas();
  }, [fetchFiestas]);

  const proximas = useMemo(
    () => {
      const today = new Date();
      return fiestas
        .filter((f) => {
          if (!f.configuracion.fechaEvento) return false;
          return new Date(f.configuracion.fechaEvento) >= today;
        })
        .sort(
          (a, b) =>
            new Date(a.configuracion.fechaEvento!).getTime() -
            new Date(b.configuracion.fechaEvento!).getTime()
        );
    },
    [fiestas]
  );

  const realizadas = useMemo(
    () =>
      fiestas.filter((f) => {
        const today = new Date();
        if (!f.configuracion.fechaEvento) return true;
        return new Date(f.configuracion.fechaEvento) < today;
      }),
    [fiestas]
  );

  const countByTipo = useMemo(() => {
    const map: Record<string, number> = {};
    fiestas.forEach((f) => {
      const tipo = f.configuracion.tipoCelebracion || 'Otro';
      map[tipo] = (map[tipo] || 0) + 1;
    });
    return map;
  }, [fiestas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/30">
            <Star className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Club Uruguay</h1>
            <p className="text-sm text-muted-foreground">
              Dashboard de eventos y documentación del Club Uruguay
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => exportCSV(fiestas)}
            disabled={isLoading || fiestas.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Lista (CSV)
          </Button>
          <Link href="/empresa/salones">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Salones
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-amber-100 bg-amber-50/50">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-amber-600">Total fiestas</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-4xl font-black text-amber-700">{fiestas.length}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-100 bg-blue-50/50">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-blue-600">Próximos eventos</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-4xl font-black text-blue-700">{proximas.length}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-100">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500">Realizados</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-4xl font-black text-slate-700">{realizadas.length}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-100">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500">Tipos de evento</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-4xl font-black text-slate-700">{Object.keys(countByTipo).length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tipo breakdown */}
          {Object.keys(countByTipo).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-base">Conteo por Tipo de Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(countByTipo)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tipo, count]) => (
                      <Badge key={tipo} variant="secondary" className="text-sm px-3 py-1">
                        {tipo}: <span className="ml-1 font-black">{count}</span>
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proximos events */}
          {proximas.length > 0 && (
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="font-headline text-base flex items-center gap-2 text-blue-700">
                  <CalendarDays className="w-4 h-4" />
                  Próximos Eventos en Club Uruguay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente / Evento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Invitados</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proximas.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-semibold">
                            {f.configuracion.clienteNombre || f.configuracion.nombreEvento}
                          </TableCell>
                          <TableCell>{f.configuracion.tipoCelebracion || '—'}</TableCell>
                          <TableCell>{formatDate(f.configuracion.fechaEvento)}</TableCell>
                          <TableCell>{estadoBadge(f.estado)}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {f.configuracion.invitadosEstimados || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link href={`/fiestas/nueva/resumen-planificacion?fiestaId=${f.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Ver
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All fiestas with documentation links */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Todas las Contrataciones — Documentación
              </CardTitle>
              <CardDescription>
                Accesos directos a contratos, recibos y documentos de cada evento del Club Uruguay.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fiestas.length === 0 ? (
                <div className="py-12 text-center">
                  <Star className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No hay fiestas registradas en Club Uruguay todavía.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Las fiestas aparecerán aquí cuando se asigne &quot;Club Uruguay&quot; como lugar en la configuración del evento.
                  </p>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {fiestas
                    .sort((a, b) => {
                      const dateA = a.configuracion.fechaEvento
                        ? new Date(a.configuracion.fechaEvento).getTime()
                        : 0;
                      const dateB = b.configuracion.fechaEvento
                        ? new Date(b.configuracion.fechaEvento).getTime()
                        : 0;
                      return dateB - dateA;
                    })
                    .map((f) => (
                      <AccordionItem
                        key={f.id}
                        value={f.id}
                        className="border rounded-xl px-4 data-[state=open]:border-amber-200 data-[state=open]:bg-amber-50/30"
                      >
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <div>
                              <p className="font-bold text-sm text-slate-800">
                                {f.configuracion.clienteNombre || f.configuracion.nombreEvento}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {f.configuracion.tipoCelebracion} · {formatDate(f.configuracion.fechaEvento)}
                              </p>
                            </div>
                            {estadoBadge(f.estado)}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pb-3 pt-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Link href={`/fiestas/nueva/resumen-planificacion?fiestaId=${f.id}`}>
                              <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                                <ExternalLink className="w-3 h-3 mr-1.5" />
                                Ver Evento
                              </Button>
                            </Link>
                            <Link href={`/fiestas/nueva/gestion-documental/contrato-salon?fiestaId=${f.id}`}>
                              <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                                <FileText className="w-3 h-3 mr-1.5" />
                                Contrato del Salón
                              </Button>
                            </Link>
                            <Link href={`/fiestas/nueva/gestion-documental/recibo-pago?fiestaId=${f.id}`}>
                              <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                                <FileText className="w-3 h-3 mr-1.5" />
                                Recibo de Pago
                              </Button>
                            </Link>
                            <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${f.id}`}>
                              <Button variant="outline" size="sm" className="w-full text-xs h-8 justify-start">
                                <FileText className="w-3 h-3 mr-1.5" />
                                Gestión Documental
                              </Button>
                            </Link>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
