'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, BarChart3, Martini, TrendingUp, AlertTriangle } from 'lucide-react';
import { getBarraTecnologicaDashboard } from '@/app/actions/fiesta/barra-tecnologica.actions';
import type { BarTechnologyDashboard } from '@/types/barra-tecnologica';
import { getInsumos } from '@/app/actions/insumos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function BarraStatsPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const [dashboard, setDashboard] = useState<BarTechnologyDashboard | null>(null);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getBarraTecnologicaDashboard(fiestaId);
      if (res.success && res.data) {
        setDashboard(res.data);
      }
      const ins = await getInsumos().catch(() => []);
      setInsumos(ins);
      setIsLoading(false);
    }
    load();
  }, [fiestaId]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950"><Loader2 className="w-10 h-10 animate-spin text-rose-500" /></div>;
  }

  const orders = dashboard?.orders || [];
  const delivered = orders.filter(o => o.status === 'entregado');
  const canceled = orders.filter(o => o.status === 'cancelado');
  
  // Tragos consumidos
  const drinksCount = delivered.reduce((acc, o) => {
    acc[o.drinkName] = (acc[o.drinkName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDrinks = Object.entries(drinksCount).sort((a, b) => b[1] - a[1]);
  const maxDrink = sortedDrinks[0]?.[1] || 1;

  // Alertas de insumos
  const lowStockInsumos = insumos.filter(i => (i.cantidadDisponible !== undefined && i.cantidadDisponible < 5 && i.tipoItem === 'Insumo/Ingrediente'));

  return (
    <main className="min-h-screen bg-zinc-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Estadísticas de la Barra</h1>
            <p className="text-zinc-400">{dashboard?.eventName}</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Martini className="w-4 h-4 text-rose-400" /> Total Consumidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-black text-white">{delivered.length}</p>
              <p className="text-sm text-zinc-500 mt-1">Tragos entregados a los invitados</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-black text-white">
                {delivered.length > 0 && orders.length > 0 
                  ? Math.round((delivered.length / orders.length) * 100) 
                  : 0}%
              </p>
              <p className="text-sm text-zinc-500 mt-1">Tasa de finalización de pedidos</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Cancelados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-black text-white">{canceled.length}</p>
              <p className="text-sm text-zinc-500 mt-1">Pedidos que fueron cancelados</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tragos Más Consumidos */}
          <Card className="bg-white/5 border-white/10 col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-black text-white">Ranking de Tragos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sortedDrinks.length === 0 ? (
                <p className="text-sm text-zinc-500">Todavía no hay tragos registrados.</p>
              ) : (
                sortedDrinks.map(([name, count], idx) => (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-zinc-200">
                        {idx === 0 && '🥇 '}
                        {idx === 1 && '🥈 '}
                        {idx === 2 && '🥉 '}
                        {name}
                      </span>
                      <span className="text-rose-400">{count} entregados</span>
                    </div>
                    <Progress value={(count / maxDrink) * 100} className="h-2 bg-zinc-800" indicatorClassName="bg-rose-500" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Alertas de Stock */}
          <Card className="bg-white/5 border-white/10 col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Alertas de Insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockInsumos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                  <p className="text-sm font-bold text-emerald-400">Stock estable</p>
                  <p className="text-xs text-emerald-500/70">No hay insumos con nivel crítico.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockInsumos.map(ins => (
                    <div key={ins.id} className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div>
                        <p className="font-bold text-amber-500">{ins.nombre}</p>
                        <p className="text-xs text-amber-500/70">Proveedor: {ins.proveedor || 'Desconocido'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-amber-400">{ins.cantidadDisponible}</p>
                        <p className="text-[10px] uppercase font-bold text-amber-500/70">{ins.unidad || 'Unidades'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </main>
  );
}

// Para usar lucide icons CheckCircle2
import { CheckCircle2 } from 'lucide-react';
