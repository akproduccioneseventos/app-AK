
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, CheckCircle, CircleDollarSign, ClipboardList, Users, Settings, Filter, Briefcase, BarChart3, Building2, ListChecks, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { DashboardCalendar } from '@/components/dashboard-calendar';
import { CountdownTimer } from '@/components/countdown-timer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual'; // Assuming this action exists
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null || amount === '') return "N/A";
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "N/A";
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(numericAmount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) { return "Fecha inválida"; }
};

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, href, icon: Icon }) => (
  <Link href={href} passHref>
    <Card className="group flex flex-col h-full shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer">
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
        <Button variant="link" className="p-0 h-auto text-sm text-primary group-hover:underline">
          Acceder al Módulo <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  </Link>
);

export default function DashboardPage() {
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiesta = await getFiestaActual();
      setFiestaActual(fiesta);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error al cargar datos",
        description: "No se pudo obtener la información del evento actual.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const taskProgress = fiestaActual?.tareas ? (
    (fiestaActual.tareas.filter(t => t.completada).length / (fiestaActual.tareas.length || 1)) * 100
  ) : 0;
  const tasksPending = fiestaActual?.tareas ? fiestaActual.tareas.filter(t => !t.completada).length : 0;


  const modules: ModuleCardProps[] = [
    { title: "Planificador de Fiestas", description: "Gestiona todos los detalles de tu evento actual.", href: "/fiestas/nueva", icon: CalendarDays },
    { title: "Facturas", description: "Crea y administra tus facturas emitidas.", href: "/invoices", icon: FileText },
    { title: "Presupuestos", description: "Genera y envía presupuestos a tus clientes.", href: "/presupuestos", icon: ListChecks },
    { title: "Clientes", description: "Consulta y gestiona la información de tus clientes.", href: "/customers", icon: Users },
    { title: "Gestión de Empresa", description: "Administra personal, proveedores y servicios.", href: "/empresa", icon: Building2 },
    { title: "Embudo de Ventas", description: "Sigue el progreso de tus prospectos.", href: "/sales-funnel", icon: Filter },
    { title: "Configuración", description: "Ajusta las preferencias de la aplicación.", href: "/settings", icon: Settings },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">¡Bienvenido de nuevo!</h2>
        <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad y accesos directos.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[260px] lg:col-span-2" />
          <Skeleton className="h-[260px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
      ) : fiestaActual ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg border-t-4 border-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline text-xl text-primary">{fiestaActual.configuracion.nombreEvento}</CardTitle>
                  <CardDescription className="text-sm">{fiestaActual.configuracion.tipoCelebracion} - {formatDate(fiestaActual.configuracion.fechaEvento)}</CardDescription>
                </div>
                <Link href="/fiestas/nueva" passHref>
                  <Button variant="default" size="sm">Abrir Planificador</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Cuenta Regresiva:</p>
                <CountdownTimer targetDate={fiestaActual.configuracion.fechaEvento} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Invitados (Estimados):</p>
                  <p className="font-semibold text-lg">{fiestaActual.configuracion.invitadosEstimados || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Presupuesto Estimado:</p>
                  <p className="font-semibold text-lg">{formatCurrency(fiestaActual.configuracion.presupuestoEstimado)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hidden lg:block">
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-lg">Calendario de Evento</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex justify-center">
              <DashboardCalendar eventDate={fiestaActual.configuracion.fechaEvento ? new Date(fiestaActual.configuracion.fechaEvento) : undefined} />
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progreso de Tareas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksPending} <span className="text-sm font-normal text-muted-foreground">tareas pendientes</span></div>
              <Progress value={taskProgress} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{taskProgress.toFixed(0)}% completado</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto Actual</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(fiestaActual.configuracion.presupuestoEstimado)}</div>
              <p className="text-xs text-muted-foreground">Estimado para "{fiestaActual.configuracion.nombreEvento}"</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Invitados (Actual)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fiestaActual.invitados?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Invitaciones registradas</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-10 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl">No hay fiesta activa en planificación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              ¡Comienza a planificar tu próximo gran evento ahora!
            </p>
            <Link href="/fiestas/nueva/configuracion" passHref>
              <Button size="lg">
                <PlusCircle className="w-5 h-5 mr-2" /> Crear Nueva Fiesta
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="pt-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 font-headline">Módulos Principales</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </div>
    </div>
  );
}

