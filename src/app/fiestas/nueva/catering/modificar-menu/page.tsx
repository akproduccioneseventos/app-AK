
'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, NotebookPen, Loader2, PlusCircle, DollarSign, Utensils, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getMenus, deleteMenu } from '@/app/actions/menus-catering';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

// We create a new type that includes the parent menu info for each dish
interface PlatoConMenu extends MenuItem {
  menuId: string;
  menuName: string;
}

export default function CatalogoPlatosPage() {
  const { toast } = useToast();
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [allPlatos, setAllPlatos] = useState<PlatoConMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadData = async () => {
      setIsLoading(true);
      try {
        const menus = await getMenus();
        setAllMenus(menus);
        const platos: PlatoConMenu[] = [];
        menus.forEach(menu => {
          menu.items.forEach(item => {
            platos.push({ ...item, menuId: menu.id, menuName: menu.name });
          });
        });
        platos.sort((a, b) => (a.totalDishCost || 0) - (b.totalDishCost || 0));
        setAllPlatos(platos);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast({ title: 'Error al Cargar Datos', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    
  useEffect(() => {
    loadData();
  }, [toast]);
  
  const handleDeleteMenu = async (menuId: string, menuName: string) => {
    setIsDeleting(menuId);
    try {
      const result = await deleteMenu(menuId);
      if (result.success) {
        toast({ title: "Menú Eliminado", description: `El menú "${menuName}" fue eliminado.` });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch(e: any) {
      toast({title: "Error al eliminar", description: e.message, variant: "destructive"});
    } finally {
      setIsDeleting(null);
    }
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Menús
        </h1>
        <Link href="/empresa" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Gestión Empresa
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-end">
          <Link href="/fiestas/nueva/catering/nuevo-menu" passHref className="inline-block">
            <Button size="lg"> 
                <PlusCircle className="w-5 h-5 mr-2" />
                Crear Nuevo Menú
            </Button>
        </Link>
      </div>


      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando menús y platos...</p>
        </div>
      ) : allMenus.length > 0 ? (
        <Card>
          <CardHeader>
             <div className="flex items-center gap-3">
                <Utensils className="w-7 h-7 text-primary" />
                <div>
                    <CardTitle className="font-headline text-xl">Todos los Menús Creados ({allMenus.length})</CardTitle>
                    <CardDescription>Visualiza, edita o elimina los menús de tu empresa.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
             {allMenus.map((menu) => {
                const costoTotalMenu = menu.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0);
                return (
                  <Card key={menu.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{menu.name}</CardTitle>
                            <div className="flex gap-2">
                                <Link href={`/fiestas/nueva/catering/menu/${encodeURIComponent(menu.id)}/editar`} passHref>
                                    <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2" />Editar</Button>
                                </Link>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={isDeleting === menu.id}>
                                            {isDeleting === menu.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar Menú?</AlertDialogTitle>
                                            <AlertDialogDescription>Se eliminará el menú "{menu.name}" y todos sus platos. Esta acción no se puede deshacer.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteMenu(menu.id, menu.name)}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <CardDescription>{menu.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-semibold text-green-700">Costo Total por Persona: {formatCurrency(costoTotalMenu)}</p>
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
            <CardTitle className="font-headline text-2xl">No Hay Menús Creados</CardTitle>
            <CardDescription className="text-lg">
              Empieza por crear tu primer menú para poder asignarlo a los eventos.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
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
