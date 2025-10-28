
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
    MessageSquareText
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { MonthlySalesChart } from '@/components/charts/MonthlySalesChart';
import { PaymentStatusPieChart } from '@/components/charts/PaymentStatusPieChart';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(value);
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
      title: "Portal del Cliente y Reuniones",
      description: "Agenda reuniones y configura el portal privado para tus clientes.",
      href: "/fiestas/nueva/reuniones",
      icon: MessageSquareText,
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

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-4">
                <MonthlySalesChart data={kpiData?.monthlyChartData || []} />
            </div>
            <div className="lg:col-span-3">
                <PaymentStatusPieChart data={pieChartData} />
            </div>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2">
        <KpiCard title="Eventos Pasados" value={kpiData?.fiestasPasadas ?? '...'} icon={Archive} isLoading={isLoading} description="Total de eventos archivados."/>
        <KpiCard title="Eventos Futuros" value={kpiData?.fiestasFuturas ?? '...'} icon={CalendarClock} isLoading={isLoading} description="Eventos en planificación activa."/>
      </div>

      <Separator className="my-8"/>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/presupuestos/nuevo/crear" passHref>
          <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2"><ListChecks className="w-6 h-6 text-primary"/> Crear Presupuesto Detallado</CardTitle>
              <CardDescription>Genera un presupuesto manual seleccionando servicios del catálogo.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/simulador-de-presupuesto" passHref>
          <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2"><Wand2 className="w-6 h-6 text-primary"/> Ir al Simulador Rápido</CardTitle>
              <CardDescription>Herramienta para que los clientes armen su presupuesto estimado.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

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
