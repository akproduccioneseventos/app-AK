
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveMenu } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';

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

  useEffect(() => {
    if (existingMenu) {
      setMenu(existingMenu);
    }
  }, [existingMenu]);

  const handleMenuChange = (field: keyof FullMenu, value: string) => {
    setMenu(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (itemId: string, field: keyof MenuItem, value: any) => {
    setMenu(prev => ({
      ...prev,
      items: (prev.items || []).map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };
  
  const handleIngredientChange = (itemId: string, ingId: string, field: keyof Ingredient, value: any) => {
    setMenu(prev => ({
        ...prev,
        items: (prev.items || []).map(item => {
            if (item.id === itemId) {
                const newIngredients = (item.ingredients || []).map(ing => {
                    if (ing.id === ingId) {
                        const updatedIng = { ...ing, [field]: value };
                        if (field === 'quantityPerPerson' || field === 'cost') {
                             // This is a simplified cost update logic.
                             // A more robust solution might need to re-evaluate the total.
                        }
                        return updatedIng;
                    }
                    return ing;
                });
                 const totalDishCost = newIngredients.reduce((sum, ing) => sum + (Number(ing.cost) || 0), 0);
                return { ...item, ingredients: newIngredients, totalDishCost };
            }
            return item;
        }),
    }));
  };
  
  const addItem = () => {
    const newItem: MenuItem = {
      id: `new_item_${Date.now()}`,
      name: '',
      type: '',
      ingredients: [],
      totalDishCost: 0,
    };
    setMenu(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
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
        item.id === itemId ? { ...item, ingredients: [...(item.ingredients || []), newIngredient] } : item
      ),
    }));
  }

  const deleteItem = (itemId: string) => {
    setMenu(prev => ({ ...prev, items: (prev.items || []).filter(item => item.id !== itemId) }));
  };
  
  const deleteIngredient = (itemId: string, ingId: string) => {
    setMenu(prev => ({
        ...prev,
        items: (prev.items || []).map(item =>
         item.id === itemId ? { ...item, ingredients: (item.ingredients || []).filter(ing => ing.id !== ingId) } : item
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
    try {
      const result = await saveMenu(menu as FullMenu);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <Card key={item.id} className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex justify-end mb-2">
                   <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor={`item-name-${item.id}`}>Nombre Plato</Label><Input id={`item-name-${item.id}`} value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor={`item-type-${item.id}`}>Tipo</Label><Select value={item.type || ''} onValueChange={(value) => handleItemChange(item.id, 'type', value)}><SelectTrigger id={`item-type-${item.id}`}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Entrada">Entrada</SelectItem><SelectItem value="Plato Principal">Plato Principal</SelectItem><SelectItem value="Postre">Postre</SelectItem><SelectItem value="Bebida">Bebida</SelectItem><SelectItem value="Menú Infantil">Menú Infantil</SelectItem></SelectContent></Select></div>
                 </div>
                 <div className="mt-4 space-y-2">
                     <Label className="text-sm font-medium">Ingredientes</Label>
                     <div className="space-y-3">
                     {item.ingredients?.map(ing => (
                        <div key={ing.id} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end p-3 border-l-4 border-primary/50 rounded-r-md bg-background shadow-sm">
                            <div className="space-y-1 lg:col-span-2"><Label className="text-xs">Nombre</Label><Input value={ing.name} onChange={e => handleIngredientChange(item.id, ing.id, 'name', e.target.value)} className="h-8"/></div>
                            <div className="space-y-1"><Label className="text-xs">Cant. p/p</Label><Input value={ing.quantityPerPerson} onChange={e => handleIngredientChange(item.id, ing.id, 'quantityPerPerson', e.target.value)} className="h-8"/></div>
                            <div className="space-y-1"><Label className="text-xs">Unidad</Label><Input value={ing.unit} onChange={e => handleIngredientChange(item.id, ing.id, 'unit', e.target.value)} className="h-8"/></div>
                            <div className="space-y-1"><Label className="text-xs">Proveedor</Label><Input value={ing.proveedor || ''} onChange={e => handleIngredientChange(item.id, ing.id, 'proveedor', e.target.value)} className="h-8"/></div>
                            <div className="space-y-1"><Label className="text-xs">Costo ($)</Label><Input type="number" value={ing.cost} onChange={e => handleIngredientChange(item.id, ing.id, 'cost', Number(e.target.value))} className="h-8"/></div>
                            <div className="lg:col-span-5 flex justify-end">
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteIngredient(item.id, ing.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                            </div>
                        </div>
                     ))}
                     </div>
                     <Button type="button" size="sm" variant="outline" onClick={() => addIngredient(item.id)}>+ Añadir Ingrediente</Button>
                 </div>
                 <p className="text-right text-sm font-semibold mt-2">Costo Plato p/Persona: {formatCurrency(item.totalDishCost)}</p>
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
