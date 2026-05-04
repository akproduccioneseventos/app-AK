'use client';

import { useState } from 'react';
import { Bot, CalendarCheck, Loader2, PhoneCall, Send, Sparkles, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { sendMultiAgentMessage } from '@/app/actions/multiagent';
import type { AkMultiAgentMessage } from '@/types/multiagent';

type ChatMessage = AkMultiAgentMessage & { id: string; agentName?: string };

const quickActions = [
  { title: 'Qué hago hoy', prompt: 'Actuá como mi secretaria y decime qué tengo que hacer hoy, por prioridad.', icon: CalendarCheck },
  { title: 'A quién llamo', prompt: 'Decime a quién debería llamar o escribir hoy y por qué.', icon: PhoneCall },
  { title: 'Pagos a revisar', prompt: 'Decime qué pagos, saldos o cobros debería revisar hoy.', icon: WalletCards },
  { title: 'Resumen rápido', prompt: 'Dame un resumen rápido de prioridades de la empresa y fiestas.', icon: Sparkles },
];

export default function SecretariaAkPage() {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function askSecretaria(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: trimmed };
    const history = [...messages, userMessage].slice(-12).map(({ role, content }) => ({ role, content }));
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendMultiAgentMessage(trimmed, history, { pathname: '/secretaria-ak', agentType: 'secretaria' });
      setMessages(prev => [...prev, { id: `a_${Date.now()}`, role: 'assistant', content: result.response, agentName: result.agentName }]);
    } catch {
      setMessages(prev => [...prev, { id: `a_${Date.now()}`, role: 'assistant', content: 'No pude revisar ahora. Probá de nuevo o pasame el error.', agentName: 'Secretaria AK' }]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-600 p-4 text-white shadow-lg shadow-red-900/20">
            <CalendarCheck className="h-8 w-8" />
          </div>
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Asistente personal</Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Secretaria AK</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Tu asistente diaria para ordenar prioridades, llamados, pagos, reuniones y próximos pasos.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <button key={action.title} type="button" onClick={() => askSecretaria(action.prompt)} className="rounded-2xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50">
              <Icon className="mb-3 h-5 w-5 text-red-600" />
              <p className="text-sm font-black text-slate-900">{action.title}</p>
            </button>
          );
        })}
      </div>

      <Card className="rounded-3xl border-red-100 bg-white shadow-xl shadow-red-900/5">
        <CardHeader className="border-b border-red-50">
          <CardTitle className="flex items-center gap-2 text-xl font-black"><Bot className="h-5 w-5 text-red-600" /> Conversación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="min-h-[360px] space-y-3 rounded-2xl bg-slate-50 p-4">
            {messages.length === 0 && <div className="flex h-[320px] flex-col items-center justify-center text-center text-slate-500"><Sparkles className="mb-4 h-10 w-10 text-red-500" /><p className="font-black text-slate-800">Arrancá por una revisión diaria.</p></div>}
            {messages.map(message => (
              <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={message.role === 'user' ? 'max-w-[84%] rounded-2xl bg-red-600 px-4 py-3 text-sm leading-6 text-white' : 'max-w-[84%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm'}>
                  {message.role === 'assistant' && message.agentName && <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-red-600">{message.agentName}</p>}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isSending && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Revisando...</div></div>}
          </div>

          <div className="flex gap-2">
            <Textarea value={input} onChange={event => setInput(event.target.value)} placeholder="Ejemplo: ordename el día de hoy..." className="min-h-[52px] resize-none rounded-2xl" />
            <Button onClick={() => askSecretaria(input)} disabled={isSending || !input.trim()} className="rounded-2xl bg-red-600 px-5 hover:bg-red-700"><Send className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
