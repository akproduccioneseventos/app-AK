
'use client';

import { useState, useMemo, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, CalendarIcon, Utensils, Info, Sparkles, Search } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import type { Ingredient, MenuItem, NewMenuFormData, FullMenu } from '@/types/catering';
import { saveMenu } from '@/app/actions/menus-catering';
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

export default function NuevoMenuPersonalizadoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuTemplateType, setMenuTemplateType] = useState<FullMenu['templateType']>('Personalizado');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<MenuItem['type']>('');
  const [newItemAllergens, setNewItemAllergens] = useState('');
  
  const [currentDishIngredients, setCurrentDishIngredients] = useState<Ingredient[]>([]);
  // Ingredient form state
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantityPerPerson, setIngredientQuantityPerPerson] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientCost, setIngredientCost] = useState<string>('');
  const [ingredientProveedor, setIngredientProveedor] = useState('');
  const [ingredientMarca, setIngredientMarca] = useState('');
  const [ingredientFechaActualizacion, setIngredientFechaActualizacion] = useState<Date | undefined>(undefined);

  const [isSaving, setIsSaving] = useState(false);
  const [margenGanancia, setMargenGanancia] = useState(30);

  // States for ingredient catalog
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [selectedCatalogIngredient, setSelectedCatalogIngredient] = useState<ServicioEmpresa | null>(null);

  useEffect(() => {
    async function loadCatalog() {
        try {
            const servicios = await getServiciosEmpresa();
            const insumos = servicios.filter(s => s.tipoItem === 'Insumo/Ingrediente' || s.tipoItem === 'Bebida (Insumo)');
            setServiciosCatalogo(insumos);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar el catálogo de insumos.", variant: "destructive" });
        }
    }
    loadCatalog();
  }, [toast]);


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

  const totalMenuCostPerPerson = useMemo(() => {
    return menuItems.reduce((sum, item) => sum + item.totalDishCost, 0);
  }, [menuItems]);

  const gananciaEstimadaPorPersona = useMemo(() => {
    return totalMenuCostPerPerson * (margenGanancia / 100);
  }, [totalMenuCostPerPerson, margenGanancia]);

  const precioSugeridoPorPersona = useMemo(() => {
    return totalMenuCostPerPerson + gananciaEstimadaPorPersona;
  }, [totalMenuCostPerPerson, gananciaEstimadaPorPersona]);

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
      toast({ title: 'Costo Inválido', description: 'El costo del ingrediente debe ser un número positivo.', variant: 'destructive' });
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

  const handleSaveFullMenu = async (e: FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) {
        toast({ title: 'Nombre del Menú Requerido', variant: 'destructive' });
        return;
    }
    if (menuItems.length === 0) {
        toast({ title: 'Menú Vacío', variant: 'destructive' });
        return;
    }
    setIsSaving(true);
    const menuToSave: NewMenuFormData = {
      name: menuName,
      description: menuDescription || `Menú ${menuTemplateType || 'Personalizado'} creado el ${new Date().toLocaleDateString()}`,
      items: menuItems.map(item => ({
        ...item,
        totalDishCost: item.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)
      })),
      templateType: menuTemplateType,
    };
    try {
      const result = await saveMenu(menuToSave);
      if (result.success && result.id) {
        toast({ title: '¡Menú Guardado!', description: `El menú "${menuToSave.name}" ha sido guardado.`});
        router.push('/fiestas/nueva/catering/modificar-menu'); 
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (error: any) {
      toast({ title: 'Error al Guardar Menú', description: error.message, variant: 'destructive'});
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Crear Nuevo Menú Personalizado</h1>
        <Link href="/fiestas/nueva/catering" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver a Catering</Button></Link>
      </div>

      <form onSubmit={handleSaveFullMenu}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Nuevo Menú</CardTitle>
            <CardDescription>Define los detalles, platos e ingredientes de tu nuevo menú.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* === Section 1: Menu Details === */}
            <section>
              <h3 className="text-lg font-medium font-headline text-primary border-b pb-2 mb-4">1. Detalles del Menú</h3>
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="menu-name" className="text-base">Nombre del Menú *</Label><Input id="menu-name" value={menuName} onChange={(e) => setMenuName(e.target.value)} className="text-base p-3" required/></div>
                <div className="space-y-2"><Label htmlFor="menu-description" className="text-base">Descripción (Opcional)</Label><Input id="menu-description" value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)} className="text-base p-3"/></div>
                <div className="space-y-2">
                  <Label htmlFor="menu-template-type" className="text-base">Tipo de Menú</Label>
                  <Select value={menuTemplateType} onValueChange={(value) => setMenuTemplateType(value as FullMenu['templateType'])}>
                    <SelectTrigger id="menu-template-type" className="text-base p-3 h-auto"><SelectValue /></SelectTrigger>
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
                  <CardDescription>Ajusta el margen de ganancia para calcular el precio de venta sugerido.</CardDescription>
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
                    <p>Este menú aún no tiene platos. Añade uno en la sección de abajo.</p>
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
                  <div className="space-y-2"><Label htmlFor="new-item-name">Nombre del Plato *</Label><Input id="new-item-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required/></div>
                  <div className="space-y-2"><Label htmlFor="new-item-type">Categoría *</Label><Select value={newItemType} onValueChange={(value) => setNewItemType(value as MenuItem['type'])} required><SelectTrigger id="new-item-type"><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="Entrada">Entrada</SelectItem><SelectItem value="Plato Principal">Plato Principal</SelectItem><SelectItem value="Postre">Postre</SelectItem><SelectItem value="Bebida">Bebida</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="new-item-allergens">Alérgenos (separados por coma)</Label><Input id="new-item-allergens" value={newItemAllergens} onChange={(e) => setNewItemAllergens(e.target.value)}/></div>

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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
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
                    <div className="space-y-1"><Label htmlFor="ing-name" className="text-xs">Nombre Ing. *</Label><Input id="ing-name" value={ingredientName} onChange={e => { setIngredientName(e.target.value); setSelectedCatalogIngredient(null); }} className="text-sm p-2 h-9"/></div>
                    <div className="space-y-1"><Label htmlFor="ing-qty-pp">Cant. p/Persona *</Label><Input id="ing-qty-pp" value={ingredientQuantityPerPerson} onChange={e => setIngredientQuantityPerPerson(e.target.value)} placeholder="Ej: 100, 0.5" className="text-sm p-2 h-9"/></div>
                    <div className="space-y-1"><Label htmlFor="ing-unit" className="text-xs">Unidad *</Label><Input id="ing-unit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} placeholder="Ej: gr, ml, ud" className="text-sm p-2 h-9"/></div>
                    <div className="space-y-1"><Label htmlFor="ing-cost" className="text-xs">Costo (de esa cant. p/p) *</Label><Input id="ing-cost" type="number" value={ingredientCost} onChange={e => setIngredientCost(e.target.value)} className="text-sm p-2 h-9" step="any" disabled={!!selectedCatalogIngredient}/></div>
                    <div className="space-y-1"><Label htmlFor="ing-proveedor" className="text-xs">Proveedor</Label><Input id="ing-proveedor" value={ingredientProveedor} onChange={e => setIngredientProveedor(e.target.value)} className="text-sm p-2 h-9"/></div>
                    <div className="space-y-1"><Label htmlFor="ing-marca" className="text-xs">Marca</Label><Input id="ing-marca" value={ingredientMarca} onChange={e => setIngredientMarca(e.target.value)} className="text-sm p-2 h-9"/></div>
                    <div className="space-y-1 md:col-span-3"><Label htmlFor="ing-fecha-act" className="text-xs">Fecha Actualización Precio</Label><DatePickerDemo selectedDate={ingredientFechaActualizacion} onDateChange={setIngredientFechaActualizacion} /></div>
                  </div>
                  <Button onClick={handleAddIngredientToCurrentDish} type="button" variant="outline" size="sm"><PlusCircle className="w-4 h-4 mr-1.5" />Añadir Ingrediente</Button>
                  {currentDishIngredients.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h5 className="text-sm font-medium">Ingredientes para este plato:</h5>
                      <ScrollArea className="h-[120px] border rounded-md p-2 bg-background">
                        <ul className="text-sm">
                          {currentDishIngredients.map(ing => (
                            <li key={ing.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                              <div>{ing.name} ({ing.quantityPerPerson} {ing.unit}) - Costo: ${ing.cost.toFixed(2)}</div>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredientFromCurrentDish(ing.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10"><Trash2 className="w-3 h-3" /></Button>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                      <p className="text-sm text-right font-medium">Costo Total Ingredientes (p/persona): ${currentDishTotalCostPerPerson.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                <div className="text-center pt-4">
                  <Button onClick={handleAddDishToMenu} type="button" size="lg"><PlusCircle className="w-5 h-5 mr-2" />Añadir este Plato al Menú</Button>
                </div>
              </div>
            </section>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Menú Completo'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
