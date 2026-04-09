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
import { Loader2, AlertTriangle, Send, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const rsvpConfig = {
  Confirmado: { icon: CheckCircle2, cls: 'text-green-500', badge: 'bg-green-100 text-green-700' },
  Rechazado: { icon: XCircle, cls: 'text-red-400', badge: 'bg-red-100 text-red-700' },
  'Tal vez': { icon: HelpCircle, cls: 'text-amber-400', badge: 'bg-amber-100 text-amber-700' },
  Pendiente: { icon: HelpCircle, cls: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' },
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
        {/* Welcome Card */}
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <div>
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
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        <p>AK Producciones Eventos · Salto, Uruguay</p>
      </footer>
    </div>
  );
}
