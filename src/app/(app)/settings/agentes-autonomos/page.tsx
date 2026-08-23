'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Eye,
  History,
  Loader2,
  Play,
  RotateCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { AgenteId, ConfiguracionAgente, RegistroEjecucionAgente } from '@/lib/agentes/tipos';
import {
  getAgentesConfig,
  toggleAgente,
  getHistorialAgentes,
  ejecutarAgenteManual,
  ejecutarTodosLosAgentesManual,
} from '@/app/actions/agentes-autonomos';

export default function AgentesAutonomosPage() {
  const { toast } = useToast();
  const [agentes, setAgentes] = useState<ConfiguracionAgente[]>([]);
  const [historial, setHistorial] = useState<RegistroEjecucionAgente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningAgenteId, setRunningAgenteId] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [config, hist] = await Promise.all([
        getAgentesConfig(),
        getHistorialAgentes(),
      ]);
      setAgentes(config);
      setHistorial(hist);
    } catch (e: any) {
      toast({ title: 'Error al cargar agentes', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (agenteId: AgenteId, activo: boolean) => {
    try {
      const res = await toggleAgente(agenteId, activo);
      if (res.success && res.config) {
        setAgentes(res.config);
        toast({
          title: activo ? 'Agente activado' : 'Agente pausado',
          description: `El estado del agente fue actualizado.`,
        });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleRunAgente = async (agenteId: AgenteId) => {
    setRunningAgenteId(agenteId);
    try {
      const res = await ejecutarAgenteManual(agenteId);
      if (res.success) {
        toast({
          title: 'Agente ejecutado',
          description: `Completó su revisión. Se actualizó el registro de actividad.`,
        });
        await loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ title: 'Error en ejecución', description: e.message, variant: 'destructive' });
    } finally {
      setRunningAgenteId(null);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    try {
      const res = await ejecutarTodosLosAgentesManual();
      if (res.success) {
        toast({
          title: 'Ronda de agentes completada',
          description: `Los 5 agentes completaron su ciclo de revisión.`,
        });
        await loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsRunningAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 text-white">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight font-headline">Agentes Autónomos</h1>
            <p className="text-sm text-slate-500">Supervisión, preparación de tareas y monitoreo desatendido.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleRunAll}
            disabled={isRunningAll || isLoading}
            className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold gap-1.5"
          >
            {isRunningAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Ejecutar Todos Ahora
          </Button>
          <Button asChild variant="outline" className="rounded-xl h-11">
            <Link href="/settings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>
      </div>

      {/* Regla de Oro / Guardrails de Seguridad */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white overflow-hidden shadow-sm">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <Shield className="w-5 h-5 text-indigo-600" />
            Línea Clara de Seguridad y Control (No Negociable)
          </div>
          <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">
            <strong>Autonomía total para MIRAR, DETECTAR y PREPARAR. Mano humana para lo que sale para afuera o toca plata.</strong>
            <br />
            Ningún agente cobra dinero, marca facturas como pagadas, emite comprobantes, envía mensajes de WhatsApp por su cuenta, cierra presupuestos, cambia precios ni elimina datos. Todo queda preparado como borrador en la bandeja para que una persona lo revise y decida.
          </p>
        </CardContent>
      </Card>

      {/* Lista de Agentes Autónomos */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Los 5 Agentes del Sistema</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agentes.map((agente) => (
            <Card key={agente.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="p-5 pb-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-slate-900">{agente.nombre}</CardTitle>
                    <p className="text-[11px] font-semibold text-indigo-600">{agente.rol}</p>
                  </div>
                  <Switch
                    checked={agente.activo}
                    onCheckedChange={(checked) => handleToggle(agente.id, checked)}
                    title={agente.activo ? 'Pausar agente' : 'Activar agente'}
                  />
                </div>
                <CardDescription className="text-xs text-slate-600 leading-relaxed">
                  {agente.descripcion}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3 border-t border-slate-100 mt-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Cada {agente.intervaloMinutos} min
                  </span>
                  <Badge variant={agente.activo ? 'default' : 'secondary'} className="text-[10px]">
                    {agente.activo ? 'ACTIVO' : 'PAUSADO'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-slate-400">
                    {agente.ultimaEjecucion
                      ? `Última: ${new Date(agente.ultimaEjecucion).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })} hs`
                      : 'Sin ejecuciones aún'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1"
                    onClick={() => handleRunAgente(agente.id)}
                    disabled={runningAgenteId === agente.id || !agente.activo}
                  >
                    {runningAgenteId === agente.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="w-3.5 h-3.5" />
                    )}
                    Ejecutar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rastro y Trazabilidad de Ejecuciones */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-700" />
              <CardTitle className="text-base font-bold text-slate-900">Rastro de Actividad de Agentes</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading} className="h-8 text-xs">
              <RotateCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
          <CardDescription className="text-xs">
            Registro visible de qué miró cada agente, qué detectó y qué dejó preparado.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-3">
          {historial.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
              Aún no hay ejecuciones registradas. Los agentes comenzarán a correr según su intervalo o podés ejecutarlos manualmente.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {historial.map((reg) => (
                <div key={reg.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      {reg.agenteNombre}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(reg.ejecutadoEn).toLocaleString('es-UY')}
                    </span>
                  </div>

                  {reg.hallazgos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Hallazgos:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {reg.hallazgos.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reg.accionesPreparadas.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-200/60">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Acciones preparadas:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-indigo-700 font-medium">
                        {reg.accionesPreparadas.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

