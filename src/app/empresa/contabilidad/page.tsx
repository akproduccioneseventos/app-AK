
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ListChecks, FileText as FileTextIcon, Users, KanbanSquare, Loader2, AlertTriangle, TrendingUp, CalendarClock, Briefcase, CheckCircle, CircleDollarSign, BarChart3, ArrowLeft, Info, Palette, Settings as SettingsIcon, Banknote, Sparkles, Wand2, Eye, Share2, Archive, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/types/invoice';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription as AlertDescriptionShadcn } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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
   {
    title: 'Catálogo de Servicios y Precios',
    description: 'Define y gestiona los servicios que ofreces en los presupuestos.',
    href: '/empresa/todos-los-servicios',
    icon: Sparkles,
    actionLabel: 'Gestionar Catálogo',
  },
   {
    title: 'Gestión de Menús de Catering',
    description: 'Crea y edita las plantillas de menús para tus eventos.',
    href: '/empresa/menus',
    icon: ChefHat,
    actionLabel: 'Gestionar Menús',
  },
];


export default function ContabilidadDashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPIs States
  const [kpiData, setKpiData] = useState<any>(null);

  // Chart Data
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
        getInvoices(), // Still need this for the monthly chart
      ]);

      if (!kpiResult.success) {
        throw new Error(kpiResult.error || 'Failed to get KPI data');
      }
      setKpiData(kpiResult.data);
      
      // Prepare data for MonthlySalesChart
      const salesByMonth: { [key: string]: { sales: number, payments: number } } = {};
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${''}${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        salesByMonth[monthKey] = { sales: 0, payments: 0 };
      }

      invoicesData.forEach(inv => {
        const issueMonth = new Date(inv.issueDate);
        const monthKey = `${''}${issueMonth.getFullYear()}-${String(issueMonth.getMonth() + 1).padStart(2, '0')}`;
        if (salesByMonth[monthKey]) {
          salesByMonth[monthKey].sales += inv.totalAmount;
        }
        inv.payments?.forEach(p => {
          const paymentMonth = new Date(p.paymentDate);
          const paymentMonthKey = `${''}${paymentMonth.getFullYear()}-${String(paymentMonth.getMonth() + 1).padStart(2, '0')}`;
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

      // Prepare data for PaymentStatusPieChart using the reliable KPI data
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
              Panel Contable y Financiero
            </h1>
        </div>
         <Link href="/empresa" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Gestión Empresa
          </Button>
        </Link>
      </div>
      <CardDescription className="text-lg">
        Visualiza las métricas clave de tu actividad económica y toma decisiones informadas.
      </CardDescription>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescriptionShadcn>{error} <Button variant="link" onClick={fetchDashboardData} className="p-0 h-auto">Reintentar</Button></AlertDescriptionShadcn>
        </Alert>
      )}

      {/* KPIs Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales Acumuladas" value={formatCurrency(kpiData?.ventasTotales)} icon={TrendingUp} isLoading={isLoading} description="Suma de todas las facturas generadas."/>
        <KpiCard title="Monto Total Pagado" value={formatCurrency(kpiData?.montoPagado)} icon={Banknote} isLoading={isLoading} description="Total de pagos recibidos."/>
        <KpiCard title="Saldo Pendiente General" value={formatCurrency(kpiData?.totalPendiente)} icon={CircleDollarSign} isLoading={isLoading} description="De todas las facturas no saldadas."/>
        <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos} icon={Briefcase} isLoading={isLoading} description="Presupuestos enviados o en borrador." />
      </div>
      
      <Separator className="my-6" />

      {/* Graphs Section */}
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
           <Info className="w-4 h-4 mr-2"/> Gráficos basados en los últimos 12 meses y estado actual de pagos. Filtros se añadirán.
        </CardFooter>
      </Card>
      
      <Separator className="my-6" />

      {/* Quick Access Links */}
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
                <CardContent className="flex-grow space-y-2"><p className="text-sm text-muted-foreground">Configura los paquetes y comparte el enlace del simulador de presupuesto.</p></CardContent>
                <CardFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                   <Button asChild className="w-full" variant="default">
                      <Link href="/simulador-de-presupuesto" target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2"/>Abrir Simulador
                      </Link>
                  </Button>
                  <div className="flex gap-2 w-full">
                    <Link href="/settings/budget-display" passHref className="flex-1"><Button variant="secondary" className="w-full">Configurar</Button></Link>
                    <ShareLinkDialog relativePath="/simulador-de-presupuesto" title="Compartir Simulador" description="Comparte este enlace para que tus clientes puedan generar un presupuesto estimado.">
                        <Button variant="outline" className="w-full">Compartir</Button>
                    </ShareLinkDialog>
                  </div>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
    
