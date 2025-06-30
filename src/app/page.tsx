
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, CircleDollarSign, Settings, Building2, PlusCircle, FileText as FileTextIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const modules: ModuleCardProps[] = [
  { title: "Planificador de fiestas en general", description: "Visualiza y organiza todos tus eventos, el actual y los pasados.", href: "/eventos", icon: CalendarDays },
  { title: "Contabilidad y CRM", description: "Gestiona presupuestos, facturas, pagos y tu embudo de ventas.", href: "/empresa/contabilidad", icon: CircleDollarSign },
  { title: "Gestión de Empresa", description: "Administra personal, proveedores y tu catálogo de servicios.", href: "/empresa", icon: Building2 },
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


export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline text-foreground mb-1">¡Bienvenido a tu Centro de Gestión!</h2>
          <p className="text-lg text-muted-foreground">Selecciona un módulo para empezar o crea una nueva fiesta o presupuesto.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/fiestas/nueva/configuracion" passHref className="w-full sm:w-auto">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-5 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 w-full">
                  <PlusCircle className="w-6 h-6 mr-2.5" />
                  Crear Nueva Fiesta
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
      
      <Separator />

      <div className="pt-4">
        <h3 className="text-2xl font-semibold text-foreground mb-4 font-headline text-center">Módulos Principales</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </div>
    </div>
  );
}
