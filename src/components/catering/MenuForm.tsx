
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Loader2, Save, BookOpen, Search, Percent, DollarSign, Link as LinkIcon, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveMenu } from '@/app/actions/menus-catering';
import { getInsumos, saveInsumo } from '@/app/actions/insumos';
import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { cn } from '@/lib/utils';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};


export function MenuForm({ existingMenu }: { existingMenu?: FullMenu }) {
  const router = useRouter();
  const { toast } = useToast();
  const [menu, setMenu] = useState<Partial<FullMenu>>(
    existingMenu || { name: '', description: '', items: [] }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [catalogoInsumos, setCatalogoInsumos] = useState<ServicioEmpresa[]>([]);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [currentItemIdForCatalog, setCurrentItemIdForCatalog] = useState<string | null>(null);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

  const calculateTotalDishCost = useCallback((ingredients: Ingredient[]): number => {
    return ingredients.reduce((sum, ing) => {
      const quantity = parseFloat(ing.quantityPerPerson || '0');
      const unitCost = Number(ing.costoUnitario) || 0;
      return sum + (quantity * unitCost);
    }, 0);
  }, []);

  const calculatePrices = useCallback((item: MenuItem): MenuItem => {
    const totalDishCost = calculateTotalDishCost(item.ingredients || []);
    const profitMargin = item.profitMargin === undefined || isNaN(item.profitMargin) ? 100 : item.profitMargin;
    const suggestedSellingPrice = totalDishCost * (1 + profitMargin / 100);
    return { ...item, totalDishCost, suggestedSellingPrice, profitMargin };
  }, [calculateTotalDishCost]);

  const fetchInsumos = useCallback(async () => {
      try {
        const insumos = await getInsumos();
        setCatalogoInsumos(insumos);
      } catch (e) {
        toast({ title: "Error", description: "No se pudo cargar el catálogo de insumos."});
      }
    }, [toast]);

  useEffect(() => {
    if (existingMenu) {
      const menuWithCalculatedPrices = {
        ...existingMenu,
        items: (existingMenu.items || []).map(calculatePrices)
      };
      setMenu(menuWithCalculatedPrices);
    }
    fetchInsumos();
  }, [existingMenu, calculatePrices, fetchInsumos]);

  const handleMenuChange = (field: keyof FullMenu, value: string) => {
    setMenu(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (itemId: string, field: keyof MenuItem, value: any) => {
    setMenu(prev => ({
      ...prev,
      items: (prev.items || []).map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
           if (field === 'profitMargin') {
            const margin = Number(value) || 0;
            const newPrice = (item.totalDishCost || 0) * (1 + margin / 100);
            return { ...updatedItem, suggestedSellingPrice: newPrice };
          }
          if (field === 'suggestedSellingPrice') {
            const price = Number(value) || 0;
            const cost = item.totalDishCost || 0;
            const newMargin = cost > 0 ? ((price / cost) - 1) * 100 : item.profitMargin;
            return { ...updatedItem, profitMargin: newMargin, suggestedSellingPrice: price };
          }
          return calculatePrices(updatedItem);
        }
        return item;
      }),
    }));
  };
  
  const handleIngredientChange = (itemId: string, ingId: string, field: keyof Ingredient, value: any) => {
    setMenu(prev => {
      if (!prev) return null;
      const newItems = (prev.items || []).map(item => {
        if (item.id === itemId) {
          const newIngredients = (item.ingredients || []).map(ing => {
            if (ing.id === ingId) {
                const updatedIng = { ...ing, [field]: value };
                 if (field === 'quantityPerPerson' || field === 'costoUnitario') {
                    const quantity = parseFloat(updatedIng.quantityPerPerson || '0');
                    const unitCost = Number(updatedIng.costoUnitario) || 0;
                    updatedIng.costoTotalReceta = quantity * unitCost; // This is now cost for THIS ingredient's quantity.
                }
                return updatedIng;
            }
            return ing;
          });
          // After updating an ingredient, recalculate the whole dish cost
          const totalDishCost = newIngredients.reduce((sum, ing) => sum + (Number(ing.costoTotalReceta) || 0), 0);
          const profitMargin = item.profitMargin === undefined || isNaN(item.profitMargin) ? 100 : item.profitMargin;
          const suggestedSellingPrice = totalDishCost * (1 + profitMargin / 100);

          return { ...item, ingredients: newIngredients, totalDishCost, suggestedSellingPrice };
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };
  
 const handleIngredientBlur = async (itemId: string, ing: Ingredient, field: 'costoUnitario') => {
    if (!ing.origenId) return;

    const catalogItem = catalogoInsumos.find(i => i.id === ing.origenId);
    if (!catalogItem || catalogItem.valorUnitarioEstimado === ing.costoUnitario) return;
    
    try {
        const updatedInsumo = { ...catalogItem, valorUnitarioEstimado: Number(ing.costoUnitario) || 0 };
        await saveInsumo(updatedInsumo);
        toast({ title: 'Catálogo Actualizado', description: `Se actualizó el costo de "${ing.name}" en el catálogo.`});
        await fetchInsumos();
    } catch (e: any) {
        toast({ title: "Error de Sincronización", description: e.message, variant: "destructive"});
        // Revert UI change on error
        setMenu(prev => {
            if (!prev) return null;
            const revertedItems = (prev.items || []).map(item => {
                if (item.id === itemId) {
                    const revertedIngredients = (item.ingredients || []).map(i =>
                        i.id === ing.id ? { ...i, [field]: catalogItem.valorUnitarioEstimado } : i
                    );
                    return calculatePrices({ ...item, ingredients: revertedIngredients });
                }
                return item;
            });
            return { ...prev, items: revertedItems };
        });
    }
  };


  const addItem = () => {
    const newItem: MenuItem = {
      id: `new_item_${Date.now()}`, name: '', type: 'Entrada', ingredients: [], totalDishCost: 0,
      profitMargin: 100, suggestedSellingPrice: 0,
    };
    setMenu(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };
  
  const addIngredient = (itemId: string) => {
    const newIngredient: Ingredient = {
        id: `new_ing_${Date.now()}`, name: '', quantityPerPerson: '0', unit: 'g', costoUnitario: 0, costoTotalReceta: 0
    };
     setMenu(prev => ({
      ...prev,
      items: (prev.items || []).map(item =>
        item.id === itemId ? calculatePrices({ ...item, ingredients: [...(item.ingredients || []), newIngredient] }) : item
      ),
    }));
  }

  const addIngredientFromCatalog = (itemId: string, insumo: ServicioEmpresa) => {
      const quantity = 0; // Default quantity
      const unitCost = insumo.valorUnitarioEstimado || 0;
      const newItem: Ingredient = {
        id: `new_ing_cat_${insumo.id}_${Date.now()}`,
        origenId: insumo.id, name: insumo.nombre, quantityPerPerson: String(quantity), unit: insumo.unidad || 'Unidad',
        costoUnitario: unitCost, proveedor: insumo.proveedor || '', costoTotalReceta: quantity * unitCost
      };
      setMenu(prev => ({
      ...prev,
      items: (prev.items || []).map(item =>
        item.id === itemId ? calculatePrices({ ...item, ingredients: [...(item.ingredients || []), newItem] }) : item
      ),
    }));
    toast({ description: `"${insumo.nombre}" añadido al plato.` });
  };
  
  const openCatalogModal = (itemId: string) => {
    setCurrentItemIdForCatalog(itemId);
    setIsCatalogModalOpen(true);
  };

  const deleteItem = (itemId: string) => {
    setMenu(prev => ({ ...prev, items: (prev.items || []).filter(item => item.id !== itemId) }));
  };
  
  const deleteIngredient = (itemId: string, ingId: string) => {
    setMenu(prev => ({
        ...prev,
        items: (prev.items || []).map(item =>
         item.id === itemId ? calculatePrices({ ...item, ingredients: (item.ingredients || []).filter(ing => ing.id !== ingId) }) : item
        ),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!menu.name?.trim()) {
      toast({ title: 'Error', description: 'El nombre del menú es obligatorio.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    
    const menuToSave = { ...menu };
    if (menuToSave.items) {
      menuToSave.items = menuToSave.items.map(calculatePrices);
    }
    
    try {
      const result = await saveMenu(menuToSave as FullMenu);
      if (result.success) {
        toast({ title: '¡Menú Guardado!', description: `El menú "${menu.name}" ha sido guardado.` });
        router.push('/empresa/menus');
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error: any) {
      toast({ title: 'Error al Guardar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const filteredInsumos = useMemo(() => {
    if (!catalogSearchTerm) return catalogoInsumos;
    return catalogoInsumos.filter(i => i.nombre.toLowerCase().includes(catalogSearchTerm.toLowerCase()));
  }, [catalogSearchTerm, catalogoInsumos]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Seleccionar Ingrediente del Catálogo</DialogTitle></DialogHeader>
            <div className="py-2 space-y-2">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="pl-9"/></div>
                <ScrollArea className="h-72 border rounded-md p-1"><ul className="space-y-1">{filteredInsumos.length > 0 ? (filteredInsumos.map(insumo => (<li key={insumo.id}><Button type="button" variant="ghost" className="w-full justify-start text-left h-auto" onClick={() => { if (currentItemIdForCatalog) { addIngredientFromCatalog(currentItemIdForCatalog, insumo); } setIsCatalogModalOpen(false); }}><div><p className="font-medium text-sm">{insumo.nombre}</p><p className="text-xs text-muted-foreground">{formatCurrency(insumo.valorUnitarioEstimado)} / {insumo.unidad}</p></div></Button></li>))) : <li className="p-4 text-sm text-center text-muted-foreground">No se encontraron insumos.</li>}</ul></ScrollArea>
            </div>
        </DialogContent>
       </Dialog>
      <Card>
        <CardHeader>
          <CardTitle>Información del Menú</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="menu-name">Nombre del Menú</Label><Input id="menu-name" value={menu.name || ''} onChange={(e) => handleMenuChange('name', e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="menu-description">Descripción</Label><Textarea id="menu-description" value={menu.description || ''} onChange={(e) => handleMenuChange('description', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platos del Menú</CardTitle>
          <CardDescription>Añade o edita los platos que componen este menú.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(menu.items || []).map((item, index) => (
            <Card key={item.id} className={cn("p-4",
              index % 3 === 0 ? "bg-blue-50 dark:bg-blue-900/20" :
              index % 3 === 1 ? "bg-green-50 dark:bg-green-900/20" :
              "bg-purple-50 dark:bg-purple-900/20"
            )}>
                <CardHeader className="p-0 pb-4">
                     <div className="flex justify-between items-start">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                           <div className="space-y-2"><Label htmlFor={`item-name-${item.id}`}>Nombre Plato</Label><Input id={`item-name-${item.id}`} value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} /></div>
                           <div className="space-y-2"><Label htmlFor={`item-type-${item.id}`}>Tipo</Label><Select value={item.type || ''} onValueChange={(value) => handleItemChange(item.id, 'type', value)}><SelectTrigger id={`item-type-${item.id}`}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Entrada">Entrada</SelectItem><SelectItem value="Plato Principal">Plato Principal</SelectItem><SelectItem value="Postre">Postre</SelectItem><SelectItem value="Bebida">Bebida</SelectItem><SelectItem value="Menú Infantil/Adolescente">Menú Infantil/Adolescente</SelectItem></SelectContent></Select></div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-2 flex-shrink-0" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
                     </div>
                </CardHeader>
                 <CardContent className="p-0">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="ingredients">
                        <AccordionTrigger className="text-sm font-medium">Ingredientes</AccordionTrigger>
                        <AccordionContent>
                           <div className="mt-2 space-y-3 p-3 bg-white dark:bg-black/20 rounded-lg">
                              {item.ingredients?.map(ing => (
                                <div key={ing.id} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end p-3 border-b last:border-b-0">
                                    <div className="space-y-1 col-span-2 lg:col-span-2 relative">
                                        <Label className="text-xs">Nombre</Label>
                                        {ing.origenId && <LinkIcon className="w-3 h-3 absolute top-0.5 right-0.5 text-muted-foreground" title="Vinculado al catálogo de insumos"/>}
                                        <Input value={ing.name || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'name', e.target.value)} className="h-8 text-sm" disabled={!!ing.origenId}/>
                                    </div>
                                    <div className="space-y-1"><Label className="text-xs">Cant. p/p</Label><Input value={ing.quantityPerPerson || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'quantityPerPerson', e.target.value)} className="h-8 text-sm" /></div>
                                    <div className="space-y-1"><Label className="text-xs">Unidad</Label><Input value={ing.unit || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'unit', e.target.value)} className="h-8 text-sm" disabled={!!ing.origenId}/></div>
                                    <div className="space-y-1 relative"><Label className="text-xs">Costo p/Unidad</Label><Input type="number" value={ing.costoUnitario || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'costoUnitario', Number(e.target.value))} onBlur={() => handleIngredientBlur(item.id, ing, 'costoUnitario')} className="h-8 pl-6 text-sm"/><span className="absolute left-2 top-1/2 mt-1 text-muted-foreground">$</span></div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs text-muted-foreground text-right w-full font-semibold">{formatCurrency(ing.costoTotalReceta)}</p>
                                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteIngredient(item.id, ing.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                    </div>
                                </div>
                              ))}
                              <div className="flex gap-2 mt-3">
                                  <Button type="button" size="sm" variant="outline" onClick={() => addIngredient(item.id)}><PlusCircle className="w-4 h-4 mr-1.5"/>Añadir Manual</Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => openCatalogModal(item.id)}><BookOpen className="w-4 h-4 mr-1.5"/>Desde Catálogo</Button>
                              </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                 </CardContent>
                 <CardFooter className="p-0 pt-4 mt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">Costo p/Persona</Label>
                            <p className="font-bold text-lg text-blue-600">{formatCurrency(item.totalDishCost || 0)}</p>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`profit-${item.id}`} className="text-sm flex items-center gap-1"><Percent className="w-3 h-3"/>Margen (%)</Label>
                            <Input id={`profit-${item.id}`} type="number" value={item.profitMargin?.toFixed(0) ?? ''} onChange={e => handleItemChange(item.id, 'profitMargin', Number(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-1">
                             <Label htmlFor={`price-${item.id}`} className="text-sm flex items-center gap-1"><DollarSign className="w-3 h-3"/>Precio Venta ($)</Label>
                             <Input id={`price-${item.id}`} type="number" value={item.suggestedSellingPrice?.toFixed(0) ?? ''} onChange={e => handleItemChange(item.id, 'suggestedSellingPrice', Number(e.target.value) || 0)} />
                        </div>
                    </div>
                 </CardFooter>
            </Card>
          ))}
          <Button type="button" variant="secondary" onClick={addItem}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Plato</Button>
        </CardContent>
      </Card>
      
      <p className="text-right font-bold text-xl">Costo Total del Menú por Persona: {formatCurrency((menu.items || []).reduce((sum, item) => sum + (item.totalDishCost || 0), 0))}</p>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {isSaving ? 'Guardando...' : (existingMenu ? 'Guardar Cambios en Menú' : 'Crear Menú')}
        </Button>
      </div>
    </form>
  );
}

