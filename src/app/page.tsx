'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Wand2, 
    ListChecks, 
    Building2, 
    BarChart3, 
    Settings as SettingsIcon, 
    DollarSign,
    CreditCard,
    Banknote,
    Users,
    CalendarClock,
    Archive,
    CalendarDays,
    ArrowRight,
    Bell,
    Loader2,
    CheckCircle2,
    Sparkles,
    MapPin,
    Monitor,
    Copy,
    Check,
    Wallet,
    Bot,
    UserPlus,
    FileText,
    Files,
} from 'lucide-react';
import { PublicFooter } from '@/components/public-footer';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { PushNotificationPrompt } from '@/components/push-notification-prompt';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getDashboardKpiData, type GlobalAlert } from '@/app/actions/dashboard';
import { MonthlySalesChart } from '@/components/charts/MonthlySalesChart';
import { PaymentStatusPieChart } from '@/components/charts/PaymentStatusPieChart';
import { Separator } from '@/components/ui/separator';
import { getFiestaActual } from './actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { getAlertasGlobalesConLeidas } from '@/app/actions/alertas.actions';
import type { AlertaAutomatica } from '@/types/automatizaciones';

const MAX_DASHBOARD_ALERTS = 3;

export default function MainDashboardPage() {
    const [kpiData, setKpiData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [greeting, setGreeting] = useState('');
    const [greetingEmoji, setGreetingEmoji] = useState('');
    const [alertasUrgentes, setAlertasUrgentes] = useState<AlertaAutomatica[]>([]);
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

    const formatCurrency = (value?: number) => {
        if (isLoading) return '...';
        if (value === undefined || value === null) return '$ 0';
        return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [dashboardResult, fiestaData, alertasData] = await Promise.all([
                getDashboardKpiData(),
                getFiestaActual(),
                getAlertasGlobalesConLeidas(),
            ]);
            if (dashboardResult.success) {
                setKpiData(dashboardResult.data);
            }
            setFiestaActual(fiestaData);
            setAlertasUrgentes(alertasData.filter(a => !a.leida).slice(0, MAX_DASHBOARD_ALERTS));
        } catch(e) {
            toast({ title: "Error", description: "No se pudieron cargar los datos del panel.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pieChartData = useMemo(() => {
        if (!kpiData) return [];
        return [
            { name: 'Pagado', value: kpiData.montoPagado || 0, fill: 'hsl(var(--chart-2))' },
            { name: 'Pendiente', value: kpiData.totalPendiente || 0, fill: 'hsl(var(--chart-5))' },
        ];
    }, [kpiData]);
    
    const mainHubItems = [
        {
          title: 'Nuevo Lead / Contacto',
          description: 'Registrar un nuevo prospecto en el CRM.',
          href: '/contabilidad/crm',
          icon: UserPlus,
          color: "bg-violet-500",
          lightColor: "bg-violet-50 text-violet-600",
          featured: false,
        },
        {
          title: 'CRM / Seguimiento',
          description: 'Ver y gestionar todos los prospectos activos.',
          href: '/contabilidad/crm',
          icon: ListChecks,
          color: "bg-blue-500",
          lightColor: "bg-blue-50 text-blue-600",
          featured: false,
        },
        {
          title: 'Nuevo Presupuesto',
          description: 'Crear una nueva cotización para un cliente.',
          href: '/presupuestos/nuevo/crear',
          icon: FileText,
          color: "bg-indigo-500",
          lightColor: "bg-indigo-50 text-indigo-600",
          featured: true,
        },
        {
          title: 'Ver Presupuestos',
          description: 'Consultar todos los presupuestos generados.',
          href: '/presupuestos',
          icon: Files,
          color: "bg-slate-600",
          lightColor: "bg-slate-50 text-slate-600",
          featured: false,
        },
        {
          title: 'Eventos Activos',
          description: 'Planificación y seguimiento de eventos en curso.',
          href: '/eventos',
          icon: CalendarClock,
          color: "bg-rose-500",
          lightColor: "bg-rose-50 text-rose-600",
          featured: false,
        },
        {
          title: 'Calendario',
          description: 'Vista de agenda y próximas fechas importantes.',
          href: '/calendario',
          icon: CalendarDays,
          color: "bg-teal-500",
          lightColor: "bg-teal-50 text-teal-600",
          featured: false,
        },
        {
          title: 'Cobros / Pagos Rápidos',
          description: 'Registrar cobros y enviar recibos al instante.',
          href: '/pagos-rapidos',
          icon: Wallet,
          color: "bg-emerald-500",
          lightColor: "bg-emerald-50 text-emerald-600",
          featured: false,
        },
        {
          title: 'Base de Clientes',
          description: 'Directorio completo de clientes y contactos.',
          href: '/customers',
          icon: Users,
          color: "bg-amber-500",
          lightColor: "bg-amber-50 text-amber-600",
          featured: false,
        },
    ]

  return (
    <div className="space-y-6 sm:space-y-10 pb-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
            {greeting && (
              <p className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5">
                <span>{greetingEmoji}</span> {greeting}, AK Producciones
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-slate-900">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent italic inline-block pb-1">Inicio</span>
            </h1>
            <p className="text-slate-500 font-semibold flex items-center gap-2 text-xs sm:text-base">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0 inline-block"></span>
                Gestión operativa y financiera de AK Producciones.
            </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 hidden sm:flex"
        >
            <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-200 py-2 px-4 shadow-sm rounded-full font-black text-[10px] tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-400 animate-spin-slow"/> Sistema Optimizado
            </Badge>
        </motion.div>
      </header>

       <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales)} icon={DollarSign} isLoading={isLoading} />
        <KpiCard title="Total Pagado" value={formatCurrency(kpiData?.montoPagado)} icon={CreditCard} isLoading={isLoading} />
        <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente)} icon={Banknote} isLoading={isLoading} />
        <KpiCard title="Prospectos Activos" value={isLoading ? '...' : (kpiData?.prospectosActivos ?? 0)} icon={Users} isLoading={isLoading} />
      </div>

      {/* ── Alertas Automáticas Widget ─────────────────────────── */}
      {!isLoading && alertasUrgentes.length > 0 && (
        <Card className="border-red-100 bg-gradient-to-r from-red-50/80 to-orange-50/60 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-5 flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Bell className="w-4 h-4 text-red-600" />
              </div>
              <CardTitle className="text-sm font-black text-slate-800">
                Alertas Urgentes
                <Badge className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0">{alertasUrgentes.length}</Badge>
              </CardTitle>
            </div>
            <Link href="/alertas">
              <Button variant="outline" size="sm" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50">
                Ver todas <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {alertasUrgentes.map(alerta => (
              <div key={alerta.id} className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-red-100 text-sm">
                <span className="text-lg shrink-0">{alerta.tipo === 'urgente' ? '🔴' : alerta.tipo === 'atencion' ? '🟡' : '🔵'}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-700 text-xs truncate block">{alerta.fiestaName}</span>
                  <span className="text-slate-500 text-xs">{alerta.mensaje}</span>
                </div>
                {alerta.accionUrl && (
                  <Link href={alerta.accionUrl}>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-500 hover:text-red-700 shrink-0">
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                <MonthlySalesChart data={kpiData?.monthlyChartData || []} />
                
                <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-white">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 sm:p-8">
                        <CardTitle className="text-xl sm:text-2xl font-black tracking-tight">Herramientas rápidas</CardTitle>
                        <CardDescription className="text-indigo-200 font-medium">Simuladores, pagos y modo presentación.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8">
                        <Link href="/presupuestos/nuevo/crear">
                            <div className="group p-6 sm:p-8 border border-slate-100 rounded-[1.25rem] sm:rounded-[1.5rem] hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer h-full flex items-center gap-4 sm:gap-6 shadow-sm">
                                <div className="p-4 sm:p-5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                                    <ListChecks className="w-6 h-6 sm:w-7 sm:h-7"/>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-slate-800 text-base sm:text-lg">Nuevo Presupuesto</h3>
                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 uppercase tracking-tighter">Cotización manual.</p>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all shrink-0"/>
                            </div>
                        </Link>
                        <Link href="/simulador-de-presupuesto">
                            <div className="group p-6 sm:p-8 border border-slate-100 rounded-[1.25rem] sm:rounded-[1.5rem] hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer h-full flex items-center gap-4 sm:gap-6 shadow-sm">
                                <div className="p-4 sm:p-5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-gradient-to-br group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                                    <Wand2 className="w-6 h-6 sm:w-7 sm:h-7"/>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-slate-800 text-base sm:text-lg">Simulador Presupuesto</h3>
                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 uppercase tracking-tighter">Captura de leads.</p>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-amber-500 group-hover:translate-x-2 transition-all shrink-0"/>
                            </div>
                        </Link>
                        <Link href="/simulador-ak">
                            <div className="group p-6 sm:p-8 border border-slate-100 rounded-[1.25rem] sm:rounded-[1.5rem] hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer h-full flex items-center gap-4 sm:gap-6 shadow-sm">
                                <div className="p-4 sm:p-5 bg-violet-50 text-violet-600 rounded-2xl group-hover:bg-gradient-to-br group-hover:from-violet-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                                    <Bot className="w-6 h-6 sm:w-7 sm:h-7"/>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-slate-800 text-base sm:text-lg">Simulador Asistente AK</h3>
                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 uppercase tracking-tighter">Chat inteligente.</p>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-violet-500 group-hover:translate-x-2 transition-all shrink-0"/>
                            </div>
                        </Link>
                        <Link href="/pagos-rapidos">
                            <div className="group p-6 sm:p-8 border border-slate-100 rounded-[1.25rem] sm:rounded-[1.5rem] hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer h-full flex items-center gap-4 sm:gap-6 shadow-sm">
                                <div className="p-4 sm:p-5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-gradient-to-br group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                                    <Wallet className="w-6 h-6 sm:w-7 sm:h-7"/>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-slate-800 text-base sm:text-lg">Registrar Pago Rápido</h3>
                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 uppercase tracking-tighter">Cobrar y enviar recibo.</p>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-2 transition-all shrink-0"/>
                            </div>
                        </Link>
                        <div className="md:col-span-2 lg:col-span-4">
                            <div className="group p-5 sm:p-6 border border-slate-100 rounded-[1.25rem] sm:rounded-[1.5rem] bg-slate-950 hover:bg-slate-900 transition-all cursor-pointer flex items-center gap-4 sm:gap-6 shadow-sm">
                                <div className="p-4 sm:p-5 bg-white/10 text-white rounded-2xl shrink-0">
                                    <Monitor className="w-6 h-6 sm:w-7 sm:h-7"/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-black text-white text-base sm:text-lg">Modo Presentación LED</h3>
                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 uppercase tracking-tighter">Pantalla kiosco para reuniones.</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => {
                                            const url = typeof window !== 'undefined'
                                                ? `${window.location.origin}/presentacion`
                                                : '/presentacion';
                                            navigator.clipboard.writeText(url).then(() => {
                                                setCopiedLink(true);
                                                toast({ title: 'Link copiado', description: url });
                                                setTimeout(() => setCopiedLink(false), 2000);
                                            });
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider transition-all"
                                        title="Copiar link"
                                    >
                                        {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400"/> : <Copy className="w-3.5 h-3.5"/>}
                                        {copiedLink ? 'Copiado' : 'Copiar'}
                                    </button>
                                    <Link href="/presentacion" target="_blank">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider transition-all">
                                            <ArrowRight className="w-3.5 h-3.5"/>
                                            Abrir
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-4">
                <Card className="h-full border-none shadow-2xl flex flex-col bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50/50 border-b border-indigo-100/50 pb-6 p-6 sm:p-8">
                        <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-800">
                            <div className="p-2.5 bg-indigo-100 rounded-xl shadow-inner">
                                <Bell className="w-5 h-5 text-indigo-600"/>
                            </div>
                            Prioridades
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-0 flex-grow scrollbar-hide overflow-y-auto">
                        {isLoading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary/30 w-8 h-8"/></div> :
                         kpiData?.alerts?.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {kpiData.alerts.map((alert: GlobalAlert) => (
                                    <Link key={alert.id} href={alert.href} className="flex items-start gap-4 sm:gap-5 p-5 sm:p-6 hover:bg-slate-50 transition-all group relative">
                                        <div className={cn(
                                          "p-2.5 sm:p-3 rounded-2xl mt-0.5 shadow-sm transition-transform group-hover:scale-110 duration-500 shrink-0", 
                                          alert.severity === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                        )}>
                                            {alert.type === 'payment' ? <DollarSign className="w-4 h-4 sm:w-5 sm:h-5"/> : 
                                             alert.type === 'meeting' ? <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5"/> : 
                                             <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5"/>}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-xs sm:text-sm font-black text-slate-800 leading-tight group-hover:text-primary transition-colors">{alert.title}</p>
                                            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-1.5 leading-relaxed">{alert.description}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all self-center shrink-0 hidden sm:block"/>
                                        {alert.severity === 'high' && <div className="absolute left-0 top-4 bottom-4 w-1 bg-rose-500 rounded-r-full"></div>}
                                    </Link>
                                ))}
                            </div>
                         ) : (
                            <div className="text-center py-16 sm:py-24 px-8 space-y-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500/40"/>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Todo en orden</p>
                            </div>
                         )}
                    </CardContent>
                    <CardFooter className="bg-slate-50 py-4 justify-center border-t border-slate-100">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Monitoreo Inteligente 24/7</p>
                    </CardFooter>
                </Card>
            </div>
      </div>
      
       <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Archivos Históricos" value={isLoading ? '...' : (kpiData?.fiestasPasadas ?? 0)} icon={Archive} isLoading={isLoading} />
        <KpiCard title="Eventos Activos" value={isLoading ? '...' : (kpiData?.fiestasFuturas ?? 0)} icon={CalendarClock} isLoading={isLoading} />
        <PaymentStatusPieChart data={pieChartData} />
      </div>

      <Separator className="opacity-30" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        <AnimatePresence>
          {mainHubItems.map((item, idx) => (
            <motion.div
              key={item.title}
              className={cn(item.featured ? "md:col-span-2" : "")}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 + 0.3 }}
            >
              <Card className={cn("group flex flex-col h-full border-none shadow-xl hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500 bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden", item.featured && "ring-2 ring-indigo-500 ring-offset-2")}>
                  <CardHeader className="pb-4 space-y-4 sm:space-y-5 p-6 sm:p-8">
                      <div className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-black/5 group-hover:rotate-6 transition-all duration-500 shrink-0", item.featured ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white" : item.lightColor)}>
                          <item.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <CardTitle className={cn("text-lg sm:text-xl font-black tracking-tight", item.featured ? "text-indigo-700" : "text-slate-800")}>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow px-6 sm:px-8 pb-6 sm:pb-8">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-tighter">
                          {item.description}
                      </p>
                  </CardContent>
                  <CardFooter className="pt-0 pb-6 sm:pb-8 px-6 sm:px-8">
                      <Link href={item.href} className="w-full">
                          <Button variant={item.featured ? "default" : "secondary"} className={cn("w-full justify-between rounded-2xl px-6 h-11 sm:h-12 font-black text-[9px] sm:text-[10px] tracking-widest uppercase transition-all duration-500 shadow-sm", item.featured ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white" : "group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white")}>
                              Abrir <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-500" />
                          </Button>
                      </Link>
                  </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PublicFooter className="rounded-[1.5rem]" />
      <PwaInstallPrompt />
      <PushNotificationPrompt />
    </div>
  );
}
