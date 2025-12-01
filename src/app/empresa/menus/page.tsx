
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, ChefHat, PlusCircle, Copy, Edit, Trash2, Loader2, DollarSign, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMenus, deleteMenu, duplicateMenu } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
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
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function GestionMenusPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<FullMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMenus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMenus();
      setMenus(data);
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar los menús.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleDelete = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const result = await deleteMenu(id);
      if (result.success) {
        toast({ title: 'Menú Eliminado', description: `Se eliminó "${name}".` });
        fetchMenus();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al Eliminar', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const result = await duplicateMenu(id);
      if (result.success) {
        toast({ title: 'Menú Duplicado', description: `Se creó una copia de "${name}".` });
        fetchMenus();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al Duplicar', description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };
  
  const calculateTotalCostPerPerson = (items: MenuItem[]) => {
    return items.reduce((total, item) => total + (item.totalDishCost || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador Gastronómico Maestro</h1>
        </div>
         <div className="flex gap-2">
            <Link href="/empresa/menus/nuevo" passHref><Button><PlusCircle className="w-4 h-4 mr-2"/>Crear Menú</Button></Link>
            <Link href="/empresa" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Button></Link>
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Menús Guardados</CardTitle>
          <CardDescription>Crea, edita y gestiona tus plantillas de menús para reutilizar en presupuestos y eventos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
          ) : menus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map(menu => (
              <Card key={menu.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">{menu.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 h-8">{menu.description || 'Sin descripción.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                   <div className="flex items-center gap-2 text-sm font-semibold">
                      <DollarSign className="w-4 h-4 text-green-600"/>
                      Costo p/p: {formatCurrency(calculateTotalCostPerPerson(menu.items))}
                   </div>
                   <div className="text-xs text-muted-foreground">{menu.items.length} plato(s)</div>
                </CardContent>
                <CardFooter className="flex justify-end gap-1 border-t pt-2 p-2">
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(menu.id, menu.name)} disabled={!!processingId} title="Duplicar">
                      {processingId === menu.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                   </Button>
                   <Link href={`/empresa/menus/${menu.id}/editar`} passHref>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"><Edit className="w-4 h-4"/></Button>
                   </Link>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={!!processingId} title="Eliminar">
                          {processingId === menu.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar Menú?</AlertDialogTitle><AlertDialogDescription>Se eliminará la plantilla "{menu.name}".</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(menu.id, menu.name)} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                </CardFooter>
              </Card>
            ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
                <Info className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                <p>No has creado ninguna plantilla de menú todavía.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
