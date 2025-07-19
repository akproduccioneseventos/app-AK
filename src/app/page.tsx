
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, CircleDollarSign, Settings, Building2, PlusCircle, FileText as FileTextIcon, CalendarClock, Briefcase, CheckCircle, TrendingUp, Banknote, Users, LogOut, Sparkles, Wand2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getCustomers } from '@/app/actions/customers';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getInvoices } from '@/app/actions/invoices';
import { getFiestaActual, getHistorialFiestas } from '@/app/actions/fiesta-actual';
import { useToast } from '@/hooks/use-toast';
import { triggerAppLogout } from '@/components/auth-guard';

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const modules: ModuleCardProps[] = [
  { title: "Planificador de fiestas en general", description: "Visualiza y organiza todos tus eventos, el actual y los pasados.", href: "/eventos", icon: CalendarDays },
  { title: "Contabilidad y CRM", description: "Gestiona presupuestos, facturas, pagos y tu embudo de ventas.", href: "/empresa/contabilidad", icon: CircleDollarSign },
  { title: "Gestión de Empresa", description: "Administra personal, proveedores y tu catálogo de servicios.", href: "/empresa", icon: Building2 },
  { title: "Configuración General", description: "Ajusta las preferencias de la aplicación y plantillas de documentos.", href: "/settings", icon: Settings },
];

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, href, icon: Icon }) => (
    <Link href={href} className="group flex flex-col h-full no-underline">
    <Card className="flex flex-col h-full shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-headline text-lg text-foreground group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium text-primary group-hover:underline">
            Acceder al Módulo <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </CardFooter>
    </Card>
  </Link>
);

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return "N/A";
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    fiestasPasadas: 0,
    fiestasFuturas: 0,
    clientesActivos: 0,
    prospectosActivos: 0,
    totalPendiente: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
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

      const esFiestaFutura = fiestaActualData?.configuracion?.fechaEvento && new Date(fiestaActualData.configuracion.fechaEvento) >= new Date();
      const clientesActivos = customersData.filter(c => c.estadoCliente === 'Actual').length;
      const prospectosActivos = presupuestosData.filter(p => p.estado === 'Borrador' || p.estado === 'Enviado').length;
      
      const totalPendiente = invoicesData.reduce((total, inv) => {
        const paidOnThisInvoice = inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
        const dueOnThisInvoice = inv.totalAmount - paidOnThisInvoice;
        return total + (dueOnThisInvoice > 0 ? dueOnThisInvoice : 0);
      }, 0);

      setKpiData({
        fiestasPasadas: historialFiestasData.length,
        fiestasFuturas: esFiestaFutura ? 1 : 0,
        clientesActivos,
        prospectosActivos,
        totalPendiente,
      });

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      toast({ title: "Error de Carga", description: "No se pudieron cargar los datos del dashboard.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogoutClick = () => {
    triggerAppLogout();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline text-foreground mb-1">¡Bienvenido a tu Centro de Gestión!</h2>
          <p className="text-lg text-muted-foreground">Un resumen de tu actividad y accesos directos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <Link href="/asistente-ak/cotizador" passHref className="w-full sm:w-auto">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full px-4 py-3 text-base sm:px-6 sm:py-5 sm:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 w-full">
                  <Wand2 className="w-6 h-6 mr-2.5" />
                  Armado Rápido de Presupuesto
              </Button>
          </Link>
           <Button onClick={handleLogoutClick} variant="destructive" size="lg" className="rounded-full px-4 py-3 text-base sm:px-6 sm:py-5 sm:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 w-full sm:w-auto">
                <LogOut className="w-6 h-6 mr-2.5" />
                Cerrar Sesión
            </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Clientes Activos" value={kpiData.clientesActivos} icon={Users} isLoading={isLoading} description="Clientes con estado 'Actual'." />
        <KpiCard title="Prospectos Activos" value={kpiData.prospectosActivos} icon={Briefcase} isLoading={isLoading} description="Presupuestos enviados o en borrador." />
        <KpiCard title="Fiestas Futuras" value={kpiData.fiestasFuturas} icon={CheckCircle} isLoading={isLoading} description="Eventos en planificación actual." />
        <KpiCard title="Fiestas Pasadas" value={kpiData.fiestasPasadas} icon={CalendarClock} isLoading={isLoading} description="Eventos completados y archivados." />
        <KpiCard title="Saldo Pendiente General" value={formatCurrency(kpiData.totalPendiente)} icon={Banknote} isLoading={isLoading} description="De todas las facturas no saldadas." className="bg-primary/5 border-primary/20"/>
      </div>
      
      <Separator />

      <div className="pt-4">
        <h3 className="text-2xl font-semibold text-foreground mb-4 font-headline text-center">Módulos Principales</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </div>
    </div>
  );
}
