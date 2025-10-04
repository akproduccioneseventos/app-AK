'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, PlusCircle, Edit, List, Loader2, Info, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu } from '@/types/catering';
import { getMenus } from '@/app/actions/menus-catering';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function GestionMenusPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<FullMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const menusData = await getMenus();
      setMenus(menusData);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los menús.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Menús y Catering</h1>
        </div>
        <Link href="/empresa" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo Maestro de Gastronomía</CardTitle>
          <CardDescription>Este es tu centro de control para todo lo relacionado con la comida. Define tus menús, platos, e ingredientes base aquí. Luego, úsalos en el "Planificador Gastronómico" de cada evento.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
           <Link href="/empresa/menus/nuevo" passHref>
            <Button><PlusCircle className="w-4 h-4 mr-2"/>Crear Plantilla de Menú</Button>
           </Link>
           <Link href="/empresa/menus/catalogo" passHref>
            <Button variant="secondary"><List className="w-4 h-4 mr-2"/>Ver Catálogo de Platos</Button>
           </Link>
           <Link href="/empresa/insumos" passHref>
            <Button variant="outline"><Package className="w-4 h-4 mr-2"/>Gestionar Insumos</Button>
           </Link>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
      ) : menus.length > 0 ? (
        <div className="space-y-4">
          {menus.map((menu) => (
             <Card key={menu.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                    <Link href={`/empresa/menus/${encodeURIComponent(menu.id)}/editar`} passHref>
                        <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>Editar Plantilla</Button>
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
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10">
          <CardContent>
            <Info className="w-10 h-10 mx-auto text-muted-foreground mb-3"/>
            <p className="text-muted-foreground">No has creado ninguna plantilla de menú todavía.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
