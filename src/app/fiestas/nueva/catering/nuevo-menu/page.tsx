
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

interface Ingredient {
  id: string;
  name: string;
  quantity: string; // Keep as string for form input, parse on calculation
  unit: string;
  cost: string; // Keep as string for form input, parse on calculation
}

interface MenuItem {
  id: string;
  name: string;
  type: 'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | '';
  ingredients: Ingredient[];
  totalDishCost: number;
}

export default function NuevoMenuPersonalizadoPage() {
  const { toast } = useToast();
  const [menuName, setMenuName] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // For the "Add Item" (Dish) form
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | ''>('');
  
  // For ingredients of the current dish being added
  const [currentDishIngredients, setCurrentDishIngredients] = useState<Ingredient[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientCost, setIngredientCost] = useState('');

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
      id: Date.now().toString(),
      name: ingredientName,
      quantity: ingredientQuantity,
      unit: ingredientUnit,
      cost: ingredientCost,
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

    const totalDishCost = currentDishIngredients.reduce((sum, ing) => sum + parseFloat(ing.cost || '0'), 0);

    const newDish: MenuItem = {
      id: Date.now().toString(),
      name: newItemName,
      type: newItemType,
      ingredients: [...currentDishIngredients],
      totalDishCost: totalDishCost,
    };
    setMenuItems(prevItems => [...prevItems, newDish]);
    
    // Reset form
    setNewItemName('');
    setNewItemType('');
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

  const handleSaveMenu = () => {
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
    // Simulate saving
    console.log('Guardando Menú:', { menuName, menuItems });
    toast({
      title: 'Menú Guardado (Simulación)',
      description: `El menú "${menuName}" con ${menuItems.length} plato(s) ha sido guardado. Los detalles de ingredientes también están incluidos.`,
    });
  };

  const totalMenuCost = menuItems.reduce((sum, item) => sum + item.totalDishCost, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Crear Nuevo Menú Personalizado
        </h1>
        <Link href="/fiestas/nueva/catering" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Catering
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Información General del Menú</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="menu-name" className="text-base">Nombre del Menú</Label>
            <Input
              id="menu-name"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="Ej: Menú Primavera, Menú Fiesta Infantil"
              className="text-base p-3"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Plato al Menú</CardTitle>
          <CardDescription>Define el nombre, tipo y los ingredientes de cada plato.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dish Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-item-name">Nombre del Plato</Label>
              <Input
                id="new-item-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Ej: Ensalada Caprese"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-item-type">Tipo de Plato</Label>
              <Select value={newItemType} onValueChange={(value) => setNewItemType(value as MenuItem['type'])}>
                <SelectTrigger id="new-item-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Plato Principal">Plato Principal</SelectItem>
                  <SelectItem value="Postre">Postre</SelectItem>
                  <SelectItem value="Bebida">Bebida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Ingredients for the current dish */}
          <div>
            <h3 className="text-lg font-medium mb-3 font-headline">Ingredientes para "{newItemName || 'este Plato'}"</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="ingredient-name" className="text-xs">Nombre Ing.</Label>
                <Input id="ingredient-name" value={ingredientName} onChange={e => setIngredientName(e.target.value)} placeholder="Ej: Tomate" className="text-sm p-2 h-9"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ingredient-qty" className="text-xs">Cantidad</Label>
                <Input id="ingredient-qty" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} placeholder="Ej: 200" className="text-sm p-2 h-9"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ingredient-unit" className="text-xs">Unidad</Label>
                <Input id="ingredient-unit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} placeholder="Ej: gr, ml, ud." className="text-sm p-2 h-9"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ingredient-cost" className="text-xs">Costo Total Ing.</Label>
                <Input id="ingredient-cost" type="number" value={ingredientCost} onChange={e => setIngredientCost(e.target.value)} placeholder="Ej: 5.50" className="text-sm p-2 h-9"/>
              </div>
            </div>
            <Button onClick={handleAddIngredientToCurrentDish} type="button" variant="outline" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Añadir Ingrediente
            </Button>

            {currentDishIngredients.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Ingredientes añadidos a este plato:</h4>
                <ScrollArea className="h-[100px] border rounded-md p-2 bg-muted/30">
                  <ul className="text-sm">
                    {currentDishIngredients.map(ing => (
                      <li key={ing.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                        <span>{ing.name} ({ing.quantity} {ing.unit}) - Costo: ${parseFloat(ing.cost).toFixed(2)}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredientFromCurrentDish(ing.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                 <p className="text-sm text-right font-medium">
                    Costo de este plato: $
                    {currentDishIngredients.reduce((sum, ing) => sum + parseFloat(ing.cost || '0'), 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          
          <Separator />
          
          <Button onClick={handleAddDishToMenu} type="button" size="lg" className="w-full sm:w-auto">
            <PlusCircle className="w-5 h-5 mr-2" />
            Confirmar y Añadir Plato al Menú
          </Button>
        </CardContent>
      </Card>
      

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Platos en "{menuName || 'Nuevo Menú'}"</CardTitle>
            <CardDescription>Lista de platos y sus ingredientes que componen este menú.</CardDescription>
        </CardHeader>
        <CardContent>
            {menuItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-md">
                <p>Aún no has añadido ningún plato a este menú.</p>
                <p className="text-sm">Comienza usando el formulario de arriba.</p>
                <Image 
                  src="https://placehold.co/400x200.png" 
                  alt="Formulario vacío" 
                  width={300}
                  height={150}
                  className="mt-4 rounded-md shadow-sm mx-auto opacity-70"
                  data-ai-hint="empty form illustration"
                />
              </div>
            ) : (
              <ScrollArea className="h-auto max-h-[500px] pr-3">
                <ul className="space-y-4">
                  {menuItems.map((item) => (
                    <li key={item.id} className="border rounded-md p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-lg text-primary">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.type} - Costo Plato: ${item.totalDishCost.toFixed(2)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDishFromMenu(item.id)}
                          className="text-destructive hover:bg-destructive/10"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {item.ingredients.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">INGREDIENTES:</h5>
                          <ul className="text-xs list-disc list-inside pl-2 space-y-0.5 bg-muted/20 p-2 rounded-sm">
                            {item.ingredients.map(ing => (
                              <li key={ing.id}>
                                {ing.name} ({ing.quantity} {ing.unit}) - Costo: ${parseFloat(ing.cost).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
            {menuItems.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <p className="text-2xl font-bold text-right text-primary">
                        COSTO TOTAL DEL MENÚ: ${totalMenuCost.toFixed(2)}
                    </p>
                </div>
            )}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button onClick={handleSaveMenu} size="lg" className="w-full sm:w-auto">
            <Save className="w-5 h-5 mr-2" />
            Guardar Menú Completo (Simulación)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

