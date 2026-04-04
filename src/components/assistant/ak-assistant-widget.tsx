'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, CalendarClock, ListChecks, DollarSign, CreditCard, X, ChevronRight, Calendar, FileText, Receipt, Send, Trash2, MessageSquare, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardKpiData, type GlobalAlert } from '@/app/actions/dashboard';
import { sendAssistantMessage } from '@/app/actions/assistant';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function getAlertIcon(type: GlobalAlert['type']) {
  switch (type) {
    case 'meeting':
      return <CalendarClock className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />;
    case 'task':
      return <ListChecks className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    case 'budget':
      return <DollarSign className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
    default:
      return <Sparkles className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />;
  }
}

function getSeverityColor(severity: GlobalAlert['severity']) {
  return severity === 'high' ? 'border-l-rose-400' : 'border-l-amber-300';
}

function formatShortDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

const QUICK_ACTIONS = [
  { label: 'Nuevo Presupuesto', href: '/simulador-de-presupuesto', icon: FileText },
  { label: 'Ver Agenda', href: '/contabilidad/crm/agenda', icon: Calendar },
  { label: 'Ver Facturas', href: '/invoices', icon: Receipt },
];

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
  isError?: boolean;
};

const SUGGESTED_QUESTIONS = [
  '¿Cómo va mi próximo evento?',
  '¿Tengo pagos pendientes?',
  'Resumen del mes',
  '¿Qué tareas tengo para hoy?',
];

export function AKAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumen' | 'chat'>('resumen');

  // Summary tab state
  const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [proximoEvento, setProximoEvento] = useState<{ nombre: string; fecha: string } | null>(null);
  const [presupuestosPendientes, setPresupuestosPendientes] = useState<number>(0);
  const [facturasPorVencer, setFacturasPorVencer] = useState<number>(0);

  // Chat tab state — persists while widget is mounted
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const result = await getDashboardKpiData();
      if (result.success && result.data) {
        setAlerts(result.data.alerts ?? []);
        setProximoEvento(result.data.proximoEvento ?? null);
        setPresupuestosPendientes(result.data.presupuestosPendientes ?? 0);
        setFacturasPorVencer(result.data.facturasPorVencer ?? 0);
      }
    } catch {
      // silent fail – widget is non-critical
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Focus input when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab, isOpen]);

  const handleSendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    const typingMsg: ChatMessage = {
      id: `typing-${Date.now()}`,
      role: 'assistant',
      content: '',
      isTyping: true,
    };

    setChatMessages(prev => [...prev, userMsg, typingMsg]);
    setChatInput('');
    setIsSending(true);

    // Build history (exclude typing indicator)
    const history = chatMessages
      .filter(m => !m.isTyping && !m.isError)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const result = await sendAssistantMessage(trimmed, history);
      setChatMessages(prev =>
        prev.map(m =>
          m.isTyping
            ? { ...m, id: `assistant-${Date.now()}`, content: result.success ? (result.response ?? '') : (result.error ?? 'Error al procesar el mensaje'), isTyping: false, isError: !result.success }
            : m
        )
      );
    } catch (err: any) {
      setChatMessages(prev =>
        prev.map(m =>
          m.isTyping
            ? { ...m, id: `error-${Date.now()}`, content: err.message || 'Error inesperado', isTyping: false, isError: true }
            : m
        )
      );
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatMessages, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(chatInput);
    }
  };

  const greeting = getGreeting();
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const summaryText =
    alerts.length === 0
      ? '¡Todo en orden por ahora! 🎉'
      : highCount > 0
      ? `Tienes ${highCount} ${pluralize(highCount, 'asunto urgente', 'asuntos urgentes')} hoy.`
      : `Tienes ${alerts.length} ${pluralize(alerts.length, 'recordatorio pendiente', 'recordatorios pendientes')}.`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden">
      {/* Panel */}
      {isOpen && (
        <Card className="w-96 shadow-2xl border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white px-4 py-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Asistente AK</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Tab switcher */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <button
              onClick={() => setActiveTab('resumen')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
                activeTab === 'resumen'
                  ? 'text-indigo-700 border-b-2 border-indigo-600 bg-white'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
                activeTab === 'chat'
                  ? 'text-indigo-700 border-b-2 border-indigo-600 bg-white'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat IA
            </button>
          </div>

          {/* Resumen tab */}
          {activeTab === 'resumen' && (
            <CardContent className="p-4 bg-white max-h-[60vh] overflow-y-auto space-y-3">
              {/* Greeting */}
              <div>
                <p className="text-sm font-semibold text-slate-800">{greeting} ✨</p>
                <p className="text-xs text-slate-500 mt-0.5">{summaryText}</p>
              </div>

              {/* Context info */}
              {loaded && !loading && (
                <div className="grid grid-cols-1 gap-1.5">
                  {proximoEvento && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                      <CalendarClock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-indigo-700 truncate">{proximoEvento.nombre}</p>
                        <p className="text-[10px] text-indigo-500">{formatShortDate(proximoEvento.fecha)}</p>
                      </div>
                    </div>
                  )}
                  {presupuestosPendientes > 0 && (
                    <Link href="/presupuestos" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
                      <DollarSign className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <p className="text-[11px] text-amber-700 font-medium">
                        {presupuestosPendientes} {pluralize(presupuestosPendientes, 'presupuesto pendiente', 'presupuestos pendientes')} de respuesta
                      </p>
                    </Link>
                  )}
                  {facturasPorVencer > 0 && (
                    <Link href="/invoices" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors">
                      <CreditCard className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <p className="text-[11px] text-rose-700 font-medium">
                        {facturasPorVencer} {pluralize(facturasPorVencer, 'factura vence', 'facturas vencen')} en los próximos 7 días
                      </p>
                    </Link>
                  )}
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="flex items-center justify-center py-6 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-xs">Cargando resumen…</span>
                </div>
              )}

              {/* Alert list */}
              {!loading && alerts.length === 0 && loaded && (
                <p className="text-xs text-slate-400 text-center py-4">No hay alertas pendientes.</p>
              )}

              {!loading && alerts.length > 0 && (
                <ul className="space-y-2">
                  {alerts.map((alert) => (
                    <li key={alert.id}>
                      <Link
                        href={alert.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-start gap-2 p-2.5 rounded-xl border-l-4 bg-slate-50 hover:bg-slate-100 transition-colors group',
                          getSeverityColor(alert.severity)
                        )}
                      >
                        {getAlertIcon(alert.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 leading-tight truncate">{alert.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{alert.description}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 mt-0.5 transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Separator */}
              <div className="border-t border-slate-100 pt-1" />

              {/* Quick Actions */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Acciones rápidas</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-colors text-center group"
                    >
                      <Icon className="h-4 w-4 text-indigo-500 group-hover:text-indigo-600" />
                      <span className="text-[10px] text-slate-600 group-hover:text-indigo-700 leading-tight font-medium">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          )}

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col bg-white" style={{ height: '420px' }}>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <div className="p-3 rounded-full bg-indigo-50">
                      <Sparkles className="h-6 w-6 text-indigo-500" />
                    </div>
                    <p className="text-xs text-slate-500 text-center px-4">
                      Hola 👋 Soy el Asistente AK. Podés preguntarme lo que quieras sobre tu negocio.
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center px-2">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSendMessage(q)}
                          disabled={isSending}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex gap-2',
                          msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="shrink-0 mt-0.5">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : msg.isError
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 rounded-bl-sm'
                              : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                          )}
                        >
                          {msg.isTyping ? (
                            <span className="flex gap-1 items-center py-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                            </span>
                          ) : (
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Clear chat button (only when there are messages) */}
              {chatMessages.length > 0 && (
                <div className="px-3 pb-1 flex justify-end">
                  <button
                    onClick={() => setChatMessages([])}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Limpiar chat
                  </button>
                </div>
              )}

              {/* Input area */}
              <div className="border-t border-slate-100 px-3 py-2.5 flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregúntale algo al Asistente AK..."
                  disabled={isSending}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 focus:bg-white transition-colors placeholder:text-slate-400 disabled:opacity-60"
                />
                <Button
                  size="icon"
                  disabled={!chatInput.trim() || isSending}
                  onClick={() => handleSendMessage(chatInput)}
                  className="h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 disabled:opacity-50"
                  aria-label="Enviar mensaje"
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Floating trigger button */}
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white border-0 relative flex flex-col items-center justify-center gap-0',
          !isOpen && highCount > 0 && 'animate-pulse'
        )}
        aria-label="Abrir Asistente AK"
        size="icon"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-[9px] font-bold leading-none tracking-wider">AK</span>
        {!isOpen && alerts.length > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] bg-rose-500 border-2 border-white text-white rounded-full pointer-events-none"
          >
            {alerts.length}
          </Badge>
        )}
      </Button>
    </div>
  );
}
