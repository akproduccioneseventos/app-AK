'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, CalendarCheck, DollarSign, Loader2, Zap, BarChart2, Users } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { ProfitabilityChart } from '@/components/charts/ProfitabilityChart';
import { ConversionFunnelChart } from '@/components/charts/ConversionFunnelChart';
import { TopServicesChart } from '@/components/charts/TopServicesChart';
import { EventTypeProfitabilityChart } from '@/components/charts/EventTypeProfitabilityChart';
import { BottleneckAlertsPanel } from '@/components/charts/BottleneckAlertsPanel';
import { StaffEfficiencyChart } from '@/components/charts/StaffEfficiencyChart';
import { getAnalyticsData, type AnalyticsData } from '@/app/actions/analytics';
import { useToast } from '@/hooks/use-toast';

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const formatCurrency = (value?: number) => {
    if (isLoading) return '...';
    if (value === undefined || value === null) return '$ 0';
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAnalyticsData();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudieron cargar los datos.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos analíticos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 sm:space-y-10 pb-16">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900">
            Dashboard <span className="text-primary italic">Ejecutivo</span>
          </h1>
          <p className="text-slate-500 font-semibold flex items-center gap-2 text-xs sm:text-base">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0 inline-block" />
            Inteligencia de negocios en tiempo real de AK Producciones.
          </p>
        </motion.div>
      </header>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Eventos Realizados"
          value={isLoading ? '...' : (data?.kpis.totalEventosRealizados ?? 0)}
          icon={CalendarCheck}
          isLoading={isLoading}
        />
        <KpiCard
          title="Valor Promedio Evento"
          value={formatCurrency(data?.kpis.valorPromedioEvento)}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <KpiCard
          title="Tasa de Conversión"
          value={isLoading ? '...' : `${data?.kpis.tasaConversion ?? 0}%`}
          icon={Target}
          isLoading={isLoading}
        />
        <KpiCard
          title="Rentabilidad Neta (12M)"
          value={formatCurrency(data?.kpis.rentabilidadNeta)}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <KpiCard
          title="Conversión Simulador"
          value={isLoading ? '...' : `${data?.kpis.simulatorConversionRate ?? 0}%`}
          icon={Zap}
          isLoading={isLoading}
        />
        <KpiCard
          title="Margen Bruto Promedio"
          value={isLoading ? '...' : `${data?.kpis.margenBrutoPromedio ?? 0}%`}
          icon={BarChart2}
          isLoading={isLoading}
        />
      </div>

      {/* ── Profitability Chart (full width) ───────────────────────────────── */}
      {isLoading ? (
        <div className="w-full h-[430px] rounded-[2rem] bg-slate-50 flex items-center justify-center shadow-2xl">
          <Loader2 className="w-8 h-8 text-primary/30 animate-spin" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ProfitabilityChart data={data?.monthlyProfitability || []} />
        </motion.div>
      )}

      {/* ── Conversion + Top Services ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {isLoading ? (
          <>
            <div className="h-[420px] rounded-[2rem] bg-slate-50 flex items-center justify-center shadow-2xl">
              <Loader2 className="w-8 h-8 text-primary/30 animate-spin" />
            </div>
            <div className="h-[420px] rounded-[2rem] bg-slate-50 flex items-center justify-center shadow-2xl">
              <Loader2 className="w-8 h-8 text-primary/30 animate-spin" />
            </div>
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <ConversionFunnelChart
                data={data?.conversionFunnel || []}
                tasaConversion={data?.kpis.tasaConversion ?? 0}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <TopServicesChart data={data?.topServices || []} />
            </motion.div>
          </>
        )}
      </div>

      {/* ── Phase 4: Event Type Profitability ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full">
            Fase 4 · Análisis Avanzado
          </span>
        </div>
        {isLoading ? (
          <div className="h-[460px] rounded-[2rem] bg-slate-50 flex items-center justify-center shadow-2xl">
            <Loader2 className="w-8 h-8 text-primary/30 animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <EventTypeProfitabilityChart data={data?.eventTypeProfitability || []} />
          </motion.div>
        )}
      </div>

      {/* ── Phase 4: Bottleneck Detection + Staff Efficiency ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {isLoading ? (
          <>
            <div className="h-[400px] rounded-[2rem] bg-slate-50 flex items-center justify-center shadow-2xl">
              <Loader2 className="w-8 h-8 text-primary/30 animate-spin" />
            </div>
            <div className="h-[400px] rounded-[2rem] bg-slate-50 flex items-center justify-center shadow-2xl">
              <Loader2 className="w-8 h-8 text-primary/30 animate-spin" />
            </div>
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <BottleneckAlertsPanel alerts={data?.bottleneckAlerts || []} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <StaffEfficiencyChart data={data?.staffEfficiency || []} />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
