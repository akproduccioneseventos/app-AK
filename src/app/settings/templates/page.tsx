
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Sparkles as SparklesIcon, Wand2, UserCog, ListChecks, PackageSearch, Palette, Image as ImageIcon, LayoutDashboard, FileSignature, MessageSquareText } from 'lucide-react';

const settingsCards = [
  {
    title: "Plantilla de Contrato",
    description: "Personaliza el texto base del contrato de prestación de servicios con tus propias cláusulas.",
    href: "/settings/templates/contrato",
    icon: FileSignature,
  },
  {
    title: "Plantillas de Invitación Digital",
    description: "Gestiona los diseños base para las invitaciones web de tus eventos.",
    href: "/settings/templates/invitaciones",
    icon: ImageIcon,
  },
  {
    title: "Plantilla de Reuniones",
    description: "Configura el checklist maestro y la guía de consultoría para tus reuniones con clientes.",
    href: "/settings/templates/reuniones",
    icon: MessageSquareText
  },
  {
    title: "Plantillas de Tareas",
    description: "Crea listas de tareas predefinidas para agilizar la planificación de eventos.",
    href: "/settings/task-templates",
    icon: ListChecks
  },
  {
    title: "Plantillas de Diseño de Salón",
    description: "Guarda y gestiona tus distribuciones de salón más utilizadas.",
    href: "/settings/templates/layouts",
    icon: LayoutDashboard
  },
   {
    title: "Plantilla de Carga Operativa",
    description: "Define la lista maestra de ítems a trasladar para cada evento.",
    href: "/settings/templates/carga-operativa",
    icon: PackageSearch
  },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-8 h-8 text-primary"/>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Gestión de Plantillas
            </h1>
            <p className="text-muted-foreground">
              Ahorra tiempo personalizando y reutilizando plantillas para tus documentos y procesos.
            </p>
          </div>
        </div>
         <Link href="/settings" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2"/>
            Volver a Configuración
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                  <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                  <CardTitle className="font-headline text-lg mb-1">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {item.description}
              </p>
            </CardContent>
            <CardFooter className="pt-3">
                 <Link href={item.href} passHref className="w-full">
                    <Button variant="secondary" className="w-full">
                        Gestionar
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
