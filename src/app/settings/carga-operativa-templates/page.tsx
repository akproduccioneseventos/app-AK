
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Trash2, Loader2, PackageSearch, Save } from 'lucide-react';
import type { CargaOperativaTemplate, CargaOperativaCategoria as CargaOperativaTemplateCategory } from '@/app/actions/carga-operativa-templates';
import type { CargaOperativaItem } from '@/types/fiesta';
import { getMasterCargaOperativaTemplate, saveMasterCargaOperativaTemplate } from '@/app/actions/carga-operativa-templates';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";


export default function CargaOperativaGeneralPage() {
  const { toast } = useToast();
  const [masterTemplate, setMasterTemplate] = useState<CargaOperativaTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // State for Add Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItemCategoryId, setCurrentItemCategoryId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');


  const fetchMasterTemplate = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMasterCargaOperativaTemplate();
      setMasterTemplate(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar la lista de carga operativa general.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMasterTemplate();
  }, [fetchMasterTemplate]);

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && masterTemplate) {
      const newCategory: CargaOperativaTemplateCategory = {
        id: `cat_master_${Date.now()}`,
        name: newCategoryName,
        items: []
      };
      setMasterTemplate(prev => prev ? ({ ...prev, categories: [...prev.categories, newCategory] }) : null);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      toast({ title: "Categoría Añadida"});
    } else {
        toast({title: "Nombre requerido", variant: "destructive"});
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (masterTemplate) {
      setMasterTemplate(prev => prev ? ({ ...prev, categories: prev.categories.filter(c => c.id !== categoryId) }) : null);
    }
  };
  
  const openAddItemModal = (categoryId: string) => {
    setCurrentItemCategoryId(categoryId);
    setNewItemName('');
    setIsItemModalOpen(true);
  };
  
  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && currentItemCategoryId && masterTemplate) {
      const newItem: CargaOperativaItem = {
        id: `item_master_${Date.now()}`,
        nombre: newItemName,
        cantidad: '1', // Default quantity
        cargado: false,
      };
      setMasterTemplate(prev => prev ? ({
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === currentItemCategoryId ? { ...cat, items: [...cat.items, newItem] } : cat
        )
      }) : null);
      setIsItemModalOpen(false);
      toast({ title: "Ítem añadido" });
    } else {
      toast({ title: "Nombre requerido", variant: "destructive" });
    }
  };
  
  const handleDeleteItem = (categoryId: string, itemId: string) => {
      if (masterTemplate) {
          setMasterTemplate(prev => prev ? ({
              ...prev,
              categories: prev.categories.map(cat => 
                  cat.id === categoryId ? { ...cat, items: cat.items.filter(item => item.id !== itemId) } : cat
              )
          }) : null);
      }
  };

  const handleSaveMasterTemplate = async () => {
    if (!masterTemplate) return;
    setIsProcessing(true);
    const result = await saveMasterCargaOperativaTemplate(masterTemplate);
    if (result.success) {
      toast({ title: "Lista Maestra Guardada" });
      await fetchMasterTemplate();
    } else {
      toast({ title: "Error al guardar", description: result.error, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
       <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Nueva Categoría</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="new-category-name-modal">Nombre de la Categoría</Label>
                    <Input id="new-category-name-modal" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej: Electrónica, Bebidas..." required/>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                    <Button type="submit">Añadir</Button>
                </DialogFooter>
            </form>
        </DialogContent>
       </Dialog>

       <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Nuevo Ítem</DialogTitle>
                <DialogDescription>Añadiendo a la categoría "{masterTemplate?.categories.find(c => c.id === currentItemCategoryId)?.nombre}"</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="new-item-name-modal">Nombre del Ítem</Label>
                    <Input id="new-item-name-modal" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Ej: Mantel redondo blanco" required/>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                    <Button type="submit">Añadir Ítem</Button>
                </DialogFooter>
            </form>
        </DialogContent>
       </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageSearch className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Carga Operativa General</h1>
        </div>
        <Link href="/empresa" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario Maestro de Carga</CardTitle>
          <CardDescription>Define aquí la lista completa de todos los elementos que se pueden necesitar para un evento. Esta será la lista base que podrás cargar y adaptar en cada fiesta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsCategoryModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2"/>Añadir Nueva Categoría
          </Button>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {isLoading ? <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div> :
         masterTemplate && masterTemplate.categories.length > 0 ? (
          <Accordion type="multiple" defaultValue={masterTemplate.categories.map(c => c.id)} className="w-full space-y-3">
            {masterTemplate.categories.map(category => (
              <AccordionItem key={category.id} value={category.id} className="border rounded-lg shadow-sm bg-card">
                <div className="flex items-center p-3">
                  <AccordionTrigger className="hover:no-underline flex-1 text-left font-semibold text-primary">{category.nombre} ({category.items.length})</AccordionTrigger>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCategory(category.id)}><Trash2 className="w-4 h-4"/></Button>
                </div>
                <AccordionContent className="p-3 border-t">
                  <div className="space-y-2">
                    {category.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm p-1.5 border-b last:border-b-0">
                        <span>{item.nombre}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteItem(category.id, item.id)}>
                            <Trash2 className="w-3.5 h-3.5"/>
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => openAddItemModal(category.id)}>+ Añadir ítem</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
         ) : (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No hay categorías en la lista maestra.</CardContent></Card>
         )
        }
       </div>
       
        <div className="flex justify-end mt-6">
            <Button onClick={handleSaveMasterTemplate} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                Guardar Lista Maestra
            </Button>
        </div>
    </div>
  );
}
