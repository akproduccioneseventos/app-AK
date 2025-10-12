
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Users, DollarSign, ListChecks, BarChart3, Building2, PartyPopper, Settings, BrainCircuit, ShoppingCart } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { useToast } from '@/hooks/use-toast';
import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { getOcupiedDates } from '@/app/actions/agenda';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
};

const navigationCards = [
    { title: "Planificador de Eventos", href: "/eventos", icon: PartyPopper, description: "Gestiona eventos activos y archivados." },
    { title: "Gestión de la Empresa", href: "/empresa", icon: Building2, description: "Servicios, personal, proveedores y más." },
    { title: "Panel Contable", href: "/empresa/contabilidad", icon: BarChart3, description: "CRM, presupuestos, facturas y finanzas." },
    { title: "Compras y Checklist", href: "/compras", icon: ShoppingCart, description: "Listas de compras de todos los módulos." },
    { title: "Asistente IA", href: "/admin/aaiff-fiesta", icon: BrainCircuit, description: "Analiza el estado de tu aplicación." },
    { title: "Configuración General", href: "/settings", icon: Settings, description: "Ajustes de la aplicación y cuenta." },
];

export default function DashboardPage() {
    const { toast } = useToast();
    const [kpiData, setKpiData] = useState<any>(null);
    const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [kpiResult, datesResult] = await Promise.all([
                getDashboardKpiData(),
                getOcupiedDates()
            ]);

            if (kpiResult.success) {
                setKpiData(kpiResult.data);
            } else {
                toast({ title: "Error", description: kpiResult.error, variant: "destructive"});
            }
            setOccupiedDates(datesResult.map(d => new Date(d)));
        } catch (error: any) {
            toast({ title: "Error", description: "No se pudieron cargar los datos del dashboard.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Menú Principal</h1>
                <p className="text-muted-foreground">Bienvenido/a a AK Producciones. Aquí tienes un resumen de tu negocio.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Eventos Futuros" value={kpiData?.fiestasFuturas || 0} icon={CalendarClock} isLoading={isLoading} description="Eventos activos en planificación."/>
                <KpiCard title="Prospectos Activos" value={kpiData?.prospectosActivos || 0} icon={Users} isLoading={isLoading} description="Presupuestos enviados o en borrador."/>
                <KpiCard title="Ventas Totales" value={formatCurrency(kpiData?.ventasTotales)} icon={DollarSign} isLoading={isLoading} description="Suma de todas las facturas generadas."/>
                <KpiCard title="Saldo Pendiente" value={formatCurrency(kpiData?.totalPendiente)} icon={DollarSign} isLoading={isLoading} description="De todas las facturas no saldadas."/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {navigationCards.map((card) => (
                        <Link key={card.title} href={card.href} passHref>
                           <Card className="shadow-md hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer h-full flex flex-col">
                                <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <card.icon className="w-6 h-6 text-primary"/>
                                    </div>
                                    <CardTitle className="font-headline text-lg">{card.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{card.description}</p>
                                </CardContent>
                           </Card>
                        </Link>
                    ))}
                </div>
                <Card className="shadow-lg flex flex-col">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Calendario de Eventos</CardTitle>
                        <CardDescription>Fechas con eventos confirmados.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center">
                        <DashboardCalendar occupiedDates={occupiedDates} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
