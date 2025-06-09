
'use client';

import { useState, useEffect } from 'react';
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

// Interfaces (pueden moverse a un archivo de tipos más adelante)
interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  cost: string; // Se parseará a float para cálculos
}

interface MenuItem { // Representa un Plato
  id: string;
  name: string;
  type: 'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | '';
  ingredients: Ingredient[];
  totalDishCost: number;
}

interface FullMenu { // Representa un Menú completo guardado
  id: string; // ej: 'menu1', 'menu2'
  name: string; // ej: 'Menú Clásico Casamiento'
  description: string; // Descripción general del menú
  items: MenuItem[]; // Lista de platos
}

// Base de datos simulada de menús
const mockMenuDatabase: FullMenu[] = [
  {
    id: 'menu1',
    name: 'Menú Clásico Casamiento',
    description: 'Entrada, principal y postre tradicionales.',
    items: [
      {
        id: 'dish1-1',
        name: 'Empanadas Criollas (x Docena)',
        type: 'Entrada',
        ingredients: [
          { id: 'ing1-1-1', name: 'Tapas de Empanada', quantity: '12', unit: 'un.', cost: '300.00' },
          { id: 'ing1-1-2', name: 'Carne Picada Especial', quantity: '500', unit: 'gr', cost: '1200.00' },
          { id: 'ing1-1-3', name: 'Cebolla Grande', quantity: '2', unit: 'un.', cost: '200.00' },
          { id: 'ing1-1-4', name: 'Condimentos Varios', quantity: '1', unit: 'lote', cost: '150.00' },
        ],
        totalDishCost: 1850.00,
      },
      {
        id: 'dish1-2',
        name: 'Lomo Strogonoff con Papas Noisette',
        type: 'Plato Principal',
        ingredients: [
          { id: 'ing1-2-1', name: 'Lomo Fresco', quantity: '1', unit: 'kg', cost: '7500.00' },
          { id: 'ing1-2-2', name: 'Papas Noisette Congeladas', quantity: '1', unit: 'kg', cost: '1500.00' },
          { id: 'ing1-2-3', name: 'Crema de Leche', quantity: '500', unit: 'ml', cost: '800.00' },
          { id: 'ing1-2-4', name: 'Champiñones Frescos', quantity: '300', unit: 'gr', cost: '900.00' },
        ],
        totalDishCost: 10700.00,
      },
       {
        id: 'dish1-3',
        name: 'Tiramisú Casero',
        type: 'Postre',
        ingredients: [
          { id: 'ing1-3-1', name: 'Queso Mascarpone', quantity: '500', unit: 'gr', cost: '2500.00' },
          { id: 'ing1-3-2', name: 'Vainillas', quantity: '1', unit: 'paquete', cost: '500.00' },
        ],
        totalDishCost: 3000.00,
      },
    ],
  },
  {
    id: 'menu2',
    name: 'Menú Cumpleaños Infantil',
    description: 'Opciones divertidas y adaptadas para niños.',
    items: [
      {
        id: 'dish2-1',
        name: 'Mini Pizzas Muzzarella',
        type: 'Plato Principal',
        ingredients: [{ id: 'ing2-1-1', name: 'Prepizzas', quantity: '20', unit: 'un.', cost: '2000.00' }, {id: 'ing2-1-2', name: 'Muzzarella', quantity: '1', unit: 'kg', cost: '3000.00'}],
        totalDishCost: 5000.00,
      },
    ],
  },
  // Añade más menús según los IDs de mockSavedMenus si es necesario
  { id: 'menu3', name: 'Menú Degustación Gourmet', description: 'Pequeñas porciones de alta cocina.', items: [] },
  { id: 'menu_vegetariano_boda', name: 'Menú Vegetariano Boda de Lujo', description: 'Alta cocina vegetariana para eventos especiales.', items: [] },
  { id: 'menu_brunch_corporativo', name: 'Brunch Corporativo Energizante', description: 'Opciones ligeras y nutritivas para reuniones de trabajo.', items: [] },
];


export default function EditarMenuEspecificoPage({ params }: { params: { menuId: string } }) {
  const { toast } = useToast();
  const [menuName, setMenuName] = useState('');
  const [originalMenuName, setOriginalMenuName] = useState(''); // Para el título
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // Platos del menú
  const [isLoading, setIsLoading] = useState(true);
  
  // Para el formulario de "Añadir Plato"
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | ''>('');
  
  // Para los ingredientes del plato que se está añadiendo/editando
  const [currentDishIngredients, setCurrentDishIngredients] = useState<Ingredient[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientCost, setIngredientCost] = useState('');

  useEffect(() => {
    setIsLoading(true);
    // Simular carga de datos del menú
    const menuToLoad = mockMenuDatabase.find(menu => menu.id === params.menuId);
    if (menuToLoad) {
      setMenuName(menuToLoad.name);
      setOriginalMenuName(menuToLoad.name); // Guardar el nombre original para el título
      setMenuItems(menuToLoad.items.map(item => ({ // Asegurar que totalDishCost esté calculado
        ...item,
        totalDishCost: item.ingredients.reduce((sum, ing) => sum + parseFloat(ing.cost || '0'), 0)
      })));
    } else {
      toast({
        title: 'Error',
        description: `No se encontró el menú con ID ${params.menuId}. Redirigiendo...`,
        variant: 'destructive',
      });
      // Idealmente, redirigir aquí si el menú no existe.
      // router.push('/fiestas/nueva/catering/modificar-menu');
    }
    setIsLoading(false);
  }, [params.menuId, toast]);


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
            description: `El plato "${itemToRemove.name}" ha sido eliminado de este menú.`,
        });
    }
  };

  const handleSaveChanges = () => {
    if (!menuName.trim()) {
        toast({
            title: 'Nombre del Menú Requerido',
            description: 'Por favor, asigna un nombre a tu menú.',
            variant: 'destructive',
        });
        return;
    }
    if (menuItems.length === 0 && !confirm("El menú no tiene platos. ¿Deseas guardarlo vacío de todas formas?")) {
        toast({
            title: 'Menú Vacío',
            description: 'El menú no ha sido guardado ya que no contiene platos.',
            variant: 'default',
        });
        return;
    }
    // Simular guardado
    console.log('Guardando cambios del Menú:', { id: params.menuId, menuName, menuItems });
    toast({
      title: 'Cambios Guardados (Simulación)',
      description: `Los cambios en el menú "${menuName}" han sido guardados.`,
    });
    setOriginalMenuName(menuName); // Actualizar el título si el nombre cambió
  };

  const totalMenuCost = menuItems.reduce((sum, item) => sum + item.totalDishCost, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="ml-4 text-xl">Cargando datos del menú...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Editando Menú: <span className="text-primary">{originalMenuName || params.menuId}</span>
        </h1>
        <Link href="/fiestas/nueva/catering/modificar-menu" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Selección de Menús
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
          <CardTitle className="font-headline text-xl">Añadir/Modificar Plato al Menú</CardTitle>
          <CardDescription>Define el nombre, tipo y los ingredientes de cada plato. Para modificar un plato existente, elimínalo de la lista de abajo y vuelve a añadirlo con los cambios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Detalles del Plato */}
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

          {/* Ingredientes para el plato actual */}
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
            <CardTitle className="font-headline text-xl">Platos en "{menuName || 'Menú Actual'}"</CardTitle>
            <CardDescription>Lista de platos y sus ingredientes que componen este menú. Puedes eliminar platos de aquí.</CardDescription>
        </CardHeader>
        <CardContent>
            {menuItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-md">
                <p>Este menú aún no tiene ningún plato.</p>
                <p className="text-sm">Comienza usando el formulario de arriba para añadir platos.</p>
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
          <Button onClick={handleSaveChanges} size="lg" className="w-full sm:w-auto">
            <Save className="w-5 h-5 mr-2" />
            Guardar Cambios en el Menú (Simulación)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
