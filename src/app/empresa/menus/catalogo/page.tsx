
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getMenus } from '@/app/actions/menus-catering';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PlatoConMenu extends MenuItem {
  menuId: string;
  menuName: string;
}

export default function CatalogoPlatosPage() {
  const { toast } = useToast();
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const menusData = await getMenus();
      setAllMenus(menusData);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los menús.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const todosLosPlatos: PlatoConMenu[] = useMemo(() => {
    return allMenus.flatMap(menu =>
      menu.items.map(item => ({
        ...item,
        menuId: menu.id,
        menuName: menu.name,
      }))
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [allMenus]);

  const platosAgrupados = useMemo(() => {
    return todosLosPlatos.reduce((acc, plato) => {
      const categoria = plato.type || 'Sin Categoría';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(plato);
      return acc;
    }, {} as Record<string, PlatoConMenu[]>);
  }, [todosLosPlatos]);


  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Catálogo de Platos
          </h1>
        </div>
        <Link href="/empresa/menus" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Menús
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Todos los Platos Disponibles</CardTitle>
            <CardDescription>Aquí puedes ver todos los platos de todos tus menús, agrupados por tipo. Para editar un plato, edita su menú correspondiente.</CardDescription>
        </CardHeader>
        <CardContent>
            {todosLosPlatos.length > 0 ? (
                 <Accordion type="multiple" defaultValue={Object.keys(platosAgrupados)} className="w-full space-y-2">
                    {Object.keys(platosAgrupados).sort().map(categoria => (
                        <AccordionItem key={categoria} value={categoria} className="border rounded-md">
                            <AccordionTrigger className="px-4 py-2 text-md font-semibold hover:no-underline">{categoria} ({platosAgrupados[categoria].length})</AccordionTrigger>
                            <AccordionContent className="p-2">
                                <ul className="space-y-1">
                                {platosAgrupados[categoria].map(plato => (
                                    <li key={plato.id} className="p-2 border-b text-sm">
                                        <p className="font-medium">{plato.name}</p>
                                        <p className="text-xs text-muted-foreground">Del menú: "{plato.menuName}"</p>
                                    </li>
                                ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            ) : (
                <div className="text-center py-10">
                    <Info className="mx-auto w-10 h-10 text-muted-foreground mb-3"/>
                    <p className="text-muted-foreground">No hay platos en ningún menú.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
