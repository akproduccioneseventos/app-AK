'use client';

import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, Loader2, RefreshCw, DollarSign, Wallet, CalendarDays, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { sumConfirmedClientPayments } from '@/lib/budget/financial-guardrails';
import { getPaymentPlanSummary } from '@/lib/budget/payment-summary';

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
  // La cuenta oficial de ganancia: lo pagado donde hay pagos, lo estimado donde no, con los bloques
  // automaticos (catering, bebidas, reposteria, sueldos) y sin la merma duplicada. Antes aca se usaba
  // "los pagos o los renglones manuales", y el mismo mes no coincidia con Analiticas.
  return calcularGananciaDeEvento(fiesta.gestionCostos, fiesta.pagosProveedores, pagosCliente).costoReal;
}

function calcularIngresos(fiesta: FiestaEnPlanificacion, pagosCliente?: PagoCliente[]): number {
  if (pagosCliente && pagosCliente.length > 0) {
    return sumConfirmedClientPayments(pagosCliente);
  }
  if (fiesta.planDePagos?.cuotas) {
    const paymentSummary = getPaymentPlanSummary(fiesta.planDePagos.cuotas);
    return paymentSummary.paid;
  }
  return 0;
}

function calcularTotalPactado(fiesta: FiestaEnPlanificacion): number {
  if (fiesta.planDePagos?.cuotas && fiesta.planDePagos.cuotas.length > 0) {
    const s = getPaymentPlanSummary(fiesta.planDePagos.cuotas);
    if (s.total > 0) return s.total;
  }
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
      const [data, presupuestos] = await Promise.all([
        getFiestas(true),
        getPresupuestos(true).catch(() => []),
      ]);
      const cobrosPorPresupuesto = new Map(
        (presupuestos || []).map((p) => [p.id, p.pagosCliente ?? []])
      );
      const calculados: FiestaFinanzas[] = (Array.isArray(data) ? data : []).map(f => {
        const pagosCliente = (f as any).pagosCliente || (f.presupuestoId ? cobrosPorPresupuesto.get(f.presupuestoId) : undefined);
        const ingresos = calcularIngresos(f, pagosCliente);
        const totalPactado = calcularTotalPactado(f);
        const egresos = calcularEgresos(f, pagosCliente);
        return {
          id: f.id,
          nombre: f.configuracion.nombreEvento || '(Sin nombre)',
          fecha: f.configuracion.fechaEvento || '',
          estado: f.estado || '—',
          ingresos,
          totalPactado,
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          </CardContent>
        </Card>
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
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Detalle por Evento</CardTitle>
          <CardDescription>Cobrado − Egresos = Ganancia sobre lo cobrado por fiesta</CardDescription>
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
                    <td className={`pt-3 text-right text-lg ${gananciaCobrado >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
                      {formatCurrency(gananciaCobrado)}
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
