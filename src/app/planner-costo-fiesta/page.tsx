
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, ShoppingCart, Calculator, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { updateReposteriaFiestaActual, updateBebidasFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, ReposteriaData, BebidasData } from '@/types/fiesta';
import { GestionReposteria } from '@/components/gastronomia/GestionReposteria';
import { GestionBebidas } from '@/components/gastronomia/GestionBebidas';
import { Presupuesto } from '@/types/presupuesto';
import { getPresupuestoById } from '@/app/actions/presupuestos';

export default function PlannerCostoFiestaHubPage() {
    const { toast } = useToast();
    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [reposteriaData, setReposteriaData] = useState<ReposteriaData | null>(null);
    const [bebidasData, setBebidasData] = useState<BebidasData | null>(null);
    
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const fiestaData = await getFiestaActual();
            setFiesta(fiestaData);
            setReposteriaData(fiestaData.reposteria || null);
            setBebidasData(fiestaData.bebidas || null);

            if (fiestaData.presupuestoId) {
                const presupuestoData = await getPresupuestoById(fiestaData.presupuestoId);
                setPresupuesto(presupuestoData);
                
                // Activar categorías basadas en el presupuesto
                if (presupuestoData && presupuestoData.itemsPresupuestados.length > 0) {
                    const hasReposteria = presupuestoData.itemsPresupuestados.some(item => item.categoriaServicio?.toLowerCase().includes('repostería'));
                    const hasBebidas = presupuestoData.itemsPresupuestados.some(item => item.categoriaServicio?.toLowerCase().includes('bebida'));
                    
                    if (hasReposteria) {
                        setReposteriaData(prev => prev ? { ...prev, categorias: (prev.categorias || []).map(c => ({...c, activada: true})) } : null);
                    }
                    if (hasBebidas) {
                         setBebidasData(prev => prev ? { ...prev, categorias: (prev.categorias || []).map(c => ({...c, activada: true})) } : null);
                    }
                }
            }
        } catch(e) {
            toast({title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive"});
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

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!fiesta) {
        return <div className="text-center p-8"><AlertTriangle className="mx-auto w-8 h-8 text-destructive mb-2"/><p>No se pudo cargar la información del evento.</p></div>
    }

    const { adultos = 0, ninos = 0 } = presupuesto || { adultos: fiesta.configuracion.invitadosEstimados, ninos: 0 };
    const totalInvitados = Number(adultos) + Number(ninos);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Planificador Gastronómico Integral
            </h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button>
        </Link>
      </div>

       <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-xl">Resumen de Invitados</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-sm text-muted-foreground">Adultos</p><p className="text-2xl font-bold">{adultos}</p></div>
            <div><p className="text-sm text-muted-foreground">Niños/Adol.</p><p className="text-2xl font-bold">{ninos}</p></div>
            <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-primary">{totalInvitados}</p></div>
          </CardContent>
          <CardFooter><p className="text-xs text-muted-foreground">Estos datos se sincronizan desde el presupuesto o la configuración del evento.</p></CardFooter>
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
       
       <div className="flex justify-end mt-6">
         <Button onClick={handleSave} disabled={isSaving} size="lg">{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Guardar Todos los Cambios</Button>
       </div>
    </div>
  );
}
