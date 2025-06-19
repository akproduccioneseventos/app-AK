
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ListChecks, FileText as FileTextIcon, Banknote, Users, KanbanSquare, Loader2, AlertTriangle, TrendingUp, CalendarClock, Briefcase, CheckCircle, CircleDollarSign, BarChart3, ArrowLeft, Info, Palette, Settings as SettingsIcon } from 'lucide-react'; // Added Palette and SettingsIcon
import { useToast } from '@/hooks/use-toast';
import { getHistorialFiestas, getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomers } from '@/app/actions/customers';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getInvoices } from '@/app/actions/invoices';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice, Payment } from '@/types/invoice';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription as AlertDescriptionShadcn } from '@/components/ui/alert';
// import { MonthlySalesChart, type MonthlyChartData } from '@/components/charts/MonthlySalesChart'; // Original import
// import { PaymentStatusPieChart, type PaymentPieChartData } from '@/components/charts/PaymentStatusPieChart'; // Original import
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic'; // Import dynamic
import type { MonthlyChartData } from '@/components/charts/MonthlySalesChart'; // Type import
import type { PaymentPieChartData } from '@/components/charts/PaymentStatusPieChart'; // Type import

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
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  isLoading?: boolean;
  className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, description, icon: Icon, isLoading, className }) => (
  <Card className={cn("shadow-md hover:shadow-lg transition-shadow", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-primary" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

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
    title: 'Presupuestos',
    description: 'Crea, gestiona y envía presupuestos detallados a tus clientes.',
    href: '/presupuestos',
    icon: ListChecks,
    actionLabel: 'Ir a Presupuestos',
  },
  {
    title: 'Facturas',
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

  // KPIs States
  const [fiestasPasadas, setFiestasPasadas] = useState(0);
  const [fiestasFuturas, setFiestasFuturas] = useState(0);
  const [clientesActivos, setClientesActivos] = useState(0);
  const [prospectos, setProspectos] = useState(0);
  const [ventasTotales, setVentasTotales] = useState(0);
  const [montoPagado, setMontoPagado] = useState(0);
  const [montoPorPagar, setMontoPorPagar] = useState(0);
  const [ventasProyectadas, setVentasProyectadas] = useState(0);

  // Smart Indicators
  const [ventasPromedioCliente, setVentasPromedioCliente] = useState(0);
  const [tasaConversionProspectos, setTasaConversionProspectos] = useState(0);

  // Chart Data
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlyChartData[]>([]);
  const [paymentPieChartData, setPaymentPieChartData] = useState<PaymentPieChartData[]>([]);


  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        historialFiestasData,
        fiestaActualData,
        customersData,
        presupuestosData,
        invoicesData,
      ] = await Promise.all([
        getHistorialFiestas(),
        getFiestaActual(),
        getCustomers(),
        getPresupuestos(),
        getInvoices(),
      ]);

      // Calculate KPIs
      setFiestasPasadas(historialFiestasData.length);
      const esFiestaFutura = fiestaActualData?.configuracion?.fechaEvento && new Date(fiestaActualData.configuracion.fechaEvento) >= new Date();
      setFiestasFuturas(esFiestaFutura ? 1 : 0);
      setClientesActivos(customersData.filter(c => c.estadoCliente === 'Actual').length);
      
      const prospectosActivos = presupuestosData.filter(p => p.estado === 'Borrador' || p.estado === 'Enviado').length;
      setProspectos(prospectosActivos);
      
      const ventasConfirmadas = presupuestosData
        .filter(p => p.estado === 'Aceptado' || p.estado === 'Facturado')
        .reduce((sum, p) => sum + p.costoTotalEstimado, 0);
      setVentasTotales(ventasConfirmadas);
      
      const totalPaidFromInvoices = invoicesData.reduce(
        (total, inv) => total + (inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0), 0
      );
      setMontoPagado(totalPaidFromInvoices);

      const totalDueFromInvoices = invoicesData.reduce((total, inv) => {
        const paidOnThisInvoice = inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
        const dueOnThisInvoice = inv.totalAmount - paidOnThisInvoice;
        return total + (dueOnThisInvoice > 0 ? dueOnThisInvoice : 0);
      }, 0);
      setMontoPorPagar(totalDueFromInvoices);
      
      setVentasProyectadas(
        presupuestosData
          .filter(p => p.estado === 'Aceptado') 
          .reduce((sum, p) => sum + p.costoTotalEstimado, 0)
      );

      // Calculate Smart Indicators
      const presupuestosAceptadosFacturados = presupuestosData.filter(p => p.estado === 'Aceptado' || p.estado === 'Facturado');
      const clientesUnicos = new Set(presupuestosAceptadosFacturados.map(p => p.clienteNombre)).size;
      setVentasPromedioCliente(clientesUnicos > 0 ? ventasConfirmadas / clientesUnicos : 0);

      const totalPresupuestosNoBorrador = presupuestosData.filter(p => p.estado !== 'Borrador').length;
      setTasaConversionProspectos(totalPresupuestosNoBorrador > 0 ? (presupuestosAceptadosFacturados.length / totalPresupuestosNoBorrador) * 100 : 0);

      // Prepare data for MonthlySalesChart
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
        month: new Date(month + '-01').toLocaleString('es-UY', { month: 'short', year: '2-digit' }),
        ventas: data.sales,
        pagos: data.payments,
      }));
      setMonthlyChartData(formattedMonthlyData);

      // Prepare data for PaymentStatusPieChart
      if (ventasConfirmadas > 0) {
        setPaymentPieChartData([
          { name: 'Pagado', value: totalPaidFromInvoices, fill: 'hsl(var(--chart-2))' },
          { name: 'Pendiente', value: totalDueFromInvoices > 0 ? totalDueFromInvoices : 0, fill: 'hsl(var(--chart-5))' },
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
            Volver a Empresa
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
        <KpiCard title="Fiestas Pasadas" value={fiestasPasadas} icon={CalendarClock} isLoading={isLoading} description="Eventos completados y archivados." />
        <KpiCard title="Fiestas Futuras" value={fiestasFuturas} icon={CheckCircle} isLoading={isLoading} description="Eventos en planificación actual." />
        <KpiCard title="Clientes Activos" value={clientesActivos} icon={Users} isLoading={isLoading} description="Clientes con estado 'Actual'." />
        <KpiCard title="Prospectos Activos" value={prospectos} icon={Briefcase} isLoading={isLoading} description="Presupuestos enviados o en borrador." />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales Acumuladas" value={formatCurrency(ventasTotales)} icon={TrendingUp} isLoading={isLoading} description="Suma de presupuestos aceptados/facturados."/>
        <KpiCard title="Monto Total Pagado" value={formatCurrency(montoPagado)} icon={Banknote} isLoading={isLoading} description="Total de pagos recibidos."/>
        <KpiCard title="Saldo Pendiente General" value={formatCurrency(montoPorPagar)} icon={CircleDollarSign} isLoading={isLoading} description="De todas las facturas no saldadas."/>
        <KpiCard title="Ventas Proyectadas" value={formatCurrency(ventasProyectadas)} icon={TrendingUp} isLoading={isLoading} description="Suma de presupuestos aceptados." />
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

      {/* Indicadores Inteligentes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Indicadores Inteligentes</CardTitle>
          <CardDescription>Métricas clave para la toma de decisiones estratégicas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard title="Venta Promedio / Cliente" value={formatCurrency(ventasPromedioCliente)} icon={CircleDollarSign} isLoading={isLoading} description="Valor medio por cliente con eventos confirmados." className="bg-amber-50 dark:bg-amber-900/20"/>
            <KpiCard title="Tasa Conversión Prospectos" value={`${tasaConversionProspectos.toFixed(1)}%`} icon={CheckCircle} isLoading={isLoading} description="Presupuestos aceptados/facturados vs. total no borrador." className="bg-emerald-50 dark:bg-emerald-900/20"/>
            <KpiCard title="Margen Promedio / Evento" value="N/A" icon={TrendingUp} isLoading={isLoading} description="Requiere costos detallados." className="bg-rose-50 dark:bg-rose-900/20"/>
        </CardContent>
         <CardFooter className="text-sm text-muted-foreground">
           <Info className="w-4 h-4 mr-2"/> Indicadores basados en datos disponibles. "Margen" requiere seguimiento detallado de costos internos.
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
                <CardContent className="pt-2">
                <Link href={item.href} passHref className="w-full">
                    <Button variant="default" className="w-full">
                    {item.actionLabel} <ArrowRight className="w-4 h-4 ml-2"/>
                    </Button>
                </Link>
                </CardContent>
            </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

