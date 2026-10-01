'use client';

import { useEffect, useState } from 'react';
import { MultiAgentWidget } from '@/components/multiagent/multiagent-widget';
import {
  getBandejaAsistenteAction,
  aceptarPropuestaAction,
  posponerPropuestaAction,
  descartarPropuestaAction,
  tomarPropuestaAction,
  marcarResumenVistoAction,
  guardarMetaMesAction,
} from '@/app/actions/asistente-proactivo.actions';
import type { AsistentePropuesta, ResumenMientrasNoEstabas, AsistenteArea } from '@/lib/asistente/propuestas-service';
import type { AsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import {
  Sparkles,
  CheckCircle,
  Clock,
  BellOff,
  UserCheck,
  TrendingUp,
  DollarSign,
  PartyPopper,
  Filter,
  Eye,
  AlertTriangle,
  Target,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function AsistenteBandejaPage() {
  const { toast } = useToast();
  const [areaFiltro, setAreaFiltro] = useState<AsistenteArea | 'todas'>('todas');
  const [propuestas, setPropuestas] = useState<AsistentePropuesta[]>([]);
  const [resumen, setResumen] = useState<ResumenMientrasNoEstabas | null>(null);
  const [settings, setSettings] = useState<AsistenteSettings | null>(null);
  const [usuarioNombre, setUsuarioNombre] = useState<string>('Equipo');
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
      setSettings(res.settings || null);
      setUsuarioNombre(res.usuarioNombre || 'Equipo');
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
    await marcarResumenVistoAction(resumen.id);
    setResumen(null);
    toast({
      title: 'Resumen visto',
      description: 'Resumen marcado como visto.',
    });
  };

  const handleGuardarMeta = async () => {
    setGuardandoMeta(true);
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
    setGuardandoMeta(false);
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
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tu Asistente AK</h1>
              <p className="text-sm text-slate-500">
                Se anticipa 24/7 a errores, cobros, clima y oportunidades de venta.
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Áreas */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
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
          <div className="flex gap-2">
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
              Guardar meta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Propuestas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            Propuestas pendientes
            <Badge variant="secondary" className="text-xs font-mono">
              {propuestas.length}
            </Badge>
          </h2>
          <Button variant="ghost" size="sm" onClick={cargarDatos} className="text-xs text-slate-500">
            Actualizar
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
                    <div className="flex items-center gap-2">
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

      {/* Widget MultiAgente para interactuar por voz o texto */}
      <MultiAgentWidget />
    </div>
  );
}
