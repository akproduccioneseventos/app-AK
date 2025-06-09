
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, NotebookPen, Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu } from '@/types/catering';
import { getMenus } from '@/app/actions/menus-catering';

export default function SeleccionarMenuParaModificarPage() {
  const { toast } = useToast();
  const [savedMenus, setSavedMenus] = useState<FullMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMenus() {
      setIsLoading(true);
      try {
        const menus = await getMenus();
        setSavedMenus(menus);
      } catch (error) {
        console.error("Error al cargar menús:", error);
        toast({
          title: 'Error al Cargar Menús',
          description: 'No se pudieron obtener los menús guardados. Intenta de nuevo más tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadMenus();
  }, [toast]);

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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando menús guardados...</p>
        </div>
      ) : savedMenus.length > 0 ? (
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
          {savedMenus.map((menu) => (
            <Card key={menu.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="font-headline text-lg">{menu.name}</CardTitle>
                <CardDescription>{menu.description || 'Sin descripción.'}</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center">
                 <p className="text-xs text-muted-foreground">
                    Actualizado: {menu.updatedAt ? new Date(menu.updatedAt).toLocaleDateString() : 'N/A'}
                 </p>
                <Link href={`/fiestas/nueva/catering/menu/${menu.id}/editar`} passHref className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">
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
                <Button size="lg"> 
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Crear tu Primer Menú
                </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
