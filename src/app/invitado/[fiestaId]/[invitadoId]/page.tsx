'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateGuestExperience } from '@/app/actions/fiesta/invitados.actions';
import type { FiestaEnPlanificacion, Invitado, PerfilInvitado } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Send, CheckCircle2, XCircle, HelpCircle, Star, Accessibility, Crown, Users, User, Map, CloudRain, ParkingCircle, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const rsvpConfig = {
  Confirmado: { icon: CheckCircle2, cls: 'text-green-500', badge: 'bg-green-100 text-green-700' },
  Rechazado: { icon: XCircle, cls: 'text-red-400', badge: 'bg-red-100 text-red-700' },
  'Tal vez': { icon: HelpCircle, cls: 'text-amber-400', badge: 'bg-amber-100 text-amber-700' },
  Pendiente: { icon: HelpCircle, cls: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' },
};

const perfilConfig: Record<PerfilInvitado, { label: string; icon: React.ElementType; color: string; bg: string; gradient: string }> = {
  VIP: { label: 'Invitado VIP', icon: Crown, color: 'text-amber-700', bg: 'bg-amber-100', gradient: 'from-amber-500 to-yellow-500' },
  Familia: { label: 'Familia', icon: Users, color: 'text-blue-700', bg: 'bg-blue-100', gradient: 'from-blue-500 to-indigo-500' },
  General: { label: 'Invitado', icon: User, color: 'text-slate-700', bg: 'bg-slate-100', gradient: 'from-purple-500 to-pink-500' },
  'Necesidades Especiales': { label: 'Atención Especial', icon: Accessibility, color: 'text-green-700', bg: 'bg-green-100', gradient: 'from-green-500 to-teal-500' },
};

export default function InvitadoPage() {
  const params = useParams<{ fiestaId: string; invitadoId: string }>();
  const { fiestaId, invitadoId } = params;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!fiestaId || !invitadoId) return;
    getFiestaById(fiestaId)
      .then(data => {
        if (!data) { setError('Evento no encontrado.'); return; }
        setFiesta(data);
        const inv = (data.invitados ?? []).find(i => i.id === invitadoId);
        if (!inv) { setError('Invitado no encontrado.'); return; }
        setInvitado(inv);
        setMensaje(inv.mensaje ?? '');
        if (inv.mensaje) setSent(true);
      })
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId, invitadoId]);

  const handleEnviarMensaje = async () => {
    if (!mensaje.trim() || !invitado) return;
    setIsSending(true);
    const result = await updateGuestExperience(fiestaId, invitadoId, { mensaje: mensaje.trim() });
    if (result.success) {
      setSent(true);
      toast({ title: '✅ Mensaje enviado', description: '¡Gracias por tu mensaje!' });
    } else {
      toast({ title: 'Error', description: result.error ?? 'No se pudo enviar.', variant: 'destructive' });
    }
    setIsSending(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
    </div>
  );

  if (error || !fiesta || !invitado) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md text-center border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{error ?? 'No se encontró el invitado.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  const config = fiesta.configuracion;
  const rsvpCfg = rsvpConfig[invitado.rsvp] ?? rsvpConfig.Pendiente;
  const RsvpIcon = rsvpCfg.icon;
  const fechaEvento = config?.fechaEvento ? new Date(config.fechaEvento) : null;
  const diasRestantes = fechaEvento ? Math.ceil((fechaEvento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  // VIP/Perfil configuration
  const perfil = invitado.perfil ?? 'General';
  const perfilCfg = perfilConfig[perfil];
  const PerfilIcon = perfilCfg.icon;
  const isVip = perfil === 'VIP';
  const isAccesibilidad = perfil === 'Necesidades Especiales' || invitado.requiereAccesibilidad;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-black">
      <header className="bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 border-b border-purple-700/30 shadow-2xl">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{config?.nombreEvento ?? 'Evento'}</p>
            <p className="text-xs text-purple-200">{config?.tipoCelebracion}</p>
          </div>
          {diasRestantes !== null && diasRestantes >= 0 && (
            <Badge variant="outline" className="text-amber-300 border-amber-400/50 bg-amber-500/20 shrink-0 font-bold">
              {diasRestantes === 0 ? '🎉 ¡Hoy!' : `${diasRestantes} días`}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card with VIP styling */}
        <Card className="overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white via-slate-50 to-purple-50">
          <div className={`h-2 bg-gradient-to-r ${perfilCfg.gradient}`} />
          <CardContent className="pt-6 text-center space-y-3">
            <div className={`w-16 h-16 rounded-full ${perfilCfg.bg} flex items-center justify-center mx-auto ring-4 ring-white shadow-lg`}>
              {isVip ? (
                <Crown className={`w-8 h-8 ${perfilCfg.color} animate-pulse`} />
              ) : (
                <span className="text-3xl">🎉</span>
              )}
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                {perfil !== 'General' && (
                  <Badge className={`${perfilCfg.bg} ${perfilCfg.color} border-0 text-xs`}>
                    <PerfilIcon className="w-3 h-3 mr-1" />
                    {perfilCfg.label}
                  </Badge>
                )}
              </div>
              <p className="text-xl font-black text-slate-900">¡Hola, {invitado.nombre}!</p>
              <p className="text-sm text-slate-500 mt-1">Estás invitado/a a <span className="font-semibold">{config?.nombreEvento}</span></p>
            </div>
            {fechaEvento && (
              <p className="text-sm text-slate-600">
                📅 {fechaEvento.toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
            {config?.nombreLugar && (
              <p className="text-sm text-slate-600">📍 {config.nombreLugar}</p>
            )}
          </CardContent>
        </Card>

        {/* Personalized message for VIP guests */}
        {invitado.mensajePersonalizado && (
          <Card className={`border ${isVip ? 'border-amber-200 bg-amber-50' : 'border-indigo-200 bg-indigo-50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-black flex items-center gap-2 ${isVip ? 'text-amber-800' : 'text-indigo-800'}`}>
                <Star className="w-4 h-4" />
                Mensaje especial para vos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm leading-relaxed italic ${isVip ? 'text-amber-900' : 'text-indigo-900'}`}>
                &ldquo;{invitado.mensajePersonalizado}&rdquo;
              </p>
            </CardContent>
          </Card>
        )}

        {/* Accessibility info */}
        {isAccesibilidad && config?.rutaAccesibilidad && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-green-800">
                <Accessibility className="w-4 h-4" />
                Información de Accesibilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-800 leading-relaxed">{config.rutaAccesibilidad}</p>
            </CardContent>
          </Card>
        )}

        {/* RSVP Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-black">Tu estado de confirmación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <RsvpIcon className={`w-8 h-8 ${rsvpCfg.cls}`} />
              <div>
                <Badge className={rsvpCfg.badge}>{invitado.rsvp}</Badge>
                {invitado.tableNumber && (
                  <p className="text-sm text-slate-500 mt-1">Mesa: <span className="font-semibold">{invitado.tableNumber}</span></p>
                )}
                {invitado.partySize && invitado.partySize > 1 && (
                  <p className="text-sm text-slate-500">Grupo: {invitado.partySize} personas</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mensaje para los festejados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-black">💌 Mensaje para los festejados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sent && invitado.mensaje ? (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-green-800 font-semibold mb-1">✅ Tu mensaje fue enviado</p>
                <p className="text-sm text-slate-700 italic">&ldquo;{invitado.mensaje}&rdquo;</p>
              </div>
            ) : (
              <>
                <Textarea
                  placeholder="Escribí un mensaje especial para los festejados..."
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleEnviarMensaje}
                  disabled={isSending || !mensaje.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Enviar mensaje
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {invitado.dietaryRestriction && invitado.dietaryRestriction !== 'Ninguna' && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-700">
                🍽️ Restricción alimentaria registrada: <span className="font-semibold">{invitado.dietaryRestriction}</span>
              </p>
              {invitado.alergiasEspecificas && (
                <p className="text-xs text-slate-500 mt-1">Detalle: {invitado.alergiasEspecificas}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Salon Map */}
        {config?.mapaDelSalonUrl && (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-indigo-800">
                <Map className="w-4 h-4" />
                Mapa del Salón
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={config.mapaDelSalonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 underline underline-offset-2"
              >
                <Navigation className="w-3.5 h-3.5" />
                Ver mapa del salón
              </a>
            </CardContent>
          </Card>
        )}

        {/* Arrival instructions */}
        {config?.instruccionesLlegada && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-700">
                <Navigation className="w-4 h-4" />
                Cómo llegar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed">{config.instruccionesLlegada}</p>
              {config.infoEstacionamiento && (
                <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                  <ParkingCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{config.infoEstacionamiento}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rain protocol */}
        {config?.protocoloLluvia && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-blue-800">
                <CloudRain className="w-4 h-4" />
                Plan de lluvia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700 leading-relaxed">{config.protocoloLluvia}</p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-8 text-center">
        <div className="max-w-md mx-auto px-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur border border-purple-500/20">
            <p className="text-sm font-bold text-amber-300 mb-1">✨ AK Producciones Eventos</p>
            <p className="text-xs text-purple-200">Salto, Uruguay</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
