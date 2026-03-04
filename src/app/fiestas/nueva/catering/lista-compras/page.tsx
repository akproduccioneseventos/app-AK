
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Printer, ShoppingCart, Truck, CheckCircle, PackageSearch, Beer, ChefHat, Info, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CompraProveedorEstado } from '@/types/fiesta';
import { getMenus } from '@/app/actions/menus-catering';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateShoppingListStatus } from '@/app/actions/fiesta/catering.actions';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { defaultBebidasData } from '@/lib/fiesta-defaults';

interface ShoppingListItem {
  id: string;
  nombre: string;
  cantidadTotal: number;
  unit: string;
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
      const [fiestaData, allMenus] = await Promise.all([
        getFiestaById(fiestaId),
        getMenus()
      ]);
      
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      
      setFiesta(fiestaData);
      setEstadosCompra(fiestaData.estadosCompra || []);

      let presupuestoData = null;
      if (fiestaData.presupuestoId) {
          presupuestoData = await getPresupuestoById(fiestaData.presupuestoId);
      }

      // Si no hay presupuesto vinculado, no podemos calcular nada automáticamente
      if (!presupuestoData) {
          setShoppingList([]);
          setIsLoading(false);
          return;
      }

      const adultos = presupuestoData.invitadosAdultos || 0;
      const ninos = (presupuestoData.invitadosNinos || 0) + (presupuestoData.invitadosAdolescentes || 0);
      const totalInvitados = adultos + ninos;

      let generatedList: ShoppingListItem[] = [];

      // HELPER: Decidir qué cantidad de invitados usar para cada ítem
      const getTargetGuests = (item: { categoriaServicio?: string, nombreServicio: string }) => {
          const cat = (item.categoriaServicio || '').toLowerCase();
          const name = (item.nombreServicio || '').toLowerCase();
          if (cat.includes('infantil') || cat.includes('adolescente') || name.includes('niño')) return ninos;
          if (cat.includes('plato principal') || name.includes('principal')) return adultos;
          return totalInvitados;
      };

      // 1. PROCESAR PLATOS DEL PRESUPUESTO (Automático)
      const budgetDishes = presupuestoData.itemsPresupuestados.filter(item => 
          item.idServicioCatalogo.startsWith('dish_')
      );

      const allDishesInCatalog = allMenus.flatMap(m => m.items);

      budgetDishes.forEach(budgetItem => {
          const catalogDish = allDishesInCatalog.find(d => d.id === budgetItem.idServicioCatalogo);
          if (catalogDish) {
              const targetGuests = getTargetGuests(budgetItem);
              catalogDish.ingredients.forEach(ing => {
                  const qtyPerPerson = parseFloat(ing.quantityPerPerson);
                  if (!isNaN(qtyPerPerson) && qtyPerPerson > 0) {
                      const totalQty = qtyPerPerson * targetGuests;
                      const factorUnidad = (ing.unit.toLowerCase() === 'g' || ing.unit.toLowerCase() === 'ml' || ing.unit.toLowerCase() === 'gramos') ? 1000 : 1;
                      const costValue = (ing.costoUnitario || 0) * (totalQty / factorUnidad);

                      generatedList.push({
                          id: `ing-${catalogDish.id}-${ing.id}`,
                          nombre: ing.name,
                          cantidadTotal: totalQty,
                          unit: ing.unit,
                          costoUnitario: ing.costoUnitario,
                          costoTotal: costValue,
                          proveedor: ing.proveedor || 'Sin especificar',
                          origen: `Presupuesto: ${catalogDish.name}`,
                      });
                  }
              });
          }
      });

      // 2. PROCESAR BARRA DE TRAGOS (Automático desde Presupuesto)
      const hasBarra = presupuestoData.itemsPresupuestados.some(item => 
          item.nombreServicio.toLowerCase().includes('barra') || 
          item.nombreServicio.toLowerCase().includes('licuado')
      );

      if (hasBarra) {
          const barraTemplate = defaultBebidasData.categorias.find(c => c.id === 'barra_tragos');
          if (barraTemplate) {
              barraTemplate.items.forEach(item => {
                  const totalQty = (item.cantidadNecesaria || 0) * totalInvitados;
                  const itemCost = (item.costoUnitario || 0) * totalQty;
                  generatedList.push({
                      id: `beb-barra-${item.id}`,
                      nombre: item.nombre,
                      cantidadTotal: totalQty,
                      unit: item.unidadCantidad || 'Litros',
                      costoUnitario: item.costoUnitario || 0,
                      costoTotal: itemCost,
                      proveedor: item.proveedorHabitual || 'Proveedor Bebidas',
                      origen: 'Barra de Tragos (Presupuesto)',
                  });
              });
          }
      }

      // 3. PROCESAR BEBIDAS ADICIONALES DEL PRESUPUESTO
      const otherBeverages = presupuestoData.itemsPresupuestados.filter(item => 
          item.categoriaServicio?.toLowerCase().includes('bebida') && 
          !item.nombreServicio.toLowerCase().includes('barra')
      );

      otherBeverages.forEach(bev => {
          const totalQty = bev.cantidad; // En presupuesto ya viene la cantidad calculada
          generatedList.push({
              id: `bev-extra-${bev.idServicioCatalogo}`,
              nombre: bev.nombreServicio,
              cantidadTotal: totalQty,
              unit: bev.unidad || 'Unidades',
              costoUnitario: bev.precioUnitario,
              costoTotal: bev.precioUnitario * totalQty,
              proveedor: 'Distribuidora Bebidas',
              origen: 'Bebidas (Presupuesto)',
          });
      });

      // 4. CONSOLIDAR LISTA (Sumar cantidades de mismos productos)
      const consolidated: Record<string, ShoppingListItem> = {};
      generatedList.forEach(item => {
          const key = `${item.nombre.toLowerCase()}-${item.proveedor.toLowerCase()}`;
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

      const finalList = Object.values(consolidated).sort((a,b) => a.proveedor.localeCompare(b.proveedor));
      setShoppingList(finalList);
      setTotalCost(finalList.reduce((sum, item) => sum + item.costoTotal, 0));

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
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Sincronizando con presupuesto y generando lista...</p></div>;
  }
  if (error) {
    return <div className="text-center py-10"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold">{error}</p><Button onClick={() => loadData()} className="mt-4">Reintentar</Button></div>;
  }

  return (
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Compras Automática</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => loadData(true)} title="Actualizar desde presupuesto"><RefreshCw className="w-4 h-4 mr-2"/>Sincronizar</Button>
            <Button onClick={handlePrint} variant="outline"><Printer className="w-4 h-4 mr-2"/>Imprimir/PDF</Button>
              <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref>
                  <Button><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
              </Link>
          </div>
        </div>
        
        <div className="print:block hidden text-center mb-4">
          <h1 className="text-2xl font-bold">Lista de Compras - {fiesta?.configuracion.nombreEvento}</h1>
          <p className="text-sm">Insumos detectados automáticamente desde el presupuesto oficial.</p>
        </div>

        <Card className="shadow-lg print:shadow-none print:border-none">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Sincronización Activa</Badge>
            </div>
            <CardTitle>Insumos Consolidados por Proveedor</CardTitle>
            <CardDescription>
              Hemos analizado el presupuesto y los menús. Aquí tienes el desglose total de lo que debes comprar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shoppingList.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                  <Info className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3"/>
                  <p className="text-muted-foreground">No se detectaron insumos automáticos. Asegúrate de que el presupuesto contenga platos del catálogo o servicios de barra.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {providerNames.map((providerName) => {
                  const { items, total } = groupedByProvider[providerName];
                  const estadoActual = estadosCompra.find(e => e.provider === providerName) || { pedido: false, pagado: false };
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
                                      <TableCell className="text-xs uppercase font-medium">{item.unit}</TableCell>
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
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Costo Total de Insumos para el Evento</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(totalCost)}</p>
                  <p className="text-xs text-muted-foreground italic">Cálculo basado en el presupuesto oficial vinculado.</p>
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
