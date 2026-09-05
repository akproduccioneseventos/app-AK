'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  enviarMensajeCliente,
  getMensajesCliente,
  initializePortalSession,
  type MensajePortalCliente,
} from '@/app/actions/fiesta/portal.actions';

const SESSION_KEY_PREFIX = 'portal_auth_';

export default function PortalClienteMensajesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fiestaId = params.id;
  const { toast } = useToast();

  const [mensajes, setMensajes] = useState<MensajePortalCliente[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const cargarMensajes = useCallback(async () => {
    if (!fiestaId) return;
    try {
      const res = await getMensajesCliente(fiestaId);
      if (res.success && res.mensajes) {
        setMensajes(res.mensajes);
        setUnauthorized(false);
      } else {
        // Intentar rescatar con sessionStorage si la cookie no estaba cargada
        const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId) : null;
        if (savedKey) {
          const initRes = await initializePortalSession(fiestaId, savedKey);
          if (initRes.success) {
            const retryRes = await getMensajesCliente(fiestaId);
            if (retryRes.success && retryRes.mensajes) {
              setMensajes(retryRes.mensajes);
              setUnauthorized(false);
              return;
            }
          }
        }
        setUnauthorized(true);
      }
    } catch {
      setUnauthorized(true);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    cargarMensajes();
  }, [cargarMensajes]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const texto = nuevoMensaje.trim();
    if (!texto || isSending) return;

    setIsSending(true);
    try {
      const res = await enviarMensajeCliente(fiestaId, texto);
      if (res.success && res.mensaje) {
        setMensajes((prev) => [...prev, res.mensaje!]);
        setNuevoMensaje('');
        toast({
          title: 'Mensaje enviado',
          description: 'El equipo de AK ya recibió tu consulta y te responderá a la brevedad.',
        });
      } else {
        toast({
          title: 'No se pudo enviar',
          description: res.error || 'Ocurrió un inconveniente al enviar tu mensaje.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error de conexión',
        description: 'No pudimos conectar con el servidor. Revisá tu conexión.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-sm tracking-wide text-slate-300">Cargando mensajes del equipo...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-6 text-white">
        <Card className="max-w-md w-full bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="text-center">
            <MessageSquare className="w-10 h-10 mx-auto text-purple-400 mb-2" />
            <CardTitle>Acceso al Portal</CardTitle>
            <CardDescription className="text-slate-400">
              Necesitás ingresar con tu clave de acceso al portal para ver y enviar mensajes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href={`/portal-cliente/${fiestaId}`}>Ingresar al Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900">
            <Link href={`/portal-cliente/${fiestaId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al portal
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-purple-400" /> Mensajes con el Equipo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Escribinos cualquier duda o consulta sobre tu fiesta. El equipo te responde acá mismo.
          </p>
        </div>

        {/* Hilo de mensajes */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base text-white">Conversación</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Hilo directo entre vos y el equipo de producción.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            {mensajes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium">Todavía no hay mensajes en esta conversación.</p>
                <p className="text-xs text-slate-500">Escribí tu primer mensaje abajo para coordinar con el equipo.</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="mensajes-thread">
                {mensajes.map((m) => {
                  const esCliente = m.autor === 'cliente';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${esCliente ? 'items-end' : 'items-start'}`}
                      data-testid={`mensaje-${m.id}`}
                    >
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        {esCliente ? (
                          <>
                            <span>{m.remitenteNombre || 'Vos'}</span>
                            <User className="w-3 h-3 text-purple-400" />
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-semibold text-amber-300">Equipo AK</span>
                          </>
                        )}
                        <span className="text-slate-500 text-[10px] ml-1">
                          {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          esCliente
                            ? 'bg-purple-600 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.mensaje}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario de envío */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleEnviar} className="space-y-3">
              <Textarea
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribí acá tu mensaje o consulta para el equipo..."
                rows={3}
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none focus-visible:ring-purple-500"
                data-testid="mensaje-input"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  El equipo recibe una notificación directa con tu mensaje.
                </span>
                <Button
                  type="submit"
                  disabled={!nuevoMensaje.trim() || isSending}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                  data-testid="enviar-mensaje-btn"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Enviar mensaje
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
