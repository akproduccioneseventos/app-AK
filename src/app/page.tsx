
'use client';

import { KpiCard } from '@/components/dashboard/kpi-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CalendarDays as CalendarDaysIcon,
  LayoutGrid,
  Loader2,
  PartyPopper,
  Settings as SettingsIcon,
  ShoppingCart,
  BarChart3,
  Building2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardCalendar } from '@/components/dashboard-calendar';
import { getOcupiedDates } from '@/app/actions/agenda';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return "$ 0";
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const menuItems = [
    { href: '/eventos', icon: PartyPopper, title: 'Planificador de Eventos', description: 'Gestiona eventos activos y archivados.' },
    { href: '/empresa', icon: Building2, title: 'Gestión de la Empresa', description: 'Servicios, personal, proveedores y más.' },
    { href: '/empresa/contabilidad', icon: BarChart3, title: 'Panel Contable', description: 'CRM, presupuestos, facturas y finanzas.' },
    { href: '/compras', icon: ShoppingCart, title: 'Compras y Checklist', description: 'Listas de compras de todos los módulos.' },
    { href: '/admin/aaiff-fiesta', icon: BrainCircuit, title: 'Asistente IA', description: 'Analiza el estado de tu aplicación.' },
    { href: '/settings', icon: SettingsIcon, title: 'Configuración General', description: 'Ajustes de la aplicación y cuenta.' },
];

export default function Home() {
  const { toast } = useToast();
  const [kpiData, setKpiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [kpiResult, occupiedDatesStrings] = await Promise.all([
          getDashboardKpiData(),
          getOcupiedDates()
        ]);

        if (kpiResult.success && kpiResult.data) {
            setKpiData(kpiResult.data);
        } else {
            throw new Error(kpiResult.error || "No se pudieron cargar los datos del panel.");
        }
        setOccupiedDates(occupiedDatesStrings.map(d => new Date(d)));
    } catch (e: any) {
        console.error("Error loading dashboard data:", e);
        setError("No se pudo cargar la información del panel.");
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                <LayoutGrid className="w-8 h-8 text-primary"/>
                Menú Principal
            </h1>
            <p className="text-lg text-muted-foreground">Bienvenido/a a AK Producciones. Aquí tienes un resumen de tu negocio.</p>
        </div>

        {error ? (
             <Card className="text-destructive bg-destructive/10 p-6 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                <p className="font-semibold text-lg">{error}</p>
                 <Button onClick={loadData} variant="secondary" className="mt-4">Reintentar</Button>
            </Card>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Eventos Futuros" value={kpiData?.fiestasFuturas} icon={PartyPopper} isLoading={isLoading} description="Eventos activos en planificación."/>
                <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos} icon={Users} isLoading={isLoading} description="Presupuestos enviados o en borrador."/>
                <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales)} icon={ArrowRight} isLoading={isLoading} description="Suma de todas las facturas generadas."/>
                <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente)} icon={ArrowRight} isLoading={isLoading} description="De todas las facturas no saldadas."/>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                 {menuItems.map((item) => (
                    <Card key={item.href} className="flex flex-col shadow-md hover:shadow-xl transition-shadow">
                       <CardHeader className="flex-row items-start gap-3 space-y-0 pb-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <item.icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-lg">{item.title}</CardTitle>
                       </CardHeader>
                       <CardContent className="flex-grow">
                          <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>
                       </CardContent>
                       <CardFooter className="pt-2">
                           <Link href={item.href} passHref className="w-full">
                                <Button variant="secondary" className="w-full">Ir</Button>
                           </Link>
                       </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="lg:col-span-1 shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-primary"/>
                        Calendario de Eventos
                    </CardTitle>
                    <CardDescription>Fechas con eventos confirmados.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    {isLoading ? <Loader2 className="animate-spin w-8 h-8"/> : <DashboardCalendar occupiedDates={occupiedDates} />}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
