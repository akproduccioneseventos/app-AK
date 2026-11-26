'use client';

import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, Loader2, RefreshCw, DollarSign, Wallet, CalendarDays, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getBudgetPaymentSummary, normalizePresupuestoFinancials } from '@/lib/budget/financial-guardrails';
import { getMisPermisos } from '@/app/actions/sesion';
import { PERMISOS, type Permiso } from '@/lib/auth/perfiles';
import { esFiestaDemo } from '@/lib/events/event-ordering';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(v);

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface FiestaFinanzas {
  id: string;
  nombre: string;
  fecha: string;
  estado: string;
  ingresos: number; // Cobrado efectivamente
  totalPactado: number; // Total acordado/pactado
  egresos: number;
  ganancia: number; // ingresos - egresos (ganancia sobre lo cobrado)
}

function calcularEgresos(fiesta: FiestaEnPlanificacion, pagosCliente?: PagoCliente[]): number {
  return calcularGananciaDeEvento(fiesta.gestionCostos, fiesta.pagosProveedores, pagosCliente, fiesta.personalAsignado).costoReal;
}

function resumenPresupuestoDeFiesta(fiesta: FiestaEnPlanificacion, presupuesto?: any): { ingresos: number; totalPactado: number; pagosCliente?: PagoCliente[] } {
  if (presupuesto) {
    const normalizado = normalizePresupuestoFinancials(presupuesto);
    const summary = getBudgetPaymentSummary(normalizado, { includeAnnualAdjustment: true });
    return {
      ingresos: summary.paid,
      totalPactado: summary.total,
      pagosCliente: normalizado.pagosCliente,
    };
  }
  const ingresos = 0;
  const totalPactado = fiesta.gestionCostos?.ingresosTotalesEstimados
    ?? fiesta.configuracion.presupuestoEstimado
    ?? 0;
  return { ingresos, totalPactado, pagosCliente: (fiesta as any).pagosCliente };
}

export default function FinanzasPage() {
  const { toast } = useToast();
  const [fiestas, setFiestas] = useState<FiestaFinanzas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [puedeVerGanancias, setPuedeVerGanancias] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const leerPresupuestos = async () => {
        try {
          const lista = await getPresupuestos(true);
          if (!Array.isArray(lista)) {
            throw new Error('Respuesta inválida al leer los presupuestos.');
          }
          return lista;
        } catch (err: any) {
          const raw = err instanceof Error ? err.message : String(err ?? '');
          if (raw.includes('No se pudieron leer los presupuestos')) {
            throw new Error(raw);
          }
          throw new Error(raw ? `No se pudieron leer los presupuestos: ${raw}` : 'No se pudieron leer los presupuestos.');
        }
      };

      const [data, presupuestos, misPermisosRes] = await Promise.all([
        getFiestas(true),
        leerPresupuestos(),
        getMisPermisos().catch(() => ({ permisos: [] as Permiso[] })),
      ]) as [any, any, { permisos: Permiso[] }];
      const pList = (misPermisosRes?.permisos || []) as string[];
      const veGanancias = pList.includes(PERMISOS.GANANCIAS) || pList.includes(PERMISOS.ADMINISTRACION);
      setPuedeVerGanancias(veGanancias);

      const presupuestosPorId = new Map(
        (presupuestos as any[]).map((p: any) => [p.id, p])
      );
      const fiestasFiltradas = (Array.isArray(data) ? data : []).filter(f => !esFiestaDemo(f));
      const calculados: FiestaFinanzas[] = fiestasFiltradas.map(f => {
        const presupuesto = f.presupuestoId ? presupuestosPorId.get(f.presupuestoId) : undefined;
        const fin = resumenPresupuestoDeFiesta(f, presupuesto);
        const egresos = calcularEgresos(f, fin.pagosCliente);
        return {
          id: f.id,
          nombre: f.configuracion.nombreEvento || '(Sin nombre)',
          fecha: f.configuracion.fechaEvento || '',
          estado: f.estado || '—',
          ingresos: fin.ingresos,
          totalPactado: fin.totalPactado,
          egresos,
          ganancia: fin.ingresos - egresos,
        };
      });
      // Sort by date descending
      calculados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setFiestas(calculados);
    } catch (err: any) {
      const message = err instanceof Error && err.message ? err.message : 'No se pudieron cargar los datos financieros.';
      setLoadError(message);
      setFiestas([]);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalCobrado = fiestas.reduce((s, f) => s + f.ingresos, 0);
  const totalPactado = fiestas.reduce((s, f) => s + f.totalPactado, 0);
  const totalEgresos = fiestas.reduce((s, f) => s + f.egresos, 0);
  const porCobrar = Math.max(0, totalPactado - totalCobrado);
  const gananciaCobrado = totalCobrado - totalEgresos;
  const gananciaEsperada = totalPactado - totalEgresos;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard de Rentabilidad</h1>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {loadError ? (
        <Card className="border-red-200 bg-red-50/70">
          <CardContent className="p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="font-semibold text-red-900">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI cards */}
          <div className={`grid grid-cols-2 ${puedeVerGanancias ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3`}>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">Cobrado</p>
                </div>
                <p className="text-xl font-bold text-green-700">{formatCurrency(totalCobrado)}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-700 font-medium">Por cobrar</p>
                </div>
                <p className="text-xl font-bold text-amber-700">{formatCurrency(porCobrar)}</p>
                <p className="text-[11px] text-amber-700/80 mt-0.5">sólo de las fiestas cargadas</p>
                <Link href="/contabilidad" className="text-[11px] font-semibold text-amber-800 underline mt-1 inline-block">
                  Ver todo lo que se debe
                </Link>
              </CardContent>
            </Card>
            {puedeVerGanancias && (
              <>
                <Card className={gananciaCobrado >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className={`w-4 h-4 ${gananciaCobrado >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
                      <p className={`text-xs font-medium ${gananciaCobrado >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>Ganancia sobre lo cobrado</p>
                    </div>
                    <p className={`text-xl font-bold ${gananciaCobrado >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {formatCurrency(gananciaCobrado)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-violet-200 bg-violet-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-violet-600" />
                      <p className="text-xs text-violet-700 font-medium">Ganancia esperada</p>
                    </div>
                    <p className="text-xl font-bold text-violet-700">{formatCurrency(gananciaEsperada)}</p>
                    <p className="text-[10px] text-violet-600/80 mt-0.5">si se cobra todo lo pactado</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Detalle por Evento</CardTitle>
              <CardDescription>
                {puedeVerGanancias
                  ? 'Cobrado − Egresos = Ganancia sobre lo cobrado por fiesta'
                  : 'Detalle de cobranzas y egresos por evento'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : fiestas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay eventos registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left pb-2 font-medium">Evento</th>
                        <th className="text-left pb-2 font-medium">Fecha</th>
                        <th className="text-left pb-2 font-medium hidden md:table-cell">Estado</th>
                        <th className="text-right pb-2 font-medium text-green-700">Cobrado</th>
                        <th className="text-right pb-2 font-medium text-red-700">Egresos</th>
                        {puedeVerGanancias && <th className="text-right pb-2 font-medium">Ganancia</th>}
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {fiestas.map(f => (
                        <tr key={f.id} className="hover:bg-muted/30">
                          <td className="py-2.5 font-medium max-w-[140px] truncate">{f.nombre}</td>
                          <td className="py-2.5 text-muted-foreground whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {formatDate(f.fecha)}
                            </span>
                          </td>
                          <td className="py-2.5 hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">{f.estado}</Badge>
                          </td>
                          <td className="py-2.5 text-right text-green-700 font-medium">{formatCurrency(f.ingresos)}</td>
                          <td className="py-2.5 text-right text-red-600 font-medium">{formatCurrency(f.egresos)}</td>
                          {puedeVerGanancias && (
                            <td className={`py-2.5 text-right font-bold ${f.ganancia >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
                              {formatCurrency(f.ganancia)}
                            </td>
                          )}
                          <td className="py-2.5 pl-2">
                            <Button asChild variant="ghost" size="icon" className="h-7 w-7"><Link href={`/fiestas/nueva/gestion-costos-rentabilidad?fiestaId=${f.id}`}>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td colSpan={3} className="pt-3 text-sm">TOTAL</td>
                        <td className="pt-3 text-right text-green-700">{formatCurrency(totalCobrado)}</td>
                        <td className="pt-3 text-right text-red-600">{formatCurrency(totalEgresos)}</td>
                        {puedeVerGanancias && (
                          <td className={`pt-3 text-right text-lg ${gananciaCobrado >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
                            {formatCurrency(gananciaCobrado)}
                          </td>
                        )}
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
