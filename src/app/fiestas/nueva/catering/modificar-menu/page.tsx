
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, NotebookPen, Loader2, PlusCircle, DollarSign, Utensils } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getMenus } from '@/app/actions/menus-catering';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

// We create a new type that includes the parent menu info for each dish
interface PlatoConMenu extends MenuItem {
  menuId: string;
  menuName: string;
}

export default function SeleccionarPlatoParaModificarPage() {
  const { toast } = useToast();
  const [allPlatos, setAllPlatos] = useState<PlatoConMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPlatos() {
      setIsLoading(true);
      try {
        const menus = await getMenus();
        const platos: PlatoConMenu[] = [];
        menus.forEach(menu => {
          menu.items.forEach(item => {
            platos.push({
              ...item,
              menuId: menu.id,
              menuName: menu.name,
            });
          });
        });
        
        // Ordenar por precio de costo
        platos.sort((a, b) => a.totalDishCost - b.totalDishCost);

        setAllPlatos(platos);
      } catch (error) {
        console.error("Error al cargar platos:", error);
        toast({
          title: 'Error al Cargar Platos',
          description: 'No se pudieron obtener los platos guardados. Intenta de nuevo más tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadPlatos();
  }, [toast]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Catálogo de Platos
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
          <p className="text-muted-foreground">Cargando platos...</p>
        </div>
      ) : allPlatos.length > 0 ? (
        <Card>
          <CardHeader>
             <div className="flex items-center gap-3">
                <Utensils className="w-7 h-7 text-primary" />
                <div>
                    <CardTitle className="font-headline text-xl">Todos los Platos Disponibles</CardTitle>
                    <CardDescription>Visualiza todos tus platos ordenados por costo. Haz clic en "Editar" para modificar sus ingredientes.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
             {allPlatos.map((plato) => {
                const precioFinal = plato.totalDishCost * 2;
                return (
                  <Card key={plato.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-foreground">{plato.name}</p>
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-destructive">Costo p/p:</span> {formatCurrency(plato.totalDishCost)} | <span className="font-medium text-green-600">Venta p/p:</span> {formatCurrency(precioFinal)}
                            </p>
                             <p className="text-xs text-muted-foreground">
                                Pertenece al menú: <i>{plato.menuName}</i>
                            </p>
                        </div>
                        <Link href={`/fiestas/nueva/catering/menu/${plato.menuId}/editar`} passHref>
                            <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        </Link>
                    </CardContent>
                  </Card>
                )
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
              <NotebookPen className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">No Hay Platos Creados</CardTitle>
            <CardDescription className="text-lg">
              Para ver platos aquí, primero debes crearlos dentro de un menú.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
             <Link href="/fiestas/nueva/catering/nuevo-menu" passHref className="inline-block mt-4">
                <Button size="lg"> 
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Crear tu Primer Menú (y sus platos)
                </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
