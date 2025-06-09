
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Edit, List, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const mockSavedMenus = [
  { id: 'menu1', name: 'Menú Clásico Casamiento', description: 'Entrada, principal y postre tradicionales.' },
  { id: 'menu2', name: 'Menú Cumpleaños Infantil', description: 'Opciones divertidas y adaptadas para niños.' },
  { id: 'menu3', name: 'Menú Degustación Gourmet', description: 'Pequeñas porciones de alta cocina.' },
];

export default function CateringEventoHubPage() {

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Catering y Menús
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-3">
                <PlusCircle className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle className="font-headline text-xl">Crear Nuevo Menú Personalizado</CardTitle>
                    <CardDescription>Define tus propios menús, platos e ingredientes con sus costos detallados.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">
                Crea menús desde cero, especificando entradas, platos principales, postres, bebidas y todos los ingredientes necesarios.
                Calcula costos precisos basados en tus recetas.
            </p>
            <Link href="/fiestas/nueva/catering/nuevo-menu" passHref>
                <Button className="w-full sm:w-auto">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Empezar a Crear Menú
                </Button>
            </Link>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-3">
                <List className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle className="font-headline text-xl">Mis Menús Guardados</CardTitle>
                    <CardDescription>Visualiza, edita o elimina los menús que has creado previamente.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {mockSavedMenus.length > 0 ? (
            <div className="space-y-3 mb-4">
              {mockSavedMenus.map((menu) => (
                <div key={menu.id} className="p-3 border rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                  <h4 className="font-medium text-foreground">{menu.name}</h4>
                  <p className="text-sm text-muted-foreground">{menu.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-md mb-4">
                <Image src="https://placehold.co/300x200.png" alt="Icono de lista de menús vacía" width={100} height={80} className="mx-auto mb-4 opacity-50" data-ai-hint="empty menu list" />
                <p className="text-muted-foreground mb-3">
                    Aún no has creado ningún menú personalizado.
                </p>
            </div>
          )}
            <Link href="/fiestas/nueva/catering/modificar-menu" passHref>
                <Button variant="secondary" className="w-full sm:w-auto">
                    <Edit className="w-4 h-4 mr-2" />
                    Modificar Menú Existente
                </Button>
            </Link>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                La funcionalidad completa para listar y modificar menús existentes se está implementando.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
