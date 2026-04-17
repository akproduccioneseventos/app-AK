
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, PackageSearch, PlusCircle, Trash2, Loader2, AlertTriangle, Save, FileText, Info, Search, BookOpen, GripVertical, RotateCw, RefreshCw, Layers } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem, FiestaEnPlanificacion } from '@/types/fiesta';
import type { ServicioEmpresa } from '@/types/empresa';
import { getFiestaById, updateListaDeCargaOperativaFiestaActual } from '@/app/actions/fiesta-actual';
import { getActivosFijos } from '@/app/actions/activos-fijos';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getCargaOperativaMasterTemplate, checkAssetConflicts, updateListaDeCargaOperativa, generateCargaFromActivos } from '@/app/actions/fiesta/carga-operativa.actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

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
        <li ref={setNodeRef} style={style} className={cn(
            "p-3 border rounded-xl bg-background flex justify-between items-center transition-all",
            item.hasConflict && "border-rose-300 bg-rose-50/30"
        )}>
            <div className="flex items-start gap-3 flex-grow min-w-0">
                <div {...attributes} {...listeners} className="cursor-grab pt-1 text-muted-foreground hover:text-primary"><GripVertical className="w-5 h-5"/></div>
                <Checkbox
                  id={`item-cargado-${item.id}`}
                  checked={item.cargado}
                  onCheckedChange={() => onToggle(categoryId, item.id)}
                  className="mt-1 flex-shrink-0 h-5 w-5"
                  aria-label={`Marcar ${item.nombre} como cargado`}
                />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`item-cargado-${item.id}`} className={cn("font-bold text-sm truncate", item.cargado && "line-through text-muted-foreground")}>{item.nombre}</Label>
                    {item.hasConflict && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="bg-rose-500 rounded-full p-0.5 text-white cursor-help animate-pulse">
                                        <AlertTriangle className="w-3 h-3"/>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-rose-600 text-white border-none rounded-xl p-3 shadow-xl">
                                    <p className="font-bold text-xs uppercase tracking-widest mb-1">¡Conflicto de Stock!</p>
                                    <p className="text-xs">Este ítem supera el stock disponible para esta fecha.</p>
                                    <p className="text-xs font-black mt-1">Disponible: {item.availableStockAtDate} uds.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                  </div>
                  {item.notas && <p className={cn("text-[10px] italic", item.cargado ? "text-muted-foreground/60" : "text-muted-foreground/80")}>Nota: {item.notas}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="space-y-1 text-right">
                    <Input
                        type="text"
                        value={item.cantidad}
                        onChange={(e) => onQuantityChange(categoryId, item.id, e.target.value)}
                        className={cn(
                            "h-9 w-20 text-center font-black text-primary rounded-lg transition-colors",
                            item.hasConflict ? "border-rose-400 focus-visible:ring-rose-400 bg-white" : "bg-muted/50 border-none"
                        )}
                        placeholder="Cant."
                    />
                    {item.hasConflict && <p className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">Falta Stock</p>}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 w-10">{item.unidad || 'Uds.'}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => onDelete(categoryId, item.id)}>
                    <Trash2 className="w-4 h-4"/>
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
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
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
      
      if (hasNoData) {
          loadedLista = { ...masterTemplate };
      }

      // Módulo 1: Procesar conflictos al cargar
      if (fiestaData.configuracion.fechaEvento && loadedLista?.categorias) {
          const updatedCategorias = await Promise.all(loadedLista.categorias.map(async cat => ({
              ...cat,
              items: await checkAssetConflicts(fiestaId, fiestaData.configuracion.fechaEvento!, cat.items || [])
          })));
          loadedLista.categorias = updatedCategorias;
      }

      const categoriasConItems = (loadedLista?.categorias || []).map(cat => ({
        ...cat,
        items: cat.items || [] 
      }));
      setListaDeCarga({ ...(loadedLista || { categorias: [], notasGenerales: '' }), categorias: categoriasConItems });
      setFiesta(fiestaData);
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
        toast({ title: "Sin presupuesto", description: "Vincular presupuesto para sincronización automática.", variant: "destructive" });
        return;
      }

      const [presupuesto, activos] = await Promise.all([
        getPresupuestoById(fiesta.presupuestoId),
        getActivosFijos()
      ]);

      if (!presupuesto) throw new Error("No se pudo obtener el presupuesto.");

      const totalInvitados = (presupuesto.invitadosAdultos || 0) + (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0) || presupuesto.invitadosCantidad || 100;
      
      // Inteligencia de Módulo 1: Mapeo de categorías del presupuesto a activos
      const targetAssetCategories = new Set<string>();
      presupuesto.itemsPresupuestados.forEach(item => {
          const cat = (item.categoriaServicio || '').toLowerCase();
          const name = item.nombreServicio.toLowerCase();
          if (cat.includes('discoteca') || name.includes('dj')) targetAssetCategories.add('Discoteca');
          if (cat.includes('decoración') || name.includes('ambientación')) { targetAssetCategories.add('Decoración (Activo)'); targetAssetCategories.add('Mobiliario'); }
          if (cat.includes('catering') || name.includes('vajilla')) { targetAssetCategories.add('Vajilla (Activo)'); targetAssetCategories.add('Mantelería'); targetAssetCategories.add('Equipamiento de Cocina'); }
          if (cat.includes('bebida') || name.includes('barra')) targetAssetCategories.add('Barra de Tragos');
      });

      const newCategories: CargaOperativaCategoria[] = [];

      for (const catName of Array.from(targetAssetCategories)) {
        const matchingAssets = activos.filter(a => a.categoria === catName);
        if (matchingAssets.length > 0) {
          const itemsForCat = matchingAssets.map(asset => {
              // Reglas de Cantidad Módulo 1
              let qty = '1';
              if (asset.categoria?.includes('Vajilla')) {
                  qty = String(totalInvitados);
              } else if (asset.categoria?.includes('Mantelería') && asset.nombre.toLowerCase().includes('mantel')) {
                  qty = String(Math.ceil(totalInvitados / 8));
              } else if (asset.invitadosPorUnidad) {
                  qty = String(Math.ceil(totalInvitados / asset.invitadosPorUnidad));
              } else if (asset.precioVenta && asset.precioVenta > 0) {
                  qty = String(asset.precioVenta);
              }

              return {
                id: `sync_${asset.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                nombre: asset.nombre,
                cantidad: qty,
                unidad: asset.unidad || 'Uds.',
                cargado: false,
                origenId: asset.id
              };
          });

          // Chequear conflictos inmediatamente
          const itemsWithConflicts = await checkAssetConflicts(fiestaId, fiesta.configuracion.fechaEvento!, itemsForCat);

          newCategories.push({
            id: `sync_${catName}_${Date.now()}`,
            nombre: catName,
            items: itemsWithConflicts
          });
        }
      }

      setListaDeCarga(prev => ({
        ...prev,
        categorias: [...(prev.categorias || []), ...newCategories]
      }));

      toast({ title: "Sincronización Inteligente", description: "Cantidades calculadas según invitados y tipo de servicios." });

    } catch (e: any) {
      toast({ title: "Error de Sincronización", description: e.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleRestoreFromTemplate = async () => {
    try {
      const masterTemplate = await getCargaOperativaMasterTemplate();
      const itemsWithConflicts = await Promise.all(masterTemplate.categorias.map(async cat => ({
          ...cat,
          items: await checkAssetConflicts(fiestaId!, fiesta?.configuracion.fechaEvento!, cat.items.map(i => ({ ...i, cargado: false })))
      })));

       setListaDeCarga({
          ...masterTemplate,
          categorias: itemsWithConflicts
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
      const result = await updateListaDeCargaOperativa(fiestaId, listaDeCarga);
      if (result.success) {
        toast({ title: "¡Logística Actualizada!", description: "Se han guardado los cambios y verificado los conflictos." });
        if (result.updatedData) {
           const categoriasConItems = (result.updatedData.categorias || []).map((cat: CargaOperativaCategoria) => ({
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

  const handleSyncFromActivos = async () => {
    if (!fiestaId || !fiesta) return;
    setIsSyncing(true);
    try {
      let totalInvitados = Number(fiesta.configuracion.invitadosEstimados) || 0;

      if (fiesta.presupuestoId) {
        const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
        if (presupuesto) {
          const invitadosPresupuesto =
            (presupuesto.invitadosAdultos || 0) +
            (presupuesto.invitadosNinos || 0) +
            (presupuesto.invitadosAdolescentes || 0) ||
            presupuesto.invitadosCantidad ||
            0;
          if (invitadosPresupuesto > 0) totalInvitados = invitadosPresupuesto;
        }
      }

      if (totalInvitados <= 0) totalInvitados = 100;

      const result = await generateCargaFromActivos(fiestaId, totalInvitados);
      if (!result.success) throw new Error(result.error || 'No se pudo regenerar la lista.');

      toast({ title: '✅ Lista regenerada', description: `Calculada para ${totalInvitados} invitados.` });
      await loadData(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSyncing(false);
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
  
  const handleCatalogItemSelected = async (selectedAsset: ServicioEmpresa) => {
    if (!categoryForCatalogSelect) return;
    
    const guests = Number(fiesta?.configuracion.invitadosEstimados) || 100; 
    let qty = '1';
    
    if (selectedAsset.categoria?.includes('Vajilla')) {
        qty = String(guests);
    } else if (selectedAsset.categoria?.includes('Mantelería') && selectedAsset.nombre.toLowerCase().includes('mantel')) {
        qty = String(Math.ceil(guests / 8));
    } else if (selectedAsset.invitadosPorUnidad) {
        qty = String(Math.ceil(guests / selectedAsset.invitadosPorUnidad));
    } else if (selectedAsset.precioVenta && selectedAsset.precioVenta > 0) {
        qty = String(selectedAsset.precioVenta);
    }

    const newItem: CargaOperativaItem = {
      id: `item_${Date.now()}_${selectedAsset.id}`,
      nombre: selectedAsset.nombre,
      cantidad: qty,
      unidad: selectedAsset.unidad,
      cargado: false,
      origenId: selectedAsset.id,
    };

    // Módulo 1: Chequear conflicto para el nuevo ítem
    const checkedItem = (await checkAssetConflicts(fiestaId!, fiesta?.configuracion.fechaEvento!, [newItem]))[0];
    
    setListaDeCarga(prev => ({
      ...prev,
      categorias: (prev.categorias || []).map(cat =>
        cat.id === categoryForCatalogSelect.id
          ? { ...cat, items: [...(cat.items || []), checkedItem] }
          : cat
      ),
    }));
    
    toast({ description: `"${selectedAsset.nombre}" añadido.` });
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

  const totalConflicts = useMemo(() => {
      return listaDeCarga.categorias.reduce((sum, cat) => sum + cat.items.filter(i => i.hasConflict).length, 0);
  }, [listaDeCarga]);

  const { totalItems, completedItems, progressPercentage } = useMemo(() => {
      const allItems = listaDeCarga.categorias.flatMap(cat => cat.items);
      const total = allItems.length;
      const completed = allItems.filter(i => i.cargado).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { totalItems: total, completedItems: completed, progressPercentage: pct };
  }, [listaDeCarga]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-5 bg-primary/10 rounded-full animate-bounce">
            <PackageSearch className="w-12 h-12 text-primary" />
        </div>
        <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-lg font-bold uppercase tracking-widest text-slate-500">Cerebro Logístico Iniciando...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="carga-operativa-page" className="max-w-4xl mx-auto space-y-8 pb-20">
       <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}><DialogContent className="sm:max-w-lg rounded-3xl border-none"><DialogHeader><DialogTitle className="font-headline text-2xl">Catálogo de Activos</DialogTitle><DialogDescription>Añadiendo a: <span className="font-bold text-primary">{categoryForCatalogSelect?.nombre}</span></DialogDescription></DialogHeader><div className="py-2 space-y-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input type="text" placeholder="Buscar por nombre o categoría..." value={catalogSearchTerm} onChange={(e) => setCatalogSearchTerm(e.target.value)} className="w-full pl-10 rounded-xl h-12 bg-slate-50 border-none shadow-inner"/></div><ScrollArea className="h-[350px] border-none pr-4">{isLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div> : filteredCatalogItems.length > 0 ? (<div className="space-y-2">{filteredCatalogItems.map(item => (<Button key={item.id} type="button" variant="ghost" className="w-full justify-start text-left h-auto py-3 px-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100" onClick={() => handleCatalogItemSelected(item)}><div><p className="font-bold text-slate-800">{item.nombre}</p><p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{item.categoria} • Stock: {item.cantidadDisponible || 0}</p></div></Button>))}</div>) : (<div className="p-12 text-center space-y-3 text-slate-400"><PackageSearch className="w-12 h-12 mx-auto opacity-20"/><p className="text-sm font-medium">No se encontraron activos.</p></div>)}</ScrollArea></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline" className="rounded-xl h-12 w-full sm:w-auto">Cerrar</Button></DialogClose></DialogFooter></DialogContent></Dialog>
       
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white">
            <PackageSearch className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 font-headline uppercase">Control de Logística</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulo 1: Disponibilidad y Carga</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
           <Link href={`/fiestas/nueva/carga-operativa/pdf?fiestaId=${fiestaId}`} className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full rounded-xl border-slate-200 shadow-sm" disabled={isSaving}>
                <FileText className="w-4 h-4 mr-2"/>Generar Hoja de Carga
              </Button>
            </Link>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full rounded-xl border-slate-200 shadow-sm" disabled={isSaving}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver
              </Button>
            </Link>
        </div>
      </div>
      
      {/* Progress Bar */}
      {totalItems > 0 && (
        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black uppercase tracking-wider text-slate-600">Progreso de Carga</span>
              <span className="text-2xl font-black text-primary">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3 rounded-full" />
            <p className="text-xs text-slate-400 mt-2 font-medium">
              {completedItems} de {totalItems} ítems cargados
              {progressPercentage === 100 ? ' · ¡Todo listo!' : ''}
            </p>
          </CardContent>
        </Card>
      )}

      {totalConflicts > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-800 rounded-[1.5rem] shadow-xl shadow-rose-100 p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <AlertTitle className="text-lg font-black uppercase tracking-tighter mb-1">Conflictos de Stock Detectados</AlertTitle>
                        <AlertDescription className="text-sm font-medium opacity-80 leading-relaxed">
                            Hay <strong>{totalConflicts}</strong> ítems en tu lista que superan el stock libre para esta fecha (considerando otros eventos). Revisa las alertas rojas en la lista.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>
          </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Accordion type="multiple" defaultValue={(listaDeCarga.categorias || []).map(c => c.id)} className="w-full space-y-4">
                {(listaDeCarga.categorias || []).map(category => (
                <AccordionItem key={category.id} value={category.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                        <AccordionTrigger className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 hover:no-underline flex-1 p-0">
                            <span className="flex items-center gap-3">
                                <div className="w-2 h-6 bg-primary rounded-full"></div>
                                {category.nombre}
                                <Badge variant="secondary" className="rounded-full bg-slate-200 text-slate-600 border-none px-3 font-black text-[10px]">{category.items?.length || 0}</Badge>
                            </span>
                        </AccordionTrigger>
                        <Button variant="ghost" size="icon" className="ml-4 h-9 w-9 text-slate-300 hover:text-destructive hover:bg-red-50 rounded-xl" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}>
                            <Trash2 className="w-4 h-4"/>
                        </Button>
                    </div>
                    <AccordionContent className="px-6 pt-4 pb-6" data-category-id={category.id}>
                    <div className="flex justify-end gap-2 mb-6">
                        <Button variant="secondary" size="sm" className="rounded-xl font-bold bg-white border-slate-200 shadow-sm" onClick={() => openSelectFromCatalogModal(category)} disabled={activosCatalogo.length === 0}>
                        <BookOpen className="w-4 h-4 mr-2 text-primary"/> Añadir desde Catálogo
                        </Button>
                    </div>
                    
                    <ScrollArea className="h-auto max-h-[500px] pr-2">
                        {category.items && category.items.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={category.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                                <ul className="space-y-3">
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
                        <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-slate-50/50">
                            <Layers className="w-10 h-10 mx-auto text-slate-200 mb-2"/>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin elementos</p>
                        </div>
                        )}
                    </ScrollArea>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </div>

        <div className="space-y-6">
            <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-primary text-white">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter">Acciones Rápidas</CardTitle>
                    <CardDescription className="text-primary-foreground/70 font-medium">Automatiza tu logística</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button onClick={handleSyncWithBudget} disabled={isSyncing || isSaving} className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-slate-50 font-black shadow-xl">
                        {isSyncing ? <Loader2 className="w-5 h-5 mr-3 animate-spin"/> : <RefreshCw className="w-5 h-5 mr-3"/>}
                        Sincronizar Inteligente
                    </Button>
                    <Button onClick={handleRestoreFromTemplate} variant="ghost" className="w-full h-14 rounded-2xl text-white hover:bg-white/10 font-bold border border-white/20">
                        <RotateCw className="w-4 h-4 mr-3"/> Cargar Base Maestra
                    </Button>
                </CardContent>
                <CardFooter className="bg-black/10 py-4 justify-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Sincronización basada en presupuesto</p>
                </CardFooter>
            </Card>

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Nueva Categoría</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-category-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</Label>
                        <Input id="new-category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Decoración Extra" className="rounded-xl h-12 bg-slate-50 border-none shadow-inner" disabled={isSaving} />
                    </div>
                    <Button onClick={handleAddCategory} disabled={isSaving || !newCategoryName.trim()} className="w-full h-12 rounded-xl font-bold">
                        <PlusCircle className="w-4 h-4 mr-2"/> Crear Categoría
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-blue-50/50 border-blue-100">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <Info className="w-6 h-6 text-blue-500 shrink-0"/>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Información de Módulo 1</p>
                            <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                El sistema ahora calcula automáticamente:
                                <br/>• <strong>Vajilla:</strong> 1 x invitado.
                                <br/>• <strong>Manteles:</strong> 1 x cada 8 invitados.
                                <br/>• <strong>Disponibilidad:</strong> Alertas de falta de stock según fecha.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 print:hidden">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
            <Button onClick={handleSyncFromActivos} disabled={isSyncing || isSaving || isLoading} variant="outline" size="lg" className="rounded-2xl px-8 h-14 font-black text-base">
            {isSyncing ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-3" />}
            {isSyncing ? 'SINCRONIZANDO...' : 'REGENERAR DESDE ACTIVOS'}
            </Button>
            <Button onClick={handleSaveListaDeCarga} disabled={isSaving || isLoading} size="lg" className="rounded-2xl px-12 h-14 font-black text-base shadow-2xl shadow-primary/30">
            {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
            {isSaving ? 'REVISANDO STOCK...' : 'GUARDAR LOGÍSTICA'}
            </Button>
        </div>
      </div>
    </div>
  );
}

export default function ListaDeCargaOperativaPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <ListaDeCargaOperativaContent />
    </Suspense>
  );
}
