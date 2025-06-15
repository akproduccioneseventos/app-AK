
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import type { Ingredient, MenuItem, NewMenuFormData, FullMenu } from '@/types/catering';
import { saveMenu } from '@/app/actions/menus-catering';

export default function NuevoMenuPersonalizadoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuTemplateType, setMenuTemplateType] = useState<FullMenu['templateType']>('Personalizado');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<MenuItem['type']>('');
  const [newItemBasePortions, setNewItemBasePortions] = useState<number | undefined>(1);
  const [newItemAllergens, setNewItemAllergens] = useState('');
  
  const [currentDishIngredients, setCurrentDishIngredients] = useState<Ingredient[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientCost, setIngredientCost] = useState<string>(''); // Mantener como string para input, convertir a number al guardar

  const [isSaving, setIsSaving] = useState(false);

  const currentDishTotalCost = useMemo(() => {
    return currentDishIngredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
  }, [currentDishIngredients]);

  const currentItemCostPerPortion = useMemo(() => {
    if (newItemBasePortions && newItemBasePortions > 0 && currentDishTotalCost > 0) {
      return currentDishTotalCost / newItemBasePortions;
    }
    return 0;
  }, [currentDishTotalCost, newItemBasePortions]);

  const handleAddIngredientToCurrentDish = () => {
    if (!ingredientName || !ingredientQuantity || !ingredientUnit || !ingredientCost) {
      toast({
        title: 'Campos de ingrediente incompletos',
        description: 'Por favor, completa todos los datos del ingrediente.',
        variant: 'destructive',
      });
      return;
    }
    const costValue = parseFloat(ingredientCost);
    if (isNaN(costValue) || costValue < 0) {
      toast({
        title: 'Costo Inválido',
        description: 'El costo del ingrediente debe ser un número positivo.',
        variant: 'destructive',
      });
      return;
    }

    const newIngredient: Ingredient = {
      id: `ing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: ingredientName,
      quantity: ingredientQuantity,
      unit: ingredientUnit,
      cost: costValue, // Guardar como número
    };
    setCurrentDishIngredients(prev => [...prev, newIngredient]);
    setIngredientName('');
    setIngredientQuantity('');
    setIngredientUnit('');
    setIngredientCost('');
  };

  const handleRemoveIngredientFromCurrentDish = (ingredientId: string) => {
    setCurrentDishIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
  };

  const handleAddDishToMenu = () => {
    if (!newItemName || !newItemType) {
      toast({
        title: 'Datos del plato incompletos',
        description: 'Por favor, ingresa el nombre y tipo del plato.',
        variant: 'destructive',
      });
      return;
    }
    if (currentDishIngredients.length === 0) {
       toast({
        title: 'Plato sin ingredientes',
        description: 'Por favor, añade al menos un ingrediente al plato.',
        variant: 'destructive',
      });
      return;
    }

    const totalDishCost = currentDishTotalCost;
    const costPerPortionCalc = (newItemBasePortions && newItemBasePortions > 0 && totalDishCost > 0) 
                               ? totalDishCost / newItemBasePortions 
                               : undefined;

    const newDish: MenuItem = {
      id: `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newItemName,
      type: newItemType,
      ingredients: [...currentDishIngredients],
      totalDishCost: totalDishCost,
      basePortions: newItemBasePortions,
      costPerPortion: costPerPortionCalc,
      allergens: newItemAllergens.trim() || undefined,
    };
    setMenuItems(prevItems => [...prevItems, newDish]);
    
    setNewItemName('');
    setNewItemType('');
    setNewItemBasePortions(1);
    setNewItemAllergens('');
    setCurrentDishIngredients([]);
    setIngredientName('');
    setIngredientQuantity('');
    setIngredientUnit('');
    setIngredientCost('');

    toast({
      title: 'Plato Añadido al Menú',
      description: `${newDish.name} (${newDish.type}) con ${newDish.ingredients.length} ingrediente(s) fue añadido.`,
    });
  };

  const handleRemoveDishFromMenu = (dishId: string) => {
    const itemToRemove = menuItems.find(item => item.id === dishId);
    setMenuItems(prevItems => prevItems.filter(item => item.id !== dishId));
    if (itemToRemove) {
        toast({
            title: 'Plato Eliminado del Menú',
            description: `El plato "${itemToRemove.name}" ha sido eliminado del menú.`,
        });
    }
  };

  const handleSaveFullMenu = async () => {
    if (!menuName.trim()) {
        toast({
            title: 'Nombre del Menú Requerido',
            description: 'Por favor, asigna un nombre a tu menú.',
            variant: 'destructive',
        });
        return;
    }
    if (menuItems.length === 0) {
        toast({
            title: 'Menú Vacío',
            description: 'Añade al menos un plato al menú antes de guardar.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSaving(true);
    const menuToSave: NewMenuFormData = {
      name: menuName,
      description: menuDescription || `Menú ${menuTemplateType || 'Personalizado'} creado el ${new Date().toLocaleDateString()}`,
      items: menuItems,
      templateType: menuTemplateType,
    };

    try {
      const result = await saveMenu(menuToSave);
      if (result.success && result.id) {
        toast({
          title: '¡Menú Guardado!',
          description: `El menú "${menuToSave.name}" ha sido guardado con éxito con ID: ${result.id}.`,
        });
        router.push('/fiestas/nueva/catering/modificar-menu'); 
      } else {
        throw new Error(result.error || "Error desconocido al guardar el menú.");
      }
    } catch (error: any) {
      toast({
        title: 'Error al Guardar Menú',
        description: error.message || 'Ocurrió un problema al intentar guardar el menú.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalMenuCost = menuItems.reduce((sum, item) => sum + item.totalDishCost, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Crear Nuevo Menú Personalizado
        </h1>
        <Link href="/fiestas/nueva/catering" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Catering
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Información General del Menú</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menu-name" className="text-base">Nombre del Menú *</Label>
            <Input id="menu-name" value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Ej: Menú Casamiento de Lujo" className="text-base p-3" required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-description" className="text-base">Descripción Corta (Opcional)</Label>
            <Input id="menu-description" value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)} placeholder="Ej: Deliciosa selección de platos para eventos especiales." className="text-base p-3"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-template-type" className="text-base">Tipo de Plantilla de Menú</Label>
            <Select value={menuTemplateType} onValueChange={(value) => setMenuTemplateType(value as FullMenu['templateType'])}>
              <SelectTrigger id="menu-template-type" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar tipo de plantilla" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Personalizado">Personalizado</SelectItem>
                <SelectItem value="Económico">Económico</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Infantil">Infantil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Plato al Menú</CardTitle>
          <CardDescription>Define el nombre, categoría, porciones, alérgenos e ingredientes de cada plato.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-item-name">Nombre del Plato *</Label>
              <Input id="new-item-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Ej: Ensalada Caprese" required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-item-type">Categoría del Plato *</Label>
              <Select value={newItemType} onValueChange={(value) => setNewItemType(value as MenuItem['type'])} required>
                <SelectTrigger id="new-item-type"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Plato Principal">Plato Principal</SelectItem>
                  <SelectItem value="Postre">Postre</SelectItem>
                  <SelectItem value="Bebida">Bebida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-item-portions">Rinde para (porciones base)</Label>
              <Input id="new-item-portions" type="number" value={newItemBasePortions ?? ''} onChange={(e) => setNewItemBasePortions(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Ej: 10" min="1"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-item-allergens">Alérgenos (separados por coma)</Label>
              <Input id="new-item-allergens" value={newItemAllergens} onChange={(e) => setNewItemAllergens(e.target.value)} placeholder="Ej: Gluten, Lácteos, Frutos secos"/>
            </div>
          </div>
           {newItemBasePortions && newItemBasePortions > 0 && currentDishTotalCost > 0 && (
            <p className="text-sm font-medium text-muted-foreground">Costo por Porción Estimado: ${(currentDishTotalCost / newItemBasePortions).toFixed(2)}</p>
          )}

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-3 font-headline">Ingredientes para "{newItemName || 'este Plato'}"</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3 items-end">
              <div className="space-y-1"><Label htmlFor="ingredient-name" className="text-xs">Nombre Ing. *</Label><Input id="ingredient-name" value={ingredientName} onChange={e => setIngredientName(e.target.value)} placeholder="Ej: Tomate" className="text-sm p-2 h-9"/></div>
              <div className="space-y-1"><Label htmlFor="ingredient-qty" className="text-xs">Cantidad *</Label><Input id="ingredient-qty" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} placeholder="Ej: 200" className="text-sm p-2 h-9"/></div>
              <div className="space-y-1"><Label htmlFor="ingredient-unit" className="text-xs">Unidad *</Label><Input id="ingredient-unit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} placeholder="Ej: gr, ml, ud." className="text-sm p-2 h-9"/></div>
              <div className="space-y-1"><Label htmlFor="ingredient-cost" className="text-xs">Costo Ing. *</Label><Input id="ingredient-cost" type="number" value={ingredientCost} onChange={e => setIngredientCost(e.target.value)} placeholder="Ej: 5.50" className="text-sm p-2 h-9" step="any"/></div>
            </div>
            <Button onClick={handleAddIngredientToCurrentDish} type="button" variant="outline" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />Añadir Ingrediente
            </Button>

            {currentDishIngredients.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Ingredientes añadidos a este plato:</h4>
                <ScrollArea className="h-[100px] border rounded-md p-2 bg-muted/30">
                  <ul className="text-sm">
                    {currentDishIngredients.map(ing => (
                      <li key={ing.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                        <span>{ing.name} ({ing.quantity} {ing.unit}) - Costo: ${ing.cost.toFixed(2)}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredientFromCurrentDish(ing.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                 <p className="text-sm text-right font-medium">Costo Total de Ingredientes: ${currentDishTotalCost.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          <Separator />
          
          <Button onClick={handleAddDishToMenu} type="button" size="lg" className="w-full sm:w-auto">
            <PlusCircle className="w-5 h-5 mr-2" />Confirmar y Añadir Plato al Menú
          </Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Platos en "{menuName || 'Nuevo Menú'}"</CardTitle>
            <CardDescription>Lista de platos que componen este menú. Costo total: ${totalMenuCost.toFixed(2)}</CardDescription>
        </CardHeader>
        <CardContent>
            {menuItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-md">
                <p>Aún no has añadido ningún plato a este menú.</p>
                <Image src="https://placehold.co/400x200.png" alt="Formulario vacío" width={300} height={150} className="mt-4 rounded-md shadow-sm mx-auto opacity-70" data-ai-hint="empty menu food"/>
              </div>
            ) : (
              <ScrollArea className="h-auto max-h-[500px] pr-3">
                <ul className="space-y-4">
                  {menuItems.map((item) => (
                    <li key={item.id} className="border rounded-md p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-lg text-primary">{item.name} <span className="text-xs text-muted-foreground">({item.type})</span></h4>
                          <p className="text-sm text-muted-foreground">Costo Plato: ${item.totalDishCost.toFixed(2)}
                            {item.basePortions && item.costPerPortion !== undefined ? ` (Rinde ${item.basePortions} porc. / $${item.costPerPortion.toFixed(2)} c/u)` : ''}
                          </p>
                          {item.allergens && <p className="text-xs text-destructive/80">Alérgenos: {item.allergens}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveDishFromMenu(item.id)} className="text-destructive hover:bg-destructive/10" aria-label={`Eliminar ${item.name}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {item.ingredients.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">INGREDIENTES:</h5>
                          <ul className="text-xs list-disc list-inside pl-2 space-y-0.5 bg-muted/20 p-2 rounded-sm">
                            {item.ingredients.map(ing => (<li key={ing.id}>{ing.name} ({ing.quantity} {ing.unit}) - Costo: ${ing.cost.toFixed(2)}</li>))}
                          </ul>
                        </div>)}
                    </li>))}
                </ul>
              </ScrollArea>)}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button onClick={handleSaveFullMenu} size="lg" className="w-full sm:w-auto" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Guardando Menú...' : 'Guardar Menú Completo'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
