
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, PlusCircle, Edit, List, Loader2, Info, Package, Cake, GlassWater, Printer, Percent, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, MenuItem, ReposteriaData, BebidasData } from '@/types/fiesta';
import { getMenus, saveMenu } from '@/app/actions/menus-catering';
import { getReposteriaMasterTemplate, saveReposteriaMasterTemplate } from '@/app/actions/reposteria.actions';
import { getBebidasMasterTemplate, saveBebidasMasterTemplate } from '@/app/actions/bebidas.actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GestionReposteria } from '@/components/gastronomia/GestionReposteria';
import { GestionBebidas } from '@/components/gastronomia/GestionBebidas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};


export default function GestionMenusPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<FullMenu[]>([]);
  const [reposteriaTemplate, setReposteriaTemplate] = useState<ReposteriaData | null>(null);
  const [bebidasTemplate, setBebidasTemplate] = useState<BebidasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for individual dish editing
  const [editableItems, setEditableItems] = useState<MenuItem[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [menusData, reposteriaData, bebidasData] = await Promise.all([
        getMenus(),
        getReposteriaMasterTemplate(),
        getBebidasMasterTemplate(),
      ]);
      setMenus(menusData);
      setReposteriaTemplate(reposteriaData);
      setBebidasTemplate(bebidasData);

      // Flatten all items for the new editor
      const allItems = menusData.flatMap(menu => 
        menu.items.map(item => ({ ...item, menuId: menu.id })) // Add menuId for context
      );
      setEditableItems(allItems);
      
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas gastronómicas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleItemPriceChange = (itemId: string, field: 'suggestedSellingPrice' | 'profitMargin', value: number) => {
    setEditableItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const cost = item.totalDishCost || 0;
          if (field === 'suggestedSellingPrice') {
            const newPrice = value;
            const newMargin = cost > 0 ? ((newPrice / cost) - 1) * 100 : 0;
            return { ...item, suggestedSellingPrice: newPrice, profitMargin: newMargin };
          }
          if (field === 'profitMargin') {
            const newMargin = value;
            const newPrice = cost * (1 + newMargin / 100);
            return { ...item, profitMargin: newMargin, suggestedSellingPrice: newPrice };
          }
        }
        return item;
      })
    );
  };
  
  const handleSaveAllItemChanges = async () => {
    setIsSaving(true);
    try {
      const updatedMenusMap = new Map<string, FullMenu>();

      // Group edited items by their original menu
      editableItems.forEach(editedItem => {
        const menuId = (editedItem as any).menuId;
        if (!menuId) return;

        if (!updatedMenusMap.has(menuId)) {
          const originalMenu = menus.find(m => m.id === menuId);
          if(originalMenu) updatedMenusMap.set(menuId, { ...originalMenu, items: [...originalMenu.items] });
        }
        
        const menuToUpdate = updatedMenusMap.get(menuId);
        if (menuToUpdate) {
            const itemIndex = menuToUpdate.items.findIndex(i => i.id === editedItem.id);
            if (itemIndex > -1) {
                // Create a new object for the item without the temporary menuId
                const { menuId: _, ...itemToSave } = editedItem as any;
                menuToUpdate.items[itemIndex] = itemToSave;
            }
        }
      });
      
      // Save each updated menu
      const savePromises = Array.from(updatedMenusMap.values()).map(menu => saveMenu(menu));
      await Promise.all(savePromises);
      
      toast({ title: "¡Precios Actualizados!", description: "Todos los cambios en los platos han sido guardados."});
      await loadData(); // Reload all data

    } catch (e: any) {
        toast({ title: "Error", description: `No se pudieron guardar los cambios: ${e.message}`, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };


  const itemsAgrupadosPorTipo = useMemo(() => {
    return editableItems.reduce((acc, item) => {
      const categoria = item.type || 'Sin Categoría';
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [editableItems]);


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador Gastronómico Maestro</h1>
        </div>
        <Link href="/empresa" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Button>
        </Link>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">Catálogo Maestro de Gastronomía</CardTitle>
          <CardDescription>Este es tu centro de control para todo lo relacionado con la comida. Define tus plantillas de menús, platos, repostería, bebidas e insumos aquí.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
           <Link href="/empresa/menus/nuevo" passHref>
            <Button><PlusCircle className="w-4 h-4 mr-2"/>Crear Plantilla de Menú</Button>
           </Link>
           <Link href="/empresa/insumos?from=gastronomia" passHref>
            <Button variant="secondary"><Package className="w-4 h-4 mr-2"/>Gestionar Insumos</Button>
           </Link>
            <Link href="/empresa/menus/reporte" passHref>
                <Button variant="outline"><Printer className="w-4 h-4 mr-2"/>Reporte Gastronómico</Button>
           </Link>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
      ) : (
        <div className="space-y-4">
             <Accordion type="multiple" defaultValue={['platos']} className="w-full space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Plantillas de Menú Completos</CardTitle>
                     <CardDescription>Agrupaciones de platos que puedes asignar a un evento.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {menus.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menus.map((menu) => (
                            <Card key={menu.id} className="shadow-sm hover:shadow-md transition-shadow bg-muted/30">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                                    <Link href={`/empresa/menus/${encodeURIComponent(menu.id)}/editar`} passHref>
                                        <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>Editar Menú</Button>
                                    </Link>
                                    </div>
                                    <CardDescription>{menu.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {(menu.items || []).length > 0 && (
                                    <ScrollArea className="h-20 text-xs text-muted-foreground border-t pt-2">
                                        <p className="font-semibold text-xs mb-1">Platos Incluidos:</p>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                        {menu.items.map(item => <li key={item.id}>{item.name}</li>)}
                                        </ul>
                                    </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                       </div>
                    ) : (
                         <Card className="text-center py-10"><CardContent><Info className="w-10 h-10 mx-auto text-muted-foreground mb-3"/><p className="text-muted-foreground">No has creado ninguna plantilla de menú todavía.</p></CardContent></Card>
                    )}
                  </CardContent>
                </Card>

                 <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Catálogo de Platos Individuales</CardTitle>
                     <CardDescription>Ajusta el precio de venta y el margen de ganancia de cada plato de forma individual.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(itemsAgrupadosPorTipo).length > 0 ? (
                        <Accordion type="multiple" defaultValue={Object.keys(itemsAgrupadosPorTipo)}>
                          {Object.entries(itemsAgrupadosPorTipo).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([categoria, items]) => (
                            <AccordionItem key={categoria} value={categoria} className="border rounded-md my-2">
                                <AccordionTrigger className="px-3 text-md font-semibold hover:no-underline">{categoria}</AccordionTrigger>
                                <AccordionContent className="p-2 border-t">
                                  <div className="space-y-2">
                                    {items.map(item => (
                                      <div key={item.id} className="p-3 border-b last:border-b-0">
                                          <p className="font-medium text-sm">{item.name}</p>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 items-end">
                                            <div className="space-y-1">
                                              <Label className="text-xs text-muted-foreground">Costo p/Persona</Label>
                                              <p className="font-semibold">{formatCurrency(item.totalDishCost)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`item-profit-${item.id}`} className="text-xs flex items-center gap-1"><Percent className="w-3 h-3"/>Margen Ganancia (%)</Label>
                                                <Input id={`item-profit-${item.id}`} type="number" value={item.profitMargin?.toFixed(0) ?? ''} onChange={e => handleItemPriceChange(item.id, 'profitMargin', Number(e.target.value) || 0)} className="h-8"/>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`item-price-${item.id}`} className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3"/>PVP Sugerido ($)</Label>
                                                <Input id={`item-price-${item.id}`} type="number" value={item.suggestedSellingPrice?.toFixed(0) ?? ''} onChange={e => handleItemPriceChange(item.id, 'suggestedSellingPrice', Number(e.target.value) || 0)} className="h-8"/>
                                            </div>
                                          </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                    ) : <p className="text-center text-muted-foreground p-4">No hay platos en ningún menú.</p>}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSaveAllItemChanges} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : null} Guardar Cambios en Platos
                    </Button>
                  </CardFooter>
                </Card>
                
                {reposteriaTemplate && (
                  <GestionReposteria 
                        initialData={reposteriaTemplate} 
                        onDataChange={(newData) => {
                            setReposteriaTemplate(newData);
                        }}
                        onSave={async (dataToSave) => {
                            await saveReposteriaMasterTemplate(dataToSave);
                            toast({ title: "Plantilla de Repostería Actualizada" });
                        }}
                        invitados={{adultos: 100, ninos: 0, adolescentes: 0}} // Placeholder for calculations
                        isTemplateMode={true}
                    />
                )}

                {bebidasTemplate && (
                  <GestionBebidas 
                    initialData={bebidasTemplate} 
                    onDataChange={(newData) => {
                        setBebidasTemplate(newData);
                    }}
                     onSave={async (dataToSave) => {
                        await saveBebidasMasterTemplate(dataToSave);
                        toast({ title: "Plantilla de Bebidas Actualizada" });
                    }}
                    invitados={{adultos: 100, ninos: 0, adolescentes: 0}} // Placeholder
                    isTemplateMode={true}
                />
                )}
            </Accordion>
        </div>
      )}
    </div>
  );
}
