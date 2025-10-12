'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    LayoutDashboard, 
    Wand2, 
    ListChecks, 
    Building2, 
    BarChart3, 
    Settings as SettingsIcon, 
    CalendarDays, 
    BrainCircuit,
    ShoppingCart
} from 'lucide-react';
import React from 'react';

const mainHubItems = [
    {
      title: 'Planificador de Eventos',
      description: 'Gestiona tus eventos activos y archivados. El centro de operaciones de cada fiesta.',
      href: '/eventos',
      icon: LayoutDashboard,
      actionLabel: 'Ir al Planificador'
    },
    {
      title: 'Gestión de la Empresa',
      description: 'Administra tus servicios, personal, proveedores e inventario.',
      href: '/empresa',
      icon: Building2,
      actionLabel: 'Gestionar Empresa'
    },
    {
      title: 'Panel Contable',
      description: 'Controla el CRM, presupuestos, facturas y la salud financiera de tu negocio.',
      href: '/empresa/contabilidad',
      icon: BarChart3,
      actionLabel: 'Ver Contabilidad'
    },
    {
      title: 'Compras y Checklist',
      description: 'Accede a las listas de compras y checklists operativos.',
      href: '/compras',
      icon: ShoppingCart,
      actionLabel: 'Ir a Compras'
    },
     {
      title: 'Asistente IA',
      description: 'Analiza el estado de tu aplicación y obtén ayuda de la inteligencia artificial.',
      href: '/admin/aaiff-fiesta',
      icon: BrainCircuit,
      actionLabel: 'Consultar a la IA'
    },
    {
      title: 'Configuración General',
      description: 'Ajusta las preferencias de la aplicación, plantillas y detalles de tu cuenta.',
      href: '/settings',
      icon: SettingsIcon,
      actionLabel: 'Ajustar Configuración'
    },
     {
      title: 'Calendario de Eventos',
      description: 'Visualiza rápidamente todas las fechas ocupadas por tus eventos confirmados.',
      href: '/calendario',
      icon: CalendarDays,
      actionLabel: 'Ver Calendario'
    }
]

export default function MainDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline text-primary">
          Bienvenido/a a AK Producciones
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Tu plataforma integral para la gestión de eventos.
        </p>
      </div>

      <div className="flex justify-center flex-wrap gap-3">
        <Link href="/simulador-de-presupuesto" passHref>
          <Button size="lg" variant="outline">
            <Wand2 className="w-5 h-5 mr-2" />
            Simulador de Presupuesto
          </Button>
        </Link>
        <Link href="/presupuestos/nuevo/crear" passHref>
          <Button size="lg">
            <ListChecks className="w-5 h-5 mr-2" />
            Crear Presupuesto Manual
          </Button>
        </Link>
      </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mainHubItems.map((item) => (
          <Card key={item.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl mb-1">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
            </CardContent>
            <CardFooter className="pt-3">
              <Link href={item.href} passHref className="w-full">
                <Button variant="default" className="w-full">
                  {item.actionLabel}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
