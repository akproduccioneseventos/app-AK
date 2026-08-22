'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Play,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getEstadoTareasAutomaticas,
  getEstadoDespertadorAction,
  ejecutarTareaManual,
  dispararTareasVencidasDeFondo,
} from '@/app/actions/tareas-automaticas.actions';
import type { EstadoDeTarea, EstadoDespertador } from '@/lib/automatico/tareas-automaticas';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TareasAutomaticasPage() {
  const [tareas, setTareas] = useState<EstadoDeTarea[]>([]);
  const [despertador, setDespertador] = useState<EstadoDespertador | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dataTareas, dataDespertador] = await Promise.all([
        getEstadoTareasAutomaticas(),
        getEstadoDespertadorAction(),
      ]);
      setTareas(dataTareas);
      setDespertador(dataDespertador);
    } catch (err: any) {
      setMessage({ text: 'No se pudo cargar el estado de las tareas: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEjecutar = async (id: string, nombre: string) => {
    if (id === 'recordatorios-de-pago') {
      const confirma = window.confirm(
        '¿Confirmás revisar los recordatorios de cuotas vencidas? Ningún mensaje sale automáticamente sin que lo apruebes.'
      );
      if (!confirma) return;
    }

    try {
      setRunningId(id);
      setMessage(null);
      const res = await ejecutarTareaManual(id);
      if (res.success) {
        setMessage({ text: `Tarea "${nombre}" ejecutada correctamente.`, type: 'success' });
        await cargarDatos();
      } else {
        setMessage({ text: res.error || 'Hubo un problema al ejecutar la tarea.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error inesperado.', type: 'error' });
    } finally {
      setRunningId(null);
    }
  };

  const handlePonerAlDia = async () => {
    try {
      setSyncingAll(true);
      setMessage(null);
      const res = await dispararTareasVencidasDeFondo();
      if (res.ejecutadas.length > 0) {
        setMessage({
          text: `Se pusieron al día ${res.ejecutadas.length} tareas atrasadas.`,
          type: 'success',
        });
      } else {
        setMessage({ text: 'Todas las tareas automáticas desatendidas están al día.', type: 'success' });
      }
      await cargarDatos();
    } catch (err: any) {
      setMessage({ text: 'Error al poner al día: ' + err.message, type: 'error' });
    } finally {
      setSyncingAll(false);
    }
  };

  const formatearFecha = (iso: string | null) => {
    if (!iso) return 'Nunca corrió';
    try {
      const d = parseISO(iso);
      return format(d, "d 'de' MMMM 'a las' HH:mm 'hs'", { locale: es });
    } catch {
      return iso;
    }
  };

  const formatearFrecuencia = (horas: number) => {
    if (horas === 1) return 'Cada 1 hora';
    if (horas === 24) return 'Una vez por día';
    if (horas === 24 * 7) return 'Una vez por semana';
    return `Cada ${horas} horas`;
  };

  const total = tareas.length;
  const alDia = tareas.filter(t => t.estado === 'al-dia').length;
  const atrasadas = tareas.filter(t => t.estado === 'atrasada').length;
  const nunca = tareas.filter(t => t.estado === 'nunca').length;

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">¿Qué está funcionando?</h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Estado real de las 4 tareas automáticas que la aplicación promete hacer sola.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarDatos}
            disabled={loading}
            className="gap-2 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={handlePonerAlDia}
            disabled={syncingAll || loading}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Zap className={`h-4 w-4 ${syncingAll ? 'animate-pulse' : ''}`} />
            Poner al día atrasadas
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs underline ml-4 hover:opacity-75">
            Cerrar
          </button>
        </div>
      )}

      {/* Métricas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold text-slate-500">TOTAL TAREAS</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-800">{total}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-400">Declaradas en el sistema</CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold text-emerald-700">AL DÍA</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {alDia}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-emerald-600 font-medium">Corrieron en tiempo y forma</CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold text-amber-700">ATRASADAS</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {atrasadas}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-amber-600 font-medium">Pasó más del doble del intervalo</CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/40 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold text-rose-700">NUNCA CORRIERON</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-700 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              {nunca}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-rose-600 font-medium">Escritas pero sin disparador</CardContent>
        </Card>
      </div>

      {/* Estado del Despertador Programado (Cloud Functions / Cron) */}
      <Card
        className={`border shadow-sm overflow-hidden ${
          despertador?.estado === 'activo'
            ? 'border-emerald-200 bg-emerald-50/20'
            : 'border-rose-300 bg-rose-50/60'
        }`}
      >
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                despertador?.estado === 'activo'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  Despertador de Google Cloud Functions (cada 15 minutos)
                </span>
                <Badge
                  className={
                    despertador?.estado === 'activo'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border-rose-400 font-bold'
                  }
                >
                  {despertador?.estado === 'activo'
                    ? 'Funcionando'
                    : 'El despertador no está funcionando'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {despertador?.ultimoToque
                  ? `Última vez que el despertador tocó la puerta: ${formatearFecha(
                      despertador.ultimoToque
                    )} (hace ${despertador.minutosDesdeUltimoToque} min).`
                  : 'El despertador nunca tocó la puerta. Comprobá que las Cloud Functions estén desplegadas en Firebase.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tareas */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Tareas Automáticas Registradas</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Cada vez que una tarea corre de verdad, deja su marca en el servidor.
              </CardDescription>
            </div>
            <Link href="/settings/sincronizaciones" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Ver conexiones externas
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-slate-100">
          {tareas.map((tarea) => {
            const isRunning = runningId === tarea.id;
            const esNunca = tarea.estado === 'nunca';
            const esAtrasada = tarea.estado === 'atrasada';
            const esAlDia = tarea.estado === 'al-dia';

            return (
              <div
                key={tarea.id}
                className={`p-5 sm:p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  esNunca ? 'bg-rose-50/20' : esAtrasada ? 'bg-rose-50/25 border-l-4 border-l-rose-500' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-bold text-base text-slate-900">{tarea.nombre}</span>
                    {esAlDia && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 gap-1 font-semibold text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Al día
                      </Badge>
                    )}
                    {esAtrasada && (
                      <Badge className="bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-100 gap-1 font-bold text-xs">
                        <AlertTriangle className="h-3 w-3 text-rose-600" />
                        Atrasada
                      </Badge>
                    )}
                    {esNunca && (
                      <Badge className="bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-100 gap-1 font-bold text-xs">
                        <XCircle className="h-3 w-3 text-rose-600" />
                        Nunca corrió
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                      {formatearFrecuencia(tarea.cadaHoras)}
                    </span>
                  </div>

                  {/* Qué se pierde */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800 font-semibold">Si no corre: </strong>
                    {tarea.siNoCorre}
                  </p>

                  {/* Última corrida y origen */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-500">Última ejecución:</span>
                      <span className={esNunca ? 'text-rose-600 font-bold' : esAtrasada ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {formatearFecha(tarea.ultimaCorrida)}
                      </span>
                      {tarea.horasDesdeLaUltima !== null && (
                        <span className="text-slate-400">({tarea.horasDesdeLaUltima} hs atrás)</span>
                      )}
                    </div>
                    {tarea.disparadoPor && (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        Disparada por: {
                          tarea.disparadoPor === 'despertador'
                            ? 'Despertador de fondo'
                            : tarea.disparadoPor === 'visita'
                            ? 'Visita a la web'
                            : tarea.disparadoPor === 'app'
                            ? 'Ingreso al panel'
                            : 'Acción manual'
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón de acción manual */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  <Button
                    size="sm"
                    variant={esNunca || esAtrasada ? 'default' : 'outline'}
                    disabled={isRunning || loading}
                    onClick={() => handleEjecutar(tarea.id, tarea.nombre)}
                    className={`gap-2 font-medium ${
                      esNunca
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : esAtrasada
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                    {isRunning ? 'Ejecutando...' : 'Ejecutar ahora'}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Regla de Oro / Aclaración para el dueño */}
      <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
        <CardContent className="p-5 flex items-start gap-4">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 space-y-1">
            <p className="font-bold">¿Cómo se activan para que corran solas sin tocar nada?</p>
            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
              Las tareas de métricas y posteos se ponen al día cuando alguien del equipo abre el panel.
              Para que corran automáticamente a la hora justa las 24 horas del día (incluso si nadie tiene la app abierta),
              se configura un temporizador gratuito en internet con las 4 direcciones exactas. Consultá la guía en{' '}
              <strong className="font-semibold underline">docs/PRENDER-LAS-TAREAS.md</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
