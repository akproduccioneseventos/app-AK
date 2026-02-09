'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, Loader2, Info, Edit, Percent, DollarSign, Copy, Trash2, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getMenus, saveMenu, deleteMenu, duplicateMenu } from '@/app/actions/menus-catering';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PlatoConMenu extends MenuItem {
  menuId: string;
  menuName: string;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};


export default function CatalogoPlatosPage() {
  const { toast } = useToast();
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingDish, setEditingDish] = useState<PlatoConMenu | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);

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
        updatedDish.suggestedSellingPrice = Math.round(numValue);
        if (updatedDish.totalDishCost > 0) {
            const newMargin = ((Math.round(numValue) / updatedDish.totalDishCost) - 1) * 100;
            updatedDish.profitMargin = Math.round(newMargin);
        }
    } else { // profitMargin
        updatedDish.profitMargin = numValue;
        const newPrice = (updatedDish.totalDishCost || 0) * (1 + numValue / 100);
        updatedDish.suggestedSellingPrice = Math.round(newPrice);
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

  const handleDuplicateMenu = async (menuId: string, menuName: string) => {
    setProcessingId(menuId);
    try {
      const result = await duplicateMenu(menuId);
      if (result.success) {
        toast({ title: "Menú Duplicado", description: `Se creó una copia de "${menuName}".` });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al Duplicar", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteDish = async (menuId: string, dishId: string, dishName: string) => {
    setProcessingId(dishId);
    try {
      const menuToUpdate = allMenus.find(m => m.id === menuId);
      if (!menuToUpdate) {
        throw new Error("No se encontró el menú original para eliminar el plato.");
      }

      const updatedItems = menuToUpdate.items.filter(item => item.id !== dishId);
      const result = await saveMenu({ ...menuToUpdate, items: updatedItems });

      if (result.success) {
        toast({ title: "Plato Eliminado", description: `Se eliminó "${dishName}" del menú.` });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al Eliminar Plato", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
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
        <Link href="/empresa/menus" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Menús
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Todos los Platos Disponibles</CardTitle>
            <CardDescription>Aquí puedes ver y editar el precio de todos los platos. Para editar un plato en detalle, o eliminarlo, edita su menú correspondiente.</CardDescription>
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
                                    <li key={`${plato.menuId}-${plato.id}`} className="p-2 border-b last:border-b-0 text-sm flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">{plato.name}</p>
                                        <p className="text-xs text-muted-foreground">Del menú: "{plato.menuName}"</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <p className="font-semibold text-primary">{formatCurrency(plato.suggestedSellingPrice)}</p>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(plato)} title="Editar precio del plato">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={processingId === plato.id || processingId === plato.menuId} title="Opciones">
                                                    {(processingId === plato.id || processingId === plato.menuId) ? <Loader2 className="w-4 h-4 animate-spin"/> : <MoreVertical className="w-4 h-4" />}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/empresa/menus/${plato.menuId}/editar`}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Editar Menú Completo
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicateMenu(plato.menuId, plato.menuName)}>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Duplicar Menú
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Eliminar Plato
                                                    </DropdownMenuItem>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>¿Eliminar este plato?</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Se eliminará "{plato.name}" del menú "{plato.menuName}". Esta acción no se puede deshacer.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleDeleteDish(plato.menuId, plato.id, plato.name)} className="bg-destructive hover:bg-destructive/90">
                                                        Eliminar Plato
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
