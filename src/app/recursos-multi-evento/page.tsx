'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle2, Users, Wrench, RefreshCw, CalendarDays } from 'lucide-react';
import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getEmpleados } from '@/app/actions/empleados';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Empleado } from '@/types/empleado';

interface ConflictoPersonal {
  empleadoId: string;
  empleadoNombre: string;
  fiestas: { id: string; nombre: string; fecha: string }[];
}

function detectarConflictos(
  fiestas: FiestaEnPlanificacion[],
  empleados: Empleado[],
): { conflictosPersonal: ConflictoPersonal[]; fechasConEventos: Record<string, FiestaEnPlanificacion[]> } {
  // Group fiestas by date
  const porFecha: Record<string, FiestaEnPlanificacion[]> = {};
  for (const f of fiestas) {
    const fecha = f.configuracion?.fechaEvento;
    if (!fecha) continue;
    const key = fecha.split('T')[0];
    if (!porFecha[key]) porFecha[key] = [];
    porFecha[key].push(f);
  }

  // Detect staff conflicts (same employee on 2+ events same day)
  const conflictosPersonal: ConflictoPersonal[] = [];
  const empleadoMap = Object.fromEntries(empleados.map(e => [e.id, e.nombre]));

  const empleadoPorFecha: Record<string, Record<string, { id: string; nombre: string; fecha: string }[]>> = {};
  for (const [fecha, fs] of Object.entries(porFecha)) {
    if (fs.length < 2) continue;
    for (const f of fs) {
      for (const pa of f.personalAsignado ?? []) {
        if (!empleadoPorFecha[pa.empleadoId]) empleadoPorFecha[pa.empleadoId] = {};
        if (!empleadoPorFecha[pa.empleadoId][fecha]) empleadoPorFecha[pa.empleadoId][fecha] = [];
        empleadoPorFecha[pa.empleadoId][fecha].push({
          id: f.id,
          nombre: f.configuracion?.nombreEvento ?? f.id,
          fecha,
        });
      }
    }
  }

  for (const [empleadoId, fechas] of Object.entries(empleadoPorFecha)) {
    for (const [, eventosEnFecha] of Object.entries(fechas)) {
      if (eventosEnFecha.length >= 2) {
        const existing = conflictosPersonal.find(c => c.empleadoId === empleadoId);
        if (existing) {
          for (const ev of eventosEnFecha) {
            if (!existing.fiestas.find(f => f.id === ev.id)) existing.fiestas.push(ev);
          }
        } else {
          conflictosPersonal.push({
            empleadoId,
            empleadoNombre: empleadoMap[empleadoId] ?? `Empleado ${empleadoId}`,
            fiestas: [...eventosEnFecha],
          });
        }
      }
    }
  }

  return { conflictosPersonal, fechasConEventos: porFecha };
}

function RecursosMultiEventoContent() {
  const [loading, setLoading] = useState(true);
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [conflictosPersonal, setConflictosPersonal] = useState<ConflictoPersonal[]>([]);
  const [fechasConEventos, setFechasConEventos] = useState<Record<string, FiestaEnPlanificacion[]>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [fs, emps] = await Promise.all([
        getAllFiestas(),
        getEmpleados(),
      ]);
      const upcomingFiestas = fs.filter(f => {
        const fecha = f.configuracion?.fechaEvento;
        if (!fecha) return false;
        return new Date(fecha) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days + future
      });
      setFiestas(upcomingFiestas);
      setEmpleados(emps);
      const { conflictosPersonal: cp, fechasConEventos: fce } = detectarConflictos(upcomingFiestas, emps);
      setConflictosPersonal(cp);
      setFechasConEventos(fce);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Dates with multiple events
  const fechasMultiples = Object.entries(fechasConEventos)
    .filter(([, fs]) => fs.length >= 2)
    .sort(([a], [b]) => a.localeCompare(b));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-orange-100">
              <Wrench className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recursos Multi-Evento</h1>
              <p className="text-muted-foreground text-sm">Detección de conflictos de personal y activos entre eventos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <CalendarDays className="w-6 h-6 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-black text-blue-700">{fiestas.length}</p>
            <p className="text-xs text-muted-foreground">Eventos próximos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-black text-red-700">{conflictosPersonal.length}</p>
            <p className="text-xs text-muted-foreground">Conflictos de personal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <CalendarDays className="w-6 h-6 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-black text-amber-700">{fechasMultiples.length}</p>
            <p className="text-xs text-muted-foreground">Fechas con múltiples eventos</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Conflicts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            Conflictos de Personal
          </CardTitle>
          <CardDescription>
            Personal asignado a más de un evento en la misma fecha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conflictosPersonal.length === 0 ? (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-semibold">Sin conflictos de personal detectados ✓</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conflictosPersonal.map(conflicto => (
                <div key={conflicto.empleadoId} className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="font-semibold text-red-800">{conflicto.empleadoNombre}</p>
                    <Badge variant="destructive" className="ml-auto">{conflicto.fiestas.length} eventos</Badge>
                  </div>
                  <div className="space-y-1">
                    {conflicto.fiestas.map(f => (
                      <div key={f.id} className="text-sm text-red-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        <span className="font-medium">{f.nombre}</span>
                        <span className="text-xs text-red-500">
                          {new Date(f.fecha).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Revisar asignación de personal en los eventos afectados.
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates with multiple events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-600" />
            Fechas con Múltiples Eventos
          </CardTitle>
          <CardDescription>Días donde hay 2 o más eventos programados simultáneamente</CardDescription>
        </CardHeader>
        <CardContent>
          {fechasMultiples.length === 0 ? (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-semibold">No hay fechas con eventos superpuestos ✓</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fechasMultiples.map(([fecha, eventosEnFecha]) => (
                <div key={fecha} className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                  <p className="font-semibold text-amber-800 mb-2">
                    📅 {new Date(fecha + 'T12:00:00').toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    <Badge className="ml-2 bg-amber-200 text-amber-800">{eventosEnFecha.length} eventos</Badge>
                  </p>
                  <div className="space-y-2">
                    {eventosEnFecha.map(f => (
                      <div key={f.id} className="flex items-center gap-3 text-sm text-amber-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-medium flex-1">{f.configuracion?.nombreEvento ?? f.id}</span>
                        <span className="text-xs">{f.configuracion?.tipoCelebracion}</span>
                        <span className="text-xs">{f.configuracion?.invitadosEstimados ?? 0} inv.</span>
                        <Badge variant="outline" className="text-xs">{f.personalAsignado?.length ?? 0} personal</Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Verificar disponibilidad de recursos compartidos (stock, activos, equipos).
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RecursosMultiEventoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <RecursosMultiEventoContent />
    </Suspense>
  );
}
