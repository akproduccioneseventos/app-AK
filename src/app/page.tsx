
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
    Bell
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

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const mainHubItems = [
    {
      title: 'Planificador de Eventos',
      description: 'Gestiona tus eventos activos y archivados. El centro de operaciones de cada fiesta.',
      href: '/eventos',
      icon: CalendarClock,
    },
    {
      title: 'Gestión de la Empresa',
      description: 'Administra tus servicios, personal, proveedores e inventario.',
      href: '/empresa',
      icon: Building2,
    },
    {
      title: 'Panel Contable',
      description: 'Controla el CRM, presupuestos, facturas y la salud financiera de tu negocio.',
      href: '/empresa/contabilidad',
      icon: BarChart3,
    },
     {
      title: "Agenda de Reuniones (CRM)",
      description: "Visualiza y gestiona las reuniones coordinadas con prospectos y clientes potenciales.",
      href: "/contabilidad/crm/agenda",
      icon: CalendarDays,
    },
    {
      title: 'Configuración General',
      description: 'Ajusta las preferencias de la aplicación, plantillas y detalles de tu cuenta.',
      href: '/settings',
      icon: SettingsIcon,
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
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline text-primary">
          Menú Principal
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Tu centro de mando para la gestión integral de eventos.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales)} icon={DollarSign} isLoading={isLoading} description="Suma de todas las facturas generadas."/>
        <KpiCard title="Total Pagado" value={formatCurrency(kpiData?.montoPagado)} icon={CreditCard} isLoading={isLoading} description="Dinero recibido de los clientes."/>
        <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente)} icon={Banknote} isLoading={isLoading} description="Monto por cobrar."/>
        <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos ?? '...'} icon={Users} isLoading={isLoading} description="Clientes potenciales en el embudo de ventas."/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
                <MonthlySalesChart data={kpiData?.monthlyChartData || []} />
            </div>
            <div className="lg:col-span-4">
                <Card className="h-full border-primary/20 shadow-md">
                    <CardHeader className="bg-primary/5 pb-3">
                        <CardTitle className="text-lg font-headline flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary"/> Alertas del Sistema
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-0">
                        {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div> :
                         kpiData?.alerts?.length > 0 ? (
                            <div className="divide-y">
                                {kpiData.alerts.map((alert: GlobalAlert) => (
                                    <Link key={alert.id} href={alert.href} className="flex items-start gap-3 p-3 hover:bg-muted transition-colors group">
                                        <div className={cn("p-2 rounded-full mt-0.5", alert.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600')}>
                                            {alert.type === 'payment' ? <DollarSign className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{alert.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center"/>
                                    </Link>
                                ))}
                            </div>
                         ) : (
                            <div className="text-center py-12 px-4">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto opacity-30 mb-2"/>
                                <p className="text-sm text-muted-foreground">¡Todo al día! No hay alertas pendientes de atención.</p>
                            </div>
                         )}
                    </CardContent>
                    {kpiData?.alerts?.length > 0 && (
                        <CardFooter className="bg-muted/30 py-2 justify-center border-t">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Atención prioritaria recomendada</p>
                        </CardFooter>
                    )}
                </Card>
            </div>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Eventos Pasados" value={kpiData?.fiestasPasadas ?? '...'} icon={Archive} isLoading={isLoading} description="Total de eventos archivados."/>
        <KpiCard title="Eventos Futuros" value={kpiData?.fiestasFuturas ?? '...'} icon={CalendarClock} isLoading={isLoading} description="Eventos en planificación activa."/>
        <PaymentStatusPieChart data={pieChartData} />
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-xl">Herramientas Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/presupuestos/nuevo/crear" passHref>
                <div className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors h-full flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2"><ListChecks className="w-5 h-5 text-primary"/>Crear Presupuesto Manual</h3>
                        <p className="text-sm text-muted-foreground mt-1">Genera un presupuesto detallado seleccionando servicios del catálogo.</p>
                    </div>
                    <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm">Ir ahora <ArrowRight className="w-4 h-4 ml-1"/></Button>
                    </div>
                </div>
            </Link>
             <Link href="/simulador-de-presupuesto" passHref>
                <div className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors h-full flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary"/>Simulador para Clientes</h3>
                        <p className="text-sm text-muted-foreground mt-1">Herramienta para que los clientes armen su presupuesto estimado.</p>
                    </div>
                    <div className="flex justify-end mt-2">
                         <Button variant="ghost" size="sm">Ir ahora <ArrowRight className="w-4 h-4 ml-1"/></Button>
                    </div>
                </div>
            </Link>
        </CardContent>
      </Card>
      
      <Separator className="my-8"/>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mainHubItems.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                    <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                  <CardTitle className="font-headline text-lg mb-1">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
            </CardContent>
            <CardFooter className="pt-3">
                 <Link href={getLinkHref(item.href)} passHref className="w-full">
                    <Button variant="secondary" className="w-full">
                        Acceder
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 9-4.477 9-10S17.523 2 12 2 3 6.477 3 12s3.477 10 9 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
