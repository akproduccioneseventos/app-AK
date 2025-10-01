
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cake, GlassWater, ShoppingCart, Calculator, ChefHat } from 'lucide-react';

interface HubItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  actionLabel: string;
}

const gastronomicHubItems: HubItem[] = [
  {
    title: 'Gestión de Menú',
    description: 'Asigna el menú principal y gestiona los platos para la fiesta.',
    href: '/fiestas/nueva/catering',
    icon: ChefHat,
    actionLabel: 'Gestionar Menú',
  },
  {
    title: 'Planificador de Repostería',
    description: 'Calcula porciones y costos de tortas, postres y mesas dulces.',
    href: '/fiestas/nueva/planner-costo-fiesta/reposteria',
    icon: Cake,
    actionLabel: 'Gestionar Repostería',
  },
  {
    title: 'Planificador de Bebidas',
    description: 'Estima la cantidad y costo de bebidas, incluyendo la barra de tragos.',
    href: '/fiestas/nueva/planner-costo-fiesta/bebidas',
    icon: GlassWater,
    actionLabel: 'Gestionar Bebidas',
  },
  {
    title: 'Lista de Compras Gastronómica',
    description: 'Genera una lista consolidada de todos los insumos necesarios.',
    href: '/fiestas/nueva/catering/lista-compras',
    icon: ShoppingCart,
    actionLabel: 'Ver Lista de Compras',
  },
];

export default function PlannerCostoFiestaHubPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Planificador Gastronómico Integral
            </h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Módulo Gastronómico Centralizado</CardTitle>
          <CardDescription className="text-lg">
            Desde aquí puedes acceder a todas las herramientas para planificar la comida y bebida de tu evento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {gastronomicHubItems.map(item => (
                 <Card key={item.title} className="hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col">
                    <CardHeader><CardTitle className="flex items-center gap-2"><item.icon className="text-primary"/>{item.title}</CardTitle></CardHeader>
                    <CardContent className="flex-grow"><p className="text-sm text-muted-foreground">{item.description}</p></CardContent>
                     <CardFooter>
                        <Link href={item.href} passHref className="w-full">
                            <Button className="w-full">{item.actionLabel}</Button>
                        </Link>
                    </CardFooter>
                </Card>
            ))}
        </CardContent>
      </Card>
       <p className="text-xs text-center text-muted-foreground">
        Este módulo centraliza los accesos a las diferentes áreas de planificación gastronómica para una gestión más eficiente.
      </p>
    </div>
  );
}
