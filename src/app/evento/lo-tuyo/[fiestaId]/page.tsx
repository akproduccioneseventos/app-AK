'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { ProgramaEventoItem } from '@/types/fiesta';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck,
  ChevronRight,
  Filter,
  Loader2,
  Calendar,
} from 'lucide-react';

const COMMON_ROLES = [
  { id: 'todos', name: 'Todo el Equipo' },
  { id: 'mozo', name: 'Mozo / Servicio' },
  { id: 'dj', name: 'DJ / Sonido' },
  { id: 'cocina', name: 'Cocina / Catering' },
  { id: 'fotografo', name: 'Fotógrafo / Video' },
  { id: 'barra', name: 'Barman / Barra' },
  { id: 'coordinador', name: 'Coordinador / Conducción' },
];

export default function LoTuyoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState<string>('La Fiesta');
  const [cronograma, setCronograma] = useState<ProgramaEventoItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('todos');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check url param or storage for role
    const urlRole = searchParams.get('rol');
    const savedRole = localStorage.getItem(`ak_staff_role_${fiestaId}`);
    if (urlRole) {
      setSelectedRole(urlRole);
      localStorage.setItem(`ak_staff_role_${fiestaId}`, urlRole);
    } else if (savedRole) {
      setSelectedRole(savedRole);
    }
  }, [fiestaId, searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const fiesta = await getFiestaById(fiestaId);
      if (fiesta) {
        setEventName(fiesta.configuracion.nombreEvento || 'La Fiesta');
        setCronograma(fiesta.cronograma || []);
      }
    } catch {
      toast({ title: 'Error al cargar cronograma', description: 'Revisá la conexión.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [fiestaId]);

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    localStorage.setItem(`ak_staff_role_${fiestaId}`, roleId);
  };

  const handleToggleCompleted = (id: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter items matching role (or general items)
  const filteredItems = useMemo(() => {
    return cronograma.filter((item) => {
      if (selectedRole === 'todos') return true;
      if (!item.rolId || item.rolId === 'todos') return true;
      return item.rolId.toLowerCase().includes(selectedRole.toLowerCase());
    });
  }, [cronograma, selectedRole]);

  // Current vs next milestones
  const activeMilestone = useMemo(() => {
    return filteredItems.find((item) => !completedItems.has(item.id) && !item.completado) || null;
  }, [filteredItems, completedItems]);

  const upcomingMilestones = useMemo(() => {
    if (!activeMilestone) return [];
    const idx = filteredItems.findIndex((item) => item.id === activeMilestone.id);
    return filteredItems.slice(idx + 1);
  }, [filteredItems, activeMilestone]);

  if (loading && !cronograma.length) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-bold text-slate-400">Cargando tu cronograma...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 pb-20 select-none">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              {eventName}
            </span>
            <h1 className="text-2xl font-black text-white">Lo tuyo, ahora</h1>
          </div>
          <Badge variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 text-xs px-2.5 py-1">
            En vivo
          </Badge>
        </div>

        {/* Selector de Rol táctil */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Tu función esta noche:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {COMMON_ROLES.map((r) => {
              const active = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleChange(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* TARJETA DESTACADA: Lo que te toca AHORA */}
        {activeMilestone ? (
          <div className="p-0.5 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-amber-500 shadow-2xl shadow-rose-500/10">
            <Card className="bg-slate-900 border-none rounded-[22px] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Clock className="w-3.5 h-3.5" /> {activeMilestone.hora || 'Ahora'}
                  </span>
                  {activeMilestone.rolNombre && (
                    <span className="text-xs font-black text-rose-400">
                      {activeMilestone.rolNombre}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {activeMilestone.titulo}
                  </h2>
                  {activeMilestone.descripcion && (
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed font-medium">
                      {activeMilestone.descripcion}
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleToggleCompleted(activeMilestone.id)}
                  className="w-full h-14 text-base font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-95 shadow-xl shadow-teal-500/20 rounded-2xl active:scale-95 transition-all mt-2"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Listo, momento completado
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-slate-900 border-slate-800 rounded-3xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-lg font-black text-white">¡Todo al día!</h3>
            <p className="text-xs text-slate-400 mt-1">Completaste todas las tareas asignadas a tu rol.</p>
          </Card>
        )}

        {/* Lo que viene después */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Próximos momentos de la noche
          </h3>

          {upcomingMilestones.length > 0 ? (
            upcomingMilestones.map((item) => {
              const isDone = completedItems.has(item.id) || item.completado;

              return (
                <Card
                  key={item.id}
                  onClick={() => handleToggleCompleted(item.id)}
                  className={`border rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                    isDone
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 shrink-0">
                        {item.hora}
                      </span>
                      <div>
                        <p className={`text-sm font-bold text-white ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {item.titulo}
                        </p>
                        {item.descripcion && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {item.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-2">No hay más momentos programados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
