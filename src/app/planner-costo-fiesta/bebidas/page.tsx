
'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, AlertTriangle, GlassWater, PlusCircle, Trash2, ChevronDown, Wand2, BookOpen, Search, Settings, Info, ShoppingCart, Edit, TestTube2, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, BebidasData, BebidaCategoria, TipoEventoAjusteBebidas, BebidaItem, BebidaItemEstado, BebidasConsumoConfig, BebidaReceta, IngredienteReceta } from '@/types/fiesta';
import { getFiestaActual, updateBebidasFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultBebidasCategorias, defaultBebidasConsumoConfig } from '@/lib/fiesta-defaults';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import type { ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function GestionBebidasPage() {
  const { toast } = useToast();
  const [fiestaData, setFiestaData] = useState<FiestaEnPlanificacion | null>(null);
  const [bebidasData, setBebidasData] = useState<BebidasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States for calculation
  const [numAdultos, setNumAdultos] = useState(0);
  const [numAdolescentes, setNumAdolescentes] = useState(0);
  const [numNinos, setNumNinos] = useState(0);
  const [duracionHoras, setDuracionHoras] = useState(5);
  
  const [consumoConfig, setConsumoConfig] = useState<BebidasConsumoConfig>(defaultBebidasConsumoConfig);

  // States for Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<BebidaItem>>({});
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Partial<BebidaReceta> | null>(null);
  

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedFiestaData, fetchedServicios] = await Promise.all([
          getFiestaActual(),
          getServiciosEmpresa()
      ]);
      setServiciosCatalogo(fetchedServicios.filter(s => s.tipoItem === 'Bebida (Insumo)' || s.tipoItem === 'Insumo/Ingrediente'));
      setFiestaData(fetchedFiestaData);
      
      const config = fetchedFiestaData.configuracion;
      setNumAdultos(Number(config.invitadosEstimados) || 0);
      
      const fetchedBebidasData = fetchedFiestaData.bebidas || { categorias: [], notasGenerales: '' };
       const mergedCategorias = defaultBebidasCategorias.map(defaultCat => {
        const savedCat = fetchedBebidasData.categorias?.find(sc => sc.id === defaultCat.id);
        const mergedCat = savedCat ? { ...defaultCat, ...savedCat } : { ...defaultCat };
        mergedCat.items = mergedCat.items || [];
        mergedCat.recetas = mergedCat.recetas || [];
        return mergedCat;
      });
      setBebidasData({
        ...fetchedBebidasData,
        categorias: mergedCategorias,
        consumoConfig: fetchedBebidasData.consumoConfig || defaultBebidasConsumoConfig
      });
      setConsumoConfig(fetchedBebidasData.consumoConfig || defaultBebidasConsumoConfig);

    } catch (err: any) {
      setError("No se pudieron cargar los datos de bebidas.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleConsumoConfigChange = (categoriaId: keyof BebidasConsumoConfig, tipoAsistente: keyof BebidasConsumoConfig[keyof BebidasConsumoConfig], value: string) => {
    const numValue = parseFloat(value) || 0;
    setConsumoConfig(prev => {
        if (!prev) return defaultBebidasConsumoConfig;
        const newConfig = JSON.parse(JSON.stringify(prev)); // Deep copy
        newConfig[categoriaId][tipoAsistente] = numValue;
        return newConfig;
    });
  };

  const handleCategoryChange = (
    categoryId: BebidaCategoria['id'],
    field: keyof Omit<BebidaCategoria, 'id' | 'items' | 'nombreDisplay'>,
    value: string | boolean
  ) => {
    setBebidasData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categorias: prev.categorias.map(cat =>
          cat.id === categoryId ? { ...cat, [field]: value } : cat
        ),
      };
    });
  };

    const handleRecipeChange = (field: keyof BebidaReceta, value: any) => {
      setCurrentRecipe(prev => prev ? ({ ...prev, [field]: value }) : null);
    }
  
    const handleIngredientChange = (ingId: string, field: keyof IngredienteReceta, value: any) => {
        setCurrentRecipe(prev => {
            if (!prev || !prev.ingredientes) return prev;
            const newIngredientes = prev.ingredientes.map(ing => {
                if (ing.id === ingId) {
                    const updatedIng = { ...ing, [field]: value };
                    if(field === 'cantidad' || field === 'costoUnitario'){
                        updatedIng.costoTotal = (Number(updatedIng.cantidad) || 0) * (Number(updatedIng.costoUnitario) || 0);
                    }
                    return updatedIng;
                }
                return ing;
            });
            const costoTotalReceta = newIngredientes.reduce((sum, ing) => sum + ing.costoTotal, 0);
            return { ...prev, ingredientes: newIngredientes, costoTotalReceta };
        });
    };

    const addIngredientToRecipe = () => {
        setCurrentRecipe(prev => {
            if (!prev) return prev;
            const newIngredient: IngredienteReceta = {
                id: `ing_${Date.now()}`,
                insumoId: '',
                nombreInsumo: '',
                cantidad: 1,
                unidad: 'Unidad',
                costoUnitario: 0,
                costoTotal: 0
            };
            return { ...prev, ingredientes: [...(prev.ingredientes || []), newIngredient] };
        });
    };

    const removeIngredientFromRecipe = (ingId: string) => {
        setCurrentRecipe(prev => {
            if (!prev || !prev.ingredientes) return prev;
            return { ...prev, ingredientes: prev.ingredientes.filter(i => i.id !== ingId) };
        })
    };
    
    const handleRecipeSave = () => {
        if (!currentRecipe || !currentRecipe.nombre?.trim() || !currentCategoryId) return;
        
        const finalRecipe: BebidaReceta = {
            id: currentRecipe.id || `receta_${Date.now()}`,
            ...currentRecipe
        } as BebidaReceta;
        
        setBebidasData(prev => {
            if (!prev) return null;
            const newCategorias = [...prev.categorias];
            const catIndex = newCategorias.findIndex(c => c.id === currentCategoryId);
            if (catIndex === -1) return prev;
            
            const newRecetas = [...(newCategorias[catIndex].recetas || [])];
            const recipeIndex = newRecetas.findIndex(r => r.id === finalRecipe.id);
            if(recipeIndex > -1) {
                newRecetas[recipeIndex] = finalRecipe;
            } else {
                newRecetas.push(finalRecipe);
            }
            newCategorias[catIndex].recetas = newRecetas;
            return { ...prev, categorias: newCategorias };
        });
        setIsRecipeModalOpen(false);
    }
    
    const handleDeleteRecipe = (catId: string, recipeId: string) => {
        setBebidasData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                categorias: prev.categorias.map(cat => cat.id === catId ? {...cat, recetas: (cat.recetas || []).filter(r => r.id !== recipeId)} : cat)
            }
        });
    }
    
    const openItemModal = (categoryId: string, item?: BebidaItem) => {
        setCurrentCategoryId(categoryId);
        setCurrentItem(item ? { ...item } : { id: '', nombre: '', cantidadNecesaria: 0, costoUnitario: 0 });
        setIsItemModalOpen(true);
    };

    const handleItemModalChange = (field: keyof BebidaItem, value: string | number) => {
        setCurrentItem(prev => (prev ? { ...prev, [field]: value } : null));
    };

    const handleItemModalSave = () => {
        if (!currentItem || !currentItem.nombre?.trim() || !currentCategoryId) {
            toast({ title: "Nombre Requerido", variant: "destructive" });
            return;
        }
        const finalItem: BebidaItem = {
            id: currentItem.id || `bebidaItem_${Date.now()}`,
            nombre: currentItem.nombre,
            cantidadNecesaria: Number(currentItem.cantidadNecesaria) || 0,
            costoUnitario: Number(currentItem.costoUnitario) || 0,
            costoTotal: (Number(currentItem.cantidadNecesaria) || 0) * (Number(currentItem.costoUnitario) || 0),
            unidadCantidad: currentItem.unidadCantidad,
            origenId: currentItem.origenId,
        };
        setBebidasData(prev => {
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
        setBebidasData(prev => {
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

    const handleCatalogItemSelected = (insumo: ServicioEmpresa, categoryId: string) => {
        const newItem: BebidaItem = {
            id: `bebidaItem_${Date.now()}`,
            nombre: insumo.nombre,
            unidadCantidad: insumo.unidad,
            costoUnitario: insumo.valorUnitarioEstimado || 0,
            origenId: insumo.id,
        };
        setCurrentCategoryId(categoryId);
        setCurrentItem(newItem);
        setIsCatalogModalOpen(false);
        setIsItemModalOpen(true);
    };

  const handleSave = async () => {
    if (!bebidasData) return;
    setIsSaving(true);
    const dataToSave: BebidasData = {
        ...bebidasData,
        consumoConfig: consumoConfig,
    };
    try {
      const result = await updateBebidasFiestaActual(dataToSave);
      if (result.success) {
        toast({ title: "¡Guardado!", description: "La configuración de bebidas ha sido actualizada." });
        await loadData();
      } else {
        throw new Error(result.error || "Error al guardar");
      }
    } catch(e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  if (isLoading || !bebidasData || !fiestaData) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-[400px] text-center"><AlertTriangle className="w-12 h-12 text-destructive mb-4" /><h2 className="text-xl font-semibold mb-2">Error</h2><p className="text-muted-foreground">{error}</p><Button onClick={loadData} className="mt-4">Reintentar</Button></div>;
  }
  
  const totalInvitados = numAdultos + numAdolescentes + numNinos;
  const costoTotalGeneral = bebidasData.categorias.reduce((sumCat, cat) => {
    if (!cat.activada) return sumCat;
    const costoItems = cat.items.reduce((sumItem, item) => sumItem + (item.costoTotal || 0), 0);
    const costoRecetas = cat.recetas?.reduce((sumReceta, receta) => {
        const factorEscala = totalInvitados / (receta.porcionesBase || 100);
        return sumReceta + (receta.costoTotalReceta * factorEscala);
    }, 0) || 0;
    return sumCat + costoItems + costoRecetas;
  }, 0);

  const filteredCatalogItems = serviciosCatalogo.filter(item => item.nombre.toLowerCase().includes(catalogSearchTerm.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       {/* Modals */}
       <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader><DialogTitle className="font-headline">{currentRecipe?.id ? 'Editar' : 'Crear'} Receta</DialogTitle></DialogHeader>
                {currentRecipe && (
                    <div className="py-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label htmlFor="receta-nombre">Nombre de la Receta</Label><Input id="receta-nombre" value={currentRecipe.nombre || ''} onChange={e => handleRecipeChange('nombre', e.target.value)} /></div>
                            <div className="space-y-1"><Label htmlFor="receta-porciones">Rinde (Porciones)</Label><Input id="receta-porciones" type="number" value={currentRecipe.porcionesBase || ''} onChange={e => handleRecipeChange('porcionesBase', Number(e.target.value))}/></div>
                        </div>
                        <Separator />
                        <h4 className="font-medium text-sm">Ingredientes</h4>
                        <div className="space-y-2">
                            {currentRecipe.ingredientes?.map(ing => (
                                <div key={ing.id} className="p-2 border rounded-md grid grid-cols-3 gap-2 items-end">
                                    <div className="col-span-3"><Input placeholder="Nombre Ingrediente" value={ing.nombreInsumo} onChange={e => handleIngredientChange(ing.id, 'nombreInsumo', e.target.value)}/></div>
                                    <div className="space-y-1"><Label className="text-xs">Cantidad</Label><Input type="number" value={ing.cantidad} onChange={e => handleIngredientChange(ing.id, 'cantidad', e.target.value)}/></div>
                                    <div className="space-y-1"><Label className="text-xs">Unidad</Label><Input value={ing.unidad} onChange={e => handleIngredientChange(ing.id, 'unidad', e.target.value)}/></div>
                                    <div className="space-y-1"><Label className="text-xs">Costo Unit.</Label><Input type="number" value={ing.costoUnitario} onChange={e => handleIngredientChange(ing.id, 'costoUnitario', e.target.value)}/></div>
                                    <div className="col-span-3 flex justify-between items-center text-xs">
                                        <span className="font-semibold">Costo Total Ingrediente: {formatCurrency(ing.costoTotal)}</span>
                                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeIngredientFromRecipe(ing.id)}><Trash2 className="w-3 h-3"/></Button>
                                    </div>
                                </div>
                            ))}
                            <Button type="button" size="sm" variant="outline" onClick={addIngredientToRecipe}><PlusCircle className="w-4 h-4 mr-1"/>Añadir Ingrediente</Button>
                        </div>
                        <p className="text-right font-bold pt-2 border-t">Costo Total Receta Base: {formatCurrency(currentRecipe.costoTotalReceta)}</p>
                    </div>
                )}
                <DialogFooter><Button variant="outline" onClick={() => setIsRecipeModalOpen(false)}>Cancelar</Button><Button onClick={handleRecipeSave}>Guardar Receta</Button></DialogFooter>
            </DialogContent>
        </Dialog>
        <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Producto</DialogTitle></DialogHeader>
                {currentItem && (
                    <div className="space-y-3 py-2">
                        <div className="space-y-1"><Label htmlFor="item-nombre">Nombre *</Label><Input id="item-nombre" value={currentItem.nombre || ''} onChange={(e) => handleItemModalChange('nombre', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label htmlFor="item-qty">Cantidad</Label><Input id="item-qty" type="number" value={currentItem.cantidadNecesaria || ''} onChange={(e) => handleItemModalChange('cantidadNecesaria', Number(e.target.value))}/></div>
                            <div className="space-y-1"><Label htmlFor="item-costo">Costo Unitario</Label><Input id="item-costo" type="number" value={currentItem.costoUnitario || ''} onChange={(e) => handleItemModalChange('costoUnitario', Number(e.target.value))}/></div>
                        </div>
                    </div>
                )}
                <DialogFooter><Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleItemModalSave}>Guardar</Button></DialogFooter>
            </DialogContent>
        </Dialog>
        <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Seleccionar del Catálogo</DialogTitle></DialogHeader>
                <Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} />
                <ScrollArea className="h-72 border rounded-md">
                    {filteredCatalogItems.length > 0 ? (
                        <div className="p-2 space-y-1">
                            {filteredCatalogItems.map(item => (
                                <Button key={item.id} variant="ghost" className="w-full justify-start text-left h-auto" onClick={() => handleCatalogItemSelected(item, currentCategoryId!)}>
                                    <div>
                                        <p className="font-medium text-sm">{item.nombre}</p>
                                        <p className="text-xs text-muted-foreground">{item.categoria}</p>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    ) : <p className="text-center p-4 text-sm text-muted-foreground">No hay insumos que coincidan.</p>}
                </ScrollArea>
                <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>

       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GlassWater className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador de Bebidas</h1>
        </div>
        <div className="flex gap-2">
            <Link href="/fiestas/nueva/catering/lista-compras" passHref>
                <Button variant="outline"><ShoppingCart className="w-4 h-4 mr-2"/>Ver Lista de Compras</Button>
            </Link>
            <Link href="/planner-costo-fiesta" passHref>
              <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button>
            </Link>
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Settings className="text-primary"/>Parámetros del Cálculo</CardTitle>
          <CardDescription>Define la cantidad de invitados por tipo y la duración para estimar el consumo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1"><Label htmlFor="num-adultos">Nº Adultos</Label><Input id="num-adultos" type="number" value={numAdultos} onChange={(e) => setNumAdultos(Number(e.target.value) || 0)} min="0"/></div>
                <div className="space-y-1"><Label htmlFor="num-adolescentes">Nº Adolescentes</Label><Input id="num-adolescentes" type="number" value={numAdolescentes} onChange={(e) => setNumAdolescentes(Number(e.target.value) || 0)} min="0"/></div>
                <div className="space-y-1"><Label htmlFor="num-ninos">Nº Niños</Label><Input id="num-ninos" type="number" value={numNinos} onChange={(e) => setNumNinos(Number(e.target.value) || 0)} min="0"/></div>
                <div className="space-y-1"><Label htmlFor="duracion-horas">Duración (hs)</Label><Input id="duracion-horas" type="number" value={duracionHoras} onChange={(e) => setDuracionHoras(Number(e.target.value) || 1)} min="1"/></div>
            </div>
            <div className="p-3 border rounded-md bg-muted/50 text-center font-medium">
                Total Invitados: <span className="text-primary font-bold">{totalInvitados}</span>
            </div>
        </CardContent>
         <CardFooter className="flex justify-end">
            <Sheet>
                <SheetTrigger asChild><Button variant="secondary"><Settings className="w-4 h-4 mr-2"/>Configurar Cálculos</Button></SheetTrigger>
                <SheetContent>
                    <SheetHeader><SheetTitle>Configurar Estimaciones de Consumo</SheetTitle><SheetDescription>Define los litros por persona por hora para cada categoría. Estos valores son la base para los cálculos automáticos.</SheetDescription></SheetHeader>
                    <ScrollArea className="h-[calc(100vh-12rem)] mt-4 pr-3">
                        <div className="space-y-4 py-2">
                        {Object.entries(consumoConfig).map(([catId, values]) => (
                            <Card key={catId} className="p-3">
                                <h4 className="font-semibold text-sm mb-2">{defaultBebidasCategorias.find(c=>c.id === catId)?.nombreDisplay}</h4>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1"><Label>Adulto (L/h)</Label><Input type="number" value={values.adulto} onChange={e => handleConsumoConfigChange(catId as keyof BebidasConsumoConfig, 'adulto', e.target.value)} step="0.01"/></div>
                                    <div className="space-y-1"><Label>Adolescente (L/h)</Label><Input type="number" value={values.adolescente} onChange={e => handleConsumoConfigChange(catId as keyof BebidasConsumoConfig, 'adolescente', e.target.value)} step="0.01"/></div>
                                    <div className="space-y-1 col-span-2"><Label>Niño (L/h)</Label><Input type="number" value={values.nino} onChange={e => handleConsumoConfigChange(catId as keyof BebidasConsumoConfig, 'nino', e.target.value)} step="0.01"/></div>
                                </div>
                            </Card>
                        ))}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
         </CardFooter>
      </Card>
      
        <Accordion type="multiple" defaultValue={bebidasData.categorias.map(c => c.id)} className="w-full space-y-3">
            {bebidasData.categorias.map(cat => {
                const consumoAdultos = (consumoConfig[cat.id]?.adulto || 0) * numAdultos * duracionHoras;
                const consumoAdolescentes = (consumoConfig[cat.id]?.adolescente || 0) * numAdolescentes * duracionHoras;
                const consumoNinos = (consumoConfig[cat.id]?.nino || 0) * numNinos * duracionHoras;
                const totalLitrosNecesarios = consumoAdultos + consumoAdolescentes + consumoNinos;
                const costoTotalCategoria = cat.items.reduce((sum, item) => sum + (item.costoTotal || 0), 0) + (cat.recetas?.reduce((sum, r) => sum + r.costoTotalReceta * (totalInvitados / (r.porcionesBase || 1)), 0) || 0);

                return (
                    <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm bg-card">
                        <AccordionPrimitive.Header className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-t-lg">
                            <AccordionPrimitive.Trigger className={cn("flex flex-1 items-center gap-2 text-lg font-medium text-primary hover:no-underline", "[&[data-state=open]>svg:last-child]:rotate-180")}>
                                <Wand2 className="w-5 h-5 text-primary/80" />
                                {cat.nombreDisplay}
                                <Badge variant="secondary" className="ml-2">Est: {totalLitrosNecesarios.toFixed(1)} Litros</Badge>
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-auto" />
                            </AccordionPrimitive.Trigger>
                            <div className="flex items-center gap-2 pl-4">
                              <Label htmlFor={`cat-active-${cat.id}`} className="text-sm">Activar</Label><Switch id={`cat-active-${cat.id}`} checked={cat.activada} onCheckedChange={(val) => handleCategoryChange(cat.id, 'activada', val)} onClick={(e) => e.stopPropagation()} />
                            </div>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="p-4 border-t space-y-4">
                            {cat.activada && (
                                <>
                                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openItemModal(cat.id)}><PlusCircle className="w-4 h-4 mr-1.5"/>Añadir Producto Manual</Button>
                                    <Button variant="outline" size="sm" onClick={() => { setCurrentCategoryId(cat.id); setIsCatalogModalOpen(true); }}><BookOpen className="w-4 h-4 mr-1.5"/>Seleccionar del Catálogo</Button>
                                    {cat.id === 'barra_tragos' && <Button variant="secondary" size="sm" onClick={() => { setCurrentCategoryId(cat.id); setIsRecipeModalOpen(true); setCurrentRecipe({}); }}><TestTube2 className="w-4 h-4 mr-1.5"/>Crear Receta</Button>}
                                  </div>
                                  <Separator/>
                                  {cat.items.length === 0 && cat.recetas?.length === 0 && <p className="text-center text-muted-foreground text-sm py-2">No hay productos o recetas en esta categoría.</p>}
                                  
                                  <div className="space-y-2">
                                    {cat.items.map(item => (
                                      <div key={item.id} className="flex items-center justify-between p-2 border rounded bg-background">
                                        <div><p className="font-medium text-sm">{item.nombre}</p><p className="text-xs text-muted-foreground">Cant: {item.cantidadNecesaria} {item.unidadCantidad} | Costo Est: {formatCurrency(item.costoTotal)}</p></div>
                                        <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemModal(cat.id, item)}><Edit className="w-3.5 h-3.5"/></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(cat.id, item.id)}><Trash2 className="w-3.5 h-3.5"/></Button></div>
                                      </div>
                                    ))}
                                    {cat.recetas?.map(receta => (
                                        <div key={receta.id} className="p-2 border rounded bg-background">
                                          <div className="flex items-center justify-between">
                                            <div><p className="font-medium text-sm">{receta.nombre}</p><p className="text-xs text-muted-foreground">Costo p/evento: {formatCurrency(receta.costoTotalReceta * (totalInvitados / receta.porcionesBase))}</p></div>
                                            <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {setCurrentCategoryId(cat.id); setIsRecipeModalOpen(true); setCurrentRecipe(receta)}}><Edit className="w-3.5 h-3.5"/></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRecipe(cat.id, receta.id)}><Trash2 className="w-3.5 h-3.5"/></Button></div>
                                          </div>
                                        </div>
                                    ))}
                                  </div>
                                    <p className="text-right font-semibold text-sm mt-2">Costo Total Categoría: {formatCurrency(costoTotalCategoria)}</p>
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
      
       <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-right">
            <p className="text-sm text-muted-foreground">Costo Total General Bebidas</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(costoTotalGeneral)}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
          {isSaving ? 'Guardando...' : 'Guardar Plan de Bebidas'}
        </Button>
      </div>
    </div>
  );
}

    