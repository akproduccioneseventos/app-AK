
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, FileText, KanbanSquare, ListChecks, TrendingUp, DollarSign, CreditCard, Banknote, Users, Loader2, Wand2, PlusCircle, Calculator, Settings } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getDashboardKpiData, type MonthlyChartData } from '@/app/actions/dashboard';
import { MonthlySalesChart } from '@/components/charts/MonthlySalesChart';
import { PaymentStatusPieChart } from '@/components/charts/PaymentStatusPieChart';

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(value);
};

const financialHubItems = [
    {
        title: "Gestión de Prospectos (CRM)",
        description: "Administra tus clientes potenciales, etapas de venta y agenda reuniones.",
        href: "/contabilidad/crm",
        icon: KanbanSquare
    },
    {
        title: "Central de Presupuestos",
        description: "Crea, edita y gestiona todos los presupuestos para tus clientes.",
        href: "/presupuestos/nuevo",
        icon: ListChecks
    },
    {
        title: "Gestión de Facturas",
        description: "Genera facturas, registra pagos y sigue el estado de cuenta de cada evento.",
        href: "/invoices",
        icon: FileText
    },
    {
        title: "Gastos Generales",
        description: "Registra los costos operativos de tu empresa (compras, reparaciones, etc.).",
        href: "/empresa/contabilidad/gastos",
        icon: Calculator
    },
    {
        title: "Simulador de Presupuesto",
        description: "Accede a la herramienta pública para generar presupuestos rápidos.",
        href: "/simulador-de-presupuesto",
        icon: Wand2
    },
    {
        title: "Configuración del Simulador",
        description: "Ajusta los paquetes, menús y precios del simulador de clientes.",
        href: "/settings/budget-display",
        icon: Settings
    },
    {
        title: "Reporte de Ganancias y Pérdidas",
        description: "Analiza la rentabilidad de tu negocio en un período determinado.",
        href: "/empresa/contabilidad/reportes",
        icon: TrendingUp
    }
];

export default function ContabilidadHubPage() {
    const [kpiData, setKpiData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const result = await getDashboardKpiData();
        if (result.success) {
            setKpiData(result.data);
        }
        setIsLoading(false);
    }, []);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Panel Contable y Financiero
          </h1>
        </div>
        <Link href="/empresa" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Button>
        </Link>
      </div>
      <CardDescription className="text-lg">
        Tu centro de control para todas las operaciones financieras y de ventas.
      </CardDescription>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales)} icon={DollarSign} isLoading={isLoading} description="Suma de todas las facturas generadas."/>
        <KpiCard title="Total Pagado" value={formatCurrency(kpiData?.montoPagado)} icon={CreditCard} isLoading={isLoading} description="Dinero recibido de los clientes."/>
        <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente)} icon={Banknote} isLoading={isLoading} description="Monto por cobrar."/>
        <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos ?? '...'} icon={Users} isLoading={isLoading} description="Clientes potenciales en el embudo de ventas."/>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-4">
                <MonthlySalesChart data={kpiData?.monthlyChartData || []} />
            </div>
            <div className="lg:col-span-3">
                <PaymentStatusPieChart data={pieChartData} />
            </div>
        </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t">
        {financialHubItems.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-headline text-lg">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            </CardContent>
            <CardFooter className="pt-3">
              <Link href={item.href} passHref className="w-full">
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
