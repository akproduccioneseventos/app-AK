'use client';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

import { useEffect, useState } from 'react';
import {
  getSettingsAsistenteAction,
  saveSettingsAsistenteAction,
  eliminarReglaAprendidaAction,
} from '@/app/actions/asistente-proactivo.actions';
import type { AsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import type { ReglaAprendida } from '@/lib/asistente/propuestas-service';
import {
  Bot,
  Bell,
  MessageCircle,
  Clock,
  Shield,
  PhoneCall,
  Volume2,
  Trash2,
  Save,
  Check,
  Smartphone,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { VOCES_IA_DISPONIBLES } from '@/lib/asistente/voz-gemini';
import { reproducirVozReal, detenerVozReal } from '@/lib/asistente/reproductor-voz';

export default function AsistenteSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AsistenteSettings | null>(null);
  const [reglas, setReglas] = useState<ReglaAprendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados locales editables
  const [avisoCelular, setAvisoCelular] = useState(true);
  const [whatsappDuenio, setWhatsappDuenio] = useState(false);
  const [numeroDuenio, setNumeroDuenio] = useState(AK_WHATSAPP_NUMBER);
  const [horaInicioNoMolestar, setHoraInicioNoMolestar] = useState(23);
  const [horaFinNoMolestar, setHoraFinNoMolestar] = useState(8);

  // Orden 105
  const [responderConVoz, setResponderConVoz] = useState(false);
  const [vozSeleccionada, setVozSeleccionada] = useState('Kore');
  const [vozGeminiActiva, setVozGeminiActiva] = useState(true);
  const [vozTelefonoActiva, setVozTelefonoActiva] = useState(true);
  const [numerosEquipo, setNumerosEquipo] = useState<Array<{ telefono: string; nombre: string; rol: string }>>([
    { telefono: AK_WHATSAPP_NUMBER, nombre: 'Alexander Knuth', rol: 'Dueño' },
  ]);
  const [nuevoNumero, setNuevoNumero] = useState({ telefono: '', nombre: '', rol: 'Equipo' });

  // Asistentes por Área (Dots)
  const [areas, setAreas] = useState({
    ventas: { nombre: 'Ventas', color: 'blue', responsableNombre: 'Equipo de Ventas' },
    cobros: { nombre: 'Cobros', color: 'amber', responsableNombre: 'Administración' },
    fiestas: { nombre: 'Fiestas', color: 'emerald', responsableNombre: 'Operaciones' },
  });

  const cargar = async () => {
    setLoading(true);
    const res = await getSettingsAsistenteAction();
    if (res.success && res.settings) {
      setSettings(res.settings);
      setAvisoCelular(res.settings.avisoCelularHabilitado ?? true);
      setWhatsappDuenio(res.settings.whatsappDuenioHabilitado ?? false);
      setNumeroDuenio(res.settings.numeroDuenio || AK_WHATSAPP_NUMBER);
      setHoraInicioNoMolestar(res.settings.horarioNoMolestarInicio ?? 23);
      setHoraFinNoMolestar(res.settings.horarioNoMolestarFin ?? 8);
      setResponderConVoz(res.settings.responderConVoz ?? false);
      setVozSeleccionada(
        VOCES_IA_DISPONIBLES.some((v) => v.id === res.settings.vozSeleccionada) ? res.settings.vozSeleccionada! : 'Kore',
      );
      setVozGeminiActiva(res.settings.vozGeminiActiva !== false);
      setVozTelefonoActiva(res.settings.vozTelefonoActiva !== false);
      if (res.settings.numerosEquipo && res.settings.numerosEquipo.length > 0) {
        setNumerosEquipo(res.settings.numerosEquipo);
      }
      if (res.settings.asistentesAreas) {
        setAreas(res.settings.asistentesAreas as any);
      }
      setReglas(res.reglas || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleGuardar = async () => {
    setSaving(true);
    const res = await saveSettingsAsistenteAction({
      avisoCelularHabilitado: avisoCelular,
      whatsappDuenioHabilitado: whatsappDuenio,
      numeroDuenio,
      horarioNoMolestarInicio: Number(horaInicioNoMolestar),
      horarioNoMolestarFin: Number(horaFinNoMolestar),
      responderConVoz,
      vozSeleccionada,
      vozGeminiActiva,
      vozTelefonoActiva,
      numerosEquipo,
      asistentesAreas: areas,
    });

    if (res.success) {
      toast({
        title: 'Guardado',
        description: 'Configuración guardada correctamente.',
      });
    } else {
      toast({
        title: 'Error',
        description: res.error || 'Error al guardar.',
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  const handleEliminarRegla = async (id: string) => {
    const res = await eliminarReglaAprendidaAction(id);
    if (res.success) {
      toast({
        title: 'Regla desestimada',
        description: 'El asistente volverá a avisarte de esto.',
      });
      setReglas((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast({
        title: 'Error',
        description: 'Error al eliminar regla.',
        variant: 'destructive',
      });
    }
  };

  const handleAgregarNumero = () => {
    if (!nuevoNumero.telefono || !nuevoNumero.nombre) {
      toast({
        title: 'Datos requeridos',
        description: 'Completá teléfono y nombre.',
        variant: 'destructive',
      });
      return;
    }
    const cleanTel = nuevoNumero.telefono.replace(/\D/g, '');
    setNumerosEquipo((prev) => [...prev, { ...nuevoNumero, telefono: cleanTel }]);
    setNuevoNumero({ telefono: '', nombre: '', rol: 'Equipo' });
  };

  const handleEliminarNumero = (index: number) => {
    if (index === 0) {
      toast({
        title: 'Acción no permitida',
        description: 'No se puede eliminar el número principal del dueño.',
        variant: 'destructive',
      });
      return;
    }
    setNumerosEquipo((prev) => prev.filter((_, i) => i !== index));
  };

  const [probandoVoz, setProbandoVoz] = useState(false);

  const handleProbarVoz = async () => {
    setProbandoVoz(true);
    const meta = VOCES_IA_DISPONIBLES.find((v) => v.id === vozSeleccionada);
    const nombreVoz = meta ? meta.nombre.split('—')[0].trim() : 'seleccionada';
    const frase = `Hola Alexander, soy tu asistente de eventos con la voz de ${nombreVoz}. Todo listo para tus eventos.`;
    toast({
      title: 'Probando voz',
      description: `Reproduciendo audio con ${meta?.nombre || vozSeleccionada}...`,
    });
    await reproducirVozReal(frase, {
      voz: vozSeleccionada,
      onEnd: () => setProbandoVoz(false),
      onError: () => setProbandoVoz(false),
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando ajustes del asistente...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-600" />
          Ajustes de Tu Asistente AK
        </h1>
        <p className="text-sm text-slate-500">
          Configurá cómo te busca, por qué canales, horarios de descanso y qué tiene permitido hacer solo.
        </p>
      </div>

      {/* 1. Canales de Notificación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Canales de Aviso y Notificaciones
          </CardTitle>
          <CardDescription>
            Elegí cómo y cuándo te avisa de cosas importantes (máx 3 WhatsApp/día).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-800">Aviso en el celular (Push)</Label>
              <p className="text-xs text-slate-500">
                Notificación instantánea en la app (prendido de fábrica).
              </p>
            </div>
            <Switch checked={avisoCelular} onCheckedChange={setAvisoCelular} />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-800">WhatsApp al dueño</Label>
              <p className="text-xs text-slate-500">
                Mensaje de resumen al WhatsApp del dueño (apagado de fábrica).
              </p>
            </div>
            <Switch checked={whatsappDuenio} onCheckedChange={setWhatsappDuenio} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Número de WhatsApp del dueño</Label>
              <Input
                value={numeroDuenio}
                onChange={(e) => setNumeroDuenio(e.target.value)}
                placeholder="59898355530"
                className="text-sm font-mono"
              />
              <p className="text-[11px] text-slate-400">Sólo este número recibe los avisos de WhatsApp.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Horario de "No molestar"</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={horaInicioNoMolestar}
                  onChange={(e) => setHoraInicioNoMolestar(Number(e.target.value))}
                  className="w-20 text-center text-sm"
                />
                <span className="text-xs text-slate-400">a</span>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={horaFinNoMolestar}
                  onChange={(e) => setHoraFinNoMolestar(Number(e.target.value))}
                  className="w-20 text-center text-sm"
                />
                <span className="text-xs text-slate-500">hs (de 23 a 8 de fábrica)</span>
              </div>
              <p className="text-[11px] text-slate-400">Durante este horario no se mandan WhatsApps; se juntan para las 8 hs.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Asistentes por Área (Dots) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Asistentes por Área
          </CardTitle>
          <CardDescription>
            Personalizá los nombres y asigná responsables del equipo para cada área.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ventas */}
            <div className="p-4 border rounded-xl bg-blue-50/40 border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-600 text-white">Ventas</Badge>
                <span className="text-xs text-blue-700 font-medium">Presupuestos & Metas</span>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Nombre del Asistente</Label>
                <Input
                  value={areas.ventas.nombre}
                  onChange={(e) => setAreas({ ...areas, ventas: { ...areas.ventas, nombre: e.target.value } })}
                  className="text-sm mt-1 bg-white"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Responsable asignado</Label>
                <Input
                  value={areas.ventas.responsableNombre}
                  onChange={(e) => setAreas({ ...areas, ventas: { ...areas.ventas, responsableNombre: e.target.value } })}
                  className="text-sm mt-1 bg-white"
                />
              </div>
            </div>

            {/* Cobros */}
            <div className="p-4 border rounded-xl bg-amber-50/40 border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-600 text-white">Cobros</Badge>
                <span className="text-xs text-amber-700 font-medium">Cuotas & Saldos</span>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Nombre del Asistente</Label>
                <Input
                  value={areas.cobros.nombre}
                  onChange={(e) => setAreas({ ...areas, cobros: { ...areas.cobros, nombre: e.target.value } })}
                  className="text-sm mt-1 bg-white"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Responsable asignado</Label>
                <Input
                  value={areas.cobros.responsableNombre}
                  onChange={(e) => setAreas({ ...areas, cobros: { ...areas.cobros, responsableNombre: e.target.value } })}
                  className="text-sm mt-1 bg-white"
                />
              </div>
            </div>

            {/* Fiestas */}
            <div className="p-4 border rounded-xl bg-emerald-50/40 border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white">Fiestas</Badge>
                <span className="text-xs text-emerald-700 font-medium">Checklist, Clima & Salón</span>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Nombre del Asistente</Label>
                <Input
                  value={areas.fiestas.nombre}
                  onChange={(e) => setAreas({ ...areas, fiestas: { ...areas.fiestas, nombre: e.target.value } })}
                  className="text-sm mt-1 bg-white"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Responsable asignado</Label>
                <Input
                  value={areas.fiestas.responsableNombre}
                  onChange={(e) => setAreas({ ...areas, fiestas: { ...areas.fiestas, responsableNombre: e.target.value } })}
                  className="text-sm mt-1 bg-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Voz y Teléfono (Orden 105) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-indigo-600" />
            Voz Real y Conversación
          </CardTitle>
          <CardDescription>
            Configuración de voz de Gemini y números autorizados para hablarle por WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-800">Contestarme con voz</Label>
              <p className="text-xs text-slate-500">
                Si le mandás un audio, te responde con audio generado por IA (apagado por omisión).
              </p>
            </div>
            <Switch checked={responderConVoz} onCheckedChange={setResponderConVoz} />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-800">Voz de Gemini (la que suena natural)</Label>
              <p className="text-xs text-slate-500">
                Usa la parte gratis de Gemini, con un tope de 100 por día. Pasado el tope, sigue la del teléfono.
              </p>
            </div>
            <Switch checked={vozGeminiActiva} onCheckedChange={setVozGeminiActiva} />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-slate-800">Voz del teléfono</Label>
              <p className="text-xs text-slate-500">
                Gratis siempre. Si apagás las dos, el asistente no habla y muestra sólo el texto.
              </p>
            </div>
            <Switch checked={vozTelefonoActiva} onCheckedChange={setVozTelefonoActiva} />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-slate-600">Voz de Gemini</Label>
              <select
                value={vozSeleccionada}
                onChange={(e) => setVozSeleccionada(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white"
              >
                {VOCES_IA_DISPONIBLES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre} ({v.genero})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {VOCES_IA_DISPONIBLES.find((v) => v.id === vozSeleccionada)?.descripcion ||
                  'Voz de Gemini para el asistente y el parte de la mañana.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleProbarVoz}
              disabled={probandoVoz}
              className="mt-6 text-xs shrink-0"
            >
              <Volume2 className={`h-3.5 w-3.5 mr-1 ${probandoVoz ? 'animate-pulse text-indigo-600' : ''}`} />
              {probandoVoz ? 'Reproduciendo...' : 'Escuchar'}
            </Button>
          </div>

          {/* Números autorizados */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-xs font-semibold text-slate-700">Números que hablan con la app</Label>
            <div className="space-y-2">
              {numerosEquipo.map((n, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{n.nombre}</span> ({n.rol}) —{' '}
                    <span className="font-mono text-slate-600">{n.telefono}</span>
                  </div>
                  {i > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => handleEliminarNumero(i)} className="h-6 w-6 p-0 text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Teléfono (ej: 59899123456)"
                value={nuevoNumero.telefono}
                onChange={(e) => setNuevoNumero({ ...nuevoNumero, telefono: e.target.value })}
                className="text-xs"
              />
              <Input
                placeholder="Nombre"
                value={nuevoNumero.nombre}
                onChange={(e) => setNuevoNumero({ ...nuevoNumero, nombre: e.target.value })}
                className="text-xs"
              />
              <Button size="sm" variant="outline" onClick={handleAgregarNumero} className="text-xs shrink-0">
                Sumar número
              </Button>
            </div>
          </div>

          {/* Voz especializada preparada y apagada */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <Sparkles className="h-3.5 w-3.5" />
                Voz especializada de alta fidelidad (ElevenLabs)
              </div>
              <p className="text-[11px] text-amber-700">
                Servicio pago: consultalo antes de activarlo.
              </p>
            </div>
            <Switch disabled checked={false} />
          </div>

          {/* Llamadas telefónicas preparadas y apagadas */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <PhoneCall className="h-3.5 w-3.5" />
                Atender llamadas con la IA
              </div>
              <p className="text-[11px] text-amber-700">
                Necesita un servicio pago con abono mensual. Consultalo antes de activarlo.
              </p>
            </div>
            <Switch disabled checked={false} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Reglas Aprendidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Reglas Aprendidas y Filtros ("No me avises más")
          </CardTitle>
          <CardDescription>
            Propuestas que decidiste silenciar permanentemente. Podés reactivarlas acá.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reglas.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No hay reglas activas. Cuando toques "No me avises más de esto" en una propuesta, aparecerá acá.
            </p>
          ) : (
            <div className="space-y-2">
              {reglas.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">Tipo: {r.tipoPropuesta}</span>
                    {r.clienteNombre && <span className="text-slate-500"> — Cliente: {r.clienteNombre}</span>}
                    <span className="text-slate-400 ml-2">({new Date(r.creadaEn).toLocaleDateString('es-UY')})</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEliminarRegla(r.id)}
                    className="h-7 text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Volver a avisar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleGuardar} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar todos los ajustes'}
        </Button>
      </div>
    </div>
  );
}
