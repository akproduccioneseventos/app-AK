'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, Loader2, RefreshCw, DollarSign, TrendingDown, Wallet, CalendarDays, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(v);

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface FiestaFinanzas {
  id: string;
  nombre: string;
  fecha: string;
  estado: string;
  ingresos: number;
  egresos: number;
  ganancia: number;
}

function calcularEgresos(fiesta: FiestaEnPlanificacion): number {
  const costos = fiesta.gestionCostos?.costosItems ?? [];
  const pagos = fiesta.pagosProveedores ?? [];
  const totalCostos = costos.reduce((s, c) => s + (c.montoEstimado ?? 0), 0);
  const totalPagos = pagos.reduce((s, p) => s + (p.monto ?? 0), 0);
  // Use actual payments if available, otherwise use estimated costs
  return totalPagos > 0 ? totalPagos : totalCostos;
}

function calcularIngresos(fiesta: FiestaEnPlanificacion): number {
  // Use plan de pagos (actual received) if available
  if (fiesta.planDePagos?.cuotas) {
    const recibido = fiesta.planDePagos.cuotas
      .filter(c => c.estado === 'pagado' || c.estado === 'parcial')
      .reduce((s, c) => s + (c.estado === 'parcial' ? (c.montoPagado ?? 0) : c.monto), 0);
    if (recibido > 0) return recibido;
    // Fallback: total del plan
    const total = fiesta.planDePagos.cuotas.reduce((s, c) => s + c.monto, 0);
    if (total > 0) return total;
  }
  // Fallback to estimated budget or gestionCostos
  return fiesta.gestionCostos?.ingresosTotalesEstimados
    ?? fiesta.configuracion.presupuestoEstimado
    ?? 0;
}

export default function FinanzasPage() {
  const { toast } = useToast();
  const [fiestas, setFiestas] = useState<FiestaFinanzas[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFiestas(true);
      const calculados: FiestaFinanzas[] = data.map(f => {
        const ingresos = calcularIngresos(f);
        const egresos = calcularEgresos(f);
        return {
          id: f.id,
          nombre: f.configuracion.nombreEvento || '(Sin nombre)',
          fecha: f.configuracion.fechaEvento || '',
          estado: f.estado || '—',
          ingresos,
          egresos,
          ganancia: ingresos - egresos,
        };
      });
      // Sort by date descending
      calculados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setFiestas(calculados);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos financieros.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalIngresos = fiestas.reduce((s, f) => s + f.ingresos, 0);
  const totalEgresos = fiestas.reduce((s, f) => s + f.egresos, 0);
  const totalGanancia = totalIngresos - totalEgresos;
  const margen = totalIngresos > 0 ? (totalGanancia / totalIngresos) * 100 : 0;

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

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-700 font-medium">Ingresos Totales</p>
            </div>
            <p className="text-xl font-bold text-green-700">{formatCurrency(totalIngresos)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-xs text-red-700 font-medium">Egresos Totales</p>
            </div>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalEgresos)}</p>
          </CardContent>
        </Card>
        <Card className={`${totalGanancia >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className={`w-4 h-4 ${totalGanancia >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
              <p className={`text-xs font-medium ${totalGanancia >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>Ganancia Neta</p>
            </div>
            <p className={`text-xl font-bold ${totalGanancia >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
              {formatCurrency(totalGanancia)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              <p className="text-xs text-violet-700 font-medium">Margen Promedio</p>
            </div>
            <p className="text-xl font-bold text-violet-700">{margen.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Detalle por Evento</CardTitle>
          <CardDescription>Ingresos − Egresos = Ganancia Neta por fiesta</CardDescription>
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
                    <th className="text-right pb-2 font-medium text-green-700">Ingresos</th>
                    <th className="text-right pb-2 font-medium text-red-700">Egresos</th>
                    <th className="text-right pb-2 font-medium">Ganancia</th>
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
                      <td className={`py-2.5 text-right font-bold ${f.ganancia >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
                        {formatCurrency(f.ganancia)}
                      </td>
                      <td className="py-2.5 pl-2">
                        <Link href={`/fiestas/nueva/gestion-costos-rentabilidad?fiestaId=${f.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan={3} className="pt-3 text-sm">TOTAL</td>
                    <td className="pt-3 text-right text-green-700">{formatCurrency(totalIngresos)}</td>
                    <td className="pt-3 text-right text-red-600">{formatCurrency(totalEgresos)}</td>
                    <td className={`pt-3 text-right text-lg ${totalGanancia >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
                      {formatCurrency(totalGanancia)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
