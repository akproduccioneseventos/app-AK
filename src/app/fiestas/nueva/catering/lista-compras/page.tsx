
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Printer, ShoppingCart, Truck, CheckCircle, PackageSearch, Beer, ChefHat } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CompraProveedorEstado } from '@/types/fiesta';
import { getMenuById } from '@/app/actions/menus-catering';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateShoppingListStatus } from '@/app/actions/fiesta/catering.actions';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ShoppingListItem {
  id: string;
  nombre: string;
  cantidadTotal: number;
  unidad: string;
  costoUnitario: number;
  costoTotal: number;
  proveedor: string;
  origen: string;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

function ListaDeComprasContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);

  const [estadosCompra, setEstadosCompra] = useState<CompraProveedorEstado[]>([]);
  const [isSavingStatus, setIsSavingStatus] = useState<string | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (!fiestaId) {
      setError("No se proporcionó un ID de evento.");
      setIsLoading(false);
      return;
    }
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      
      setFiesta(fiestaData);
      setEstadosCompra(fiestaData.estadosCompra || []);

      const invitados = Number(fiestaData.configuracion.invitadosEstimados) || 0;
      let generatedList: ShoppingListItem[] = [];
      let totalCostValue = 0;

      // 1. Procesar Ingredientes del Menú de Catering (Automático)
      if (fiestaData.menuAsignadoId) {
        const menuData = await getMenuById(fiestaData.menuAsignadoId);
        if (menuData) {
          menuData.items.forEach(plato => {
            plato.ingredients.forEach(ing => {
              const qtyPerPerson = parseFloat(ing.quantityPerPerson);
              if (!isNaN(qtyPerPerson) && qtyPerPerson > 0) {
                const totalQty = qtyPerPerson * invitados;
                // Ajustar cantidad si es en gramos o ml para el costo
                const factorUnidad = (ing.unit.toLowerCase() === 'g' || ing.unit.toLowerCase() === 'ml' || ing.unit.toLowerCase() === 'gramos') ? 1000 : 1;
                const totalCostoIngrediente = (ing.costoUnitario || 0) * (totalQty / factorUnidad);
                
                generatedList.push({
                  id: `ing-${plato.id}-${ing.id}`,
                  nombre: ing.name,
                  cantidadTotal: totalQty,
                  unidad: ing.unit,
                  costoUnitario: ing.costoUnitario,
                  costoTotal: totalCostoIngrediente,
                  proveedor: ing.proveedor || 'Sin especificar',
                  origen: `Catering: ${plato.name}`,
                });
                totalCostValue += totalCostoIngrediente;
              }
            });
          });
        }
      }

      // 2. Procesar Barra de Tragos (Cálculo Automático según lo enviado por el usuario)
      const barraCat = fiestaData.bebidas?.categorias.find(c => c.id === 'barra_tragos');
      if (barraCat && barraCat.activada) {
          barraCat.items.forEach(item => {
              const totalQty = (item.cantidadNecesaria || 0) * invitados;
              const totalCosto = (item.costoUnitario || 0) * totalQty;
              
              generatedList.push({
                  id: `beb-bt-${item.id}`,
                  nombre: item.nombre,
                  cantidadTotal: totalQty,
                  unidad: item.unidadCantidad || 'Litros',
                  costoUnitario: item.costoUnitario || 0,
                  costoTotal: totalCosto,
                  proveedor: item.proveedorHabitual || 'Proveedor Bebidas',
                  origen: 'Barra de Tragos',
              });
              totalCostValue += totalCosto;
          });
      }

      // 3. Procesar Otros Bebidas
      fiestaData.bebidas?.categorias.forEach(cat => {
        if (cat.activada && cat.id !== 'barra_tragos') {
          cat.items.forEach(item => {
            const totalQty = (item.cantidadNecesaria || 0) * invitados;
            const itemCost = totalQty * (item.costoUnitario || 0);
            generatedList.push({
              id: `beb-${item.id}`,
              nombre: item.nombre,
              cantidadTotal: totalQty,
              unidad: item.unidadCantidad || 'uds',
              costoUnitario: item.costoUnitario || 0,
              costoTotal: itemCost,
              proveedor: item.proveedorHabitual || 'Distribuidora Bebidas',
              origen: cat.nombreDisplay,
            });
            totalCostValue += itemCost;
          });
        }
      });

      // 4. Procesar Repostería (Automático)
      fiestaData.reposteria?.categorias.forEach(cat => {
        if (cat.activada) {
          cat.items.forEach(item => {
            const totalQty = item.cantidad || 1;
            const itemCost = (item.costoEstimado || 0) * totalQty;
            generatedList.push({
              id: `rep-${item.id}`,
              nombre: item.nombre,
              cantidadTotal: totalQty,
              unidad: item.unidad || 'unidad',
              costoUnitario: item.costoEstimado || 0,
              costoTotal: itemCost,
              proveedor: 'Proveedor Repostería',
              origen: cat.nombreDisplay,
            });
            totalCostValue += itemCost;
          });
        }
      });
      
      // Consolidar ítems iguales (mismo nombre y proveedor)
      const consolidated: Record<string, ShoppingListItem> = {};
      generatedList.forEach(item => {
          const key = `${item.nombre}-${item.proveedor}`.toLowerCase();
          if (consolidated[key]) {
              consolidated[key].cantidadTotal += item.cantidadTotal;
              consolidated[key].costoTotal += item.costoTotal;
              if (!consolidated[key].origen.includes(item.origen)) {
                  consolidated[key].origen += `, ${item.origen}`;
              }
          } else {
              consolidated[key] = { ...item };
          }
      });

      setShoppingList(Object.values(consolidated).sort((a,b) => a.proveedor.localeCompare(b.proveedor)));
      setTotalCost(totalCostValue);

    } catch (err: any) {
      setError("No se pudo generar la lista de compras.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => window.print();

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
  
  const handleStatusChange = async (proveedor: string, field: 'pedido' | 'pagado', value: boolean) => {
    if (!fiestaId) return;
    setIsSavingStatus(proveedor);

    const updatedEstados = [...estadosCompra];
    let estadoProveedor = updatedEstados.find(e => e.proveedor === proveedor);
    
    if (estadoProveedor) {
        estadoProveedor[field] = value;
    } else {
        estadoProveedor = { proveedor, pedido: field === 'pedido' ? value : false, pagado: field === 'pagado' ? value : false };
        updatedEstados.push(estadoProveedor);
    }
    
    setEstadosCompra(updatedEstados);

    try {
        const result = await updateShoppingListStatus(fiestaId, updatedEstados);
        if (!result.success) throw new Error(result.error);
        toast({ title: "Estado Actualizado", description: `${proveedor}: ${field} guardado.` });
    } catch(e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
        loadData(false);
    } finally {
        setIsSavingStatus(null);
    }
  };


  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Generando lista de compras...</p></div>;
  }
  if (error) {
    return <div className="text-center py-10"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold">{error}</p><Button onClick={() => loadData()} className="mt-4">Reintentar</Button></div>;
  }

  return (
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Compras Gastronómica</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline"><Printer className="w-4 h-4 mr-2"/>Imprimir/PDF</Button>
              <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref>
                  <Button><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
              </Link>
          </div>
        </div>
        
        <div className="print:block hidden text-center mb-4">
          <h1 className="text-2xl font-bold">Lista de Compras - {fiesta?.configuracion.nombreEvento}</h1>
          <p className="text-sm">Insumos para {fiesta?.configuracion.invitadosEstimados} invitados</p>
        </div>

        <Card className="shadow-lg print:shadow-none print:border-none">
          <CardHeader>
            <CardTitle>Insumos Consolidados por Proveedor</CardTitle>
            <CardDescription>
              Cálculo automático de ingredientes, bebidas y barra de tragos basado en el número de invitados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shoppingList.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No hay ítems en la lista. Asegúrate de haber asignado un menú y activado las categorías de bebidas.</p>
            ) : (
              <div className="space-y-10">
                {providerNames.map((providerName) => {
                  const { items, total } = groupedByProvider[providerName];
                  const estadoActual = estadosCompra.find(e => e.proveedor === providerName) || { pedido: false, pagado: false };
                  const isSavingThis = isSavingStatus === providerName;
                  return (
                      <div key={providerName} className="print:break-inside-avoid">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2 border-b pb-2">
                              <h3 className="font-headline text-xl text-primary flex items-center gap-2">
                                  <Truck className="w-6 h-6"/>{providerName}
                              </h3>
                              <div className="flex items-center gap-6 bg-muted/50 p-2 px-4 rounded-full border text-xs print:hidden">
                                  <div className="flex items-center gap-2">
                                      <Switch id={`pedido-${providerName}`} checked={estadoActual.pedido} onCheckedChange={(val) => handleStatusChange(providerName, 'pedido', val)} disabled={isSavingThis} />
                                      <Label htmlFor={`pedido-${providerName}`} className="font-bold">PEDIDO</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Switch id={`pagado-${providerName}`} checked={estadoActual.pagado} onCheckedChange={(val) => handleStatusChange(providerName, 'pagado', val)} disabled={isSavingThis} />
                                      <Label htmlFor={`pagado-${providerName}`} className="font-bold text-green-600">PAGADO</Label>
                                  </div>
                                  {isSavingThis && <Loader2 className="w-4 h-4 animate-spin"/>}
                              </div>
                          </div>
                          <div className="overflow-x-auto border rounded-lg shadow-inner bg-white">
                              <Table className="text-sm">
                                  <TableHeader className="bg-muted/20">
                                  <TableRow>
                                      <TableHead className="font-bold">Producto</TableHead>
                                      <TableHead className="text-right">Cant. Total</TableHead>
                                      <TableHead className="w-[100px]">Unidad</TableHead>
                                      <TableHead className="text-right">Costo Unit.</TableHead>
                                      <TableHead className="text-right font-bold">Costo Total Est.</TableHead>
                                  </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                  {items.map(item => (
                                      <TableRow key={item.id}>
                                      <TableCell className="font-medium">
                                          {item.nombre}
                                          <p className="text-[10px] text-muted-foreground font-normal italic">Ref: {item.origen}</p>
                                      </TableCell>
                                      <TableCell className="text-right font-mono">{item.cantidadTotal.toFixed(2)}</TableCell>
                                      <TableCell className="text-xs uppercase font-medium">{item.unidad}</TableCell>
                                      <TableCell className="text-right text-xs text-muted-foreground">{formatCurrency(item.costoUnitario)}</TableCell>
                                      <TableCell className="text-right font-bold text-primary">{formatCurrency(item.costoTotal)}</TableCell>
                                      </TableRow>
                                  ))}
                                  </TableBody>
                                   <TableFooter>
                                    <TableRow className="bg-muted/10">
                                        <TableCell colSpan={4} className="text-right font-bold text-lg">Total a invertir con {providerName}:</TableCell>
                                        <TableCell className="text-right font-bold text-lg text-primary">{formatCurrency(total)}</TableCell>
                                    </TableRow>
                                  </TableFooter>
                              </Table>
                          </div>
                      </div>
                  )
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t mt-8 pt-6 flex justify-end bg-muted/5 p-6">
              <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Costo Total de Insumos Gastronómicos</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(totalCost)}</p>
                  <p className="text-xs text-muted-foreground italic">Basado en {fiesta?.configuracion.invitadosEstimados} invitados estimados.</p>
              </div>
          </CardFooter>
        </Card>
      </div>
  );
}

export default function ListaDeComprasPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <ListaDeComprasContent/>
    </Suspense>
  )
}
