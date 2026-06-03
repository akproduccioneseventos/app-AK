'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { getSession } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  Bot,
  Brain,
  CalendarCheck,
  DollarSign,
  Loader2,
  Megaphone,
  MessageSquare,
  PartyPopper,
  Send,
  Sparkles,
  Trash2,
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
  color: string;
};

type DockSide = 'left' | 'right';
type DockPosition = { x: number; y: number };
type SessionMap = Record<string, string>;

const HISTORY_STORAGE_KEY = 'ak-multiagent-history-v3';
const SESSION_STORAGE_KEY = 'ak-multiagent-sessions-v1';
const SIDE_STORAGE_KEY = 'ak-multiagent-dock-side';
const POSITION_STORAGE_KEY = 'ak-multiagent-dock-position-v2';
const FAB_SIZE = 60;
const DOCK_MARGIN = 16;

const AGENT_STYLE: Record<AkAgentType, AgentStyle> = {
  central:        { label: 'Encargado General AK',       icon: Bot,          badge: 'App completa',    short: 'AK',  description: 'Control general de la aplicacion', color: 'from-slate-800 to-indigo-900' },
  fiestas_general:{ label: 'Supervisor de Fiestas',      icon: Brain,        badge: 'Todas las fiestas',short: 'FIS', description: 'Control de eventos y planificacion', color: 'from-violet-800 to-indigo-900' },
  fiesta:         { label: 'Agente de esta Fiesta',      icon: PartyPopper,  badge: 'Fiesta actual',   short: 'FIE', description: 'Control de la fiesta abierta', color: 'from-pink-800 to-rose-900' },
  secretaria:     { label: 'Secretaria AK',              icon: CalendarCheck,badge: 'Agenda',           short: 'SEC', description: 'Agenda, llamadas y recordatorios', color: 'from-teal-800 to-cyan-900' },
  comercial:      { label: 'Agente Comercial AK',        icon: MessageSquare,badge: 'Ventas',           short: 'COM', description: 'Leads, presupuestos y seguimiento', color: 'from-sky-800 to-blue-900' },
  contable:       { label: 'Agente Contable AK',         icon: DollarSign,   badge: 'Pagos',            short: 'CON', description: 'Pagos, saldos y rentabilidad', color: 'from-emerald-800 to-green-900' },
  marketing:      { label: 'Agente Marketing AK',        icon: Megaphone,    badge: 'Contenido',        short: 'MKT', description: 'Redes, publicaciones y campanas', color: 'from-orange-800 to-amber-900' },
};

const AREA_AGENT_GROUPS: Record<AkAgentType, AkAgentType[]> = {
  fiesta:         ['fiesta', 'fiestas_general', 'secretaria', 'contable', 'marketing', 'central'],
  fiestas_general:['fiestas_general', 'fiesta', 'secretaria', 'contable', 'central'],
  contable:       ['contable', 'comercial', 'fiestas_general', 'secretaria', 'central'],
  comercial:      ['comercial', 'secretaria', 'contable', 'marketing', 'central'],
  marketing:      ['marketing', 'comercial', 'fiestas_general', 'central'],
  secretaria:     ['secretaria', 'fiestas_general', 'comercial', 'contable', 'central'],
  central:        ['central', 'fiestas_general', 'secretaria'],
};

const QUICK_PROMPTS: Record<AkAgentType, string[]> = {
  fiesta:         ['¿Qué le falta a esta fiesta?', '¿Qué está para revisar?', '¿Qué hago hoy?'],
  fiestas_general:['Revisar todas las fiestas', 'Prioridades generales', 'Fiestas atrasadas'],
  contable:       ['Pagos pendientes', 'Saldos a revisar', 'Rentabilidad del mes'],
  marketing:      ['Haceme un post', 'Ideas para historias', 'WhatsApp para vender'],
  comercial:      ['Leads pendientes', 'Presupuestos sin respuesta', 'Mensaje para cerrar'],
  secretaria:     ['¿Qué tengo pendiente hoy?', 'Crear recordatorio', '¿A quién llamo?'],
  central:        ['Revisar la app', '¿Qué está más urgente?', 'Resumen general'],
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

function clampPosition(x: number, y: number): DockPosition {
  if (typeof window === 'undefined') return { x, y };
  return {
    x: Math.min(Math.max(x, DOCK_MARGIN), window.innerWidth  - FAB_SIZE - DOCK_MARGIN),
    y: Math.min(Math.max(y, DOCK_MARGIN), window.innerHeight - FAB_SIZE - DOCK_MARGIN),
  };
}

function getDefaultPosition(side: DockSide): DockPosition {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return clampPosition(
    side === 'left' ? DOCK_MARGIN : window.innerWidth - FAB_SIZE - DOCK_MARGIN,
    window.innerHeight - FAB_SIZE - DOCK_MARGIN - 80,
  );
}

export function MultiAgentWidget() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen]         = useState(false);
  const [input, setInput]           = useState('');
  const [isSending, setIsSending]   = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fiestaId, setFiestaId]     = useState<string | undefined>(undefined);
  const [dockSide, setDockSide]     = useState<DockSide>(() => readStorage<DockSide>(SIDE_STORAGE_KEY, 'right'));
  const [position, setPosition]     = useState<DockPosition | null>(null);
  const [sessionIds, setSessionIds] = useState<SessionMap>(() => readStorage<SessionMap>(SESSION_STORAGE_KEY, {}));
  const [activeAgent, setActiveAgent] = useState<AkAgentType>(
    () => detectVisibleAgent(typeof window === 'undefined' ? '' : window.location.pathname)
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => readStorage<ChatMessage[]>(HISTORY_STORAGE_KEY, [])
  );

  // Solo mostrar el widget si hay sesión activa (usuario autenticado)
  useEffect(() => {
    setIsAuthenticated(!!getSession());
  }, [pathname]);

  const endRef     = useRef<HTMLDivElement>(null);
  const dragRef    = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; moved: boolean } | null>(null);
  const clickGuard = useRef(false);

  const suggestedAgent  = useMemo(() => detectVisibleAgent(pathname || ''), [pathname]);
  const visibleAgents   = useMemo(() => buildVisibleAgents(suggestedAgent, fiestaId), [suggestedAgent, fiestaId]);
  const sessionKey      = useMemo(() => buildSessionKey(activeAgent, pathname || '', fiestaId), [activeAgent, pathname, fiestaId]);
  const visibleMessages = useMemo(() => messages.filter(m => {
    if (m.agentType && m.agentType !== activeAgent) return false;
    if (fiestaId && m.fiestaId && m.fiestaId !== fiestaId) return false;
    return true;
  }), [activeAgent, fiestaId, messages]);

  const style = AGENT_STYLE[activeAgent];
  const Icon  = style.icon;

  // Init position once on mount
  useEffect(() => {
    const saved = readStorage<DockPosition | null>(POSITION_STORAGE_KEY, null);
    setPosition(saved ? clampPosition(saved.x, saved.y) : getDefaultPosition(dockSide));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync route → agent & fiestaId
  useEffect(() => {
    setFiestaId(getFiestaIdFromLocation());
    setActiveAgent(detectVisibleAgent(pathname || ''));
  }, [pathname]);

  // Persist messages
  useEffect(() => {
    try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messages.slice(-80))); } catch { /* ignore */ }
  }, [messages]);

  // Persist dock state
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionIds));
      localStorage.setItem(SIDE_STORAGE_KEY, dockSide);
      if (position) localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    } catch { /* ignore */ }
  }, [position, dockSide, sessionIds]);

  // Clamp on resize
  useEffect(() => {
    function onResize() {
      setPosition(prev => prev ? clampPosition(prev.x, prev.y) : getDefaultPosition(dockSide));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [dockSide]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, isOpen, isSending]);

  /* ── Drag handlers ─────────────────────────────────────── */
  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    const pos = position || getDefaultPosition(dockSide);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    setIsDragging(true);
    const next = clampPosition(d.startPosX + dx, d.startPosY + dy);
    setPosition(next);
    setDockSide(next.x < window.innerWidth / 2 ? 'left' : 'right');
  }

  function onPointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);
    if (!d?.moved) return;
    clickGuard.current = true;
    const next = clampPosition(e.clientX, e.clientY);
    setDockSide(next.x < window.innerWidth / 2 ? 'left' : 'right');
    requestAnimationFrame(() => { clickGuard.current = false; });
  }

  function onFabClick() {
    if (clickGuard.current) return;
    setIsOpen(prev => !prev);
  }

  /* ── Actions ────────────────────────────────────────────── */
  function toggleSide() {
    const side: DockSide = dockSide === 'right' ? 'left' : 'right';
    setDockSide(side);
    setPosition(getDefaultPosition(side));
  }

  function openAgent(agent: AkAgentType) {
    setActiveAgent(agent);
    setIsOpen(true);
  }

  function clearHistory() {
    setMessages(prev => prev.filter(m => m.agentType !== activeAgent));
  }

  async function handleSend(override?: string) {
    const text = (override ?? input).trim();
    if (!text || isSending) return;

    const currentSessionKey = sessionKey;
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      agentType: activeAgent,
      fiestaId,
      pathname: pathname || undefined,
    };

    const historyForServer = [...visibleMessages, userMsg]
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    setMessages(prev => [...prev, userMsg]);
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
          id: `asst_${Date.now()}`,
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
          id: `asst_err_${Date.now()}`,
          role: 'assistant',
          content: 'No pude responder ahora. No marqué nada como hecho.',
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

  /* ── Chat panel alignment ───────────────────────────────── */
  const cardAlign = dockSide === 'left' ? 'left-0' : 'right-0';

  /* ── Render ─────────────────────────────────────────────── */
  if (!isAuthenticated || !position) return null;


  return (
    <div
      className="fixed z-[70] print:hidden"
      style={{ left: position.x, top: position.y }}
    >
      {/* ── Chat panel ── */}
      {isOpen && (
        <Card
          className={cn(
            'absolute bottom-[72px] flex h-[min(78vh,660px)] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl border-0 bg-white shadow-2xl',
            cardAlign,
          )}
        >
          {/* Header */}
          <CardHeader className={cn('border-b border-white/10 bg-gradient-to-br p-4 text-white', style.color)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="truncate text-[15px] font-black leading-tight">{style.label}</CardTitle>
                  <p className="truncate text-[11px] text-white/70">{style.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={toggleSide}
                  title={dockSide === 'right' ? 'Mover a la izquierda' : 'Mover a la derecha'}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={clearHistory}
                  title="Limpiar historial de este agente"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Cerrar"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge className="bg-white/20 text-white hover:bg-white/20 text-[10px]">{style.badge}</Badge>
              {suggestedAgent === activeAgent && (
                <Badge className="bg-white/20 text-white hover:bg-white/20 text-[10px]">Especialista de pantalla</Badge>
              )}
              {fiestaId && (
                <Badge className="bg-white/20 text-white hover:bg-white/20 text-[10px]">Fiesta detectada</Badge>
              )}
            </div>

            {/* Agent selector tabs */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {visibleAgents.map(agent => {
                const s = AGENT_STYLE[agent];
                const AgentIcon = s.icon;
                const active = activeAgent === agent;
                return (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => openAgent(agent)}
                    title={`${s.label} — ${s.description}`}
                    className={cn(
                      'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold transition',
                      active
                        ? 'border-white bg-white text-slate-900'
                        : 'border-white/25 bg-white/10 text-white hover:bg-white/25',
                    )}
                  >
                    <AgentIcon className="h-3 w-3" />
                    {s.short}
                  </button>
                );
              })}
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {visibleMessages.length === 0 && (
                <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <div className="mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <span className="font-bold text-slate-900">{style.label} listo.</span>
                  </div>
                  <p className="text-xs text-slate-500">Usando manual AK, memoria del agente y datos del módulo actual.</p>
                </div>
              )}

              {visibleMessages.map(message => (
                <div
                  key={message.id}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6',
                      message.role === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-100 bg-white text-slate-800 shadow-sm',
                    )}
                  >
                    {message.role === 'assistant' && message.agentName && (
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
                        {message.agentName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5 text-[13px] text-slate-400 shadow-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {QUICK_PROMPTS[activeAgent].map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="h-7 shrink-0 rounded-full border border-indigo-100 bg-white px-3 text-[11px] font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Hablar con ${style.short}...`}
                  className="min-h-[44px] resize-none rounded-xl border-slate-200 bg-white text-[13px] shadow-sm focus-visible:ring-indigo-400"
                  rows={1}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={isSending || !input.trim()}
                  className="h-auto shrink-0 rounded-xl bg-slate-900 px-3 hover:bg-indigo-700 disabled:opacity-40"
                  title="Enviar"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Single FAB ── */}
      <button
        type="button"
        aria-label="Abrir Asistente IA AK"
        title="Asistente IA AK — arrastrá para reposicionar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onFabClick}
        className={cn(
          'group relative flex h-[60px] w-[60px] touch-none select-none items-center justify-center rounded-full text-white shadow-2xl shadow-black/30 ring-4 ring-white/90 transition-all duration-150',
          'bg-gradient-to-br from-slate-800 to-indigo-800',
          isDragging
            ? 'scale-110 cursor-grabbing shadow-black/50'
            : 'cursor-grab hover:scale-105 hover:from-indigo-700 hover:to-violet-800 active:scale-95',
          isOpen && !isDragging && 'ring-indigo-400/60',
        )}
      >
        <Icon className={cn('h-6 w-6 transition-transform duration-200', isDragging && 'scale-90')} />

        {/* Pulse ring when closed */}
        {!isOpen && !isDragging && (
          <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/30" />
        )}
      </button>
    </div>
  );
}
