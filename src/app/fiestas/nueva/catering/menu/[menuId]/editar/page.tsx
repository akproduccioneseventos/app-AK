
'use client';

import React, { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, AlertTriangle, CalendarIcon, Utensils, Sparkles, Search } from 'lucide-react';
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
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa } from '@/types/empresa';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Slider } from '@/components/ui/slider';


const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);


export default function EditarMenuEspecificoPage({ params: paramsProp }: { params: { menuId: string } }) {
  const params = React.use(paramsProp);
  const menuIdFromParams = params.menuId;

  const { toast } = useToast();
  const router = useRouter();
  const [menuData, setMenuData] = useState<FullMenu | null>(null);
  
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuTemplateType, setMenuTemplateType] = useState<FullMenu['templateType']>('Personalizado');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<MenuItem['type']>('');
  const [newItemAllergens, setNewItemAllergens] = useState('');
  
  const [currentDishIngredients, setCurrentDishIngredients] = useState<Ingredient[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantityPerPerson, setIngredientQuantityPerPerson] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientCost, setIngredientCost] = useState<string>('');
  const [ingredientProveedor, setIngredientProveedor] = useState('');
  const [ingredientMarca, setIngredientMarca] = useState('');
  const [ingredientFechaActualizacion, setIngredientFechaActualizacion] = useState<Date | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const [margenGanancia, setMargenGanancia] = useState(30);

  // States for ingredient catalog
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [selectedCatalogIngredient, setSelectedCatalogIngredient] = useState<ServicioEmpresa | null>(null);

  const loadMenuAndCatalog = useCallback(async (idToLoad: string) => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const [loadedMenu, servicios] = await Promise.all([
        getMenuById(idToLoad),
        getServiciosEmpresa()
      ]);

      const insumos = servicios.filter(s => s.tipoItem === 'Insumo/Ingrediente' || s.tipoItem === 'Bebida (Insumo)');
      setServiciosCatalogo(insumos);

      if (loadedMenu) {
        setMenuData(loadedMenu);
        setMenuName(loadedMenu.name);
        setMenuDescription(loadedMenu.description || '');
        setMenuTemplateType(loadedMenu.templateType || 'Personalizado');
        setMenuItems(loadedMenu.items.map(item => ({
          ...item,
          totalDishCost: item.totalDishCost || 0, 
          allergens: item.allergens || '',
          ingredients: item.ingredients.map(ing => ({
              ...ing,
              quantityPerPerson: ing.quantityPerPerson || '0',
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
      console.error("Error al cargar el menú o catálogo:", error);
      setNotFound(true);
      toast({ title: 'Error al Cargar Datos', description: 'No se pudo obtener el menú o el catálogo de insumos.', variant: 'destructive'});
    } finally {
      setIsLoading(false);
    }
  }, [toast]); 

  useEffect(() => {
    if (menuIdFromParams) {
      loadMenuAndCatalog(menuIdFromParams);
    }
  }, [menuIdFromParams, loadMenuAndCatalog]);
  
  const handleSelectIngredientFromCatalog = (insumo: ServicioEmpresa) => {
    setSelectedCatalogIngredient(insumo);
    setIngredientName(insumo.nombre);
    setIngredientUnit(insumo.unidad || '');
    setIngredientProveedor(insumo.contactoPrincipal || '');
    setIngredientQuantityPerPerson(''); // Clear quantity to force user input
    setIngredientCost(''); // Clear cost to be recalculated
    setIsCatalogModalOpen(false);
    toast({ description: `"${insumo.nombre}" seleccionado. Ingresa la cantidad por persona.`});
  };
  
  useEffect(() => {
    if (selectedCatalogIngredient && ingredientQuantityPerPerson) {
      const quantity = parseFloat(ingredientQuantityPerPerson);
      const unitCost = selectedCatalogIngredient.valorUnitarioEstimado || 0;
      if (!isNaN(quantity) && quantity >= 0) {
        const totalCost = unitCost * quantity;
        setIngredientCost(totalCost.toString());
      }
    }
  }, [ingredientQuantityPerPerson, selectedCatalogIngredient]);

  const filteredCatalog = useMemo(() => {
    return serviciosCatalogo.filter(s => s.nombre.toLowerCase().includes(catalogSearchTerm.toLowerCase()));
  }, [serviciosCatalogo, catalogSearchTerm]);

  const currentDishTotalCostPerPerson = useMemo(() => {
    return currentDishIngredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
  }, [currentDishIngredients]);

  const resetIngredientForm = () => {
    setIngredientName('');
    setIngredientQuantityPerPerson('');
    setIngredientUnit('');
    setIngredientCost('');
    setIngredientProveedor('');
    setIngredientMarca('');
    setIngredientFechaActualizacion(undefined);
    setSelectedCatalogIngredient(null);
  };

  const handleAddIngredientToCurrentDish = () => {
    if (!ingredientName || !ingredientQuantityPerPerson || !ingredientUnit || !ingredientCost) {
      toast({ title: 'Campos de ingrediente incompletos', description: 'Por favor, completa Nombre, Cantidad por Persona, Unidad y Costo del ingrediente.', variant: 'destructive' });
      return;
    }
    const costValue = parseFloat(ingredientCost);
    if (isNaN(costValue) || costValue < 0) {
      toast({ title: 'Costo Inválido', variant: 'destructive' });
      return;
    }
    const newIngredient: Ingredient = {
      id: `ing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: ingredientName, 
      quantityPerPerson: ingredientQuantityPerPerson,
      unit: ingredientUnit, 
      cost: costValue,
      proveedor: ingredientProveedor.trim() || undefined,
      marca: ingredientMarca.trim() || undefined,
      fecha_actualizacion: ingredientFechaActualizacion ? ingredientFechaActualizacion.toISOString() : undefined,
    };
    setCurrentDishIngredients(prev => [...prev, newIngredient]);
    resetIngredientForm();
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
    const totalDishCost = currentDishTotalCostPerPerson;

    const newDish: MenuItem = {
      id: `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newItemName, type: newItemType, ingredients: [...currentDishIngredients], 
      totalDishCost,
      allergens: newItemAllergens.trim() || undefined,
    };
    setMenuItems(prevItems => [...prevItems, newDish]);
    setNewItemName(''); setNewItemType(''); setNewItemAllergens(''); setCurrentDishIngredients([]);
    toast({ title: 'Plato Añadido al Menú' });
  };

  const handleRemoveDishFromMenu = (dishId: string) => {
    const itemToRemove = menuItems.find(item => item.id === dishId);
    setMenuItems(prevItems => prevItems.filter(item => item.id !== dishId));
    if (itemToRemove) toast({ title: 'Plato Eliminado del Menú' });
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
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
        allergens: item.allergens || undefined,
        ingredients: item.ingredients.map(ing => ({
            ...ing,
            quantityPerPerson: ing.quantityPerPerson || '0',
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

  const totalMenuCostPerPerson = useMemo(() => {
    return menuItems.reduce((sum, item) => sum + item.totalDishCost, 0);
  }, [menuItems]);

  const gananciaEstimadaPorPersona = useMemo(() => {
    return totalMenuCostPerPerson * (margenGanancia / 100);
  }, [totalMenuCostPerPerson, margenGanancia]);

  const precioSugeridoPorPersona = useMemo(() => {
    return totalMenuCostPerPerson + gananciaEstimadaPorPersona;
  }, [totalMenuCostPerPerson, gananciaEstimadaPorPersona]);

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>;
  if (notFound) return <div className="flex flex-col items-center justify-center h-screen text-center"><AlertTriangle className="w-16 h-16 text-destructive mb-4" /><h1 className="text-2xl font-bold mb-2">Menú no Encontrado</h1><p className="text-muted-foreground mb-6">ID: <span className="font-mono bg-muted px-1 rounded">{menuIdFromParams}</span></p><Link href="/fiestas/nueva/catering/modificar-menu" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Editando Menú: <span className="text-primary">{menuData?.name || menuIdFromParams}</span></h1>
        <Link href="/fiestas/nueva/catering/modificar-menu" passHref><Button variant="outline" disabled={isSaving || isDeleting}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

      <form onSubmit={handleSaveChanges}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Editar Menú</CardTitle>
            <CardDescription>Modifica los detalles, platos e ingredientes del menú. Para editar un plato existente, elimínalo de la lista y vuelve a añadirlo con los cambios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* === Section 1: Menu Details === */}
            <section>
              <h3 className="text-lg font-medium font-headline text-primary border-b pb-2 mb-4">1. Detalles del Menú</h3>
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="menu-name-edit" className="text-base">Nombre del Menú *</Label><Input id="menu-name-edit" value={menuName} onChange={(e) => setMenuName(e.target.value)} className="text-base p-3" disabled={isSaving || isDeleting} required/></div>
                <div className="space-y-2"><Label htmlFor="menu-description-edit" className="text-base">Descripción (Opcional)</Label><Input id="menu-description-edit" value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)} className="text-base p-3" disabled={isSaving || isDeleting}/></div>
                <div className="space-y-2">
                  <Label htmlFor="menu-template-type-edit" className="text-base">Tipo de Menú</Label>
                  <Select value={menuTemplateType} onValueChange={(value) => setMenuTemplateType(value as FullMenu['templateType'])} disabled={isSaving || isDeleting}>
                    <SelectTrigger id="menu-template-type-edit" className="text-base p-3 h-auto"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personalizado">Personalizado</SelectItem>
                      <SelectItem value="Menú de Entradas">Menú de Entradas</SelectItem>
                      <SelectItem value="Menú de Platos Principales">Menú de Platos Principales</SelectItem>
                      <SelectItem value="Menú para Adolescente">Menú para Adolescente</SelectItem>
                      <SelectItem value="Menú para Niños">Menú para Niños</SelectItem>
                      <SelectItem value="Menu del personal">Menu del personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
            
            <Separator />
            
             {/* === Calculation Section === */}
            <section>
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-primary">Cálculo de Precio por Persona</CardTitle>
                  <CardDescription>Ajusta el margen de ganancia para calcular el precio de venta sugerido de este menú.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><Label className="text-xs text-muted-foreground">Costo Ingredientes</Label><p className="font-bold text-lg">{formatCurrency(totalMenuCostPerPerson)}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Ganancia Estimada</Label><p className="font-bold text-lg text-blue-600">{formatCurrency(gananciaEstimadaPorPersona)}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Precio Venta Sugerido</Label><p className="font-bold text-lg text-green-600">{formatCurrency(precioSugeridoPorPersona)}</p></div>
                  </div>
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="margen-ganancia">Margen de Ganancia</Label>
                      <span className="px-2 py-1 text-sm font-medium rounded-md bg-primary/10 text-primary">{margenGanancia}%</span>
                    </div>
                    <Slider
                      id="margen-ganancia"
                      min={0}
                      max={200}
                      step={5}
                      value={[margenGanancia]}
                      onValueChange={(value) => setMargenGanancia(value[0])}
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* === Section 2: Dish List === */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium font-headline text-primary">2. Platos del Menú</h3>
              </div>
              {menuItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-md">
                  <Utensils className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50"/>
                  <p>Este menú aún no tiene platos.</p>
                </div>
              ) : (
                <ScrollArea className="h-auto max-h-[300px] pr-3">
                  <ul className="space-y-3">
                    {menuItems.map((item) => (
                      <li key={item.id} className="border rounded-md p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{item.name} <span className="text-xs text-muted-foreground">({item.type})</span></h4>
                            <p className="text-sm text-muted-foreground">Costo p/Persona: ${item.totalDishCost.toFixed(2)}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveDishFromMenu(item.id)} className="text-destructive hover:bg-destructive/10 h-7 w-7" aria-label={`Eliminar ${item.name}`}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </section>
            
            <Separator />

            {/* === Section 3: Add New Dish Form === */}
            <section className="p-4 border rounded-lg bg-muted/20">
              <h3 className="text-lg font-medium font-headline text-primary mb-4">3. Añadir Nuevo Plato</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="new-item-name-edit">Nombre del Plato *</Label><Input id="new-item-name-edit" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required disabled={isSaving || isDeleting} /></div>
                  <div className="space-y-2"><Label htmlFor="new-item-type-edit">Categoría *</Label><Select value={newItemType} onValueChange={(value) => setNewItemType(value as MenuItem['type'])} required disabled={isSaving || isDeleting}><SelectTrigger id="new-item-type-edit"><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="Entrada">Entrada</SelectItem><SelectItem value="Plato Principal">Plato Principal</SelectItem><SelectItem value="Postre">Postre</SelectItem><SelectItem value="Bebida">Bebida</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="new-item-allergens-edit">Alérgenos (separados por coma)</Label><Input id="new-item-allergens-edit" value={newItemAllergens} onChange={(e) => setNewItemAllergens(e.target.value)} disabled={isSaving || isDeleting}/></div>

                <div>
                   <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-medium">Ingredientes para "{newItemName || 'este Plato'}" (por persona)</h4>
                        <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="secondary" size="sm" disabled={isSaving}><Sparkles className="w-4 h-4 mr-1.5"/>Seleccionar del Catálogo</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Seleccionar Insumo del Catálogo</DialogTitle>
                                <DialogDescription>Busca y selecciona un ingrediente pre-cargado.</DialogDescription>
                            </DialogHeader>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                                <Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="pl-9"/>
                            </div>
                            <ScrollArea className="h-64 border rounded-md">
                                {filteredCatalog.length > 0 ? (
                                    <ul className="p-2 space-y-1">
                                    {filteredCatalog.map(insumo => (
                                        <li key={insumo.id}>
                                            <Button variant="ghost" className="w-full justify-start text-left h-auto py-1.5 px-2" onClick={() => handleSelectIngredientFromCatalog(insumo)}>
                                                <div>
                                                    <p className="font-medium text-sm">{insumo.nombre}</p>
                                                    <p className="text-xs text-muted-foreground">Un: {insumo.unidad} | Cat: {insumo.categoria}</p>
                                                </div>
                                            </Button>
                                        </li>
                                    ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground p-4">No se encontraron insumos.</p>
                                )}
                            </ScrollArea>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose>
                            </DialogFooter>
                        </DialogContent>
                        </Dialog>
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3 items-end">
                    <div className="space-y-1"><Label htmlFor="ing-name-edit" className="text-xs">Nombre Ing. *</Label><Input id="ing-name-edit" value={ingredientName} onChange={e => { setIngredientName(e.target.value); setSelectedCatalogIngredient(null); }} className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
                    <div className="space-y-1"><Label htmlFor="ing-qty-pp-edit" className="text-xs">Cant. p/Persona *</Label><Input id="ing-qty-pp-edit" value={ingredientQuantityPerPerson} onChange={e => setIngredientQuantityPerPerson(e.target.value)} placeholder="Ej: 100, 0.5" className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
                    <div className="space-y-1"><Label htmlFor="ing-unit-edit" className="text-xs">Unidad *</Label><Input id="ing-unit-edit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} placeholder="Ej: gr, ml, ud" className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
                    <div className="space-y-1"><Label htmlFor="ing-cost-edit" className="text-xs">Costo (de esa cant. p/p) *</Label><Input id="ing-cost-edit" type="number" value={ingredientCost} onChange={e => setIngredientCost(e.target.value)} className="text-sm p-2 h-9" step="any" disabled={isSaving || isDeleting || !!selectedCatalogIngredient}/></div>
                    <div className="space-y-1"><Label htmlFor="ing-proveedor-edit" className="text-xs">Proveedor</Label><Input id="ing-proveedor-edit" value={ingredientProveedor} onChange={e => setIngredientProveedor(e.target.value)} className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
                    <div className="space-y-1"><Label htmlFor="ing-marca-edit" className="text-xs">Marca</Label><Input id="ing-marca-edit" value={ingredientMarca} onChange={e => setIngredientMarca(e.target.value)} className="text-sm p-2 h-9" disabled={isSaving || isDeleting}/></div>
                    <div className="space-y-1 md:col-span-3"><Label htmlFor="ing-fecha-act-edit" className="text-xs">Fecha Actualización Precio</Label><DatePickerDemo selectedDate={ingredientFechaActualizacion} onDateChange={setIngredientFechaActualizacion} /></div>
                  </div>
                  <Button onClick={handleAddIngredientToCurrentDish} type="button" variant="outline" size="sm" disabled={isSaving || isDeleting}><PlusCircle className="w-4 h-4 mr-1.5" />Añadir Ingrediente</Button>
                  {currentDishIngredients.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h5 className="text-sm font-medium">Ingredientes para este plato:</h5>
                      <ScrollArea className="h-[120px] border rounded-md p-2 bg-background">
                        <ul className="text-sm">
                          {currentDishIngredients.map(ing => (
                            <li key={ing.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                              <div>{ing.name} ({ing.quantityPerPerson} {ing.unit}) - Costo: ${ing.cost.toFixed(2)}</div>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredientFromCurrentDish(ing.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10" disabled={isSaving || isDeleting}><Trash2 className="w-3 h-3" /></Button>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                      <p className="text-sm text-right font-medium">Costo Total Ingredientes (p/persona): ${currentDishTotalCostPerPerson.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                <div className="text-center pt-4">
                  <Button onClick={handleAddDishToMenu} type="button" size="lg" disabled={isSaving || isDeleting}><PlusCircle className="w-5 h-5 mr-2" />Añadir este Plato al Menú</Button>
                </div>
              </div>
            </section>
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSaving || isDeleting || !menuData}>
              <Save className="w-5 h-5 mr-2" />{isSaving ? 'Guardando...' : 'Guardar Cambios en Menú'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" size="lg" className="w-full sm:w-auto" disabled={isSaving || isDeleting || !menuData}>
                  <Trash2 className="w-5 h-5 mr-2" />{isDeleting ? 'Eliminando...' : 'Eliminar Menú'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>El menú "{menuData?.name}" será eliminado permanentemente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteMenu} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

    