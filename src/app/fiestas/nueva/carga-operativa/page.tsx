
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, PackageSearch, PlusCircle, Trash2, Loader2, AlertTriangle, Edit3, Save } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';
import { getFiestaActual, updateListaDeCargaOperativa } from '@/app/actions/fiesta-actual';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [currentCategoryForAddItem, setCurrentCategoryForAddItem] = useState<CargaOperativaCategoria | null>(null);
  const [newItemFormData, setNewItemFormData] = useState<{ nombre: string; cantidad: string; notas?: string }>({ nombre: '', cantidad: '', notas: '' });

  const loadListaDeCarga = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setListaDeCarga(fiestaData.listaDeCargaOperativa || { categorias: [], notasGenerales: '' });
    } catch (err: any) {
      setError("No se pudo cargar la lista de carga operativa.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadListaDeCarga();
  }, [loadListaDeCarga]);

  const handleSaveListaDeCarga = async () => {
    setIsSaving(true);
    try {
      const result = await updateListaDeCargaOperativa(listaDeCarga);
      if (result.success) {
        toast({ title: "¡Lista Guardada!", description: "La lista de carga operativa ha sido actualizada." });
        if (result.updatedData) setListaDeCarga(result.updatedData);
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

  const openAddItemModal = (category: CargaOperativaCategoria) => {
    setCurrentCategoryForAddItem(category);
    setNewItemFormData({ nombre: '', cantidad: '', notas: '' });
    setIsAddItemModalOpen(true);
  };

  const handleAddItemToCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!currentCategoryForAddItem || !newItemFormData.nombre.trim() || !newItemFormData.cantidad.trim()) {
      toast({ title: "Datos del Ítem Requeridos", description: "Nombre y cantidad son obligatorios.", variant: "destructive" });
      return;
    }
    const newItem: CargaOperativaItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      nombre: newItemFormData.nombre.trim(),
      cantidad: newItemFormData.cantidad.trim(),
      notas: newItemFormData.notas?.trim() || undefined,
      cargado: false,
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
        <Button onClick={loadListaDeCarga} variant="outline" className="mt-4">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageSearch className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Carga Operativa</h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Planificador
          </Button>
        </Link>
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
              <Input id="new-category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Catering" disabled={isSaving} />
            </div>
            <Button onClick={handleAddCategory} disabled={isSaving || !newCategoryName.trim()}>
              <PlusCircle className="w-4 h-4 mr-2"/> Añadir Categoría
            </Button>
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={listaDeCarga.categorias.map(c => c.id)} className="w-full space-y-3">
        {listaDeCarga.categorias.map(category => (
          <AccordionItem key={category.id} value={category.id} className="border rounded-lg shadow-sm bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-2">{category.nombre}</span>
                <div className="flex items-center gap-1">
                  <Dialog>
                     <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="w-4 h-4"/>
                        </Button>
                     </DialogTrigger>
                     <DialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar Categoría?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Se eliminará la categoría "{category.nombre}" y todos sus ítems. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                            <Button variant="destructive" onClick={() => handleDeleteCategory(category.id)}>Eliminar</Button>
                        </AlertDialogFooter>
                     </DialogContent>
                  </Dialog>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4 border-t">
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={() => openAddItemModal(category)}>
                  <PlusCircle className="w-4 h-4 mr-1.5"/> Añadir Ítem a "{category.nombre}"
                </Button>
              </div>
              {category.items.length > 0 ? (
                <ScrollArea className="max-h-[300px] pr-2">
                  <ul className="space-y-2">
                    {category.items.map(item => (
                      <li key={item.id} className="flex items-start gap-3 p-2.5 border rounded-md bg-muted/30 hover:bg-muted/50">
                        <Checkbox
                          id={`item-cargado-${item.id}`}
                          checked={item.cargado}
                          onCheckedChange={() => toggleItemCargado(category.id, item.id)}
                          className="mt-1 flex-shrink-0"
                          aria-label={`Marcar ${item.nombre} como cargado`}
                        />
                        <div className="flex-grow">
                          <Label htmlFor={`item-cargado-${item.id}`} className={`font-medium text-sm ${item.cargado ? 'line-through text-muted-foreground' : ''}`}>{item.nombre}</Label>
                          <p className={`text-xs ${item.cargado ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>Cantidad: {item.cantidad}</p>
                          {item.notes && <p className={`text-xs italic ${item.cargado ? 'text-muted-foreground/60' : 'text-muted-foreground/80'}`}>Nota: {item.notes}</p>}
                        </div>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleDeleteItem(category.id, item.id)}>
                            <Trash2 className="w-3.5 h-3.5"/>
                        </Button>
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
            <div className="space-y-1">
              <Label htmlFor="item-cantidad-modal">Cantidad / Descripción Breve *</Label>
              <Input id="item-cantidad-modal" value={newItemFormData.cantidad} onChange={(e) => setNewItemFormData(p => ({ ...p, cantidad: e.target.value }))} placeholder="Ej: 10 unidades, 2 cajas, Equipo completo" required />
            </div>
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
