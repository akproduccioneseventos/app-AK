
'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, AlertTriangle, GlassWater, PlusCircle, Droplets, Trash2, ChevronDown, Wand2, BookOpen, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, BebidasData, BebidaCategoria, TipoEventoAjusteBebidas, BebidaItem, BebidaItemEstado } from '@/types/fiesta';
import { getFiestaActual, updateBebidasFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultBebidasCategorias } from '@/lib/fiesta-defaults';
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import type { ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';


const tiposEventoAjusteDisponibles: { value: TipoEventoAjusteBebidas; label: string }[] = [
    { value: 'formal', label: 'Formal / Adultos' },
    { value: 'juvenil', label: 'Juvenil / Fiesta Joven' },
    { value: 'corporativo', label: 'Corporativo / Empresarial' },
    { value: 'mixto_estandar', label: 'Mixto / Estándar' },
];

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const getStatusBadgeVariant = (status?: BebidaItemEstado) => {
    switch (status) {
        case 'Contratado': return 'default';
        case 'A Comprar': return 'secondary';
        case 'Reservado Stock': return 'outline';
        case 'Pendiente':
        default: return 'destructive';
    }
}

export default function GestionBebidasPage() {
  const { toast } = useToast();
  const [fiestaData, setFiestaData] = useState<FiestaEnPlanificacion | null>(null);
  const [bebidasData, setBebidasData] = useState<BebidasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);

  // Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<BebidaItem> | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [isSelectCatalogModalOpen, setIsSelectCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [categoryForCatalogSelect, setCategoryForCatalogSelect] = useState<BebidaCategoria | null>(null);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedFiestaData, fetchedServicios] = await Promise.all([
        getFiestaActual(),
        getServiciosEmpresa()
      ]);
      setFiestaData(fetchedFiestaData);
      
      const insumosBebidas = fetchedServicios.filter(s => s.categoria === 'Servicio de bebidas' || s.tipoItem === 'Bebida (Insumo)');
      setServiciosCatalogo(insumosBebidas);

      const mergedCategorias = defaultBebidasCategorias.map(defaultCat => {
        const savedCat = fetchedFiestaData.bebidas?.categorias?.find(sc => sc.id === defaultCat.id);
        const mergedCat = savedCat ? { ...defaultCat, ...savedCat } : { ...defaultCat };
        mergedCat.items = mergedCat.items || [];
        return mergedCat;
      });
      setBebidasData({
        categorias: mergedCategorias,
        tipoEventoAjuste: fetchedFiestaData.bebidas?.tipoEventoAjuste || 'mixto_estandar',
        notasGenerales: fetchedFiestaData.bebidas?.notasGenerales || '',
      });
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

  const handleCategoryChange = (
    categoryId: BebidaCategoria['id'],
    field: keyof Omit<BebidaCategoria, 'id' | 'items' | 'nombreDisplay' | 'consumoEstimadoPorPersona'>,
    value: string | boolean
  ) => {
    setBebidasData(prev => {
      if (!prev) return null;
      return { ...prev, categorias: prev.categorias.map(cat => cat.id === categoryId ? { ...cat, [field]: value } : cat) };
    });
  };

  const handleTipoEventoAjusteChange = (value: TipoEventoAjusteBebidas) => {
    setBebidasData(prev => prev ? ({ ...prev, tipoEventoAjuste: value }) : null);
  };
  
  const handleNotasGeneralesChange = (value: string) => {
    setBebidasData(prev => prev ? ({ ...prev, notasGenerales: value }) : null);
  };

  const openItemModal = (categoryId: string, item?: Partial<BebidaItem>) => {
    setCurrentCategoryId(categoryId);
    setCurrentItem(item?.id ? { ...item } : { id: '', nombre: '', cantidadNecesaria: 1, costoUnitario: 0, mlPorUnidad: 1000, estado: 'Pendiente', ...item });
    setIsItemModalOpen(true);
  };

  const openSelectFromCatalogModal = (category: BebidaCategoria) => {
    setCategoryForCatalogSelect(category);
    setCatalogSearchTerm('');
    setIsSelectCatalogModalOpen(true);
  };

  const handleCatalogItemSelected = (selectedServicio: ServicioEmpresa) => {
    if (!categoryForCatalogSelect) return;
    setIsSelectCatalogModalOpen(false); // Close catalog
    openItemModal(categoryForCatalogSelect.id, {
      nombre: selectedServicio.nombre,
      unidadCantidad: selectedServicio.unidad,
      costoUnitario: selectedServicio.precioVenta,
      origenId: selectedServicio.id,
      notas: selectedServicio.notas,
      estado: 'Pendiente',
    });
  };


  const handleItemModalChange = (field: keyof BebidaItem, value: string | number | undefined) => {
    setCurrentItem(prev => (prev ? { ...prev, [field]: value } : null));
  };
  
  const handleItemModalSave = () => {
    if (!currentItem || !currentItem.nombre?.trim() || !currentCategoryId) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }
    const cantidad = Number(currentItem.cantidadNecesaria) || 0;
    const costo = Number(currentItem.costoUnitario) || 0;
    const finalItem: BebidaItem = {
      id: currentItem.id || `bebidaItem_${Date.now()}`,
      nombre: currentItem.nombre,
      marca: currentItem.marca,
      presentacion: currentItem.presentacion,
      cantidadNecesaria: cantidad,
      unidadCantidad: currentItem.unidadCantidad,
      costoUnitario: costo,
      costoTotal: cantidad * costo,
      proveedorHabitual: currentItem.proveedorHabitual,
      notas: currentItem.notas,
      mlPorUnidad: Number(currentItem.mlPorUnidad) || undefined,
      origenId: currentItem.origenId,
      estado: currentItem.estado || 'Pendiente'
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
            categorias: prev.categorias.map(cat => cat.id === categoryId ? { ...cat, items: cat.items.filter(it => it.id !== itemId) } : cat)
        }
    })
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bebidasData) return;
    setIsSaving(true);
    try {
      const result = await updateBebidasFiestaActual(bebidasData);
      if (result.success && result.updatedData) {
        toast({ title: "¡Bebidas Guardadas!", description: "La configuración de bebidas se ha actualizado." });
        const mergedCategorias = defaultBebidasCategorias.map(defaultCat => {
            const savedCat = result.updatedData?.categorias?.find(sc => sc.id === defaultCat.id);
            return savedCat ? { ...defaultCat, ...savedCat, items: savedCat.items || [] } : { ...defaultCat, items: [] };
        });
        setBebidasData({
            categorias: mergedCategorias,
            tipoEventoAjuste: result.updatedData?.tipoEventoAjuste || 'mixto_estandar',
            notasGenerales: result.updatedData?.notasGenerales || '',
        });
      } else {
        throw new Error(result.error || "Error desconocido al guardar la configuración de bebidas.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearchTerm) return serviciosCatalogo;
    const lowerSearch = catalogSearchTerm.toLowerCase();
    return serviciosCatalogo.filter(
      item => item.nombre.toLowerCase().includes(lowerSearch) || 
              item.categoria?.toLowerCase().includes(lowerSearch)
    );
  }, [serviciosCatalogo, catalogSearchTerm]);


  if (isLoading || !bebidasData || !fiestaData) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-[400px] text-center"><AlertTriangle className="w-12 h-12 text-destructive mb-4" /><h2 className="text-xl font-semibold mb-2">Error</h2><p className="text-muted-foreground">{error}</p><Button onClick={loadData} className="mt-4">Reintentar</Button></div>;
  }

  const numeroInvitados = Number(fiestaData.configuracion.invitadosEstimados) || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Producto</DialogTitle></DialogHeader>
            {currentItem && (
                <div className="space-y-3">
                    <div className="space-y-1"><Label htmlFor="item-nombre">Nombre *</Label><Input id="item-nombre" value={currentItem.nombre || ''} onChange={(e) => handleItemModalChange('nombre', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label htmlFor="item-marca">Marca</Label><Input id="item-marca" value={currentItem.marca || ''} onChange={(e) => handleItemModalChange('marca', e.target.value)} /></div>
                        <div className="space-y-1"><Label htmlFor="item-presentacion">Presentación</Label><Input id="item-presentacion" value={currentItem.presentacion || ''} onChange={(e) => handleItemModalChange('presentacion', e.target.value)} placeholder="Ej: 2.25L, 750ml"/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label htmlFor="item-qty">Cant. Necesaria</Label><Input id="item-qty" type="number" value={currentItem.cantidadNecesaria || 1} onChange={(e) => handleItemModalChange('cantidadNecesaria', Number(e.target.value))}/></div>
                        <div className="space-y-1"><Label htmlFor="item-costo">Costo Unitario Est.</Label><Input id="item-costo" type="number" value={currentItem.costoUnitario || 0} onChange={(e) => handleItemModalChange('costoUnitario', Number(e.target.value))}/></div>
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="item-estado">Estado</Label>
                        <Select value={currentItem.estado || 'Pendiente'} onValueChange={(val) => handleItemModalChange('estado', val as BebidaItemEstado)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="A Comprar">A Comprar</SelectItem>
                                <SelectItem value="Reservado Stock">Reservado Stock</SelectItem>
                                <SelectItem value="Contratado">Contratado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleItemModalSave}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isSelectCatalogModalOpen} onOpenChange={setIsSelectCatalogModalOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-headline">Seleccionar Bebida del Catálogo</DialogTitle><DialogDescription>Añadir a "{categoryForCatalogSelect?.nombreDisplay}"</DialogDescription></DialogHeader>
            <div className="py-2 space-y-3">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Buscar bebida por nombre..." value={catalogSearchTerm} onChange={(e) => setCatalogSearchTerm(e.target.value)} className="w-full pl-10"/></div>
                <ScrollArea className="h-[300px] border rounded-md">
                    {filteredCatalogItems.length > 0 ? (
                        <ul className="p-2 space-y-1">{filteredCatalogItems.map(item => (
                            <li key={item.id}><Button variant="ghost" className="w-full justify-start text-left h-auto py-1.5 px-2" onClick={() => handleCatalogItemSelected(item)}><div><p className="font-medium text-sm">{item.nombre}</p><p className="text-xs text-muted-foreground">Cat: {item.categoria} | Un: {item.unidad || 'N/A'}</p></div></Button></li>
                        ))}</ul>
                    ) : (<p className="p-4 text-center text-sm text-muted-foreground">{catalogSearchTerm ? "No hay ítems que coincidan." : "El catálogo no contiene bebidas."}</p>)}
                </ScrollArea>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GlassWater className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Bebidas del Evento</h1>
        </div>
        <Link href="/planner-costo-fiesta" passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Configuración de Bebidas</CardTitle>
            <CardDescription>Activa y personaliza las categorías de bebidas para tu evento. Las cantidades estimadas se calculan para <span className="font-bold text-primary">{numeroInvitados}</span> invitados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="tipo-evento-ajuste" className="text-base">Tipo de Evento (para cálculo automático)</Label>
                <Select value={bebidasData.tipoEventoAjuste} onValueChange={(value) => handleTipoEventoAjusteChange(value as TipoEventoAjusteBebidas)}>
                    <SelectTrigger id="tipo-evento-ajuste" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar tipo de evento..." /></SelectTrigger>
                    <SelectContent>{tiposEventoAjusteDisponibles.map(tipo => (<SelectItem key={tipo.value} value={tipo.value} className="text-base">{tipo.label}</SelectItem>))}</SelectContent>
                </Select>
            </div>

            <Accordion type="multiple" defaultValue={bebidasData.categorias.filter(c=>c.activada).map(c => c.id)} className="w-full space-y-3">
              {bebidasData.categorias.map(cat => {
                const totalLitrosNecesarios = cat.consumoEstimadoPorPersona[bebidasData.tipoEventoAjuste || 'mixto_estandar'] * numeroInvitados;
                
                return (
                <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm bg-card">
                  <AccordionPrimitive.Header className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-t-lg">
                    <AccordionPrimitive.Trigger className={cn("flex flex-1 items-center gap-2 text-lg font-medium text-primary hover:no-underline", "[&[data-state=open]>svg:last-child]:rotate-180")}><Droplets className="w-5 h-5 text-primary/80" />{cat.nombreDisplay}<ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-auto" /></AccordionPrimitive.Trigger>
                    <Checkbox checked={cat.activada} onCheckedChange={(checked) => handleCategoryChange(cat.id, 'activada', !!checked)} onClick={(e) => e.stopPropagation()} className="ml-4 flex-shrink-0" aria-label={`Activar ${cat.nombreDisplay}`}/>
                  </AccordionPrimitive.Header>
                  <AccordionContent className="px-4 pt-2 pb-4 space-y-4 border-t">
                    {cat.activada && (
                      <>
                        <div className="p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r-md text-blue-800"><p className="text-sm font-semibold">Estimación para este evento: <span className="text-lg">{totalLitrosNecesarios.toFixed(1)}</span> litros en total.</p><p className="text-xs">Usa este valor como guía para añadir los productos abajo.</p></div>
                        <div className="space-y-2 mt-3"><Label htmlFor={`desc-bebida-${cat.id}`}>Descripción</Label><Textarea id={`desc-bebida-${cat.id}`} value={cat.descripcion || ''} onChange={(e) => handleCategoryChange(cat.id, 'descripcion', e.target.value)} rows={2} placeholder="Preferencias, marcas específicas, etc." /></div>
                        
                        <Separator/>
                        <div className="flex justify-between items-center"><h4 className="font-medium text-sm">Productos en esta categoría</h4>
                            <div className="flex gap-2">
                                <Button type="button" size="sm" variant="secondary" onClick={() => openSelectFromCatalogModal(cat)}><BookOpen className="w-4 h-4 mr-1.5"/>Del Catálogo</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => openItemModal(cat.id)}><PlusCircle className="w-4 h-4 mr-1.5"/>Manual</Button>
                            </div>
                        </div>
                        {cat.items.length > 0 ? (
                            <ul className="space-y-2">
                                {cat.items.map(item => (
                                    <li key={item.id} className="flex items-center justify-between p-2 border rounded bg-muted/50">
                                        <div><p className="text-sm font-medium flex items-center gap-2">{item.nombre} <Badge variant={getStatusBadgeVariant(item.estado)}>{item.estado}</Badge></p><p className="text-xs text-muted-foreground">Cant: {item.cantidadNecesaria} | Costo Total Est: {formatCurrency(item.costoTotal)}</p></div>
                                        <div className="flex gap-1">
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemModal(cat.id, item)}><Wand2 className="w-3.5 h-3.5"/></Button>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(cat.id, item.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-center text-muted-foreground py-2">No hay productos en esta categoría.</p>)}
                        <p className="text-right font-semibold text-sm mt-2">Costo Total Categoría: {formatCurrency(cat.items.reduce((sum, item) => sum + (item.costoTotal || 0), 0))}</p>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
                )
              })}
            </Accordion>
             <div className="space-y-2 pt-6 border-t mt-6">
                <Label htmlFor="notas-generales-bebidas">Notas Generales de Bebidas</Label>
                <Textarea id="notas-generales-bebidas" value={bebidasData.notasGenerales || ''} onChange={(e) => handleNotasGeneralesChange(e.target.value)} placeholder="Observaciones sobre el servicio de bebidas, horarios de barra, etc." rows={3} />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
              {isSaving ? 'Guardando...' : 'Guardar Cambios de Bebidas'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
