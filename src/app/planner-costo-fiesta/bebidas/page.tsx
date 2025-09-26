
'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, AlertTriangle, GlassWater, PlusCircle, Trash2, ChevronDown, Wand2, BookOpen, Search, Settings, Info, ShoppingCart, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, BebidasData, BebidaCategoria, TipoEventoAjusteBebidas, BebidaItem, BebidaItemEstado, BebidasConsumoConfig } from '@/types/fiesta';
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

  const handleItemFieldChange = (categoryId: string, itemId: string, field: keyof BebidaItem, value: any) => {
    setBebidasData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            categorias: prev.categorias.map(cat => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map(item => {
                        if (item.id !== itemId) return item;
                        const updatedItem = { ...item, [field]: value };
                        if (field === 'cantidadNecesaria' || field === 'costoUnitario') {
                            updatedItem.costoTotal = (updatedItem.cantidadNecesaria || 0) * (updatedItem.costoUnitario || 0);
                        }
                        return updatedItem;
                    })
                };
            })
        };
    });
  };

  const openItemModal = (catId: string, item?: BebidaItem) => {
    setCurrentCategoryId(catId);
    if(item) {
      setCurrentItem({...item});
    } else {
      setCurrentItem({ id: '', nombre: '', cantidadNecesaria: 1, costoUnitario: 0, unidadCantidad: 'Unidad' });
    }
    setIsItemModalOpen(true);
  };
  
  const handleItemModalSave = () => {
    if (!currentItem || !currentItem.nombre?.trim() || !currentCategoryId) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }
    const finalItem: BebidaItem = {
      ...currentItem,
      id: currentItem.id || `bebida_${Date.now()}`,
      cantidadNecesaria: Number(currentItem.cantidadNecesaria) || 0,
      costoUnitario: Number(currentItem.costoUnitario) || 0,
      costoTotal: (Number(currentItem.cantidadNecesaria) || 0) * (Number(currentItem.costoUnitario) || 0),
    } as BebidaItem;
    
    setBebidasData(prev => {
      if (!prev) return null;
      const catIndex = prev.categorias.findIndex(c => c.id === currentCategoryId);
      if (catIndex === -1) return prev;
      
      const newCategorias = [...prev.categorias];
      const targetCat = {...newCategorias[catIndex]};
      const itemIndex = targetCat.items.findIndex(i => i.id === finalItem.id);

      if (itemIndex > -1) {
        targetCat.items[itemIndex] = finalItem;
      } else {
        targetCat.items.push(finalItem);
      }
      newCategorias[catIndex] = targetCat;
      return { ...prev, categorias: newCategorias };
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
  
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearchTerm) return serviciosCatalogo;
    const lowerSearch = catalogSearchTerm.toLowerCase();
    return serviciosCatalogo.filter(item => item.nombre.toLowerCase().includes(lowerSearch) || item.categoria?.toLowerCase().includes(lowerSearch));
  }, [serviciosCatalogo, catalogSearchTerm]);

  const handleCatalogItemSelected = (servicio: ServicioEmpresa) => {
    if (!currentCategoryId) return;
    openItemModal(currentCategoryId, {
        id: servicio.id,
        nombre: servicio.nombre,
        origenId: servicio.id,
        unidadCantidad: servicio.unidad,
        costoUnitario: servicio.valorUnitarioEstimado,
    });
    setIsCatalogModalOpen(false);
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
    return sumCat + cat.items.reduce((sumItem, item) => sumItem + (item.costoTotal || 0), 0);
  }, 0);


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-headline">{currentItem?.id && currentItem.origenId !== currentItem.id ? 'Editar' : 'Añadir'} Producto</DialogTitle></DialogHeader>
          {currentItem && (
            <div className="space-y-3">
              <div className="space-y-1"><Label htmlFor="item-nombre">Nombre *</Label><Input id="item-nombre" value={currentItem.nombre || ''} onChange={e => handleItemModalChange(currentCategoryId!, currentItem.id!, 'nombre', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label htmlFor="item-qty-nec">Cant. Necesaria</Label><Input id="item-qty-nec" type="number" value={currentItem.cantidadNecesaria || ''} onChange={e => handleItemModalChange(currentCategoryId!, currentItem.id!, 'cantidadNecesaria', Number(e.target.value))}/></div>
                <div className="space-y-1"><Label htmlFor="item-costo-unit">Costo Unit.</Label><Input id="item-costo-unit" type="number" value={currentItem.costoUnitario || ''} onChange={e => handleItemModalChange(currentCategoryId!, currentItem.id!, 'costoUnitario', Number(e.target.value))}/></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleItemModalSave}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-headline">Seleccionar Insumo del Catálogo</DialogTitle><DialogDescription>Añade un producto pre-existente a esta categoría.</DialogDescription></DialogHeader>
          <div className="py-2 space-y-3">
            <Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} />
            <ScrollArea className="h-72 border rounded-md"><ul className="p-2 space-y-1">{filteredCatalogItems.map(item => (<li key={item.id}><Button variant="ghost" className="w-full justify-start text-left h-auto py-1.5 px-2" onClick={() => handleCatalogItemSelected(item)}><div><p className="font-medium text-sm">{item.nombre}</p><p className="text-xs text-muted-foreground">Unidad: {item.unidad}</p></div></Button></li>))}</ul></ScrollArea>
          </div>
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
      
      {bebidasData.categorias.map(cat => {
        const consumoAdultos = (consumoConfig[cat.id]?.adulto || 0) * numAdultos * duracionHoras;
        const consumoAdolescentes = (consumoConfig[cat.id]?.adolescente || 0) * numAdolescentes * duracionHoras;
        const consumoNinos = (consumoConfig[cat.id]?.nino || 0) * numNinos * duracionHoras;
        const totalLitrosNecesarios = consumoAdultos + consumoAdolescentes + consumoNinos;
        
        return (
          <Card key={cat.id}>
             <CardHeader className="flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{cat.nombreDisplay}</h3>
                  <Badge variant="secondary">Est: {totalLitrosNecesarios.toFixed(1)} Litros</Badge>
                </div>
                 <div className="flex items-center gap-2">
                    <Label htmlFor={`cat-active-${cat.id}`} className="text-sm">Activar</Label>
                    <Switch id={`cat-active-${cat.id}`} checked={cat.activada} onCheckedChange={(val) => handleCategoryChange(cat.id, 'activada', val)}/>
                 </div>
             </CardHeader>
             {cat.activada && (
                <CardContent>
                    <div className="p-3 border rounded-md bg-muted/50">
                        {cat.items.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead><tr className="border-b"><th className="text-left py-1">Producto</th><th className="text-right py-1">Cant. Necesaria</th><th className="text-right py-1">Costo Unit.</th><th className="text-right py-1 font-semibold">Costo Total</th><th className="w-[80px]"></th></tr></thead>
                                <tbody>
                                {cat.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-1 font-medium">{item.nombre}</td>
                                        <td className="text-right"><Input type="number" value={item.cantidadNecesaria || ''} onChange={e => handleItemFieldChange(cat.id, item.id, 'cantidadNecesaria', Number(e.target.value))} className="h-7 w-20 ml-auto text-right" placeholder="0"/></td>
                                        <td className="text-right"><Input type="number" value={item.costoUnitario || ''} onChange={e => handleItemFieldChange(cat.id, item.id, 'costoUnitario', Number(e.target.value))} className="h-7 w-20 ml-auto text-right" placeholder="0"/></td>
                                        <td className="py-1 text-right font-semibold">{formatCurrency(item.costoTotal)}</td>
                                        <td className="text-right"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={()=>handleDeleteItem(cat.id, item.id)}><Trash2 className="w-4 h-4"/></Button></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (<p className="text-center text-muted-foreground text-xs py-2">No hay productos añadidos para esta categoría.</p>)}
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                        <Button type="button" size="sm" variant="outline" onClick={() => openItemModal(cat.id)}><PlusCircle className="w-4 h-4 mr-1"/>Añadir Manualmente</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => { setCurrentCategoryId(cat.id); setIsCatalogModalOpen(true); }}><BookOpen className="w-4 h-4 mr-1"/>Añadir del Catálogo</Button>
                    </div>
                </CardContent>
             )}
          </Card>
        )
      })}
      
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
