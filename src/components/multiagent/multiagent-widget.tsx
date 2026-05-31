'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, Brain, CalendarCheck, DollarSign, Loader2, Megaphone, MessageSquare, PartyPopper, Send, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

type AgentStyle = {
  label: string;
  icon: LucideIcon;
  badge: string;
  short: string;
  description: string;
};

const AGENT_STYLE: Record<AkAgentType, AgentStyle> = {
  central: { label: 'Encargado General AK', icon: Bot, badge: 'App completa', short: 'AK', description: 'Control general de la aplicación' },
  fiestas_general: { label: 'Supervisor General de Fiestas', icon: Brain, badge: 'Todas las fiestas', short: 'FIS', description: 'Control de eventos y planificación' },
  fiesta: { label: 'Agente de esta Fiesta', icon: PartyPopper, badge: 'Fiesta actual', short: 'FIE', description: 'Control de la fiesta abierta' },
  secretaria: { label: 'Secretaria AK', icon: CalendarCheck, badge: 'Agenda', short: 'SEC', description: 'Agenda, llamadas y recordatorios' },
  comercial: { label: 'Agente Comercial AK', icon: MessageSquare, badge: 'Ventas', short: 'COM', description: 'Leads, presupuestos y seguimiento' },
  contable: { label: 'Agente Contable AK', icon: DollarSign, badge: 'Pagos', short: 'CON', description: 'Pagos, saldos y rentabilidad' },
  marketing: { label: 'Agente Marketing AK', icon: Megaphone, badge: 'Contenido', short: 'MKT', description: 'Redes, publicaciones y campañas' },
};

const AREA_AGENT_GROUPS: Record<string, AkAgentType[]> = {
  fiesta: ['fiesta', 'fiestas_general', 'secretaria', 'contable', 'central'],
  fiestas_general: ['fiestas_general', 'fiesta', 'secretaria', 'contable', 'central'],
  contable: ['contable', 'comercial', 'secretaria', 'central'],
  comercial: ['comercial', 'secretaria', 'contable', 'marketing', 'central'],
  marketing: ['marketing', 'comercial', 'central'],
  secretaria: ['secretaria', 'fiestas_general', 'comercial', 'contable', 'central'],
  central: ['central', 'secretaria', 'fiestas_general'],
};

function detectVisibleAgent(pathname: string): AkAgentType {
  if (pathname.startsWith('/fiestas/nueva') || /^\/fiestas\/[^/]+/.test(pathname) || pathname.includes('/evento/')) return 'fiesta';
  if (pathname.includes('/eventos') || pathname.includes('/calendario')) return 'fiestas_general';
  if (pathname.includes('/plan-pagos') || pathname.includes('/empresa/contabilidad') || pathname.includes('/invoices') || pathname.includes('/pagos')) return 'contable';
  if (pathname.includes('/marketing') || pathname.includes('/empresa/redes-sociales') || pathname.includes('/galeria') || pathname.includes('/portfolio')) return 'marketing';
  if (pathname.includes('/contabilidad/crm') || pathname.includes('/presupuestos') || pathname.includes('/simulador')) return 'comercial';
  if (pathname.includes('/settings/google-workspace') || pathname.includes('/reuniones')) return 'secretaria';
  return 'central';
}

function getFiestaIdFromLocation(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('fiestaId');
  if (fromQuery) return fromQuery;
  const match = window.location.pathname.match(/\/fiestas\/([^/]+)/);
  return match?.[1];
}

export function MultiAgentWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fiestaId, setFiestaId] = useState<string | undefined>(undefined);
  const [activeAgent, setActiveAgent] = useState<AkAgentType>(() => detectVisibleAgent(typeof window === 'undefined' ? '' : window.location.pathname));
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

  const suggestedAgent = useMemo(() => detectVisibleAgent(pathname || ''), [pathname]);
  const visibleAgents = useMemo(() => AREA_AGENT_GROUPS[suggestedAgent] || AREA_AGENT_GROUPS.central, [suggestedAgent]);
  const style = AGENT_STYLE[activeAgent];
  const Icon = style.icon;

  useEffect(() => {
    setFiestaId(getFiestaIdFromLocation());
    setActiveAgent(detectVisibleAgent(pathname || ''));
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem('ak-multiagent-history', JSON.stringify(messages.slice(-60)));
    } catch {
      // No frena el uso del multiagente si el navegador bloquea storage.
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isSending]);

  function openAgent(agent: AkAgentType) {
    setActiveAgent(agent);
    setIsOpen(true);
  }

  async function handleSend(override?: string) {
    const text = (override ?? input).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      agentType: activeAgent,
    };

    const historyForServer = [...messages, userMessage]
      .filter(message => !message.agentType || message.agentType === activeAgent)
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

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
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: 'No pude responder ahora. No marqué nada como hecho.',
          agentName: style.label,
          agentType: activeAgent,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const quickPrompts = activeAgent === 'fiesta'
    ? ['Qué le falta a esta fiesta', 'Qué está para revisar', 'Qué hago hoy']
    : activeAgent === 'fiestas_general'
      ? ['Revisá todas las fiestas', 'Prioridades generales', 'Fiestas atrasadas']
      : activeAgent === 'contable'
        ? ['Pagos pendientes', 'Saldos a revisar', 'Rentabilidad']
        : activeAgent === 'marketing'
          ? ['Haceme un post', 'Ideas para historias', 'WhatsApp para vender']
          : activeAgent === 'comercial'
            ? ['Leads pendientes', 'Presupuestos sin respuesta', 'Mensaje para cerrar']
            : activeAgent === 'secretaria'
              ? ['Qué tengo pendiente hoy', 'Crear recordatorio', 'A quién llamo']
              : ['Revisá la app', 'Qué está más urgente', 'Resumen general'];

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 flex max-h-[60vh] flex-col items-end gap-2 overflow-y-auto print:hidden sm:bottom-6 sm:right-6">
        {visibleAgents.map(agent => {
          const item = AGENT_STYLE[agent];
          const active = activeAgent === agent;
          const ItemIcon = item.icon;
          return (
            <button
              key={agent}
              type="button"
              onClick={() => openAgent(agent)}
              title={`${item.label} - ${item.description}`}
              className={cn('group flex items-center gap-2 rounded-full border bg-white p-1.5 shadow-xl transition-all hover:-translate-x-1', active && 'ring-2 ring-indigo-500')}
            >
              <span className="hidden rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-700 shadow-sm sm:group-hover:inline">
                {item.label}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition-colors group-hover:bg-indigo-700">
                <ItemIcon className="h-5 w-5" />
              </span>
            </button>
          );
        })}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-end bg-black/20 p-3 print:hidden sm:p-5 sm:pr-24">
          <Card className="h-[82vh] w-full max-w-md overflow-hidden rounded-3xl border-slate-200 bg-white shadow-2xl">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-800 p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black">{style.label}</CardTitle>
                    <p className="text-xs text-indigo-50">{style.description}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-white hover:bg-white/15" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="bg-white text-indigo-700 hover:bg-white">{style.badge}</Badge>
                {suggestedAgent === activeAgent && <Badge className="bg-white/15 text-white hover:bg-white/15">Sugerido por pantalla</Badge>}
                {fiestaId && activeAgent === 'fiesta' && <Badge className="bg-white/15 text-white hover:bg-white/15">Fiesta detectada</Badge>}
              </div>
            </CardHeader>

            <CardContent className="flex h-[calc(82vh-108px)] flex-col p-0">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-slate-700">
                    <p className="font-bold text-slate-900">Equipo IA listo.</p>
                    <p className="mt-1">Los agentes visibles cambian según la parte de la app donde estés.</p>
                  </div>
                )}

                {messages.map(message => (
                  <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-6',
                      message.role === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-800 shadow-sm'
                    )}>
                      {message.role === 'assistant' && message.agentName && (
                        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-indigo-600">{message.agentName}</p>
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
                      className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    placeholder={`Hablar con ${style.short}...`}
                    className="min-h-[44px] resize-none rounded-2xl"
                    onKeyDown={event => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button onClick={() => handleSend()} disabled={isSending || !input.trim()} className="h-auto rounded-2xl bg-slate-900 hover:bg-indigo-700">
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
