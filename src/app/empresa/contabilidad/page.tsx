'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, FileText, KanbanSquare, ListChecks, TrendingUp, DollarSign, CreditCard, Banknote, Users, Loader2, Wand2, Calculator, TrendingDown, History } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { getCrmKpiData } from '@/app/actions/crm';
import { MonthlySalesChart } from '@/components/charts/MonthlySalesChart';
import { PaymentStatusPieChart } from '@/components/charts/PaymentStatusPieChart';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
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
        title: "Fiestas Históricas",
        description: "Base de datos de eventos pasados para generar presupuestos futuros con ajuste del 15%.",
        href: "/contabilidad/fiestas-historicas",
        icon: History
    },
    {
        title: "Reporte de Ganancias y Pérdidas",
        description: "Analiza la rentabilidad de tu negocio en un período determinado.",
        href: "/empresa/contabilidad/reportes",
        icon: TrendingDown
    }
];

export default function ContabilidadHubPage() {
    const [kpiData, setKpiData] = useState<any>(null);
    const [crmKpiData, setCrmKpiData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [dashboardResult, crmResult] = await Promise.all([
          getDashboardKpiData(),
          getCrmKpiData()
        ]);
        if (dashboardResult.success) {
            setKpiData(dashboardResult.data);
        }
        if(crmResult.success) {
            setCrmKpiData(crmResult.data);
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
        <KpiCard title="Valor en Propuestas" value={formatCurrency(crmKpiData?.pipelineValue)} icon={Users} isLoading={isLoading} description="Suma de presupuestos activos."/>
        <KpiCard title="Tasa de Conversión CRM" value={`${(crmKpiData?.conversionRate ?? 0).toFixed(1)}%`} icon={TrendingUp} isLoading={isLoading} description="De prospectos a clientes."/>
        <KpiCard title="Saldo Pendiente Total" value={formatCurrency(kpiData?.totalPendiente)} icon={Banknote} isLoading={isLoading} description="Monto total por cobrar."/>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-4">
                <MonthlySalesChart data={kpiData?.monthlyChartData || []} />
            </div>
            <div className="lg:col-span-3">
                <PaymentStatusPieChart data={pieChartData} />
            </div>
        </div>

      <Separator />

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
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
         <Card className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-headline text-lg">Simulador y Paquetes</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">Accede a la herramienta pública o configura los paquetes y precios que se ofrecen.</p>
            </CardContent>
            <CardFooter className="pt-3 flex flex-col sm:flex-row gap-2">
              <Link href="/simulador-de-presupuesto" passHref className="w-full">
                <Button variant="secondary" className="w-full">
                  Ir al Simulador
                </Button>
              </Link>
              <Link href="/settings/budget-display" passHref className="w-full">
                <Button variant="outline" className="w-full">
                  Configurar Paquetes
                </Button>
              </Link>
            </CardFooter>
          </Card>
      </div>
    </div>
  );
}
