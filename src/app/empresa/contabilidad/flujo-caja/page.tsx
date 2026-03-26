
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Loader2, AlertTriangle, Wallet, Calculator, Info, ShieldCheck } from 'lucide-react';
import { getCashFlowProjection, type CashFlowMonth } from '@/app/actions/dashboard';
import { useToast } from '@/hooks/use-toast';
import { CashFlowProjectionChart } from '@/components/charts/CashFlowProjectionChart';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);

export default function FlujoCajaProyectadoPage() {
  const { toast } = useToast();
  const [data, setData] = useState<CashFlowMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjection = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCashFlowProjection();
      if (result.success && result.data) {
        setData(result.data);
      } else throw new Error(result.error);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error de Cálculo", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjection();
  }, [fetchProjection]);

  const stats = useMemo(() => {
      const totalIncome = data.reduce((s, m) => s + m.income, 0);
      const totalExpenses = data.reduce((s, m) => s + m.expenses, 0);
      const netBalance = totalIncome - totalExpenses;
      const coverageRatio = totalExpenses > 0 ? (totalIncome / totalExpenses) : 0;
      
      return { totalIncome, totalExpenses, netBalance, coverageRatio };
  }, [data]);

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary mb-4" /><p className="font-bold text-slate-500 uppercase tracking-widest">Ejecutando CFO Virtual...</p></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-100 text-white">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 font-headline uppercase">Flujo de Caja Proyectado</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulo 5: CFO Virtual y Predicción Financiera</p>
          </div>
        </div>
        <Link href="/empresa/contabilidad" passHref>
          <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Panel</Button>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Cobros Pendientes" value={formatCurrency(stats.totalIncome)} icon={TrendingUp} description="Ingresos por entrar" />
        <KpiCard title="Costos Proyectados" value={formatCurrency(stats.totalExpenses)} icon={TrendingDown} description="Gastos en camino" />
        <KpiCard title="Balance Neto" value={formatCurrency(stats.netBalance)} icon={DollarSign} className={cn(stats.netBalance >= 0 ? "border-emerald-100" : "border-rose-100")} />
        <KpiCard title="Ratio de Cobertura" value={stats.coverageRatio.toFixed(2)} icon={ShieldCheck} description="Ingreso / Egreso" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
            <CashFlowProjectionChart data={data} />
        </div>
        <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-slate-900 text-white">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        <Info className="w-5 h-5 text-emerald-400"/> Inteligencia Financiera
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        El CFO Virtual analiza tus presupuestos aceptados y facturas para predecir cuánta liquidez real tendrás.
                    </p>
                    <Separator className="bg-white/10"/>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Mes más rentable:</span>
                            <span className="font-bold text-emerald-400">
                                {data.length > 0 ? data.reduce((prev, curr) => (prev.balance > curr.balance) ? prev : curr).month : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Eficiencia Operativa:</span>
                            <span className="font-bold">{stats.totalIncome > 0 ? ((stats.netBalance / stats.totalIncome) * 100).toFixed(1) + '%' : 'N/A'}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-white/5 py-4 justify-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Datos basados en eventos futuros</p>
                </CardFooter>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Detalle Mensual</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {data.map(m => (
                            <div key={m.month} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="font-bold text-xs text-slate-800 uppercase tracking-tighter">{m.month}</p>
                                    <p className={cn("text-[10px] font-black mt-0.5", m.balance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                        {m.balance >= 0 ? "+" : ""}{formatCurrency(m.balance)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400">Ing: {formatCurrency(m.income)}</p>
                                    <p className="text-[9px] font-bold text-slate-400">Egr: {formatCurrency(m.expenses)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
