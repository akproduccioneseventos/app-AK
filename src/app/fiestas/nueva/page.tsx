
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks, Users, Palette, Settings2, Globe, UtensilsCrossed, UserCheck, FileText, Link as LinkIcon, ExternalLink, Loader2, AlertTriangle, MessageSquareText, LayoutGrid, ChefHat, Users2, Milestone, Image as ImageIcon, CalendarDays, Info } from 'lucide-react';
import Link from 'next/link';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import { getMenuById } from '@/app/actions/menus-catering';
// El personal asignado ya se procesa dentro de fiestaActual, no necesitamos getEmpleadoById aquí directamente.
import type { FiestaEnPlanificacion, Tarea, Reunion, SalonLayoutData } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';
import type { FullMenu } from '@/types/catering';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge'; // Asegúrate que esta ruta es correcta
import { StatusBadge } from '@/components/status-badge'; // Para estado de factura

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
    title: "Diseño y Decoración",
    description: "Planifica la estética, temática y decoración de tu evento.",
    icon: Palette,
    href: "/fiestas/nueva/decoracion",
    status: "Disponible",
    actionLabel: "Definir Diseño"
  },
  {
    title: "Diseño del Salón / Plano",
    description: "Organiza la disposición de mesas, pista de baile y otros elementos del salón.",
    icon: LayoutGrid,
    href: "/fiestas/nueva/diseno-salon",
    status: "Disponible",
    actionLabel: "Diseñar Salón"
  },
  {
    title: "Catering y Menú",
    description: "Crea y gestiona menús personalizados, detallando platos e ingredientes con costos.",
    icon: UtensilsCrossed,
    href: "/fiestas/nueva/catering",
    status: "Disponible",
    actionLabel: "Gestionar Menús"
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
    title: "Proveedores y Servicios",
    description: "Busca, selecciona y gestiona todos los proveedores para tu fiesta.",
    icon: Users2, // Changed icon for variety, Truck could also work
    href: "/fiestas/nueva/proveedores",
    status: "Disponible",
    actionLabel: "Buscar Proveedores"
  },
  {
    title: "Página Web del Evento",
    description: "Crea y personaliza una página web para compartir detalles de tu fiesta.",
    icon: Globe,
    href: "/fiestas/nueva/pagina-web",
    status: "Disponible",
    actionLabel: "Personalizar Web"
  },
  {
    title: "Reuniones con Cliente",
    description: "Registra y organiza las notas y acuerdos de las reuniones de planificación.",
    icon: MessageSquareText,
    href: "/fiestas/nueva/reuniones", 
    status: "Disponible", 
    actionLabel: "Gestionar Reuniones"
  }
];

const formatCurrency = (amount: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(amount);
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
  progress: number;
}
interface SalonLayoutSummary {
  hasBackground: boolean;
  elementCount: number;
}

export default function PlanificarFiestaHubPage() {
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [linkedBudget, setLinkedBudget] = useState<Presupuesto | null>(null);
  const [linkedInvoices, setLinkedInvoices] = useState<Invoice[]>([]);
  const [assignedMenu, setAssignedMenu] = useState<FullMenu | null>(null);
  const [assignedStaffSummary, setAssignedStaffSummary] = useState<{ count: number; totalCost: number } | null>(null);
  
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [meetingCount, setMeetingCount] = useState<number>(0);
  const [salonLayoutSummary, setSalonLayoutSummary] = useState<SalonLayoutSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiestaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiesta = await getFiestaActual();
      setFiestaActual(fiesta);

      if (fiesta) {
        // Presupuesto
        if (fiesta.presupuestoId) {
          const budget = await getPresupuestoById(fiesta.presupuestoId);
          setLinkedBudget(budget);
        } else {
          setLinkedBudget(null);
        }

        // Facturas
        if (fiesta.invoiceIds && fiesta.invoiceIds.length > 0) {
          const invoiceDetailsPromises = fiesta.invoiceIds.map(id => getInvoiceById(id));
          const invoicesDetails = (await Promise.all(invoiceDetailsPromises)).filter(inv => inv !== null) as Invoice[];
          setLinkedInvoices(invoicesDetails);
        } else {
          setLinkedInvoices([]);
        }

        // Menú
        if (fiesta.menuAsignadoId) {
          const menu = await getMenuById(fiesta.menuAsignadoId);
          setAssignedMenu(menu);
        } else {
          setAssignedMenu(null);
        }

        // Personal
        if (fiesta.personalAsignado && fiesta.personalAsignado.length > 0) {
          const totalCost = fiesta.personalAsignado.reduce((sum, staff) => sum + staff.eventSalary, 0);
          setAssignedStaffSummary({ count: fiesta.personalAsignado.length, totalCost });
        } else {
          setAssignedStaffSummary(null);
        }

        // Tareas
        if (fiesta.tareas) {
          const completed = fiesta.tareas.filter(t => t.completada).length;
          const total = fiesta.tareas.length;
          setTaskSummary({ completed, total, progress: total > 0 ? (completed / total) * 100 : 0 });
        } else {
          setTaskSummary({ completed: 0, total: 0, progress: 0 });
        }

        // Reuniones
        setMeetingCount(fiesta.reuniones?.length || 0);

        // Diseño Salón
        if (fiesta.salonLayout) {
          setSalonLayoutSummary({
            hasBackground: !!fiesta.salonLayout.backgroundImageUrl,
            elementCount: fiesta.salonLayout.elements?.length || 0,
          });
        } else {
          setSalonLayoutSummary({ hasBackground: false, elementCount: 0 });
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

  const totalInvoicedAmount = linkedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalPaidForParty = linkedInvoices.reduce((sum, invoice) => {
    const paymentsTotal = invoice.payments?.reduce((paySum, payment) => paySum + payment.amount, 0) || 0;
    return sum + paymentsTotal;
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Planificador: {fiestaActual?.configuracion.nombreEvento || "Evento Actual"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Organiza cada detalle de tu próximo evento desde aquí.
          </p>
        </div>
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>

      {isLoading ? (
         <div className="flex items-center justify-center py-10">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground text-lg">Cargando datos del planificador...</p>
          </div>
      ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-destructive bg-destructive/10 p-6 rounded-lg">
            <AlertTriangle className="w-10 h-10 mb-3" />
            <p className="font-semibold text-lg">Error al Cargar Datos</p>
            <p className="text-sm">{error}</p>
            <Button onClick={loadFiestaData} variant="destructive" className="mt-4">Intentar de Nuevo</Button>
        </div>
      ) : (
        <>
          {/* Resumen Contable */}
          <Card className="shadow-lg bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-7 h-7 text-primary" />
                <div>
                  <CardTitle className="font-headline text-xl">Resumen Contable del Evento</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-md mb-1">Presupuesto Asignado:</h4>
                {linkedBudget ? (
                  <Card className="p-3 bg-background hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                      <div className="flex-grow">
                        <p className="font-medium text-primary">{linkedBudget.clienteNombre} - {linkedBudget.eventoTipo}</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                           <span>Total: {formatCurrency(linkedBudget.costoTotalEstimado)}</span>
                           {linkedBudget.estado && <PresupuestoStatusBadge status={linkedBudget.estado} />}
                        </div>
                      </div>
                      <Link href={`/presupuestos/${linkedBudget.id}/ver`} passHref>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto mt-1 sm:mt-0">
                          Ver Presupuesto <ExternalLink className="w-3 h-3 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md text-center">
                    No hay ningún presupuesto asignado. <Link href="/presupuestos" className="text-primary underline hover:text-primary/80">Asignar uno</Link>.
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-md mb-2">Facturas ({linkedInvoices.length}):</h4>
                {linkedInvoices.length > 0 ? (
                  <Card className="p-3 bg-background">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Total Facturado:</span>
                        <span className="font-medium">{formatCurrency(totalInvoicedAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Pagado:</span>
                        <span className="font-medium text-green-600">{formatCurrency(totalPaidForParty)}</span>
                    </div>
                     <Link href="/invoices" passHref className="mt-3 block">
                        <Button variant="outline" size="sm" className="w-full">
                          Gestionar Facturas <ExternalLink className="w-3 h-3 ml-1.5" />
                        </Button>
                      </Link>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md text-center">
                    No hay facturas asignadas. <Link href="/invoices" className="text-primary underline hover:text-primary/80">Asignar o crear facturas</Link>.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumen Operativo y de Planificación */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Milestone className="w-7 h-7 text-primary" />
                <CardTitle className="font-headline text-xl">Progreso y Configuración del Evento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fiestaActual?.configuracion && (
                <div className="p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CalendarDays className="w-4 h-4"/>
                    <span>Fecha del Evento: <span className="font-medium text-foreground">{formatDate(fiestaActual.configuracion.fechaEvento)}</span></span>
                  </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4"/>
                    <span>Invitados Estimados: <span className="font-medium text-foreground">{fiestaActual.configuracion.invitadosEstimados}</span></span>
                  </div>
                </div>
              )}
              <Separator/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Menú Asignado */}
                <div>
                  <h4 className="font-semibold text-md mb-1">Menú Asignado:</h4>
                  {assignedMenu ? (
                    <Card className="p-3 bg-background hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <p className="font-medium text-primary truncate">{assignedMenu.name}</p>
                        <Link href="/fiestas/nueva/catering" passHref>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Gestionar <ExternalLink className="w-3 h-3 ml-1.5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ) : (
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md text-center">
                      Sin menú asignado. <Link href="/fiestas/nueva/catering" className="text-primary underline">Seleccionar</Link>.
                    </p>
                  )}
                </div>
                {/* Personal Asignado */}
                <div>
                  <h4 className="font-semibold text-md mb-1">Personal Asignado:</h4>
                  {assignedStaffSummary ? (
                    <Card className="p-3 bg-background hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <p className="font-medium">{assignedStaffSummary.count} persona(s)</p>
                          <p className="text-xs text-muted-foreground">
                            Costo Total: {formatCurrency(assignedStaffSummary.totalCost)}
                          </p>
                        </div>
                        <Link href="/fiestas/nueva/personal" passHref>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Gestionar <ExternalLink className="w-3 h-3 ml-1.5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ) : (
                     <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md text-center">
                      Sin personal asignado. <Link href="/fiestas/nueva/personal" className="text-primary underline">Asignar</Link>.
                    </p>
                  )}
                </div>
                 {/* Tareas */}
                <div>
                  <h4 className="font-semibold text-md mb-1">Tareas:</h4>
                   {taskSummary ? (
                    <Card className="p-3 bg-background hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                           <p className="font-medium">{taskSummary.completed} de {taskSummary.total} completadas</p>
                           <Progress value={taskSummary.progress} className="h-2 mt-1" />
                        </div>
                        <Link href="/fiestas/nueva/tareas" passHref>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Ver Tareas <ExternalLink className="w-3 h-3 ml-1.5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ) : (
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md text-center">Cargando tareas...</p>
                  )}
                </div>
                {/* Reuniones */}
                <div>
                  <h4 className="font-semibold text-md mb-1">Reuniones:</h4>
                   <Card className="p-3 bg-background hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <p className="font-medium">{meetingCount} reunión(es) registrada(s)</p>
                        <Link href="/fiestas/nueva/reuniones" passHref>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Ver Reuniones <ExternalLink className="w-3 h-3 ml-1.5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                </div>
                {/* Diseño Salón */}
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-md mb-1">Diseño del Salón:</h4>
                  {salonLayoutSummary ? (
                    <Card className="p-3 bg-background hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-3">
                          <ImageIcon className={`w-5 h-5 ${salonLayoutSummary.hasBackground ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <p className="text-sm">
                            {salonLayoutSummary.hasBackground ? "Plano de fondo cargado. " : "Sin plano de fondo. "}
                            {salonLayoutSummary.elementCount > 0 ? `${salonLayoutSummary.elementCount} elemento(s) definidos.` : "Sin elementos definidos."}
                          </p>
                        </div>
                        <Link href="/fiestas/nueva/diseno-salon" passHref>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Ver Diseño <ExternalLink className="w-3 h-3 ml-1.5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ) : (
                     <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md text-center">Cargando diseño...</p>
                  )}
                </div>
              </div>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Gestiona cada aspecto desde los módulos dedicados a continuación.
                </p>
            </CardFooter>
          </Card>
          
          {/* Módulos de Planificación */}
          <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <ListChecks className="w-7 h-7 text-primary" />
                    <CardTitle className="font-headline text-xl">Módulos de Planificación</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {planningModules.map((module) => (
                    <Card key={module.title} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
                        <CardHeader className="flex-row items-start gap-3 space-y-0 pb-3">
                        <div className="p-2.5 bg-primary/10 rounded-md">
                            <module.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="font-semibold text-md mb-0.5">{module.title}</CardTitle>
                        </div>
                        </CardHeader>
                        <CardContent className="flex-grow pb-3">
                            <p className="text-xs text-muted-foreground line-clamp-2">{module.description}</p>
                        </CardContent>
                        <CardFooter className="pt-0">
                        {module.href ? (
                            <Link href={module.href} passHref className="w-full">
                            <Button
                                className="w-full text-sm"
                                variant={module.status === "Disponible" ? "default" : "secondary"}
                                size="sm"
                                disabled={module.status !== "Disponible"}
                            >
                                {module.actionLabel}
                                {module.status !== "Disponible" && <span className="ml-1.5 text-xs opacity-70">({module.status})</span>}
                            </Button>
                            </Link>
                        ) : (
                            <Button
                            className="w-full mt-auto text-sm"
                            variant="secondary"
                            size="sm"
                            disabled
                            >
                            {module.actionLabel}
                            <span className="ml-1.5 text-xs opacity-70">({module.status})</span>
                            </Button>
                        )}
                        </CardFooter>
                    </Card>
                    ))}
                </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
