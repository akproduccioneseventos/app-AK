
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Edit, List, Loader2, NotebookText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu } from '@/types/catering';
import { getMenus } from '@/app/actions/menus-catering';

export default function CateringEventoHubPage() {
  const { toast } = useToast();
  const [savedMenus, setSavedMenus] = useState<FullMenu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);

  useEffect(() => {
    async function loadMenus() {
      setIsLoadingMenus(true);
      try {
        const menus = await getMenus();
        setSavedMenus(menus);
      } catch (error) {
        console.error("Error al cargar menús:", error);
        toast({
          title: 'Error al Cargar Menús',
          description: 'No se pudieron obtener los menús guardados.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingMenus(false);
      }
    }
    loadMenus();
  }, [toast]);

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
          {isLoadingMenus ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando tus menús...</p>
            </div>
          ) : savedMenus.length > 0 ? (
            <div className="space-y-3 mb-4">
              {savedMenus.map((menu) => (
                <Link key={menu.id} href={`/fiestas/nueva/catering/menu/${menu.id}/editar`} passHref>
                  <div className="p-4 border rounded-md bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-foreground">{menu.name}</h4>
                      <p className="text-sm text-muted-foreground">{menu.description || 'Sin descripción.'}</p>
                    </div>
                    <NotebookText className="w-5 h-5 text-primary/70"/>
                  </div>
                </Link>
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
                    Ver y Modificar Menús Existentes
                </Button>
            </Link>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Los menús se guardan en una base de datos simulada.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
