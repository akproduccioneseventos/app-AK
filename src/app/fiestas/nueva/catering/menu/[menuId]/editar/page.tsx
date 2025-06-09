
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import type { Ingredient, MenuItem, FullMenu } from '@/types/catering';
import { getMenuById, saveMenu, deleteMenu as deleteMenuAction } from '@/app/actions/menus-catering';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditarMenuEspecificoPage({ params }: { params: { menuId: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const [menuData, setMenuData] = useState<FullMenu | null>(null);
  
  // Form state, initialized from menuData or empty
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<MenuItem['type']>('');
  
  const [currentDishIngredients, setCurrentDishIngredients] = useState<Ingredient[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientCost, setIngredientCost] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const loadedMenu = await getMenuById(params.menuId);
        if (loadedMenu) {
          setMenuData(loadedMenu);
          setMenuName(loadedMenu.name);
          setMenuDescription(loadedMenu.description || '');
          setMenuItems(loadedMenu.items.map(item => ({
            ...item,
            totalDishCost: item.ingredients.reduce((sum, ing) => sum + parseFloat(ing.cost || '0'), 0)
          })));
        } else {
          setNotFound(true);
          toast({
            title: 'Error',
            description: `No se encontró el menú con ID ${params.menuId}.`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error("Error al cargar el menú:", error);
        setNotFound(true); // Consider it not found on error as well
        toast({
          title: 'Error al Cargar Menú',
          description: 'No se pudo obtener el menú. Intenta de nuevo más tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    if (params.menuId) {
      loadMenu();
    }
  }, [params.menuId, toast]);

  const handleAddIngredientToCurrentDish = () => {
    if (!ingredientName || !ingredientQuantity || !ingredientUnit || !ingredientCost) {
      toast({ title: 'Campos de ingrediente incompletos', variant: 'destructive' });
      return;
    }
    const costValue = parseFloat(ingredientCost);
    if (isNaN(costValue) || costValue < 0) {
      toast({ title: 'Costo Inválido', variant: 'destructive' });
      return;
    }
    const newIngredient: Ingredient = {
      id: `ing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: ingredientName, quantity: ingredientQuantity, unit: ingredientUnit, cost: costValue.toFixed(2)
    };
    setCurrentDishIngredients(prev => [...prev, newIngredient]);
    setIngredientName(''); setIngredientQuantity(''); setIngredientUnit(''); setIngredientCost('');
  };

  const handleRemoveIngredientFromCurrentDish = (ingredientId: string) => {
    setCurrentDishIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
  };

  const handleAddDishToMenu = () => {
    if (!newItemName || !newItemType) {
      toast({ title: 'Datos del plato incompletos', variant: 'destructive' });
      return;
    }
    if (currentDishIngredients.length === 0) {
       toast({ title: 'Plato sin ingredientes', variant: 'destructive' });
       return;
    }
    const totalDishCost = currentDishIngredients.reduce((sum, ing) => sum + parseFloat(ing.cost || '0'), 0);
    const newDish: MenuItem = {
      id: `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newItemName, type: newItemType, ingredients: [...currentDishIngredients], totalDishCost
    };
    setMenuItems(prevItems => [...prevItems, newDish]);
    setNewItemName(''); setNewItemType(''); setCurrentDishIngredients([]);
    toast({ title: 'Plato Añadido al Menú' });
  };

  const handleRemoveDishFromMenu = (dishId: string) => {
    const itemToRemove = menuItems.find(item => item.id === dishId);
    setMenuItems(prevItems => prevItems.filter(item => item.id !== dishId));
    if (itemToRemove) toast({ title: 'Plato Eliminado del Menú' });
  };

  const handleSaveChanges = async () => {
    if (!menuName.trim()) {
        toast({ title: 'Nombre del Menú Requerido', variant: 'destructive' });
        return;
    }
    if (!menuData) {
        toast({ title: 'Error', description: 'No hay datos de menú cargados para guardar.', variant: 'destructive' });
        return;
    }
    
    setIsSaving(true);
    const updatedMenuData: FullMenu = {
      ...menuData, // Preserves original ID, createdAt
      name: menuName,
      description: menuDescription,
      items: menuItems,
      updatedAt: new Date().toISOString(), // Update the timestamp
    };

    try {
      const result = await saveMenu(updatedMenuData);
      if (result.success && result.menu) {
        toast({
          title: '¡Menú Actualizado!',
          description: `El menú "${result.menu.name}" ha sido actualizado con éxito.`,
        });
        setMenuData(result.menu); // Actualizar el estado local con los datos guardados (incluyendo updatedAt)
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el menú.");
      }
    } catch (error: any) {
      toast({
        title: 'Error al Actualizar Menú',
        description: error.message || 'Ocurrió un problema al intentar actualizar el menú.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!menuData) return;
    setIsDeleting(true);
    try {
      const result = await deleteMenuAction(menuData.id);
      if (result.success) {
        toast({
          title: '¡Menú Eliminado!',
          description: `El menú "${menuData.name}" ha sido eliminado.`,
        });
        router.push('/fiestas/nueva/catering/modificar-menu');
      } else {
        throw new Error(result.error || "Error desconocido al eliminar el menú.");
      }
    } catch (error: any) {
      toast({
        title: 'Error al Eliminar Menú',
        description: error.message || 'Ocurrió un problema al intentar eliminar el menú.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
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

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Menú no Encontrado</h1>
        <p className="text-muted-foreground mb-6">
          El menú con ID <span className="font-mono bg-muted px-1 rounded">{params.menuId}</span> no pudo ser encontrado.
        </p>
        <Link href="/fiestas/nueva/catering/modificar-menu" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Selección de Menús
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Editando Menú: <span className="text-primary">{menuData?.name || params.menuId}</span>
        </h1>
        <Link href="/fiestas/nueva/catering/modificar-menu" passHref>
          <Button variant="outline" disabled={isSaving || isDeleting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Selección de Menús
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Información General del Menú</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menu-name" className="text-base">Nombre del Menú</Label>
            <Input
              id="menu-name"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="Ej: Menú Primavera, Menú Fiesta Infantil"
              className="text-base p-3"
              disabled={isSaving || isDeleting}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="menu-description" className="text-base">Descripción Corta (Opcional)</Label>
            <Input
              id="menu-description"
              value={menuDescription}
              onChange={(e) => setMenuDescription(e.target.value)}
              placeholder="Ej: Deliciosa selección de platos para eventos especiales."
              className="text-base p-3"
              disabled={isSaving || isDeleting}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-item-name">Nombre del Plato</Label>
              <Input id="new-item-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Ej: Ensalada Caprese" disabled={isSaving || isDeleting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-item-type">Tipo de Plato</Label>
              <Select value={newItemType} onValueChange={(value) => setNewItemType(value as MenuItem['type'])} disabled={isSaving || isDeleting}>
                <SelectTrigger id="new-item-type"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
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
          <div>
            <h3 className="text-lg font-medium mb-3 font-headline">Ingredientes para "{newItemName || 'este Plato'}"</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3 items-end">
              <div className="space-y-1"><Label htmlFor="ingredient-name" className="text-xs">Nombre Ing.</Label><Input id="ingredient-name" value={ingredientName} onChange={e => setIngredientName(e.target.value)} placeholder="Ej: Tomate" className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1"><Label htmlFor="ingredient-qty" className="text-xs">Cantidad</Label><Input id="ingredient-qty" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} placeholder="Ej: 200" className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1"><Label htmlFor="ingredient-unit" className="text-xs">Unidad</Label><Input id="ingredient-unit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} placeholder="Ej: gr, ml, ud." className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1"><Label htmlFor="ingredient-cost" className="text-xs">Costo Total Ing.</Label><Input id="ingredient-cost" type="number" value={ingredientCost} onChange={e => setIngredientCost(e.target.value)} placeholder="Ej: 5.50" className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
            </div>
            <Button onClick={handleAddIngredientToCurrentDish} type="button" variant="outline" size="sm" disabled={isSaving || isDeleting}><PlusCircle className="w-4 h-4 mr-1.5" />Añadir Ingrediente</Button>
            {currentDishIngredients.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Ingredientes añadidos a este plato:</h4>
                <ScrollArea className="h-[100px] border rounded-md p-2 bg-muted/30">
                  <ul className="text-sm">
                    {currentDishIngredients.map(ing => (
                      <li key={ing.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                        <span>{ing.name} ({ing.quantity} {ing.unit}) - Costo: ${parseFloat(ing.cost).toFixed(2)}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredientFromCurrentDish(ing.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10" disabled={isSaving || isDeleting}><Trash2 className="w-3 h-3" /></Button>
                      </li>))}
                  </ul>
                </ScrollArea>
                <p className="text-sm text-right font-medium">Costo de este plato: ${currentDishIngredients.reduce((sum, ing) => sum + parseFloat(ing.cost || '0'), 0).toFixed(2)}</p>
              </div>)}
          </div>
          <Separator />
          <Button onClick={handleAddDishToMenu} type="button" size="lg" className="w-full sm:w-auto" disabled={isSaving || isDeleting}><PlusCircle className="w-5 h-5 mr-2" />Confirmar y Añadir Plato al Menú</Button>
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
                <p>Este menú aún no tiene ningún plato.</p><p className="text-sm">Comienza usando el formulario de arriba para añadir platos.</p>
                <Image src="https://placehold.co/400x200.png" alt="Formulario vacío" width={300} height={150} className="mt-4 rounded-md shadow-sm mx-auto opacity-70" data-ai-hint="empty form illustration"/>
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
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveDishFromMenu(item.id)} className="text-destructive hover:bg-destructive/10" aria-label={`Eliminar ${item.name}`} disabled={isSaving || isDeleting}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      {item.ingredients.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">INGREDIENTES:</h5>
                          <ul className="text-xs list-disc list-inside pl-2 space-y-0.5 bg-muted/20 p-2 rounded-sm">
                            {item.ingredients.map(ing => (<li key={ing.id}>{ing.name} ({ing.quantity} {ing.unit}) - Costo: ${parseFloat(ing.cost).toFixed(2)}</li>))}
                          </ul>
                        </div>)}
                    </li>))}
                </ul>
              </ScrollArea>)}
            {menuItems.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <p className="text-2xl font-bold text-right text-primary">COSTO TOTAL DEL MENÚ: ${totalMenuCost.toFixed(2)}</p>
                </div>)}
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button onClick={handleSaveChanges} size="lg" className="w-full sm:w-auto" disabled={isSaving || isDeleting || !menuData}>
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Guardando Cambios...' : 'Guardar Cambios en el Menú'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg" className="w-full sm:w-auto" disabled={isSaving || isDeleting || !menuData}>
                {isDeleting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                {isDeleting ? 'Eliminando...' : 'Eliminar Menú'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que querés eliminar este menú?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El menú "{menuData?.name || 'seleccionado'}" será eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMenu} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sí, eliminar menú
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
