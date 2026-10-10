'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Loader2,
  Martini,
  RefreshCw,
  Sparkles,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { BarDrinkOrder, BarDrinkOrderStatus, BarTechnologyDashboard } from '@/types/barra-tecnologica';
import {
  getBarraTecnologicaDashboard,
  updateBarDrinkOrderStatus,
  createBarmanManualOrder,
  guardarAperturaDeBarraAction,
  getCierreDeBarra,
  guardarCierreDeBarra,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Trago } from '@/types/fiesta';
import { usePantallaPrendida } from '@/hooks/use-pantalla-prendida';
import { AvisoDeDatos } from '@/components/legal/AvisoDeDatos';

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

const ALLOWED_NEXT_STATUS: Partial<Record<BarDrinkOrderStatus, BarDrinkOrderStatus[]>> = {
  nuevo: ['preparando', 'cancelado'],
  preparando: ['listo', 'cancelado'],
  listo: ['entregado'],
};

function minutesAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'recién';
  return `${minutes} min`;
}

export default function BarmanScreenPage() {
  usePantallaPrendida();
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<BarTechnologyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [quickDrink, setQuickDrink] = useState<Trago | null>(null);
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
    try {
      const result = await getBarraTecnologicaDashboard(fiestaId);
      if (result.success && result.data) {
        const activeIds = new Set(result.data.orders.filter((order) => order.status === 'nuevo').map((order) => order.id));
        const hasNew = [...activeIds].some((id) => !knownOrderIdsRef.current.has(id));
        if (playSound && hasNew) beep();
        knownOrderIdsRef.current = activeIds;
        setDashboard(result.data);
      } else {
        toast({ title: 'No se pudo cargar la barra', description: result.error || 'Error al comunicarse con el servidor.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error al actualizar pedidos', description: 'Ocurrió un problema de conexión al cargar la lista de pedidos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [beep, fiestaId, toast]);

  useEffect(() => {
    loadData(false);
    const interval = window.setInterval(() => loadData(true), 2200);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const updateStatus = async (order: BarDrinkOrder, status: BarDrinkOrderStatus) => {
    if (!ALLOWED_NEXT_STATUS[order.status]?.includes(status)) return;
    setUpdatingId(order.id);
    const result = await updateBarDrinkOrderStatus(fiestaId, order.id, status);
    if (!result.success) {
      toast({ title: 'No se pudo actualizar', description: result.error, variant: 'destructive' });
    }
    await loadData(false);
    setUpdatingId(null);
  };

  const handleQuickOrder = async (drinkId: string) => {
    setUpdatingId(drinkId);
    const result = await createBarmanManualOrder({ fiestaId, drinkId });
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Registrado', description: 'Trago descontado del stock.', variant: 'default' });
      setQuickDrink(null);
      await loadData(false);
    }
    setUpdatingId(null);
  };

  // Estados para apertura y cierre
  const [mostrarApertura, setMostrarApertura] = useState(false);
  const [botellasApertura, setBotellasApertura] = useState<Record<string, number>>({});
  const [guardandoApertura, setGuardandoApertura] = useState(false);

  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [cierreFilas, setCierreFilas] = useState<any[]>([]);
  const [conteoCierre, setConteoCierre] = useState<Record<string, number>>({});
  const [guardandoCierre, setGuardandoCierre] = useState(false);
  const [cierreGuardado, setCierreGuardado] = useState<any>(null);

  // Alerta de stock < 20%
  const avisosStockBajo = useMemo(() => {
    const avisos: string[] = [];
    if (!dashboard?.drinks) return avisos;
    for (const d of dashboard.drinks) {
      if (typeof d.stockDisponible === 'number' && d.stockDisponible <= 2) {
        avisos.push(`${d.nombre}: stock crítico (${d.stockDisponible} tragos restantes).`);
      }
    }
    return avisos;
  }, [dashboard?.drinks]);

  const abrirApertura = () => {
    const inicial: Record<string, number> = {};
    if (dashboard?.drinks) {
      for (const d of dashboard.drinks) {
        inicial[d.id] = (dashboard.apertura?.botellasRecibidas?.[d.id]) ?? 5;
      }
    }
    setBotellasApertura(inicial);
    setMostrarApertura(true);
  };

  const guardarApertura = async () => {
    setGuardandoApertura(true);
    try {
      const res = await guardarAperturaDeBarraAction(fiestaId, botellasApertura);
      if (!res.success) throw new Error(res.error || 'No se pudo guardar la apertura.');
      toast({ title: 'Barra abierta', description: 'Stock inicial registrado con éxito.' });
      setMostrarApertura(false);
      await loadData(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setGuardandoApertura(false);
    }
  };

  const abrirCierre = async () => {
    try {
      const res = await getCierreDeBarra(fiestaId);
      if (res.success && res.filas) {
        setCierreFilas(res.filas);
        setCierreGuardado(res.ultimoCierre || null);
        const inicialConteo: Record<string, number> = {};
        for (const f of res.filas) {
          inicialConteo[f.insumoId] = f.enSistema;
        }
        setConteoCierre(inicialConteo);
        setMostrarCierre(true);
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo cargar el cierre.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: 'Error al cargar informe de cierre.', variant: 'destructive' });
    }
  };

  const confirmarCierre = async (ajustar: boolean) => {
    setGuardandoCierre(true);
    try {
      const res = await guardarCierreDeBarra(fiestaId, conteoCierre, ajustar);
      if (!res.success) throw new Error(res.error || 'No se pudo guardar el cierre.');
      toast({ title: 'Cierre registrado', description: 'Informe de la noche guardado.' });
      setCierreGuardado(res.cierre);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setGuardandoCierre(false);
    }
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
      <div className="ak-live-stage flex min-h-screen items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  const settings = dashboard?.settings;
  const accentColor = settings?.accentColor || '#dc2626';

  return (
    <main className="ak-live-stage min-h-screen p-4 text-white">
      <header className="ak-live-panel mb-4 flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg shadow-xl" style={{ backgroundColor: accentColor }}>
            <Martini className="h-9 w-9" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">Pantalla barman</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">{settings?.barmanTitle || 'Pedidos de barra en vivo'}</h1>
            <p className="text-white/60">{dashboard?.eventName}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-12 rounded-lg border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-bold hover:bg-emerald-900/40"
            onClick={abrirApertura}
          >
            <ClipboardCheck className="mr-2 h-4 w-4 text-emerald-400" /> Recibí la barra
          </Button>

          <Button
            variant="outline"
            className="h-12 rounded-lg border-amber-500/40 bg-amber-950/30 text-amber-300 font-bold hover:bg-amber-900/40"
            onClick={abrirCierre}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-amber-400" /> Cierre e Informe
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 rounded-lg border-white/20 bg-white/10 font-bold text-white hover:bg-white/20"
          >
            <Link href={`/evento/barra/${fiestaId}/listo`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4 text-emerald-400" /> Pantalla "Listos"
            </Link>
          </Button>

          <Button variant="outline" className="h-12 rounded-lg border-white/20 bg-white/10 font-black text-white hover:bg-white/20" onClick={() => loadData(false)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
        </div>
      </header>

      {/* Alerta de Stock Crítico (< 20%) */}
      {avisosStockBajo.length > 0 && (
        <div className="mb-4 rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 text-rose-200 shadow-lg flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0 animate-bounce" />
          <div className="flex-1 text-sm font-semibold">
            <span className="font-black text-white uppercase tracking-wider block sm:inline mr-2">
              ⚠️ Alerta de reposición:
            </span>
            {avisosStockBajo.join(' · ')}
          </div>
        </div>
      )}

      {/* Panel de Consumo Rápido */}
      {dashboard?.drinks && dashboard.drinks.length > 0 && (
        <section className="ak-live-panel mb-4 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-black">Registro de Consumo Rápido</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {dashboard.drinks.map((drink) => (
              <Button
                key={drink.id}
                variant="secondary"
                className="whitespace-nowrap rounded-lg h-12 font-bold bg-white/10 hover:bg-white/20 text-white border border-white/5"
                onClick={() => setQuickDrink(drink)}
              >
                {drink.nombre}
              </Button>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        <OrderColumn
          title="Nuevos"
          icon={<BellRing className="h-6 w-6" />}
          orders={grouped.nuevo}
          accentColor={accentColor}
          empty="Sin pedidos nuevos"
          renderActions={(order) => (
            <>
              <Button className="h-11 flex-1 rounded-lg font-black" style={{ backgroundColor: accentColor }} disabled={updatingId === order.id} onClick={() => updateStatus(order, 'preparando')}>
                Preparar
              </Button>
              <Button variant="outline" className="h-11 rounded-lg border-slate-300 bg-white font-bold text-red-600 hover:bg-red-50 hover:text-red-700" disabled={updatingId === order.id} onClick={() => updateStatus(order, 'cancelado')} aria-label="Cancelar pedido" title="Cancelar pedido">
                <XCircle className="h-4 w-4" aria-hidden="true" />
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
            <div className="flex gap-2">
              <Button className="h-11 flex-1 rounded-lg bg-emerald-600 font-black hover:bg-emerald-700" disabled={updatingId === order.id} onClick={() => updateStatus(order, 'listo')}>
                Listo
              </Button>
              <Button variant="outline" className="h-11 rounded-lg border-slate-300 bg-white font-bold text-red-600 hover:bg-red-50 hover:text-red-700" disabled={updatingId === order.id} onClick={() => updateStatus(order, 'cancelado')} aria-label="Cancelar pedido" title="Cancelar pedido">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
        <OrderColumn
          title="Listos"
          icon={<CheckCircle2 className="h-6 w-6" />}
          orders={grouped.listo}
          accentColor="#16a34a"
          empty="No hay tragos listos"
          renderActions={(order) => (
            <Button className="h-11 w-full rounded-lg bg-white font-black text-slate-950 hover:bg-slate-100" disabled={updatingId === order.id} onClick={() => updateStatus(order, 'entregado')}>
              Entregado
            </Button>
          )}
        />
      </section>

      <section className="ak-live-panel mt-4 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-white/70" />
          <h2 className="text-xl font-black">Ultimos cerrados</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {grouped.historial.map((order) => (
            <div key={order.id} className="rounded-lg border border-white/10 bg-white/10 p-3">
              <Badge className={STATUS_STYLES[order.status]}>{STATUS_LABELS[order.status]}</Badge>
              <p className="mt-2 font-black">{order.drinkName}</p>
              <p className="text-sm text-white/55">{order.guestName} · {minutesAgo(order.createdAt)}</p>
            </div>
          ))}
          {grouped.historial.length === 0 && <p className="text-sm text-white/45">Todavia no hay historial.</p>}
        </div>
      </section>

      <Dialog open={!!quickDrink} onOpenChange={(o) => !o && setQuickDrink(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Registro Rápido</DialogTitle>
            <DialogDescription className="text-white/60">
              ¿Registrar entrega de {quickDrink?.nombre}? Se descontará del stock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setQuickDrink(null)} className="border-white/20 bg-transparent text-white hover:bg-white/10">No, cancelar</Button>
            <Button
               disabled={updatingId === quickDrink?.id}
               onClick={() => quickDrink && handleQuickOrder(quickDrink.id)}
               className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Sí, registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Recibí la barra (Apertura) */}
      <Dialog open={mostrarApertura} onOpenChange={(o) => !o && setMostrarApertura(false)}>
        <DialogContent className="sm:max-w-lg bg-slate-900 text-white border-white/10 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <ClipboardCheck className="w-5 h-5" /> Apertura: Recibí la barra
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Anotá cuántas botellas o insumos recibiste para iniciar la fiesta. Esto fija el stock inicial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {dashboard?.drinks && dashboard.drinks.map((drink) => (
              <div key={drink.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="font-semibold text-sm">{drink.nombre}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Botellas:</span>
                  <Input
                    type="number"
                    min="0"
                    value={botellasApertura[drink.id] ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setBotellasApertura((prev) => ({ ...prev, [drink.id]: val }));
                    }}
                    className="w-20 text-center bg-slate-800 border-white/20 text-white font-bold h-9"
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setMostrarApertura(false)} className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button
              disabled={guardandoApertura}
              onClick={guardarApertura}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {guardandoApertura ? 'Guardando...' : 'Confirmar recepción de barra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Cierre de Barra e Informe de la Noche */}
      <Dialog open={mostrarCierre} onOpenChange={(o) => !o && setMostrarCierre(false)}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 text-white border-white/10 max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <FileSpreadsheet className="w-5 h-5" /> Cierre de Barra e Informe de la Noche
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Compará el stock teórico con el conteo físico de botellas sobrantes para registrar diferencias.
            </DialogDescription>
          </DialogHeader>

          {/* Resumen de la noche */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-[11px] text-white/50 uppercase font-mono">Tragos Servidos</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {(dashboard?.orders || []).filter((o) => o.status === 'entregado' || o.status === 'listo').length}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-[11px] text-white/50 uppercase font-mono">Pedidos Totales</div>
              <div className="text-2xl font-black text-white mt-1">
                {(dashboard?.orders || []).length}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-[11px] text-white/50 uppercase font-mono">Estado Cierre</div>
              <div className="text-sm font-bold text-emerald-400 mt-2">
                {cierreGuardado ? 'Guardado' : 'Pendiente'}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-[11px] text-white/50 uppercase font-mono">Bebidas en Carta</div>
              <div className="text-2xl font-black text-white mt-1">
                {(dashboard?.drinks || []).length}
              </div>
            </div>
          </div>

          {/* Tabla de botellas / insumos */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {cierreFilas.map((fila) => {
              const contado = conteoCierre[fila.insumoId] ?? fila.enSistema;
              const diferencia = Math.max(0, fila.enSistema - contado);
              return (
                <div key={fila.insumoId} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                  <div>
                    <div className="font-bold text-sm text-white">{fila.nombre}</div>
                    <div className="text-white/50">
                      En sistema: {fila.enSistema} {fila.unidad} · Consumido: {fila.consumidoPorPedidos} {fila.unidad}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-[10px] text-white/40">Físico contado:</div>
                      <Input
                        type="number"
                        min="0"
                        value={conteoCierre[fila.insumoId] ?? ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setConteoCierre((prev) => ({ ...prev, [fila.insumoId]: isNaN(val) ? 0 : val }));
                        }}
                        className="w-20 text-center bg-slate-800 border-white/20 text-white font-bold h-8 text-xs"
                      />
                    </div>
                    {diferencia > 0 && (
                      <div className="text-rose-400 font-semibold text-[11px]">
                        -{diferencia} {fila.unidad} sin registrar
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:justify-end mt-4">
            <Button variant="outline" onClick={() => setMostrarCierre(false)} className="border-white/20 bg-transparent text-white hover:bg-white/10 text-xs">
              Cerrar
            </Button>
            <Button
              disabled={guardandoCierre}
              onClick={() => confirmarCierre(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              {guardandoCierre ? 'Guardando...' : 'Guardar y ajustar depósito'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8 text-center text-xs text-white/40">
        <AvisoDeDatos para="invitado" />
      </div>
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
    <div className="ak-live-panel p-4 md:min-h-[58vh]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: accentColor }}>{icon}</div>
          <h2 className="text-2xl font-black">{title}</h2>
        </div>
        <Badge className="bg-white text-slate-950">{orders.length}</Badge>
      </div>
      <AnimatePresence initial={false}>
        <div className="space-y-3" aria-live="polite">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              aria-label={`${order.drinkName}, ${STATUS_LABELS[order.status]}, ${order.guestName}`}
              className={cn('rounded-lg border border-white/10 bg-white p-4 text-slate-950 shadow-xl', order.status === 'nuevo' && 'ring-2 ring-rose-500/50')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-black leading-tight">{order.drinkName}</p>
                  <p className="font-bold text-slate-500">{order.guestName}{order.tableNumber ? ` · ${order.tableNumber}` : ''}</p>
                </div>
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-right">
                  <p className="text-xs font-black uppercase text-slate-400">Hace</p>
                  <p className="font-black">{minutesAgo(order.createdAt)}</p>
                </div>
              </div>
              {order.note && <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-600">{order.note}</p>}
              <div className="mt-4 flex gap-2">{renderActions(order)}</div>
            </motion.div>
          ))}
          {orders.length === 0 && (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-white/15 text-center text-white/45">
              {empty}
            </div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}
