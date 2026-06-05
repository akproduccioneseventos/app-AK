'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, TrendingUp, Users, AlertCircle, Loader2, DollarSign, CalendarCheck } from 'lucide-react';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFiestas(false); // only active
        setFiestas(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-slate-500 font-medium">Cargando métricas ejecutivas...</p>
      </div>
    );
  }

  // Calculate metrics
  const activeEventsCount = fiestas.length;
  
  // Very rough estimation based on guest count and generic pricing for demonstration
  const totalGuests = fiestas.reduce((acc, f) => acc + (f.invitados?.length || 0), 0);
  
  // Pending tasks (vendors not paid fully, etc.)
  let totalPendingTasks = 0;
  fiestas.forEach(f => {
    if (f.estadosCompra) {
      f.estadosCompra.forEach(prov => {
        if (!prov.pagado) totalPendingTasks++;
      });
    }
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Dashboard Ejecutivo
            </h1>
            <p className="text-sm text-slate-500">Métricas globales y alertas operativas en tiempo real.</p>
          </div>
        </div>
        <Link href="/empresa">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Empresa
          </Button>
        </Link>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Fiestas Activas</CardTitle>
            <CalendarCheck className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{activeEventsCount}</div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Eventos en producción</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Volumen de Invitados</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{totalGuests}</div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Personas a recibir</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Proyección (Estimada)</CardTitle>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">
              <span className="text-xl mr-1 text-slate-400">USD</span>
              {new Intl.NumberFormat('en-US').format(activeEventsCount * 2500)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Cálculo base promedio</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md bg-rose-50 border-rose-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-rose-600">Alertas Proveedores</CardTitle>
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-700">{totalPendingTasks}</div>
            <p className="text-xs text-rose-500/80 mt-1 font-medium">Pagos parciales o pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Events List */}
      <Card className="rounded-2xl border-none shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Fiestas en Producción</CardTitle>
          <CardDescription>Eventos que requieren atención logística.</CardDescription>
        </CardHeader>
        <CardContent>
          {fiestas.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No hay fiestas activas actualmente.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {fiestas.map(fiesta => (
                <div key={fiesta.id} className="py-4 flex items-center justify-between group">
                  <div>
                    <h3 className="font-bold text-slate-800">{fiesta.configuracion?.nombreEvento || 'Fiesta sin nombre'}</h3>
                    <p className="text-sm text-slate-500">
                      {fiesta.configuracion?.fechaEvento ? new Date(fiesta.configuracion.fechaEvento).toLocaleDateString() : 'Sin fecha'} • {fiesta.configuracion?.tipoCelebracion || 'Evento'}
                    </p>
                  </div>
                  <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`}>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver Panel &rarr;
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
