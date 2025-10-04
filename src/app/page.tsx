
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, BarChart3, Settings, Building2, PlusCircle, FileText as FileTextIcon, CalendarClock, Briefcase, CheckCircle, TrendingUp, Banknote, Users, LogOut, Sparkles, Wand2, Bot, Share2, Eye, FilePlus2, MessageSquareText, ListChecks, Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { useToast } from '@/hooks/use-toast';
import { triggerAppLogout } from '@/components/auth-guard';
import { ShareLinkDialog } from '@/components/dashboard/ShareLinkDialog';
import { getDashboardKpiData } from '@/app/actions/dashboard'; 
import { getFiestas } from '@/app/actions/fiesta-actual';
import { checkAndCreateTaskReminders } from '@/app/actions/notifications';
import type { FiestaEnPlanificacion, Tarea, Reunion } from '@/types/fiesta';

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const modules: ModuleCardProps[] = [
  { title: "Gestor de Eventos", description: "Organiza tus eventos, el actual y los pasados. Accede al Calendario General.", href: "/eventos", icon: CalendarClock },
  { title: "Contabilidad y Finanzas", description: "Accede al CRM, facturas y reportes.", href: "/empresa/contabilidad", icon: BarChart3 },
  { title: "Gestión de Empresa", description: "Administra personal, proveedores, menús y tu catálogo de servicios.", href: "/empresa", icon: Building2 },
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
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Sin fecha";
  return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}


export default function DashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeFiesta, setActiveFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Tarea[]>([]);
  const [upcomingReuniones, setUpcomingReuniones] = useState<Reunion[]>([]);
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
      checkAndCreateTaskReminders().catch(err => console.warn("Failed to check task reminders:", err));

      const [kpiResult, fiestasActivas] = await Promise.all([
        getDashboardKpiData(),
        getFiestas(false) // solo activas
      ]); 
      if (kpiResult.success && kpiResult.data) {
        setKpiData(kpiResult.data);
      } else {
        throw new Error(kpiResult.error || "Failed to fetch dashboard data.");
      }
      
      const fiestaActual = fiestasActivas.length > 0 ? fiestasActivas[0] : null;
      setActiveFiesta(fiestaActual);

      if (fiestaActual) {
        const now = new Date();
        if(fiestaActual.tareas) {
          const pendingTasks = fiestaActual.tareas
            .filter(t => !t.completada && t.fechaLimite && new Date(t.fechaLimite) >= now)
            .sort((a,b) => new Date(a.fechaLimite!).getTime() - new Date(b.fechaLimite!).getTime());
          setUpcomingTasks(pendingTasks.slice(0, 3));
        }

         if(fiestaActual.reuniones) {
          const pendingReuniones = fiestaActual.reuniones
            .filter(r => r.fecha && new Date(r.fecha) >= now)
            .sort((a,b) => new Date(a.fecha!).getTime() - new Date(b.fecha!).getTime());
          setUpcomingReuniones(pendingReuniones.slice(0, 3));
        }
      } else {
        setUpcomingTasks([]);
        setUpcomingReuniones([]);
      }

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
          <h2 className="text-xl md:text-2xl font-bold tracking-tight font-headline text-foreground mb-1">
            AK Producciones
          </h2>
          <p className="text-lg text-muted-foreground">Servicio integral de fiestas</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
            <Link href="/presupuestos/nuevo" passHref className="flex-1">
                <Button size="lg" className="w-full h-full text-base py-3">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Crear Nuevo Presupuesto
                </Button>
            </Link>
            <Button onClick={handleLogoutClick} variant="outline" size="lg" className="h-full py-3 text-base">
                <LogOut className="w-5 h-5 mr-2" />
            </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Clientes Activos" value={kpiData.clientesActivos} icon={Users} isLoading={isLoading} description="Clientes con estado 'Actual'." />
        <KpiCard title="Prospectos Activos" value={kpiData.prospectosActivos} icon={Briefcase} isLoading={isLoading} description="Presupuestos enviados o en borrador." />
        <KpiCard title="Fiestas Futuras" value={kpiData.fiestasFuturas} icon={CheckCircle} isLoading={isLoading} description="Eventos en planificación activa." />
        <KpiCard title="Fiestas Pasadas" value={kpiData.fiestasPasadas} icon={CalendarClock} isLoading={isLoading} description="Eventos completados y archivados." />
        <KpiCard title="Saldo Pendiente General" value={formatCurrency(kpiData.totalPendiente)} icon={Banknote} isLoading={isLoading} description="De todas las facturas no saldadas." className="bg-primary/5 border-primary/20"/>
      </div>
      
      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Próximas Tareas y Reuniones del Evento Actual</CardTitle>
                <CardDescription>Resumen de tus próximos compromisos para "{activeFiesta?.configuracion.nombreEvento || 'ningún evento activo'}".</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><ListChecks className="w-5 h-5 text-primary"/> Tareas Pendientes</h4>
                    {upcomingTasks.length > 0 ? (
                        <ul className="space-y-2 text-sm">{upcomingTasks.map(t=>(<li key={t.id} className="flex items-center gap-2"><span className="font-medium text-primary/80">{formatDate(t.fechaLimite)}</span><span>{t.texto}</span></li>))}</ul>
                    ) : <p className="text-sm text-muted-foreground italic">No hay tareas próximas para el evento actual.</p>}
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><MessageSquareText className="w-5 h-5 text-primary"/> Reuniones Agendadas</h4>
                    {upcomingReuniones.length > 0 ? (
                        <ul className="space-y-2 text-sm">{upcomingReuniones.map(r=>(<li key={r.id} className="flex items-center gap-2"><span className="font-medium text-primary/80">{formatDate(r.fecha)}</span><span>{r.titulo}</span></li>))}</ul>
                    ) : <p className="text-sm text-muted-foreground italic">No hay reuniones próximas para el evento actual.</p>}
                </div>
            </CardContent>
             <CardFooter>
                <Link href={activeFiesta ? `/fiestas/nueva?fiestaId=${activeFiesta.id}` : '/eventos'} passHref>
                    <Button variant="outline" size="sm">Ir al Planificador de Evento</Button>
                </Link>
            </CardFooter>
        </Card>
        
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center gap-2"><Wand2 className="text-primary"/>Simulador de Presupuesto</CardTitle>
                </CardHeader>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button asChild className="w-full">
                        <Link href="/simulador-de-presupuesto" target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-2"/> Ver</Link>
                    </Button>
                    <ShareLinkDialog relativePath="/simulador-de-presupuesto" title="Compartir Simulador" description="Comparte este enlace para que tus clientes puedan generar un presupuesto estimado.">
                        <Button variant="outline" className="w-full sm:w-auto"><Share2 className="w-4 h-4 mr-2"/>Compartir</Button>
                    </ShareLinkDialog>
                </CardFooter>
            </Card>
        </div>
      </div>
      
      <div className="pt-4">
        <h3 className="text-2xl font-semibold text-foreground mb-4 font-headline text-center">Módulos Principales</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </div>
    </div>
  );
}
