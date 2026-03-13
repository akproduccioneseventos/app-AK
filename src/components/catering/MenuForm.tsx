'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Loader2, Save, BookOpen, Search, Percent, DollarSign, Link as LinkIcon, Info, Image as ImageIconLucide, UploadCloud, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveMenu } from '@/app/actions/menus-catering';
import { getInsumos, saveInsumo } from '@/app/actions/insumos';
import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { 
    style: 'currency', 
    currency: 'UYU', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  }).format(amount);
};

const parseSafeNumber = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    let str = String(val).trim();
    if (!str) return 0;
    
    if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
};

export function MenuForm({ existingMenu }: { existingMenu?: FullMenu }) {
  const router = useRouter();
  const { toast } = useToast();
  const [menu, setMenu] = useState<Partial<FullMenu>>(
    existingMenu || { name: '', items: [] }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [catalogoInsumos, setCatalogoInsumos] = useState<ServicioEmpresa[]>([]);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [currentItemIdForCatalog, setCurrentItemIdForCatalog] = useState<string | null>(null);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [dishSearchTerm, setDishSearchTerm] = useState('');

  const calculateIngredientCost = useCallback((ing: Partial<Ingredient>): number => {
      const quantity = parseSafeNumber(ing.quantityPerPerson);
      const unitCost = parseSafeNumber(ing.costoUnitario);
      const unit = (ing.unit || '').toLowerCase().trim();
      if (quantity === 0 || unitCost === 0) return 0;
      const countableUnits = ['un', 'unidad', 'unidades', 'uds', 'u', 'paquete', 'pack', 'set', 'docena', 'bolsa', 'caja', 'cajas'];
      if (countableUnits.includes(unit)) return quantity * unitCost;
      return (quantity / 1000) * unitCost;
  }, []);
  
  const calculateTotalDishCost = useCallback((ingredients: Ingredient[], dishName: string): number => {
    const total = ingredients.reduce((sum, ing) => {
        const cost = calculateIngredientCost(ing);
        return sum + cost;
    }, 0);
    return total;
  }, [calculateIngredientCost]);

  const calculatePrices = useCallback((item: MenuItem): MenuItem => {
    const totalDishCost = calculateTotalDishCost(item.ingredients || [], item.name);
    let finalProfitMargin: number;
    let finalSuggestedSellingPrice: number;

    if (item.suggestedSellingPrice !== undefined && !isNaN(Number(item.suggestedSellingPrice)) && Number(item.suggestedSellingPrice) > 0) {
        finalSuggestedSellingPrice = Math.round(Number(item.suggestedSellingPrice));
        finalProfitMargin = totalDishCost > 0 ? Math.round(((finalSuggestedSellingPrice / totalDishCost) - 1) * 100) : (item.profitMargin || 100);
    } else {
        finalProfitMargin = item.profitMargin === undefined ? 100 : Number(item.profitMargin);
        finalSuggestedSellingPrice = Math.round(totalDishCost * (1 + finalProfitMargin / 100));
    }
    
    return { ...item, totalDishCost, suggestedSellingPrice: finalSuggestedSellingPrice, profitMargin: finalProfitMargin };
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
        items: (existingMenu.items || []).map(item => {
             const ingredientsWithCost = (item.ingredients || []).map(ing => ({
                ...ing,
                costoTotalReceta: calculateIngredientCost(ing)
            }));
            return calculatePrices({...item, ingredients: ingredientsWithCost});
        })
      };
      setMenu(menuWithCalculatedPrices);
    }
    fetchInsumos();
  }, [existingMenu, calculatePrices, calculateIngredientCost, fetchInsumos]);
  
  const sortedAndFilteredItems = useMemo(() => {
    const items = menu.items || [];
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (!dishSearchTerm.trim()) return sorted;
    return sorted.filter(item => item.name.toLowerCase().includes(dishSearchTerm.toLowerCase()));
  }, [menu.items, dishSearchTerm]);

  const handleMenuChange = (field: keyof FullMenu, value: any) => {
      setMenu(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (itemId: string, field: keyof MenuItem, value: any) => {
    setMenu(prev => ({
      ...prev,
      items: (prev.items || []).map(item => {
        if (item.id === itemId) {
          let updatedItem = { ...item, [field]: value };
          if (field === 'profitMargin') {
            const margin = parseSafeNumber(value);
            const newPrice = (item.totalDishCost || 0) * (1 + margin / 100);
            updatedItem = { ...updatedItem, suggestedSellingPrice: Math.round(newPrice) };
          }
          if (field === 'suggestedSellingPrice') {
            const price = parseSafeNumber(value);
            const cost = item.totalDishCost || 0;
            const newMargin = cost > 0 ? ((price / cost) - 1) * 100 : item.profitMargin;
            updatedItem = { ...updatedItem, profitMargin: Math.round(newMargin || 0) };
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
                    updatedIng.costoTotalReceta = calculateIngredientCost(updatedIng);
                    return updatedIng;
                }
                return ing;
            });
            return calculatePrices({ ...item, ingredients: newIngredients });
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
        const updatedInsumo = { ...catalogItem, valorUnitarioEstimado: parseSafeNumber(ing.costoUnitario) };
        await saveInsumo(updatedInsumo);
        toast({ title: 'Catálogo Actualizado', description: `Se registró nuevo costo de "${ing.name}" en el catálogo.`});
        await fetchInsumos();
    } catch (e: any) {
        toast({ title: "Error de Sincronización", description: e.message, variant: "destructive"});
    }
  };

  const addItem = () => {
    const newItem: MenuItem = {
      id: `new_item_${Date.now()}`, name: '', type: 'Entrada', ingredients: [], totalDishCost: 0,
      profitMargin: 100, suggestedSellingPrice: 0,
    };
    setMenu(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };
  
  const duplicateItem = (itemId: string) => {
    setMenu(prev => {
      if (!prev || !prev.items) return prev;
      const itemToDuplicate = prev.items.find(item => item.id === itemId);
      if (!itemToDuplicate) return prev;
      const duplicatedItem: MenuItem = {
        ...JSON.parse(JSON.stringify(itemToDuplicate)),
        id: `dupe_item_${Date.now()}`,
        name: `[COPIA] ${itemToDuplicate.name}`,
      };
      return { ...prev, items: [...prev.items, duplicatedItem] };
    });
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
  };

  const addIngredientFromCatalog = (itemId: string, insumo: ServicioEmpresa) => {
      const newItem: Ingredient = {
        id: `new_ing_cat_${insumo.id}_${Date.now()}`,
        origenId: insumo.id,
        name: insumo.nombre,
        quantityPerPerson: '0',
        unit: insumo.unidad || 'g',
        costoUnitario: insumo.valorUnitarioEstimado || 0,
        costoTotalReceta: 0
      };
      setMenu(prev => ({
      ...prev,
      items: (prev.items || []).map(item =>
        item.id === itemId ? calculatePrices({ ...item, ingredients: [...(item.ingredients || []), newItem] }) : item
      ),
    }));
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
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!menu.name?.trim()) {
      toast({ title: 'Error', description: 'El nombre del menú es obligatorio.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const result = await saveMenu(menu as FullMenu);
      if (result.success) {
        toast({ title: '¡Menú Guardado!', description: `El menú "${menu.name}" ha sido guardado.` });
        router.push('/empresa/menus');
      } else throw new Error(result.error || 'Error desconocido');
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
            <DialogHeader><DialogTitle>Seleccionar Ingrediente</DialogTitle></DialogHeader>
            <div className="py-2 space-y-2">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="pl-9"/></div>
                <ScrollArea className="h-64 border rounded-md p-1"><ul className="space-y-1">{filteredInsumos.map(insumo => (<li key={insumo.id}><Button type="button" variant="ghost" className="w-full justify-start text-left h-auto" onClick={() => { if (currentItemIdForCatalog) { addIngredientFromCatalog(currentItemIdForCatalog, insumo); } setIsCatalogModalOpen(false); }}><div><p className="font-medium text-sm">{insumo.nombre}</p><p className="text-xs text-muted-foreground">{formatCurrency(insumo.valorUnitarioEstimado)} / {insumo.unidad}</p></div></Button></li>))}</ul></ScrollArea>
            </div>
             <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
       </Dialog>
      <Card>
        <CardHeader><CardTitle>Información del Menú</CardTitle></CardHeader>
        <CardContent><div className="space-y-2"><Label htmlFor="menu-name">Nombre del Menú</Label><Input id="menu-name" value={menu.name || ''} onChange={(e) => handleMenuChange('name', e.target.value)} required /></div></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platos del Menú</CardTitle>
          <div className="relative pt-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar plato..." value={dishSearchTerm} onChange={(e) => setDishSearchTerm(e.target.value)} className="w-full max-w-sm pl-9" /></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedAndFilteredItems.map((item) => (
            <Card key={item.id} className="p-4">
                <CardHeader className="p-0 pb-4">
                     <div className="flex justify-between items-start">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mr-4">
                            <div className="space-y-2"><Label>Nombre Plato</Label><Input value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Tipo</Label><Select value={item.type || ''} onValueChange={(value) => handleItemChange(item.id, 'type', value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Entrada">Entrada</SelectItem><SelectItem value="Plato Principal">Plato Principal</SelectItem><SelectItem value="Postre">Postre</SelectItem><SelectItem value="Menú Infantil/Adolescente">Menú Infantil/Adolescente</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => duplicateItem(item.id)}><Copy className="w-4 h-4"/></Button><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button></div>
                     </div>
                </CardHeader>
                 <CardContent className="p-0">
                    <Accordion type="single" collapsible defaultValue="ingredients">
                      <AccordionItem value="ingredients" className="border-none">
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">Ingredientes ({item.ingredients?.length || 0})</AccordionTrigger>
                        <AccordionContent>
                           <div className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg">
                              {item.ingredients?.map(ing => (
                                <div key={ing.id} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-2 items-end p-2 border-b last:border-b-0">
                                    <div className="space-y-1 col-span-2 lg:col-span-3"><Label className="text-xs">Nombre</Label><Input value={ing.name || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'name', e.target.value)} className="h-8 text-sm" disabled={!!ing.origenId}/></div>
                                    <div className="space-y-1 col-span-1 lg:col-span-2"><Label className="text-xs">Cant. p/p</Label><Input value={ing.quantityPerPerson || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'quantityPerPerson', e.target.value)} className="h-8 text-sm" /></div>
                                    <div className="space-y-1 col-span-1 lg:col-span-1"><Label className="text-xs">Unidad</Label><Input value={ing.unit || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'unit', e.target.value)} className="h-8 text-sm" disabled={!!ing.origenId}/></div>
                                    <div className="space-y-1 col-span-1 lg:col-span-2 relative"><Label className="text-xs">Costo Unit.</Label><Input type="text" value={ing.costoUnitario || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'costoUnitario', e.target.value)} onBlur={() => handleIngredientBlur(item.id, ing, 'costoUnitario')} className="h-8 pl-6 text-sm"/><span className="absolute left-2 top-1/2 mt-1 text-muted-foreground">$</span></div>
                                    <div className="space-y-1 col-span-1 lg:col-span-2"><Label className="text-xs">Costo p/p</Label><p className="h-8 flex items-center font-medium text-sm">{formatCurrency(ing.costoTotalReceta)}</p></div>
                                    <div className="flex items-center justify-end col-span-2 lg:col-span-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteIngredient(item.id, ing.id)}><Trash2 className="w-3.5 h-3.5"/></Button></div>
                                </div>
                              ))}
                              <div className="flex gap-2 mt-3"><Button type="button" size="sm" variant="outline" onClick={() => addIngredient(item.id)}><PlusCircle className="w-4 h-4 mr-1.5"/>Manual</Button><Button type="button" size="sm" variant="outline" onClick={() => openCatalogModal(item.id)}><BookOpen className="w-4 h-4 mr-1.5"/>Catálogo</Button></div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                 </CardContent>
                 <CardFooter className="p-0 pt-4 mt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/40"><Label className="text-sm font-medium text-blue-800">Costo p/Persona (Calculado)</Label><p className="font-bold text-lg text-blue-700">{formatCurrency(item.totalDishCost || 0)}</p><p className="text-[10px] text-blue-600 mt-1 italic">Auditado según estructura de 5 pasos</p></div>
                        <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/40 space-y-1"><Label className="text-sm font-medium text-green-800 flex items-center gap-1"><Percent className="w-4 h-4"/>Margen (%)</Label><Input type="text" value={item.profitMargin?.toFixed(0) ?? ''} onChange={e => handleItemChange(item.id, 'profitMargin', e.target.value)} /></div>
                        <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/40 space-y-1"><Label className="text-sm font-medium text-green-800 flex items-center gap-1"><DollarSign className="w-4 h-4"/>Precio Venta ($)</Label><Input type="text" value={item.suggestedSellingPrice?.toFixed(0) ?? ''} onChange={e => handleItemChange(item.id, 'suggestedSellingPrice', e.target.value)} /></div>
                    </div>
                 </CardFooter>
            </Card>
          ))}
          <Button type="button" variant="secondary" onClick={addItem}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Plato</Button>
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button type="submit" disabled={isSaving} size="lg">{isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}Guardar Menú</Button></div>
    </form>
  );
}