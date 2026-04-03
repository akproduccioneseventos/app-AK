'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, Loader2, AlertTriangle, ArrowLeft, DollarSign, TrendingDown, Wallet, RefreshCw, Calendar, ChevronRight, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestas } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const formatUYU = (amount: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Sin fecha';
  try {
    return new Date(dateString).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return 'Fecha inválida'; }
};

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

interface FiestaFinancials {
  fiesta: FiestaEnPlanificacion;
  ingresos: number;
  egresos: number;
  ganancia: number;
  margen: number;
}

function calcFinancials(fiesta: FiestaEnPlanificacion): FiestaFinancials {
  // Ingresos: prefer PlanDePagos actual payments, else gestionCostos estimate, else presupuesto
  let ingresos = 0;
  if (fiesta.planDePagos?.cuotas?.length) {
    // Sum paid cuotas
    ingresos = fiesta.planDePagos.cuotas.reduce((sum, cuota) => {
      if (cuota.estado === 'pagado') return sum + cuota.monto;
      if (cuota.estado === 'parcial') return sum + (cuota.montoPagado ?? 0);
      return sum;
    }, 0);
    // If no payments yet, use total plan amount as estimated
    if (ingresos === 0) {
      ingresos = fiesta.planDePagos.cuotas.reduce((sum, c) => sum + c.monto, 0);
    }
  } else if (fiesta.gestionCostos?.ingresosTotalesEstimados) {
    ingresos = fiesta.gestionCostos.ingresosTotalesEstimados;
  } else if (fiesta.configuracion?.presupuestoEstimado) {
    ingresos = fiesta.configuracion.presupuestoEstimado;
  }

  // Egresos: sum of cost items + payments to providers
  let egresos = 0;
  if (fiesta.gestionCostos?.costosItems?.length) {
    egresos = fiesta.gestionCostos.costosItems.reduce((sum, item) => sum + (item.montoEstimado || 0), 0);
  }
  // Also add actual payments
  if (fiesta.pagosProveedores?.length) {
    const totalPaid = fiesta.pagosProveedores.reduce((sum, p) => sum + p.monto, 0);
    // Use actual payments if available and higher than estimates
    if (totalPaid > 0 && egresos === 0) egresos = totalPaid;
  }

  const ganancia = ingresos - egresos;
  const margen = ingresos > 0 ? Math.round((ganancia / ingresos) * 100) : 0;

  return { fiesta, ingresos, egresos, ganancia, margen };
}

export default function AdminFinanzasPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getFiestas(true);
      setFiestas(all);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const financials = useMemo(() => fiestas.map(calcFinancials), [fiestas]);

  const totals = useMemo(() => {
    return financials.reduce(
      (acc, f) => ({
        ingresos: acc.ingresos + f.ingresos,
        egresos: acc.egresos + f.egresos,
        ganancia: acc.ganancia + f.ganancia,
      }),
      { ingresos: 0, egresos: 0, ganancia: 0 }
    );
  }, [financials]);

  const totalMargen = totals.ingresos > 0 ? Math.round((totals.ganancia / totals.ingresos) * 100) : 0;

  const sorted = useMemo(() =>
    [...financials].sort((a, b) => {
      const dateA = a.fiesta.configuracion?.fechaEvento || '';
      const dateB = b.fiesta.configuracion?.fechaEvento || '';
      return dateB.localeCompare(dateA);
    }),
    [financials]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/eventos">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Rentabilidad / Bolsillo
          </h1>
          <p className="text-sm text-muted-foreground">{fiestas.length} evento(s) analizados</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Ingresos</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-700">{formatUYU(totals.ingresos)}</div>
            <p className="text-xs text-emerald-600 mt-1">Lo cobrado / facturado a clientes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Total Egresos</span>
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-700">{formatUYU(totals.egresos)}</div>
            <p className="text-xs text-red-600 mt-1">Costos de proveedores y operación</p>
          </CardContent>
        </Card>

        <Card className={cn(
          'border-2',
          totals.ganancia >= 0
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
            : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
        )}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-xs font-semibold uppercase tracking-wide', totals.ganancia >= 0 ? 'text-blue-700' : 'text-orange-700')}>
                Ganancia Neta
              </span>
              <Wallet className={cn('w-4 h-4', totals.ganancia >= 0 ? 'text-blue-600' : 'text-orange-600')} />
            </div>
            <div className={cn('text-3xl font-bold', totals.ganancia >= 0 ? 'text-blue-700' : 'text-orange-700')}>
              {formatUYU(totals.ganancia)}
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={clampPercentage(totalMargen)} className="h-1.5" />
              <p className={cn('text-xs', totals.ganancia >= 0 ? 'text-blue-600' : 'text-orange-600')}>
                Margen neto: {totalMargen}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Event Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Detalle por Evento
          </CardTitle>
          <CardDescription>Rentabilidad individual de cada fiesta (ordenado por fecha, más reciente primero)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay eventos registrados aún.</p>
            </div>
          ) : (
            <div className="divide-y">
              {sorted.map(({ fiesta, ingresos, egresos, ganancia, margen }) => {
                const isProfit = ganancia >= 0;
                return (
                  <div
                    key={fiesta.id}
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/fiestas/nueva/gestion-costos-rentabilidad?fiestaId=${fiesta.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        isProfit ? 'bg-emerald-100' : 'bg-red-100'
                      )}>
                        {isProfit
                          ? <TrendingUp className="w-5 h-5 text-emerald-600" />
                          : <TrendingDown className="w-5 h-5 text-red-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">
                            {fiesta.configuracion.nombreEvento || `Evento #${fiesta.id.slice(-4)}`}
                          </span>
                          {fiesta.configuracion.tipoCelebracion && (
                            <Badge variant="outline" className="text-[10px] py-0">{fiesta.configuracion.tipoCelebracion}</Badge>
                          )}
                          <Badge variant="outline" className={cn('text-[10px] py-0', isProfit ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200')}>
                            {margen}% margen
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(fiesta.configuracion.fechaEvento)}
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground block">Ingresos</span>
                            <span className="font-semibold text-emerald-700">{formatUYU(ingresos)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Egresos</span>
                            <span className="font-semibold text-red-700">{formatUYU(egresos)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Ganancia</span>
                            <span className={cn('font-bold', isProfit ? 'text-blue-700' : 'text-orange-700')}>{formatUYU(ganancia)}</span>
                          </div>
                        </div>
                        {ingresos > 0 && (
                          <Progress value={clampPercentage(margen)} className="h-1 mt-2" />
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-4">
        * Los montos se calculan a partir de los datos ingresados en Gestión de Costos y Plan de Pagos de cada evento. Hacé clic en un evento para ver el detalle completo.
      </p>
    </div>
  );
}
