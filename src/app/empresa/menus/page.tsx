
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, PlusCircle, Edit, List, Loader2, Info, Package, Calculator, ShoppingCart, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu } from '@/types/catering';
import { getMenus } from '@/app/actions/menus-catering';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFiestaActual, updateReposteriaFiestaActual, updateBebidasFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, ReposteriaData, BebidasData } from '@/types/fiesta';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import type { Presupuesto } from '@/types/presupuesto';
import { defaultBebidasData, defaultReposteriaData } from '@/lib/fiesta-defaults';
import { GestionReposteria } from '@/components/gastronomia/GestionReposteria';
import { GestionBebidas } from '@/components/gastronomia/GestionBebidas';
import { Separator } from '@/components/ui/separator';


const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function PlannerGastronomicoPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<FullMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State from planner-costo-fiesta
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [reposteriaData, setReposteriaData] = useState<ReposteriaData>(defaultReposteriaData);
  const [bebidasData, setBebidasData] = useState<BebidasData>(defaultBebidasData);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [menusData, fiestaData] = await Promise.all([
        getMenus(),
        getFiestaActual()
      ]);
      setMenus(menusData);
      setFiesta(fiestaData);
      
      let initialReposteria = fiestaData.reposteria || defaultReposteriaData;
      let initialBebidas = fiestaData.bebidas || defaultBebidasData;

      if (fiestaData.presupuestoId) {
        const presupuestoData = await getPresupuestoById(fiestaData.presupuestoId);
        setPresupuesto(presupuestoData);
        
        if (presupuestoData && presupuestoData.itemsPresupuestados.length > 0) {
            const hasReposteria = presupuestoData.itemsPresupuestados.some(item => item.categoriaServicio?.toLowerCase().includes('repostería'));
            const hasBebidas = presupuestoData.itemsPresupuestados.some(item => item.categoriaServicio?.toLowerCase().includes('bebida'));
            
            if (hasReposteria) {
                initialReposteria = { ...initialReposteria, categorias: (initialReposteria.categorias || []).map(c => ({...c, activada: true})) };
            }
            if (hasBebidas) {
                 initialBebidas = { ...initialBebidas, categorias: (initialBebidas.categorias || []).map(c => ({...c, activada: true})) };
            }
        }
      }
      
      setReposteriaData(initialReposteria);
      setBebidasData(initialBebidas);

    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos gastronómicos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

   const handleSave = async () => {
        setIsSaving(true);
        try {
            if (reposteriaData) await updateReposteriaFiestaActual(reposteriaData);
            if (bebidasData) await updateBebidasFiestaActual(bebidasData);
            toast({ title: "Guardado", description: "Los cambios en la planificación gastronómica han sido guardados."});
        } catch(e: any) {
            toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive"});
        } finally {
            setIsSaving(false);
        }
    }
  
    const { adultos = 0, ninos = 0 } = presupuesto || { adultos: fiesta?.configuracion.invitadosEstimados || 0, ninos: 0 };
    const totalInvitados = Number(adultos) + Number(ninos);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador Gastronómico Integral</h1>
        </div>
        <Link href="/empresa" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Button>
        </Link>
      </div>
      
       <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-xl">Resumen de Invitados</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-sm text-muted-foreground">Adultos</p><p className="text-2xl font-bold">{adultos}</p></div>
            <div><p className="text-sm text-muted-foreground">Niños/Adol.</p><p className="text-2xl font-bold">{ninos}</p></div>
            <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-primary">{totalInvitados}</p></div>
          </CardContent>
          <CardFooter><p className="text-xs text-muted-foreground">Datos sincronizados desde el presupuesto o la configuración del evento actual.</p></CardFooter>
      </Card>
      
       <div className="flex justify-end gap-2">
         <Link href="/fiestas/nueva/catering/lista-compras" passHref>
           <Button variant="outline"><ShoppingCart className="w-4 h-4 mr-2"/>Ver Lista de Compras</Button>
         </Link>
         <Button onClick={handleSave} disabled={isSaving}>{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Guardar Cambios</Button>
      </div>

       <GestionReposteria 
        initialData={reposteriaData} 
        onDataChange={setReposteriaData} 
        invitados={{adultos: Number(adultos), ninos: Number(ninos), adolescentes: 0}} 
       />
       
       <GestionBebidas 
        initialData={bebidasData} 
        onDataChange={setBebidasData}
        invitados={{adultos: Number(adultos), ninos: Number(ninos), adolescentes: 0}}
       />

      <Separator className="my-8" />
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2"><ChefHat/>Catálogo Maestro de Gastronomía</CardTitle>
          <CardDescription>Este es tu centro de control para todo lo relacionado con la comida. Define tus menús, platos, e ingredientes base aquí.</CardDescription>
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
