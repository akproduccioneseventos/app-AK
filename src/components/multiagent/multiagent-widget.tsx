'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  Bot,
  Brain,
  CalendarCheck,
  DollarSign,
  GripVertical,
  Loader2,
  Megaphone,
  MessageSquare,
  PartyPopper,
  Send,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AkAgentType, AkMultiAgentMessage } from '@/types/multiagent';

type ChatMessage = AkMultiAgentMessage & {
  id: string;
  agentName?: string;
  agentType?: AkAgentType;
  fiestaId?: string;
  pathname?: string;
};

type AgentStyle = {
  label: string;
  icon: LucideIcon;
  badge: string;
  short: string;
  description: string;
};

type DockSide = 'left' | 'right';
type DockPosition = { x: number; y: number };
type SessionMap = Record<string, string>;

const HISTORY_STORAGE_KEY = 'ak-multiagent-history-v2';
const SESSION_STORAGE_KEY = 'ak-multiagent-sessions-v1';
const SIDE_STORAGE_KEY = 'ak-multiagent-dock-side';
const POSITION_STORAGE_KEY = 'ak-multiagent-dock-position-v1';
const DOCK_WIDTH = 112;
const DOCK_HEIGHT = 56;
const DOCK_MARGIN = 16;

const AGENT_STYLE: Record<AkAgentType, AgentStyle> = {
  central: { label: 'Encargado General AK', icon: Bot, badge: 'App completa', short: 'AK', description: 'Control general de la aplicacion' },
  fiestas_general: { label: 'Supervisor General de Fiestas', icon: Brain, badge: 'Todas las fiestas', short: 'FIS', description: 'Control de eventos y planificacion' },
  fiesta: { label: 'Agente de esta Fiesta', icon: PartyPopper, badge: 'Fiesta actual', short: 'FIE', description: 'Control de la fiesta abierta' },
  secretaria: { label: 'Secretaria AK', icon: CalendarCheck, badge: 'Agenda', short: 'SEC', description: 'Agenda, llamadas y recordatorios' },
  comercial: { label: 'Agente Comercial AK', icon: MessageSquare, badge: 'Ventas', short: 'COM', description: 'Leads, presupuestos y seguimiento' },
  contable: { label: 'Agente Contable AK', icon: DollarSign, badge: 'Pagos', short: 'CON', description: 'Pagos, saldos y rentabilidad' },
  marketing: { label: 'Agente Marketing AK', icon: Megaphone, badge: 'Contenido', short: 'MKT', description: 'Redes, publicaciones y campanas' },
};

const AREA_AGENT_GROUPS: Record<AkAgentType, AkAgentType[]> = {
  fiesta: ['fiesta', 'fiestas_general', 'secretaria', 'contable', 'marketing', 'central'],
  fiestas_general: ['fiestas_general', 'fiesta', 'secretaria', 'contable', 'central'],
  contable: ['contable', 'comercial', 'fiestas_general', 'secretaria', 'central'],
  comercial: ['comercial', 'secretaria', 'contable', 'marketing', 'central'],
  marketing: ['marketing', 'comercial', 'fiestas_general', 'central'],
  secretaria: ['secretaria', 'fiestas_general', 'comercial', 'contable', 'central'],
  central: ['central', 'fiestas_general', 'secretaria'],
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

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
  const pathId = match?.[1];
  return pathId && pathId !== 'nueva' ? pathId : undefined;
}

function uniqueAgents(agents: AkAgentType[]) {
  return agents.filter((agent, index) => agents.indexOf(agent) === index);
}

function buildVisibleAgents(suggestedAgent: AkAgentType, fiestaId?: string) {
  const base = AREA_AGENT_GROUPS[suggestedAgent] || AREA_AGENT_GROUPS.central;
  const required: AkAgentType[] = fiestaId ? ['fiesta', 'fiestas_general', 'central'] : ['central'];
  return uniqueAgents([...base, ...required]);
}

function buildSessionKey(agentType: AkAgentType, pathname: string, fiestaId?: string) {
  return `${agentType}:${fiestaId || pathname || 'global'}`;
}

function clampPosition(position: DockPosition): DockPosition {
  if (typeof window === 'undefined') return position;
  const maxX = Math.max(DOCK_MARGIN, window.innerWidth - DOCK_WIDTH - DOCK_MARGIN);
  const maxY = Math.max(DOCK_MARGIN, window.innerHeight - DOCK_HEIGHT - DOCK_MARGIN);
  return {
    x: Math.min(Math.max(position.x, DOCK_MARGIN), maxX),
    y: Math.min(Math.max(position.y, DOCK_MARGIN), maxY),
  };
}

function getDefaultDockPosition(side: DockSide): DockPosition {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return clampPosition({
    x: side === 'left' ? DOCK_MARGIN : window.innerWidth - DOCK_WIDTH - DOCK_MARGIN,
    y: window.innerHeight - DOCK_HEIGHT - DOCK_MARGIN,
  });
}

export function MultiAgentWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fiestaId, setFiestaId] = useState<string | undefined>(undefined);
  const [dockSide, setDockSide] = useState<DockSide>(() => readStorage<DockSide>(SIDE_STORAGE_KEY, 'right'));
  const [dockPosition, setDockPosition] = useState<DockPosition | null>(null);
  const [sessionIds, setSessionIds] = useState<SessionMap>(() => readStorage<SessionMap>(SESSION_STORAGE_KEY, {}));
  const [activeAgent, setActiveAgent] = useState<AkAgentType>(() => detectVisibleAgent(typeof window === 'undefined' ? '' : window.location.pathname));
  const [messages, setMessages] = useState<ChatMessage[]>(() => readStorage<ChatMessage[]>(HISTORY_STORAGE_KEY, []));
  const endRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; startPosition: DockPosition; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const suggestedAgent = useMemo(() => detectVisibleAgent(pathname || ''), [pathname]);
  const visibleAgents = useMemo(() => buildVisibleAgents(suggestedAgent, fiestaId), [suggestedAgent, fiestaId]);
  const sessionKey = useMemo(() => buildSessionKey(activeAgent, pathname || '', fiestaId), [activeAgent, pathname, fiestaId]);
  const visibleMessages = useMemo(() => {
    return messages.filter(message => {
      if (message.agentType && message.agentType !== activeAgent) return false;
      if (fiestaId && message.fiestaId && message.fiestaId !== fiestaId) return false;
      return true;
    });
  }, [activeAgent, fiestaId, messages]);
  const style = AGENT_STYLE[activeAgent];
  const Icon = style.icon;

  useEffect(() => {
    const nextFiestaId = getFiestaIdFromLocation();
    setFiestaId(nextFiestaId);
    setActiveAgent(detectVisibleAgent(pathname || ''));
  }, [pathname]);

  useEffect(() => {
    const savedPosition = readStorage<DockPosition | null>(POSITION_STORAGE_KEY, null);
    setDockPosition(clampPosition(savedPosition || getDefaultDockPosition(dockSide)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messages.slice(-80)));
    } catch {
      // No frena el uso del multiagente si el navegador bloquea storage.
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionIds));
      localStorage.setItem(SIDE_STORAGE_KEY, JSON.stringify(dockSide));
      if (dockPosition) localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(dockPosition));
    } catch {
      // No frena el uso del multiagente si el navegador bloquea storage.
    }
  }, [dockPosition, dockSide, sessionIds]);

  useEffect(() => {
    function handleResize() {
      setDockPosition(prev => prev ? clampPosition(prev) : getDefaultDockPosition(dockSide));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dockSide]);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, isOpen, isSending]);

  function setSide(side: DockSide) {
    setDockSide(side);
    setDockPosition(prev => {
      const next = prev || getDefaultDockPosition(side);
      return clampPosition({
        ...next,
        x: side === 'left' ? DOCK_MARGIN : window.innerWidth - DOCK_WIDTH - DOCK_MARGIN,
      });
    });
  }

  function toggleSide() {
    setSide(dockSide === 'right' ? 'left' : 'right');
  }

  function openAgent(agent: AkAgentType) {
    setActiveAgent(agent);
    setIsOpen(true);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const currentPosition = dockPosition || getDefaultDockPosition(dockSide);
    dragRef.current = { x: event.clientX, y: event.clientY, startPosition: currentPosition, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = dragRef.current;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      start.moved = true;
      const nextPosition = clampPosition({
        x: start.startPosition.x + deltaX,
        y: start.startPosition.y + deltaY,
      });
      setDockPosition(nextPosition);
      setDockSide(nextPosition.x < window.innerWidth / 2 ? 'left' : 'right');
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start?.moved || typeof window === 'undefined') return;

    suppressClickRef.current = true;
    setDockPosition(prev => clampPosition(prev || getDefaultDockPosition(dockSide)));
    setDockSide(event.clientX < window.innerWidth / 2 ? 'left' : 'right');
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  function handleFabClick() {
    if (suppressClickRef.current) return;
    setIsOpen(prev => !prev);
  }

  async function handleSend(override?: string) {
    const text = (override ?? input).trim();
    if (!text || isSending) return;

    const currentSessionKey = sessionKey;
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      agentType: activeAgent,
      fiestaId,
      pathname: pathname || undefined,
    };

    const historyForServer = [...visibleMessages, userMessage]
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendPersistentMultiAgentMessage({
        message: text,
        history: historyForServer,
        pathname,
        fiestaId,
        agentType: activeAgent,
        sessionId: sessionIds[currentSessionKey],
      });

      if (result.sessionId) {
        setSessionIds(prev => ({ ...prev, [currentSessionKey]: result.sessionId! }));
      }

      setMessages(prev => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: result.response,
          agentName: result.agentName,
          agentType: result.agentType,
          fiestaId,
          pathname: pathname || undefined,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: 'No pude responder ahora. No marque nada como hecho.',
          agentName: style.label,
          agentType: activeAgent,
          fiestaId,
          pathname: pathname || undefined,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const quickPrompts = activeAgent === 'fiesta'
    ? ['Que le falta a esta fiesta', 'Que esta para revisar', 'Que hago hoy']
    : activeAgent === 'fiestas_general'
      ? ['Revisa todas las fiestas', 'Prioridades generales', 'Fiestas atrasadas']
      : activeAgent === 'contable'
        ? ['Pagos pendientes', 'Saldos a revisar', 'Rentabilidad']
        : activeAgent === 'marketing'
          ? ['Haceme un post', 'Ideas para historias', 'WhatsApp para vender']
          : activeAgent === 'comercial'
            ? ['Leads pendientes', 'Presupuestos sin respuesta', 'Mensaje para cerrar']
            : activeAgent === 'secretaria'
              ? ['Que tengo pendiente hoy', 'Crear recordatorio', 'A quien llamo']
              : ['Revisa la app', 'Que esta mas urgente', 'Resumen general'];

  const fallbackPosition = dockSide === 'left' ? 'left-3 sm:left-5' : 'right-3 sm:right-5';
  const cardAlignment = dockSide === 'left' ? 'left-0' : 'right-0';
  const sideButtonTitle = dockSide === 'left' ? 'Mover asistente a la derecha' : 'Mover asistente a la izquierda';

  return (
    <div
      className={cn('fixed bottom-5 z-[70] print:hidden', !dockPosition && fallbackPosition)}
      style={dockPosition ? { left: dockPosition.x, top: dockPosition.y, bottom: 'auto' } : undefined}
    >
      {isOpen && (
        <Card className={cn('absolute bottom-20 flex h-[min(78vh,680px)] w-[calc(100vw-1.5rem)] max-w-[430px] flex-col overflow-hidden rounded-2xl border-slate-200 bg-white shadow-2xl', cardAlignment)}>
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-800 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="truncate text-base font-black">{style.label}</CardTitle>
                  <p className="truncate text-xs text-indigo-50">{style.description}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 rounded-full text-white hover:bg-white/15" onClick={() => setIsOpen(false)} title="Cerrar chat">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-white text-indigo-700 hover:bg-white">{style.badge}</Badge>
              {suggestedAgent === activeAgent && <Badge className="bg-white/15 text-white hover:bg-white/15">Especialista de pantalla</Badge>}
              {fiestaId && <Badge className="bg-white/15 text-white hover:bg-white/15">Fiesta detectada</Badge>}
              <Badge className="bg-white/15 text-white hover:bg-white/15">Manual + memoria</Badge>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {visibleAgents.map(agent => {
                const item = AGENT_STYLE[agent];
                const AgentIcon = item.icon;
                const active = activeAgent === agent;
                return (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => openAgent(agent)}
                    title={`${item.label} - ${item.description}`}
                    className={cn(
                      'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-black transition',
                      active
                        ? 'border-white bg-white text-indigo-700'
                        : 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                    )}
                  >
                    <AgentIcon className="h-3.5 w-3.5" />
                    {item.short}
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {visibleMessages.length === 0 && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-6 text-slate-700">
                  <p className="font-bold text-slate-950">{style.label} listo.</p>
                  <p className="mt-1">Estoy usando el manual AK, la memoria del agente y los datos reales visibles de este modulo.</p>
                </div>
              )}

              {visibleMessages.map(message => (
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
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="h-8 shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
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
                <Button onClick={() => handleSend()} disabled={isSending || !input.trim()} className="h-auto rounded-2xl bg-slate-900 hover:bg-indigo-700" title="Enviar">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={cn('flex items-center gap-2', dockSide === 'right' && 'flex-row-reverse')}>
        <button
          type="button"
          aria-label="Abrir Asistente AK"
          title="Abrir Asistente AK. Arrastralo para dejarlo donde no moleste."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleFabClick}
          className="group relative flex h-14 w-14 touch-none items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/25 ring-4 ring-white transition hover:scale-105 hover:bg-indigo-700"
        >
          <Icon className="h-6 w-6" />
          <GripVertical className="absolute h-4 w-4 translate-x-5 translate-y-4 opacity-70 transition group-hover:opacity-100" />
        </button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={toggleSide}
          title={sideButtonTitle}
          className="h-10 w-10 rounded-full border-slate-200 bg-white text-indigo-700 shadow-xl hover:bg-indigo-50"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
