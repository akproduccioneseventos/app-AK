
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Edit, List, Loader2, NotebookText, CheckCircle, XCircle, LinkIcon, FileText, HardHat, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu } from '@/types/catering';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getMenus } from '@/app/actions/menus-catering';
import { getFiestaActual, updateMenuAsignadoFiestaActual } from '@/app/actions/fiesta-actual';

export default function CateringEventoHubPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [savedMenus, setSavedMenus] = useState<FullMenu[]>([]);
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
      setSavedMenus(menusData);
      setFiestaActual(fiestaData);
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
    ? savedMenus.find(m => m.id === fiestaActual.menuAsignadoId)?.name 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
              <div className="flex items-center gap-3">
                  <PlusCircle className="w-8 h-8 text-primary" />
                  <div>
                      <CardTitle className="font-headline text-xl">Crear Nuevo Menú</CardTitle>
                      <CardDescription>Define tus propios menús, platos e ingredientes.</CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                  Crea menús desde cero y calcula costos precisos.
              </p>
              <Link href="/fiestas/nueva/catering/nuevo-menu" passHref>
                  <Button className="w-full">
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Empezar a Crear
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
                      <CardDescription>Genera una lista de compras automática.</CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                  Basado en tu menú y cantidad de invitados.
              </p>
              <Link href="/fiestas/nueva/catering/lista-compras" passHref>
                  <Button className="w-full">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Ver Lista de Compras
                  </Button>
              </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
              <div className="flex items-center gap-3">
                  <HardHat className="w-8 h-8 text-primary" />
                  <div>
                      <CardTitle className="font-headline text-xl">Catálogo de Ingredientes</CardTitle>
                      <CardDescription>Gestiona tu lista maestra de ingredientes.</CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                  Mantén un registro de tus insumos para usarlos en tus menús.
              </p>
              <Link href="/empresa/todos-los-servicios" passHref>
                  <Button className="w-full" variant="secondary">
                      <HardHat className="w-5 h-5 mr-2" />
                      Gestionar Catálogo de Insumos
                  </Button>
              </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-3">
                <List className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle className="font-headline text-xl">Mis Menús Guardados</CardTitle>
                    <CardDescription>Visualiza, edita, elimina o asigna menús a tu fiesta actual.</CardDescription>
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
                <div key={menu.id} className="p-4 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-grow">
                    <h4 className="font-medium text-foreground">{menu.name}</h4>
                    <p className="text-sm text-muted-foreground">{menu.description || 'Sin descripción.'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actualizado: {menu.updatedAt ? new Date(menu.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                    <Link href={`/fiestas/nueva/catering/menu/${menu.id}/editar`} passHref className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    {fiestaActual?.menuAsignadoId === menu.id ? (
                       <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" 
                          disabled
                        >
                         <CheckCircle className="w-4 h-4 mr-2"/> Seleccionado
                       </Button>
                    ) : (
                       <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full" 
                          onClick={() => handleAssignMenu(menu.id)}
                          disabled={assigningMenuId === menu.id || isLoadingFiesta}
                        >
                         {assigningMenuId === menu.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <LinkIcon className="w-4 h-4 mr-2"/>}
                         Asignar a Fiesta
                       </Button>
                    )}
                  </div>
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
                    <List className="w-4 h-4 mr-2" />
                    Ver Todos y Modificar Menús Existentes
                </Button>
            </Link>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Los menús se guardan en un archivo JSON local.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
