'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartyPopper, Building2, BarChart3, ShoppingCart, BrainCircuit, Settings, CalendarDays } from 'lucide-react';

interface HubItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  actionLabel: string;
}

const hubItems: HubItem[] = [
  {
    title: 'Planificador de Eventos',
    description: 'Gestiona tus eventos activos y archivados. El centro de operaciones de cada fiesta.',
    href: '/eventos',
    icon: PartyPopper,
    actionLabel: 'Ir al Planificador',
  },
  {
    title: 'Gestión de la Empresa',
    description: 'Administra tus servicios, personal, proveedores e inventario.',
    href: '/empresa',
    icon: Building2,
    actionLabel: 'Gestionar Empresa',
  },
  {
    title: 'Panel Contable',
    description: 'Controla el CRM, presupuestos, facturas y la salud financiera de tu negocio.',
    href: '/empresa/contabilidad',
    icon: BarChart3,
    actionLabel: 'Ver Contabilidad',
  },
   {
    title: 'Compras y Checklist',
    description: 'Accede a las listas de compras y checklists operativos.',
    href: '/compras',
    icon: ShoppingCart,
    actionLabel: 'Ir a Compras',
  },
  {
    title: 'Asistente IA',
    description: 'Analiza el estado de tu aplicación y obtén ayuda de la inteligencia artificial.',
    href: '/admin/aaiff-fiesta',
    icon: BrainCircuit,
    actionLabel: 'Consultar a la IA',
  },
  {
    title: 'Configuración General',
    description: 'Ajusta las preferencias de la aplicación, plantillas y detalles de tu cuenta.',
    href: '/settings',
    icon: Settings,
    actionLabel: 'Ajustar Configuración',
  },
];


export default function MainMenuPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline text-primary">
          Bienvenido/a a AK Producciones
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Tu plataforma integral para la gestión de eventos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubItems.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-row items-center justify-between pb-4 space-y-0">
               <CardTitle className="font-headline text-lg">{item.title}</CardTitle>
               <div className="p-2 bg-primary/10 rounded-lg">
                 <item.icon className="w-6 h-6 text-primary" />
               </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </CardContent>
            <CardFooter className="pt-4">
                 <Link href={item.href} passHref className="w-full">
                    <Button variant="default" className="w-full">
                        {item.actionLabel}
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
        <Card className="md:col-span-2 lg:col-span-1 flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
             <CardHeader className="flex-row items-center justify-between pb-4 space-y-0">
               <CardTitle className="font-headline text-lg">Calendario General</CardTitle>
               <div className="p-2 bg-primary/10 rounded-lg">
                 <CalendarDays className="w-6 h-6 text-primary" />
               </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">
                Visualiza rápidamente todas las fechas ocupadas por tus eventos confirmados.
              </p>
            </CardContent>
             <CardFooter className="pt-4">
                 <Link href="/calendario" passHref className="w-full">
                    <Button variant="secondary" className="w-full">
                        Ver Calendario
                    </Button>
                </Link>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}