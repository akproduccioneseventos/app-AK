
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks, Users, Truck, Palette, Settings2 } from 'lucide-react';
import Link from 'next/link';

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
    title: "Proveedores y Servicios", 
    description: "Busca, selecciona y gestiona todos los proveedores para tu fiesta.", 
    icon: Truck, 
    href: "/fiestas/nueva/proveedores",
    status: "Disponible",
    actionLabel: "Buscar Proveedores"
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
    title: "Configuración del Evento",
    description: "Define detalles generales, fecha, lugar y tipo de celebración.",
    icon: Settings2,
    href: "/fiestas/nueva/configuracion",
    status: "Disponible",
    actionLabel: "Configurar Evento"
  }
];

export default function PlanificarFiestaHubPage() {
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
                Iremos habilitando funcionalidades más avanzadas en cada sección progresivamente.
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
