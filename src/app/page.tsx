
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ListChecks, FileText as FileTextIcon, Users, KanbanSquare, Loader2, AlertTriangle, TrendingUp, Briefcase, Settings as SettingsIcon, BarChart3, ArrowLeft, Info, Wand2, Eye, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription as AlertDescriptionShadcn } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import type { MonthlyChartData } from '@/components/charts/MonthlySalesChart';
import type { PaymentPieChartData } from '@/components/charts/PaymentStatusPieChart';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { getInvoices } from '@/app/actions/invoices';
import { ShareLinkDialog } from '@/components/dashboard/ShareLinkDialog';

const MonthlySalesChart = dynamic(() => 
  import('@/components/charts/MonthlySalesChart').then(mod => mod.MonthlySalesChart), 
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[300px] w-full" /> 
  }
);

const PaymentStatusPieChart = dynamic(() => 
  import('@/components/charts/PaymentStatusPieChart').then(mod => mod.PaymentStatusPieChart), 
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[300px] w-full" /> 
  }
);

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return "N/A";
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface AccesoDirectoItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  actionLabel: string;
}

const accesosDirectosItems: AccesoDirectoItem[] = [
  {
    title: 'Gestión de Prospectos (CRM)',
    description: 'Visualiza y gestiona tu embudo de ventas y clientes potenciales.',
    href: '/contabilidad/crm',
    icon: KanbanSquare,
    actionLabel: 'Ir al CRM',
  },
  {
    title: 'Central de Presupuestos',
    description: 'Crea, gestiona y envía presupuestos detallados a tus clientes.',
    href: '/presupuestos/nuevo',
    icon: ListChecks,
    actionLabel: 'Ir a Presupuestos',
  },
  {
    title: 'Gestión de Facturas',
    description: 'Genera y administra facturas para tus servicios y eventos.',
    href: '/invoices',
    icon: FileTextIcon,
    actionLabel: 'Ir a Facturas',
  },
  {
    title: 'Gestión de Clientes',
    description: 'Consulta y administra la información de tus clientes confirmados.',
    href: '/customers',
    icon: Users,
    actionLabel: 'Ir a Clientes',
  },
];

export default function ContabilidadDashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlyChartData[]>([]);
  const [paymentPieChartData, setPaymentPieChartData] = useState<PaymentPieChartData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        kpiResult,
        invoicesData
      ] = await Promise.all([
        getDashboardKpiData(),
        getInvoices(),
      ]);

      if (!kpiResult.success) {
        throw new Error(kpiResult.error || 'Failed to get KPI data');
      }
      setKpiData(kpiResult.data);
      
      const salesByMonth: { [key: string]: { sales: number, payments: number } } = {};
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        salesByMonth[monthKey] = { sales: 0, payments: 0 };
      }

      invoicesData.forEach(inv => {
        const issueMonth = new Date(inv.issueDate);
        const monthKey = `${issueMonth.getFullYear()}-${String(issueMonth.getMonth() + 1).padStart(2, '0')}`;
        if (salesByMonth[monthKey]) {
          salesByMonth[monthKey].sales += inv.totalAmount;
        }
        inv.payments?.forEach(p => {
          const paymentMonth = new Date(p.paymentDate);
          const paymentMonthKey = `${paymentMonth.getFullYear()}-${String(paymentMonth.getMonth() + 1).padStart(2, '0')}`;
           if (salesByMonth[paymentMonthKey]) {
            salesByMonth[paymentMonthKey].payments += p.amount;
          }
        });
      });
      
      const formattedMonthlyData = Object.entries(salesByMonth).map(([month, data]) => ({
        month: new Date(`${month}-01T00:00:00`).toLocaleString('es-UY', { month: 'short', year: '2-digit' }),
        ventas: data.sales,
        pagos: data.payments,
      }));
      setMonthlyChartData(formattedMonthlyData);

      if (kpiResult.data.ventasTotales > 0) {
        setPaymentPieChartData([
          { name: 'Pagado', value: kpiResult.data.montoPagado, fill: 'hsl(var(--chart-2))' },
          { name: 'Pendiente', value: kpiResult.data.totalPendiente > 0 ? kpiResult.data.totalPendiente : 0, fill: 'hsl(var(--chart-5))' },
        ]);
      } else {
         setPaymentPieChartData([]);
      }

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError("No se pudieron cargar los datos del panel. Intenta de nuevo.");
      toast({ title: "Error de Carga", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight font-headline">
              Panel Principal
            </h1>
        </div>
        <div className="flex gap-2">
         <Link href="/eventos" passHref>
          <Button variant="outline">
            <PartyPopper className="w-4 h-4 mr-2" />
            Gestor de Eventos
          </Button>
        </Link>
         <Link href="/settings" passHref>
          <Button variant="outline">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Configuración
          </Button>
        </Link>
        </div>
      </div>
      <CardDescription className="text-lg">
        Visualiza las métricas clave de tu actividad económica y toma decisiones informadas.
      </CardDescription>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <CardTitle>Error</CardTitle>
          <AlertDescriptionShadcn>{error} <Button variant="link" onClick={fetchDashboardData} className="p-0 h-auto">Reintentar</Button></AlertDescriptionShadcn>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales)} icon={TrendingUp} isLoading={isLoading} description="Suma de todas las facturas generadas."/>
        <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos} icon={Briefcase} isLoading={isLoading} description="Presupuestos enviados o en borrador." />
        <KpiCard title="Eventos Futuros" value={kpiData?.fiestasFuturas} icon={PartyPopper} isLoading={isLoading} description="Eventos activos en planificación."/>
        <KpiCard title="Clientes Activos" value={kpiData?.clientesActivos} icon={Users} isLoading={isLoading} description="Clientes con eventos futuros."/>
      </div>
      
      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Análisis Gráfico</CardTitle>
          <CardDescription>Visualizaciones de la evolución financiera y rendimiento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          <MonthlySalesChart data={monthlyChartData} />
          <PaymentStatusPieChart data={paymentPieChartData} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
           <Info className="w-4 h-4 mr-2"/> Gráficos basados en los últimos 12 meses y estado actual de pagos.
        </CardFooter>
      </Card>
      
      <Separator className="my-6" />

      <div className="space-y-4">
         <h2 className="text-2xl font-semibold tracking-tight font-headline">Accesos Directos</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accesosDirectosItems.map((item) => (
            <Card key={item.title} className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <item.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline text-lg mb-1">{item.title}</CardTitle>
                </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                </CardContent>
                <CardFooter className="pt-2">
                <Link href={item.href} passHref className="w-full">
                    <Button variant="default" className="w-full">
                    {item.actionLabel} <ArrowRight className="w-4 h-4 ml-2"/>
                    </Button>
                </Link>
                </CardFooter>
            </Card>
            ))}
            <Card className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300 border-dashed border-primary/50">
                <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
                    <div className="p-3 bg-primary/10 rounded-lg"><Wand2 className="w-7 h-7 text-primary"/></div>
                    <div><CardTitle className="font-headline text-lg mb-1">Simulador de Presupuesto</CardTitle></div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2"><p className="text-sm text-muted-foreground">Herramienta para que tus clientes generen una estimación rápida.</p></CardContent>
                <CardFooter className="pt-2 flex flex-col gap-2">
                    <div className="flex gap-2 w-full">
                        <Button asChild className="w-full" variant="default">
                          <Link href="/simulador-de-presupuesto" target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-2"/>Abrir
                          </Link>
                        </Button>
                        <ShareLinkDialog relativePath="/simulador-de-presupuesto" title="Compartir Simulador" description="Comparte este enlace para que tus clientes puedan generar un presupuesto estimado.">
                            <Button variant="outline" className="w-full"><Share2 className="w-4 h-4 mr-2"/>Compartir</Button>
                        </ShareLinkDialog>
                    </div>
                    <Button asChild className="w-full" variant="secondary">
                        <Link href="/settings/budget-display">
                            <SettingsIcon className="w-4 h-4 mr-2"/>Configurar
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
