'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Trash2, Loader2, ListChecks, PackageSearch, Save, BookOpen, Search } from 'lucide-react';
import type { CargaOperativaTemplate, CargaOperativaTemplateCategory } from '@/app/actions/carga-operativa-templates';
import type { ServicioEmpresa } from '@/types/empresa';
import { getCargaOperativaTemplates, saveCargaOperativaTemplate, deleteCargaOperativaTemplate } from '@/app/actions/carga-operativa-templates';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CargaOperativaGeneralPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CargaOperativaTemplate[]>([]);
  const [catalogo, setCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CargaOperativaTemplate | null>(null);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{name: string, quantity: string, unit?: string} | null>(null);
  const [currentCategory, setCurrentCategory] = useState<{templateId: string, categoryName: string} | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [templatesData, catalogoData] = await Promise.all([
        getCargaOperativaTemplates(),
        getServiciosEmpresa()
      ]);
      setTemplates(templatesData);
      setCatalogo(catalogoData);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const openTemplateModal = (template?: CargaOperativaTemplate) => {
    setEditingTemplate(template || { id: `new_${Date.now()}`, name: '', categories: [] });
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (templateToSave: CargaOperativaTemplate) => {
    if (!templateToSave.name.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    setIsProcessing(templateToSave.id);
    const result = await saveCargaOperativaTemplate(templateToSave);
    if (result.success) {
      toast({ title: "Plantilla Guardada" });
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      await fetchAllData();
    } else {
      toast({ title: "Error al guardar", description: result.error, variant: "destructive" });
    }
    setIsProcessing(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    setIsProcessing(id);
    const result = await deleteCargaOperativaTemplate(id);
    if (result.success) {
      toast({ title: "Plantilla Eliminada", variant: "destructive" });
      await fetchAllData();
    } else {
      toast({ title: "Error al eliminar", description: result.error, variant: "destructive" });
    }
    setIsProcessing(null);
  };

  // Category and Item modifications inside the modal
  const addCategoryToTemplate = () => {
    const newCategoryName = prompt("Nombre de la nueva categoría:");
    if (newCategoryName && editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        categories: [...editingTemplate.categories, { name: newCategoryName, items: [] }]
      });
    }
  };

  const deleteCategoryFromTemplate = (categoryName: string) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        categories: editingTemplate.categories.filter(c => c.name !== categoryName)
      });
    }
  };
  
  const addItemToCategory = (templateId: string, categoryName: string, item: { name: string, quantity: string, unit?: string}) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          categories: t.categories.map(c => {
            if (c.name === categoryName) {
              return { ...c, items: [...c.items, item] };
            }
            return c;
          })
        };
      }
      return t;
    }));
  };
  
  const removeItemFromCategory = (templateId: string, categoryName: string, itemName: string) => {
     setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          categories: t.categories.map(c => {
            if (c.name === categoryName) {
              return { ...c, items: c.items.filter(i => i.name !== itemName) };
            }
            return c;
          })
        };
      }
      return t;
    }));
  }

  return (
    <div className="space-y-6">
       {/* Modal para editar/crear plantillas */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingTemplate?.id.startsWith('new_') ? 'Crear' : 'Editar'} Plantilla de Carga</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                <Input id="template-name" value={editingTemplate.name} onChange={e => setEditingTemplate(t => t ? {...t, name: e.target.value} : null)} />
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addCategoryToTemplate}>+ Añadir Categoría</Button>
              <ScrollArea className="h-64 border rounded-md p-2">
                {editingTemplate.categories.map((cat, catIndex) => (
                  <div key={catIndex} className="p-2 my-1 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-sm">{cat.name}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCategoryFromTemplate(cat.name)}><Trash2 className="w-3.5 h-3.5"/></Button>
                    </div>
                    <ul className="space-y-1 text-xs">
                      {cat.items.map((item, itemIndex) => <li key={itemIndex} className="flex justify-between items-center"><span>- {item.name} ({item.quantity} {item.unit})</span> <Button variant="ghost" size="icon" className="h-5 w-5 opacity-50" onClick={() => {/* Future edit item */}}><Trash2 className="w-3 h-3"/></Button></li>)}
                    </ul>
                    {/* Add Item button would go here */}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={() => editingTemplate && handleSaveTemplate(editingTemplate)} disabled={isProcessing === editingTemplate?.id}>
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Guardar
            </Button>
          </DialogFooter>
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
          <CardDescription>Crea y edita tus listas de carga base para reutilizar en los eventos. Estas listas se podrán cargar desde el planificador de cada fiesta.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
           <Button onClick={() => openTemplateModal()}><PlusCircle className="w-4 h-4 mr-2"/>Crear Plantilla</Button>
           <Link href="/empresa/todos-los-servicios/nuevo?type=Activo Fijo" passHref><Button variant="secondary"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Nuevo Activo al Catálogo</Button></Link>
        </CardContent>
      </Card>

       <div className="space-y-4">
        {isLoading ? <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div> :
         templates.length > 0 ? (
          templates.map(template => (
            <Card key={template.id}>
              <CardHeader className="flex-row justify-between items-center">
                <CardTitle className="font-headline">{template.name}</CardTitle>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openTemplateModal(template)}>Editar</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isProcessing === template.id}>Eliminar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirmar</AlertDialogTitle><AlertDialogDescription>¿Eliminar la plantilla "{template.name}"?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>Sí, eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
              </CardHeader>
              <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {template.categories.map(category => (
                        <AccordionItem value={category.name} key={category.name}>
                            <AccordionTrigger>{category.name} ({category.items.length} ítems)</AccordionTrigger>
                            <AccordionContent className="p-2 space-y-2">
                                <ul className="text-sm list-disc pl-5">
                                    {category.items.map((item, index) => <li key={index}>{item.name} ({item.quantity} {item.unit})</li>)}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                  </Accordion>
              </CardContent>
            </Card>
          ))
         ) : (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No hay plantillas creadas.</CardContent></Card>
         )
        }
       </div>
    </div>
  );
}
