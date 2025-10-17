'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, FileText, KanbanSquare, ListChecks, TrendingUp, DollarSign, CreditCard, Banknote, Users, Loader2, Wand2, PlusCircle, Calculator } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getDashboardKpiData, type MonthlyChartData } from '@/app/actions/dashboard';
import { MonthlySalesChart } from '@/components/charts/MonthlySalesChart';
import { PaymentStatusPieChart } from '@/components/charts/PaymentStatusPieChart';

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(value);
};


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

      <Card>
          <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/contabilidad/crm" passHref><Button variant="secondary"><KanbanSquare className="w-4 h-4 mr-2"/>CRM de Prospectos</Button></Link>
            <Link href="/presupuestos/nuevo" passHref><Button variant="secondary"><ListChecks className="w-4 h-4 mr-2"/>Central de Presupuestos</Button></Link>
            <Link href="/presupuestos/nuevo/crear" passHref><Button variant="secondary"><PlusCircle className="w-4 h-4 mr-2"/>Crear Presupuesto Manual</Button></Link>
            <Link href="/invoices" passHref><Button variant="secondary"><FileText className="w-4 h-4 mr-2"/>Gestión de Facturas</Button></Link>
            <Link href="/empresa/contabilidad/gastos" passHref><Button variant="secondary"><Calculator className="w-4 h-4 mr-2"/>Gastos Generales</Button></Link>
            <Link href="/simulador-de-presupuesto" target="_blank" passHref><Button variant="outline"><Wand2 className="w-4 h-4 mr-2"/>Abrir Simulador</Button></Link>
            <Link href="/empresa/contabilidad/reportes" passHref><Button variant="outline"><TrendingUp className="w-4 h-4 mr-2"/>Reporte G&P</Button></Link>
          </CardContent>
      </Card>


       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales)} icon={DollarSign} isLoading={isLoading} description="Suma de todas las facturas generadas."/>
        <KpiCard title="Total Pagado" value={formatCurrency(kpiData?.montoPagado)} icon={CreditCard} isLoading={isLoading} description="Dinero recibido de los clientes."/>
        <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente)} icon={Banknote} isLoading={isLoading} description="Monto por cobrar."/>
        <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos ?? '...'} icon={Users} isLoading={isLoading} description="Clientes potenciales en el embudo de ventas."/>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 lg:col-span-4">
            <MonthlySalesChart data={kpiData?.monthlyChartData || []} />
        </div>
        <div className="col-span-1 lg:col-span-3">
            <PaymentStatusPieChart data={pieChartData} />
        </div>
      </div>
    </div>
  );
}