
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, CircleDollarSign, Settings, Building2, ClipboardList, Users, PlusCircle, PartyPopper, MapPin, FileText as FileTextIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
// import { DashboardCalendar } from '@/components/dashboard-calendar'; // Original import
import { CountdownTimer } from '@/components/countdown-timer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic'; // Import dynamic

const DashboardCalendar = dynamic(() => 
  import('@/components/dashboard-calendar').then(mod => mod.DashboardCalendar), 
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[304px] w-full max-w-[274px] mx-auto rounded-md border shadow-sm" /> 
  }
);

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null || amount === '') return "N/A";
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "N/A";
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(numericAmount);
};

const formatDate = (dateString?: string, includeTime = false, time?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    const date = new Date(dateString);
    let options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: 'long', day: 'numeric'
    };
    let datePart = date.toLocaleDateString('es-ES', options);
    if (includeTime && time) {
      return `${datePart} a las ${time}`;
    }
    return datePart;
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
  const [linkedClient, setLinkedClient] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLinkedClient(null);
    try {
      const fiesta = await getFiestaActual();
      setFiestaActual(fiesta);

      if (fiesta?.configuracion?.clienteId) {
        const clientDetails = await getCustomerById(fiesta.configuracion.clienteId);
        setLinkedClient(clientDetails);
      }

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
    { title: "Planificador de Fiestas", description: "Visualiza y organiza todos tus eventos.", href: "/eventos", icon: CalendarDays },
    { title: "Contabilidad", description: "Administra presupuestos, facturas, pagos y clientes.", href: "/empresa/contabilidad", icon: CircleDollarSign },
    { title: "Gestión de Empresa", description: "Administra personal, proveedores y catálogo de servicios.", href: "/empresa", icon: Building2 },
    { title: "Configuración", description: "Ajusta las preferencias de la aplicación.", href: "/settings", icon: Settings },
  ];

  const isFiestaConfigured = fiestaActual && fiestaActual.configuracion.nombreEvento && fiestaActual.configuracion.nombreEvento !== "Mi Próximo Evento Increíble";


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">¡Bienvenido de nuevo!</h2>
          <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad y accesos directos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/fiestas/nueva/configuracion" passHref className="w-full sm:w-auto">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-5 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 w-full">
                  <PlusCircle className="w-6 h-6 mr-2.5" />
                  Iniciar Planificación de Fiesta
              </Button>
          </Link>
          <Link href="/presupuestos/nuevo" passHref className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="rounded-full px-6 py-5 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-primary text-primary hover:bg-primary/5 w-full">
                  <FileTextIcon className="w-6 h-6 mr-2.5" />
                  Crear Nuevo Presupuesto
              </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] lg:col-span-2" />
          <Skeleton className="h-[300px]" />
        </div>
      ) : isFiestaConfigured && fiestaActual ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-xl border-t-4 border-primary bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                 <div>
                  <CardTitle className="font-headline text-xl md:text-2xl text-primary flex items-center gap-2">
                     <PartyPopper className="w-7 h-7"/> Fiesta Actual en Planificación
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">Resumen del evento actual.</CardDescription>
                </div>
                <Link href="/fiestas/nueva" passHref>
                  <Button variant="default" size="sm">Ir al Planificador</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">{fiestaActual.configuracion.nombreEvento}</h3>
                {linkedClient && (
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Cliente:</span> {linkedClient.name || linkedClient.companyName}
                    </p>
                )}
                <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Tipo:</span> {fiestaActual.configuracion.tipoCelebracion}
                </p>
                <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Fecha:</span> {formatDate(fiestaActual.configuracion.fechaEvento, true, fiestaActual.configuracion.horaInicio)}
                </p>
                {fiestaActual.configuracion.nombreLugar && (
                     <div className="text-sm text-muted-foreground flex items-start">
                        <MapPin className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0"/>
                        <div>
                            <span className="font-medium">Lugar:</span> {fiestaActual.configuracion.nombreLugar}
                        </div>
                    </div>
                )}
              <div className="pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Cuenta Regresiva:</p>
                <CountdownTimer targetDate={fiestaActual.configuracion.fechaEvento} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hidden lg:block">
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-lg">Calendario del Evento</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex justify-center">
              <DashboardCalendar eventDate={fiestaActual.configuracion.fechaEvento ? new Date(fiestaActual.configuracion.fechaEvento).toISOString() : undefined} />
            </CardContent>
             <CardFooter className="pt-3 text-center">
                <p className="text-xs text-muted-foreground">Fecha del evento marcada.</p>
             </CardFooter>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-10 shadow-md col-span-full bg-muted/30">
          <CardHeader>
            <PartyPopper className="w-12 h-12 mx-auto text-primary mb-3"/>
            <CardTitle className="font-headline text-xl">¡Comienza tu Próximo Evento!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Parece que no hay una fiesta configurada o la actual está con datos por defecto.
              <br/>
              Haz clic en "Iniciar Planificación de Fiesta" arriba para empezar o configura la actual desde el Planificador.
            </p>
            <Link href="/fiestas/nueva" passHref>
              <Button size="sm" variant="outline">
                Ir al Planificador Actual
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progreso de Tareas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksPending} <span className="text-sm font-normal text-muted-foreground">tareas pendientes</span></div>
              <Progress value={taskProgress} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{taskProgress.toFixed(0)}% completado para el evento actual.</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto Actual</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(fiestaActual?.configuracion.presupuestoEstimado)}</div>
              <p className="text-xs text-muted-foreground">Estimado para "{fiestaActual?.configuracion.nombreEvento || 'Evento Actual'}"</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Invitados (Actual)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fiestaActual?.invitados?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Invitaciones registradas para el evento.</p>
            </CardContent>
          </Card>
        </div>

      <div className="pt-8">
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
