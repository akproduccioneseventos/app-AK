

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, Loader2, Info, Edit, Percent, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getMenus, saveMenu } from '@/app/actions/menus-catering';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PlatoConMenu extends MenuItem {
  menuId: string;
  menuName: string;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};


export default function CatalogoPlatosPage() {
  const { toast } = useToast();
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingDish, setEditingDish] = useState<PlatoConMenu | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const menusData = await getMenus();
      setAllMenus(menusData);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los menús.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const todosLosPlatos: PlatoConMenu[] = useMemo(() => {
    return allMenus.flatMap(menu =>
      menu.items.map(item => ({
        ...item,
        menuId: menu.id,
        menuName: menu.name,
      }))
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [allMenus]);

  const platosAgrupados = useMemo(() => {
    return todosLosPlatos.reduce((acc, plato) => {
      const categoria = plato.type || 'Sin Categoría';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(plato);
      return acc;
    }, {} as Record<string, PlatoConMenu[]>);
  }, [todosLosPlatos]);
  
  const handleEditClick = (plato: PlatoConMenu) => {
    setEditingDish(plato);
    setIsEditModalOpen(true);
  };

  const handlePriceFormChange = (field: 'suggestedSellingPrice' | 'profitMargin', value: string) => {
    if (!editingDish) return;

    // Allow the user to clear the input
    if (value.trim() === '') {
        let updatedDish = { ...editingDish };
        if (field === 'suggestedSellingPrice') {
            updatedDish.suggestedSellingPrice = undefined;
        } else {
            updatedDish.profitMargin = undefined;
        }
        setEditingDish(updatedDish);
        return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        return;
    };
    
    let updatedDish = { ...editingDish };
    if (field === 'suggestedSellingPrice') {
        updatedDish.suggestedSellingPrice = numValue;
        if (updatedDish.totalDishCost > 0) {
            const newMargin = ((numValue / updatedDish.totalDishCost) - 1) * 100;
            updatedDish.profitMargin = Math.round(newMargin); // Round for cleaner display
        }
    } else { // profitMargin
        updatedDish.profitMargin = numValue;
        const newPrice = (updatedDish.totalDishCost || 0) * (1 + numValue / 100);
        updatedDish.suggestedSellingPrice = Math.round(newPrice); // Round for cleaner display
    }
    setEditingDish(updatedDish);
  };

  const handleSavePrice = async () => {
    if (!editingDish) return;
    setIsSaving(true);
    try {
        const menuToUpdate = allMenus.find(m => m.id === editingDish.menuId);
        if (!menuToUpdate) throw new Error("Menú original no encontrado.");

        const updatedItems = menuToUpdate.items.map(item =>
            item.id === editingDish.id ? { ...item, suggestedSellingPrice: editingDish.suggestedSellingPrice, profitMargin: editingDish.profitMargin } : item
        );

        const result = await saveMenu({ ...menuToUpdate, items: updatedItems });
        if (result.success) {
            toast({ title: "Precio actualizado" });
            setIsEditModalOpen(false);
            await loadData();
        } else {
            throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Precio: {editingDish?.name}</DialogTitle>
                <DialogDescription>
                    Costo p/persona: {formatCurrency(editingDish?.totalDishCost)}. Ajusta el margen o el precio de venta final.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-1">
                    <Label htmlFor="edit-profitMargin" className="flex items-center gap-1"><Percent className="w-4 h-4"/>Margen de Ganancia (%)</Label>
                    <Input id="edit-profitMargin" type="text" inputMode="decimal" value={editingDish?.profitMargin ?? ''} onChange={e => handlePriceFormChange('profitMargin', e.target.value)} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="edit-sellingPrice" className="flex items-center gap-1"><DollarSign className="w-4 h-4"/>Precio de Venta Final ($)</Label>
                    <Input id="edit-sellingPrice" type="text" inputMode="decimal" value={editingDish?.suggestedSellingPrice ?? ''} onChange={e => handlePriceFormChange('suggestedSellingPrice', e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleSavePrice} disabled={isSaving}>{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Guardar Precio</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Catálogo de Platos
          </h1>
        </div>
        <Link href="/empresa" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Empresa
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Todos los Platos Disponibles</CardTitle>
            <CardDescription>Aquí puedes ver todos los platos de todos tus menús, agrupados por tipo. Para editar un plato, edita su menú correspondiente.</CardDescription>
        </CardHeader>
        <CardContent>
            {todosLosPlatos.length > 0 ? (
                 <Accordion type="multiple" defaultValue={Object.keys(platosAgrupados)} className="w-full space-y-2">
                    {Object.keys(platosAgrupados).sort().map(categoria => (
                        <AccordionItem key={categoria} value={categoria} className="border rounded-md">
                            <AccordionTrigger className="px-4 py-2 text-md font-semibold hover:no-underline">{categoria} ({platosAgrupados[categoria].length})</AccordionTrigger>
                            <AccordionContent className="p-2">
                                <ul className="space-y-1">
                                {platosAgrupados[categoria].map(plato => (
                                    <li key={plato.id} className="p-2 border-b last:border-b-0 text-sm flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">{plato.name}</p>
                                        <p className="text-xs text-muted-foreground">Del menú: "{plato.menuName}"</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-primary">{formatCurrency(plato.suggestedSellingPrice)}</p>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(plato)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Link href={`/empresa/menus/${plato.menuId}/editar`} passHref>
                                          <Button variant="outline" size="sm" className="text-xs h-8">Ir al Menú</Button>
                                        </Link>
                                      </div>
                                    </li>
                                ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            ) : (
                <div className="text-center py-10">
                    <Info className="mx-auto w-10 h-10 text-muted-foreground mb-3"/>
                    <p className="text-muted-foreground">No hay platos en ningún menú.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
