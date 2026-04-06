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
import { PlusCircle, Trash2, Loader2, Save, BookOpen, Search, Percent, DollarSign, Copy, Info, ImageIcon, Tag, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveMenu, getMenus } from '@/app/actions/menus-catering';
import { getInsumos, saveInsumo } from '@/app/actions/insumos';
import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const ALLERGEN_OPTIONS = [
  { id: 'gluten', label: 'Gluten', emoji: '🌾' },
  { id: 'lacteos', label: 'Lácteos', emoji: '🥛' },
  { id: 'frutos_secos', label: 'Frutos Secos', emoji: '🥜' },
  { id: 'huevo', label: 'Huevo', emoji: '🥚' },
  { id: 'pescado', label: 'Pescado', emoji: '🐟' },
  { id: 'mariscos', label: 'Mariscos', emoji: '🦐' },
  { id: 'soja', label: 'Soja', emoji: '🫘' },
];

const DISH_TYPE_EMOJIS: Record<string, string> = {
  'Entrada': '🥗',
  'Plato Principal': '🍽️',
  'Postre': '🍰',
  'Bebida': '🥤',
  'Menú Infantil': '🧒',
  'Menú Infantil/Adolescente': '🧒',
  '': '🍴',
};

const INGREDIENT_COLORS = [
  '#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#14b8a6','#f97316','#84cc16',
];

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
    } else {
        const parts = str.split('.');
        if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
            str = str.replace(/\./g, '');
        }
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
  const [allDishesForMerge, setAllDishesForMerge] = useState<MenuItem[]>([]);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [currentItemIdForCatalog, setCurrentItemIdForCatalog] = useState<string | null>(null);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [dishSearchTerm, setDishSearchTerm] = useState('');

  const calculateIngredientCost = useCallback((ing: Partial<Ingredient>): number => {
      const quantity = parseSafeNumber(ing.quantityPerPerson);
      const unitCost = parseSafeNumber(ing.costoUnitario);
      const recipeUnit = (ing.unit || '').toLowerCase().trim();
      
      if (quantity === 0 || unitCost === 0) return 0;
      
      const catalogItem = ing.origenId ? catalogoInsumos.find(item => item.id === ing.origenId) : null;
      const catalogUnit = (catalogItem?.unidad || '').toLowerCase().trim();

      const isSmallRecipeUnit = ['g', 'gramos', 'ml', 'cc', 'cc.', 'no definido'].includes(recipeUnit);
      const isSmallCatalogUnit = ['g', 'gramos', 'ml', 'cc', 'cc.'].includes(catalogUnit);

      let factor = 1;
      if (isSmallRecipeUnit && !isSmallCatalogUnit) {
          factor = 1000;
      }
      
      return (quantity / factor) * unitCost;
  }, [catalogoInsumos]);
  
  const calculateTotalDishCost = useCallback((ingredients: Ingredient[]): number => {
    return ingredients.reduce((sum, ing) => sum + calculateIngredientCost(ing), 0);
  }, [calculateIngredientCost]);

  const calculatePrices = useCallback((item: MenuItem): MenuItem => {
    // FUSIÓN VISUAL: Si el plato es "con Mesa Buffet", sumamos virtualmente los ingredientes para el costo
    let finalIngredients = [...(item.ingredients || [])];
    if (item.name.toUpperCase().includes('MESA BUFET') || item.name.toUpperCase().includes('MESA BUFFET')) {
        const buffetBase = allDishesForMerge.find(d => 
            (d.name === 'MESA BUFET' || d.name === 'Mesa Buffet') && d.id !== item.id
        );
        if (buffetBase && buffetBase.ingredients) {
            buffetBase.ingredients.forEach(bi => {
                if (!finalIngredients.some(ei => ei.name.toLowerCase() === bi.name.toLowerCase())) {
                    finalIngredients.push(bi);
                }
            });
        }
    }

    const totalDishCost = calculateTotalDishCost(finalIngredients);
    let finalProfitMargin = item.profitMargin === undefined ? 100 : Number(item.profitMargin);
    let finalSuggestedSellingPrice: number;

    if (item.suggestedSellingPrice !== undefined && Number(item.suggestedSellingPrice) > 0) {
        finalSuggestedSellingPrice = Math.round(Number(item.suggestedSellingPrice));
        finalProfitMargin = totalDishCost > 0 ? Math.round(((finalSuggestedSellingPrice / totalDishCost) - 1) * 100) : finalProfitMargin;
    } else {
        finalSuggestedSellingPrice = Math.round(totalDishCost * (1 + finalProfitMargin / 100));
    }
    
    return { ...item, totalDishCost, suggestedSellingPrice: finalSuggestedSellingPrice, profitMargin: finalProfitMargin };
  }, [calculateTotalDishCost, allDishesForMerge]);

  const fetchInitialData = useCallback(async () => {
      try {
        const [insumos, menus] = await Promise.all([getInsumos(), getMenus()]);
        setCatalogoInsumos(insumos);
        setAllDishesForMerge(menus.flatMap(m => m.items));
      } catch (e) {
        toast({ title: "Error", description: "No se pudieron cargar los datos base."});
      }
    }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (existingMenu && catalogoInsumos.length > 0) {
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
  }, [existingMenu, catalogoInsumos, calculatePrices, calculateIngredientCost]);
  
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
      if (!prev) return {} as Partial<FullMenu>;
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
        toast({ title: 'Catálogo Actualizado', description: `Costo de "${ing.name}" sincronizado.`});
        await fetchInitialData();
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
                        <div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => duplicateItem(item.id)} title="Duplicar plato"><Copy className="w-4 h-4"/></Button><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button></div>
                     </div>
                     {/* Foto del plato */}
                     <div className="mt-3 flex items-start gap-3">
                       <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border bg-muted flex items-center justify-center text-2xl relative">
                         <span className="text-2xl">{DISH_TYPE_EMOJIS[item.type || ''] || '🍴'}</span>
                         {item.imageUrl && (
                           <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                         )}
                       </div>
                       <div className="flex-1 space-y-1">
                         <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3"/>URL de la foto del plato</Label>
                         <Input
                           value={item.imageUrl || ''}
                           onChange={e => handleItemChange(item.id, 'imageUrl', e.target.value)}
                           placeholder="https://... (URL de imagen de Canva u otro)"
                           className="h-8 text-sm"
                         />
                       </div>
                     </div>
                     {/* Alérgenos */}
                     <div className="mt-3 space-y-1">
                       <Label className="text-xs flex items-center gap-1"><Tag className="w-3 h-3"/>Alérgenos</Label>
                       <div className="flex flex-wrap gap-1.5">
                         {ALLERGEN_OPTIONS.map(al => {
                           const isActive = (item.allergenTags || []).includes(al.id);
                           return (
                             <button
                               key={al.id}
                               type="button"
                               onClick={() => {
                                 const current = item.allergenTags || [];
                                 const updated = isActive ? current.filter(a => a !== al.id) : [...current, al.id];
                                 handleItemChange(item.id, 'allergenTags', updated);
                               }}
                               className={cn(
                                 'text-xs px-2 py-0.5 rounded-full border transition-colors',
                                 isActive
                                   ? 'bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-200'
                                   : 'bg-muted border-border text-muted-foreground hover:border-amber-300'
                               )}
                             >
                               {al.emoji} {al.label}
                             </button>
                           );
                         })}
                       </div>
                     </div>
                </CardHeader>
                 <CardContent className="p-0">
                    <Accordion type="single" collapsible defaultValue="ingredients">
                      <AccordionItem value="ingredients" className="border-none">
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">Ingredientes ({item.ingredients?.length || 0})</AccordionTrigger>
                        <AccordionContent>
                           <div className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg">
                              {item.ingredients?.map(ing => {
                                const otherProviders = ing.origenId
                                  ? catalogoInsumos.filter(c => c.id !== ing.origenId && c.nombre.toLowerCase() === ing.name.toLowerCase())
                                  : [];
                                const cheaperProvider = otherProviders.find(p => (p.valorUnitarioEstimado || 0) < ing.costoUnitario);
                                return (
                                <div key={ing.id} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-2 items-end p-2 border-b last:border-b-0">
                                    <div className="space-y-1 col-span-2 lg:col-span-3">
                                      <Label className="text-xs">Nombre</Label>
                                      <Input value={ing.name || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'name', e.target.value)} className="h-8 text-sm" disabled={!!ing.origenId}/>
                                      {cheaperProvider && (
                                        <p className="text-[10px] text-green-700 flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded"><AlertCircle className="w-3 h-3"/>Opción más barata: {formatCurrency(cheaperProvider.valorUnitarioEstimado)}/{cheaperProvider.unidad}</p>
                                      )}
                                    </div>
                                    <div className="space-y-1 col-span-1 lg:col-span-2"><Label className="text-xs">Cant. p/p</Label><Input value={ing.quantityPerPerson || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'quantityPerPerson', e.target.value)} className="h-8 text-sm" /></div>
                                    <div className="space-y-1 col-span-1 lg:col-span-1"><Label className="text-xs">Unidad</Label><Input value={ing.unit || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'unit', e.target.value)} className="h-8 text-sm" disabled={!!ing.origenId}/></div>
                                    <div className="space-y-1 col-span-1 lg:col-span-2 relative"><Label className="text-xs">Costo Unit.</Label><Input type="text" value={ing.costoUnitario || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'costoUnitario', e.target.value)} onBlur={() => handleIngredientBlur(item.id, ing, 'costoUnitario')} className="h-8 pl-6 text-sm"/><span className="absolute left-2 top-1/2 mt-1 text-muted-foreground">$</span></div>
                                    <div className="space-y-1 col-span-1 lg:col-span-2"><Label className="text-xs">Costo p/p</Label><p className="h-8 flex items-center font-medium text-sm">{formatCurrency(ing.costoTotalReceta)}</p></div>
                                    <div className="flex items-center justify-end col-span-2 lg:col-span-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteIngredient(item.id, ing.id)}><Trash2 className="w-3.5 h-3.5"/></Button></div>
                                </div>
                                );
                              })}
                              <div className="flex gap-2 mt-3"><Button type="button" size="sm" variant="outline" onClick={() => addIngredient(item.id)}><PlusCircle className="w-4 h-4 mr-1.5"/>Manual</Button><Button type="button" size="sm" variant="outline" onClick={() => openCatalogModal(item.id)}><BookOpen className="w-4 h-4 mr-1.5"/>Catálogo</Button></div>
                              {/* Gráfico de costos por ingrediente */}
                              {item.ingredients && item.ingredients.length > 0 && (item.totalDishCost || 0) > 0 && (
                                <div className="mt-4 pt-3 border-t space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Distribución de costos</p>
                                  {[...item.ingredients]
                                    .filter(ing => ing.costoTotalReceta > 0)
                                    .sort((a, b) => b.costoTotalReceta - a.costoTotalReceta)
                                    .map((ing, idx) => {
                                      const pct = item.totalDishCost > 0 ? (ing.costoTotalReceta / item.totalDishCost) * 100 : 0;
                                      const isMax = idx === 0;
                                      const color = INGREDIENT_COLORS[idx % INGREDIENT_COLORS.length];
                                      return (
                                        <div key={ing.id} className="space-y-0.5">
                                          <div className="flex justify-between text-xs">
                                            <span className={cn('truncate max-w-[60%]', isMax && 'font-semibold')}>{ing.name || 'Sin nombre'}{isMax && ' 🔝'}</span>
                                            <span className="text-muted-foreground">{pct.toFixed(1)}% · {formatCurrency(ing.costoTotalReceta)}</span>
                                          </div>
                                          <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                              className="h-2 rounded-full transition-all"
                                              style={{ width: `${pct}%`, backgroundColor: color }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })
                                  }
                                </div>
                              )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                 </CardContent>
                 <CardFooter className="p-0 pt-4 mt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/40">
                            <Label className="text-sm font-medium text-blue-800">Costo p/Persona (Calculado)</Label>
                            <p className="font-bold text-lg text-blue-700">{formatCurrency(item.totalDishCost || 0)}</p>
                            {(item.name.toUpperCase().includes('MESA BUFET') || item.name.toUpperCase().includes('MESA BUFFET')) && (
                                <p className="text-[9px] text-blue-600 mt-1 uppercase font-black tracking-tighter">Incluye ingredientes de Mesa fría</p>
                            )}
                        </div>
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
