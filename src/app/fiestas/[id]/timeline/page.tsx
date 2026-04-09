'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { saveTimeline } from '@/app/actions/fiesta/portal.actions';
import type { FiestaEnPlanificacion, TimelineHito } from '@/types/fiesta';
import { getTemplateForTipoEvento } from '@/data/timeline-templates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertTriangle, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function generarTimelineDesdeTemplate(fiesta: FiestaEnPlanificacion): TimelineHito[] {
  const tipoEvento = fiesta.configuracion?.tipoCelebracion ?? '';
  const fechaEventoStr = fiesta.configuracion?.fechaEvento;
  if (!fechaEventoStr) return [];
  const fechaEvento = new Date(fechaEventoStr);
  const template = getTemplateForTipoEvento(tipoEvento);
  return template.map(t => {
    const fecha = new Date(fechaEvento);
    fecha.setDate(fecha.getDate() - t.diasAntesDelEvento);
    return {
      id: t.id,
      nombre: t.nombre,
      emoji: t.emoji,
      fechaProgramada: fecha.toISOString().substring(0, 10),
      completado: false,
    };
  });
}

function getHitoStatus(hito: TimelineHito, hoy: Date): 'completado' | 'actual' | 'vencido' | 'futuro' {
  if (hito.completado) return 'completado';
  const fecha = new Date(hito.fechaProgramada);
  const diffDays = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'vencido';
  if (diffDays <= 7) return 'actual';
  return 'futuro';
}

const statusConfig = {
  completado: { dot: 'bg-green-500 border-green-600', text: 'text-slate-700', badge: 'bg-green-100 text-green-700' },
  actual: { dot: 'bg-blue-500 border-blue-600 animate-pulse', text: 'text-blue-800 font-semibold', badge: 'bg-blue-100 text-blue-700' },
  vencido: { dot: 'bg-red-400 border-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  futuro: { dot: 'bg-slate-300 border-slate-400', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-600' },
};

export default function TimelinePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const fiestaId = params.id as string;
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [timeline, setTimeline] = useState<TimelineHito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fiestaId) return;
    getFiestaById(fiestaId)
      .then(data => {
        if (!data) { setError('Evento no encontrado.'); return; }
        setFiesta(data);
        if (data.timeline && data.timeline.length > 0) {
          setTimeline(data.timeline);
        } else {
          setTimeline(generarTimelineDesdeTemplate(data));
        }
      })
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId]);

  const toggleHito = useCallback((id: string) => {
    setTimeline(prev => prev.map(h => {
      if (h.id !== id) return h;
      const completado = !h.completado;
      return { ...h, completado, fechaCompletado: completado ? new Date().toISOString() : undefined };
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveTimeline(fiestaId, timeline);
    if (result.success) {
      toast({ title: '✅ Timeline guardado', description: 'Los hitos han sido actualizados.' });
    } else {
      toast({ title: 'Error', description: result.error ?? 'No se pudo guardar.', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
    </div>
  );

  if (error || !fiesta) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md text-center border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  const hoy = new Date();
  const completados = timeline.filter(h => h.completado).length;
  const config = fiesta.configuracion;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{config?.nombreEvento ?? 'Evento'}</p>
            <p className="text-xs text-slate-500">Timeline · {completados}/{timeline.length} completados</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-purple-600 hover:bg-purple-700 shrink-0">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1.5">Guardar</span>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">📅 Timeline del Evento</h1>
          <p className="text-slate-500 text-sm mt-1">Cronograma de hitos importantes para <span className="font-semibold">{config?.nombreEvento}</span></p>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${timeline.length > 0 ? (completados / timeline.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

          <div className="space-y-4">
            {timeline.map(hito => {
              const status = getHitoStatus(hito, hoy);
              const cfg = statusConfig[status];
              return (
                <div key={hito.id} className="relative flex items-start gap-4">
                  <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 bg-white ${cfg.dot}`}>
                    <span className="text-base">{hito.emoji}</span>
                  </div>

                  <Card className="flex-1 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-black text-sm ${cfg.text}`}>{hito.nombre}</p>
                            <Badge className={`text-xs ${cfg.badge}`}>
                              {status === 'completado' ? '✓ Completado' : status === 'actual' ? 'Próximo' : status === 'vencido' ? 'Atrasado' : 'Pendiente'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {(() => {
                              const [year, month, day] = hito.fechaProgramada.split('-').map(Number);
                              return new Date(year, month - 1, day).toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                            })()}
                          </p>
                          {hito.completado && hito.fechaCompletado && (
                            <p className="text-xs text-green-600 mt-0.5">
                              ✓ Completado el {new Date(hito.fechaCompletado).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleHito(hito.id)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${hito.completado ? 'bg-green-500 border-green-600 text-white' : 'border-slate-300 hover:border-purple-400'}`}
                        >
                          {hito.completado && <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
