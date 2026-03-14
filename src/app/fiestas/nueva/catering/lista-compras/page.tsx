
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, AlertTriangle, Printer, ShoppingCart, Truck, RefreshCw, Info, Cake } from 'lucide-react';
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
  isOrder?: boolean; // If true, it's an order to a provider (like pastry)
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

      const adultos = presupuestoData?.invitadosAdultos || Number(fiestaData.configuracion.invitadosEstimados) || 0;
      const ninos = (presupuestoData?.invitadosNinos || 0) + (presupuestoData?.invitadosAdolescentes || 0);
      const totalInvitados = adultos + ninos;

      let rawList: any[] = [];

      const getTargetGuests = (item: { categoriaServicio?: string, nombreServicio: string }) => {
          const cat = (item.categoriaServicio || '').toLowerCase();
          const name = (item.nombreServicio || '').toLowerCase();
          if (cat.includes('infantil') || cat.includes('adolescente') || name.includes('niño')) return ninos;
          if (cat.includes('plato principal') || name.includes('principal')) return adultos;
          return totalInvitados;
      };

      // 1. PROCESAR PLATOS DEL PRESUPUESTO
      if (presupuestoData) {
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
                      const qtyPerPerson = parseFloat(String(ing.quantityPerPerson || '0').replace(',', '.'));
                      if (qtyPerPerson > 0) {
                          const totalNeeded = qtyPerPerson * targetGuests;
                          const catalogInsumo = catalogoInsumos.find(ci => ci.id === ing.origenId);
                          rawList.push({
                              nombre: ing.name,
                              cantidadNecesaria: totalNeeded,
                              unit: ing.unit,
                              costoUnitario: catalogInsumo?.valorUnitarioEstimado || ing.costoUnitario,
                              proveedor: ing.proveedor || catalogInsumo?.proveedor || 'Sin especificar',
                              origen: `Catering: ${catalogDish.name}`,
                              origenId: ing.origenId,
                          });
                      }
                  });
              }
          });

          // 2. PROCESAR BARRA DE TRAGOS
          const hasBarra = presupuestoData.itemsPresupuestados.some(item => 
              item.nombreServicio.toLowerCase().includes('barra') || item.nombreServicio.toLowerCase().includes('licuado')
          );
          if (hasBarra) {
              const barraTemplate = defaultBebidasData.categorias.find(c => c.id === 'barra_tragos');
              barraTemplate?.items.forEach(item => {
                  const totalNeeded = (item.cantidadNecesaria || 0) * totalInvitados;
                  const catalogInsumo = catalogoInsumos.find(ci => ci.id === item.origenId);
                  rawList.push({
                      nombre: item.nombre,
                      cantidadNecesaria: totalNeeded,
                      unit: item.unidadCantidad || 'L',
                      costoUnitario: catalogInsumo?.valorUnitarioEstimado || item.costoUnitario || 0,
                      proveedor: catalogInsumo?.proveedor || 'Proveedor Bebidas',
                      origen: 'Barra de Tragos',
                      origenId: item.origenId,
                  });
              });
          }
      }

      // 3. PROCESAR REPOSTERÍA (Desde el Planificador de la Fiesta)
      if (fiestaData.reposteria?.categorias) {
          fiestaData.reposteria.categorias.filter(c => c.activada).forEach(cat => {
              cat.items.forEach(item => {
                  rawList.push({
                      nombre: item.nombre,
                      cantidadNecesaria: item.cantidad || 1,
                      unit: item.unidad || 'Unidad',
                      costoUnitario: item.costoEstimado || 0,
                      proveedor: item.proveedor || 'Sin especificar',
                      origen: `Repostería: ${cat.nombreDisplay}`,
                      origenId: item.origenId,
                      isOrder: true // Marcamos que es un pedido por encargo
                  });
              });
          });
      }

      // 4. CONSOLIDAR
      const consolidated: Record<string, ShoppingListItem> = {};
      rawList.forEach(raw => {
          const key = `${raw.nombre.toLowerCase()}-${raw.proveedor.toLowerCase()}`;
          if (consolidated[key]) {
              consolidated[key].cantidadNecesaria += raw.cantidadNecesaria;
              if (!consolidated[key].origen.includes(raw.origen)) consolidated[key].origen += `, ${raw.origen}`;
          } else {
              const catalogItem = catalogoInsumos.find(ci => ci.id === raw.origenId);
              consolidated[key] = {
                  id: key,
                  nombre: raw.nombre,
                  cantidadNecesaria: raw.cantidadNecesaria,
                  stockDisponible: catalogItem?.cantidadDisponible || 0,
                  cantidadAComprar: 0,
                  unit: raw.unit,
                  costoUnitario: raw.costoUnitario,
                  costoTotalFaltante: 0,
                  proveedor: raw.proveedor,
                  origen: raw.origen,
                  origenId: raw.origenId,
                  isOrder: raw.isOrder
              };
          }
      });

      const finalList = Object.values(consolidated).map(item => {
          const faltante = item.isOrder ? item.cantidadNecesaria : Math.max(0, item.cantidadNecesaria - item.stockDisponible);
          const factorUnidad = ['unidad', 'un', 'uds', 'u', 'docena', 'pack'].some(u => item.unit?.toLowerCase().includes(u)) ? 1 : 1000;
          return {
              ...item,
              cantidadAComprar: faltante,
              costoTotalFaltante: Math.round(item.costoUnitario * (faltante / (item.isOrder ? 1 : factorUnidad)))
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
  
  const groupedByProvider = useMemo(() => {
    return shoppingList.reduce((acc, item) => {
      const provider = item.proveedor || 'Sin especificar';
      if (!acc[provider]) acc[provider] = { items: [], total: 0 };
      acc[provider].items.push(item);
      acc[provider].total += item.costoTotalFaltante;
      return acc;
    }, {} as Record<string, { items: ShoppingListItem[], total: number }>);
  }, [shoppingList]);
  
  const handleStatusChange = async (proveedor: string, field: 'pedido' | 'pagado', value: boolean) => {
    if (!fiestaId) return;
    setIsSavingStatus(proveedor);
    const updatedEstados = [...estadosCompra];
    let estadoProveedor = updatedEstados.find(e => e.proveedor === proveedor);
    if (estadoProveedor) estadoProveedor[field] = value;
    else updatedEstados.push({ proveedor, pedido: field === 'pedido' ? value : false, pagado: field === 'pagado' ? value : false });
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

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Consolidando pedidos y compras...</p></div>;

  return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Compras y Pedidos</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => loadData(true)}><RefreshCw className="w-4 h-4 mr-2"/>Actualizar</Button>
            <Button onClick={() => window.print()} variant="outline"><Printer className="w-4 h-4 mr-2"/>PDF</Button>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
            {Object.keys(groupedByProvider).map(providerName => {
                const { items, total } = groupedByProvider[providerName];
                const estadoActual = estadosCompra.find(e => e.provider === providerName) || { pedido: false, pagado: false };
                const isSavingThis = isSavingStatus === providerName;
                
                return (
                    <Card key={providerName} className="shadow-lg border-none rounded-[2rem] overflow-hidden bg-white print:shadow-none print:border">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                    <Truck className="w-6 h-6 text-primary"/>
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tighter text-slate-800">{providerName}</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Total a invertir: {formatCurrency(total)}</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 bg-white p-2 px-6 rounded-2xl border shadow-sm print:hidden">
                                <div className="flex items-center gap-2">
                                    <Switch id={`pedido-${providerName}`} checked={estadoActual.pedido} onCheckedChange={(val) => handleStatusChange(providerName, 'pedido', val)} disabled={isSavingThis} />
                                    <Label htmlFor={`pedido-${providerName}`} className="font-black text-[10px] uppercase tracking-widest text-slate-600">PEDIDO</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch id={`pagado-${providerName}`} checked={estadoActual.pagado} onCheckedChange={(val) => handleStatusChange(providerName, 'pagado', val)} disabled={isSavingThis} />
                                    <Label htmlFor={`pagado-${providerName}`} className="font-black text-[10px] uppercase tracking-widest text-emerald-600">PAGADO</Label>
                                </div>
                                {isSavingThis && <Loader2 className="w-4 h-4 animate-spin text-primary"/>}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-100">
                                        <TableHead className="pl-8 text-[10px] font-black uppercase text-slate-400">Insumo / Postre</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase text-slate-400">Cantidad</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400">Unidad</TableHead>
                                        <TableHead className="text-right pr-8 text-[10px] font-black uppercase text-slate-400">Inversión Est.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50 group">
                                            <TableCell className="pl-8 py-4">
                                                <div className="flex items-center gap-2">
                                                    {item.isOrder && <Cake className="w-3.5 h-3.5 text-primary opacity-60"/>}
                                                    <p className="font-bold text-slate-700">{item.nombre}</p>
                                                </div>
                                                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">Ref: {item.origen}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-black text-slate-800">{item.cantidadAComprar.toFixed(2)}</TableCell>
                                            <TableCell className="text-[10px] font-black text-slate-400 uppercase">{item.unit}</TableCell>
                                            <TableCell className="text-right pr-8 font-black text-primary">{item.cantidadAComprar > 0 ? formatCurrency(item.costoTotalFaltante) : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                );
            })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 print:hidden">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-blue-500"/>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inversión Total Proyectada:</p>
                </div>
                <p className="text-3xl font-black text-primary">{formatCurrency(totalInvestment)}</p>
            </div>
        </div>
      </div>
  );
}

export default function ListaDeComprasPage() {
  return (
    <Suspense fallback={null}>
        <ListaDeComprasContent/>
    </Suspense>
  )
}
