'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowRight,
  Banknote,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChefHat,
  Copy,
  CreditCard,
  DollarSign,
  FileSignature,
  FileText,
  Files,
  ListChecks,
  Loader2,
  MessageCircle,
  Monitor,
  Package,
  RefreshCw,
  Send,
  Settings as SettingsIcon,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  Wand2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { PushNotificationPrompt } from '@/components/push-notification-prompt';
import { getDashboardKpiData, type GlobalAlert } from '@/app/actions/dashboard';
import { descartarPrioridad } from '@/app/actions/alertas.actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { recoverFromDeploymentMismatch } from '@/lib/deployment-recovery';
import { triggerAppLogout } from '@/app/auth-guard';

const dashboardChartLoading = () => (
  <Card className="flex h-[300px] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
  </Card>
);
const MonthlySalesChart = dynamic(
  () => import('@/components/charts/MonthlySalesChart').then((module) => module.MonthlySalesChart),
  { loading: dashboardChartLoading },
);
const PaymentStatusPieChart = dynamic(
  () => import('@/components/charts/PaymentStatusPieChart').then((module) => module.PaymentStatusPieChart),
  { loading: dashboardChartLoading },
);

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers } from 'lucide-react';

export interface HubItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  lightColor: string;
  featured?: boolean;
  category: 'comercial' | 'operaciones' | 'finanzas' | 'marketing';
}

const CATEGORIES = [
  { id: 'todos', label: 'Todos los módulos', icon: Layers },
  { id: 'comercial', label: 'Ventas & CRM', icon: UserPlus },
  { id: 'operaciones', label: 'Operaciones & Eventos', icon: CalendarClock },
  { id: 'finanzas', label: 'Finanzas & Facturación', icon: BarChart3 },
  { id: 'marketing', label: 'Marketing & Empresa', icon: Wand2 },
];

const mainHubItems: HubItem[] = [
  // Comercial & CRM
  { title: 'Nuevo Lead / Contacto', description: 'Registrar un nuevo prospecto en el CRM.', href: '/contabilidad/crm', icon: UserPlus, lightColor: 'bg-violet-50 text-violet-600', featured: false, category: 'comercial' },
  { title: 'CRM / Seguimiento', description: 'Ver y gestionar todos los prospectos activos.', href: '/contabilidad/crm', icon: ListChecks, lightColor: 'bg-blue-50 text-blue-600', featured: false, category: 'comercial' },
  { title: 'Nuevo Presupuesto', description: 'Crear una nueva cotización para un cliente.', href: '/presupuestos/nuevo/crear', icon: FileText, lightColor: 'bg-indigo-50 text-indigo-600', featured: true, category: 'comercial' },
  { title: 'Ver Presupuestos', description: 'Consultar todos los presupuestos generados.', href: '/presupuestos', icon: Files, lightColor: 'bg-slate-50 text-slate-600', featured: false, category: 'comercial' },
  { title: 'Base de Clientes', description: 'Directorio completo de clientes y contactos.', href: '/customers', icon: Users, lightColor: 'bg-amber-50 text-amber-600', featured: false, category: 'comercial' },

  // Operación & Eventos
  { title: 'Eventos Activos', description: 'Planificación y seguimiento de eventos en curso.', href: '/eventos', icon: CalendarClock, lightColor: 'bg-indigo-50 text-indigo-600', featured: false, category: 'operaciones' },
  { title: 'Calendario', description: 'Vista de agenda y próximas fechas importantes.', href: '/calendario', icon: CalendarDays, lightColor: 'bg-teal-50 text-teal-600', featured: false, category: 'operaciones' },
  { title: 'Planificador Gastronómico', description: 'Menús, recetas, bebidas y repostería maestra.', href: '/empresa/menus', icon: ChefHat, lightColor: 'bg-amber-50 text-amber-600', featured: false, category: 'operaciones' },
  { title: 'Catálogo de Servicios', description: 'Presentación digital del catálogo por tipo de fiesta.', href: '/catalogo', icon: BookOpen, lightColor: 'bg-sky-50 text-sky-600', featured: false, category: 'operaciones' },

  // Finanzas & Facturación
  { title: 'Cobros / Pagos Rápidos', description: 'Registrar cobros y enviar recibos al instante.', href: '/pagos-rapidos', icon: Wallet, lightColor: 'bg-emerald-50 text-emerald-600', featured: false, category: 'finanzas' },
  { title: 'Contabilidad', description: 'Panel financiero, facturas, flujo de caja y reportes.', href: '/empresa/contabilidad', icon: BarChart3, lightColor: 'bg-orange-50 text-orange-600', featured: false, category: 'finanzas' },
  { title: 'Facturas', description: 'Gestión completa de facturación.', href: '/invoices', icon: FileText, lightColor: 'bg-slate-50 text-slate-600', featured: false, category: 'finanzas' },
  { title: 'Activos Fijos', description: 'Inventario de equipos y bienes.', href: '/empresa/activos-fijos', icon: Package, lightColor: 'bg-slate-50 text-slate-600', featured: false, category: 'finanzas' },

  // Marketing & Empresa
  { title: 'Redes Sociales y Marketing', description: 'Contenido, campañas, demo comercial, plantilla LED y redes de AK.', href: '/marketing', icon: MessageCircle, lightColor: 'bg-fuchsia-50 text-fuchsia-600', featured: false, category: 'marketing' },
  { title: 'Marketing 360', description: 'Organiza venta, web pública, redes, demos y materiales comerciales.', href: '/marketing', icon: Wand2, lightColor: 'bg-pink-50 text-pink-600', featured: false, category: 'marketing' },
  { title: 'Gestión de Empresa', description: 'Empleados, servicios, galería, landing page y más.', href: '/empresa', icon: Building2, lightColor: 'bg-cyan-50 text-cyan-600', featured: false, category: 'marketing' },
  { title: 'Envíos de WhatsApp', description: 'Mensajes programados y envíos del día vía WhatsApp.', href: '/contabilidad/crm/outbox', icon: MessageCircle, lightColor: 'bg-green-50 text-green-600', featured: false, category: 'marketing' },
  { title: 'Contratos', description: 'Gestionar plantillas de contrato y cláusulas editables.', href: '/settings/contratos', icon: FileSignature, lightColor: 'bg-blue-50 text-blue-600', featured: false, category: 'marketing' },
];

function alertIcon(alert: GlobalAlert) {
  if (alert.type === 'payment') return <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />;
  if (alert.type === 'meeting') return <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />;
  if (alert.type === 'budget') return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
  return <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />;
}

export default function MainDashboardPage() {
  const [kpiData, setKpiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [greetingEmoji, setGreetingEmoji] = useState('');
  const [loadError, setLoadError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setGreeting('Buenos días');
      setGreetingEmoji('☀️');
    } else if (hour >= 12 && hour < 20) {
      setGreeting('Buenas tardes');
      setGreetingEmoji('🌅');
    } else {
      setGreeting('Buenas noches');
      setGreetingEmoji('🌙');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const dashboardResult = await getDashboardKpiData();
      if (dashboardResult.success) {
        setKpiData(dashboardResult.data);
      } else if (dashboardResult.error === 'SESSION_EXPIRED') {
        await triggerAppLogout();
      } else {
        setKpiData(null);
        setLoadError('No fue posible consultar las fuentes principales del panel.');
        toast({ title: 'Error', description: 'No se pudieron cargar los datos del panel.', variant: 'destructive' });
      }
    } catch (error) {
      if (await recoverFromDeploymentMismatch(error)) return;
      setKpiData(null);
      setLoadError('No fue posible conectar con el panel. Reintenta en unos segundos.');
      toast({ title: 'Error', description: 'No se pudieron cargar los datos del panel.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const alerts: GlobalAlert[] = useMemo(() => kpiData?.alerts || [], [kpiData]);
  const alertasUrgentes = useMemo(() => alerts.filter(alert => alert.severity === 'high').slice(0, 4), [alerts]);
  const unavailableSources: string[] = useMemo(() => kpiData?.unavailableSources || [], [kpiData]);
  const sourceAvailable = useCallback(
    (source: 'presupuestos' | 'facturas' | 'fiestas' | 'prospectos') => kpiData?.sourceStatus?.[source] !== false,
    [kpiData],
  );

  const formatCurrency = (value?: number, available = true) => {
    if (isLoading) return '...';
    if (!available) return 'No disponible';
    if (value === undefined || value === null) return '$ 0';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const dismissAlertLocally = useCallback((alertaId: string) => {
    setKpiData((prev: Record<string, unknown> | null) => prev ? { ...prev, alerts: ((prev.alerts as GlobalAlert[]) || []).filter((a: GlobalAlert) => a.id !== alertaId) } : prev);
  }, []);

  const handleDismissPriority = useCallback(async (alertaId: string) => {
    dismissAlertLocally(alertaId);
    try {
      const result = await descartarPrioridad(alertaId);
      if (!result.success) throw new Error('No se pudo descartar');
    } catch {
      toast({ title: 'Error', description: 'No se pudo descartar la prioridad.', variant: 'destructive' });
      fetchData();
    }
  }, [dismissAlertLocally, fetchData, toast]);

  const pieChartData = useMemo(() => {
    if (!kpiData) return [];
    return [
      { name: 'Pagado', value: kpiData.montoPagado || 0, fill: 'hsl(var(--chart-2))' },
      { name: 'Pendiente', value: kpiData.totalPendiente || 0, fill: 'hsl(var(--chart-5))' },
    ];
  }, [kpiData]);

  return (
    <div className="space-y-6 sm:space-y-10 pb-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
            <span className="text-base">{greetingEmoji}</span>
            <span>{greeting || 'Bienvenido'}, AK Producciones</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Panel de Control <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent italic">General</span>
          </h1>
          <p className="text-slate-600 font-medium text-xs sm:text-sm leading-normal flex items-center gap-2 max-w-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse shrink-0" />
            <span>Gestión operativa, comercial y financiera en tiempo real.</span>
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap items-center gap-3 shrink-0">
          <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700 border-indigo-200/80 py-2 px-4 shadow-sm rounded-xl font-bold text-xs gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin-slow shrink-0" /> Sistema Optimizado
          </Badge>
          <Button asChild variant="default" className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 font-bold text-xs h-10 px-4 shadow-md gap-2 transition-all">
            <Link href="/settings"><SettingsIcon className="w-4 h-4" /> Centro de Control</Link>
          </Button>
        </motion.div>
      </header>

      {(loadError || unavailableSources.length > 0) && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-amber-950">
                {loadError ? 'El panel no pudo cargar sus datos' : 'El panel se cargó parcialmente'}
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-800">
                {loadError || `No respondieron: ${unavailableSources.join(', ')}. Los valores afectados no se muestran como cero.`}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
              <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales, sourceAvailable('presupuestos') && sourceAvailable('facturas'))} icon={DollarSign} isLoading={isLoading} description="Facturas + presupuestos aceptados" />
        <KpiCard title="Total Pagado" value={formatCurrency(kpiData?.montoPagado, sourceAvailable('presupuestos') && sourceAvailable('facturas'))} icon={CreditCard} isLoading={isLoading} description="Cobrado hasta hoy" />
        <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente, sourceAvailable('presupuestos') && sourceAvailable('facturas'))} icon={Banknote} isLoading={isLoading} description="Por cobrar" />
        <KpiCard title="Prospectos Activos" value={isLoading ? '...' : sourceAvailable('prospectos') ? (kpiData?.prospectosActivos ?? 0) : 'No disponible'} icon={Users} isLoading={isLoading} description="En pipeline CRM" />
      </div>

      {!isLoading && kpiData?.proximoEvento && (
        <Card className="bg-white rounded-2xl shadow border border-indigo-100 overflow-hidden">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl shrink-0"><CalendarClock className="w-6 h-6 text-indigo-600" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Próximo Evento</p>
              <p className="font-black text-slate-800 text-base truncate">{kpiData.proximoEvento.nombre}</p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{new Date(kpiData.proximoEvento.fecha).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"><Link href="/eventos">Ver evento <ArrowRight className="w-3 h-3 ml-1" /></Link></Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && alertasUrgentes.length > 0 && (
        <Card className="border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/60 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-5 flex-row items-center justify-between gap-4">
            <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" /> Alertas Urgentes
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">{alertasUrgentes.length}</Badge>
            </CardTitle>
            <Button asChild variant="outline" size="sm" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"><Link href="/alertas">Ver todas <ArrowRight className="w-3 h-3 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {alertasUrgentes.map(alerta => (
              <div key={alerta.id} role="alert" aria-live="polite" className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-amber-100 text-sm overflow-hidden">
                <span className="text-lg shrink-0">🔴</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-700 text-xs truncate block">{alerta.title}</span>
                  <span className="text-slate-500 text-xs">{alerta.description}</span>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100" onClick={() => handleDismissPriority(alerta.id)} aria-label="Cerrar alerta"><X className="w-3.5 h-3.5" /></Button>
                <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 shrink-0"><Link href={alerta.href}><ArrowRight className="w-3 h-3" /></Link></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {sourceAvailable('presupuestos') && sourceAvailable('facturas')
            ? <MonthlySalesChart data={kpiData?.monthlyChartData || []} />
            : <UnavailablePanel title="Evolución mensual no disponible" onRetry={fetchData} />}
          <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
              <CardTitle className="text-xl font-black tracking-tight text-slate-900">Herramientas rápidas</CardTitle>
              <CardDescription className="font-medium text-slate-500">Simuladores, pagos, WhatsApp y modo presentación.</CardDescription>
            </CardHeader>
            <CardContent className="grid auto-rows-fr grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 2xl:grid-cols-3">
              <QuickTool href="/presupuestos/nuevo/crear" icon={ListChecks} title="Nuevo Presupuesto" description="Cotización manual." />
              <QuickTool href="/simulador-ak" icon={Wand2} title="Simulador Inteligente" description="Asiste, cotiza y captura leads." />
              <QuickTool href="/simulador-de-presupuesto" icon={Bot} title="Simulador Manual" description="Configuración detallada clásica." />
              <QuickTool href="/pagos-rapidos" icon={Wallet} title="Registrar Pago Rápido" description="Cobrar y enviar recibo." />
              <QuickTool href="/contabilidad/crm/outbox" icon={Send} title="Envíos de WhatsApp" description="Mensajes del día pendientes." />
              <QuickTool href="/empresa/menus" icon={ChefHat} title="Planificador Gastronómico" description="Menús, recetas y bebidas." />
              <div className="flex min-h-[104px] flex-col justify-between gap-3 rounded-lg border border-slate-100 bg-slate-950 p-4 shadow-sm sm:col-span-2 xl:col-span-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="shrink-0 rounded-lg bg-white/10 p-3 text-white"><Monitor className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><h3 className="text-sm font-black text-white">Modo Presentación LED</h3><p className="mt-1 text-xs font-semibold text-slate-400">Pantalla kiosco para reuniones y demo comercial.</p></div>
                  <button onClick={() => { const url = typeof window !== 'undefined' ? `${window.location.origin}/presentacion` : '/presentacion'; navigator.clipboard.writeText(url).then(() => { setCopiedLink(true); toast({ title: 'Link copiado', description: url }); setTimeout(() => setCopiedLink(false), 2000); }); }} className="flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white/20">
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}{copiedLink ? 'Copiado' : 'Copiar'}
                  </button>
                  <Button asChild size="sm"><Link href="/presentacion" target="_blank">Abrir <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="min-h-[24rem] lg:h-full border-none shadow-2xl flex flex-col bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50/50 border-b border-indigo-100/50 pb-6 p-6 sm:p-8">
              <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-800"><div className="p-2.5 bg-indigo-100 rounded-xl shadow-inner"><Bell className="w-5 h-5 text-indigo-600" /></div>Prioridades</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-0 flex-grow scrollbar-hide overflow-y-auto">
              {isLoading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary/30 w-8 h-8" /></div> : alerts.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-4 sm:gap-5 p-5 sm:p-6 hover:bg-slate-50 transition-all group relative">
                      <Link href={alert.href} className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                        <div className={cn('p-2.5 sm:p-3 rounded-2xl mt-0.5 shadow-sm shrink-0', alert.severity === 'high' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-600')}>{alertIcon(alert)}</div>
                        <div className="flex-grow min-w-0"><p className="text-xs sm:text-sm font-black text-slate-800 leading-tight group-hover:text-primary transition-colors">{alert.title}</p><p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-1.5 leading-relaxed">{alert.description}</p></div>
                      </Link>
                      <button onClick={() => handleDismissPriority(alert.id)} className="shrink-0 self-center p-1.5 rounded-lg text-slate-300 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Descartar prioridad" aria-label="Descartar prioridad"><X className="w-3.5 h-3.5" /></button>
                      {alert.severity === 'high' && <div className="absolute left-0 top-4 bottom-4 w-1 bg-slate-500 rounded-r-full" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 sm:py-24 px-8 space-y-6"><div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500/40" /></div><p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Todo en orden</p></div>
              )}
            </CardContent>
            <CardFooter className="bg-slate-50 py-4 justify-center border-t border-slate-100"><p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Monitoreo Inteligente 24/7</p></CardFooter>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Archivos Históricos" value={isLoading ? '...' : sourceAvailable('fiestas') ? (kpiData?.fiestasPasadas ?? 0) : 'No disponible'} icon={Archive} isLoading={isLoading} />
        <KpiCard title="Eventos Activos" value={isLoading ? '...' : sourceAvailable('fiestas') ? (kpiData?.fiestasFuturas ?? 0) : 'No disponible'} icon={CalendarClock} isLoading={isLoading} />
        {sourceAvailable('presupuestos') && sourceAvailable('facturas')
          ? <PaymentStatusPieChart data={pieChartData} />
          : <UnavailablePanel title="Distribución de pagos no disponible" onRetry={fetchData} />}
      </div>

      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Directorio de Módulos</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Accedé a las distintas áreas operativas de AK Producciones organizadas por categoría.</p>
          </div>
        </div>

        <Tabs defaultValue="todos" className="w-full space-y-6">
          <TabsList className="flex flex-wrap h-auto p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = cat.id === 'todos' ? mainHubItems.length : mainHubItems.filter(i => i.category === cat.id).length;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md flex items-center gap-2"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{cat.label}</span>
                  <Badge variant="secondary" className="ml-1 bg-slate-200/60 text-slate-700 text-[10px] px-1.5 py-0 rounded-full font-bold">
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CATEGORIES.map((cat) => {
            const items = cat.id === 'todos' ? mainHubItems : mainHubItems.filter(i => i.category === cat.id);
            return (
              <TabsContent key={cat.id} value={cat.id} className="space-y-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, idx) => (
                      <motion.div
                        key={item.title}
                        className={cn(item.featured ? 'sm:col-span-2 xl:col-span-1 2xl:col-span-2' : '')}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <Card className={cn(
                          'group flex h-full min-h-[14rem] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10',
                          item.featured && 'border-indigo-300 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 shadow-md ring-2 ring-indigo-500/30'
                        )}>
                          <CardHeader className="space-y-3 p-6 pb-3">
                            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3', item.featured ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/30' : item.lightColor)}>
                              <item.icon className="h-6 w-6 shrink-0" />
                            </div>
                            <CardTitle className={cn('text-lg font-bold leading-snug tracking-tight', item.featured ? 'text-indigo-900' : 'text-slate-900')}>
                              {item.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow px-6 pb-5">
                            <p className="text-sm font-medium leading-relaxed text-slate-600">{item.description}</p>
                          </CardContent>
                          <CardFooter className="px-6 pb-6 pt-0">
                            <Button asChild variant={item.featured ? 'default' : 'secondary'} className={cn('h-11 w-full justify-between rounded-xl px-5 text-xs font-bold tracking-wide shadow-sm transition-all duration-300', item.featured ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25' : 'bg-slate-100 text-slate-800 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20')}>
                              <Link href={item.href} className="w-full flex items-center justify-between">
                                <span>Abrir módulo</span>
                                <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </section>

      <PwaInstallPrompt />
      <PushNotificationPrompt />
    </div>
  );
}

function UnavailablePanel({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <Card className="flex min-h-[300px] items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
      <CardContent className="space-y-4 text-center p-0">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-700" />
        <p className="text-sm font-bold text-amber-950">{title}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="rounded-xl border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickTool({ href, icon: Icon, title, description }: { href: string; icon: any; title: string; description: string }) {
  return (
    <Link href={href} className="block h-full">
      <div className="group flex h-full min-h-[96px] cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:bg-slate-50/80 hover:shadow-md">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-inner transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-600/20">
          <Icon className="h-5 w-5 shrink-0" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-snug text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h3>
          <p className="mt-0.5 text-xs font-medium leading-snug text-slate-500">{description}</p>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-indigo-600" />
      </div>
    </Link>
  );
}
