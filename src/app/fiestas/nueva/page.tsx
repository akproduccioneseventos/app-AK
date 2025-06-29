
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ListChecks, Users, Palette, Settings2, Globe, FileText, Link as LinkIcon, ExternalLink, Loader2, AlertTriangle, MessageSquareText, LayoutGrid, ChefHat, Users2, Milestone, Image as ImageIcon, CalendarDays, Info, DollarSign, PiggyBank, CreditCard, TimerIcon, ClipboardCheck, Music2, MapPin, Trash2, RefreshCcw, Printer, PartyPopper as PartyPopperIcon, UserCheck, ClipboardList, Archive, PackageSearch, BarChart3, Camera } from 'lucide-react';
import Link from 'next/link';
import { getFiestaActual, resetFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import type { FiestaEnPlanificacion, Tarea } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CountdownTimer } from '@/components/countdown-timer';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Invoice } from '@/types/invoice';
import { getInvoiceById } from '@/app/actions/invoices';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';


interface PlanningModule {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  status: "Disponible" | "Próximamente" | "En Desarrollo";
  actionLabel: string;
}

const planningModules: PlanningModule[] = [
  {
    title: "Configuración del Evento",
    description: "Define detalles generales, fecha, lugar y tipo de celebración.",
    icon: Settings2,
    href: "/fiestas/nueva/configuracion",
    status: "Disponible",
    actionLabel: "Configurar Evento"
  },
  {
    title: "Portal del Cliente",
    description: "Configura lo que tu cliente puede ver y gestiona la página pública del evento.",
    icon: ClipboardCheck,
    href: "/fiestas/nueva/portal-cliente",
    status: "Disponible",
    actionLabel: "Gestionar Portal"
  },
  {
    title: "Galería Social en Vivo",
    description: "Configura una galería interactiva para que los invitados suban fotos durante el evento.",
    icon: Camera,
    href: "/fiestas/nueva/portal-cliente",
    status: "Disponible",
    actionLabel: "Configurar Galería"
  },
  {
    title: "Lista de Tareas del Evento",
    description: "Organiza y sigue el progreso de todas las tareas pendientes para tu fiesta.",
    icon: ListChecks,
    href: "/fiestas/nueva/tareas",
    status: "Disponible",
    actionLabel: "Gestionar Tareas"
  },
  {
    title: "Gestión de Invitados",
    description: "Administra tu lista de invitados, envía invitaciones y gestiona confirmaciones.",
    icon: Users,
    href: "/fiestas/nueva/invitados",
    status: "Disponible",
    actionLabel: "Administrar Invitados"
  },
  {
    title: "Decoración y Diseño del Evento",
    description: "Planifica la estética, decoración por zonas y el diseño funcional del salón.",
    icon: Palette,
    href: "/fiestas/nueva/decoracion",
    status: "Disponible",
    actionLabel: "Definir Diseño y Decoración"
  },
   {
    title: "Carga de Fotos para Video de Vida",
    description: "Gestiona el link para que tu cliente suba las fotos para el video de vida.",
    icon: Camera,
    href: "/fiestas/nueva/video-vida",
    status: "Disponible",
    actionLabel: "Gestionar Carga de Fotos"
  },
  {
    title: "Catering y Menú",
    description: "Crea y gestiona menús personalizados, detallando platos e ingredientes con costos.",
    icon: ChefHat,
    href: "/fiestas/nueva/catering",
    status: "Disponible",
    actionLabel: "Gestionar Menús"
  },
  {
    title: "Música de la Fiesta",
    description: "Define las canciones clave, la playlist principal y la lista de exclusión.",
    icon: Music2,
    href: "/fiestas/nueva/musica",
    status: "Disponible",
    actionLabel: "Definir Música"
  },
  {
    title: "Gestión de Personal del Evento",
    description: "Asigna personal de tu equipo al evento y gestiona sus roles y costos.",
    icon: UserCheck,
    href: "/fiestas/nueva/personal",
    status: "Disponible",
    actionLabel: "Asignar Personal"
  },
  {
    title: "Lista de Carga Operativa",
    description: "Planifica y sigue los elementos a trasladar para el evento.",
    icon: PackageSearch,
    href: "/fiestas/nueva/carga-operativa",
    status: "Disponible",
    actionLabel: "Gestionar Carga"
  },
  {
    title: "Servicios Contratados",
    description: "Visualiza todos los servicios y proveedores confirmados para tu evento.",
    icon: ClipboardList,
    href: "/fiestas/nueva/servicios-contratados",
    status: "Disponible",
    actionLabel: "Ver Servicios Contratados"
  },
  {
    title: "Reuniones con Cliente",
    description: "Registra y organiza las notas y acuerdos de las reuniones de planificación.",
    icon: MessageSquareText,
    href: "/fiestas/nueva/reuniones",
    status: "Disponible",
    actionLabel: "Gestionar Reuniones"
  },
  {
    title: "Gestión Documental y Financiera",
    description: "Centraliza contratos, presupuestos, facturas y pagos del evento.",
    icon: Archive,
    href: "/fiestas/nueva/gestion-documental",
    status: "Disponible",
    actionLabel: "Administrar Documentos"
  },
  {
    title: "Costos y Rentabilidad",
    description: "Analiza costos, ingresos y la rentabilidad de tu evento.",
    icon: BarChart3,
    href: "/fiestas/nueva/gestion-costos-rentabilidad",
    status: "Disponible",
    actionLabel: "Analizar Rentabilidad"
  }
];

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null || amount === '') return "N/A";
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "N/A";
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(numericAmount);
};


const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) { return "Fecha inválida"; }
};

interface TaskSummary {
  completed: number;
  total: number;
  pending: number;
  progress: number;
}

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, href, icon: Icon }) => (
    <Card className="group flex flex-col h-full shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
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
        <Link href={href} passHref className="w-full">
            <Button asChild variant="link" className="p-0 h-auto text-sm text-primary group-hover:underline">
            <div className="inline-flex items-center justify-start gap-2 whitespace-nowrap">
                Acceder al Módulo <ArrowRight className="w-4 h-4" />
            </div>
            </Button>
        </Link>
      </CardFooter>
    </Card>
);

export default function PlanificarFiestaHubPage() {
  const { toast } = useToast();
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [linkedClient, setLinkedClient] = useState<Customer | null>(null);
  const [linkedInvoices, setLinkedInvoices] = useState<Invoice[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiestaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLinkedClient(null);
    try {
      const fiesta = await getFiestaActual();
      setFiestaActual(fiesta);

      if (fiesta) {
        if (fiesta.configuracion.clienteId) {
          const clientDetails = await getCustomerById(fiesta.configuracion.clienteId);
          setLinkedClient(clientDetails);
        }

        if (fiesta.invoiceIds && fiesta.invoiceIds.length > 0) {
          const invoiceDetailsPromises = fiesta.invoiceIds.map(id => getInvoiceById(id));
          const invoicesDetails = (await Promise.all(invoiceDetailsPromises)).filter(inv => inv !== null) as Invoice[];
          setLinkedInvoices(invoicesDetails);
        } else {
          setLinkedInvoices([]);
        }

        if (fiesta.tareas) {
          const completed = fiesta.tareas.filter(t => t.completada).length;
          const total = fiesta.tareas.length;
          setTaskSummary({ completed, total, pending: total - completed, progress: total > 0 ? (completed / total) * 100 : 0 });
        } else {
          setTaskSummary({ completed: 0, total: 0, pending: 0, progress: 0 });
        }
      }
    } catch (e: any) {
      console.error("Error loading fiesta data:", e);
      setError(e.message || "Error al cargar datos de la fiesta.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiestaData();
  }, [loadFiestaData]);

  const handleResetFiesta = async () => {
    setIsResetting(true);
    try {
      const result = await resetFiestaActual();
      if (result.success && result.newFiesta) {
        toast({
          title: "¡Planificador Reiniciado!",
          description: "Se ha reiniciado la planificación de la fiesta actual. Cualquier dato no guardado se ha perdido.",
        });
        await loadFiestaData();
      } else {
        throw new Error(result.error || "No se pudo reiniciar el planificador.");
      }
    } catch (e: any) {
      toast({ title: "Error al Reiniciar", description: e.message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  const handlePrintPlanner = () => {
    window.print();
  };

  const presupuestoEstimado = fiestaActual?.configuracion?.presupuestoEstimado ?? 0;
  const totalPagado = linkedInvoices.reduce((sum, invoice) => {
    const paymentsTotal = invoice.payments?.reduce((paySum, payment) => paySum + payment.amount, 0) || 0;
    return sum + paymentsTotal;
  }, 0);
  const saldoPorPagar = (typeof presupuestoEstimado === 'number' ? presupuestoEstimado : parseFloat(presupuestoEstimado.toString())) - totalPagado;

  const isFiestaConfigured = fiestaActual && fiestaActual.configuracion.nombreEvento !== initialFiestaActualData.configuracion.nombreEvento;


  return (
    <div className="space-y-8 print:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Planificador: {fiestaActual?.configuracion.nombreEvento || "Evento Actual"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Organiza cada detalle de tu próximo evento desde aquí.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handlePrintPlanner} disabled={isResetting || isLoading}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Plan Actual
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isResetting || isLoading}>
                  {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                  Descartar y Reiniciar Plan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar Reinicio?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto descartará cualquier cambio no guardado en la fiesta actual "{fiestaActual?.configuracion.nombreEvento || 'Evento Actual'}" y comenzará una planificación desde cero para la fiesta actual. Esta acción NO archiva la fiesta. ¿Estás seguro?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetFiesta} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">
                    {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sí, Reiniciar Plan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link href="/eventos" passHref>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Gestor de Fiestas
              </Button>
            </Link>
        </div>
      </div>

      {isLoading ? (
         <div className="flex items-center justify-center py-10 print:hidden">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground text-lg">Cargando datos del planificador...</p>
          </div>
      ) : error || !fiestaActual ? (
          <div className="flex flex-col items-center justify-center py-10 text-destructive bg-destructive/10 p-6 rounded-lg print:hidden">
            <AlertTriangle className="w-10 h-10 mb-3" />
            <p className="font-semibold text-lg">Error al Cargar Datos</p>
            <p className="text-sm">{error || "No se pudo cargar la información de la fiesta."}</p>
            <Button onClick={loadFiestaData} variant="destructive" className="mt-4">Intentar de Nuevo</Button>
        </div>
      ) : (
        <>
          <Card className="shadow-xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border-primary/20 print:shadow-none print:border-2 print:border-primary/50">
            <CardHeader className="pb-4 print:pb-2">
                <CardTitle className="font-headline text-2xl md:text-3xl text-primary text-center print:text-xl">
                    {fiestaActual.configuracion.nombreEvento}
                </CardTitle>
                <CardDescription className="text-md text-muted-foreground text-center print:text-sm">
                    {fiestaActual.configuracion.tipoCelebracion} - {formatDate(fiestaActual.configuracion.fechaEvento)}
                     {linkedClient && <span className="block mt-1 text-xs">(Cliente: {linkedClient.name || linkedClient.companyName})</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 print:space-y-2">
                <div className="print:hidden">
                    <CountdownTimer targetDate={fiestaActual.configuracion.fechaEvento} />
                </div>
                 <div className="text-center mt-3 print:mt-1">
                     {fiestaActual.configuracion.nombreLugar && (
                        <p className="text-sm text-muted-foreground print:text-xs">
                            <MapPin className="inline-block w-4 h-4 mr-1.5 align-text-bottom" />
                            Lugar: {fiestaActual.configuracion.nombreLugar}
                        </p>
                    )}
                </div>
                {linkedClient && (linkedClient.budgetFileName || linkedClient.contractFileName) && (
                    <div className="flex flex-wrap justify-center gap-2 pt-3 border-t print:hidden w-full max-w-md mx-auto mt-3">
                        {linkedClient.budgetFileName && (
                            <a href={`/api/budgets/${linkedClient.budgetFileName}`} target="_blank" rel="noopener noreferrer">
                                <Button type="button" variant="outline" size="sm">
                                <FileTextIcon className="w-4 h-4 mr-2"/> Ver Presupuesto Cliente
                                </Button>
                            </a>
                        )}
                        {linkedClient.contractFileName && (
                            <a href={`/api/contracts/${linkedClient.contractFileName}`} target="_blank" rel="noopener noreferrer">
                                <Button type="button" variant="outline" size="sm">
                                <FileTextIcon className="w-4 h-4 mr-2"/> Ver Contrato Cliente
                                </Button>
                            </a>
                        )}
                    </div>
                )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t print:grid-cols-2 print:gap-4 print:break-inside-avoid-page">
            <Card className="md:col-span-1 hover:shadow-md transition-shadow print:shadow-none print:border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground print:text-xs">Resumen de Tareas</CardTitle>
                    <ClipboardList className="h-5 w-5 text-orange-500 print:h-4 print:w-4" />
                </CardHeader>
                <CardContent className="print:pt-1">
                    <div className="text-2xl font-bold print:text-lg">{taskSummary?.pending ?? '0'} <span className="text-base font-normal text-muted-foreground">pendientes</span></div>
                    <Progress value={taskSummary?.progress ?? 0} className="mt-2 h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                        {taskSummary?.completed ?? '0'} de {taskSummary?.total ?? '0'} completadas ({taskSummary?.progress.toFixed(0) ?? '0'}%).
                    </p>
                </CardContent>
                <CardFooter className="pt-2 print:hidden">
                  <Link href="/fiestas/nueva/tareas" passHref className="w-full">
                    <Button variant="outline" size="sm" className="w-full">Ver/Administrar Tareas</Button>
                  </Link>
                </CardFooter>
            </Card>
            <Card className="hover:shadow-md transition-shadow print:shadow-none print:border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground print:text-xs">Presupuesto Estimado</CardTitle>
                    <DollarSign className="h-5 w-5 text-primary print:h-4 print:w-4" />
                </CardHeader>
                <CardContent className="print:pt-1">
                    <div className="text-2xl font-bold print:text-lg">{formatCurrency(presupuestoEstimado)}</div>
                    <p className="text-xs text-muted-foreground">Costo total proyectado.</p>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow print:shadow-none print:border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground print:text-xs">Total Pagado</CardTitle>
                    <PiggyBank className="h-5 w-5 text-green-500 print:h-4 print:w-4" />
                </CardHeader>
                <CardContent className="print:pt-1">
                    <div className="text-2xl font-bold text-green-600 print:text-lg">{formatCurrency(totalPagado)}</div>
                    <p className="text-xs text-muted-foreground">Suma de pagos recibidos.</p>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow md:col-start-2 print:shadow-none print:border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground print:text-xs">Saldo por Pagar</CardTitle>
                    <CreditCard className="h-5 w-5 text-red-500 print:h-4 print:w-4" />
                </CardHeader>
                <CardContent className="print:pt-1">
                     <div className={`text-2xl font-bold ${saldoPorPagar > 0 ? 'text-destructive' : 'text-green-600'} print:text-lg`}>
                        {formatCurrency(saldoPorPagar)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {saldoPorPagar <= 0 ? 'Presupuesto cubierto/excedido.' : 'Estimado menos pagado.'}
                    </p>
                </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg print:shadow-none print:border-none">
            <CardHeader className="print:hidden">
                <div className="flex items-center gap-3">
                    <ListChecks className="w-7 h-7 text-primary" />
                    <CardTitle className="font-headline text-xl">Gestionar Detalles del Evento</CardTitle>
                </div>
                 <CardDescription>Accede a los diferentes módulos para planificar cada aspecto.</CardDescription>
            </CardHeader>
            <CardContent className="print:p-0">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-1 print:gap-4">
                    {planningModules.map((module) => (
                    <ModuleCard key={module.title} {...module} />
                    ))}
                </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
