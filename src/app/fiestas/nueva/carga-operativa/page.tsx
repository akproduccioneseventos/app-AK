
'use client';

import { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, PackageSearch, PlusCircle, Trash2, Loader2, AlertTriangle, Save, FileText, Info, Search, BookOpen } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';
import type { ServicioEmpresa } from '@/types/empresa'; // Import ServicioEmpresa
import { getFiestaActual, updateListaDeCargaOperativaFiestaActual } from '@/app/actions/fiesta-actual';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa'; // Import getServiciosEmpresa
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";


export default function ListaDeCargaOperativaPage() {
  const { toast } = useToast();
  const [listaDeCarga, setListaDeCarga] = useState<ListaDeCargaOperativa>({ categorias: [], notasGenerales: '' });
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]); // State for catalog items
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  
  // States for Add Item Modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [currentCategoryForAddItem, setCurrentCategoryForAddItem] = useState<CargaOperativaCategoria | null>(null);
  const [newItemFormData, setNewItemFormData] = useState<{ nombre: string; cantidad: string; unidad?: string; notas?: string; origenId?: string }>({ nombre: '', cantidad: '', unidad: '', notas: '', origenId: undefined });

  // States for Select From Catalog Modal
  const [isSelectCatalogModalOpen, setIsSelectCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [categoryForCatalogSelect, setCategoryForCatalogSelect] = useState<CargaOperativaCategoria | null>(null);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, catalogoData] = await Promise.all([
        getFiestaActual(),
        getServiciosEmpresa() // Fetch catalog items
      ]);
      
      const loadedLista = fiestaData.listaDeCargaOperativa || { categorias: [], notasGenerales: '' };
      const categoriasConItems = loadedLista.categorias.map(cat => ({
        ...cat,
        items: cat.items || [] 
      }));
      setListaDeCarga({ ...loadedLista, categorias: categoriasConItems });
      setServiciosCatalogo(catalogoData);

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

  const openAddItemModal = (category: CargaOperativaCategoria, prefillData?: Partial<typeof newItemFormData>) => {
    setCurrentCategoryForAddItem(category);
    setNewItemFormData({ 
        nombre: prefillData?.nombre || '', 
        cantidad: prefillData?.cantidad || '1', 
        unidad: prefillData?.unidad || '', 
        notas: prefillData?.notas || '',
        origenId: prefillData?.origenId || undefined
    });
    setIsAddItemModalOpen(true);
  };
  
  const openSelectFromCatalogModal = (category: CargaOperativaCategoria) => {
    setCategoryForCatalogSelect(category);
    setCatalogSearchTerm('');
    setIsSelectCatalogModalOpen(true);
  };

  const handleCatalogItemSelected = (selectedServicio: ServicioEmpresa) => {
    if (!categoryForCatalogSelect) return; // Should not happen
    
    setIsSelectCatalogModalOpen(false); // Close catalog modal
    openAddItemModal(categoryForCatalogSelect, {
      nombre: selectedServicio.nombre,
      unidad: selectedServicio.unidad,
      origenId: selectedServicio.id,
      cantidad: '1' // Default quantity
    });
  };

  const handleAddItemToCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!currentCategoryForAddItem || !newItemFormData.nombre.trim() || !newItemFormData.cantidad.trim()) {
      toast({ title: "Datos del Ítem Requeridos", description: "Nombre y cantidad son obligatorios.", variant: "destructive" });
      return;
    }
    const newItem: CargaOperativaItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: newItemFormData.nombre.trim(),
      cantidad: newItemFormData.cantidad.trim(),
      unidad: newItemFormData.unidad?.trim() || undefined,
      notas: newItemFormData.notas?.trim() || undefined,
      cargado: false,
      origenId: newItemFormData.origenId,
    };
    setListaDeCarga(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat =>
        cat.id === currentCategoryForAddItem.id
          ? { ...cat, items: [...cat.items, newItem] }
          : cat
      ),
    }));
    setIsAddItemModalOpen(false);
    setCurrentCategoryForAddItem(null);
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
  
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearchTerm) return serviciosCatalogo;
    const lowerSearch = catalogSearchTerm.toLowerCase();
    return serviciosCatalogo.filter(
      item => item.nombre.toLowerCase().includes(lowerSearch) || 
              item.categoria?.toLowerCase().includes(lowerSearch)
    );
  }, [serviciosCatalogo, catalogSearchTerm]);


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
          <div className="flex items-end gap-2">
            <div className="flex-grow space-y-1">
              <Label htmlFor="new-category-name">Nombre de la Categoría</Label>
              <Input id="new-category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Catering, Barra de Tragos" disabled={isSaving} />
            </div>
            <Button onClick={handleAddCategory} disabled={isSaving || !newCategoryName.trim()}>
              <PlusCircle className="w-4 h-4 mr-2"/> Añadir Categoría
            </Button>
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={listaDeCarga.categorias.map(c => c.id)} className="w-full space-y-3">
        {(listaDeCarga.categorias || []).map(category => (
          <AccordionItem key={category.id} value={category.id} className="border rounded-lg shadow-sm bg-card">
              <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-t-lg">
                  <AccordionTrigger className="text-lg font-medium text-primary hover:no-underline flex-1 p-0">
                      <span className="flex items-center gap-2">{category.nombre}</span>
                  </AccordionTrigger>
                  <Dialog>
                      <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="w-4 h-4"/>
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>¿Eliminar Categoría?</DialogTitle>
                              <DialogDescription>
                                  Se eliminará la categoría "{category.nombre}" y todos sus ítems. Esta acción no se puede deshacer.
                              </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                              <Button variant="destructive" onClick={() => handleDeleteCategory(category.id)}>Eliminar</Button>
                          </DialogFooter>
                      </DialogContent>
                  </Dialog>
              </div>
            <AccordionContent className="px-4 pt-2 pb-4 border-t">
              <div className="flex flex-col sm:flex-row justify-end gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={() => openAddItemModal(category)}>
                  <PlusCircle className="w-4 h-4 mr-1.5"/> Añadir Ítem Manualmente
                </Button>
                <Button variant="default" size="sm" onClick={() => openSelectFromCatalogModal(category)} disabled={serviciosCatalogo.length === 0}>
                   <BookOpen className="w-4 h-4 mr-1.5"/> Seleccionar del Catálogo
                </Button>
              </div>
              {serviciosCatalogo.length === 0 && <p className="text-xs text-muted-foreground text-center mb-2">No hay ítems en el catálogo maestro para seleccionar.</p>}
              {category.items && category.items.length > 0 ? (
                <ScrollArea className="h-auto max-h-[300px] w-full rounded-md border p-2">
                  <ul className="space-y-2">
                    {category.items.map(item => (
                      <li key={item.id} className="flex items-start gap-3 p-2.5 border rounded-md bg-background hover:bg-muted/50">
                        <Checkbox
                          id={`item-cargado-${item.id}`}
                          checked={item.cargado}
                          onCheckedChange={() => toggleItemCargado(category.id, item.id)}
                          className="mt-1 flex-shrink-0"
                          aria-label={`Marcar ${item.nombre} como cargado`}
                        />
                        <div className="flex-grow">
                          <Label htmlFor={`item-cargado-${item.id}`} className={`font-medium text-sm ${item.cargado ? 'line-through text-muted-foreground' : ''}`}>{item.nombre}</Label>
                          {item.origenId && <p className="text-xs text-blue-600">Origen: Catálogo</p>}
                          {item.notas && <p className={`text-xs italic ${item.cargado ? 'text-muted-foreground/60' : 'text-muted-foreground/80'}`}>Nota: {item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                           <Input
                              type="text"
                              value={item.cantidad}
                              onChange={(e) => handleItemQuantityChange(category.id, item.id, e.target.value)}
                              className="h-8 w-20 text-center"
                              placeholder="Cant."
                            />
                           <span className="text-xs text-muted-foreground">{item.unidad || 'Uds.'}</span>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleDeleteItem(category.id, item.id)}>
                              <Trash2 className="w-3.5 h-3.5"/>
                           </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-3">No hay ítems en esta categoría.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Add Item Modal (for manual and prefilled from catalog) */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Añadir Ítem a "{currentCategoryForAddItem?.nombre}"</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItemToCategory} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="item-nombre-modal">Nombre del Ítem *</Label>
              <Input id="item-nombre-modal" value={newItemFormData.nombre} onChange={(e) => setNewItemFormData(p => ({ ...p, nombre: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                <Label htmlFor="item-cantidad-modal">Cantidad *</Label>
                <Input id="item-cantidad-modal" value={newItemFormData.cantidad} onChange={(e) => setNewItemFormData(p => ({ ...p, cantidad: e.target.value }))} placeholder="Ej: 10, 1 caja" required />
                </div>
                <div className="space-y-1">
                <Label htmlFor="item-unidad-modal">Unidad (Opcional)</Label>
                <Input id="item-unidad-modal" value={newItemFormData.unidad || ''} onChange={(e) => setNewItemFormData(p => ({ ...p, unidad: e.target.value }))} placeholder="Ej: unidades, kg" />
                </div>
            </div>
            <Input type="hidden" value={newItemFormData.origenId || ''} /> 
            <div className="space-y-1">
              <Label htmlFor="item-notas-modal">Notas (Opcional)</Label>
              <Textarea id="item-notas-modal" value={newItemFormData.notas || ''} onChange={(e) => setNewItemFormData(p => ({ ...p, notas: e.target.value }))} rows={2} />
            </div>
            <DialogFooter className="pt-3">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Añadir Ítem</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Select Item From Catalog Modal */}
      <Dialog open={isSelectCatalogModalOpen} onOpenChange={setIsSelectCatalogModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">Seleccionar Ítem del Catálogo Maestro</DialogTitle>
            <DialogDescription>Para la categoría "{categoryForCatalogSelect?.nombre}"</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                    type="text" 
                    placeholder="Buscar ítem por nombre o categoría..." 
                    value={catalogSearchTerm} 
                    onChange={(e) => setCatalogSearchTerm(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
            <ScrollArea className="h-[300px] border rounded-md">
                {filteredCatalogItems.length > 0 ? (
                    <ul className="p-2 space-y-1">
                        {filteredCatalogItems.map(item => (
                            <li key={item.id}>
                                <Button 
                                    variant="ghost" 
                                    className="w-full justify-start text-left h-auto py-1.5 px-2"
                                    onClick={() => handleCatalogItemSelected(item)}
                                >
                                    <div>
                                        <p className="font-medium text-sm">{item.nombre}</p>
                                        <p className="text-xs text-muted-foreground">Cat: {item.categoria} | Un: {item.unidad || 'N/A'}</p>
                                    </div>
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                        {catalogSearchTerm ? "No hay ítems que coincidan con tu búsqueda." : "El catálogo maestro está vacío o no tiene ítems."}
                    </p>
                )}
            </ScrollArea>
          </div>
           <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Notas Generales de la Lista de Carga</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={listaDeCarga.notasGenerales || ''}
            onChange={handleNotasGeneralesChange}
            placeholder="Información adicional, contactos de logística, horarios de carga/descarga, etc."
            rows={4}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSaveListaDeCarga} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {isSaving ? 'Guardando Lista...' : 'Guardar Lista de Carga Operativa'}
        </Button>
      </div>
    </div>
  );
}
