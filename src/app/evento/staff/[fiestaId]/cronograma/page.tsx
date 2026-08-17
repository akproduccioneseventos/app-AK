'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Clock, CheckCircle2, Circle, AlertCircle, Sparkles, RefreshCw, UserCheck, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, ProgramaEventoItem } from '@/types/fiesta';
import { useToast } from '@/hooks/use-toast';

const ROLES = [
  { id: 'Todos', label: 'Todo el Equipo' },
  { id: 'Mozo', label: 'Mozos / Salón' },
  { id: 'DJ', label: 'DJ / Sonido' },
  { id: 'Fotógrafo', label: 'Fotografía / Video' },
  { id: 'Catering', label: 'Cocina / Catering' },
  { id: 'Animador', label: 'Animación' },
  { id: 'Coordinador', label: 'Coordinación' },
];

export default function StaffCronogramaPage() {
  const params = useParams<{ fiestaId: string }>();
  const fiestaId = params.fiestaId;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('Todos');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getFiestaById(fiestaId);
      setFiesta(data);
    } catch (err) {
      console.error('Error cargando cronograma de staff:', err);
    } finally {
      setLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
    // Actualizar reloj cada 30 segundos
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  const programa = useMemo(() => fiesta?.programa || [], [fiesta?.programa]);

  // Filtrar por rol
  const filteredItems = useMemo(() => {
    if (selectedRole === 'Todos') return programa;
    return programa.filter(
      (item) => !item.rolAsignado || item.rolAsignado === 'Todos' || item.rolAsignado === selectedRole
    );
  }, [programa, selectedRole]);

  // Determinar ítem actual ("Ahora") y próximo ("Próximo")
  const { currentItem, nextItem, upcomingItems } = useMemo(() => {
    const uncompleted = filteredItems.filter((i) => !i.completado);
    if (uncompleted.length === 0) {
      return { currentItem: null, nextItem: null, upcomingItems: [] };
    }
    return {
      currentItem: uncompleted[0],
      nextItem: uncompleted[1] || null,
      upcomingItems: uncompleted.slice(2),
    };
  }, [filteredItems]);

  const handleToggleComplete = async (item: ProgramaEventoItem) => {
    if (!fiesta) return;
    setUpdatingId(item.id);
    const updatedPrograma = programa.map((p) =>
      p.id === item.id ? { ...p, completado: !p.completado } : p
    );

    const updatedFiesta: FiestaEnPlanificacion = {
      ...fiesta,
      programa: updatedPrograma,
    };

    setFiesta(updatedFiesta);
    try {
      const res = await saveFiesta(updatedFiesta);
      if (res.success) {
        toast({
          title: item.completado ? 'Hito reabierto' : '¡Hito completado!',
          description: item.titulo,
        });
      }
    } catch {
      toast({
        title: 'Error de red',
        description: 'No se pudo sincronizar el estado.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-bold">Cargando cronograma del staff...</p>
      </div>
    );
  }

  const eventName = fiesta?.configuracion.nombreEvento || 'Fiesta AK';

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header fijo */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400">
              <Sparkles className="h-3.5 w-3.5" /> Staff En Vivo · {eventName}
            </div>
            <h1 className="font-headline text-lg font-black text-white mt-0.5">
              Lo tuyo, ahora
            </h1>
          </div>
          <div className="text-right">
            <div className="font-mono text-xl font-black text-amber-400">{currentTime}</div>
            <span className="text-[10px] text-slate-400 uppercase">Hora actual</span>
          </div>
        </div>

        {/* Selector de Rol */}
        <div className="max-w-xl mx-auto mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ROLES.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {/* BLOQUE: LO TUYO AHORA MISMO */}
        {currentItem ? (
          <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-amber-500/30 pb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                AHORA MISMO
              </span>
              <span className="font-mono text-base font-black text-white bg-amber-500/30 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                {currentItem.hora}
              </span>
            </div>

            <h2 className="text-xl font-black text-white mb-1.5">{currentItem.titulo}</h2>
            {currentItem.descripcion && (
              <p className="text-sm text-slate-300 mb-4 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {currentItem.descripcion}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-amber-400/80 font-semibold">
                Rol: {currentItem.rolAsignado || 'Todos'}
              </span>
              <Button
                onClick={() => handleToggleComplete(currentItem)}
                disabled={updatingId === currentItem.id}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 rounded-xl h-10 px-4 shadow-md"
              >
                {updatingId === currentItem.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Marcar Listo</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center text-emerald-300">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
            <h3 className="font-bold text-base">¡Todos los hitos asignados están al día!</h3>
            <p className="text-xs text-emerald-400/80 mt-1">
              Excelente trabajo coordinando este evento.
            </p>
          </div>
        )}

        {/* BLOQUE: PRÓXIMO HITO */}
        {nextItem && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-slate-400" />
                PRÓXIMO EN PREPARACIÓN
              </span>
              <span className="font-mono text-sm font-bold text-slate-300">{nextItem.hora}</span>
            </div>
            <h3 className="text-base font-bold text-slate-100">{nextItem.titulo}</h3>
            {nextItem.descripcion && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{nextItem.descripcion}</p>
            )}
          </div>
        )}

        {/* LISTA COMPLETA DEL CRONOGRAMA */}
        <div className="pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            Línea de Tiempo Completa ({filteredItems.length} hitos)
          </h3>
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const isDone = Boolean(item.completado);
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isDone
                      ? 'border-slate-800/60 bg-slate-900/30 opacity-60'
                      : 'border-slate-800 bg-slate-900/90 text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(item)}
                    disabled={updatingId === item.id}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-400 transition"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{item.hora}</span>
                      <h4 className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                        {item.titulo}
                      </h4>
                    </div>
                    {item.descripcion && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.descripcion}</p>
                    )}
                    {item.rolAsignado && item.rolAsignado !== 'Todos' && (
                      <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full mt-1.5">
                        {item.rolAsignado}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
