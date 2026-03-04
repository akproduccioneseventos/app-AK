
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, AlertTriangle, Printer, ShoppingCart, Truck, RefreshCw, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CompraProveedorEstado } from '@/types/fiesta';
import { getMenus } from '@/app/actions/menus-catering';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getInsumos } from '@/app/actions/insumos';
import { updateShoppingListStatus } from '@/app/actions/fiesta/catering.actions';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { defaultBebidasData } from '@/lib/fiesta-defaults';
import { cn } from '@/lib/utils';

interface ShoppingListItem {
  id: string;
  nombre: string;
  cantidadNecesaria: number;
  stockDisponible: number;
  cantidadAComprar: number;
  unit: string;
  costoUnitario: number;
  costoTotalFaltante: number;
  proveedor: string;
  origen: string;
  origenId?: string;
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
  const [totalInvestment, setTotalInvestment] = useState(0);
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
      const [fiestaData, allMenus, catalogoInsumos] = await Promise.all([
        getFiestaById(fiestaId),
        getMenus(),
        getInsumos()
      ]);
      
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      
      setFiesta(fiestaData);
      setEstadosCompra(fiestaData.estadosCompra || []);

      let presupuestoData = null;
      if (fiestaData.presupuestoId) {
          presupuestoData = await getPresupuestoById(fiestaData.presupuestoId);
      }

      if (!presupuestoData) {
          setShoppingList([]);
          setIsLoading(false);
          return;
      }

      const adultos = presupuestoData.invitadosAdultos || 0;
      const ninos = (presupuestoData.invitadosNinos || 0) + (presupuestoData.invitadosAdolescentes || 0);
      const totalInvitados = adultos + ninos;

      let rawList: any[] = [];

      const getTargetGuests = (item: { categoriaServicio?: string, nombreServicio: string }) => {
          const cat = (item.categoriaServicio || '').toLowerCase();
          const name = (item.nombreServicio || '').toLowerCase();
          
          if (cat.includes('infantil') || cat.includes('adolescente') || name.includes('niño') || name.includes('hamburguesa') || name.includes('pancho')) {
              return ninos;
          }
          if (cat.includes('plato principal') || name.includes('principal') || name.includes('arrollado') || name.includes('asado') || name.includes('bife')) {
              return adultos;
          }
          return totalInvitados;
      };

      // 1. PROCESAR PLATOS DEL PRESUPUESTO (DINÁMICO: siempre lee el catálogo actual)
      const budgetDishes = presupuestoData.itemsPresupuestados.filter(item => 
          item.idServicioCatalogo.startsWith('dish_') || 
          item.idServicioCatalogo.startsWith('new_item_') || 
          item.idServicioCatalogo.startsWith('menu_')
      );

      const allDishesInCatalog = allMenus.flatMap(m => m.items);

      budgetDishes.forEach(budgetItem => {
          const catalogDish = allDishesInCatalog.find(d => d.id === budgetItem.idServicioCatalogo);
          if (catalogDish) {
              const targetGuests = getTargetGuests(budgetItem);
              catalogDish.ingredients.forEach(ing => {
                  const qtyPerPerson = parseFloat(ing.quantityPerPerson);
                  if (!isNaN(qtyPerPerson) && qtyPerPerson > 0) {
                      const totalNeeded = qtyPerPerson * targetGuests;
                      
                      const catalogInsumo = catalogoInsumos.find(ci => ci.id === ing.origenId || ci.nombre.toLowerCase() === ing.name.toLowerCase());
                      const providerFromCatalog = catalogInsumo?.proveedor;

                      rawList.push({
                          nombre: ing.name,
                          cantidadNecesaria: totalNeeded,
                          unit: ing.unit,
                          costoUnitario: ing.costoUnitario,
                          proveedor: ing.proveedor || providerFromCatalog || 'Sin especificar',
                          origen: `Presupuesto: ${catalogDish.name}`,
                          origenId: ing.origenId,
                      });
                  }
              });
          }
      });

      // 2. PROCESAR BARRA DE TRAGOS
      const hasBarra = presupuestoData.itemsPresupuestados.some(item => 
          item.nombreServicio.toLowerCase().includes('barra') || 
          item.nombreServicio.toLowerCase().includes('licuado')
      );

      if (hasBarra) {
          const barraTemplate = defaultBebidasData.categorias.find(c => c.id === 'barra_tragos');
          if (barraTemplate) {
              barraTemplate.items.forEach(item => {
                  const totalNeeded = (item.cantidadNecesaria || 0) * totalInvitados;
                  
                  const catalogInsumo = catalogoInsumos.find(ci => ci.id === item.origenId || ci.nombre.toLowerCase() === item.nombre.toLowerCase());
                  const providerFromCatalog = catalogInsumo?.proveedor;

                  rawList.push({
                      nombre: item.nombre,
                      cantidadNecesaria: totalNeeded,
                      unit: item.unidadCantidad || 'Litros',
                      costoUnitario: item.costoUnitario || 0,
                      proveedor: item.proveedorHabitual || providerFromCatalog || 'Proveedor Bebidas',
                      origen: 'Barra de Tragos (Presupuesto)',
                      origenId: item.origenId,
                  });
              });
          }
      }

      // 3. CONSOLIDAR Y COMPARAR CON STOCK ACTUAL
      const consolidated: Record<string, ShoppingListItem> = {};
      
      rawList.forEach(raw => {
          const key = `${raw.nombre.toLowerCase()}-${raw.proveedor.toLowerCase()}`;
          
          if (consolidated[key]) {
              consolidated[key].cantidadNecesaria += raw.cantidadNecesaria;
              if (!consolidated[key].origen.includes(raw.origen)) {
                  consolidated[key].origen += `, ${raw.origen}`;
              }
          } else {
              const catalogItem = catalogoInsumos.find(ci => ci.id === raw.origenId || ci.nombre.toLowerCase() === raw.nombre.toLowerCase());
              const stock = catalogItem?.cantidadDisponible || 0;
              
              let cost = raw.costoUnitario;
              if (catalogItem) {
                  cost = catalogItem.valorUnitarioEstimado || raw.costoUnitario;
              }
              
              consolidated[key] = {
                  id: key,
                  nombre: raw.nombre,
                  cantidadNecesaria: raw.cantidadNecesaria,
                  stockDisponible: stock,
                  cantidadAComprar: 0, 
                  unit: raw.unit,
                  costoUnitario: cost,
                  costoTotalFaltante: 0, 
                  proveedor: raw.proveedor,
                  origen: raw.origen,
                  origenId: raw.origenId
              };
          }
      });

      const finalList = Object.values(consolidated).map(item => {
          const faltante = Math.max(0, item.cantidadNecesaria - item.stockDisponible);
          const unitNorm = (item.unit || '').toLowerCase().trim();
          
          // Corrección de unidades: gramos a kilos
          const factorUnidad = (unitNorm === 'g' || unitNorm === 'ml' || unitNorm === 'gramos' || unitNorm === 'cc') ? 1000 : 1;
          const costoInversion = item.costoUnitario * (faltante / factorUnidad);

          return {
              ...item,
              cantidadAComprar: faltante,
              costoTotalFaltante: Math.round(costoInversion)
          };
      }).sort((a,b) => a.proveedor.localeCompare(b.proveedor));

      setShoppingList(finalList);
      setTotalInvestment(finalList.reduce((sum, item) => sum + item.costoTotalFaltante, 0));

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
      const provider = item.proveedor || 'Sin especificar';
      if (!acc[provider]) {
        acc[provider] = { items: [], total: 0 };
      }
      acc[provider].items.push(item);
      acc[provider].total += item.costoTotalFaltante;
      return acc;
    }, {} as Record<string, { items: ShoppingListItem[], total: number }>);
  }, [shoppingList]);
  
  const providerNames = Object.keys(groupedByProvider).sort();
  
  const handleStatusChange = async (proveedor: string, field: 'pedido' | 'pagado', value: boolean) => {
    if (!fiestaId) return;
    setIsSavingStatus(proveedor);

    const updatedEstados = [...estadosCompra];
    let estadoProveedor = updatedEstados.find(e => e.provider === proveedor);
    
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
        toast({ title: "Estado Actualizado" });
    } catch(e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
        loadData(false);
    } finally {
        setIsSavingStatus(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Sincronizando con el Catálogo Maestro...</p></div>;
  }
  if (error) {
    return <div className="text-center py-10"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold">{error}</p><Button onClick={() => loadData()} className="mt-4">Reintentar</Button></div>;
  }

  return (
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Compras Dinámica</h1>
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
          <p className="text-sm">Ingredientes sincronizados con las recetas del catálogo maestro.</p>
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
                  <p className="text-muted-foreground">No se detectaron insumos. Verifica que el presupuesto tenga platos asignados.</p>
              </div>
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
                                      <TableHead className="text-right">Necesario</TableHead>
                                      <TableHead className="text-right">En Stock</TableHead>
                                      <TableHead className="text-right font-bold text-primary">Faltante</TableHead>
                                      <TableHead className="w-[80px]">Unidad</TableHead>
                                      <TableHead className="text-right font-bold">Costo Inversión</TableHead>
                                  </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                  {items.map(item => (
                                      <TableRow key={item.id} className={cn(item.cantidadAComprar > 0 && "bg-amber-50/10")}>
                                      <TableCell className="font-medium">
                                          {item.nombre}
                                          <p className="text-[10px] text-muted-foreground font-normal italic">Ref: {item.origen}</p>
                                      </TableCell>
                                      <TableCell className="text-right font-mono">{item.cantidadNecesaria.toFixed(2)}</TableCell>
                                      <TableCell className="text-right font-mono text-muted-foreground">{item.stockDisponible.toFixed(2)}</TableCell>
                                      <TableCell className={cn("text-right font-bold", item.cantidadAComprar > 0 ? "text-primary" : "text-green-600")}>
                                          {item.cantidadAComprar > 0 ? item.cantidadAComprar.toFixed(2) : 'OK'}
                                      </TableCell>
                                      <TableCell className="text-xs uppercase font-medium">{item.unit}</TableCell>
                                      <TableCell className="text-right font-bold text-primary">
                                          {item.cantidadAComprar > 0 ? formatCurrency(item.costoTotalFaltante) : '-'}
                                      </TableCell>
                                      </TableRow>
                                  ))}
                                  </TableBody>
                                   <TableFooter>
                                    <TableRow className="bg-muted/10">
                                        <TableCell colSpan={5} className="text-right font-bold text-lg">Total a invertir con {providerName}:</TableCell>
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
                  <p className="text-4xl font-bold text-primary">{formatCurrency(totalInvestment)}</p>
                  <p className="text-xs text-muted-foreground italic">Cálculo basado en el presupuesto oficial vinculado.</p>
              </div>
          </CardFooter>
        </Card>
      </div>
  );
}

export default function ListaDeComprasPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
        <ListaDeComprasContent/>
    </Suspense>
  )
}
