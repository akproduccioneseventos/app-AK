
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Printer, ShoppingCart, ChefHat, Cake, GlassWater } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { FullMenu } from '@/types/catering';

import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getMenuById } from '@/app/actions/menus-catering';

interface ShoppingListItem {
  id: string;
  nombre: string;
  cantidadTotal: number | string; // Can be number or string like "1 Caja"
  unidad: string;
  costoUnitario?: number;
  costoTotal: number;
  categoria: 'Menú Principal' | 'Repostería' | 'Bebidas';
  origen: string; // e.g., name of the dish or sub-category
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function ListaDeComprasPage() {
  const { toast } = useToast();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);

  const generateShoppingList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      const invitados = Number(fiestaData.configuracion.invitadosEstimados) || 0;
      let generatedList: ShoppingListItem[] = [];
      let totalCostValue = 0;

      // 1. Process Catering Menu Ingredients
      if (fiestaData.menuAsignadoId) {
        const menuData = await getMenuById(fiestaData.menuAsignadoId);
        if (menuData) {
          menuData.items.forEach(plato => {
            plato.ingredients.forEach(ing => {
              const qtyPerPerson = parseFloat(ing.quantityPerPerson);
              if (!isNaN(qtyPerPerson)) {
                const totalQty = qtyPerPerson * invitados;
                // Costo ya es por persona-receta, así que lo multiplicamos por invitados
                const totalCostoIngrediente = ing.cost * invitados;
                generatedList.push({
                  id: `${plato.id}-${ing.id}`,
                  nombre: ing.name,
                  cantidadTotal: totalQty,
                  unidad: ing.unit,
                  costoUnitario: qtyPerPerson > 0 ? ing.cost / qtyPerPerson : 0,
                  costoTotal: totalCostoIngrediente,
                  categoria: 'Menú Principal',
                  origen: plato.name,
                });
                totalCostValue += totalCostoIngrediente;
              }
            });
          });
        }
      }

      // 2. Process Reposteria Items
      fiestaData.reposteria?.categorias.forEach(cat => {
        if (cat.activada) {
          cat.items.forEach(item => {
            const itemCost = (item.costoEstimado || 0) * (item.cantidad || 1);
            generatedList.push({
              id: `rep-${item.id}`,
              nombre: item.nombre,
              cantidadTotal: item.cantidad || 1,
              unidad: item.unidad || 'unidad',
              costoUnitario: item.costoEstimado,
              costoTotal: itemCost,
              categoria: 'Repostería',
              origen: cat.nombreDisplay,
            });
            totalCostValue += itemCost;
          });
        }
      });

      // 3. Process Bebidas Items
      fiestaData.bebidas?.categorias.forEach(cat => {
        if (cat.activada) {
          cat.items.forEach(item => {
            const aComprar = Math.max(0, (item.cantidadNecesaria || 0) - (item.stockDisponible || 0));
            if (aComprar > 0) {
              const itemCost = (item.costoUnitario || 0) * aComprar;
              generatedList.push({
                id: `beb-${item.id}`,
                nombre: item.nombre,
                cantidadTotal: aComprar,
                unidad: item.unidadCantidad || 'botellas',
                costoUnitario: item.costoUnitario,
                costoTotal: itemCost,
                categoria: 'Bebidas',
                origen: cat.nombreDisplay,
              });
              totalCostValue += itemCost;
            }
          });
        }
      });
      
      setShoppingList(generatedList);
      setTotalCost(totalCostValue);

    } catch (err: any) {
      setError("No se pudo generar la lista de compras.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    generateShoppingList();
  }, [generateShoppingList]);
  
  const handlePrint = () => {
    window.print();
  };

  const groupedList = useMemo(() => {
    return shoppingList.reduce((acc, item) => {
      const { categoria } = item;
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(item);
      return acc;
    }, {} as Record<ShoppingListItem['categoria'], ShoppingListItem[]>);
  }, [shoppingList]);
  
  const categoryIcons: Record<ShoppingListItem['categoria'], React.ElementType> = {
    'Menú Principal': ChefHat,
    'Repostería': Cake,
    'Bebidas': GlassWater,
  };


  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Generando lista de compras...</p></div>;
  }
  if (error) {
    return <div className="text-center py-10"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold">{error}</p><Button onClick={generateShoppingList} className="mt-4">Reintentar</Button></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Compras Gastronómica</h1>
        </div>
        <div className="flex gap-2">
           <Button onClick={handlePrint} variant="outline"><Printer className="w-4 h-4 mr-2"/>Imprimir/PDF</Button>
            <Link href="/fiestas/nueva/catering" passHref>
                <Button><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Catering</Button>
            </Link>
        </div>
      </div>
      
       <div className="print:block hidden text-center mb-2">
        <h1 className="text-xl font-bold">Lista de Compras - {fiesta?.configuracion.nombreEvento}</h1>
        <p className="text-sm">Para {fiesta?.configuracion.invitadosEstimados} invitados</p>
      </div>

      <Card className="shadow-lg print:shadow-none print:border-none">
        <CardHeader>
          <CardTitle>Resumen General de Compra</CardTitle>
           <CardDescription>
            Lista consolidada de todos los insumos necesarios para el catering, repostería y bebidas del evento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shoppingList.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No hay ítems en la lista. Asigna un menú, repostería o bebidas en sus respectivos módulos.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedList).map(([categoria, items]) => {
                 const CategoryIcon = categoryIcons[categoria as ShoppingListItem['categoria']];
                 const categoryTotal = items.reduce((sum, item) => sum + item.costoTotal, 0);
                 return (
                    <div key={categoria}>
                        <h3 className="font-headline text-lg text-primary flex items-center justify-between mb-2">
                          <span className="flex items-center gap-2"><CategoryIcon className="w-5 h-5"/>{categoria}</span>
                          <span className="text-sm font-mono">{formatCurrency(categoryTotal)}</span>
                        </h3>
                         <div className="overflow-x-auto border rounded-md">
                            <Table className="text-sm">
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Producto</TableHead>
                                    <TableHead className="text-right">Cant. Total</TableHead>
                                    <TableHead className="w-[120px]">Unidad</TableHead>
                                    <TableHead className="text-right">Costo Unit. Est.</TableHead>
                                    <TableHead className="text-right font-semibold">Costo Total Est.</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {items.map(item => (
                                    <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nombre}<p className="text-xs text-muted-foreground font-normal">({item.origen})</p></TableCell>
                                    <TableCell className="text-right">{typeof item.cantidadTotal === 'number' ? item.cantidadTotal.toFixed(2) : item.cantidadTotal}</TableCell>
                                    <TableCell>{item.unidad}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.costoUnitario)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(item.costoTotal)}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                         </div>
                    </div>
                 )
              })}
            </div>
          )}
        </CardContent>
         <CardFooter className="border-t mt-6 pt-4 flex justify-end">
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Costo Total Estimado Gastronomía</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
            </div>
         </CardFooter>
      </Card>
    </div>
  );
}
