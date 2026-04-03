'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { KanbanSquare, ArrowLeft, Loader2, RefreshCw, CalendarDays, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getFiestas, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const PIPELINE_STAGES = [
  { id: 'Lead',       label: 'Lead',       color: 'bg-sky-500',     textColor: 'text-sky-50',   cardBg: 'bg-sky-50',     border: 'border-sky-300' },
  { id: 'Reunión',    label: 'Reunión',    color: 'bg-teal-500',    textColor: 'text-teal-50',  cardBg: 'bg-teal-50',    border: 'border-teal-300' },
  { id: 'Cotizado',   label: 'Cotizado',   color: 'bg-amber-500',   textColor: 'text-amber-50', cardBg: 'bg-amber-50',   border: 'border-amber-300' },
  { id: 'Seña',       label: 'Señado',     color: 'bg-violet-500',  textColor: 'text-violet-50',cardBg: 'bg-violet-50',  border: 'border-violet-300' },
  { id: 'Completado', label: 'Completado', color: 'bg-emerald-500', textColor: 'text-emerald-50',cardBg:'bg-emerald-50', border: 'border-emerald-300' },
];

const DEFAULT_STAGE = 'Lead';

const formatCurrency = (v?: number) =>
  v == null ? '—' : new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(v);

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function VentasPage() {
  const { toast } = useToast();
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFiestas(true);
      setFiestas(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los eventos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleMove = async (fiesta: FiestaEnPlanificacion, newStage: string) => {
    setMovingId(fiesta.id);
    try {
      await saveFiesta({ ...fiesta, estado: newStage });
      setFiestas(prev => prev.map(f => f.id === fiesta.id ? { ...f, estado: newStage } : f));
      toast({ title: 'Movido', description: `${fiesta.configuracion.nombreEvento} → ${newStage}` });
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
    } finally {
      setMovingId(null);
    }
  };

  const byStage = (stageId: string) =>
    fiestas.filter(f => (f.estado || DEFAULT_STAGE) === stageId);

  const pipelineTotal = fiestas
    .filter(f => !['Completado', 'Cancelado', 'Archivado'].includes(f.estado || ''))
    .reduce((s, f) => s + (f.configuracion.presupuestoEstimado || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <KanbanSquare className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">Tablero Comercial</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Link href="/contabilidad/crm">
            <Button variant="outline" size="sm">CRM Prospectos</Button>
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <KanbanSquare className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Eventos</p>
              <p className="font-bold text-lg">{fiestas.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Pipeline Activo</p>
              <p className="font-bold text-lg">{formatCurrency(pipelineTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-violet-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Señados</p>
              <p className="font-bold text-lg">{byStage('Seña').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 overflow-x-auto">
          {PIPELINE_STAGES.map(stage => {
            const cards = byStage(stage.id);
            return (
              <div key={stage.id} className="min-w-[200px]">
                <div className={`rounded-t-lg px-3 py-2 ${stage.color}`}>
                  <span className={`font-semibold text-sm ${stage.textColor}`}>
                    {stage.label}
                    <Badge variant="secondary" className="ml-2 text-xs">{cards.length}</Badge>
                  </span>
                </div>
                <div className={`rounded-b-lg border ${stage.border} min-h-[200px] p-2 space-y-2 ${stage.cardBg}`}>
                  {cards.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-6">Sin eventos</p>
                  )}
                  {cards.map(fiesta => (
                    <Card key={fiesta.id} className="shadow-sm">
                      <CardContent className="p-3 space-y-1">
                        <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`} className="hover:underline">
                          <p className="font-semibold text-sm leading-tight">{fiesta.configuracion.nombreEvento || '(Sin nombre)'}</p>
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(fiesta.configuracion.fechaEvento)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {fiesta.configuracion.invitadosEstimados ?? '?'} invitados
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(fiesta.configuracion.presupuestoEstimado)}
                        </div>
                        {/* Move buttons */}
                        <div className="flex gap-1 flex-wrap pt-1">
                          {PIPELINE_STAGES.filter(s => s.id !== stage.id).map(s => (
                            <button
                              key={s.id}
                              disabled={movingId === fiesta.id}
                              onClick={() => handleMove(fiesta, s.id)}
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-opacity ${movingId === fiesta.id ? 'opacity-40' : 'hover:opacity-80'} ${s.color} ${s.textColor}`}
                            >
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
