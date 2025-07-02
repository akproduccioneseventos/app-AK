
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ListChecks, Users, Palette, Settings2, Globe, CalendarDays, Loader2, AlertTriangle, MessageSquareText, ChefHat, UserCheck, ClipboardList, Archive, PackageSearch, BarChart3 } from 'lucide-react';
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
  { title: "Servicios Contratados", description: "Ver proveedores y servicios confirmados.", icon: ClipboardList, href: "/fiestas/nueva/servicios-contratados", status: "Disponible", actionLabel: "Ver Servicios" },
  { title: "Reuniones con Cliente", description: "Registro privado de reuniones y acuerdos.", icon: MessageSquareText, href: "/fiestas/nueva/reuniones", status: "Disponible", actionLabel: "Gestionar Reuniones" },
  { title: "Costos y Rentabilidad", description: "Análisis financiero del evento.", icon: BarChart3, href: "/fiestas/nueva/gestion-costos-rentabilidad", status: "Disponible", actionLabel: "Analizar Rentabilidad" },
  { title: "Gestión Documental y Financiera", description: "Contrato, presupuesto, facturas, pagos.", icon: Archive, href: "/fiestas/nueva/gestion-documental", status: "Disponible", actionLabel: "Administrar Documentos" },
  { title: "Catering y Menú", description: "Planificación gastronómica completa.", icon: ChefHat, href: "/fiestas/nueva/catering", status: "Disponible", actionLabel: "Gestionar Menús" },
  { title: "Decoración y Diseño", description: "Planificación estética y funcional.", icon: Palette, href: "/fiestas/nueva/decoracion", status: "Disponible", actionLabel: "Definir Diseño" }
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
                title="Portal del cliente"
                description="Gestiona lo que ven el cliente y los invitados (Checklist, RSVP, etc.)."
                href="/fiestas/nueva/portal-cliente"
                icon={Globe}
                actionLabel="Gestionar Visibilidad"
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
