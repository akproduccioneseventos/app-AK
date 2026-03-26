
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Save, Loader2, Calculator, ChefHat, GlassWater, RefreshCw, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateReposteriaFiestaActual, updateBebidasFiestaActual, updateMenuAsignadoFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, ReposteriaData, BebidasData, ReposteriaItem } from '@/types/fiesta';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import type { Presupuesto } from '@/types/presupuesto';
import { defaultBebidasData, defaultReposteriaData } from '@/lib/fiesta-defaults';
import { GestionReposteria } from '@/components/gastronomia/GestionReposteria';
import { GestionBebidas } from '@/components/gastronomia/GestionBebidas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu } from '@/types/catering';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function PlannerGastronomicoFiestaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [reposteriaData, setReposteriaData] = useState<ReposteriaData>(defaultReposteriaData);
  const [bebidasData, setBebidasData] = useState<BebidasData>(defaultBebidasData);
  
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(undefined);

  const loadData = useCallback(async (showLoading = true) => {
    if (!fiestaId) return;
    if (showLoading) setIsLoading(true);
    try {
      const [fiestaData, menuTemplates] = await Promise.all([
        getFiestaById(fiestaId),
        getMenus()
      ]);
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      
      setFiesta(fiestaData);
      setAllMenus(menuTemplates);
      
      let initialReposteria = fiestaData.reposteria || defaultReposteriaData;
      let initialBebidas = fiestaData.bebidas || defaultBebidasData;
      let initialMenuId = fiestaData.menuAsignadoId;

      if (fiestaData.presupuestoId) {
        const presupuestoData = await getPresupuestoById(fiestaData.presupuestoId);
        setPresupuesto(presupuestoData);
        
        if (presupuestoData && presupuestoData.itemsPresupuestados.length > 0) {
            // Sincronización automática desde el presupuesto
            
            // 1. Repostería
            const budgetReposteriaItems = presupuestoData.itemsPresupuestados.filter(item => 
                item.categoriaServicio?.toLowerCase().includes('repostería') ||
                item.nombreServicio.toLowerCase().includes('torta')
            );

            if (budgetReposteriaItems.length > 0) {
                initialReposteria = {
                    ...initialReposteria,
                    categorias: initialReposteria.categorias.map(cat => {
                        const itemsInCat = budgetReposteriaItems.filter(bi => 
                            bi.nombreServicio.toLowerCase().includes(cat.nombreDisplay.toLowerCase()) ||
                            (cat.id === 'tortas_personalizadas' && bi.nombreServicio.toLowerCase().includes('torta'))
                        );
                        if (itemsInCat.length > 0) {
                            return { ...cat, activada: true };
                        }
                        return cat;
                    })
                };
            }

            // 2. Bebidas y Barra (Mejorado para detectar "Barra de licuados")
            const budgetBeverageItems = presupuestoData.itemsPresupuestados.filter(item => 
                item.categoriaServicio?.toLowerCase().includes('bebida') ||
                item.nombreServicio.toLowerCase().includes('barra') ||
                item.nombreServicio.toLowerCase().includes('licuado')
            );
            
            if (budgetBeverageItems.length > 0) {
                 initialBebidas = { 
                     ...initialBebidas, 
                     categorias: initialBebidas.categorias.map(c => {
                         const match = budgetBeverageItems.some(bi => 
                            bi.nombreServicio.toLowerCase().includes(c.nombreDisplay.toLowerCase()) ||
                            (c.id === 'barra_tragos' && (bi.nombreServicio.toLowerCase().includes('barra') || bi.nombreServicio.toLowerCase().includes('licuado')))
                         );
                         return match ? { ...c, activada: true } : c;
                     })
                 };
            }

            // 3. Menú Principal
            if (!initialMenuId) {
                const mainDish = presupuestoData.itemsPresupuestados.find(item => 
                    item.categoriaServicio?.toLowerCase().includes('plato principal')
                );
                if (mainDish) {
                    const matchedMenu = menuTemplates.find(m => m.items.some(i => i.id === mainDish.idServicioCatalogo || i.name === mainDish.nombreServicio));
                    if (matchedMenu) initialMenuId = matchedMenu.id;
                }
            }
        }
      }
      
      setReposteriaData(initialReposteria);
      setBebidasData(initialBebidas);
      setSelectedMenuId(initialMenuId);

    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos gastronómicos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

   const handleSaveMenu = async (menuId: string | undefined) => {
        if (!fiestaId) return;
        setIsSaving(true);
        setSelectedMenuId(menuId);
        try {
            await updateMenuAsignadoFiestaActual(fiestaId, menuId);
            toast({ title: "Menú actualizado automáticamente" });
        } catch(e: any) {
            toast({ title: "Error al guardar menú", description: e.message, variant: "destructive"});
        } finally {
            setIsSaving(false);
        }
    }

    const handleSaveReposteria = async (data: ReposteriaData) => {
        if (!fiestaId) return;
        setIsSaving(true);
        setReposteriaData(data);
        try {
            await updateReposteriaFiestaActual(fiestaId, data);
        } catch(e: any) {
            toast({ title: "Error en auto-guardado", description: e.message, variant: "destructive"});
        } finally {
            setIsSaving(false);
        }
    }

    const handleSaveBebidas = async (data: BebidasData) => {
        if (!fiestaId) return;
        setIsSaving(true);
        setBebidasData(data);
        try {
            await updateBebidasFiestaActual(fiestaId, data);
        } catch(e: any) {
            toast({ title: "Error en auto-guardado", description: e.message, variant: "destructive"});
        } finally {
            setIsSaving(false);
        }
    }
  
    const displayAdultos = presupuesto?.invitadosAdultos ?? Number(fiesta?.configuracion.invitadosEstimados) ?? 0;
    const displayNinos = (presupuesto?.invitadosNinos ?? 0) + (presupuesto?.invitadosAdolescentes ?? 0);
    const totalInvitados = displayAdultos + displayNinos;

    const hasBeverageInBudget = presupuesto?.itemsPresupuestados.some(item => 
        item.categoriaServicio?.toLowerCase().includes('bebida') ||
        item.nombreServicio.toLowerCase().includes('barra') ||
        item.nombreServicio.toLowerCase().includes('licuado')
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gastronomía del Evento</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button>
        </Link>
      </div>
      
       <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-xl">Resumen de Invitados</CardTitle>
                <CardDescription>Base para el cálculo automático de cantidades e insumos.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin text-primary"/>}
                <Button variant="ghost" size="sm" onClick={() => loadData(true)} title="Sincronizar con presupuesto">
                    <RefreshCw className="w-4 h-4 mr-2"/> Sincronizar
                </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold">Adultos</p>
                <p className="text-2xl font-bold">{displayAdultos}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold">Niños/Adol.</p>
                <p className="text-2xl font-bold">{displayNinos}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-primary uppercase font-bold">Total</p>
                <p className="text-2xl font-bold text-primary">{totalInvitados}</p>
            </div>
          </CardContent>
          <CardFooter>
             <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5"/>
                Los cambios se guardan automáticamente al modificar menús, bebidas o repostería.
             </p>
          </CardFooter>
      </Card>

      {hasBeverageInBudget && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <GlassWater className="h-4 w-4 text-blue-600" />
              <AlertTitle className="font-bold">Bebida Detectada</AlertTitle>
              <AlertDescription>
                  El presupuesto incluye servicios de bebidas/barra. La sección de <strong>Barra de Tragos</strong> se ha activado automáticamente.
              </AlertDescription>
          </Alert>
      )}
      
       <div className="flex justify-end gap-2">
         <Link href={`/fiestas/nueva/catering/lista-compras?fiestaId=${fiestaId}`}>
           <Button variant="outline" className="bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary">
             <ShoppingCart className="w-4 h-4 mr-2"/> Ver Lista de Compras
           </Button>
         </Link>
      </div>

       {isLoading ? <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div> :
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Menú Principal Seleccionado</CardTitle>
                    <CardDescription>Selecciona una plantilla del catálogo. Los ingredientes se sumarán a la lista de compras automáticamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="menu-select">Seleccionar Menú del Catálogo</Label>
                        <Select value={selectedMenuId || ''} onValueChange={(val) => handleSaveMenu(val === 'ninguno' ? undefined : val)}>
                            <SelectTrigger id="menu-select"><SelectValue placeholder="Seleccionar un menú..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ninguno">Ninguno</SelectItem>
                                {allMenus.map(menu => (
                                    <SelectItem key={menu.id} value={menu.id}>{menu.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <GestionReposteria 
                initialData={reposteriaData} 
                onDataChange={handleSaveReposteria}
                invitados={{adultos: displayAdultos, ninos: displayNinos, adolescentes: 0}} 
            />
            
            <GestionBebidas 
                initialData={bebidasData} 
                onDataChange={handleSaveBebidas}
                invitados={{adultos: displayAdultos, ninos: displayNinos, adolescentes: 0}}
            />
        </>
       }
    </div>
  );
}

export default function PlannerGastronomicoFiestaPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <PlannerGastronomicoFiestaContent />
        </Suspense>
    );
}
