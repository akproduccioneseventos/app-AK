
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, PlusCircle, Edit, List, Loader2, Info, Package, Cake, GlassWater, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, ReposteriaData, BebidasData } from '@/types/fiesta';
import { getMenus } from '@/app/actions/menus-catering';
import { getReposteriaMasterTemplate, saveReposteriaMasterTemplate } from '@/app/actions/reposteria.actions';
import { getBebidasMasterTemplate, saveBebidasMasterTemplate } from '@/app/actions/bebidas.actions';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa } from '@/types/empresa';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from "@/components/ui/accordion";
import { GestionReposteria } from '@/components/gastronomia/GestionReposteria';
import { GestionBebidas } from '@/components/gastronomia/GestionBebidas';
import { InsumosStockList } from '@/components/gastronomia/InsumosStockList';


export default function GestionMenusPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<FullMenu[]>([]);
  const [reposteriaTemplate, setReposteriaTemplate] = useState<ReposteriaData | null>(null);
  const [bebidasTemplate, setBebidasTemplate] = useState<BebidasData | null>(null);
  const [insumos, setInsumos] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [menusData, reposteriaData, bebidasData, serviciosData] = await Promise.all([
        getMenus(),
        getReposteriaMasterTemplate(),
        getBebidasMasterTemplate(),
        getServiciosEmpresa()
      ]);
      setMenus(menusData);
      setReposteriaTemplate(reposteriaData);
      setBebidasTemplate(bebidasData);
      setInsumos(serviciosData.filter(s => s.tipoItem === 'Insumo/Ingrediente' || s.tipoItem === 'Bebida (Insumo)'));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas gastronómicas.', variant: 'destructive' });
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
          <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador Gastronómico Maestro</h1>
        </div>
        <Link href="/empresa" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Button>
        </Link>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">Catálogo Maestro de Gastronomía</CardTitle>
          <CardDescription>Este es tu centro de control para todo lo relacionado con la comida. Define tus plantillas de menús, platos, repostería, bebidas e insumos aquí.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
           <Link href="/empresa/menus/nuevo" passHref>
            <Button><PlusCircle className="w-4 h-4 mr-2"/>Crear Plantilla de Menú</Button>
           </Link>
           <Link href="/empresa/menus/catalogo" passHref>
            <Button variant="secondary"><List className="w-4 h-4 mr-2"/>Ver Catálogo de Platos</Button>
           </Link>
            <Link href="/empresa/menus/reporte" passHref>
                <Button variant="outline"><Printer className="w-4 h-4 mr-2"/>Reporte Gastronómico</Button>
           </Link>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
      ) : (
        <div className="space-y-4">
             <Accordion type="multiple" defaultValue={['menus', 'reposteria', 'bebidas', 'insumos']} className="w-full space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Plantillas de Menú de Platos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {menus.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menus.map((menu) => (
                            <Card key={menu.id} className="shadow-sm hover:shadow-md transition-shadow bg-muted/30">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                                    <Link href={`/empresa/menus/${encodeURIComponent(menu.id)}/editar`} passHref>
                                        <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>Editar</Button>
                                    </Link>
                                    </div>
                                    <CardDescription>{menu.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {(menu.items || []).length > 0 && (
                                    <ScrollArea className="h-20 text-xs text-muted-foreground border-t pt-2">
                                        <p className="font-semibold text-xs mb-1">Platos Incluidos:</p>
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
                         <Card className="text-center py-10"><CardContent><Info className="w-10 h-10 mx-auto text-muted-foreground mb-3"/><p className="text-muted-foreground">No has creado ninguna plantilla de menú todavía.</p></CardContent></Card>
                    )}
                  </CardContent>
                </Card>
                
                {reposteriaTemplate && (
                  <GestionReposteria 
                        initialData={reposteriaTemplate} 
                        onDataChange={(newData) => {
                            setReposteriaTemplate(newData);
                            saveReposteriaMasterTemplate(newData); // Save on change
                        }}
                        invitados={{adultos: 100, ninos: 0, adolescentes: 0}} // Placeholder for calculations
                        isTemplateMode={true}
                    />
                )}

                {bebidasTemplate && (
                  <GestionBebidas 
                    initialData={bebidasTemplate} 
                    onDataChange={(newData) => {
                        setBebidasTemplate(newData);
                        saveBebidasMasterTemplate(newData); // Save on change
                    }}
                    invitados={{adultos: 100, ninos: 0, adolescentes: 0}} // Placeholder
                    isTemplateMode={true}
                />
                )}

                <InsumosStockList insumos={insumos} onUpdate={loadData} />
            </Accordion>
        </div>
      )}
    </div>
  );
}
