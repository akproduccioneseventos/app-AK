
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ListChecks, Users, Palette, Settings2, Globe, CalendarDays, Loader2, AlertTriangle, MessageSquareText, ChefHat, UserCheck, ClipboardList, Archive, PackageSearch, BarChart3, Printer, LayoutDashboard, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { getFiestaActual, resetFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, Tarea } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
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
import { getCustomerById } from '@/app/actions/customers';
import { Alert, AlertDescription, AlertTitle as AlertTitleShadcn } from '@/components/ui/alert';


interface PlanningModule {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  status: "Disponible" | "Próximamente" | "En Desarrollo";
  actionLabel: string;
}

const internalModules: PlanningModule[] = [
  { title: "Configuración del Evento", description: "Datos técnicos: fecha, tipo, lugar, invitados.", icon: Settings2, href: "/fiestas/nueva/configuracion", status: "Disponible", actionLabel: "Configurar Evento" },
  { title: "Lista de Tareas (Interna)", description: "Organización interna del equipo.", icon: ListChecks, href: "/fiestas/nueva/tareas", status: "Disponible", actionLabel: "Gestionar Tareas" },
  { title: "Gestión de Personal", description: "Asignación y costos de personal.", icon: UserCheck, href: "/fiestas/nueva/personal", status: "Disponible", actionLabel: "Asignar Personal" },
  { title: "Lista de Carga Operativa", description: "Elementos que deben trasladarse al evento.", icon: PackageSearch, href: "/fiestas/nueva/carga-operativa", status: "Disponible", actionLabel: "Gestionar Carga" },
  { title: "Reuniones con Cliente", description: "Registro privado de reuniones y acuerdos.", icon: MessageSquareText, href: "/fiestas/nueva/reuniones", status: "Disponible", actionLabel: "Gestionar Reuniones" },
  { title: "Costos y Rentabilidad", description: "Análisis financiero del evento.", icon: BarChart3, href: "/fiestas/nueva/gestion-costos-rentabilidad", status: "Disponible", actionLabel: "Analizar Rentabilidad" },
  { title: "Catering y Menú", description: "Planificación gastronómica completa.", icon: ChefHat, href: "/fiestas/nueva/catering", status: "Disponible", actionLabel: "Gestionar Menús" },
  { title: "Decoración y Diseño", description: "Planificación estética y funcional.", icon: Palette, href: "/fiestas/nueva/decoracion", status: "Disponible", actionLabel: "Definir Diseño" },
  { title: "Diseño del Salón y Mesas", description: "Disposición visual de mesas y asignación de invitados.", icon: LayoutDashboard, href: "/fiestas/nueva/invitados/layout", status: "Disponible", actionLabel: "Ir al Diseñador" }
];


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
  actionLabel: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, href, icon: Icon, actionLabel }) => (
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
            {actionLabel} <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </CardFooter>
    </Card>
  </Link>
);

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

export default function PlanificarFiestaHubPage() {
  const { toast } = useToast();
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [linkedClient, setLinkedClient] = useState<Customer | null>(null);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [showSalonContractReminder, setShowSalonContractReminder] = useState(false);
  const [showServiceContractReminder, setShowServiceContractReminder] = useState(false);


  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiestaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLinkedClient(null);
    setShowSalonContractReminder(false);
    setShowServiceContractReminder(false);
    try {
      const fiesta = await getFiestaActual();
      setFiestaActual(fiesta);

      // Check for specific salon contract
      const hasContratoSalon = fiesta.otrosDocumentos?.some(doc => doc.tipo === 'contrato_salon');
      if (fiesta?.configuracion.nombreLugar?.toLowerCase().includes("club uruguay") && !hasContratoSalon) {
        setShowSalonContractReminder(true);
      }
      
      const hasContratoServicio = fiesta.otrosDocumentos?.some(doc => doc.tipo === 'contrato_servicio');
      if (fiesta && !hasContratoServicio) {
        setShowServiceContractReminder(true);
      }

      if (fiesta?.configuracion.clienteId) {
        const clientDetails = await getCustomerById(fiesta.configuracion.clienteId);
        setLinkedClient(clientDetails);
      }

      if (fiesta?.tareas) {
        const completed = fiesta.tareas.filter(t => t.completada).length;
        const total = fiesta.tareas.length;
        setTaskSummary({ completed, total, pending: total - completed, progress: total > 0 ? (completed / total) * 100 : 0 });
      } else {
        setTaskSummary({ completed: 0, total: 0, pending: 0, progress: 0 });
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
  
  return (
    <div className="space-y-8 print:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline text-foreground mb-1">
            Planificador: {fiestaActual?.configuracion.nombreEvento || "Evento Actual"}
          </h2>
          <p className="text-lg text-muted-foreground">
            Módulos internos para la organización de tu equipo.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Link href="/eventos" passHref>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Gestor de Eventos
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
          {showSalonContractReminder && (
            <Alert variant="destructive">
              <FileSignature className="h-4 w-4" />
              <AlertTitleShadcn>Recordatorio Importante</AlertTitleShadcn>
              <AlertDescription>
                Falta subir el contrato del salón "Club Uruguay". Puedes hacerlo en la sección de{" "}
                <Link href="/fiestas/nueva/gestion-documental" className="font-semibold underline">
                  Gestión Documental
                </Link>.
              </AlertDescription>
            </Alert>
          )}

          {showServiceContractReminder && (
             <Alert>
              <FileSignature className="h-4 w-4" />
              <AlertTitleShadcn>Recordatorio de Documentación</AlertTitleShadcn>
              <AlertDescription>
                Recuerda subir el contrato de servicio firmado con el cliente. Puedes hacerlo en la sección de{" "}
                <Link href="/fiestas/nueva/gestion-documental" className="font-semibold underline text-primary">
                  Gestión Documental
                </Link>.
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Resumen del Evento Actual</CardTitle>
              <CardDescription>
                {formatDate(fiestaActual.configuracion.fechaEvento)} | Cliente: {linkedClient?.name || linkedClient?.companyName || "No asignado"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Label>Progreso de Tareas Internas ({taskSummary?.completed}/{taskSummary?.total})</Label>
                <Progress value={taskSummary?.progress ?? 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <ModuleCard 
                title="Página Pública y Portal"
                description="Gestiona lo que ven el cliente y los invitados (Checklist, RSVP, etc.)."
                href="/fiestas/nueva/portal-cliente"
                icon={Globe}
                actionLabel="Gestionar Visibilidad"
             />
             <ModuleCard 
                title="Resumen Imprimible del Evento"
                description="Genera un PDF con toda la información clave del evento: itinerario, menús, etc."
                href="/fiestas/nueva/resumen-imprimible"
                icon={Printer}
                actionLabel="Ver Resumen"
             />
             {internalModules.map((module) => (
                <ModuleCard key={module.title} {...module} />
             ))}
          </div>
        </>
      )}
    </div>
  );
}
