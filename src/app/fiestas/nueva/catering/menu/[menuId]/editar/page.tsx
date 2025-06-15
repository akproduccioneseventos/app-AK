
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, AlertTriangle, CalendarIcon } from 'lucide-react';
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
import { DatePickerDemo } from '@/components/date-picker-demo';

export default function EditarMenuEspecificoPage({ params: paramsProp }: { params: Promise<{ menuId: string }> }) {
  const params = React.use(paramsProp); // Use React.use to unwrap the params Promise
  const { toast } = useToast();
  const router = useRouter();
  const [menuData, setMenuData] = useState<FullMenu | null>(null);
  
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuTemplateType, setMenuTemplateType] = useState<FullMenu['templateType']>('Personalizado');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<MenuItem['type']>('');
  const [newItemBasePortions, setNewItemBasePortions] = useState<number | undefined>(1);
  const [newItemAllergens, setNewItemAllergens] = useState('');
  
  const [currentDishIngredients, setCurrentDishIngredients] = useState<Ingredient[]>([]);
  // Ingredient form state
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientCost, setIngredientCost] = useState<string>('');
  const [ingredientProveedor, setIngredientProveedor] = useState('');
  const [ingredientMarca, setIngredientMarca] = useState('');
  const [ingredientFechaActualizacion, setIngredientFechaActualizacion] = useState<Date | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadMenu = useCallback(async (idToLoad: string) => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const loadedMenu = await getMenuById(idToLoad);
      if (loadedMenu) {
        setMenuData(loadedMenu);
        setMenuName(loadedMenu.name);
        setMenuDescription(loadedMenu.description || '');
        setMenuTemplateType(loadedMenu.templateType || 'Personalizado');
        setMenuItems(loadedMenu.items.map(item => ({
          ...item,
          totalDishCost: item.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0),
          costPerPortion: (item.basePortions && item.basePortions > 0 && item.ingredients.length > 0)
                            ? item.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0) / item.basePortions
                            : undefined,
          allergens: item.allergens || '',
          ingredients: item.ingredients.map(ing => ({
              ...ing,
              proveedor: ing.proveedor || undefined,
              marca: ing.marca || undefined,
              fecha_actualizacion: ing.fecha_actualizacion ? new Date(ing.fecha_actualizacion).toISOString() : undefined,
          }))
        })));
      } else {
        setNotFound(true);
        toast({ title: 'Error', description: `No se encontró el menú con ID ${idToLoad}.`, variant: 'destructive'});
      }
    } catch (error) {
      console.error("Error al cargar el menú:", error);
      setNotFound(true);
      toast({ title: 'Error al Cargar Menú', description: 'No se pudo obtener el menú.', variant: 'destructive'});
    } finally {
      setIsLoading(false);
    }
  }, [toast]); 

  useEffect(() => {
    if (params.menuId) {
      loadMenu(params.menuId);
    }
  }, [params.menuId, loadMenu]);

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
      name: ingredientName, quantity: ingredientQuantity, unit: ingredientUnit, cost: costValue,
      proveedor: ingredientProveedor || undefined,
      marca: ingredientMarca || undefined,
      fecha_actualizacion: ingredientFechaActualizacion ? ingredientFechaActualizacion.toISOString() : undefined,
    };
    setCurrentDishIngredients(prev => [...prev, newIngredient]);
    setIngredientName(''); setIngredientQuantity(''); setIngredientUnit(''); setIngredientCost('');
    setIngredientProveedor(''); setIngredientMarca(''); setIngredientFechaActualizacion(undefined);
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
    const totalDishCost = currentDishTotalCost;
    const costPerPortionCalc = (newItemBasePortions && newItemBasePortions > 0 && totalDishCost > 0) 
                               ? totalDishCost / newItemBasePortions 
                               : undefined;
    const newDish: MenuItem = {
      id: `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newItemName, type: newItemType, ingredients: [...currentDishIngredients], 
      totalDishCost, basePortions: newItemBasePortions, costPerPortion: costPerPortionCalc,
      allergens: newItemAllergens.trim() || undefined,
    };
    setMenuItems(prevItems => [...prevItems, newDish]);
    setNewItemName(''); setNewItemType(''); setNewItemBasePortions(1); setNewItemAllergens(''); setCurrentDishIngredients([]);
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
        toast({ title: 'Error', description: 'No hay datos de menú cargados.', variant: 'destructive' });
        return;
    }
    setIsSaving(true);
    const updatedMenuData: FullMenu = {
      ...menuData,
      name: menuName,
      description: menuDescription,
      templateType: menuTemplateType,
      items: menuItems.map(item => ({
        ...item,
        totalDishCost: item.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0),
        costPerPortion: (item.basePortions && item.basePortions > 0 && item.ingredients.length > 0)
                          ? item.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0) / item.basePortions
                          : undefined,
        allergens: item.allergens || undefined,
        ingredients: item.ingredients.map(ing => ({
            ...ing,
            proveedor: ing.proveedor || undefined,
            marca: ing.marca || undefined,
            fecha_actualizacion: ing.fecha_actualizacion ? new Date(ing.fecha_actualizacion).toISOString() : undefined,
        }))
      })),
      updatedAt: new Date().toISOString(),
    };
    try {
      const result = await saveMenu(updatedMenuData);
      if (result.success && result.menu) {
        toast({ title: '¡Menú Actualizado!', description: `El menú "${result.menu.name}" ha sido actualizado.`});
        setMenuData(result.menu); 
        setMenuItems(result.menu.items);
      } else {
        throw new Error(result.error || "Error desconocido al actualizar.");
      }
    } catch (error: any) {
      toast({ title: 'Error al Actualizar Menú', description: error.message, variant: 'destructive'});
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
        toast({ title: '¡Menú Eliminado!', description: `El menú "${menuData.name}" ha sido eliminado.`});
        router.push('/fiestas/nueva/catering/modificar-menu');
      } else {
        throw new Error(result.error || "Error desconocido al eliminar.");
      }
    } catch (error: any) {
      toast({ title: 'Error al Eliminar Menú', description: error.message, variant: 'destructive'});
    } finally {
      setIsDeleting(false);
    }
  };

  const totalMenuCost = menuItems.reduce((sum, item) => sum + item.totalDishCost, 0);

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>;
  if (notFound) return <div className="flex flex-col items-center justify-center h-screen text-center"><AlertTriangle className="w-16 h-16 text-destructive mb-4" /><h1 className="text-2xl font-bold mb-2">Menú no Encontrado</h1><p className="text-muted-foreground mb-6">ID: <span className="font-mono bg-muted px-1 rounded">{params.menuId}</span></p><Link href="/fiestas/nueva/catering/modificar-menu" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Editando Menú: <span className="text-primary">{menuData?.name || params.menuId}</span></h1>
        <Link href="/fiestas/nueva/catering/modificar-menu" passHref><Button variant="outline" disabled={isSaving || isDeleting}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader><CardTitle className="font-headline text-xl">Información General del Menú</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="menu-name-edit" className="text-base">Nombre del Menú *</Label><Input id="menu-name-edit" value={menuName} onChange={(e) => setMenuName(e.target.value)} className="text-base p-3" disabled={isSaving || isDeleting} required/></div>
          <div className="space-y-2"><Label htmlFor="menu-description-edit" className="text-base">Descripción (Opcional)</Label><Input id="menu-description-edit" value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)} className="text-base p-3" disabled={isSaving || isDeleting}/></div>
          <div className="space-y-2"><Label htmlFor="menu-template-type-edit" className="text-base">Tipo de Plantilla</Label><Select value={menuTemplateType} onValueChange={(value) => setMenuTemplateType(value as FullMenu['templateType'])} disabled={isSaving || isDeleting}><SelectTrigger id="menu-template-type-edit" className="text-base p-3 h-auto"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Personalizado">Personalizado</SelectItem><SelectItem value="Económico">Económico</SelectItem><SelectItem value="Premium">Premium</SelectItem><SelectItem value="Infantil">Infantil</SelectItem></SelectContent></Select></div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader><CardTitle className="font-headline text-xl">Añadir/Modificar Plato al Menú</CardTitle><CardDescription>Define nombre, categoría, porciones e ingredientes. Para modificar, elimina y vuelve a añadir.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="new-item-name-edit">Nombre del Plato *</Label><Input id="new-item-name-edit" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required disabled={isSaving || isDeleting} /></div>
            <div className="space-y-2"><Label htmlFor="new-item-type-edit">Categoría *</Label><Select value={newItemType} onValueChange={(value) => setNewItemType(value as MenuItem['type'])} required disabled={isSaving || isDeleting}><SelectTrigger id="new-item-type-edit"><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="Entrada">Entrada</SelectItem><SelectItem value="Plato Principal">Plato Principal</SelectItem><SelectItem value="Postre">Postre</SelectItem><SelectItem value="Bebida">Bebida</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="new-item-portions-edit">Rinde (porciones base)</Label><Input id="new-item-portions-edit" type="number" value={newItemBasePortions ?? ''} onChange={(e) => setNewItemBasePortions(e.target.value ? parseInt(e.target.value) : undefined)} min="1" disabled={isSaving || isDeleting}/></div>
            <div className="space-y-2"><Label htmlFor="new-item-allergens-edit">Alérgenos (separados por coma)</Label><Input id="new-item-allergens-edit" value={newItemAllergens} onChange={(e) => setNewItemAllergens(e.target.value)} disabled={isSaving || isDeleting}/></div>
          </div>
          {newItemBasePortions && newItemBasePortions > 0 && currentDishTotalCost > 0 && (<p className="text-sm font-medium text-muted-foreground">Costo por Porción Estimado: ${(currentDishTotalCost / newItemBasePortions).toFixed(2)}</p>)}

          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-3 font-headline">Ingredientes para "{newItemName || 'este Plato'}"</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3 items-end">
              <div className="space-y-1"><Label htmlFor="ing-name-edit" className="text-xs">Nombre Ing. *</Label><Input id="ing-name-edit" value={ingredientName} onChange={e => setIngredientName(e.target.value)} className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1"><Label htmlFor="ing-qty-edit" className="text-xs">Cantidad *</Label><Input id="ing-qty-edit" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1"><Label htmlFor="ing-unit-edit" className="text-xs">Unidad *</Label><Input id="ing-unit-edit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1"><Label htmlFor="ing-cost-edit" className="text-xs">Costo Unidad Ing. *</Label><Input id="ing-cost-edit" type="number" value={ingredientCost} onChange={e => setIngredientCost(e.target.value)} className="text-sm p-2 h-9" step="any" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1"><Label htmlFor="ing-proveedor-edit" className="text-xs">Proveedor</Label><Input id="ing-proveedor-edit" value={ingredientProveedor} onChange={e => setIngredientProveedor(e.target.value)} className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1"><Label htmlFor="ing-marca-edit" className="text-xs">Marca</Label><Input id="ing-marca-edit" value={ingredientMarca} onChange={e => setIngredientMarca(e.target.value)} className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
              <div className="space-y-1 md:col-span-3"><Label htmlFor="ing-fecha-act-edit" className="text-xs">Fecha Actualización Precio</Label><DatePickerDemo selectedDate={ingredientFechaActualizacion} onDateChange={setIngredientFechaActualizacion} /></div>
            </div>
            <Button onClick={handleAddIngredientToCurrentDish} type="button" variant="outline" size="sm" disabled={isSaving || isDeleting}><PlusCircle className="w-4 h-4 mr-1.5" />Añadir Ingrediente</Button>
            {currentDishIngredients.length > 0 && (<div className="mt-4 space-y-2"><h4 className="text-sm font-medium">Ingredientes añadidos:</h4><ScrollArea className="h-[120px] border rounded-md p-2 bg-muted/30"><ul className="text-sm">{currentDishIngredients.map(ing => (<li key={ing.id} className="flex justify-between items-center py-1 border-b last:border-b-0"><span>{ing.name} ({ing.quantity} {ing.unit}) - Costo: ${ing.cost.toFixed(2)}</span><Button variant="ghost" size="icon" onClick={() => handleRemoveIngredientFromCurrentDish(ing.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10" disabled={isSaving || isDeleting}><Trash2 className="w-3 h-3" /></Button></li>))}</ul></ScrollArea><p className="text-sm text-right font-medium">Costo Total Ingredientes Plato: ${currentDishTotalCost.toFixed(2)}</p></div>)}
          </div>
          <Separator />
          <Button onClick={handleAddDishToMenu} type="button" size="lg" className="w-full sm:w-auto" disabled={isSaving || isDeleting}><PlusCircle className="w-5 h-5 mr-2" />Confirmar y Añadir Plato al Menú</Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="font-headline text-xl">Platos en "{menuName || 'Menú Actual'}"</CardTitle><CardDescription>Costo total menú: ${totalMenuCost.toFixed(2)}</CardDescription></CardHeader>
        <CardContent>
            {menuItems.length === 0 ? (<div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-md"><p>Este menú aún no tiene platos.</p><Image src="https://placehold.co/400x200.png" alt="Formulario vacío" width={300} height={150} className="mt-4 rounded-md shadow-sm mx-auto opacity-70" data-ai-hint="empty menu food"/></div>
            ) : (<ScrollArea className="h-auto max-h-[500px] pr-3"><ul className="space-y-4">{menuItems.map((item) => (<li key={item.id} className="border rounded-md p-4 hover:shadow-md transition-shadow"><div className="flex items-start justify-between mb-2"><div><h4 className="font-semibold text-lg text-primary">{item.name} <span className="text-xs text-muted-foreground">({item.type})</span></h4><p className="text-sm text-muted-foreground">Costo Plato: ${item.totalDishCost.toFixed(2)}{item.basePortions && item.costPerPortion !== undefined ? ` (Rinde ${item.basePortions} porc. / $${item.costPerPortion.toFixed(2)} c/u)` : ''}</p>{item.allergens && <p className="text-xs text-destructive/80">Alérgenos: {item.allergens}</p>}</div><Button variant="ghost" size="icon" onClick={() => handleRemoveDishFromMenu(item.id)} className="text-destructive hover:bg-destructive/10" aria-label={`Eliminar ${item.name}`} disabled={isSaving || isDeleting}><Trash2 className="w-4 h-4" /></Button></div>{item.ingredients.length > 0 && (<div><h5 className="text-xs font-medium text-muted-foreground mb-1">INGREDIENTES:</h5><ul className="text-xs list-disc list-inside pl-2 space-y-0.5 bg-muted/20 p-2 rounded-sm">{item.ingredients.map(ing => (<li key={ing.id}>{ing.name} ({ing.quantity} {ing.unit}) - Costo: ${ing.cost.toFixed(2)}{ing.proveedor ? ` Prov: ${ing.proveedor}`:''}{ing.marca ? ` Marca: ${ing.marca}`:''}{ing.fecha_actualizacion ? ` Act: ${new Date(ing.fecha_actualizacion).toLocaleDateString()}`:''}</li>))}</ul></div>)}</li>))}</ul></ScrollArea>)}
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3"><Button onClick={handleSaveChanges} size="lg" className="w-full sm:w-auto" disabled={isSaving || isDeleting || !menuData}><Save className="w-5 h-5 mr-2" />{isSaving ? 'Guardando...' : 'Guardar Cambios en Menú'}</Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="lg" className="w-full sm:w-auto" disabled={isSaving || isDeleting || !menuData}><Trash2 className="w-5 h-5 mr-2" />{isDeleting ? 'Eliminando...' : 'Eliminar Menú'}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>El menú "{menuData?.name}" será eliminado permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteMenu} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Sí, eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

