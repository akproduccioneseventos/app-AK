
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Trash2, Loader2, PackageSearch, Save, BookOpen } from 'lucide-react';
import type { CargaOperativaTemplate, CargaOperativaTemplateCategory } from '@/app/actions/carga-operativa-templates';
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


export default function CargaOperativaGeneralPage() {
  const { toast } = useToast();
  const [masterTemplate, setMasterTemplate] = useState<CargaOperativaTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleAddCategory = () => {
    const newCategoryName = prompt("Nombre de la nueva categoría:");
    if (newCategoryName && masterTemplate) {
      const newCategory: CargaOperativaCategoria = {
        id: `cat_master_${Date.now()}`,
        nombre: newCategoryName,
        items: []
      };
      setMasterTemplate(prev => prev ? ({ ...prev, categories: [...prev.categories, newCategory] }) : null);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (masterTemplate) {
      setMasterTemplate(prev => prev ? ({ ...prev, categories: prev.categories.filter(c => c.id !== categoryId) }) : null);
    }
  };
  
  const handleAddItem = (categoryId: string) => {
      const itemName = prompt("Nombre del nuevo ítem:");
      if (itemName && masterTemplate) {
          const newItem: CargaOperativaItem = {
              id: `item_master_${Date.now()}`,
              nombre: itemName,
              cantidad: '1', // Default quantity
              cargado: false,
          };
          setMasterTemplate(prev => prev ? ({
              ...prev,
              categories: prev.categories.map(cat => 
                  cat.id === categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
              )
          }) : null);
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
          <Button onClick={handleAddCategory}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Nueva Categoría</Button>
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
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddItem(category.id)}>+ Añadir ítem</Button>
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
