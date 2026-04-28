'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  RefreshCw,
  ExternalLink,
  BellOff,
  Trash2,
} from 'lucide-react';
import { getAlertasGlobalesConLeidas, marcarAlertaLeida, marcarTodasLeidas, descartarAlerta } from '@/app/actions/alertas.actions';
import type { AlertaAutomatica } from '@/types/automatizaciones';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function tipoIcon(tipo: AlertaAutomatica['tipo']) {
  switch (tipo) {
    case 'urgente':
      return <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />;
    case 'atencion':
      return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
    case 'recordatorio':
      return <Bell className="w-5 h-5 text-blue-500 shrink-0" />;
    default:
      return <Info className="w-5 h-5 text-slate-400 shrink-0" />;
  }
}

function tipoBadge(tipo: AlertaAutomatica['tipo']) {
  switch (tipo) {
    case 'urgente':
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-black uppercase">Urgente</Badge>;
    case 'atencion':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-black uppercase">Atención</Badge>;
    case 'recordatorio':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-black uppercase">Recordatorio</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-black uppercase">Info</Badge>;
  }
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-UY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<AlertaAutomatica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');
  const [filtroFiesta, setFiltroFiesta] = useState<string>('todas');
  const { toast } = useToast();

  const fetchAlertas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAlertasGlobalesConLeidas();
      setAlertas(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las alertas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAlertas(); }, [fetchAlertas]);

  const handleMarcarLeida = useCallback(async (alertaId: string) => {
    try {
      const result = await marcarAlertaLeida(alertaId);
      if (result.success) {
        setAlertas(prev => prev.map(a => a.id === alertaId ? { ...a, leida: true } : a));
      } else {
        toast({ title: 'Error', description: 'No se pudo marcar como leída.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo marcar como leída.', variant: 'destructive' });
    }
  }, [toast]);

  const handleDescartar = useCallback(async (alertaId: string) => {
    // Optimistically remove from local state
    setAlertas(prev => prev.filter(a => a.id !== alertaId));
    try {
      const result = await descartarAlerta(alertaId);
      if (!result.success) {
        toast({ title: 'Error', description: 'No se pudo eliminar la alerta.', variant: 'destructive' });
        fetchAlertas();
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar la alerta.', variant: 'destructive' });
      fetchAlertas();
    }
  }, [toast, fetchAlertas]);

  const handleMarcarTodasLeidas = useCallback(async () => {
    setIsMarkingAll(true);
    try {
      const result = await marcarTodasLeidas();
      if (result.success) {
        await fetchAlertas();
        toast({ title: 'Listo', description: 'Todas las alertas marcadas como leídas.' });
      } else {
        toast({ title: 'Error', description: 'No se pudieron marcar todas como leídas.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudieron marcar todas como leídas.', variant: 'destructive' });
    } finally {
      setIsMarkingAll(false);
    }
  }, [fetchAlertas, toast]);

  // Derived
  const urgentes = alertas.filter(a => a.tipo === 'urgente' && !a.leida).length;
  const atenciones = alertas.filter(a => a.tipo === 'atencion' && !a.leida).length;
  const infos = alertas.filter(a => (a.tipo === 'info' || a.tipo === 'recordatorio') && !a.leida).length;

  const fiestas = useMemo(() => {
    const nombres = new Map<string, string>();
    alertas.forEach(a => nombres.set(a.fiestaId, a.fiestaName));
    return Array.from(nombres.entries());
  }, [alertas]);

  const filtradas = useMemo(() => {
    return alertas.filter(a => {
      if (filtroTipo !== 'todas' && a.tipo !== filtroTipo) return false;
      if (filtroFiesta !== 'todas' && a.fiestaId !== filtroFiesta) return false;
      return true;
    });
  }, [alertas, filtroTipo, filtroFiesta]);

  // Group by fiesta
  const agrupadas = useMemo(() => {
    const map = new Map<string, AlertaAutomatica[]>();
    filtradas.forEach(a => {
      if (!map.has(a.fiestaId)) map.set(a.fiestaId, []);
      map.get(a.fiestaId)!.push(a);
    });
    return map;
  }, [filtradas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-xl">
            <Bell className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Centro de Alertas</h1>
            <p className="text-sm text-slate-500">Notificaciones automáticas de todas las fiestas activas</p>
          </div>
        </div>
        <div className="flex gap-2">
          {alertas.some(a => !a.leida) && (
            <Button variant="outline" size="sm" onClick={handleMarcarTodasLeidas} disabled={isMarkingAll || isLoading}>
              {isMarkingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Marcar todas leídas
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchAlertas} disabled={isLoading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Actualizar
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-700">{urgentes}</p>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Urgentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-700">{atenciones}</p>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Atención</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-700">{infos}</p>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">Info / Recordatorio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de alerta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las alertas</SelectItem>
                <SelectItem value="urgente">🔴 Urgentes</SelectItem>
                <SelectItem value="atencion">🟡 Atención</SelectItem>
                <SelectItem value="recordatorio">🔵 Recordatorios</SelectItem>
                <SelectItem value="info">⚪ Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={filtroFiesta} onValueChange={setFiltroFiesta}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por fiesta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las fiestas</SelectItem>
                {fiestas.map(([id, nombre]) => (
                  <SelectItem key={id} value={id}>{nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">Sin alertas activas</p>
            <p className="text-sm text-slate-400 mt-1">Todo está bajo control 🎉</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(agrupadas.entries()).map(([fiestaId, items]) => (
            <Card key={fiestaId} className="overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-5 bg-slate-50/80 border-b border-slate-100">
                <CardTitle className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  {items[0].fiestaName}
                  <Badge className="ml-auto bg-slate-200 text-slate-600 text-[10px]">
                    {items.length} alerta{items.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {items.map(alerta => (
                    <div
                      key={alerta.id}
                      className={cn(
                        'flex items-start gap-3 px-5 py-4 transition-colors',
                        alerta.leida ? 'opacity-50' : 'hover:bg-slate-50/50',
                      )}
                    >
                      {tipoIcon(alerta.tipo)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {tipoBadge(alerta.tipo)}
                          <span className="text-xs text-slate-400">{formatFecha(alerta.fechaGenerada)}</span>
                        </div>
                        <p className={cn('text-sm font-semibold', alerta.leida ? 'line-through text-slate-400' : 'text-slate-800')}>
                          {alerta.mensaje}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {alerta.accionUrl && (
                          <Link href={alerta.accionUrl}>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {alerta.accionLabel ?? 'Ver'}
                            </Button>
                          </Link>
                        )}
                        {!alerta.leida && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-slate-400 hover:text-green-600"
                            onClick={() => handleMarcarLeida(alerta.id)}
                            aria-label={`Marcar alerta como leída: ${alerta.mensaje}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Marcar como leída
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-slate-400 hover:text-red-600"
                          onClick={() => handleDescartar(alerta.id)}
                          aria-label={`Eliminar alerta: ${alerta.mensaje}`}
                          title="Eliminar alerta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
