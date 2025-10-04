
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import type { BebidasData, BebidaCategoria, BebidaItem, BebidaReceta, IngredienteReceta, TipoAsistente } from '@/types/fiesta';
import { GlassWater, Edit, Trash2, PlusCircle, Info, Loader2 } from 'lucide-react';
import { defaultBebidasData } from '@/lib/fiesta-defaults';
import { useToast } from '@/hooks/use-toast';
import { ALL_UNIDADES_SERVICIO, type UnidadServicio } from '@/types/empresa';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface GestionBebidasProps {
  initialData: BebidasData | null;
  onDataChange: (data: BebidasData) => void;
  invitados: { adultos: number; ninos: number; adolescentes: number };
  isTemplateMode?: boolean;
}

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const GestionBebidas: React.FC<GestionBebidasProps> = ({ initialData, onDataChange, invitados, isTemplateMode = false }) => {
  const { toast } = useToast();
  const [bebidas, setBebidas] = useState<BebidasData>(initialData || defaultBebidasData);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BebidaCategoria | null>(null);

  const [isRecetaModalOpen, setIsRecetaModalOpen] = useState(false);
  const [editingReceta, setEditingReceta] = useState<BebidaReceta | null>(null);

  useEffect(() => {
    onDataChange(bebidas);
  }, [bebidas, onDataChange]);

  const handleCategoryActivation = (categoryId: string, activada: boolean) => {
    setBebidas(prev => ({
      ...prev,
      categorias: prev.categorias.map(c => c.id === categoryId ? { ...c, activada } : c)
    }));
  };
  
  const openEditModal = (category: BebidaCategoria) => {
    setEditingCategory(JSON.parse(JSON.stringify(category)));
    setIsEditModalOpen(true);
  };
  
  const handleItemChange = (itemId: string, field: keyof BebidaItem, value: any) => {
    setEditingCategory(prevCat => {
        if (!prevCat) return null;
        return {
            ...prevCat,
            items: prevCat.items.map(item => {
              if (item.id !== itemId) return item;
              const updatedItem = { ...item, [field]: value };
              if (field === 'cantidadNecesaria' || field === 'costoUnitario') {
                updatedItem.costoTotal = (updatedItem.cantidadNecesaria || 0) * (updatedItem.costoUnitario || 0);
              }
              return updatedItem;
            })
        };
    });
  };

  const addNewItem = () => {
    if (!editingCategory) return;
    const newItem: BebidaItem = {
        id: `beb-item-${Date.now()}`, nombre: 'Nueva Bebida', cantidadNecesaria: 1, unidadCantidad: 'Botellas', costoUnitario: 0, costoTotal: 0
    };
    setEditingCategory(prev => prev ? {...prev, items: [...prev.items, newItem]} : null);
  };

  const deleteItem = (itemId: string) => {
     if (!editingCategory) return;
     setEditingCategory(prev => prev ? {...prev, items: prev.items.filter(item => item.id !== itemId)} : null);
  };

  const handleSaveEdits = () => {
    if (!editingCategory) return;
    setBebidas(prev => ({
        ...prev,
        categorias: prev.categorias.map(c => c.id === editingCategory.id ? editingCategory : c)
    }));
    setIsEditModalOpen(false);
    toast({title: "Cambios en Bebidas Guardados", description: `Se actualizaron los ítems de ${editingCategory.nombreDisplay}.`});
  };
  
  const openRecetaModal = (categoria: BebidaCategoria, receta: BebidaReceta) => {
    setEditingCategory(categoria);
    setEditingReceta(JSON.parse(JSON.stringify(receta)));
    setIsRecetaModalOpen(true);
  };

  const handleRecetaChange = (field: keyof BebidaReceta, value: any) => {
      setEditingReceta(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleIngredienteChange = (ingId: string, field: keyof IngredienteReceta, value: any) => {
      setEditingReceta(prev => {
          if (!prev) return null;
          const newIngredients = prev.ingredientes.map(ing => {
              if (ing.id !== ingId) return ing;
              const updatedIng = { ...ing, [field]: value };
              if (field === 'cantidad' || field === 'costoUnitario') {
                  updatedIng.costoTotal = (Number(updatedIng.cantidad) || 0) * (Number(updatedIng.costoUnitario) || 0);
              }
              return updatedIng;
          });
          const costoTotalReceta = newIngredients.reduce((sum, ing) => sum + (ing.costoTotal || 0), 0);
          return { ...prev, ingredientes: newIngredients, costoTotalReceta };
      });
  };
  
  const addIngrediente = () => {
      setEditingReceta(prev => prev ? { ...prev, ingredientes: [...prev.ingredientes, { id: `ing-${Date.now()}`, nombreInsumo: '', cantidad: 0, unidad: 'g', costoUnitario: 0, costoTotal: 0 } as IngredienteReceta]} : null);
  };

  const deleteIngrediente = (ingId: string) => {
      setEditingReceta(prev => {
        if (!prev) return null;
        const newIngredients = prev.ingredientes.filter(ing => ing.id !== ingId);
        const costoTotalReceta = newIngredients.reduce((sum, ing) => sum + (ing.costoTotal || 0), 0);
        return { ...prev, ingredientes: newIngredients, costoTotalReceta };
      });
  };

  const handleSaveReceta = () => {
      if (!editingReceta || !editingCategory) return;
      const updatedCategorias = bebidas.categorias.map(cat => {
          if (cat.id !== editingCategory.id) return cat;
          const updatedRecetas = (cat.recetas || []).map(r => r.id === editingReceta.id ? editingReceta : r);
          return { ...cat, recetas: updatedRecetas };
      });
      setBebidas({ ...bebidas, categorias: updatedCategorias });
      setIsRecetaModalOpen(false);
      toast({ title: "Receta Actualizada" });
  };


  const totalCostoBebidas = useMemo(() => {
    let total = 0;
    bebidas.categorias.forEach(cat => {
      if (isTemplateMode || cat.activada) {
        cat.items.forEach(item => {
          total += item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0));
        });
        cat.recetas?.forEach(receta => {
            const factorEscala = (invitados.adultos + invitados.adolescentes + invitados.ninos) / (receta.porcionesBase || 1);
            total += (receta.costoTotalReceta || 0) * (isNaN(factorEscala) ? 0 : factorEscala);
        });
      }
    });
    return total;
  }, [bebidas, invitados, isTemplateMode]);

  return (
    <>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Editar Plantilla de Compra: {editingCategory?.nombreDisplay}</DialogTitle><DialogDescription>Añade, edita o elimina los ítems de compra directa para esta categoría.</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 p-1">
            {editingCategory?.items.map(item => (
              <div key={item.id} className="p-3 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <div className="space-y-1 md:col-span-3"><Label htmlFor={`beb-name-${item.id}`}>Nombre</Label><Input id={`beb-name-${item.id}`} value={item.nombre} onChange={(e) => handleItemChange(item.id, 'nombre', e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor={`beb-qty-${item.id}`}>Cantidad</Label><Input id={`beb-qty-${item.id}`} type="number" value={item.cantidadNecesaria || ''} onChange={(e) => handleItemChange(item.id, 'cantidadNecesaria', Number(e.target.value))} /></div>
                <div className="space-y-1"><Label htmlFor={`beb-unit-${item.id}`}>Unidad</Label><Input id={`beb-unit-${item.id}`} value={item.unidadCantidad || ''} onChange={(e) => handleItemChange(item.id, 'unidadCantidad', e.target.value)} /></div>
                <div className="space-y-1 relative"><Label htmlFor={`beb-cost-${item.id}`}>Costo Unitario</Label><Input id={`beb-cost-${item.id}`} type="number" value={item.costoUnitario || ''} onChange={(e) => handleItemChange(item.id, 'costoUnitario', Number(e.target.value))} className="pl-6"/><span className="absolute left-2 top-1/2 mt-1 text-muted-foreground">$</span></div>
                <Button variant="ghost" size="icon" className="text-destructive self-end" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addNewItem}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Ítem de Compra</Button>
          <DialogFooter><DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose><Button onClick={handleSaveEdits}>Guardar Cambios</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRecetaModalOpen} onOpenChange={setIsRecetaModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Editar Receta: {editingReceta?.nombre}</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 p-1">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <div className="space-y-1"><Label htmlFor="receta-nombre">Nombre Receta</Label><Input id="receta-nombre" value={editingReceta?.nombre || ''} onChange={e => handleRecetaChange('nombre', e.target.value)} /></div>
               <div className="space-y-1"><Label htmlFor="receta-porciones">Rinde (Porciones)</Label><Input id="receta-porciones" type="number" value={editingReceta?.porcionesBase || 0} onChange={e => handleRecetaChange('porcionesBase', Number(e.target.value))} /></div>
               <div className="space-y-1"><Label htmlFor="receta-capacidad">Rinde (Litros)</Label><Input id="receta-capacidad" type="number" value={editingReceta?.capacidadBaseLt || 0} onChange={e => handleRecetaChange('capacidadBaseLt', Number(e.target.value))} /></div>
             </div>
             <Separator/>
             <h4 className="text-sm font-medium">Ingredientes de la Receta</h4>
             {editingReceta?.ingredientes.map(ing => (
                 <div key={ing.id} className="p-2 border rounded-md grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                     <div className="space-y-1 col-span-2 md:col-span-1"><Label htmlFor={`ing-name-${ing.id}`}>Nombre</Label><Input id={`ing-name-${ing.id}`} value={ing.nombreInsumo} onChange={(e) => handleIngredienteChange(ing.id, 'nombreInsumo', e.target.value)} /></div>
                     <div className="space-y-1"><Label htmlFor={`ing-qty-${ing.id}`}>Cantidad</Label><Input id={`ing-qty-${ing.id}`} type="number" value={ing.cantidad || ''} onChange={(e) => handleIngredienteChange(ing.id, 'cantidad', e.target.value)} /></div>
                     <div className="space-y-1"><Label htmlFor={`ing-unit-${ing.id}`}>Unidad</Label><Input id={`ing-unit-${ing.id}`} value={ing.unidad || ''} onChange={(e) => handleIngredienteChange(ing.id, 'unidad', e.target.value)} /></div>
                     <div className="flex items-end gap-1">
                         <div className="space-y-1 flex-grow"><Label htmlFor={`ing-cost-${ing.id}`}>Costo Unit.</Label><Input id={`ing-cost-${ing.id}`} type="number" value={ing.costoUnitario || ''} onChange={(e) => handleIngredienteChange(ing.id, 'costoUnitario', e.target.value)} /></div>
                         <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteIngrediente(ing.id)}><Trash2 className="w-4 h-4"/></Button>
                     </div>
                 </div>
             ))}
             <p className="text-right font-semibold">Costo Total Receta: {formatCurrency(editingReceta?.costoTotalReceta)}</p>
          </div>
           <Button variant="outline" size="sm" onClick={addIngrediente}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Ingrediente</Button>
          <DialogFooter><DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose><Button onClick={handleSaveReceta}>Guardar Receta</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    
      <Card className="shadow-lg">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="p-3 bg-primary/10 rounded-lg"><GlassWater className="w-8 h-8 text-primary" /></div>
          <div>
            <CardTitle className="font-headline text-2xl">Bebidas</CardTitle>
            <CardDescription>
              {isTemplateMode ? "Define los ítems base y recetas para cada categoría de bebidas." : "Activa y configura las bebidas para el evento."}
            </CardDescription>
          </div>
          {!isTemplateMode && (
            <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Costo Total Estimado</p>
                <p className="text-xl font-bold">{formatCurrency(totalCostoBebidas)}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-3" defaultValue={isTemplateMode ? bebidas.categorias.map(c => c.id) : bebidas.categorias.filter(c=>c.activada).map(c=>c.id)}>
            {bebidas.categorias.map(cat => (
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
                          <h4 className="text-sm font-medium">Ítems de Compra Directa:</h4>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                              {cat.items.map(item => <li key={item.id}>{item.nombre} ({item.cantidadNecesaria} {item.unidadCantidad})</li>)}
                          </ul>
                      </div>
                    )}
                    
                    {cat.recetas && cat.recetas.length > 0 && (
                       <div className="space-y-2">
                          <h4 className="text-sm font-medium">Recetas / Preparaciones:</h4>
                          {cat.recetas.map(receta => (
                            <div key={receta.id} className="pl-4">
                              <p className="font-medium text-sm text-foreground">{receta.nombre}</p>
                              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                                {receta.ingredientes?.map(ing => (
                                  <li key={ing.id}>{ing.nombreInsumo}: {ing.cantidad} {ing.unidad}</li>
                                ))}
                              </ul>
                                <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-1" onClick={() => openRecetaModal(cat, receta)}>Editar Receta</Button>
                            </div>
                          ))}
                      </div>
                    )}

                     {isTemplateMode && (
                        <div className="flex justify-end pt-2">
                             <Button variant="outline" size="sm" onClick={() => openEditModal(cat)}>
                                 <Edit className="w-3 h-3 mr-2" /> Editar Ítems de Compra
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
