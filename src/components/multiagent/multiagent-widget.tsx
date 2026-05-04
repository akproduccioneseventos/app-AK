'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, Brain, CalendarCheck, DollarSign, Loader2, Megaphone, MessageSquare, PartyPopper, Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { sendMultiAgentMessage } from '@/app/actions/multiagent';
import type { AkAgentType, AkMultiAgentMessage } from '@/types/multiagent';
import { cn } from '@/lib/utils';

type ChatMessage = AkMultiAgentMessage & {
  id: string;
  agentName?: string;
  agentType?: AkAgentType;
};

const AGENT_STYLE: Record<AkAgentType, { label: string; icon: any; badge: string }> = {
  secretaria: { label: 'Secretaria AK', icon: CalendarCheck, badge: 'Siempre activa' },
  fiesta: { label: 'Asistente de Fiesta', icon: PartyPopper, badge: 'Fiesta actual' },
  fiestas_general: { label: 'General de Fiestas', icon: Brain, badge: 'Todas las fiestas' },
  contable: { label: 'Contable AK', icon: DollarSign, badge: 'Rentabilidad' },
  marketing: { label: 'Marketing AK', icon: Megaphone, badge: 'Contenido' },
  comercial: { label: 'Comercial AK', icon: MessageSquare, badge: 'Ventas' },
  central: { label: 'Multiagente AK', icon: Bot, badge: 'Central' },
};

function detectVisibleAgent(pathname: string): AkAgentType {
  if (pathname.startsWith('/fiestas/nueva')) return 'fiesta';
  if (pathname.includes('/empresa/contabilidad') || pathname.includes('/invoices')) return 'contable';
  if (pathname.includes('/marketing') || pathname.includes('/empresa/redes-sociales')) return 'marketing';
  if (pathname.includes('/contabilidad/crm')) return 'comercial';
  if (pathname.includes('/multiagente')) return 'central';
  return 'secretaria';
}

function getFiestaIdFromLocation(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  return params.get('fiestaId') || undefined;
}

export function MultiAgentWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fiestaId, setFiestaId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('ak-multiagent-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const endRef = useRef<HTMLDivElement>(null);

  const activeAgent = useMemo(() => detectVisibleAgent(pathname || ''), [pathname]);
  const style = AGENT_STYLE[activeAgent];
  const Icon = style.icon;

  useEffect(() => {
    setFiestaId(getFiestaIdFromLocation());
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem('ak-multiagent-history', JSON.stringify(messages.slice(-40)));
    } catch {
      // ignore storage errors
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isSending]);

  async function handleSend(override?: string) {
    const text = (override ?? input).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
    };

    const historyForServer = [...messages, userMessage].slice(-12).map(({ role, content }) => ({ role, content }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendMultiAgentMessage(text, historyForServer, {
        pathname,
        fiestaId,
        agentType: activeAgent,
      });

      setMessages(prev => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: result.response,
          agentName: result.agentName,
          agentType: result.agentType,
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: 'No pude responder ahora. Pasame el error o probá de nuevo.',
          agentName: 'Multiagente AK',
          agentType: 'central',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const quickPrompts = activeAgent === 'fiesta'
    ? ['¿Qué le falta a esta fiesta?', 'Dame riesgos de esta fiesta', 'Qué tengo que hacer hoy']
    : activeAgent === 'contable'
      ? ['Revisá rentabilidad', 'Pagos pendientes', 'Qué fiesta está floja']
      : activeAgent === 'marketing'
        ? ['Haceme un post', 'Ideas para historias', 'WhatsApp para vender']
        : ['Qué tengo pendiente hoy', 'A quién tengo que llamar', 'Resumen rápido'];

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-red-600 text-white shadow-2xl shadow-red-900/30 hover:bg-red-700 print:hidden"
        aria-label="Abrir Multiagente AK"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/25 p-3 print:hidden sm:p-5">
          <Card className="h-[82vh] w-full max-w-md overflow-hidden rounded-3xl border-red-100 bg-white shadow-2xl">
            <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-600 to-red-800 p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/15 p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black">{style.label}</CardTitle>
                    <p className="text-xs text-red-50">Nuevo Multiagente AK</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-white hover:bg-white/15" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="bg-white text-red-700 hover:bg-white">{style.badge}</Badge>
                {fiestaId && <Badge className="bg-white/15 text-white hover:bg-white/15">Fiesta detectada</Badge>}
              </div>
            </CardHeader>

            <CardContent className="flex h-[calc(82vh-92px)] flex-col p-0">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm text-slate-700">
                    <p className="font-bold text-slate-900">Estoy listo.</p>
                    <p className="mt-1">Este es el nuevo Multiagente AK. Según dónde estés, responde como secretaria, fiesta, contable, marketing o comercial.</p>
                  </div>
                )}

                {messages.map(message => (
                  <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-6',
                      message.role === 'user'
                        ? 'bg-red-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-800 shadow-sm'
                    )}>
                      {message.role === 'assistant' && message.agentName && (
                        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-red-600">{message.agentName}</p>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="border-t border-slate-100 p-3">
                <div className="mb-2 flex flex-wrap gap-2">
                  {quickPrompts.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    placeholder="Decime qué necesitás..."
                    className="min-h-[44px] resize-none rounded-2xl"
                    onKeyDown={event => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button onClick={() => handleSend()} disabled={isSending || !input.trim()} className="h-auto rounded-2xl bg-red-600 hover:bg-red-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
