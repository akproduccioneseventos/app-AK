'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  PartyPopper,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
  FileText,
  BadgeCheck,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getAtraccionFiestasReport,
  type FiestaAtraccionItem,
  type FiestaAtraccionReportResponse,
} from '@/app/actions/crm';

export default function AtraccionPorFiestaPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [report, setReport] = useState<FiestaAtraccionReportResponse | null>(null);
  const [expandedFiestaId, setExpandedFiestaId] = useState<string | null>(null);

  const loadData = useCallback(async (yearStr: string) => {
    try {
      setLoading(true);
      const year = yearStr === 'all' ? undefined : parseInt(yearStr, 10);
      const res = await getAtraccionFiestasReport(year);
      if (res.success) {
        setReport(res);
      } else {
        toast({
          title: 'Error al cargar reporte',
          description: res.error || 'No se pudo obtener la información de atracción.',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Error inesperado',
        description: e.message || 'Error al consultar datos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear, loadData]);

  const items = report?.data || [];
  const years = report?.availableYears || [new Date().getFullYear()];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
              <Link href="/contabilidad/crm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Volver al CRM
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-amber-500" />
            Atracción de Clientes por Fiesta
          </h1>
          <p className="text-sm text-muted-foreground">
            Descubrí qué eventos y fiestas están generando nuevos prospectos, presupuestos y contratos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px] h-10 bg-background">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    Año {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Fiestas con Referidos
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-amber-500" />
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : report?.fiestasConAtraccion || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Prospectos que Llegaron
            </CardDescription>
            <CardTitle className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : report?.totalProspectos || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Presupuestos Generados
            </CardDescription>
            <CardTitle className="text-2xl font-black text-sky-600 dark:text-sky-400 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : report?.totalPresupuestos || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Contratados / Ganados
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : report?.totalContratados || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content Table / Empty State */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Rendimiento por Fiesta</CardTitle>
              <CardDescription>
                Ordenado por los eventos que atrajeron mayor volumen de interesados.
              </CardDescription>
            </div>
            {items.length > 0 && (
              <Badge variant="secondary" className="w-fit font-semibold">
                {items.length} {items.length === 1 ? 'evento registrado' : 'eventos registrados'}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm">Analizando fuentes de prospectos...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                <PartyPopper className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                Todavía no hay prospectos atribuidos a fiestas
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Los prospectos empezarán a contarse automáticamente cuando los invitados entren por los enlaces del simulador en la fotocabina, la galería en vivo, el álbum público o las invitaciones.
              </p>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/fiestas">Ver Fiestas Activas</Link>
                </Button>
                <Button asChild className="bg-amber-600 hover:bg-amber-500 text-white">
                  <Link href="/simulador-de-presupuesto" target="_blank">Probar Simulador</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="min-w-[220px]">Fiesta</TableHead>
                    <TableHead className="min-w-[120px]">Fecha</TableHead>
                    <TableHead className="text-center font-bold min-w-[140px]">
                      Prospectos que llegaron
                    </TableHead>
                    <TableHead className="text-center font-bold min-w-[130px]">
                      Presupuestos
                    </TableHead>
                    <TableHead className="text-center font-bold min-w-[130px]">
                      Contratados
                    </TableHead>
                    <TableHead className="text-right min-w-[130px]">Conversión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isExpanded = expandedFiestaId === item.fiestaId;
                    const conversionRate = item.prospectosCount > 0
                      ? Math.round((item.contratadosCount / item.prospectosCount) * 100)
                      : 0;

                    return (
                      <>
                        <TableRow
                          key={item.fiestaId}
                          className="cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => setExpandedFiestaId(isExpanded ? null : item.fiestaId)}
                        >
                          <TableCell className="text-muted-foreground">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex flex-col">
                              <span className="text-foreground text-sm font-bold">
                                {item.nombreFiesta}
                              </span>
                              {item.tipoEvento && (
                                <span className="text-xs text-muted-foreground capitalize">
                                  {item.tipoEvento}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.fechaFiesta
                              ? new Date(item.fechaFiesta).toLocaleDateString('es-UY', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Sin fecha'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center font-bold text-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 px-3 py-1 rounded-full">
                              {item.prospectosCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-sm">
                            {item.presupuestosCount}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center justify-center font-bold text-sm px-3 py-1 rounded-full ${
                              item.contratadosCount > 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'text-muted-foreground'
                            }`}>
                              {item.contratadosCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            {conversionRate > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {conversionRate}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal">0%</span>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <TableRow key={`${item.fiestaId}-details`} className="bg-muted/15">
                            <TableCell colSpan={7} className="p-4 sm:p-6">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Prospectos originados en este evento ({item.prospectos.length})
                                  </h4>
                                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                                    <Link href={`/fiestas/${item.fiestaId}`}>
                                      Ver ficha de la fiesta &rarr;
                                    </Link>
                                  </Button>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {item.prospectos.map((p) => (
                                    <div
                                      key={p.id}
                                      className="rounded-lg border border-border/60 bg-background p-3 text-xs shadow-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-foreground truncate max-w-[150px]">
                                          {p.name}
                                        </span>
                                        {p.isContracted ? (
                                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                                            Contratado
                                          </Badge>
                                        ) : p.presupuestoId ? (
                                          <Badge variant="outline" className="border-sky-300 text-sky-700 dark:text-sky-300 text-[10px]">
                                            Presupuesto
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-[10px]">
                                            Prospecto
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                                        <span>Canal: {p.campaign || p.source || 'General'}</span>
                                        <span>
                                          {p.createdAt
                                            ? new Date(p.createdAt).toLocaleDateString('es-UY', {
                                                day: '2-digit',
                                                month: '2-digit',
                                              })
                                            : ''}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
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
