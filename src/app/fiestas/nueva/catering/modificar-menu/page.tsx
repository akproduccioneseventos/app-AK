
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, NotebookPen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Re-usamos la misma estructura de mock que en la página de catering principal
const mockSavedMenus = [
  { id: 'menu1', name: 'Menú Clásico Casamiento', description: 'Entrada, principal y postre tradicionales.' },
  { id: 'menu2', name: 'Menú Cumpleaños Infantil', description: 'Opciones divertidas y adaptadas para niños.' },
  { id: 'menu3', name: 'Menú Degustación Gourmet', description: 'Pequeñas porciones de alta cocina.' },
  { id: 'menu_vegetariano_boda', name: 'Menú Vegetariano Boda de Lujo', description: 'Alta cocina vegetariana para eventos especiales.' },
  { id: 'menu_brunch_corporativo', name: 'Brunch Corporativo Energizante', description: 'Opciones ligeras y nutritivas para reuniones de trabajo.' },
];

export default function SeleccionarMenuParaModificarPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Seleccionar Menú para Modificar
        </h1>
        <Link href="/fiestas/nueva/catering" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Catering
          </Button>
        </Link>
      </div>

      {mockSavedMenus.length > 0 ? (
        <div className="space-y-4">
          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <NotebookPen className="w-7 h-7 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-xl">Tus Menús Personalizados</CardTitle>
                        <CardDescription>Seleccioná un menú de la lista para ver sus detalles y realizar modificaciones.</CardDescription>
                    </div>
                </div>
            </CardHeader>
          </Card>
          {mockSavedMenus.map((menu) => (
            <Card key={menu.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="font-headline text-lg">{menu.name}</CardTitle>
                <CardDescription>{menu.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href={`/fiestas/nueva/catering/menu/${menu.id}/editar`} passHref className="w-full sm:w-auto">
                  <Button className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar este Menú
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
              <NotebookPen className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">No Hay Menús Guardados</CardTitle>
            <CardDescription className="text-lg">
              Aún no has creado ningún menú personalizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Cuando crees menús, aparecerán aquí para que puedas editarlos.
            </p>
            <Image 
              src="https://placehold.co/500x250.png" 
              alt="Lista de menús vacía" 
              width={400}
              height={200}
              className="mt-6 rounded-md shadow-md mx-auto"
              data-ai-hint="empty list illustration"
            />
            <Link href="/fiestas/nueva/catering/nuevo-menu" passHref className="inline-block mt-4">
                <Button>Crear tu Primer Menú</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
