'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateGuestExperience } from '@/app/actions/fiesta/invitados.actions';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, AlertTriangle, Send, CheckCircle2, XCircle, HelpCircle,
  MapPin, Clock, Car, Accessibility, UtensilsCrossed, Crown,
  Users, Star, Phone, ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const rsvpConfig = {
  Confirmado: { icon: CheckCircle2, cls: 'text-green-500', badge: 'bg-green-100 text-green-700' },
  Rechazado: { icon: XCircle, cls: 'text-red-400', badge: 'bg-red-100 text-red-700' },
  'Tal vez': { icon: HelpCircle, cls: 'text-amber-400', badge: 'bg-amber-100 text-amber-700' },
  Pendiente: { icon: HelpCircle, cls: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' },
};

const segmentoConfig = {
  VIP: { label: 'Invitado VIP', icon: Crown, gradient: 'from-amber-400 to-yellow-600', badge: 'bg-amber-100 text-amber-800 border-amber-200', emoji: '👑' },
  Familia: { label: 'Familia', icon: Users, gradient: 'from-blue-500 to-indigo-600', badge: 'bg-blue-100 text-blue-800 border-blue-200', emoji: '💙' },
  General: { label: 'Invitado', icon: Star, gradient: 'from-purple-500 to-pink-500', badge: 'bg-purple-100 text-purple-800 border-purple-200', emoji: '🎉' },
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
  const segmento = invitado.segmento ?? 'General';
  const segCfg = segmentoConfig[segmento];
  const hasAlergias = (invitado.alergias && invitado.alergias.trim()) || (invitado.dietaryRestriction && invitado.dietaryRestriction !== 'Ninguna') || invitado.isCeliac;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{config?.nombreEvento ?? 'Evento'}</p>
            <p className="text-xs text-slate-500">{config?.tipoCelebracion}</p>
          </div>
          {diasRestantes !== null && diasRestantes >= 0 && (
            <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 shrink-0">
              {diasRestantes === 0 ? '🎉 ¡Hoy!' : `${diasRestantes} días`}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card with segmentation */}
        <Card className="overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${segCfg.gradient}`} />
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-3xl">
              {segCfg.emoji}
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">¡Hola, {invitado.nombre}!</p>
              <p className="text-sm text-slate-500 mt-1">Estás invitado/a a <span className="font-semibold">{config?.nombreEvento}</span></p>
              {segmento !== 'General' && (
                <Badge className={`mt-2 ${segCfg.badge}`}>
                  {segCfg.emoji} {segCfg.label}
                </Badge>
              )}
            </div>
            {/* Personalized message from organizer */}
            {invitado.mensajePersonalizado && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-left">
                <p className="text-xs text-purple-600 font-semibold mb-1">Mensaje especial para vos</p>
                <p className="text-sm text-slate-700 italic">&ldquo;{invitado.mensajePersonalizado}&rdquo;</p>
              </div>
            )}
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

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-black">📋 Detalles del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

            {/* Arrival time */}
            {invitado.horaLlegadaEstimada && (
              <div className="flex items-center gap-2 text-sm text-slate-600 pt-2 border-t">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Horario de llegada sugerido: <span className="font-semibold">{invitado.horaLlegadaEstimada}hs</span></span>
              </div>
            )}

            {/* Event time from config */}
            {config?.horaInicio && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Inicio del evento: <span className="font-semibold">{config.horaInicio}hs</span></span>
              </div>
            )}

            {/* Location with maps link */}
            {config?.direccionLugar && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <span>{config.direccionLugar}</span>
                  {config.googleMapsUrl && (
                    <a href={config.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-blue-600 underline text-xs inline-flex items-center gap-1">
                      Ver en Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logistics - Parking, Accessibility, Rain Protocol */}
        {(config?.infoParking || config?.accesibilidad || config?.protocoloLluvia || config?.mapaUrl || config?.contactoUrgencias) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-black">🗺️ Información Práctica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.infoParking && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <Car className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">Estacionamiento</p>
                    <p>{config.infoParking}</p>
                  </div>
                </div>
              )}
              {config.accesibilidad && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <Accessibility className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">Accesibilidad</p>
                    <p>{config.accesibilidad}</p>
                  </div>
                </div>
              )}
              {invitado.requiereAccesibilidad && (
                <div className="p-2 rounded-lg bg-blue-50 text-xs text-blue-700">
                  ♿ Tenemos registrado que necesitás acceso para movilidad reducida. ¡El equipo ya está coordinado!
                </div>
              )}
              {config.protocoloLluvia && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-lg leading-none mt-0.5">🌧️</span>
                  <div>
                    <p className="font-semibold text-slate-700">Protocolo de lluvia</p>
                    <p>{config.protocoloLluvia}</p>
                  </div>
                </div>
              )}
              {config.mapaUrl && (
                <a href={config.mapaUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 underline">
                  <MapPin className="w-4 h-4" />
                  Ver mapa del salón
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {config.contactoUrgencias && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-green-500" />
                  <span>Contacto urgencias: <span className="font-semibold">{config.contactoUrgencias}</span></span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dietary Restrictions / Allergies */}
        {hasAlergias && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-orange-700 mb-1">Necesidades alimentarias registradas</p>
                  {invitado.dietaryRestriction && invitado.dietaryRestriction !== 'Ninguna' && (
                    <p>Restricción: <span className="font-semibold">{invitado.dietaryRestriction}</span></p>
                  )}
                  {invitado.isCeliac && <p>✓ Celiaco/a registrado/a</p>}
                  {invitado.alergias && <p>Alergias: {invitado.alergias}</p>}
                  <p className="text-xs text-orange-600 mt-1">El equipo de catering ya tiene esta información.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIP exclusive content */}
        {segmento === 'VIP' && (
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="text-base font-black text-amber-800">👑 Acceso VIP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">
                Como invitado VIP, tendrás atención preferencial durante todo el evento.
                El equipo de AK Producciones está a tu disposición para lo que necesites.
              </p>
            </CardContent>
          </Card>
        )}

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
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        <p>AK Producciones Eventos · Salto, Uruguay</p>
      </footer>
    </div>
  );
}
