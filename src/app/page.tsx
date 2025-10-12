
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ListChecks, KanbanSquare, BarChart3, TrendingUp, Wand2, Calculator, ArrowRight, PartyPopper, Users } from 'lucide-react';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MonthlySalesChart, type MonthlyChartData } from '@/components/charts/MonthlySalesChart';
import { PaymentStatusPieChart, type PaymentPieChartData } from '@/components/charts/PaymentStatusPieChart';
import { getInvoices } from '@/app/actions/invoices';
import { subMonths, format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface KpiData {
  fiestasFuturas: number;
  ventasTotales: number;
  montoPagado: number;
  totalPendiente: number;
  prospectosActivos: number;
}

const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};


const contabilidadHubItems = [
    {
      title: 'Gestión de Prospectos (CRM)',
      description: 'Mueve prospectos a través de las etapas de venta, desde la consulta hasta el contrato.',
      href: '/contabilidad/crm',
      icon: KanbanSquare,
      actionLabel: 'Ir al CRM'
    },
    {
      title: 'Central de Presupuestos',
      description: 'Crea, edita y gestiona todos los presupuestos para tus clientes.',
      href: '/presupuestos/nuevo',
      icon: ListChecks,
      actionLabel: 'Gestionar Presupuestos'
    },
    {
      title: 'Gestión de Facturas',
      description: 'Emite facturas a partir de presupuestos, registra pagos y sigue el estado de cuenta.',
      href: '/invoices',
      icon: FileText,
      actionLabel: 'Ir a Facturas'
    },
    {
      title: 'Simulador de Presupuesto',
      description: 'Una herramienta rápida para que los clientes obtengan una cotización instantánea.',
      href: '/simulador-de-presupuesto',
      icon: Wand2,
      actionLabel: 'Probar Simulador'
    }
]

export default function ContabilidadDashboardPage() {
    const [kpiData, setKpiData] = useState<KpiData | null>(null);
    const [chartData, setChartData] = useState<MonthlyChartData[]>([]);
    const [pieData, setPieData] = useState<PaymentPieChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [kpiResult, invoices] = await Promise.all([getDashboardKpiData(), getInvoices()]);
            if (kpiResult.success && kpiResult.data) {
                setKpiData(kpiResult.data as KpiData);
                const pieChartData: PaymentPieChartData[] = [
                  { name: 'Pagado', value: kpiResult.data.montoPagado, fill: 'hsl(var(--chart-2))' },
                  { name: 'Pendiente', value: kpiResult.data.totalPendiente, fill: 'hsl(var(--chart-5))' },
                ];
                setPieData(pieChartData);
            }

            const now = new Date();
            const monthlyData: { [key: string]: { ventas: number; pagos: number } } = {};
            for (let i = 11; i >= 0; i--) {
                const month = subMonths(now, i);
                const monthKey = format(month, 'yyyy-MM');
                monthlyData[monthKey] = { ventas: 0, pagos: 0 };
            }

            invoices.forEach(invoice => {
                if (['Sent', 'Viewed', 'Paid', 'Overdue'].includes(invoice.status)) {
                    const issueMonthKey = format(new Date(invoice.issueDate), 'yyyy-MM');
                    if (monthlyData[issueMonthKey]) {
                        monthlyData[issueMonthKey].ventas += invoice.totalAmount;
                    }
                }
                invoice.payments?.forEach(payment => {
                    const paymentMonthKey = format(new Date(payment.paymentDate), 'yyyy-MM');
                     if (monthlyData[paymentMonthKey]) {
                        monthlyData[paymentMonthKey].pagos += payment.amount;
                    }
                });
            });

            const chartFormattedData = Object.keys(monthlyData).map(key => ({
                month: format(startOfMonth(new Date(key)), 'MMM', { locale: es }),
                ...monthlyData[key]
            }));
            setChartData(chartFormattedData);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Panel Principal
            </h1>
        </div>
        <Link href="/eventos" passHref>
          <Button variant="outline">
            <PartyPopper className="w-4 h-4 mr-2" />
            Gestor de Eventos
          </Button>
        </Link>
      </div>
      <CardDescription className="text-lg">
        Bienvenido/a a AK Producciones. Aquí tienes un resumen de tu negocio.
      </CardDescription>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Eventos Futuros" value={kpiData?.fiestasFuturas || 0} icon={PartyPopper} isLoading={isLoading} description="Eventos activos en planificación."/>
        <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos || 0} icon={Users} isLoading={isLoading} description="Presupuestos enviados o en borrador."/>
        <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales || 0)} icon={TrendingUp} isLoading={isLoading} description="Suma de todas las facturas generadas."/>
        <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente || 0)} icon={Calculator} isLoading={isLoading} description="De todas las facturas no saldadas."/>
      </div>

       <div className="grid gap-4 md:grid-cols-2">
           <MonthlySalesChart data={chartData} />
           <PaymentStatusPieChart data={pieData} />
       </div>

      <div className="grid gap-6 md:grid-cols-2">
        {contabilidadHubItems.map((item) => (
           <Card key={item.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center justify-between pb-3 space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold font-headline">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </CardContent>
            <CardFooter className="pt-3">
                 <Link href={item.href} passHref className="w-full">
                    <Button variant="outline" className="w-full">
                        {item.actionLabel}
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
