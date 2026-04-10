'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Zap, Clock, CheckCircle2, AlertTriangle, Plus, RefreshCw,
  ArrowLeft, Play, Flag, Loader2,
} from 'lucide-react';
import {
  getMissionControl,
  updateEtapaEstado,
  toggleChecklistItem,
  addEtapa,
} from '@/app/actions/mission-control';
import type {
  MissionControlData, EtapaTimeline, EstadoEtapa, CategoriaEtapa,
} from '@/types/mission-control';

const CATEGORIA_OPTIONS: CategoriaEtapa[] = [
  'Montaje', 'Catering', 'DJ', 'Entrada', 'Torta', 'Brindis', 'Fotografía', 'Cierre', 'General',
];

function estadoBadgeVariant(estado: EstadoEtapa) {
  switch (estado) {
    case 'En Progreso': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Completada': return 'bg-green-100 text-green-700 border-green-200';
    case 'Retrasada': return 'bg-red-100 text-red-700 border-red-200';
    case 'Cancelada': return 'bg-gray-100 text-gray-500 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function categoriaBadgeColor(cat: CategoriaEtapa) {
  const map: Record<CategoriaEtapa, string> = {
    Montaje: 'bg-amber-100 text-amber-700',
    Catering: 'bg-orange-100 text-orange-700',
    DJ: 'bg-purple-100 text-purple-700',
    Entrada: 'bg-blue-100 text-blue-700',
    Torta: 'bg-pink-100 text-pink-700',
    Brindis: 'bg-yellow-100 text-yellow-700',
    Fotografía: 'bg-indigo-100 text-indigo-700',
    Cierre: 'bg-red-100 text-red-700',
    General: 'bg-gray-100 text-gray-700',
  };
  return map[cat] ?? 'bg-gray-100 text-gray-700';
}

interface AddEtapaForm {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  categoria: CategoriaEtapa;
  responsableLead: string;
  descripcion: string;
}

const defaultForm: AddEtapaForm = {
  nombre: '',
  horaInicio: '',
  horaFin: '',
  categoria: 'General',
  responsableLead: '',
  descripcion: '',
};

function MissionControlContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') ?? '';

  const [data, setData] = useState<MissionControlData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState<AddEtapaForm>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const cacheKey = `mission_control_${fiestaId}`;

  const loadData = useCallback(async (silent = false) => {
    if (!fiestaId) return;
    if (!silent) setIsLoading(true);
    try {
      const res = await getMissionControl(fiestaId);
      if (res.success && res.data) {
        setData(res.data);
        // Cache data in localStorage for offline use
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: res.data, timestamp: Date.now() }));
        } catch {}
      } else {
        // Try loading from cache if server fails
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setData(parsed.data);
          if (!silent) toast({ title: '📶 Sin conexión', description: 'Mostrando datos guardados localmente.', variant: 'default' });
        } else {
          if (!silent) toast({ title: 'Error', description: res.error, variant: 'destructive' });
        }
      }
    } catch {
      // Network error - load from cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed.data);
          if (!silent) toast({ title: '📶 Modo Offline', description: 'Usando datos guardados. Los cambios se sincronizarán al recuperar conexión.', variant: 'default' });
        } catch {}
      }
    }
    if (!silent) setIsLoading(false);
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleEstado = async (etapaId: string, estado: EstadoEtapa) => {
    setActionLoading(`estado-${etapaId}-${estado}`);
    const res = await updateEtapaEstado(fiestaId, etapaId, estado);
    if (res.success) {
      await loadData(true);
      toast({ title: 'Etapa actualizada' });
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
    setActionLoading(null);
  };

  const handleToggleChecklist = async (etapaId: string, itemId: string) => {
    setActionLoading(`check-${etapaId}-${itemId}`);
    const res = await toggleChecklistItem(fiestaId, etapaId, itemId, 'Usuario');
    if (res.success) {
      await loadData(true);
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
    setActionLoading(null);
  };

  const handleAddEtapa = async () => {
    if (!form.nombre || !form.horaInicio) {
      toast({ title: 'Faltan campos', description: 'Nombre y hora de inicio son obligatorios', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    const res = await addEtapa(fiestaId, {
      nombre: form.nombre,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin || undefined,
      categoria: form.categoria,
      responsableLead: form.responsableLead || 'Por asignar',
      descripcion: form.descripcion || undefined,
      estado: 'Pendiente',
      checklist: [],
    });
    if (res.success) {
      toast({ title: 'Etapa añadida' });
      setShowAddDialog(false);
      setForm(defaultForm);
      await loadData(true);
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const completedCount = data?.etapas.filter(e => e.estado === 'Completada').length ?? 0;
  const totalCount = data?.etapas.length ?? 0;
  const currentStage = data?.etapas.find(e => e.estado === 'En Progreso') ?? data?.etapas.find(e => e.estado === 'Pendiente');

  if (!fiestaId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No se especificó un evento. Vuelve al dashboard.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-medium">
          ⚠️ Sin conexión - Los cambios se guardarán cuando vuelva la señal
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Volver
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-bold text-lg leading-tight">Mission Control</h1>
                <p className="text-xs text-muted-foreground">Día del Evento</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(false)}
            className="gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Actualizar
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Overview bar */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-muted-foreground">Progreso del evento</span>
                  <span className="text-sm font-bold">{completedCount}/{totalCount} etapas</span>
                </div>
                <Progress value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0} className="h-2" />
              </div>
              <Separator orientation="vertical" className="hidden sm:block h-10" />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Etapa actual</p>
                  <p className="text-sm font-semibold">{currentStage?.nombre ?? '—'}</p>
                </div>
                <Badge
                  className={`text-xs border ${
                    data?.estadoGeneral === 'En Curso'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : data?.estadoGeneral === 'Completado'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {data?.estadoGeneral ?? 'En Preparación'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage timeline */}
        <div className="space-y-3">
          {data?.etapas
            .sort((a, b) => a.orden - b.orden)
            .map((etapa) => (
              <EtapaCard
                key={etapa.id}
                etapa={etapa}
                actionLoading={actionLoading}
                onEstado={handleEstado}
                onToggleChecklist={handleToggleChecklist}
              />
            ))}
        </div>

        {/* Add stage button */}
        <Button
          onClick={() => setShowAddDialog(true)}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" /> Añadir Etapa
        </Button>

        {/* Last update */}
        {data?.ultimaActualizacion && (
          <p className="text-center text-xs text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            Última actualización: {new Date(data.ultimaActualizacion).toLocaleTimeString('es-AR')}
          </p>
        )}
      </div>

      {/* Add stage dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Recepción de invitados"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Hora inicio *</label>
                <Input
                  type="time"
                  value={form.horaInicio}
                  onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hora fin</label>
                <Input
                  type="time"
                  value={form.horaFin}
                  onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <Select
                value={form.categoria}
                onValueChange={v => setForm(f => ({ ...f, categoria: v as CategoriaEtapa }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIA_OPTIONS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Responsable lead</label>
              <Input
                value={form.responsableLead}
                onChange={e => setForm(f => ({ ...f, responsableLead: e.target.value }))}
                placeholder="Nombre del responsable"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalles adicionales..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddEtapa} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EtapaCardProps {
  etapa: EtapaTimeline;
  actionLoading: string | null;
  onEstado: (etapaId: string, estado: EstadoEtapa) => void;
  onToggleChecklist: (etapaId: string, itemId: string) => void;
}

function EtapaCard({ etapa, actionLoading, onEstado, onToggleChecklist }: EtapaCardProps) {
  const completedChecklist = etapa.checklist.filter(i => i.completado).length;

  return (
    <Card className={`border ${etapa.alertaRetraso ? 'border-red-300 bg-red-50/30' : ''}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
              {etapa.orden}
            </span>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight">{etapa.nombre}</CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {etapa.horaInicio}{etapa.horaFin ? ` - ${etapa.horaFin}` : ''}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoriaBadgeColor(etapa.categoria)}`}>
                  {etapa.categoria}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {etapa.alertaRetraso && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${estadoBadgeVariant(etapa.estado)}`}>
              {etapa.estado}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {etapa.responsableLead && etapa.responsableLead !== 'Por asignar' && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Lead:</span> {etapa.responsableLead}
          </p>
        )}

        {/* Checklist */}
        {etapa.checklist.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Checklist</span>
              <span className="text-xs text-muted-foreground">{completedChecklist}/{etapa.checklist.length}</span>
            </div>
            {etapa.checklist.map(item => {
              const isLoading = actionLoading === `check-${etapa.id}-${item.id}`;
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={item.completado}
                    disabled={isLoading}
                    onChange={() => onToggleChecklist(etapa.id, item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                  />
                  <span className={`text-sm ${item.completado ? 'line-through text-muted-foreground' : ''}`}>
                    {item.texto}
                  </span>
                  {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
                </label>
              );
            })}
          </div>
        )}

        {etapa.notas && (
          <p className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-2">
            📝 {etapa.notas}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {etapa.estado === 'Pendiente' && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={!!actionLoading}
              onClick={() => onEstado(etapa.id, 'En Progreso')}
            >
              {actionLoading === `estado-${etapa.id}-En Progreso` ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Iniciar
            </Button>
          )}
          {(etapa.estado === 'En Progreso' || etapa.estado === 'Pendiente') && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
              disabled={!!actionLoading}
              onClick={() => onEstado(etapa.id, 'Completada')}
            >
              {actionLoading === `estado-${etapa.id}-Completada` ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Completar
            </Button>
          )}
          {etapa.estado !== 'Retrasada' && etapa.estado !== 'Completada' && etapa.estado !== 'Cancelada' && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
              disabled={!!actionLoading}
              onClick={() => onEstado(etapa.id, 'Retrasada')}
            >
              {actionLoading === `estado-${etapa.id}-Retrasada` ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Flag className="h-3 w-3" />
              )}
              Marcar Retrasada
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MissionControlPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <MissionControlContent />
    </Suspense>
  );
}
