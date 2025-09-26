
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Edit, List, Loader2, NotebookText, CheckCircle, XCircle, LinkIcon, FileText, HardHat, ShoppingCart, Utensils, Calculator } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getMenus } from '@/app/actions/menus-catering';
import { getFiestaActual, updateMenuAsignadoFiestaActual } from '@/app/actions/fiesta-actual';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlatoConMenu extends MenuItem {
  menuId: string;
  menuName: string;
}

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function CateringEventoHubPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [allPlatos, setAllPlatos] = useState<PlatoConMenu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoadingFiesta, setIsLoadingFiesta] = useState(true);
  const [assigningMenuId, setAssigningMenuId] = useState<string | null | undefined>(null);

  const loadData = useCallback(async () => {
    setIsLoadingMenus(true);
    setIsLoadingFiesta(true);
    try {
      const [menusData, fiestaData] = await Promise.all([
        getMenus(),
        getFiestaActual()
      ]);
      setAllMenus(menusData);
      setFiestaActual(fiestaData);
      
      const platos: PlatoConMenu[] = [];
      menusData.forEach(menu => {
          menu.items.forEach(item => {
            platos.push({
              ...item,
              menuId: menu.id,
              menuName: menu.name,
            });
          });
        });
        
      platos.sort((a, b) => (a.totalDishCost || 0) - (b.totalDishCost || 0));
      setAllPlatos(platos);

    } catch (error) {
      console.error("Error al cargar datos de catering:", error);
      toast({
        title: 'Error al Cargar Datos',
        description: 'No se pudieron obtener los menús o la información de la fiesta actual.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMenus(false);
      setIsLoadingFiesta(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const platosAgrupados = useMemo(() => {
    return allPlatos.reduce((acc, plato) => {
      const tipo = plato.type || 'Sin Categoría';
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(plato);
      return acc;
    }, {} as Record<string, PlatoConMenu[]>);
  }, [allPlatos]);

  const handleAssignMenu = async (menuId: string) => {
    setAssigningMenuId(menuId);
    try {
      const result = await updateMenuAsignadoFiestaActual(menuId);
      if (result.success) {
        toast({
          title: 'Menú Asignado',
          description: `El menú ha sido asignado a la fiesta actual.`,
        });
        await loadData(); // Recargar datos para reflejar el cambio
      } else {
        throw new Error(result.error || "No se pudo asignar el menú.");
      }
    } catch (error: any) {
      toast({
        title: 'Error al Asignar Menú',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAssigningMenuId(null);
    }
  };

  const handleUnassignMenu = async () => {
    setAssigningMenuId(fiestaActual?.menuAsignadoId); // Visually indicate which menu is being processed
    try {
      const result = await updateMenuAsignadoFiestaActual(undefined);
      if (result.success) {
        toast({
          title: 'Menú Desasignado',
          description: 'Se ha quitado el menú de la fiesta actual.',
        });
         await loadData(); // Recargar datos
      } else {
        throw new Error(result.error || "No se pudo desasignar el menú.");
      }
    } catch (error: any) {
      toast({
        title: 'Error al Desasignar Menú',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAssigningMenuId(null);
    }
  };

  const assignedMenuName = fiestaActual?.menuAsignadoId 
    ? allMenus.find(m => m.id === fiestaActual.menuAsignadoId)?.name 
    : null;

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

      <Card className="shadow-lg bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="font-headline text-xl">Menú Asignado a la Fiesta Actual</CardTitle>
              <CardDescription>
                Este es el menú seleccionado para el evento que estás planificando.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingFiesta ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Cargando menú asignado...</p>
            </div>
          ) : assignedMenuName ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <p className="text-sm text-green-700">Menú actual:</p>
                <p className="font-semibold text-lg text-green-800">{assignedMenuName}</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleUnassignMenu}
                disabled={assigningMenuId === fiestaActual?.menuAsignadoId}
              >
                {assigningMenuId === fiestaActual?.menuAsignadoId && fiestaActual?.menuAsignadoId !== null ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <XCircle className="w-4 h-4 mr-2" />}
                Quitar Selección
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Aún no has asignado un menú a esta fiesta. Selecciona uno de la lista de abajo o crea uno nuevo.</p>
          )}
        </CardContent>
      </Card>
      
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
              <div className="flex items-center gap-3">
                  <Calculator className="w-8 h-8 text-primary" />
                  <div>
                      <CardTitle className="font-headline text-xl">Calculadora de Costos</CardTitle>
                      <CardDescription>Estima costos y rentabilidad de la gastronomía.</CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                  Utiliza el planificador para un desglose detallado de costos.
              </p>
              <Link href="/planner-costo-fiesta" passHref>
                  <Button className="w-full">
                      <Calculator className="w-5 h-5 mr-2" />
                      Ver Planificador Gastronómico
                  </Button>
              </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
              <div className="flex items-center gap-3">
                  <ShoppingCart className="w-8 h-8 text-primary" />
                  <div>
                      <CardTitle className="font-headline text-xl">Lista de Compras</CardTitle>
                      <CardDescription>Genera una lista de insumos basada en el menú asignado.</CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                  Calcula automáticamente las cantidades necesarias para tus invitados.
              </p>
              <Link href="/fiestas/nueva/catering/lista-compras" passHref>
                  <Button className="w-full">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Generar Lista de Compras
                  </Button>
              </Link>
          </CardContent>
        </Card>
      </div>


      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-3">
                <Utensils className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle className="font-headline text-xl">Plantillas de Menú</CardTitle>
                    <CardDescription>Estos son los menús generales de tu empresa. Puedes asignarlos, editarlos o crear nuevos.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {isLoadingMenus ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando menús...</p>
            </div>
          ) : allMenus.length > 0 ? (
            <div className="space-y-3">
                {allMenus.map((menu) => (
                    <Card key={menu.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{menu.name}</CardTitle>
                            <Link href={`/fiestas/nueva/catering/menu/${menu.id}/editar`} passHref>
                                <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>Editar</Button>
                            </Link>
                          </div>
                          <CardDescription>{menu.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-semibold text-green-700 mb-2">Costo p/Persona: {formatCurrency(menu.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0))}</p>
                          {menu.items.length > 0 && (
                            <ScrollArea className="h-20 text-xs text-muted-foreground border-t pt-2">
                              <ul className="list-disc pl-4 space-y-0.5">
                                {menu.items.map(item => <li key={item.id}>{item.name}</li>)}
                              </ul>
                            </ScrollArea>
                          )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleAssignMenu(menu.id)} disabled={assigningMenuId === menu.id || fiestaActual?.menuAsignadoId === menu.id} className="w-full">
                                {assigningMenuId === menu.id ? <Loader2 className="w-4 h-4 animate-spin"/> : (fiestaActual?.menuAsignadoId === menu.id ? <CheckCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />)}
                                <span className="ml-2">{fiestaActual?.menuAsignadoId === menu.id ? 'Asignado a este evento' : 'Asignar a este evento'}</span>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-md mb-4">
                <Image src="https://placehold.co/300x200.png" alt="Icono de lista de menús vacía" width={100} height={80} className="mx-auto mb-4 opacity-50" data-ai-hint="empty menu list" />
                <p className="text-muted-foreground mb-3">
                    Aún no has creado ningún menú personalizado.
                </p>
                <Link href="/fiestas/nueva/catering/nuevo-menu" passHref>
                    <Button><PlusCircle className="w-4 h-4 mr-2"/>Crear Primer Menú</Button>
                </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
