'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    LayoutDashboard, 
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
    History,
    AlertTriangle,
    Bell,
    Loader2,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getDashboardKpiData, type GlobalAlert } from '@/app/actions/dashboard';
import { MonthlySalesChart } from '@/components/charts/MonthlySalesChart';
import { PaymentStatusPieChart } from '@/components/charts/PaymentStatusPieChart';
import { Separator } from '@/components/ui/separator';
import { getFiestaActual, type FiestaEnPlanificacion } from './actions/fiesta/fiesta.actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const mainHubItems = [
    {
      title: 'Planificador de Eventos',
      description: 'Gestión integral de tus fiestas activas y archivos históricos.',
      href: '/eventos',
      icon: CalendarClock,
      color: "bg-rose-500"
    },
    {
      title: 'Gestión de la Empresa',
      description: 'Control de servicios, personal, proveedores e inventario físico.',
      href: '/empresa',
      icon: Building2,
      color: "bg-amber-500"
    },
    {
      title: 'Panel Contable',
      description: 'CRM de prospectos, presupuestos, facturación y salud financiera.',
      href: '/empresa/contabilidad',
      icon: BarChart3,
      color: "bg-emerald-500"
    },
     {
      title: "Agenda de Reuniones",
      description: "Seguimiento de citas coordinadas con clientes potenciales.",
      href: "/contabilidad/crm/agenda",
      icon: CalendarDays,
      color: "bg-blue-500"
    },
    {
      title: 'Configuración',
      description: 'Ajustes del sistema, plantillas maestras y detalles de cuenta.',
      href: '/settings',
      icon: SettingsIcon,
      color: "bg-slate-600"
    },
]

export default function MainDashboardPage() {
    const [kpiData, setKpiData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [dashboardResult, fiestaData] = await Promise.all([
                getDashboardKpiData(),
                getFiestaActual()
            ]);
            if (dashboardResult.success) {
                setKpiData(dashboardResult.data);
            }
            setFiestaActual(fiestaData);
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
    
    const getLinkHref = (baseHref: string) => {
      if (baseHref === "/fiestas/nueva/reuniones" && fiestaActual) {
        return `${baseHref}?fiestaId=${fiestaActual.id}`;
      }
      return baseHref;
    };


  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight font-headline text-slate-900">
                Panel de <span className="text-primary">Control</span>
            </h1>
            <p className="text-muted-foreground font-medium">
                Gestión operativa y financiera de AK Producciones.
            </p>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1 px-3">
                <Sparkles className="w-3.5 h-3.5 mr-2"/> Sistema Optimizado
            </Badge>
        </div>
      </header>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales)} icon={DollarSign} isLoading={isLoading} />
        <KpiCard title="Total Pagado" value={formatCurrency(kpiData?.montoPagado)} icon={CreditCard} isLoading={isLoading} />
        <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente)} icon={Banknote} isLoading={isLoading} />
        <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos ?? '...'} icon={Users} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <MonthlySalesChart data={kpiData?.monthlyChartData || []} />
                
                <Card className="border-none shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white">
                        <CardTitle className="font-headline text-xl">Acceso Rápido</CardTitle>
                        <CardDescription className="text-slate-400">Herramientas de venta directa.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                        <Link href="/presupuestos/nuevo/crear" passHref>
                            <div className="group p-6 border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer h-full flex items-center gap-4 shadow-sm">
                                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                                    <ListChecks className="w-6 h-6"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Presupuesto Manual</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Cotiza servicios del catálogo.</p>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"/>
                            </div>
                        </Link>
                        <Link href="/simulador-de-presupuesto" passHref>
                            <div className="group p-6 border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer h-full flex items-center gap-4 shadow-sm">
                                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                                    <Wand2 className="w-6 h-6"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Simulador Cliente</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Herramienta pública de cotización.</p>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"/>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-4">
                <Card className="h-full border-none shadow-2xl flex flex-col bg-slate-50/50">
                    <CardHeader className="bg-white border-b pb-4">
                        <CardTitle className="text-xl font-headline flex items-center gap-3 text-slate-800">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Bell className="w-5 h-5 text-primary"/>
                            </div>
                            Alertas Críticas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-0 flex-grow">
                        {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div> :
                         kpiData?.alerts?.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {kpiData.alerts.map((alert: GlobalAlert) => (
                                    <Link key={alert.id} href={alert.href} className="flex items-start gap-4 p-4 hover:bg-white transition-all group relative">
                                        <div className={cn("p-2.5 rounded-xl mt-0.5 shadow-sm", alert.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>
                                            {alert.type === 'payment' ? <DollarSign className="w-4 h-4"/> : 
                                             alert.type === 'meeting' ? <CalendarDays className="w-4 h-4"/> : 
                                             <AlertTriangle className="w-4 h-4"/>}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-primary transition-colors truncate">{alert.title}</p>
                                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all self-center shrink-0"/>
                                        {alert.severity === 'high' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full"></div>}
                                    </Link>
                                ))}
                            </div>
                         ) : (
                            <div className="text-center py-20 px-6 space-y-4">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 opacity-40"/>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">¡Excelente! No hay pendientes urgentes.</p>
                            </div>
                         )}
                    </CardContent>
                    <CardFooter className="bg-white py-3 justify-center border-t">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Monitoreo en tiempo real</p>
                    </CardFooter>
                </Card>
            </div>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Eventos Archivados" value={kpiData?.fiestasPasadas ?? '...'} icon={Archive} isLoading={isLoading} className="border-none shadow-lg"/>
        <KpiCard title="Planificaciones Activas" value={kpiData?.fiestasFuturas ?? '...'} icon={CalendarClock} isLoading={isLoading} className="border-none shadow-lg"/>
        <PaymentStatusPieChart data={pieChartData} />
      </div>

      <Separator className="opacity-50" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {mainHubItems.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="group flex flex-col h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 space-y-4">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-all duration-500", item.color)}>
                        <item.icon className="w-7 h-7" />
                    </div>
                    <CardTitle className="font-headline text-xl text-slate-800">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                    </p>
                </CardContent>
                <CardFooter className="pt-0 pb-6 px-6">
                    <Link href={getLinkHref(item.href)} passHref className="w-full">
                        <Button variant="ghost" className="w-full justify-between group-hover:bg-slate-50 rounded-xl px-4 transition-all">
                            Acceder <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'outline' | 'destructive', className?: string }) => (
    <span className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors",
        variant === 'default' ? "bg-primary text-primary-foreground" : 
        variant === 'outline' ? "border text-foreground" :
        "bg-destructive text-destructive-foreground",
        className
    )}>
        {children}
    </span>
);