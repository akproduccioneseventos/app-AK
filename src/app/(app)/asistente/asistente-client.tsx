'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MultiAgentWidget } from '@/components/multiagent/multiagent-widget';
import { GastoIaCard } from '@/components/marketing/gasto-ia-card';
import {
  getBandejaAsistenteAction,
  aceptarPropuestaAction,
  posponerPropuestaAction,
  descartarPropuestaAction,
  tomarPropuestaAction,
  marcarResumenVistoAction,
  guardarMetaMesAction,
} from '@/app/actions/asistente-proactivo.actions';
import {
  getEstadoTareasAutomaticas,
  getEstadoDespertadorAction,
  ejecutarTareaManual,
  dispararTareasVencidasDeFondo,
} from '@/app/actions/tareas-automaticas.actions';
import { getAgentesConfig, toggleAgente } from '@/app/actions/agentes-autonomos';
import { sendMultiAgentMessage } from '@/app/actions/multiagent';
import type { AsistentePropuesta, ResumenMientrasNoEstabas, AsistenteArea } from '@/lib/asistente/propuestas-service';
import type { ResumenDeGasto } from '@/lib/ai/consumo';
import {
  tieneFalloPosteriorAlExito,
  type EstadoDeTarea,
  type EstadoDespertador,
} from '@/lib/automatico/resumen-tareas';
import type { AgenteId, ConfiguracionAgente } from '@/lib/agentes/tipos';
import type { AkAgentType, AkMultiAgentMessage } from '@/types/multiagent';
import {
  Sparkles,
  CheckCircle,
  CheckCircle2,
  Clock,
  BellOff,
  UserCheck,
  TrendingUp,
  DollarSign,
  PartyPopper,
  Target,
  Send,
  Zap,
  RefreshCw,
  Play,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Sliders,
  Bot,
  MessageSquare,
  Loader2,
  AudioLines,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const TAREAS_EJECUTABLES_MANUAL = new Set([
  'generate-blog-post',
  'metricas-de-redes',
  'publicar-programados',
  'recordatorios-de-pago',
]);

const INTERRUPTORES_IA_EN_AJUSTES = [
  {
    titulo: 'IA y consumo',
    descripcion: 'Interruptor de decisiones rápidas con IA (muro, álbum y comprobantes), conexión Gemini, instrucciones y base de conocimiento.',
    href: '/settings?seccion=asistente&sub=ai-assistant',
    badge: 'decisionesRapidasActivas',
  },
  {
    titulo: 'Ajustes del asistente',
    descripcion: 'Interruptores de voz (Gemini, teléfono y voz en vivo), WhatsApp al dueño y atención a prospectos (Web, WhatsApp e Instagram/Messenger).',
    href: '/settings?seccion=asistente&sub=asistente',
    badge: 'voz · whatsapp',
  },
  {
    titulo: 'Agentes autónomos',
    descripcion: 'Prender o pausar los 7 agentes autónomos que revisan fiestas, presupuestos, cobros y contenido, y ver su rastro.',
    href: '/settings?seccion=asistente&sub=agentes-autonomos',
    badge: '7 agentes',
  },
  {
    titulo: 'Tareas automáticas',
    descripcion: 'Estado completo del despertador de Google Cloud Functions y disparo manual de tareas programadas.',
    href: '/settings?seccion=asistente&sub=tareas-automaticas',
    badge: 'despertador',
  },
  {
    titulo: 'Asistentes por pantalla',
    descripcion: 'Personalizar nombre, color y foto de cada asistente según el módulo en el que estás trabajando.',
    href: '/settings?seccion=asistente&sub=asistentes-contextuales',
    badge: 'apariencia',
  },
];

export function AsistenteBandejaInner() {
  const { toast } = useToast();
  const [areaFiltro, setAreaFiltro] = useState<AsistenteArea | 'todas'>('todas');
  const [propuestas, setPropuestas] = useState<AsistentePropuesta[]>([]);
  const [resumen, setResumen] = useState<ResumenMientrasNoEstabas | null>(null);
  const [loading, setLoading] = useState(true);
  const [metaInput, setMetaInput] = useState('');
  const [guardandoMeta, setGuardandoMeta] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    const res = await getBandejaAsistenteAction(areaFiltro === 'todas' ? undefined : areaFiltro);
    if (res.success) {
      setPropuestas(res.propuestas || []);
      setResumen(res.resumen || null);
      if (res.settings?.metasMes) {
        setMetaInput(res.settings.metasMes);
      }
    } else {
      toast({
        title: 'Error',
        description: res.error || 'Error al cargar la bandeja del asistente',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [areaFiltro, toast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleAceptar = async (id: string) => {
    setProcesandoId(id);
    const res = await aceptarPropuestaAction(id);
    if (res.success) {
      toast({
        title: 'Propuesta aceptada',
        description: res.mensaje || 'Acción completada con éxito.',
      });
      if ((res as any).preguntaAutomatizacion) {
        toast({
          title: 'Regla aprendida',
          description: (res as any).preguntaAutomatizacion,
        });
      }
      cargarDatos();
    } else {
      toast({
        title: 'Error',
        description: res.mensaje || 'Error al aceptar propuesta',
        variant: 'destructive',
      });
    }
    setProcesandoId(null);
  };

  const handlePosponer = async (id: string) => {
    setProcesandoId(id);
    const res = await posponerPropuestaAction(id);
    if (res.success) {
      toast({
        title: 'Propuesta pospuesta',
        description: 'Propuesta pospuesta por 3 días.',
      });
      cargarDatos();
    } else {
      toast({
        title: 'Error',
        description: 'Error al posponer propuesta',
        variant: 'destructive',
      });
    }
    setProcesandoId(null);
  };

  const handleDescartar = async (id: string) => {
    setProcesandoId(id);
    const res = await descartarPropuestaAction(id);
    if (res.success) {
      toast({
        title: 'Descartada',
        description: 'No te volveremos a avisar de esto.',
      });
      cargarDatos();
    } else {
      toast({
        title: 'Error',
        description: 'Error al descartar',
        variant: 'destructive',
      });
    }
    setProcesandoId(null);
  };

  const handleTomar = async (id: string) => {
    setProcesandoId(id);
    const res = await tomarPropuestaAction(id);
    if (res.success) {
      toast({
        title: 'Propuesta tomada',
        description: '¡Tomaste la propuesta! Quedó asignada a tu nombre.',
      });
      cargarDatos();
    } else {
      toast({
        title: 'Error',
        description: 'Error al tomar propuesta',
        variant: 'destructive',
      });
    }
    setProcesandoId(null);
  };

  const handleVistoResumen = async () => {
    if (!resumen) return;
    const res = await marcarResumenVistoAction(resumen.id);
    if (!res?.success) {
      toast({
        title: 'No se pudo marcar como visto',
        description: res?.error || 'Probá de nuevo en unos segundos.',
        variant: 'destructive',
      });
      return;
    }
    setResumen(null);
    toast({
      title: 'Resumen visto',
      description: 'Resumen marcado como visto.',
    });
  };

  const handleGuardarMeta = async () => {
    setGuardandoMeta(true);
    try {
      const res = await guardarMetaMesAction(metaInput);
      if (res.success) {
        toast({
          title: 'Meta guardada',
          description: 'Meta del mes guardada con éxito.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Error al guardar meta.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Error al guardar meta.',
        variant: 'destructive',
      });
    } finally {
      setGuardandoMeta(false);
    }
  };

  const badgeColorArea = (area: AsistenteArea) => {
    switch (area) {
      case 'ventas':
        return 'bg-blue-600 text-white';
      case 'cobros':
        return 'bg-amber-600 text-white';
      case 'fiestas':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tu Asistente AK — Hoy</h2>
            <p className="text-sm text-slate-500">
              Lo que la IA preparó mientras no estabas y las propuestas que esperan tu OK.
            </p>
          </div>
        </div>

        {/* Selector de Áreas */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          <Button
            variant={areaFiltro === 'todas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setAreaFiltro('todas')}
            className="text-xs"
          >
            Todas
          </Button>
          <Button
            variant={areaFiltro === 'ventas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setAreaFiltro('ventas')}
            className={`text-xs ${areaFiltro === 'ventas' ? 'bg-blue-600 text-white' : ''}`}
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            Ventas
          </Button>
          <Button
            variant={areaFiltro === 'cobros' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setAreaFiltro('cobros')}
            className={`text-xs ${areaFiltro === 'cobros' ? 'bg-amber-600 text-white' : ''}`}
          >
            <DollarSign className="h-3.5 w-3.5 mr-1" />
            Cobros
          </Button>
          <Button
            variant={areaFiltro === 'fiestas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setAreaFiltro('fiestas')}
            className={`text-xs ${areaFiltro === 'fiestas' ? 'bg-emerald-600 text-white' : ''}`}
          >
            <PartyPopper className="h-3.5 w-3.5 mr-1" />
            Fiestas
          </Button>
        </div>
      </div>

      {/* Resumen de Madrugada: "Mientras no estabas" */}
      {resumen && (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-600 text-white text-xs">Mientras no estabas</Badge>
                <span className="text-xs text-slate-500">Corrida de madrugada ({resumen.fecha})</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleVistoResumen} className="h-7 text-xs">
                <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Visto
              </Button>
            </div>
            <CardTitle className="text-base text-slate-800 font-semibold pt-1">
              Revisamos {resumen.fiestasRevisadas} fiestas, {resumen.presupuestosRevisados} presupuestos y {resumen.cobrosRevisados} cobros.
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              Se encontraron {resumen.propuestasEncontradas} novedades operativas y se dejaron {resumen.propuestasPreparadas} propuestas esperando tu confirmación.
            </p>
            {resumen.fallos && resumen.fallos.length > 0 && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                <strong>Atención:</strong> Hubo contratiempos en la revisión: {resumen.fallos.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metas del Mes */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-base font-semibold text-slate-800">Meta comercial del mes</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Escribí el objetivo del mes para que el asistente mida el avance y proponga acciones concretas día a día.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Ej: Llenar noviembre con 8 fiestas y cerrar 5 presupuestos pendientes"
              value={metaInput}
              onChange={(e) => setMetaInput(e.target.value)}
              className="text-sm"
            />
            <Button
              onClick={handleGuardarMeta}
              disabled={guardandoMeta}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Propuestas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            Propuestas pendientes
            <Badge variant="secondary" className="text-xs font-mono">
              {propuestas.length}
            </Badge>
          </h3>
          <Button variant="ghost" size="sm" onClick={cargarDatos} className="text-xs text-slate-500">
            Refrescar
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Cargando propuestas proactivas...</div>
        ) : propuestas.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-base font-medium text-slate-700">¡Bandeja al día!</p>
            <p className="text-xs text-slate-500 mt-1">
              No hay alertas pendientes para el área seleccionada. El asistente sigue vigilando 24/7.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {propuestas.map((p) => (
              <Card key={p.id} className="border-slate-200 hover:border-indigo-200 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={badgeColorArea(p.area)}>{p.area.toUpperCase()}</Badge>
                      <CardTitle className="text-base text-slate-900 font-semibold">{p.titulo}</CardTitle>
                    </div>
                    {p.tomadaPor ? (
                      <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Tomada por {p.tomadaPor}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTomar(p.id)}
                        disabled={procesandoId === p.id}
                        className="h-7 text-xs border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        Lo tomo yo
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                  <div className="text-sm text-slate-700">
                    <p className="font-medium text-slate-800">{p.quePasa}</p>
                    <p className="text-xs text-slate-500 mt-0.5"><span className="font-semibold text-slate-600">Por qué importa:</span> {p.porQueImporta}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-800">
                    <span className="font-semibold text-indigo-700">Propuesta del asistente:</span> {p.quePropone}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAceptar(p.id)}
                        disabled={procesandoId === p.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Sí, hacelo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePosponer(p.id)}
                        disabled={procesandoId === p.id}
                        className="text-xs h-8"
                      >
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                        Ahora no
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDescartar(p.id)}
                        disabled={procesandoId === p.id}
                        className="text-xs h-8 text-slate-400 hover:text-slate-600"
                      >
                        <BellOff className="h-3.5 w-3.5 mr-1.5" />
                        No me avises más de esto
                      </Button>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('es-UY', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AsistenteAutomaticoPanel({ initialTareas }: { initialTareas: EstadoDeTarea[] }) {
  const { toast } = useToast();
  const [tareas, setTareas] = useState<EstadoDeTarea[]>(initialTareas);
  const [despertador, setDespertador] = useState<EstadoDespertador | null>(null);
  const [agentes, setAgentes] = useState<ConfiguracionAgente[]>([]);
  const [loading, setLoading] = useState(initialTareas.length === 0);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [dataTareas, dataDespertador, dataAgentes] = await Promise.all([
        getEstadoTareasAutomaticas(),
        getEstadoDespertadorAction(),
        getAgentesConfig().catch(() => [] as ConfiguracionAgente[]),
      ]);
      setTareas(dataTareas);
      setDespertador(dataDespertador);
      setAgentes(dataAgentes);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'No se pudo actualizar el estado automático.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleEjecutar = async (id: string, nombre: string) => {
    if (id === 'recordatorios-de-pago') {
      const confirma = window.confirm(
        '¿Confirmás revisar los recordatorios de cuotas vencidas? Ningún mensaje sale automáticamente sin que lo apruebes.',
      );
      if (!confirma) return;
    }

    setRunningId(id);
    try {
      const res = await ejecutarTareaManual(id);
      if (res.success) {
        toast({ title: 'Tarea ejecutada', description: `"${nombre}" corrió correctamente.` });
        await cargar();
      } else {
        toast({ title: 'No se pudo ejecutar', description: res.error || 'Error al ejecutar la tarea.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Error inesperado.', variant: 'destructive' });
    } finally {
      setRunningId(null);
    }
  };

  const handlePonerAlDia = async () => {
    setSyncingAll(true);
    try {
      const res = await dispararTareasVencidasDeFondo();
      if (res.ejecutadas.length > 0) {
        toast({ title: 'Listo', description: `Se pusieron al día ${res.ejecutadas.length} tareas atrasadas.` });
      } else {
        toast({ title: 'Todo al día', description: 'Las tareas automáticas desatendidas ya están al día.' });
      }
      await cargar();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'No se pudo poner al día.', variant: 'destructive' });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleToggleAgente = async (agenteId: AgenteId, activo: boolean) => {
    try {
      const res = await toggleAgente(agenteId, activo);
      if (res.success && res.config) {
        setAgentes(res.config);
        toast({
          title: activo ? 'Agente activado' : 'Agente pausado',
          description: 'Estado actualizado.',
        });
      } else if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'No se pudo cambiar el estado.', variant: 'destructive' });
    }
  };

  const formatearFecha = (iso: string | null) => {
    if (!iso) return 'Nunca corrió';
    try {
      return new Date(iso).toLocaleString('es-UY', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 py-4" data-testid="solapa-automatico">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Lo automático</h2>
            <p className="text-sm text-slate-500">
              Qué hace la IA sola, cuándo corrió por última vez y dónde prender o apagar cada función.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={cargar} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={handlePonerAlDia}
            disabled={syncingAll || loading}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs"
          >
            <Zap className={`h-3.5 w-3.5 ${syncingAll ? 'animate-pulse' : ''}`} />
            Poner al día atrasadas
          </Button>
        </div>
      </div>

      {/* Despertador */}
      {despertador && (
        <Card className={despertador.estado === 'activo' ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/50'}>
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className={`h-5 w-5 shrink-0 ${despertador.estado === 'activo' ? 'text-emerald-600' : 'text-rose-600'}`} />
              <div>
                <p className="text-sm font-bold text-slate-900">Despertador automático (cada 15 min)</p>
                <p className="text-xs text-slate-600">{despertador.mensaje}</p>
              </div>
            </div>
            <Badge className={despertador.estado === 'activo' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>
              {despertador.estado === 'activo' ? 'Funcionando' : despertador.estado === 'atrasado' ? 'Atrasado' : 'Sin ejecutar'}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Tareas de TAREAS_AUTOMATICAS */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Tareas automáticas{loading && tareas.length === 0 ? '' : ` (${tareas.length})`}
              </CardTitle>
              <CardDescription className="text-xs">
                Todas las tareas declaradas en el sistema, con su última corrida y qué pasa si se frenan.
              </CardDescription>
            </div>
            <Link
              href="/settings?seccion=asistente&sub=tareas-automaticas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Ver detalle en Ajustes <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {loading && tareas.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">Cargando tareas automáticas...</div>
          ) : (
            tareas.map((tarea) => {
              const esNoDisponible = tarea.estado === 'no-disponible' || Boolean(tarea.faltaConexion);
              const esNunca = !esNoDisponible && tarea.estado === 'nunca';
              const esAtrasada = !esNoDisponible && tarea.estado === 'atrasada';
              const esAlDia = !esNoDisponible && tarea.estado === 'al-dia';
              const falloPosterior = tarea.falloPosteriorAlExito ?? tieneFalloPosteriorAlExito(tarea);
              const esEjecutableManual = TAREAS_EJECUTABLES_MANUAL.has(tarea.id);
              const isRunning = runningId === tarea.id;

              return (
                <div
                  key={tarea.id}
                  data-testid={`tarea-automatica-${tarea.id}`}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{tarea.nombre}</span>
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {tarea.id}
                      </span>
                      {esAlDia && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Al día
                        </Badge>
                      )}
                      {esAtrasada && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" /> Atrasada
                        </Badge>
                      )}
                      {esNunca && (
                        <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-xs gap-1">
                          <XCircle className="h-3 w-3" /> Nunca corrió
                        </Badge>
                      )}
                      {esNoDisponible && (
                        <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-xs gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          {tarea.faltaConexion ? `Falta ${tarea.faltaConexion}` : 'No disponible'}
                        </Badge>
                      )}
                      {falloPosterior && (
                        <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-xs">
                          Último intento falló
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-700">Si no corre:</strong> {tarea.siNoCorre}
                    </p>
                    <p className="text-xs text-slate-500">
                      Última corrida: <span className="font-semibold text-slate-700">{formatearFecha(tarea.ultimaCorrida)}</span>
                      {tarea.horasDesdeLaUltima !== null && ` (hace ${tarea.horasDesdeLaUltima} hs)`}
                    </p>
                    {tarea.ultimoFallo && (
                      <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
                        Último fallo: {tarea.ultimoFallo.error}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {esEjecutableManual ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isRunning || loading}
                        onClick={() => handleEjecutar(tarea.id, tarea.nombre)}
                        className="text-xs gap-1.5"
                      >
                        <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                        {isRunning ? 'Ejecutando...' : 'Ejecutar ahora'}
                      </Button>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        Automática por despertador
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Agentes autónomos (con interruptor directo si el usuario es administrador) */}
      {agentes.length > 0 && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Agentes autónomos{loading ? '' : ` (${agentes.length})`}</CardTitle>
                <CardDescription className="text-xs">
                  Prendé o pausá cada agente directamente desde acá.
                </CardDescription>
              </div>
              <Link
                href="/settings?seccion=asistente&sub=agentes-autonomos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Abrir panel de agentes <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid gap-3 sm:grid-cols-2">
            {agentes.map((ag) => (
              <div key={ag.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{ag.nombre}</p>
                  <p className="text-xs text-slate-500 truncate">{ag.rol}</p>
                </div>
                <Switch
                  checked={ag.activo}
                  onCheckedChange={(checked) => handleToggleAgente(ag.id, checked)}
                  aria-label={`Activar o pausar ${ag.nombre}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Todas las funciones de IA con interruptor en Ajustes */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-600" />
            Interruptores y ajustes de IA
          </CardTitle>
          <CardDescription className="text-xs">
            Accesos directos a todas las funciones de IA que tienen interruptor en Ajustes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2">
          {INTERRUPTORES_IA_EN_AJUSTES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 hover:bg-slate-100/80 transition"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">{item.titulo}</span>
                  <span className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.descripcion}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const AGENTES_CHAT: { id: AkAgentType; label: string }[] = [
  { id: 'central', label: 'Encargado General' },
  { id: 'secretaria', label: 'Secretaria' },
  { id: 'contable', label: 'Contable' },
  { id: 'fiestas_general', label: 'Fiestas' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'marketing', label: 'Marketing' },
];

const SUGERENCIAS_CHAT = [
  '¿Qué pendientes urgentes hay hoy?',
  '¿Cómo vienen los cobros y presupuestos?',
  'Revisá las próximas fiestas y decime qué falta',
  'Resumime las novedades comerciales de la semana',
];

type MensajeInline = AkMultiAgentMessage & { id: string; agentName?: string };

function AsistenteHablalePanel({ onOpenVoice }: { onOpenVoice: () => void }) {
  const [agentType, setAgentType] = useState<AkAgentType>('central');
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<MensajeInline[]>([]);

  const enviar = async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || isSending) return;
    const msgUser: MensajeInline = { id: `u_${Date.now()}`, role: 'user', content: limpio };
    const history = [...messages, msgUser].slice(-12).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, msgUser]);
    setInput('');
    setIsSending(true);
    try {
      const res = await sendMultiAgentMessage(limpio, history, {
        pathname: '/asistente',
        agentType,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: res.response,
          agentName: res.agentName,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a_err_${Date.now()}`,
          role: 'assistant',
          content: 'No pude responder ahora. Probá de nuevo en un momento.',
          agentName: 'Asistente AK',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 py-4" data-testid="solapa-hablale">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Hablale al Asistente AK</h2>
            <p className="text-sm text-slate-500">
              Preguntale lo que necesites o pedile que prepare tareas, presupuestos o resúmenes.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onOpenVoice} className="gap-1.5 text-xs">
          <AudioLines className="h-4 w-4 text-indigo-600" />
          Abrir chat flotante / Voz en vivo
        </Button>
      </div>

      {/* Selector de especialista */}
      <div className="flex flex-wrap gap-1.5">
        {AGENTES_CHAT.map((ag) => (
          <button
            key={ag.id}
            type="button"
            onClick={() => setAgentType(ag.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              agentType === ag.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {ag.label}
          </button>
        ))}
      </div>

      {/* Sugerencias rápidas */}
      <div className="grid gap-2 sm:grid-cols-2">
        {SUGERENCIAS_CHAT.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => enviar(prompt)}
            disabled={isSending}
            className="rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Conversación */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-600" />
            Conversación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="min-h-[260px] max-h-[420px] overflow-y-auto space-y-3 rounded-xl bg-slate-50 p-4">
            {messages.length === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center text-center text-slate-500">
                <Sparkles className="h-8 w-8 text-indigo-500 mb-2" />
                <p className="text-sm font-semibold text-slate-800">Listo para ayudarte.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tocá una sugerencia arriba o escribí abajo tu pregunta.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] rounded-2xl bg-slate-900 px-4 py-2.5 text-sm text-white'
                        : 'max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm'
                    }
                  >
                    {m.agentName && m.role === 'assistant' && (
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        {m.agentName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  Pensando...
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribile al Asistente AK..."
              className="min-h-[48px] resize-none rounded-xl text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar(input);
                }
              }}
            />
            <Button
              type="button"
              onClick={() => enviar(input)}
              disabled={isSending || !input.trim()}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <MultiAgentWidget />
    </div>
  );
}

const EquipoPanel = dynamic(() => import('@/components/asistente/panels/equipo'));
const MemoriaPanel = dynamic(() => import('@/components/asistente/panels/memoria'));
const AccionesPanel = dynamic(() => import('@/components/asistente/panels/acciones'));
const ContablePanel = dynamic(() => import('@/components/asistente/panels/contable'));
const FiestasPanel = dynamic(() => import('@/components/asistente/panels/fiestas'));

const SOLAPAS_PRINCIPALES = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'automatico', label: 'Lo automático' },
  { id: 'gasto', label: 'Gasto' },
  { id: 'hablale', label: 'Hablale' },
];

const SUBPANELES_AVANZADOS = [
  { id: 'equipo', label: 'Equipo' },
  { id: 'memoria', label: 'Memoria' },
  { id: 'acciones', label: 'Acciones' },
];

export interface AsistenteHubClientProps {
  initialTareas?: EstadoDeTarea[];
  initialGasto?: ResumenDeGasto | null;
}

function AsistenteHubContent({ initialTareas = [], initialGasto = null }: AsistenteHubClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || 'hoy';
  const tab = rawTab === 'bandeja' ? 'hoy' : rawTab;
  const agente = searchParams.get('agente') || 'general';

  const setTab = (nextTab: string, nextAgente = agente, extraParams?: Record<string, string>) => {
    const q = new URLSearchParams({ tab: nextTab });
    if (nextTab === 'equipo' && nextAgente !== 'general') q.set('agente', nextAgente);
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        q.set(k, v);
      }
    }
    router.replace(`/asistente?${q.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pt-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* 4 solapas principales */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Secciones de Asistente AK">
          {SOLAPAS_PRINCIPALES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                tab === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Botones chicos secundarios para subpaneles avanzados */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SUBPANELES_AVANZADOS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'equipo' && (
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'general', label: 'Todos los agentes' },
            { id: 'contable', label: 'Agente Contable' },
            { id: 'fiestas', label: 'Agente Fiestas' },
          ].map((ag) => (
            <button
              key={ag.id}
              type="button"
              onClick={() => setTab('equipo', ag.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                agente === ag.id ? 'bg-primary text-primary-foreground' : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {ag.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'hoy' && <AsistenteBandejaInner />}
      {tab === 'automatico' && <AsistenteAutomaticoPanel initialTareas={initialTareas} />}
      {tab === 'gasto' && (
        <div className="space-y-6 py-4" data-testid="solapa-gasto">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gasto de IA</h2>
                <p className="text-sm text-slate-500">
                  Cuánto se gastó este mes por función y el tope mensual para frenar antes de gastar de más.
                </p>
              </div>
            </div>
            <Link
              href="/settings?seccion=asistente&sub=ai-assistant"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver configuración de IA <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <GastoIaCard initialResumen={initialGasto} />
        </div>
      )}
      {tab === 'hablale' && (
        <AsistenteHablalePanel onOpenVoice={() => setTab('hablale', agente, { hablar: '1' })} />
      )}
      {tab === 'equipo' && agente === 'general' && <EquipoPanel />}
      {tab === 'equipo' && agente === 'contable' && <ContablePanel />}
      {tab === 'equipo' && agente === 'fiestas' && <FiestasPanel />}
      {tab === 'memoria' && <MemoriaPanel />}
      {tab === 'acciones' && <AccionesPanel />}
    </div>
  );
}

export function AsistenteHubClient(props: AsistenteHubClientProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando asistente…</div>}>
      <AsistenteHubContent {...props} />
    </Suspense>
  );
}
