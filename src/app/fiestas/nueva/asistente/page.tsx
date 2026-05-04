'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bot, Brain, CheckCircle2, Loader2, PartyPopper, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { sendMultiAgentMessage } from '@/app/actions/multiagent';
import type { AkMultiAgentMessage } from '@/types/multiagent';

type ChatMessage = AkMultiAgentMessage & { id: string; agentName?: string };

function FiestaAgentContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') || undefined;
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const backHref = useMemo(() => fiestaId ? `/fiestas/nueva?fiestaId=${fiestaId}` : '/fiestas/nueva', [fiestaId]);

  async function askAgent(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: trimmed };
    const history = [...messages, userMessage].slice(-12).map(({ role, content }) => ({ role, content }));
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendMultiAgentMessage(trimmed, history, {
        pathname: '/fiestas/nueva/asistente',
        fiestaId,
        agentType: 'fiesta',
      });
      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: result.response,
        agentName: result.agentName,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: 'No pude revisar esta fiesta ahora. Probá de nuevo o pasame el error.',
        agentName: 'Asistente de Fiesta',
      }]);
    } finally {
      setIsSending(false);
    }
  }

  const prompts = [
    'Revisá esta fiesta y decime qué falta',
    'Dame los riesgos principales de esta fiesta',
    'Qué tengo que hacer hoy para esta fiesta',
    'Qué aprendizaje debería guardar de esta fiesta',
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <div className="flex flex-col gap-4 rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-600 p-4 text-white shadow-lg shadow-red-900/20">
            <PartyPopper className="h-8 w-8" />
          </div>
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Agente por fiesta</Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Asistente de esta fiesta</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Este agente trabaja solo con la fiesta abierta. Revisa pendientes, riesgos, tareas, pagos, invitados, catering, decoración, música, fotografía y aprendizajes del evento.
            </p>
          </div>
        </div>
        <Link href={backHref}>
          <Button variant="outline" className="rounded-2xl font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la fiesta
          </Button>
        </Link>
      </div>

      {!fiestaId && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm font-semibold text-amber-800">
            No detecté el ID de la fiesta. Entrá desde una fiesta concreta para que el agente pueda leer sus datos.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {prompts.map(prompt => (
          <button
            key={prompt}
            type="button"
            onClick={() => askAgent(prompt)}
            className="rounded-2xl border border-red-100 bg-white p-4 text-left text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
          >
            <Sparkles className="mb-3 h-5 w-5 text-red-600" />
            {prompt}
          </button>
        ))}
      </div>

      <Card className="rounded-3xl border-red-100 bg-white shadow-xl shadow-red-900/5">
        <CardHeader className="border-b border-red-50">
          <CardTitle className="flex items-center gap-2 text-xl font-black">
            <Bot className="h-5 w-5 text-red-600" /> Conversación con el agente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="min-h-[360px] space-y-3 rounded-2xl bg-slate-50 p-4">
            {messages.length === 0 && (
              <div className="flex h-[320px] flex-col items-center justify-center text-center text-slate-500">
                <Brain className="mb-4 h-10 w-10 text-red-500" />
                <p className="font-black text-slate-800">Todavía no hablamos de esta fiesta.</p>
                <p className="mt-1 max-w-md text-sm">Tocá una sugerencia de arriba o escribime qué querés revisar.</p>
              </div>
            )}

            {messages.map(message => (
              <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={message.role === 'user'
                  ? 'max-w-[84%] rounded-2xl bg-red-600 px-4 py-3 text-sm leading-6 text-white'
                  : 'max-w-[84%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm'}>
                  {message.role === 'assistant' && message.agentName && (
                    <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-red-600">{message.agentName}</p>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Revisando fiesta...
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Ejemplo: decime qué falta antes del evento..."
              className="min-h-[52px] resize-none rounded-2xl"
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  askAgent(input);
                }
              }}
            />
            <Button onClick={() => askAgent(input)} disabled={isSending || !input.trim()} className="rounded-2xl bg-red-600 px-5 hover:bg-red-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-green-50 p-3 text-xs font-semibold text-green-800">
            <CheckCircle2 className="h-4 w-4" /> Esta pantalla ya usa el nuevo Multiagente AK, no el asistente viejo.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FiestaAgentPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>}>
      <FiestaAgentContent />
    </Suspense>
  );
}
