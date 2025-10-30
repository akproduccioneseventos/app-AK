
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Printer, ShoppingCart, Truck, Building } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getMenuById } from '@/app/actions/menus-catering';
import { getFiestaActual } from '@/app/actions/fiesta-actual';

interface ShoppingListItem {
  id: string;
  nombre: string;
  cantidadTotal: number | string;
  unidad: string;
  costoUnitario?: number;
  costoTotal: number;
  proveedor: string;
  origen: string;
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
              if (!isNaN(qtyPerPerson) && qtyPerPerson > 0) {
                const totalQty = qtyPerPerson * invitados;
                const totalCostoIngrediente = (ing.costoUnitario || 0) * (totalQty / (ing.unit.toLowerCase() === 'g' || ing.unit.toLowerCase() === 'ml' ? 1000 : 1));
                generatedList.push({
                  id: `${plato.id}-${ing.id}`,
                  nombre: ing.name,
                  cantidadTotal: totalQty,
                  unidad: ing.unit,
                  costoUnitario: ing.costoUnitario,
                  costoTotal: ing.costoTotalReceta * invitados,
                  proveedor: ing.proveedor || 'Sin especificar',
                  origen: plato.name,
                });
                totalCostValue += ing.costoTotalReceta * invitados;
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
              proveedor: 'Proveedor Repostería', // Placeholder
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
            const itemCost = item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0));
            generatedList.push({
              id: `beb-${item.id}`,
              nombre: item.nombre,
              cantidadTotal: item.cantidadNecesaria || 0,
              unidad: item.unidadCantidad || 'botellas',
              costoUnitario: item.costoUnitario,
              costoTotal: itemCost,
              proveedor: item.proveedorHabitual || 'Sin especificar',
              origen: cat.nombreDisplay,
            });
            totalCostValue += itemCost;
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

  const groupedByProvider = useMemo(() => {
    return shoppingList.reduce((acc, item) => {
      const provider = item.proveedor || 'Sin Proveedor Especificado';
      if (!acc[provider]) {
        acc[provider] = { items: [], total: 0 };
      }
      acc[provider].items.push(item);
      acc[provider].total += item.costoTotal;
      return acc;
    }, {} as Record<string, { items: ShoppingListItem[], total: number }>);
  }, [shoppingList]);
  
  const providerNames = Object.keys(groupedByProvider).sort();


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
            <Link href={`/fiestas/nueva/catering?fiestaId=${fiesta?.id || ''}`} passHref>
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
            Lista consolidada de todos los insumos necesarios, agrupados por proveedor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shoppingList.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No hay ítems en la lista. Asigna un menú, repostería o bebidas en sus respectivos módulos.</p>
          ) : (
            <div className="space-y-6">
              {providerNames.map((providerName) => {
                 const { items, total } = groupedByProvider[providerName];
                 return (
                    <div key={providerName} className="print:break-inside-avoid">
                        <h3 className="font-headline text-lg text-primary flex items-center justify-between mb-2">
                          <span className="flex items-center gap-2"><Truck className="w-5 h-5"/>{providerName}</span>
                          <span className="text-sm font-mono">{formatCurrency(total)}</span>
                        </h3>
                         <div className="overflow-x-auto border rounded-md">
                            <Table className="text-sm">
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Producto</TableHead>
                                    <TableHead className="text-right">Cant. Total</TableHead>
                                    <TableHead className="w-[100px]">Unidad</TableHead>
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
