
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, PackageSearch, PlusCircle, Trash2, Loader2, AlertTriangle, Save, FileText, Info, Search, BookOpen, GripVertical } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';
import type { ServicioEmpresa } from '@/types/empresa';
import { getFiestaActual, updateListaDeCargaOperativaFiestaActual } from '@/app/actions/fiesta-actual';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
                  <Label htmlFor={`item-cargado-${item.id}`} className={`font-medium text-sm ${item.cargado ? 'line-through text-muted-foreground' : ''}`}>{item.nombre}</Label>
                  {item.notas && <p className={`text-xs italic ${item.cargado ? 'text-muted-foreground/60' : 'text-muted-foreground/80'}`}>Nota: {item.notas}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <Input
                    type="text"
                    value={item.cantidad}
                    onChange={(e) => onQuantityChange(categoryId, item.id, e.target.value)}
                    className="h-8 w-20 text-center"
                    placeholder="Cant."
                  />
                <span className="text-xs text-muted-foreground">{item.unidad || 'Uds.'}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(categoryId, item.id)}>
                    <Trash2 className="w-3.5 h-3.5"/>
                </Button>
              </div>
        </li>
    );
}

export default function ListaDeCargaOperativaPage() {
  const { toast } = useToast();
  const [listaDeCarga, setListaDeCarga] = useState<ListaDeCargaOperativa>({ categorias: [], notasGenerales: '' });
  const [activosCatalogo, setActivosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [isSelectCatalogModalOpen, setIsSelectCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [categoryForCatalogSelect, setCategoryForCatalogSelect] = useState<CargaOperativaCategoria | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));


  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, catalogoData] = await Promise.all([
        getFiestaActual(),
        getServiciosEmpresa()
      ]);
      
      const loadedLista = fiestaData.listaDeCargaOperativa || { categorias: [], notasGenerales: '' };
      const categoriasConItems = loadedLista.categorias.map(cat => ({
        ...cat,
        items: cat.items || [] 
      }));
      setListaDeCarga({ ...loadedLista, categorias: categoriasConItems });
      setActivosCatalogo(catalogoData.filter(s => s.tipoItem === 'Activo Fijo'));

    } catch (err: any) {
      setError("No se pudo cargar la lista de carga operativa o el catálogo.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveListaDeCarga = async () => {
    setIsSaving(true);
    try {
      const result = await updateListaDeCargaOperativaFiestaActual(listaDeCarga);
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
      categorias: [...prev.categorias, newCategory],
    }));
    setNewCategoryName('');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setListaDeCarga(prev => ({
      ...prev,
      categorias: prev.categorias.filter(cat => cat.id !== categoryId),
    }));
  };
  
  const handleCatalogItemSelected = (selectedAsset: ServicioEmpresa) => {
    if (!categoryForCatalogSelect) return;
    
    const newItem: CargaOperativaItem = {
      id: `item_${Date.now()}_${selectedAsset.id}`,
      nombre: selectedAsset.nombre,
      cantidad: String(selectedAsset.cantidadDisponible || 1), // Default to 1 if not set
      unidad: selectedAsset.unidad,
      cargado: false,
      origenId: selectedAsset.id,
    };
    
    setListaDeCarga(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat =>
        cat.id === categoryForCatalogSelect.id
          ? { ...cat, items: [...cat.items, newItem] }
          : cat
      ),
    }));
    
    toast({ description: `"${selectedAsset.nombre}" añadido a la lista.` });
  };
  
  const openSelectFromCatalogModal = (category: CargaOperativaCategoria) => {
    setCategoryForCatalogSelect(category);
    setCatalogSearchTerm('');
    setIsSelectCatalogModalOpen(true);
  };

  const toggleItemCargado = (categoryId: string, itemId: string) => {
    setListaDeCarga(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, cargado: !item.cargado } : item) }
          : cat
      ),
    }));
  };
  
  const handleItemQuantityChange = (categoryId: string, itemId: string, newQuantity: string) => {
    setListaDeCarga(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, cantidad: newQuantity } : item) }
          : cat
      ),
    }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setListaDeCarga(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
          : cat
      ),
    }));
  };
  
  const handleNotasGeneralesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setListaDeCarga(prev => ({ ...prev, notasGenerales: e.target.value }));
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, activatorEvent } = event;
    const categoryId = (activatorEvent.target as HTMLElement).closest('[data-category-id]')?.getAttribute('data-category-id');

    if (categoryId && over && active.id !== over.id) {
        setListaDeCarga(prev => {
            const newCategorias = prev.categorias.map(cat => {
                if (cat.id === categoryId) {
                    const oldIndex = cat.items.findIndex(item => item.id === active.id);
                    const newIndex = cat.items.findIndex(item => item.id === over.id);
                    return { ...cat, items: arrayMove(cat.items, oldIndex, newIndex) };
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
        <p className="ml-3 text-lg">Cargando lista de carga...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center text-destructive py-10">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
        <p className="font-semibold">{error}</p>
        <Button onClick={loadData} variant="outline" className="mt-4">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Dialog open={isSelectCatalogModalOpen} onOpenChange={setIsSelectCatalogModalOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="font-headline">Seleccionar Activo del Catálogo</DialogTitle><DialogDescription>Para la categoría "{categoryForCatalogSelect?.nombre}"</DialogDescription></DialogHeader><div className="py-2 space-y-3"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Buscar activo..." value={catalogSearchTerm} onChange={(e) => setCatalogSearchTerm(e.target.value)} className="w-full pl-10"/></div><ScrollArea className="h-[300px] border rounded-md">{isLoading ? <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> : filteredCatalogItems.length > 0 ? (<ul className="p-2 space-y-1">{filteredCatalogItems.map(item => (<li key={item.id}><Button variant="ghost" className="w-full justify-start text-left h-auto py-1.5 px-2" onClick={() => handleCatalogItemSelected(item)}><div><p className="font-medium text-sm">{item.nombre}</p><p className="text-xs text-muted-foreground">Stock: {item.cantidadDisponible || 0} {item.unidad}</p></div></Button></li>))}</ul>) : (<p className="p-4 text-center text-sm text-muted-foreground">{catalogSearchTerm ? "No hay ítems que coincidan con tu búsqueda." : "El catálogo de activos está vacío."}</p>)}</ScrollArea></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose></DialogFooter></DialogContent></Dialog>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PackageSearch className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Carga Operativa</h1>
        </div>
        <div className="flex gap-2">
           <Link href="/fiestas/nueva/carga-operativa/pdf" passHref>
              <Button variant="outline" disabled={isSaving}>
                <FileText className="w-4 h-4 mr-2"/>Ver PDF
              </Button>
            </Link>
            <Link href="/fiestas/nueva" passHref>
              <Button variant="outline" disabled={isSaving}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Planificador
              </Button>
            </Link>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nueva Categoría de Carga</CardTitle>
          <CardDescription>Organiza los elementos a trasladar por categorías (Ej: Decoración, Sonido, Barra).</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row items-end gap-2">
                <div className="flex-grow space-y-1">
                    <Label htmlFor="new-category-name">Nombre de la Categoría</Label>
                    <Input id="new-category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Catering, Barra de Tragos" disabled={isSaving} />
                </div>
                <Button onClick={handleAddCategory} disabled={isSaving || !newCategoryName.trim()} className="w-full sm:w-auto">
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
                      <span className="flex items-center gap-2">{category.nombre}</span>
                  </AccordionTrigger>
              </div>
            <AccordionContent className="px-4 pt-2 pb-4 border-t" data-category-id={category.id}>
              <div className="flex justify-end gap-2 mb-3">
                <Button variant="default" size="sm" onClick={() => openSelectFromCatalogModal(category)} disabled={activosCatalogo.length === 0}>
                   <BookOpen className="w-4 h-4 mr-1.5"/> Seleccionar del Catálogo
                </Button>
              </div>
              {activosCatalogo.length === 0 && <p className="text-xs text-muted-foreground text-center mb-2">No hay ítems en el catálogo de activos para seleccionar.</p>}
              
              <ScrollArea className="h-auto max-h-[300px] rounded-md border p-2">
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
