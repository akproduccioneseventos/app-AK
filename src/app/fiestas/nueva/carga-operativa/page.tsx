'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, PackageSearch, PlusCircle, Trash2, Loader2, AlertTriangle, Save, FileText, Info, Search, BookOpen, GripVertical, RotateCw, RefreshCw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';
import type { ServicioEmpresa } from '@/types/empresa';
import { getFiestaById, updateListaDeCargaOperativaFiestaActual } from '@/app/actions/fiesta-actual';
import { getActivosFijos } from '@/app/actions/activos-fijos';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getCargaOperativaMasterTemplate } from '@/app/actions/fiesta/carga-operativa.actions';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

function SortableCargaItem({ item, categoryId, onToggle, onQuantityChange, onDelete }: {
    item: CargaOperativaItem;
    categoryId: string;
    onToggle: (categoryId: string, itemId: string) => void;
    onQuantityChange: (categoryId: string, itemId: string, quantity: string) => void;
    onDelete: (categoryId: string, itemId: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <li ref={setNodeRef} style={style} className="p-2 border rounded-md bg-background flex justify-between items-center">
            <div className="flex items-start gap-3 flex-grow">
                <div {...attributes} {...listeners} className="cursor-grab pt-1 text-muted-foreground"><GripVertical className="w-5 h-5"/></div>
                <Checkbox
                  id={`item-cargado-${item.id}`}
                  checked={item.cargado}
                  onCheckedChange={() => onToggle(categoryId, item.id)}
                  className="mt-1 flex-shrink-0"
                  aria-label={`Marcar ${item.nombre} como cargado`}
                />
                <div className="flex-grow">
                  <Label htmlFor={`item-cargado-${item.id}`} className={cn("font-medium text-sm", item.cargado && "line-through text-muted-foreground")}>{item.nombre}</Label>
                  {item.notes && <p className={cn("text-xs italic", item.cargado ? "text-muted-foreground/60" : "text-muted-foreground/80")}>Nota: {item.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <Input
                    type="text"
                    value={item.cantidad}
                    onChange={(e) => onQuantityChange(categoryId, item.id, e.target.value)}
                    className="h-8 w-20 text-center font-bold text-primary"
                    placeholder="Cant."
                  />
                <span className="text-xs text-muted-foreground w-12">{item.unidad || 'Uds.'}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(categoryId, item.id)}>
                    <Trash2 className="w-3.5 h-3.5"/>
                </Button>
              </div>
        </li>
    );
}

function ListaDeCargaOperativaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [listaDeCarga, setListaDeCarga] = useState<ListaDeCargaOperativa>({ categorias: [], notasGenerales: '' });
  const [activosCatalogo, setActivosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [categoryForCatalogSelect, setCategoryForCatalogSelect] = useState<CargaOperativaCategoria | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const loadData = useCallback(async (showLoading = true) => {
    if (!fiestaId) return;
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, catalogoData, masterTemplate] = await Promise.all([
        getFiestaById(fiestaId),
        getActivosFijos(),
        getCargaOperativaMasterTemplate()
      ]);
      
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      
      let loadedLista = fiestaData.listaDeCargaOperativa;
      
      const hasNoData = !loadedLista || !loadedLista.categorias || loadedLista.categorias.length === 0;
      
      if (hasNoData && fiestaData.presupuestoId) {
          const presupuesto = await getPresupuestoById(fiestaData.presupuestoId);
          if (presupuesto) {
              const totalInvitados = (presupuesto.invitadosAdultos || 0) + (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0) || presupuesto.invitadosCantidad || 100;
              const budgetCategories = new Set(presupuesto.itemsPresupuestados.map(item => (item.categoriaServicio || '').toLowerCase()));
              const budgetNames = new Set(presupuesto.itemsPresupuestados.map(item => (item.nombreServicio || '').toLowerCase()));

              const targetAssetCategories = new Set<string>();
              if (budgetCategories.has('servicio de discoteca') || budgetNames.has('discoteca') || budgetNames.has('dj')) {
                targetAssetCategories.add('Discoteca');
              }
              if (budgetCategories.has('servicio de decoración') || budgetNames.has('decoración') || budgetNames.has('ambientación')) {
                targetAssetCategories.add('Decoración');
                targetAssetCategories.add('Mobiliario');
              }
              if (budgetCategories.has('servicio de catering') || budgetNames.has('vajilla') || budgetNames.has('comida')) {
                targetAssetCategories.add('Vajilla');
                targetAssetCategories.add('Mantelería');
                targetAssetCategories.add('Equipamiento de Cocina');
              }
              if (budgetCategories.has('servicio de bebidas') || budgetNames.has('barra') || budgetNames.has('trago')) {
                targetAssetCategories.add('Barra de Tragos');
              }

              const newCategories: CargaOperativaCategoria[] = [];
              targetAssetCategories.forEach(catName => {
                const matchingAssets = catalogoData.filter(a => a.categoria === catName);
                if (matchingAssets.length > 0) {
                  newCategories.push({
                    id: `auto_${catName}_${Date.now()}`,
                    nombre: catName,
                    items: matchingAssets.map(asset => {
                      let qty = '1';
                      if (asset.calculationMethod === 'porPersona') qty = String(totalInvitados);
                      else if (asset.calculationMethod === 'ratio' && asset.invitadosPorUnidad) qty = String(Math.ceil(totalInvitados / asset.invitadosPorUnidad));
                      else if (asset.precioVenta && asset.precioVenta > 0) qty = String(asset.precioVenta);
                      else if (asset.cantidadDisponible && asset.cantidadDisponible > 0) qty = String(asset.cantidadDisponible);
                      
                      return {
                        id: `item_${asset.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                        nombre: asset.nombre,
                        cantidad: qty,
                        unidad: asset.unidad || 'Uds.',
                        cargado: false,
                        origenId: asset.id
                      };
                    })
                  });
                }
              });

              if (newCategories.length > 0) {
                  loadedLista = { categorias: newCategories, notasGenerales: '' };
              }
          }
      }

      if ((!loadedLista || !loadedLista.categorias || loadedLista.categorias.length === 0) && masterTemplate.categorias.length > 0) {
        loadedLista = {
          ...masterTemplate,
          categorias: masterTemplate.categorias.map(cat => ({
            ...cat,
            items: cat.items.map(item => ({ ...item, cargado: false }))
          }))
        };
      }

      const categoriasConItems = (loadedLista?.categorias || []).map(cat => ({
        ...cat,
        items: cat.items || [] 
      }));
      setListaDeCarga({ ...(loadedLista || { categorias: [], notasGenerales: '' }), categorias: categoriasConItems });
      setActivosCatalogo(catalogoData);

    } catch (err: any) {
      setError("No se pudo cargar la lista de carga operativa.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncWithBudget = async () => {
    if (!fiestaId) return;
    setIsSyncing(true);
    try {
      const fiesta = await getFiestaById(fiestaId);
      if (!fiesta || !fiesta.presupuestoId) {
        toast({ title: "Sin presupuesto", description: "Este evento no tiene un presupuesto vinculado para sincronizar.", variant: "destructive" });
        return;
      }

      const [presupuesto, activos] = await Promise.all([
        getPresupuestoById(fiesta.presupuestoId),
        getActivosFijos()
      ]);

      if (!presupuesto) throw new Error("No se pudo obtener el presupuesto.");

      const totalInvitados = (presupuesto.invitadosAdultos || 0) + (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0) || presupuesto.invitadosCantidad || 100;
      const budgetCategories = new Set(presupuesto.itemsPresupuestados.map(item => (item.categoriaServicio || '').toLowerCase()));
      const budgetNames = new Set(presupuesto.itemsPresupuestados.map(item => (item.nombreServicio || '').toLowerCase()));

      const targetAssetCategories = new Set<string>();
      if (budgetCategories.has('servicio de discoteca') || budgetNames.has('discoteca') || budgetNames.has('dj')) {
        targetAssetCategories.add('Discoteca');
      }
      if (budgetCategories.has('servicio de decoración') || budgetNames.has('decoración') || budgetNames.has('ambientación')) {
        targetAssetCategories.add('Decoración');
        targetAssetCategories.add('Mobiliario');
      }
      if (budgetCategories.has('servicio de catering') || budgetNames.has('vajilla') || budgetNames.has('comida')) {
        targetAssetCategories.add('Vajilla');
        targetAssetCategories.add('Mantelería');
        targetAssetCategories.add('Equipamiento de Cocina');
      }
      if (budgetCategories.has('servicio de bebidas') || budgetNames.has('barra') || budgetNames.has('trago')) {
        targetAssetCategories.add('Barra de Tragos');
      }

      const newCategories: CargaOperativaCategoria[] = [];

      targetAssetCategories.forEach(catName => {
        const matchingAssets = activos.filter(a => a.categoria === catName);
        if (matchingAssets.length > 0) {
          newCategories.push({
            id: `sync_${catName}_${Date.now()}`,
            nombre: catName,
            items: matchingAssets.map(asset => {
              let qty = '1';
              if (asset.calculationMethod === 'porPersona') {
                qty = String(totalInvitados);
              } else if (asset.calculationMethod === 'ratio' && asset.invitadosPorUnidad) {
                qty = String(Math.ceil(totalInvitados / asset.invitadosPorUnidad));
              } else if (asset.precioVenta && asset.precioVenta > 0) {
                qty = String(asset.precioVenta);
              } else if (asset.cantidadDisponible && asset.cantidadDisponible > 0) {
                qty = String(asset.cantidadDisponible);
              }

              return {
                id: `item_${asset.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                nombre: asset.nombre,
                cantidad: qty,
                unidad: asset.unidad || 'Uds.',
                cargado: false,
                origenId: asset.id
              };
            })
          });
        }
      });

      if (newCategories.length === 0) {
        toast({ title: "Sincronización", description: "No se detectaron servicios adicionales en el presupuesto." });
        return;
      }

      setListaDeCarga(prev => ({
        ...prev,
        categorias: [...(prev.categorias || []), ...newCategories]
      }));

      toast({ title: "Sincronización Exitosa", description: `Se añadieron ${newCategories.length} categorías con sus cantidades estándar.` });

    } catch (e: any) {
      toast({ title: "Error de Sincronización", description: e.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleRestoreFromTemplate = async () => {
    try {
      const masterTemplate = await getCargaOperativaMasterTemplate();
       setListaDeCarga({
          ...masterTemplate,
          categorias: masterTemplate.categorias.map(cat => ({
            ...cat,
            items: cat.items.map(item => ({ ...item, cargado: false }))
          }))
        });
        toast({ title: "Plantilla Maestro Cargada"});
    } catch(e) {
      toast({ title: "Error", description: "No se pudo cargar la plantilla maestra.", variant: "destructive" });
    }
  }

  const handleSaveListaDeCarga = async () => {
    if(!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateListaDeCargaOperativaFiestaActual(fiestaId, listaDeCarga);
      if (result.success) {
        toast({ title: "¡Lista Guardada!", description: "La lista de carga operativa ha sido actualizada." });
        if (result.updatedData) {
           const categoriasConItems = (result.updatedData.categorias || []).map(cat => ({
            ...cat,
            items: cat.items || []
          }));
          setListaDeCarga({ ...result.updatedData, categorias: categoriasConItems });
        }
      } else {
        throw new Error(result.error || "Error desconocido al guardar la lista.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Nombre de Categoría Requerido", variant: "destructive" });
      return;
    }
    const newCategory: CargaOperativaCategoria = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: newCategoryName.trim(),
      items: [],
    };
    setListaDeCarga(prev => ({
      ...prev,
      categorias: [...(prev.categorias || []), newCategory],
    }));
    setNewCategoryName('');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setListaDeCarga(prev => ({
      ...prev,
      categorias: (prev.categorias || []).filter(cat => cat.id !== categoryId),
    }));
  };
  
  const handleCatalogItemSelected = (selectedAsset: ServicioEmpresa) => {
    if (!categoryForCatalogSelect) return;
    
    const qty = selectedAsset.precioVenta && selectedAsset.precioVenta > 0 ? String(selectedAsset.precioVenta) : (selectedAsset.cantidadDisponible ? String(selectedAsset.cantidadDisponible) : '1');

    const newItem: CargaOperativaItem = {
      id: `item_${Date.now()}_${selectedAsset.id}`,
      nombre: selectedAsset.nombre,
      cantidad: qty,
      unidad: selectedAsset.unidad,
      cargado: false,
      origenId: selectedAsset.id,
    };
    
    setListaDeCarga(prev => ({
      ...prev,
      categorias: (prev.categorias || []).map(cat =>
        cat.id === categoryForCatalogSelect.id
          ? { ...cat, items: [...(cat.items || []), newItem] }
          : cat
      ),
    }));
    
    toast({ description: `"${selectedAsset.nombre}" añadido con cantidad ${qty}.` });
  };
  
  const openSelectFromCatalogModal = (category: CargaOperativaCategoria) => {
    setCategoryForCatalogSelect(category);
    setCatalogSearchTerm('');
    setIsCatalogModalOpen(true);
  };

  const toggleItemCargado = (categoryId: string, itemId: string) => {
    setListaDeCarga(prev => ({
      ...prev,
      categorias: (prev.categorias || []).map(cat =>
        cat.id === categoryId
          ? { ...cat, items: (cat.items || []).map(item => item.id === itemId ? { ...item, cargado: !item.cargado } : item) }
          : cat
      ),
    }));
  };
  
  const handleItemQuantityChange = (categoryId: string, itemId: string, newQuantity: string) => {
    setListaDeCarga(prev => ({
      ...prev,
      categorias: (prev.categorias || []).map(cat =>
        cat.id === categoryId
          ? { ...cat, items: (cat.items || []).map(item => item.id === itemId ? { ...item, cantidad: newQuantity } : item) }
          : cat
      ),
    }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setListaDeCarga(prev => ({
      ...prev,
      categorias: (prev.categorias || []).map(cat =>
        cat.id === categoryId
          ? { ...cat, items: (cat.items || []).filter(item => item.id !== itemId) }
          : cat
      ),
    }));
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, activatorEvent } = event;
    const categoryId = (activatorEvent.target as HTMLElement).closest('[data-category-id]')?.getAttribute('data-category-id');

    if (categoryId && over && active.id !== over.id) {
        setListaDeCarga(prev => {
            const newCategorias = (prev.categorias || []).map(cat => {
                if (cat.id === categoryId) {
                    const oldIndex = (cat.items || []).findIndex(item => item.id === active.id);
                    const newIndex = (cat.items || []).findIndex(item => item.id === over.id);
                    return { ...cat, items: arrayMove(cat.items || [], oldIndex, newIndex) };
                }
                return cat;
            });
            return { ...prev, categorias: newCategorias };
        });
    }
  };
  
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearchTerm) return activosCatalogo;
    const lowerSearch = catalogSearchTerm.toLowerCase();
    return activosCatalogo.filter(
      item => item.nombre.toLowerCase().includes(lowerSearch) || 
              item.categoria?.toLowerCase().includes(lowerSearch)
    );
  }, [activosCatalogo, catalogSearchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Preparando lista de carga...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="font-headline">Seleccionar Activo del Catálogo</DialogTitle><DialogDescription>Para la categoría "{categoryForCatalogSelect?.nombre}"</DialogDescription></DialogHeader><div className="py-2 space-y-3"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Buscar activo..." value={catalogSearchTerm} onChange={(e) => setCatalogSearchTerm(e.target.value)} className="w-full pl-10"/></div><ScrollArea className="h-[300px] border rounded-md">{isLoading ? <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> : filteredCatalogItems.length > 0 ? (<ul className="p-2 space-y-1">{filteredCatalogItems.map(item => (<li key={item.id}><Button type="button" variant="ghost" className="w-full justify-start text-left h-auto py-1.5 px-2" onClick={() => handleCatalogItemSelected(item)}><div><p className="font-medium text-sm">{item.nombre}</p><p className="text-xs text-muted-foreground">Cantidad Sugerida: {item.precioVenta || item.cantidadDisponible || 1} {item.unidad}</p></div></Button></li>))}</ul>) : (<p className="p-4 text-center text-sm text-muted-foreground">{catalogSearchTerm ? "No hay ítems que coincidan con tu búsqueda." : "El catálogo de activos está vacío."}</p>)}</ScrollArea></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose></DialogFooter></DialogContent></Dialog>
       
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PackageSearch className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Carga Operativa</h1>
        </div>
        <div className="flex gap-2">
           <Link href={`/fiestas/nueva/carga-operativa/pdf?fiestaId=${fiestaId}`} passHref>
              <Button variant="outline" disabled={isSaving}>
                <FileText className="w-4 h-4 mr-2"/>Ver PDF
              </Button>
            </Link>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref>
              <Button variant="outline" disabled={isSaving}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Planificador
              </Button>
            </Link>
        </div>
      </div>
      
       <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-900/30">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">Gestión de Carga</AlertTitle>
          <div className="text-blue-600 dark:text-blue-400 text-sm">
            <p>La lista ahora utiliza las **cantidades de carga estándar** definidas en tu inventario. Si sincronizas con el presupuesto, el sistema calculará automáticamente la vajilla y mobiliario según los invitados.</p>
          </div>
       </Alert>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Acciones de Lista</CardTitle>
          <CardDescription>Genera tu lista rápidamente usando los datos del presupuesto o tu plantilla completa de ejemplo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            <Button onClick={handleSyncWithBudget} disabled={isSyncing || isSaving} variant="default" className="bg-primary/90 hover:bg-primary">
                {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
                Sincronizar con Presupuesto
            </Button>
            <Button onClick={handleRestoreFromTemplate} variant="secondary">
                <RotateCw className="w-4 h-4 mr-2"/> Cargar Plantilla Maestra (Ejemplo Completo)
            </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nueva Categoría Manual</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row items-end gap-2">
                <div className="flex-grow space-y-1">
                    <Label htmlFor="new-category-name">Nombre de la Categoría</Label>
                    <Input id="new-category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Herramientas Extra" disabled={isSaving} />
                </div>
                <Button onClick={handleAddCategory} disabled={isSaving || !newCategoryName.trim()} variant="outline">
                    <PlusCircle className="w-4 h-4 mr-2"/> Añadir Categoría
                </Button>
            </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={(listaDeCarga.categorias || []).map(c => c.id)} className="w-full space-y-3">
        {(listaDeCarga.categorias || []).map(category => (
          <AccordionItem key={category.id} value={category.id} className="border rounded-lg shadow-sm bg-card">
              <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-t-lg">
                  <AccordionTrigger className="text-lg font-medium text-primary hover:no-underline flex-1 p-0">
                      <span className="flex items-center gap-2">{category.nombre} ({category.items?.length || 0})</span>
                  </AccordionTrigger>
                  <Button variant="ghost" size="icon" className="ml-2 h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}>
                      <Trash2 className="w-4 h-4"/>
                  </Button>
              </div>
            <AccordionContent className="px-4 pt-2 pb-4 border-t" data-category-id={category.id}>
              <div className="flex flex-wrap justify-end gap-2 mb-3">
                <Button variant="default" size="sm" onClick={() => openSelectFromCatalogModal(category)} disabled={activosCatalogo.length === 0}>
                   <BookOpen className="w-4 h-4 mr-1.5"/> Seleccionar del Catálogo
                </Button>
              </div>
              
              <ScrollArea className="h-auto max-h-[400px] rounded-md border p-2">
                {category.items && category.items.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={category.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                        <ul className="space-y-2">
                          {category.items.map(item => (
                            <SortableCargaItem
                                key={item.id}
                                item={item}
                                categoryId={category.id}
                                onToggle={toggleItemCargado}
                                onQuantityChange={handleItemQuantityChange}
                                onDelete={handleDeleteItem}
                            />
                          ))}
                        </ul>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-3">No hay ítems en esta categoría.</p>
                )}
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSaveListaDeCarga} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {isSaving ? 'Guardando Lista...' : 'Guardar Lista de Carga Operativa'}
        </Button>
      </div>
    </div>
  );
}

export default function ListaDeCargaOperativaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <ListaDeCargaOperativaContent />
    </Suspense>
  );
}
