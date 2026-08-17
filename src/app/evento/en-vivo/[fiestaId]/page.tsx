'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Video,
  Radio,
  Heart,
  MessageSquare,
  Sparkles,
  Share2,
  Users,
  Send,
  Loader2,
  Volume2,
  ShieldCheck,
  CheckCircle2,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { addChatMessage, getChatMessages } from '@/app/actions/social-gallery';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { ChatMessage } from '@/types/social-gallery';

export default function EventoEnVivoPage() {
  const params = useParams<{ fiestaId: string }>();
  const fiestaId = params.fiestaId;
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const guestNameParam = searchParams.get('nombre') || '';
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [authorName, setAuthorName] = useState(guestNameParam);
  const [chatDraft, setChatDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [heartCount, setHeartCount] = useState(12);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [fData, chatData] = await Promise.all([
          getFiestaById(fiestaId),
          getChatMessages(fiestaId),
        ]);
        setFiesta(fData);
        setMessages(chatData);
      } catch (err) {
        console.error('Error cargando en vivo:', err);
      } finally {
        setLoading(false);
      }
    }
    load();

    const interval = setInterval(async () => {
      try {
        const chatData = await getChatMessages(fiestaId);
        setMessages(chatData);
      } catch {
        // Ignorar errores transitorios de polling
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [fiestaId]);

  const handleSendReaction = () => {
    setHeartCount((c) => c + 1);
    const id = Date.now();
    setFloatingHearts((prev) => [...prev, id]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((item) => item !== id));
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatDraft.trim()) return;

    const sender = authorName.trim() || 'Familiar a la distancia';
    setSending(true);
    try {
      const res = await addChatMessage(fiestaId, chatDraft.trim(), sender);
      if (res.success) {
        setChatDraft('');
        const updated = await getChatMessages(fiestaId);
        setMessages(updated);
      }
    } catch {
      toast({
        title: 'Error al enviar mensaje',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="h-8 w-8 animate-spin text-red-600 mb-3" />
        <p className="text-sm font-bold">Conectando a la transmisión en vivo...</p>
      </div>
    );
  }

  const eventName = fiesta?.configuracion.nombreEvento || 'Fiesta AK';
  const liveUrl = (fiesta?.configuracion as any)?.liveStreamUrl;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-black truncate">{eventName}</h1>
              <p className="text-[10px] text-slate-400">Transmisión Privada Exclusiva</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-red-500/30">
            <Radio className="h-3.5 w-3.5" /> En Vivo
          </div>
        </div>
      </header>

      {/* Main Grid: Video Player + Live Interactive Chat */}
      <main className="flex-1 max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 sm:p-4">
        {/* Columna Izquierda: Reproductor de Video */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
            {liveUrl ? (
              <iframe
                src={liveUrl}
                title="Transmisión en Vivo"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-red-600/20 text-red-500 border border-red-500/30">
                  <Video className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">Transmisión Privada Lista</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    La señal se activará durante los momentos clave de la fiesta (Entrada, Vals, Brindis y Torta).
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Enlace protegido para familiares</span>
                </div>
              </div>
            )}

            {/* Floating hearts animation */}
            <div className="absolute right-4 bottom-4 pointer-events-none flex flex-col items-center">
              {floatingHearts.map((id) => (
                <div
                  key={id}
                  className="text-pink-500 animate-bounce text-2xl font-bold drop-shadow-md mb-1"
                >
                  ❤️
                </div>
              ))}
            </div>
          </div>

          {/* Barra de Reacción Rápida */}
          <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3 border border-slate-800">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleSendReaction}
                className="bg-pink-600 hover:bg-pink-700 text-white font-black text-xs gap-1.5 rounded-xl h-10 px-4 shadow-md transition active:scale-95"
              >
                <Heart className="h-4 w-4 fill-current" />
                <span>Mandar Amor ({heartCount})</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Acompañando a la distancia ✨
            </p>
          </div>
        </div>

        {/* Columna Derecha: Chat y Saludos en Vivo */}
        <div className="lg:col-span-4 flex flex-col h-[400px] lg:h-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-red-500" />
              Saludos de la Familia
            </span>
            <span className="text-[10px] text-slate-500">{messages.length} mensajes</span>
          </div>

          {/* Lista de Mensajes con Scroll */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Smile className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <span>Sé la primera persona en mandar un saludo a la fiesta.</span>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="rounded-xl bg-slate-800/80 p-2.5 border border-slate-700/50">
                  <p className="text-[11px] font-bold text-amber-400">{m.authorName}</p>
                  <p className="text-xs text-slate-200 mt-0.5 break-words">{m.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Formulario de Envío de Saludo */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
            {!authorName && (
              <Input
                type="text"
                placeholder="Tu nombre (ej. Tía Marta)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="h-8 text-xs bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
              />
            )}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Escribí tu saludo..."
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                className="h-10 text-xs bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
              />
              <Button
                type="submit"
                disabled={sending || !chatDraft.trim()}
                className="h-10 px-3 bg-red-700 hover:bg-red-800 text-white rounded-xl shrink-0"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
