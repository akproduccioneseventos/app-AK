'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, AlertTriangle, Cake, PlusCircle, Wand2, Trash2, ChevronDown, Settings, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ReposteriaData, ReposteriaCategoria, ReposteriaItem, ReposteriaConsumoConfig } from '@/types/fiesta';
import { getFiestaActual, updateReposteriaFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultReposteriaCategorias, defaultReposteriaConsumoConfig } from '@/lib/fiesta-defaults';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function GestionReposteriaPage() {
  const { toast } = useToast();
  const [reposteriaData, setReposteriaData] = useState<ReposteriaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ReposteriaItem> | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);

  const [numAdultos, setNumAdultos] = useState(0);
  const [numAdolescentes, setNumAdolescentes] = useState(0);
  const [numNinos, setNumNinos] = useState(0);
  
  const [consumoConfig, setConsumoConfig] = useState<ReposteriaConsumoConfig>(defaultReposteriaConsumoConfig);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      const config = fiestaData.configuracion;
      setNumAdultos(Number(config.invitadosEstimados) || 0);
      
      const fetchedReposteriaData = fiestaData.reposteria || { categorias: [], notasGenerales: '' };
       const mergedCategorias = defaultReposteriaCategorias.map(defaultCat => {
        const savedCat = fetchedReposteriaData.categorias?.find(sc => sc.id === defaultCat.id);
        const mergedCat = savedCat ? { ...defaultCat, ...savedCat } : { ...defaultCat };
        mergedCat.items = mergedCat.items || [];
        return mergedCat;
      });
      setReposteriaData({
        ...fetchedReposteriaData,
        categorias: mergedCategorias,
        consumoConfig: fetchedReposteriaData.consumoConfig || defaultReposteriaConsumoConfig,
        notasGenerales: fetchedReposteriaData.notasGenerales || '',
      });
      setConsumoConfig(fetchedReposteriaData.consumoConfig || defaultReposteriaConsumoConfig);

    } catch (err: any) {
      setError("No se pudieron cargar los datos de repostería.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleConsumoConfigChange = (categoriaId: keyof ReposteriaConsumoConfig, tipoAsistente: keyof ReposteriaConsumoConfig[keyof ReposteriaConsumoConfig], value: string) => {
    const numValue = parseFloat(value) || 0;
    setConsumoConfig(prev => {
        if (!prev) return defaultReposteriaConsumoConfig;
        const newConfig = JSON.parse(JSON.stringify(prev));
        newConfig[categoriaId][tipoAsistente] = numValue;
        return newConfig;
    });
  };

  const handleCategoryChange = (
    categoryId: ReposteriaCategoria['id'],
    field: keyof Omit<ReposteriaCategoria, 'id' | 'items' | 'nombreDisplay'>,
    value: string | boolean
  ) => {
    setReposteriaData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categorias: prev.categorias.map(cat =>
          cat.id === categoryId ? { ...cat, [field]: value } : cat
        ),
      };
    });
  };

  const handleNotasGeneralesChange = (value: string) => {
    setReposteriaData(prev => prev ? ({ ...prev, notasGenerales: value }) : null);
  };

  const openItemModal = (categoryId: string, item?: ReposteriaItem) => {
    setCurrentCategoryId(categoryId);
    setCurrentItem(item ? { ...item } : { id: '', nombre: '', cantidad: 1, unidad: 'unidad', costoEstimado: 0 });
    setIsItemModalOpen(true);
  };

  const handleItemModalChange = (field: keyof ReposteriaItem, value: string | number) => {
    setCurrentItem(prev => (prev ? { ...prev, [field]: value } : null));
  };
  
  const handleItemModalSave = () => {
    if (!currentItem || !currentItem.nombre?.trim() || !currentCategoryId) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }
    const finalItem: ReposteriaItem = {
      id: currentItem.id || `reposteriaItem_${Date.now()}`,
      nombre: currentItem.nombre,
      descripcion: currentItem.descripcion,
      cantidad: Number(currentItem.cantidad) || 1,
      unidad: currentItem.unidad || 'unidad',
      costoEstimado: Number(currentItem.costoEstimado) || 0,
      notas: currentItem.notas,
    };
    setReposteriaData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            categorias: prev.categorias.map(cat => {
                if (cat.id !== currentCategoryId) return cat;
                const itemExists = cat.items.some(it => it.id === finalItem.id);
                const newItems = itemExists 
                    ? cat.items.map(it => it.id === finalItem.id ? finalItem : it)
                    : [...cat.items, finalItem];
                return { ...cat, items: newItems };
            })
        }
    });
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setReposteriaData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            categorias: prev.categorias.map(cat => 
                cat.id === categoryId
                ? { ...cat, items: cat.items.filter(it => it.id !== itemId) }
                : cat
            )
        }
    })
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reposteriaData) return;
    setIsSaving(true);
    const dataToSave: ReposteriaData = {
        ...reposteriaData,
        consumoConfig: consumoConfig,
    };
    try {
      const result = await updateReposteriaFiestaActual(dataToSave);
      if (result.success && result.updatedData) {
        toast({ title: "¡Repostería Guardada!", description: "Los detalles de repostería se han actualizado." });
        const mergedCategorias = defaultReposteriaCategorias.map(defaultCat => {
            const savedCat = result.updatedData?.categorias?.find(sc => sc.id === defaultCat.id);
            return savedCat ? { ...defaultCat, ...savedCat, items: savedCat.items || [] } : { ...defaultCat, items: [] };
        });
        setReposteriaData({
            categorias: mergedCategorias,
            consumoConfig: result.updatedData?.consumoConfig || defaultReposteriaConsumoConfig,
            notasGenerales: result.updatedData?.notasGenerales || '',
        });
      } else {
        throw new Error(result.error || "Error desconocido al guardar la repostería.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !reposteriaData) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-[400px] text-center"><AlertTriangle className="w-12 h-12 text-destructive mb-4" /><h2 className="text-xl font-semibold mb-2">Error</h2><p className="text-muted-foreground">{error}</p><Button onClick={loadData} className="mt-4">Reintentar</Button></div>;
  }

  const totalInvitados = numAdultos + numAdolescentes + numNinos;
  const costoTotalGeneral = reposteriaData.categorias.reduce((sumCat, cat) => {
    if (!cat.activada) return sumCat;
    return sumCat + cat.items.reduce((sumItem, item) => sumItem + (item.costoEstimado || 0) * (item.cantidad || 1), 0);
  }, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Producto</DialogTitle></DialogHeader>
            {currentItem && (
                <div className="space-y-3">
                    <div className="space-y-1"><Label htmlFor="item-nombre">Nombre *</Label><Input id="item-nombre" value={currentItem.nombre || ''} onChange={(e) => handleItemModalChange('nombre', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label htmlFor="item-qty">Cantidad</Label><Input id="item-qty" type="number" value={currentItem.cantidad || 1} onChange={(e) => handleItemModalChange('cantidad', Number(e.target.value))}/></div>
                        <div className="space-y-1"><Label htmlFor="item-costo">Costo Total Est.</Label><Input id="item-costo" type="number" value={currentItem.costoEstimado || 0} onChange={(e) => handleItemModalChange('costoEstimado', Number(e.target.value))}/></div>
                    </div>
                    <div className="space-y-1"><Label htmlFor="item-desc">Descripción</Label><Textarea id="item-desc" value={currentItem.descripcion || ''} onChange={(e) => handleItemModalChange('descripcion', e.target.value)} rows={2}/></div>
                </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleItemModalSave}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cake className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador de Repostería</h1>
        </div>
        <Link href="/planner-costo-fiesta" passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button>
        </Link>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Settings className="text-primary"/>Parámetros del Cálculo</CardTitle>
          <CardDescription>Define la cantidad de invitados para estimar el consumo de repostería.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1"><Label htmlFor="num-adultos">Nº Adultos</Label><Input id="num-adultos" type="number" value={numAdultos} onChange={(e) => setNumAdultos(Number(e.target.value) || 0)} min="0"/></div>
                <div className="space-y-1"><Label htmlFor="num-adolescentes">Nº Adolescentes</Label><Input id="num-adolescentes" type="number" value={numAdolescentes} onChange={(e) => setNumAdolescentes(Number(e.target.value) || 0)} min="0"/></div>
                <div className="space-y-1"><Label htmlFor="num-ninos">Nº Niños</Label><Input id="num-ninos" type="number" value={numNinos} onChange={(e) => setNumNinos(Number(e.target.value) || 0)} min="0"/></div>
            </div>
            <div className="p-3 border rounded-md bg-muted/50 text-center font-medium">
                Total Invitados: <span className="text-primary font-bold">{totalInvitados}</span>
            </div>
        </CardContent>
         <CardFooter className="flex justify-end">
            <Sheet>
                <SheetTrigger asChild><Button variant="secondary"><Settings className="w-4 h-4 mr-2"/>Configurar Cálculos</Button></SheetTrigger>
                <SheetContent>
                    <SheetHeader><SheetTitle>Configurar Estimaciones de Consumo</SheetTitle><SheetDescription>Define las porciones recomendadas por persona para cada categoría.</SheetDescription></SheetHeader>
                    <ScrollArea className="h-[calc(100vh-12rem)] mt-4 pr-3">
                        <div className="space-y-4 py-2">
                        {Object.entries(consumoConfig).map(([catId, values]) => (
                            <Card key={catId} className="p-3">
                                <h4 className="font-semibold text-sm mb-2">{defaultReposteriaCategorias.find(c=>c.id === catId)?.nombreDisplay}</h4>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1"><Label>Adulto (porciones)</Label><Input type="number" value={values.adulto} onChange={e => handleConsumoConfigChange(catId as keyof ReposteriaConsumoConfig, 'adulto', e.target.value)} step="0.1"/></div>
                                    <div className="space-y-1"><Label>Adolescente (porciones)</Label><Input type="number" value={values.adolescente} onChange={e => handleConsumoConfigChange(catId as keyof ReposteriaConsumoConfig, 'adolescente', e.target.value)} step="0.1"/></div>
                                    <div className="space-y-1 col-span-2"><Label>Niño (porciones)</Label><Input type="number" value={values.nino} onChange={e => handleConsumoConfigChange(catId as keyof ReposteriaConsumoConfig, 'nino', e.target.value)} step="0.1"/></div>
                                </div>
                            </Card>
                        ))}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
         </CardFooter>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Categorías de Repostería</CardTitle>
            <CardDescription>Activa y configura las categorías de repostería para tu evento.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={reposteriaData.categorias.filter(c=>c.activada).map(c => c.id)} className="w-full space-y-3">
              {reposteriaData.categorias.map(cat => {
                const consumoAdultos = (consumoConfig[cat.id]?.adulto || 0) * numAdultos;
                const consumoAdolescentes = (consumoConfig[cat.id]?.adolescente || 0) * numAdolescentes;
                const consumoNinos = (consumoConfig[cat.id]?.nino || 0) * numNinos;
                const totalPorcionesNecesarias = consumoAdultos + consumoAdolescentes + consumoNinos;
                const costoTotalCategoria = cat.items.reduce((sum, item) => sum + (item.costoEstimado || 0) * (item.cantidad || 1), 0);

                return (
                <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm bg-card">
                  <AccordionPrimitive.Header className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-t-lg">
                    <AccordionPrimitive.Trigger
                      className={cn( "flex flex-1 items-center gap-2 text-lg font-medium text-primary hover:no-underline", "[&[data-state=open]>svg:last-child]:rotate-180" )}>
                      <Wand2 className="w-5 h-5 text-primary/80" />
                      {cat.nombreDisplay}
                      <Badge variant="secondary" className="ml-2">Est: {totalPorcionesNecesarias.toFixed(1)} porciones</Badge>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-auto" />
                    </AccordionPrimitive.Trigger>
                    <Checkbox
                      checked={cat.activada}
                      onCheckedChange={(checked) => handleCategoryChange(cat.id, 'activada', !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="ml-4 flex-shrink-0"
                      aria-label={`Activar ${cat.nombreDisplay}`}
                    />
                  </AccordionPrimitive.Header>
                  <AccordionContent className="px-4 pt-2 pb-4 border-t space-y-4">
                    {cat.activada && (
                      <>
                        <div className="space-y-2 mt-2"><Label htmlFor={`desc-${cat.id}`}>Descripción</Label><Textarea id={`desc-${cat.id}`} value={cat.descripcion || ''} onChange={(e) => handleCategoryChange(cat.id, 'descripcion', e.target.value)} rows={2} placeholder="Detalles, sabores, etc." /></div>
                        
                        <Separator/>
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm">Productos en esta categoría</h4>
                            <Button type="button" size="sm" variant="outline" onClick={() => openItemModal(cat.id)}><PlusCircle className="w-4 h-4 mr-1.5"/>Añadir Producto</Button>
                        </div>
                        {cat.items.length > 0 ? (
                            <ul className="space-y-2">
                                {cat.items.map(item => (
                                    <li key={item.id} className="flex items-center justify-between p-2 border rounded bg-muted/50">
                                        <div><p className="text-sm font-medium">{item.nombre}</p><p className="text-xs text-muted-foreground">Cant: {item.cantidad} | Costo Est: {formatCurrency(item.costoEstimado)}</p></div>
                                        <div className="flex gap-1">
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemModal(cat.id, item)}><Wand2 className="w-3.5 h-3.5"/></Button>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(cat.id, item.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-center text-muted-foreground py-2">No hay productos en esta categoría.</p>)}
                        <p className="text-right font-semibold text-sm mt-2">Costo Total Categoría: {formatCurrency(costoTotalCategoria)}</p>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
                )
              })}
            </Accordion>
             <div className="space-y-2 pt-6 border-t mt-6">
                <Label htmlFor="notas-generales-reposteria">Notas Generales de Repostería</Label>
                <Textarea id="notas-generales-reposteria" value={reposteriaData.notasGenerales || ''} onChange={(e) => handleNotasGeneralesChange(e.target.value)} placeholder="Anotaciones generales sobre el servicio de repostería, preferencias, etc." rows={3} />
            </div>
             <div className="flex justify-end pt-4 font-bold text-lg">Costo Total General: <span className="ml-2 text-primary">{formatCurrency(costoTotalGeneral)}</span></div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
              {isSaving ? 'Guardando...' : 'Guardar Cambios de Repostería'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
