'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles, Loader2, CalendarClock, ListChecks, DollarSign, CreditCard, X,
  ChevronRight, Calendar, FileText, Receipt, Send, Paperclip, Check, Copy,
  BookOpen, MessageSquare, LayoutDashboard, Users, PartyPopper, BarChart2,
  Building2, Megaphone, Settings, Hash, Globe, ShoppingCart, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    case 'meeting': return <CalendarClock className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />;
    case 'task': return <ListChecks className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    case 'budget': return <DollarSign className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
    case 'payment': return <CreditCard className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
    default: return <Sparkles className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />;
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

const SUGGESTED_CHIPS = [
  '📸 Importá un presupuesto desde foto',
  '¿Cómo creo un presupuesto?',
  '¿Tengo pagos pendientes?',
  'Registrá una seña de $50.000',
  'Generame un post para Instagram',
  '¿Estoy libre el próximo sábado?',
  'Creame un empleado',
  'Agregá un proveedor',
  'Enseñame a usar el CRM',
];

const MANUAL_SECTIONS = [
  { icon: LayoutDashboard, title: 'Dashboard', href: '/', desc: 'Panel principal con KPIs: próximo evento, presupuestos pendientes, facturas por vencer y acceso rápido a todas las secciones.', ask: '¿Qué me muestra el Dashboard?' },
  { icon: FileText, title: 'Presupuestos', href: '/presupuestos/nuevo', desc: 'Creá presupuestos en 3 pasos: datos del evento → servicios del catálogo → revisar y guardar. Podés generar PDF desde la vista del presupuesto.', ask: '¿Cómo creo un presupuesto?' },
  { icon: Receipt, title: 'Facturas', href: '/invoices', desc: 'Gestión completa de facturación. Creá facturas nuevas, registrá pagos parciales o totales y hacé seguimiento de cobros.', ask: '¿Cómo registro un pago?' },
  { icon: Users, title: 'Clientes', href: '/customers', desc: 'CRUD completo de clientes. Al crear un cliente se genera automáticamente un evento/fiesta asociado.', ask: '¿Cómo agrego un cliente?' },
  { icon: PartyPopper, title: 'Planificador de Fiestas', href: '/fiestas/nueva', desc: 'El módulo central. Gestioná invitados, decoración, catering, música, fotografía, personal, itinerario, tareas, pagos y más.', ask: '¿Cómo planifico una fiesta?' },
  { icon: BarChart2, title: 'CRM', href: '/contabilidad/crm', desc: 'Pipeline de ventas en Kanban. Manejá leads, etapas de venta y agenda de reuniones con clientes potenciales.', ask: '¿Cómo uso el CRM?' },
  { icon: Building2, title: 'Empresa', href: '/empresa', desc: 'Info de la empresa, gestión de empleados y proveedores. Configurá tus salones y servicios.', ask: '¿Cómo gestiono mi equipo?' },
  { icon: Megaphone, title: 'Marketing', href: '/marketing', desc: 'Generador de contenido para redes sociales. Creá posts, planificá campañas y gestioná tu presencia online.', ask: '¿Cómo genero contenido de marketing?' },
  { icon: Settings, title: 'Configuración', href: '/settings', desc: 'Datos fiscales, templates de contratos y presupuestos, backup del sistema y más ajustes del sistema.', ask: '¿Cómo configuro la empresa?' },
  { icon: Hash, title: 'Simuladores', href: '/simulador-de-presupuesto', desc: 'Herramientas públicas para que los clientes calculen presupuestos. /simulador, /simulador-de-presupuesto y /simulador-ak.', ask: '¿Cómo funciona el simulador?' },
  { icon: Globe, title: 'Portal del Cliente', href: '/portal-cliente', desc: 'Portal VIP donde el cliente ve su evento, pagos, invitados y puede firmar el contrato digital.', ask: '¿Cómo accede el cliente a su portal?' },
  { icon: ShoppingCart, title: 'Catálogos', href: '/landing', desc: 'Catálogos públicos de servicios por tipo de evento. Tus clientes los pueden ver sin loguearse.', ask: '¿Cómo muestro mis servicios online?' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageDataUri?: string;
  imageFileName?: string;
  action?: { type: string; data?: any; result?: any };
}

function ActionResultCard({ action }: { action: { type: string; data?: any; result?: any } }) {
  const [copied, setCopied] = useState(false);
  if (!action || action.type === 'none' || !action.type) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (action.type === 'create_budget' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Presupuesto creado para {action.data?.clienteNombre}</span>
        </div>
        {action.result.id && (
          <Link href={`/presupuestos/${action.result.id}/ver`} className="text-xs text-green-700 underline hover:text-green-900 shrink-0">Ver →</Link>
        )}
      </div>
    );
  }

  if (action.type === 'create_customer' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Cliente {action.data?.name} ingresado</span>
        </div>
        {action.result.id && (
          <Link href={`/customers/${action.result.id}`} className="text-xs text-green-700 underline hover:text-green-900 shrink-0">Ver →</Link>
        )}
      </div>
    );
  }

  if (action.type === 'generate_social_post' && (action.data?.content || action.result?.content)) {
    const content = action.data?.content || action.result?.content;
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
        <p className="text-xs text-indigo-800 font-medium mb-1.5">📱 Post generado:</p>
        <p className="text-xs text-indigo-700 whitespace-pre-wrap">{content}</p>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-800 mt-1" onClick={() => handleCopy(content)}>
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    );
  }

  if (action.type === 'generate_whatsapp_message' && (action.data?.content || action.result?.content)) {
    const content = action.data?.content || action.result?.content;
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200">
        <p className="text-xs text-green-800 font-medium mb-1.5">💬 Mensaje de WhatsApp:</p>
        <p className="text-xs text-green-700 whitespace-pre-wrap">{content}</p>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-green-600 hover:text-green-800 mt-1" onClick={() => handleCopy(content)}>
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    );
  }

  if (action.type === 'generate_promo' && (action.data?.content || action.result?.content)) {
    const content = action.data?.content || action.result?.content;
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-800 font-medium mb-1.5">🎁 Promo generada:</p>
        <p className="text-xs text-amber-700 whitespace-pre-wrap">{content}</p>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-600 hover:text-amber-800 mt-1" onClick={() => handleCopy(content)}>
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    );
  }

  if (action.type === 'navigate' && action.data?.href) {
    return (
      <div className="mt-2">
        <Link href={action.data.href} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
          Ir ahí <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  if (action.type === 'import_budget_from_image' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 space-y-1">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Presupuesto importado para {action.data?.clienteNombre}</span>
        </div>
        {action.result.id && (
          <Link href={`/presupuestos/${action.result.id}/ver`} className="text-xs text-green-700 underline hover:text-green-900 block">Ver presupuesto →</Link>
        )}
        {action.result.fiestaId && (
          <Link href={`/fiestas/nueva?fiestaId=${action.result.fiestaId}`} className="text-xs text-green-700 underline hover:text-green-900 block">Ver evento →</Link>
        )}
      </div>
    );
  }

  if (action.type === 'register_payment') {
    if (action.result?.success) {
      return (
        <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-xs text-green-800 font-medium">Pago de ${action.data?.monto?.toLocaleString('es-UY')} registrado</span>
          </div>
          {action.result.presupuestoId && (
            <Link href={`/presupuestos/${action.result.presupuestoId}/ver`} className="text-xs text-green-700 underline hover:text-green-900 shrink-0">Ver →</Link>
          )}
        </div>
      );
    }
    if (action.result && !action.result.success) {
      return (
        <div className="mt-2 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
          <span className="text-xs text-red-700">{action.result.error || 'No se pudo registrar el pago.'}</span>
        </div>
      );
    }
  }

  if (action.type === 'create_invoice' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Factura creada para {action.data?.clienteNombre}</span>
        </div>
        {action.result.id && (
          <Link href={`/invoices/${action.result.id}`} className="text-xs text-green-700 underline hover:text-green-900 shrink-0">Ver →</Link>
        )}
      </div>
    );
  }

  if (action.type === 'update_service_price' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Precio de "{action.data?.servicioNombre}" actualizado a ${action.data?.nuevoPrecio?.toLocaleString('es-UY')}</span>
        </div>
        <Link href="/empresa/servicios" className="text-xs text-green-700 underline hover:text-green-900 shrink-0">Ver →</Link>
      </div>
    );
  }

  if (action.type === 'create_employee' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Empleado {action.data?.nombre} registrado</span>
        </div>
        <Link href="/empresa/empleados" className="text-xs text-green-700 underline hover:text-green-900 shrink-0">Ver →</Link>
      </div>
    );
  }

  if (action.type === 'create_supplier' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Proveedor {action.data?.nombreEmpresa || action.data?.nombre || 'sin nombre'} registrado</span>
        </div>
        <Link href="/proveedores" className="text-xs text-green-700 underline hover:text-green-900 shrink-0">Ver →</Link>
      </div>
    );
  }

  if (action.type === 'create_event' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 space-y-1">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Evento creado para {action.data?.clienteNombre}</span>
        </div>
        {action.result.fiestaId && (
          <Link href={`/fiestas/nueva?fiestaId=${action.result.fiestaId}`} className="text-xs text-green-700 underline hover:text-green-900 block">Ver evento →</Link>
        )}
      </div>
    );
  }

  if (action.type === 'update_event' && action.result?.success) {
    return (
      <div className="mt-2 p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-800 font-medium">Evento actualizado</span>
        </div>
        {action.result.fiestaId && (
          <Link href={`/fiestas/nueva?fiestaId=${action.result.fiestaId}`} className="text-xs text-green-700 underline hover:text-green-900 shrink-0">Ver →</Link>
        )}
      </div>
    );
  }

  if (action.type === 'generate_contract' && action.result?.success) {
    return (
      <div className="mt-2">
        <Link href={action.result.href || '/fiestas/nueva/gestion-documental/contrato-digital'} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
          Ver contrato <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  if (action.type === 'check_availability' && action.result) {
    const r = action.result;
    if (r.success) {
      return (
        <div className={`mt-2 p-2.5 rounded-xl border ${r.disponible ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <p className={`text-xs font-medium ${r.disponible ? 'text-green-800' : 'text-amber-800'}`}>
            {r.disponible ? `✅ Fecha libre: ${r.fecha}` : `⚠️ Tenés ${r.eventosEnFecha?.length} evento(s) ese día`}
          </p>
          {!r.disponible && r.eventosEnFecha?.map((e: { nombre: string; tipo: string }, i: number) => (
            <p key={i} className="text-[11px] text-amber-700 mt-0.5">· {e.nombre} {e.tipo ? `(${e.tipo})` : ''}</p>
          ))}
        </div>
      );
    }
  }

  if (action.type === 'update_marketing_content' && action.result?.success) {
    return (
      <div className="mt-2">
        <Link href="/marketing" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
          Ir a Marketing <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return null;
}

export function AKAssistantWidget() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');

  const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [proximoEvento, setProximoEvento] = useState<{ nombre: string; fecha: string } | null>(null);
  const [presupuestosPendientes, setPresupuestosPendientes] = useState<number>(0);
  const [facturasPorVencer, setFacturasPorVencer] = useState<number>(0);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('ak-assistant-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ dataUri: string; name: string; preview?: string } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // silent fail
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    try {
      localStorage.setItem('ak-assistant-history', JSON.stringify(chatHistory));
    } catch {
      // storage full or not available
    }
  }, [chatHistory]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab, isSending]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUri = ev.target?.result as string;
      setAttachedFile({ dataUri, name: file.name, preview: file.type.startsWith('image/') ? dataUri : undefined });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (overrideText?: string) => {
    const text = overrideText ?? inputText.trim();
    if (!text && !attachedFile) return;
    if (isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text || '(archivo adjunto)',
      imageDataUri: attachedFile?.dataUri,
      imageFileName: attachedFile?.name,
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputText('');
    setAttachedFile(null);
    setIsSending(true);

    try {
      // Build history including the current message so the flow has the full context
      const nextHistory = [...chatHistory, userMsg];
      const historyForFlow = nextHistory.map(m => ({ role: m.role, content: m.content }));
      const result = await sendAssistantMessage(text || '(archivo adjunto)', historyForFlow, userMsg.imageDataUri);
      if (result.success && result.response) {
        setChatHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: result.response!, action: result.action }]);

        if (result.action?.type && result.action.type !== 'none') {
          const actionData = result.action.data;
          const actionResult = result.action.result;
          switch (result.action.type) {
            case 'navigate':
              if (actionData?.href) {
                router.push(actionData.href);
              }
              break;
            case 'create_budget':
              if (actionResult?.success) {
                toast({ title: '✅ Presupuesto creado', description: `Para ${actionData?.clienteNombre || 'el cliente'}` });
              }
              break;
            case 'create_customer':
              if (actionResult?.success) {
                toast({ title: '✅ Cliente ingresado', description: actionData?.name || '' });
              }
              break;
            case 'create_event':
              if (actionResult?.success) {
                toast({ title: '✅ Evento creado', description: `Para ${actionData?.clienteNombre || 'el cliente'}` });
              }
              break;
            case 'import_budget_from_image':
              if (actionResult?.success) {
                toast({ title: '✅ Presupuesto importado', description: `Para ${actionData?.clienteNombre || 'el cliente'}` });
              }
              break;
            case 'register_payment':
              if (actionResult?.success) {
                toast({ title: '✅ Pago registrado', description: actionData?.monto != null ? `$${Number(actionData.monto).toLocaleString('es-UY')}` : undefined });
              }
              break;
            case 'create_invoice':
              if (actionResult?.success) {
                toast({ title: '✅ Factura creada', description: `Para ${actionData?.clienteNombre || 'el cliente'}` });
              }
              break;
            case 'update_service_price':
              if (actionResult?.success) {
                toast({ title: '✅ Precio actualizado', description: actionData?.servicioNombre || '' });
              }
              break;
            case 'create_employee':
              if (actionResult?.success) {
                toast({ title: '✅ Empleado registrado', description: actionData?.nombre || '' });
              }
              break;
            case 'create_supplier':
              if (actionResult?.success) {
                toast({ title: '✅ Proveedor registrado', description: actionData?.nombreEmpresa || actionData?.nombre || '' });
              }
              break;
            case 'update_event':
              if (actionResult?.success) {
                toast({ title: '✅ Evento actualizado' });
              }
              break;
            case 'generate_social_post':
              if (actionResult?.success) {
                toast({ title: '📱 Post generado', description: 'Listo para copiar y publicar' });
              }
              break;
            case 'generate_whatsapp_message':
              if (actionResult?.success) {
                toast({ title: '💬 Mensaje generado', description: 'Listo para enviar por WhatsApp' });
              }
              break;
            case 'generate_promo':
              if (actionResult?.success) {
                toast({ title: '🎁 Promo generada', description: 'Lista para publicar' });
              }
              break;
          }
        }
      } else {
        setChatHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: result.error || 'Ocurrió un error.' }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Hubo un problema de conexión. Intentálo de nuevo.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleManualAsk = (question: string) => {
    setActiveTab('chat');
    setTimeout(() => handleSend(question), 100);
  };

  const handleNewConversation = () => {
    setChatHistory([]);
    try { localStorage.removeItem('ak-assistant-history'); } catch { /* ignore */ }
  };

  const greeting = getGreeting();
  const highCount = alerts.filter(a => a.severity === 'high').length;
  const summaryText = alerts.length === 0 ? '¡Todo en orden por ahora! 🎉' : highCount > 0 ? `Tenés ${highCount} ${pluralize(highCount, 'asunto urgente', 'asuntos urgentes')} hoy.` : `Tenés ${alerts.length} ${pluralize(alerts.length, 'recordatorio pendiente', 'recordatorios pendientes')}.`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden">
      {isOpen && (
        <Card className="w-[420px] max-w-[calc(100vw-24px)] shadow-2xl border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white px-4 py-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Asistente AK</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setIsOpen(false)} aria-label="Cerrar asistente">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none border-b border-slate-100 bg-white px-0 h-9">
              <TabsTrigger value="resumen" className="flex-1 text-xs rounded-none h-full data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none">Resumen</TabsTrigger>
              <TabsTrigger value="chat" className="flex-1 text-xs rounded-none h-full data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none">
                <MessageSquare className="h-3 w-3 mr-1" />Chat IA
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1 text-xs rounded-none h-full data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none">
                <BookOpen className="h-3 w-3 mr-1" />Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="mt-0">
              <CardContent className="p-4 bg-white max-h-[70vh] overflow-y-auto space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{greeting} ✨</p>
                  <p className="text-xs text-slate-500 mt-0.5">{summaryText}</p>
                </div>
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
                        <p className="text-[11px] text-amber-700 font-medium">{presupuestosPendientes} {pluralize(presupuestosPendientes, 'presupuesto pendiente', 'presupuestos pendientes')} de respuesta</p>
                      </Link>
                    )}
                    {facturasPorVencer > 0 && (
                      <Link href="/invoices" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors">
                        <CreditCard className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <p className="text-[11px] text-rose-700 font-medium">{facturasPorVencer} {pluralize(facturasPorVencer, 'factura vence', 'facturas vencen')} en los próximos 7 días</p>
                      </Link>
                    )}
                  </div>
                )}
                {loading && (
                  <div className="flex items-center justify-center py-6 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-xs">Cargando resumen…</span>
                  </div>
                )}
                {!loading && alerts.length === 0 && loaded && <p className="text-xs text-slate-400 text-center py-4">No hay alertas pendientes.</p>}
                {!loading && alerts.length > 0 && (
                  <ul className="space-y-2">
                    {alerts.map(alert => (
                      <li key={alert.id}>
                        <Link href={alert.href} onClick={() => setIsOpen(false)} className={cn('flex items-start gap-2 p-2.5 rounded-xl border-l-4 bg-slate-50 hover:bg-slate-100 transition-colors group', getSeverityColor(alert.severity))}>
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
                <div className="border-t border-slate-100 pt-1" />
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Acciones rápidas</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
                      <Link key={href} href={href} onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-colors text-center group">
                        <Icon className="h-4 w-4 text-indigo-500 group-hover:text-indigo-600" />
                        <span className="text-[10px] text-slate-600 group-hover:text-indigo-700 leading-tight font-medium">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setActiveTab('chat')}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />Preguntale al Asistente IA
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="chat" className="mt-0 flex flex-col" style={{ height: '70vh' }}>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
                {chatHistory.length === 0 && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-slate-100 max-w-[85%]">
                        <p className="text-xs text-slate-700">¡Hola! Soy el Asistente AK 👋 Puedo ayudarte a gestionar tu negocio, crear presupuestos, analizar archivos y más. ¿En qué te ayudo hoy?</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-9">
                      {SUGGESTED_CHIPS.map(chip => (
                        <button key={chip} onClick={() => handleSend(chip)} disabled={isSending} className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-50">
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map(msg => (
                  <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className={cn('max-w-[85%]', msg.role === 'user' ? 'items-end' : 'items-start')}>
                      {msg.imageDataUri && (
                        <div className="mb-1.5">
                          {msg.imageDataUri.startsWith('data:image/') ? (
                            <img src={msg.imageDataUri} alt={msg.imageFileName || 'Archivo adjunto'} className="h-20 w-20 rounded-xl object-cover border border-slate-200" />
                          ) : (
                            <div className="h-16 w-20 rounded-xl bg-slate-200 flex flex-col items-center justify-center border border-slate-300">
                              <FileText className="h-6 w-6 text-slate-500" />
                              <span className="text-[9px] text-slate-500 mt-0.5 px-1 truncate max-w-full">{msg.imageFileName}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.content && msg.content !== '(archivo adjunto)' && (
                        <div className={cn('px-3 py-2 rounded-2xl text-xs leading-relaxed', msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm shadow-sm border border-slate-100')}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}
                      {msg.action && msg.action.type !== 'none' && <ActionResultCard action={msg.action} />}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex items-start gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-1 h-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-slate-100 bg-white p-2 space-y-2">
                {attachedFile && (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                    {attachedFile.preview ? (
                      <img src={attachedFile.preview} alt={attachedFile.name} className="h-8 w-8 rounded object-cover border border-indigo-200" />
                    ) : (
                      <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                    )}
                    <span className="text-xs text-indigo-700 truncate flex-1">{attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} className="text-indigo-400 hover:text-indigo-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <div className="flex items-end gap-1.5">
                  <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 shrink-0" onClick={() => fileInputRef.current?.click()} title="Adjuntar imagen o PDF">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <textarea value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribí algo o adjuntá un archivo..." rows={1} className="flex-1 resize-none text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 bg-slate-50 max-h-20 min-h-[32px]" style={{ lineHeight: '1.4' }} />
                  <Button size="icon" className="h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 rounded-xl" onClick={() => handleSend()} disabled={isSending || (!inputText.trim() && !attachedFile)}>
                    {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                {chatHistory.length > 0 && (
                  <button onClick={handleNewConversation} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="h-3 w-3" />Nueva conversación
                  </button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-0">
              <div className="max-h-[70vh] overflow-y-auto bg-white">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Tocá una sección para aprender cómo usarla</p>
                </div>
                <ul className="divide-y divide-slate-50">
                  {MANUAL_SECTIONS.map(section => (
                    <li key={section.href}>
                      <button className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors" onClick={() => setExpandedSection(expandedSection === section.href ? null : section.href)}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <section.icon className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span className="text-xs font-medium text-slate-700">{section.title}</span>
                          </div>
                          <ChevronRight className={cn('h-3.5 w-3.5 text-slate-400 transition-transform shrink-0', expandedSection === section.href && 'rotate-90')} />
                        </div>
                        {expandedSection === section.href && (
                          <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
                            <p className="text-[11px] text-slate-500 leading-relaxed pl-6">{section.desc}</p>
                            <div className="pl-6 flex flex-wrap gap-1.5">
                              <Link href={section.href} onClick={() => setIsOpen(false)} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100">Ir →</Link>
                              <button onClick={() => handleManualAsk(section.ask)} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200">Preguntarle al Asistente</button>
                            </div>
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn('h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white border-0 relative flex flex-col items-center justify-center gap-0', !isOpen && highCount > 0 && 'animate-pulse')}
        aria-label="Abrir Asistente AK"
        size="icon"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-[9px] font-bold leading-none tracking-wider">AK</span>
        {!isOpen && alerts.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] bg-rose-500 border-2 border-white text-white rounded-full pointer-events-none">{alerts.length}</Badge>
        )}
      </Button>
    </div>
  );
}
