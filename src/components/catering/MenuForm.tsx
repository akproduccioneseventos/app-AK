'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Loader2, Save, BookOpen, Search, Percent, DollarSign, Copy, ImageIcon, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveMenu, getMenus } from '@/app/actions/menus-catering';
import { getInsumos, saveInsumo } from '@/app/actions/insumos';
import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const ALLERGEN_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: 'gluten', label: 'Gluten', emoji: '🌾' },
  { id: 'lacteos', label: 'Lácteos', emoji: '🥛' },
  { id: 'huevo', label: 'Huevo', emoji: '🥚' },
  { id: 'frutos_secos', label: 'Frutos secos', emoji: '🥜' },
  { id: 'pescado', label: 'Pescado', emoji: '🐟' },
  { id: 'mariscos', label: 'Mariscos', emoji: '🦐' },
  { id: 'soja', label: 'Soja', emoji: '🫘' },
];

const DISH_TYPE_EMOJI: Record<string, string> = {
  'Entrada': '🥗',
  'Plato Principal': '🍽️',
  'Postre': '🍰',
  'Bebida': '🍹',
  'Menú Infantil': '🧒',
  'Menú Infantil/Adolescente': '🧒',
  '': '🍴',
};

const DISH_TYPE_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  'Entrada': { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' },
  'Plato Principal': { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700' },
  'Postre': { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700' },
  'Bebida': { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', text: 'text-cyan-700' },
  'Menú Infantil': { bg: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', text: 'text-pink-700' },
  'Menú Infantil/Adolescente': { bg: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', text: 'text-pink-700' },
};
const DEFAULT_COLORS = { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', text: 'text-slate-700' };

/** Returns the URL if it's a safe http/https URL, otherwise undefined */
const sanitizeImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {
    // invalid URL
  }
  return undefined;
};

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
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialLoad = useRef(true);
  const isHydratingExistingMenu = useRef(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

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
      isHydratingExistingMenu.current = true;
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
    setOpenItems(prev => {
      const next = new Set(prev);
      next.add(newItem.id);
      return next;
    });
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
      setOpenItems(current => {
        const next = new Set(current);
        next.add(duplicatedItem.id);
        return next;
      });
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
    setOpenItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
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
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const result = await saveMenu(menu as FullMenu);
      if (result.success) {
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
        toast({ title: '¡Menú Guardado!', description: `El menú "${menu.name}" ha sido guardado.` });
        router.push('/empresa/menus');
      } else throw new Error(result.error || 'Error desconocido');
    } catch (error: any) {
      setSaveStatus('error');
      toast({ title: 'Error al Guardar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const filteredInsumos = useMemo(() => {
    if (!catalogSearchTerm) return catalogoInsumos;
    return catalogoInsumos.filter(i => i.nombre.toLowerCase().includes(catalogSearchTerm.toLowerCase()));
  }, [catalogSearchTerm, catalogoInsumos]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (isHydratingExistingMenu.current) {
      isHydratingExistingMenu.current = false;
      return;
    }
    setHasUnsavedChanges(true);
    if (!menu.name?.trim()) return;

    setSaveStatus('saving');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      try {
        await saveMenu(menu as FullMenu);
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch {
        setSaveStatus('error');
      }
    }, 1500);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [menu]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const saveStatusLabel = saveStatus === 'saving'
    ? 'Guardando...'
    : saveStatus === 'saved' && !hasUnsavedChanges
      ? '✓ Guardado'
      : saveStatus === 'error'
        ? 'Error al guardar'
        : 'Cambios sin guardar';

  const saveStatusClass = saveStatus === 'saving'
    ? 'text-amber-600'
    : saveStatus === 'saved' && !hasUnsavedChanges
      ? 'text-emerald-600'
      : saveStatus === 'error'
        ? 'text-destructive'
        : 'text-slate-500';

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
      <Card className="rounded-3xl border-slate-200 shadow-xl">
        <CardHeader className="space-y-4 pb-2">
          <CardTitle className="text-2xl font-black text-slate-800">Información del Menú</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menu-name">Nombre del Menú</Label>
              <Input id="menu-name" value={menu.name || ''} onChange={(e) => handleMenuChange('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-description">Descripción</Label>
              <Textarea id="menu-description" rows={2} value={menu.description || ''} onChange={(e) => handleMenuChange('description', e.target.value)} placeholder="Describe el estilo y propuesta del menú..." />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle>Platos del Menú</CardTitle>
          <div className="rounded-2xl border border-slate-200 p-3 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center gap-3">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 font-bold">
              {menu.items?.length || 0} platos
            </Badge>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar plato..." value={dishSearchTerm} onChange={(e) => setDishSearchTerm(e.target.value)} className="pl-9 bg-white" />
            </div>
            <Button type="button" variant="secondary" onClick={addItem} className="rounded-xl shrink-0">
              <PlusCircle className="w-4 h-4 mr-2" />Añadir Plato
            </Button>
            <div className={cn('text-xs font-semibold flex items-center gap-2 shrink-0', saveStatusClass)}>
              {saveStatus === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saveStatusLabel}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedAndFilteredItems.map((item) => {
            const totalCost = item.totalDishCost || 0;
            const hasIngCosts = totalCost > 0 && (item.ingredients?.length || 0) > 0;
            const ingredientColors = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899','#84cc16','#6366f1'];
            const maxIngCost = hasIngCosts ? Math.max(...(item.ingredients || []).map(i => i.costoTotalReceta)) : 0;
            const colors = DISH_TYPE_COLORS[item.type || ''] || DEFAULT_COLORS;
            const isOpen = openItems.has(item.id);
            return (
              <div key={item.id} className={cn('rounded-3xl border-2 overflow-hidden transition-all duration-300 shadow-md bg-white', colors.border)}>
                <div
                  className={cn('p-5 cursor-pointer flex items-center justify-between gap-4 transition-colors hover:opacity-90 border-l-4', colors.bg, colors.border)}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="flex items-center gap-3 flex-grow min-w-0">
                    <span className="text-3xl">{DISH_TYPE_EMOJI[item.type || ''] || '🍴'}</span>
                    <div className="min-w-0">
                      <p className={cn('font-black text-lg truncate', colors.text)}>{item.name || 'Nuevo plato'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded-full', colors.badge)}>{item.type || 'Sin tipo'}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{item.ingredients?.length || 0} ingredientes</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Costo p/p</p>
                      <p className="font-black text-slate-700">{formatCurrency(item.totalDishCost || 0)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Precio venta</p>
                      <p className={cn('font-black', colors.text)}>{formatCurrency(item.suggestedSellingPrice || 0)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={(e) => { e.stopPropagation(); duplicateItem(item.id); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform duration-300', isOpen && 'rotate-180')} />
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="p-6 border-t border-slate-100 space-y-6 bg-white transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre Plato</Label>
                        <Input value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={item.type || ''} onValueChange={(value) => handleItemChange(item.id, 'type', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entrada">Entrada</SelectItem>
                            <SelectItem value="Plato Principal">Plato Principal</SelectItem>
                            <SelectItem value="Postre">Postre</SelectItem>
                            <SelectItem value="Bebida">Bebida</SelectItem>
                            <SelectItem value="Menú Infantil">Menú Infantil</SelectItem>
                            <SelectItem value="Menú Infantil/Adolescente">Menú Infantil/Adolescente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" />URL Foto del Plato</Label>
                        <Input
                          placeholder="https://... (Canva, Google, etc.)"
                          value={item.imageUrl || ''}
                          onChange={(e) => handleItemChange(item.id, 'imageUrl', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center justify-center sm:justify-start h-20 w-20 rounded-lg border bg-muted/40 overflow-hidden shrink-0">
                        {sanitizeImageUrl(item.imageUrl) ? (
                          <img src={sanitizeImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                        ) : (
                          <span className="text-3xl">{DISH_TYPE_EMOJI[item.type || ''] || '🍴'}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Alérgenos</Label>
                      <div className="flex flex-wrap gap-2">
                        {ALLERGEN_OPTIONS.map(allergen => (
                          <label key={allergen.id} className="flex items-center gap-1 cursor-pointer select-none">
                            <Checkbox
                              checked={(item.allergenTags || []).includes(allergen.id)}
                              onCheckedChange={(checked) => {
                                const current = item.allergenTags || [];
                                const updated = checked ? [...current, allergen.id] : current.filter(a => a !== allergen.id);
                                handleItemChange(item.id, 'allergenTags', updated);
                              }}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">{allergen.emoji} {allergen.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-muted/30 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Ingredientes ({item.ingredients?.length || 0})</p>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => addIngredient(item.id)}><PlusCircle className="w-4 h-4 mr-1.5" />Manual</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => openCatalogModal(item.id)}><BookOpen className="w-4 h-4 mr-1.5" />Catálogo</Button>
                        </div>
                      </div>

                      <TooltipProvider>
                        {item.ingredients?.map((ing, ingIdx) => {
                          const otherOptions = catalogoInsumos.filter(c =>
                            c.id !== ing.origenId &&
                            ing.name && c.nombre.toLowerCase().includes(ing.name.toLowerCase().split(' ')[0]) &&
                            (c.valorUnitarioEstimado || 0) < (ing.costoUnitario || 0) &&
                            (c.valorUnitarioEstimado || 0) > 0
                          );
                          const hasCheaperOption = otherOptions.length > 0;
                          return (
                            <div key={ing.id} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-2 items-end p-2 border-b last:border-b-0">
                              <div className="space-y-1 col-span-2 lg:col-span-3">
                                <Label className="text-xs">Nombre</Label>
                                <div className="relative">
                                  <Input value={ing.name || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'name', e.target.value)} className="h-8 text-sm" disabled={!!ing.origenId} />
                                  {hasCheaperOption && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="absolute right-1 top-1/2 -translate-y-1/2 cursor-help">
                                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-green-50 text-green-700 border-green-300 font-bold">↓ Más barato</Badge>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-48">
                                        <p className="text-xs font-bold">Opción más económica:</p>
                                        {otherOptions.slice(0, 3).map(o => (
                                          <p key={o.id} className="text-xs">{o.nombre} — ${o.valorUnitarioEstimado}/{o.unidad} {o.proveedor ? `(${o.proveedor})` : ''}</p>
                                        ))}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1 col-span-1 lg:col-span-2"><Label className="text-xs">Cant. p/p</Label><Input value={ing.quantityPerPerson || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'quantityPerPerson', e.target.value)} className="h-8 text-sm" /></div>
                              <div className="space-y-1 col-span-1 lg:col-span-1"><Label className="text-xs">Unidad</Label><Input value={ing.unit || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'unit', e.target.value)} className="h-8 text-sm" disabled={!!ing.origenId} /></div>
                              <div className="space-y-1 col-span-1 lg:col-span-2 relative"><Label className="text-xs">Costo Unit.</Label><Input type="text" value={ing.costoUnitario || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'costoUnitario', e.target.value)} onBlur={() => handleIngredientBlur(item.id, ing, 'costoUnitario')} className="h-8 pl-6 text-sm" /><span className="absolute left-2 top-1/2 mt-1 text-muted-foreground">$</span></div>
                              <div className="space-y-1 col-span-1 lg:col-span-2"><Label className="text-xs">Costo p/p</Label><p className="h-8 flex items-center font-medium text-sm">{formatCurrency(ing.costoTotalReceta)}</p></div>
                              <div className="flex items-center justify-end col-span-2 lg:col-span-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteIngredient(item.id, ing.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div>
                            </div>
                          );
                        })}
                      </TooltipProvider>

                      {hasIngCosts && (
                        <div className="mt-3 p-3 bg-white rounded-md border space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Distribución de costos</p>
                          {item.ingredients!.map((ing, ingIdx) => {
                            const pct = totalCost > 0 ? Math.round((ing.costoTotalReceta / totalCost) * 100) : 0;
                            if (pct === 0) return null;
                            const isMax = maxIngCost > 0 && ing.costoTotalReceta === maxIngCost;
                            return (
                              <div key={ing.id} className="space-y-0.5">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className={cn('font-medium truncate max-w-[60%]', isMax && 'font-bold text-orange-600')}>{ing.name || '—'}{isMax && ' ⭐'}</span>
                                  <span className="text-muted-foreground">{pct}% · {formatCurrency(ing.costoTotalReceta)}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: ingredientColors[ingIdx % ingredientColors.length] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <CardFooter className="p-0 pt-4 mt-2 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/40">
                          <Label className="text-sm font-medium text-blue-800">Costo p/Persona (Calculado)</Label>
                          <p className="font-bold text-lg text-blue-700">{formatCurrency(item.totalDishCost || 0)}</p>
                          {(item.name.toUpperCase().includes('MESA BUFET') || item.name.toUpperCase().includes('MESA BUFFET')) && (
                            <p className="text-[9px] text-blue-600 mt-1 uppercase font-black tracking-tighter">Incluye ingredientes de Mesa fría</p>
                          )}
                        </div>
                        <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/40 space-y-1"><Label className="text-sm font-medium text-green-800 flex items-center gap-1"><Percent className="w-4 h-4" />Margen (%)</Label><Input type="text" value={item.profitMargin?.toFixed(0) ?? ''} onChange={e => handleItemChange(item.id, 'profitMargin', e.target.value)} /></div>
                        <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/40 space-y-1"><Label className="text-sm font-medium text-green-800 flex items-center gap-1"><DollarSign className="w-4 h-4" />Precio Venta ($)</Label><Input type="text" value={item.suggestedSellingPrice?.toFixed(0) ?? ''} onChange={e => handleItemChange(item.id, 'suggestedSellingPrice', e.target.value)} /></div>
                      </div>
                    </CardFooter>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button type="submit" disabled={isSaving} size="lg">{isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}Guardar Menú</Button></div>
    </form>
  );
}
