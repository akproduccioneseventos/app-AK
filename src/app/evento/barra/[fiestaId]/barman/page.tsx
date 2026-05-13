'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, CheckCircle2, Clock3, Loader2, Martini, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BarDrinkOrder, BarDrinkOrderStatus, BarTechnologyDashboard } from '@/types/barra-tecnologica';
import {
  getBarraTecnologicaDashboard,
  updateBarDrinkOrderStatus,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<BarDrinkOrderStatus, string> = {
  nuevo: 'Nuevo',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const STATUS_STYLES: Record<BarDrinkOrderStatus, string> = {
  nuevo: 'bg-rose-600 text-white',
  preparando: 'bg-amber-500 text-white',
  listo: 'bg-emerald-600 text-white',
  entregado: 'bg-slate-200 text-slate-700',
  cancelado: 'bg-slate-900 text-white',
};

function minutesAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'recién';
  return `${minutes} min`;
}

export default function BarmanScreenPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<BarTechnologyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  const beep = useCallback(() => {
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextCtor();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.18);
    } catch {
      // Browser may block sound until first interaction.
    }
  }, []);

  const loadData = useCallback(async (playSound = false) => {
    const result = await getBarraTecnologicaDashboard(fiestaId);
    if (result.success && result.data) {
      const activeIds = new Set(result.data.orders.filter((order) => order.status === 'nuevo').map((order) => order.id));
      const hasNew = [...activeIds].some((id) => !knownOrderIdsRef.current.has(id));
      if (playSound && hasNew) beep();
      knownOrderIdsRef.current = activeIds;
      setDashboard(result.data);
    } else {
      toast({ title: 'No se pudo cargar', description: result.error, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [beep, fiestaId, toast]);

  useEffect(() => {
    loadData(false);
    const interval = window.setInterval(() => loadData(true), 2200);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const updateStatus = async (order: BarDrinkOrder, status: BarDrinkOrderStatus) => {
    setUpdatingId(order.id);
    const result = await updateBarDrinkOrderStatus(fiestaId, order.id, status);
    if (!result.success) {
      toast({ title: 'No se pudo actualizar', description: result.error, variant: 'destructive' });
    }
    await loadData(false);
    setUpdatingId(null);
  };

  const grouped = useMemo(() => {
    const orders = dashboard?.orders || [];
    return {
      nuevo: orders.filter((order) => order.status === 'nuevo'),
      preparando: orders.filter((order) => order.status === 'preparando'),
      listo: orders.filter((order) => order.status === 'listo'),
      historial: orders.filter((order) => order.status === 'entregado' || order.status === 'cancelado').slice(0, 12),
    };
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  const settings = dashboard?.settings;
  const accentColor = settings?.accentColor || '#dc2626';

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white">
      <header className="mb-4 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl shadow-xl" style={{ backgroundColor: accentColor }}>
            <Martini className="h-9 w-9" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">Pantalla barman</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">{settings?.barmanTitle || 'Pedidos de barra en vivo'}</h1>
            <p className="text-white/60">{dashboard?.eventName}</p>
          </div>
        </div>
        <Button variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/10 font-black text-white hover:bg-white/20" onClick={() => loadData(false)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </header>

      <section className="grid gap-4 xl:grid-cols-3">
        <OrderColumn
          title="Nuevos"
          icon={<BellRing className="h-6 w-6" />}
          orders={grouped.nuevo}
          accentColor={accentColor}
          empty="Sin pedidos nuevos"
          renderActions={(order) => (
            <>
              <Button className="h-11 flex-1 rounded-2xl font-black" style={{ backgroundColor: accentColor }} disabled={updatingId === order.id} onClick={() => updateStatus(order, 'preparando')}>
                Preparar
              </Button>
              <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/20" disabled={updatingId === order.id} onClick={() => updateStatus(order, 'cancelado')}>
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        />
        <OrderColumn
          title="Preparando"
          icon={<Clock3 className="h-6 w-6" />}
          orders={grouped.preparando}
          accentColor="#f59e0b"
          empty="Nada preparando"
          renderActions={(order) => (
            <Button className="h-11 w-full rounded-2xl bg-emerald-600 font-black hover:bg-emerald-700" disabled={updatingId === order.id} onClick={() => updateStatus(order, 'listo')}>
              Listo
            </Button>
          )}
        />
        <OrderColumn
          title="Listos"
          icon={<CheckCircle2 className="h-6 w-6" />}
          orders={grouped.listo}
          accentColor="#16a34a"
          empty="No hay tragos listos"
          renderActions={(order) => (
            <Button className="h-11 w-full rounded-2xl bg-white font-black text-slate-950 hover:bg-slate-100" disabled={updatingId === order.id} onClick={() => updateStatus(order, 'entregado')}>
              Entregado
            </Button>
          )}
        />
      </section>

      <section className="mt-4 rounded-[2rem] border border-white/10 bg-white/8 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-white/70" />
          <h2 className="text-xl font-black">Ultimos cerrados</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {grouped.historial.map((order) => (
            <div key={order.id} className="rounded-2xl border border-white/10 bg-white/8 p-3">
              <Badge className={STATUS_STYLES[order.status]}>{STATUS_LABELS[order.status]}</Badge>
              <p className="mt-2 font-black">{order.drinkName}</p>
              <p className="text-sm text-white/55">{order.guestName} · {minutesAgo(order.createdAt)}</p>
            </div>
          ))}
          {grouped.historial.length === 0 && <p className="text-sm text-white/45">Todavia no hay historial.</p>}
        </div>
      </section>
    </main>
  );
}

function OrderColumn({
  title,
  icon,
  orders,
  accentColor,
  empty,
  renderActions,
}: {
  title: string;
  icon: ReactNode;
  orders: BarDrinkOrder[];
  accentColor: string;
  empty: string;
  renderActions: (order: BarDrinkOrder) => ReactNode;
}) {
  return (
    <div className="min-h-[58vh] rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: accentColor }}>{icon}</div>
          <h2 className="text-2xl font-black">{title}</h2>
        </div>
        <Badge className="bg-white text-slate-950">{orders.length}</Badge>
      </div>
      <AnimatePresence initial={false}>
        <div className="space-y-3">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className={cn('rounded-[1.5rem] border border-white/10 bg-white p-4 text-slate-950 shadow-xl', order.status === 'nuevo' && 'ring-2 ring-rose-500/50')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-black">{order.drinkName}</p>
                  <p className="font-bold text-slate-500">{order.guestName}{order.tableNumber ? ` · ${order.tableNumber}` : ''}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
                  <p className="text-xs font-black uppercase text-slate-400">Hace</p>
                  <p className="font-black">{minutesAgo(order.createdAt)}</p>
                </div>
              </div>
              {order.note && <p className="mt-3 rounded-2xl bg-slate-100 p-3 text-sm font-semibold text-slate-600">{order.note}</p>}
              <div className="mt-4 flex gap-2">{renderActions(order)}</div>
            </motion.div>
          ))}
          {orders.length === 0 && (
            <div className="flex min-h-48 items-center justify-center rounded-[1.5rem] border border-dashed border-white/15 text-center text-white/45">
              {empty}
            </div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}
