
'use client';

import React, { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import type { ReposteriaData, ReposteriaCategoria, ReposteriaItem } from '@/types/fiesta';
import { Cake, Edit, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { defaultReposteriaData } from '@/lib/fiesta-defaults';
import { useToast } from '@/hooks/use-toast';
import { ALL_UNIDADES_SERVICIO, type UnidadServicio } from '@/types/empresa';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GestionReposteriaProps {
  initialData: ReposteriaData | null;
  onDataChange: (data: ReposteriaData) => void;
  invitados: { adultos: number; ninos: number; adolescentes: number };
  isTemplateMode?: boolean;
}

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const GestionReposteria: React.FC<GestionReposteriaProps> = ({ initialData, onDataChange, invitados, isTemplateMode = false }) => {
  const { toast } = useToast();
  const [reposteria, setReposteria] = React.useState<ReposteriaData>(initialData || defaultReposteriaData);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ReposteriaCategoria | null>(null);

  React.useEffect(() => {
    onDataChange(reposteria);
  }, [reposteria, onDataChange]);

  const handleCategoryActivation = (categoryId: string, activada: boolean) => {
    setReposteria(prev => ({
      ...prev,
      categorias: prev.categorias.map(c => c.id === categoryId ? { ...c, activada } : c)
    }));
  };

  const openEditModal = (category: ReposteriaCategoria) => {
    setEditingCategory(JSON.parse(JSON.stringify(category)));
    setIsEditModalOpen(true);
  };
  
  const handleItemChange = (itemId: string, field: keyof ReposteriaItem, value: any) => {
    setEditingCategory(prevCat => {
        if (!prevCat) return null;
        return {
            ...prevCat,
            items: prevCat.items.map(item => item.id === itemId ? {...item, [field]: value} : item)
        };
    });
  };

  const addNewItem = () => {
    if (!editingCategory) return;
    const newItem: ReposteriaItem = {
        id: `rep-item-${Date.now()}`,
        nombre: 'Nuevo Ítem',
        cantidad: 1,
        unidad: 'unidad',
        costoEstimado: 0
    };
    setEditingCategory(prev => prev ? {...prev, items: [...prev.items, newItem]} : null);
  };

  const deleteItem = (itemId: string) => {
     if (!editingCategory) return;
     setEditingCategory(prev => prev ? {...prev, items: prev.items.filter(item => item.id !== itemId)} : null);
  };

  const handleSaveEdits = () => {
    if (!editingCategory) return;
    setReposteria(prev => ({
        ...prev,
        categorias: prev.categorias.map(c => c.id === editingCategory.id ? editingCategory : c)
    }));
    setIsEditModalOpen(false);
    toast({title: "Cambios en Repostería Guardados", description: `Se actualizaron los ítems de ${editingCategory.nombreDisplay}.`});
  };

  const totalCostoReposteria = React.useMemo(() => {
    let total = 0;
    reposteria.categorias.forEach(cat => {
      if (isTemplateMode || cat.activada) {
        cat.items.forEach(item => {
          total += (item.costoEstimado || 0) * (item.cantidad || 1);
        });
      }
    });
    return total;
  }, [reposteria, isTemplateMode]);

  return (
    <>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Plantilla: {editingCategory?.nombreDisplay}</DialogTitle>
            <DialogDescription>Añade, edita o elimina los postres y tortas para esta categoría.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 p-1">
            {editingCategory?.items.map(item => (
              <div key={item.id} className="p-3 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <div className="space-y-1 md:col-span-3">
                  <Label htmlFor={`rep-name-${item.id}`}>Nombre</Label>
                  <Input id={`rep-name-${item.id}`} value={item.nombre} onChange={(e) => handleItemChange(item.id, 'nombre', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`rep-qty-${item.id}`}>Cantidad</Label>
                  <Input id={`rep-qty-${item.id}`} type="number" value={item.cantidad || ''} onChange={(e) => handleItemChange(item.id, 'cantidad', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`rep-unit-${item.id}`}>Unidad</Label>
                    <Select value={item.unidad || 'unidad'} onValueChange={(val) => handleItemChange(item.id, 'unidad', val as UnidadServicio)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{ALL_UNIDADES_SERVICIO.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1 relative">
                  <Label htmlFor={`rep-cost-${item.id}`}>Costo Estimado</Label>
                  <Input id={`rep-cost-${item.id}`} type="number" value={item.costoEstimado || ''} onChange={(e) => handleItemChange(item.id, 'costoEstimado', Number(e.target.value))} className="pl-6"/>
                   <span className="absolute left-2 top-1/2 mt-1 text-muted-foreground">$</span>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive self-end" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addNewItem}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Ítem</Button>
          <DialogFooter>
            <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveEdits}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="shadow-lg">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="p-3 bg-primary/10 rounded-lg"><Cake className="w-8 h-8 text-primary" /></div>
          <div>
            <CardTitle className="font-headline text-2xl">Repostería</CardTitle>
            <CardDescription>
              {isTemplateMode ? "Define los ítems base para cada categoría de repostería." : "Activa y configura las mesas dulces y postres para el evento."}
            </CardDescription>
          </div>
          {!isTemplateMode && (
            <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Costo Total Estimado</p>
                <p className="text-xl font-bold">{formatCurrency(totalCostoReposteria)}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-3" defaultValue={isTemplateMode ? reposteria.categorias.map(c => c.id) : reposteria.categorias.filter(c=>c.activada).map(c=>c.id)}>
            {reposteria.categorias.map(cat => (
              <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm">
                <div className="flex items-center p-3">
                  <AccordionTrigger className="hover:no-underline flex-1">
                    <span className="font-semibold text-primary">{cat.nombreDisplay}</span>
                  </AccordionTrigger>
                  {!isTemplateMode && (
                    <Switch
                      checked={cat.activada}
                      onCheckedChange={(checked) => handleCategoryActivation(cat.id, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
                <AccordionContent className="px-4 pb-4 border-t">
                  <div className="space-y-4 pt-3">
                    <p className="text-sm text-muted-foreground">{cat.descripcion}</p>
                    {cat.items.length > 0 && (
                      <div className="space-y-2">
                          <h4 className="text-sm font-medium">Ítems Sugeridos:</h4>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                              {cat.items.map(item => <li key={item.id}>{item.nombre} ({item.cantidad} {item.unidad})</li>)}
                          </ul>
                      </div>
                    )}
                     {isTemplateMode && (
                        <div className="flex justify-end pt-2">
                           <Button variant="outline" size="sm" onClick={() => openEditModal(cat)}>
                               <Edit className="w-3 h-3 mr-2" /> Editar Ítems
                           </Button>
                        </div>
                     )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
};
