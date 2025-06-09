
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks, Users, Truck, Palette, Settings2, Globe, UtensilsCrossed, UserCheck, FileText, Link as LinkIcon, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';
import { Separator } from '@/components/ui/separator';

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
    icon: Truck,
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
  }
];

const formatCurrency = (amount: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(amount);
};

export default function PlanificarFiestaHubPage() {
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [linkedBudget, setLinkedBudget] = useState<Presupuesto | null>(null);
  const [linkedInvoices, setLinkedInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLinkedDocuments = useCallback(async (fiesta: FiestaEnPlanificacion) => {
    try {
      if (fiesta.presupuestoId) {
        const budget = await getPresupuestoById(fiesta.presupuestoId);
        setLinkedBudget(budget);
      } else {
        setLinkedBudget(null);
      }

      if (fiesta.invoiceIds && fiesta.invoiceIds.length > 0) {
        const invoiceDetailsPromises = fiesta.invoiceIds.map(id => getInvoiceById(id));
        const invoicesDetails = (await Promise.all(invoiceDetailsPromises)).filter(inv => inv !== null) as Invoice[];
        setLinkedInvoices(invoicesDetails);
      } else {
        setLinkedInvoices([]);
      }
    } catch (e) {
      console.error("Error loading linked documents:", e);
      setError("Error al cargar documentos vinculados.");
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const fiesta = await getFiestaActual();
        setFiestaActual(fiesta);
        if (fiesta) {
          await loadLinkedDocuments(fiesta);
        }
      } catch (e) {
        console.error("Error loading fiesta actual:", e);
        setError("Error al cargar datos de la fiesta.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [loadLinkedDocuments]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Planificador de Fiestas
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

      {/* Linked Documents Card */}
      <Card className="shadow-lg bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <LinkIcon className="w-7 h-7 text-primary" />
            <div>
              <CardTitle className="font-headline text-xl">Documentos Vinculados al Evento</CardTitle>
              <CardDescription>
                Presupuesto y facturas asociadas a {fiestaActual?.configuracion.nombreEvento || 'esta fiesta'}.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando documentos...</p>
            </div>
          ) : error ? (
             <div className="flex flex-col items-center justify-center py-6 text-destructive">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-md mb-1">Presupuesto Asignado:</h4>
                {linkedBudget ? (
                  <Card className="p-3 bg-background hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-primary">{linkedBudget.clienteNombre} - {linkedBudget.eventoTipo}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: {formatCurrency(linkedBudget.costoTotalEstimado)}
                        </p>
                      </div>
                      <Link href={`/presupuestos/${linkedBudget.id}/ver`} passHref>
                        <Button variant="outline" size="sm">
                          Ver <ExternalLink className="w-3 h-3 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md text-center">
                    No hay ningún presupuesto asignado a esta fiesta. <Link href="/presupuestos" className="text-primary underline">Asignar uno</Link>.
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-md mb-2">Facturas Asignadas: ({linkedInvoices.length})</h4>
                {linkedInvoices.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {linkedInvoices.map(invoice => (
                      <Card key={invoice.id} className="p-3 bg-background hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Factura #{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              Para: {invoice.customer.name} - Total: {formatCurrency(invoice.totalAmount, invoice.currency)}
                            </p>
                          </div>
                          <Link href={`/invoices/${invoice.id}`} passHref>
                            <Button variant="outline" size="sm">
                              Ver <ExternalLink className="w-3 h-3 ml-1.5" />
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                   <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md text-center">
                    No hay facturas asignadas a esta fiesta. <Link href="/invoices" className="text-primary underline">Asignar alguna</Link>.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">
                Puedes asignar o cambiar los documentos desde las secciones de Presupuestos y Facturas.
            </p>
        </CardFooter>
      </Card>


      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {planningModules.map((module) => (
          <Card key={module.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-row items-start gap-4 space-y-0">
              <div className="p-3 bg-primary/10 rounded-lg">
                <module.icon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl mb-1">{module.title}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">{module.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              {module.href ? (
                <Link href={module.href} passHref className="mt-auto">
                  <Button
                    className="w-full"
                    variant={module.status === "Disponible" ? "default" : "secondary"}
                    disabled={module.status !== "Disponible"}
                  >
                    {module.actionLabel}
                    {module.status !== "Disponible" && <span className="ml-2 text-xs opacity-70">({module.status})</span>}
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full mt-auto"
                  variant="secondary"
                  disabled
                >
                  {module.actionLabel}
                  <span className="ml-2 text-xs opacity-70">({module.status})</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
          <CardTitle className="font-headline">Próximos Pasos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este es el centro de planificación para tus fiestas. Selecciona un módulo para comenzar a detallar tu evento.
            La información que configures aquí (como tareas, invitados, menú) se aplicará a la "fiesta tipo" que estás planificando.
          </p>
          <img
            src="https://placehold.co/600x300.png"
            alt="Planificación de eventos"
            className="mt-4 rounded-md shadow-md mx-auto"
            data-ai-hint="event planning dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
