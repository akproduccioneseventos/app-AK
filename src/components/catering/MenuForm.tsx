
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Loader2, Save, BookOpen, Search, Percent, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveMenu } from '@/app/actions/menus-catering';
import { getInsumos } from '@/app/actions/insumos';
import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (amount: number) => {
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

  const calculatePrices = (item: MenuItem): MenuItem => {
    const totalDishCost = (item.ingredients || []).reduce((sum, ing) => sum + (Number(ing.cost) || 0), 0);
    const profitMargin = item.profitMargin === undefined || isNaN(item.profitMargin) ? 100 : item.profitMargin;
    const suggestedSellingPrice = totalDishCost * (1 + profitMargin / 100);
    return { ...item, totalDishCost, suggestedSellingPrice, profitMargin };
  };

  useEffect(() => {
    if (existingMenu) {
      const menuWithCalculatedPrices = {
        ...existingMenu,
        items: (existingMenu.items || []).map(calculatePrices)
      };
      setMenu(menuWithCalculatedPrices);
    }
    const fetchInsumos = async () => {
      try {
        const insumos = await getInsumos();
        setCatalogoInsumos(insumos.filter(i => i.tipoItem === 'Insumo/Ingrediente' || i.tipoItem === 'Bebida (Insumo)'));
      } catch (e) {
        toast({ title: "Error", description: "No se pudo cargar el catálogo de insumos."});
      }
    };
    fetchInsumos();
  }, [existingMenu, toast]);

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
    setMenu(prev => ({
        ...prev,
        items: (prev.items || []).map(item => {
            if (item.id === itemId) {
                const newIngredients = (item.ingredients || []).map(ing => 
                    ing.id === ingId ? { ...ing, [field]: value, origenId: undefined } : ing // Unlink from catalog if manually edited
                );
                return calculatePrices({ ...item, ingredients: newIngredients });
            }
            return item;
        }),
    }));
  };
  
  const addItem = () => {
    const newItem: MenuItem = {
      id: `new_item_${Date.now()}`,
      name: '',
      type: 'Entrada',
      ingredients: [],
      totalDishCost: 0,
      profitMargin: 120, // Default profit margin
      suggestedSellingPrice: 0,
    };
    setMenu(prev => ({ ...prev, items: [...(prev.items || []), calculatePrices(newItem)] }));
  };
  
  const addIngredient = (itemId: string) => {
    const newIngredient: Ingredient = {
        id: `new_ing_${Date.now()}`,
        name: '',
        quantityPerPerson: '0',
        unit: 'g',
        cost: 0,
    };
     setMenu(prev => ({
      ...prev,
      items: (prev.items || []).map(item =>
        item.id === itemId ? calculatePrices({ ...item, ingredients: [...(item.ingredients || []), newIngredient] }) : item
      ),
    }));
  }

  const addIngredientFromCatalog = (itemId: string, insumo: ServicioEmpresa) => {
      const newIngredient: Ingredient = {
        id: `new_ing_${Date.now()}_${insumo.id}`,
        origenId: insumo.id, // Link to catalog
        name: insumo.nombre,
        quantityPerPerson: '1',
        unit: insumo.unidad || 'Unidad',
        cost: insumo.valorUnitarioEstimado || 0,
        proveedor: insumo.proveedor || '', 
      };
      setMenu(prev => ({
      ...prev,
      items: (prev.items || []).map(item =>
        item.id === itemId ? calculatePrices({ ...item, ingredients: [...(item.ingredients || []), newIngredient] }) : item
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

    // Sync costs before saving
    const menuToSave = { ...menu };
    if (menuToSave.items) {
      menuToSave.items = menuToSave.items.map(item => {
        const syncedIngredients = (item.ingredients || []).map(ing => {
          if (ing.origenId) {
            const catalogItem = catalogoInsumos.find(ci => ci.id === ing.origenId);
            if (catalogItem) {
              return { ...ing, cost: catalogItem.valorUnitarioEstimado || 0, name: catalogItem.nombre, unit: catalogItem.unidad || ing.unit };
            }
          }
          return ing;
        });
        return calculatePrices({ ...item, ingredients: syncedIngredients });
      });
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
            <DialogHeader>
                <DialogTitle>Seleccionar Ingrediente del Catálogo</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="pl-9"/>
                </div>
                <ScrollArea className="h-72 border rounded-md">
                    {filteredInsumos.length > 0 ? (
                        <ul className="p-2 space-y-1">
                            {filteredInsumos.map(insumo => (
                                <li key={insumo.id}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start text-left h-auto"
                                        onClick={() => {
                                            if (currentItemIdForCatalog) {
                                                addIngredientFromCatalog(currentItemIdForCatalog, insumo);
                                            }
                                        }}
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{insumo.nombre}</p>
                                            <p className="text-xs text-muted-foreground">{formatCurrency(insumo.valorUnitarioEstimado || 0)} / {insumo.unidad}</p>
                                        </div>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="p-4 text-sm text-center text-muted-foreground">No se encontraron insumos.</p>}
                </ScrollArea>
            </div>
        </DialogContent>
       </Dialog>
      <Card>
        <CardHeader>
          <CardTitle>Información del Menú</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menu-name">Nombre del Menú</Label>
            <Input id="menu-name" value={menu.name || ''} onChange={(e) => handleMenuChange('name', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-description">Descripción</Label>
            <Textarea id="menu-description" value={menu.description || ''} onChange={(e) => handleMenuChange('description', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platos del Menú</CardTitle>
          <CardDescription>Añade o edita los platos que componen este menú.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(menu.items || []).map((item) => (
            <Card key={item.id} className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
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
                    <Label className="text-sm font-medium">Ingredientes</Label>
                    <div className="mt-2 space-y-3">
                        {item.ingredients?.map(ing => (
                            <div key={ing.id} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end p-3 border-l-4 border-primary/50 rounded-r-md bg-background shadow-sm">
                                <div className="space-y-1 lg:col-span-2"><Label className="text-xs">Nombre</Label><Input value={ing.name || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'name', e.target.value)} className="h-8"/></div>
                                <div className="space-y-1"><Label className="text-xs">Cant. p/p</Label><Input value={ing.quantityPerPerson || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'quantityPerPerson', e.target.value)} className="h-8"/></div>
                                <div className="space-y-1"><Label className="text-xs">Unidad</Label><Input value={ing.unit || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'unit', e.target.value)} className="h-8"/></div>
                                <div className="space-y-1"><Label className="text-xs">Costo ($)</Label><Input type="number" value={ing.cost || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'cost', Number(e.target.value))} className="h-8"/></div>
                                <div className="lg:col-span-5 flex justify-end">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteIngredient(item.id, ing.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="flex gap-2 mt-3">
                        <Button type="button" size="sm" variant="outline" onClick={() => addIngredient(item.id)}><PlusCircle className="w-4 h-4 mr-1.5"/>Añadir Ingrediente</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => openCatalogModal(item.id)}><BookOpen className="w-4 h-4 mr-1.5"/>Seleccionar del Catálogo</Button>
                     </div>
                 </CardContent>
                 <CardFooter className="p-0 pt-4 mt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">Costo p/Persona</Label>
                            <p className="font-semibold text-lg">{formatCurrency(item.totalDishCost || 0)}</p>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`profit-${item.id}`} className="text-sm flex items-center gap-1"><Percent className="w-3 h-3"/>Margen (%)</Label>
                            <Input id={`profit-${item.id}`} type="number" value={item.profitMargin?.toFixed(0) ?? ''} onChange={e => handleItemChange(item.id, 'profitMargin', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                             <Label htmlFor={`price-${item.id}`} className="text-sm flex items-center gap-1"><DollarSign className="w-3 h-3"/>Precio ($)</Label>
                             <Input id={`price-${item.id}`} type="number" value={item.suggestedSellingPrice?.toFixed(0) ?? ''} onChange={e => handleItemChange(item.id, 'suggestedSellingPrice', parseFloat(e.target.value))} />
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
          {isSaving ? 'Guardando...' : (existingMenu ? 'Guardar Cambios' : 'Crear Menú')}
        </Button>
      </div>
    </form>
  );
}
