'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, AlertTriangle, Printer, ShoppingCart, Truck, RefreshCw, Info, Cake, MessageSquare, Copy, Check, UtensilsCrossed } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
  proveedorId: string;
  origen: string;
  origenId?: string;
  isOrder?: boolean; // If true, it's an order to a provider (like pastry)
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const parseSafeNumber = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    let str = String(val).trim();
    if (!str) return 0;
    if (str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
    else {
        const parts = str.split('.');
        if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) str = str.replace(/\./g, '');
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
};

const toProviderKey = (provider?: string): string => {
    const normalized = (provider || 'Sin especificar')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || 'sin-especificar';
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

  // Platos contratados que no aportan ni un ingrediente a la lista. Antes se
  // salteaban en silencio: la cocina compraba sin saber que le faltaba un plato
  // entero, y se enteraba el dia de la fiesta.
  const [platosSinIngredientes, setPlatosSinIngredientes] = useState<string[]>([]);
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
          const sinIngredientes: string[] = [];

          budgetDishes.forEach(budgetItem => {
              const catalogDish = allDishesInCatalog.find(d => d.id === budgetItem.idServicioCatalogo);
              if (!catalogDish) {
                  sinIngredientes.push(`${budgetItem.nombreServicio} (ya no está en el menú)`);
                  return;
              }
              if (!catalogDish.ingredients?.length) {
                  sinIngredientes.push(catalogDish.name);
              }
              if (catalogDish) {
                  const targetGuests = getTargetGuests(budgetItem);
                  catalogDish.ingredients.forEach(ing => {
                      const qtyPerPerson = parseSafeNumber(ing.quantityPerPerson);
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

          setPlatosSinIngredientes(Array.from(new Set(sinIngredientes)));

          // 2. PROCESAR BEBIDAS (Todas las categorías activadas)
          if (fiestaData.bebidas?.categorias) {
              fiestaData.bebidas.categorias.filter(c => c.activada).forEach(cat => {
                  cat.items?.forEach(item => {
                      // Si la cantidad quedó en cero es porque no se pide: antes se
                      // compraba una unidad igual.
                      if (Number(item.cantidadNecesaria) === 0) return;
                      const catalogInsumo = catalogoInsumos.find(ci => ci.id === item.origenId);
                      rawList.push({
                          nombre: item.nombre,
                          cantidadNecesaria: item.cantidadNecesaria || 1,
                          unit: item.unidadCantidad || 'Unidad',
                          costoUnitario: catalogInsumo?.valorUnitarioEstimado || item.costoUnitario || 0,
                          proveedor: item.proveedorHabitual || catalogInsumo?.proveedor || 'Proveedor Bebidas',
                          origen: `Bebidas: ${cat.nombreDisplay}`,
                          origenId: item.origenId,
                          isOrder: true
                      });
                  });
                  cat.recetas?.forEach((receta: any) => {
                      const factorEscala = totalInvitados / (receta.porcionesBase || 1);
                      receta.ingredientes?.forEach((ing: any) => {
                          const totalNeeded = (ing.cantidad || 0) * (isNaN(factorEscala) ? 1 : factorEscala);
                          if (totalNeeded > 0) {
                              const catalogInsumo = catalogoInsumos.find(ci => ci.id === ing.id);
                              rawList.push({
                                  nombre: ing.nombre,
                                  cantidadNecesaria: totalNeeded,
                                  unit: ing.unidad || 'Unidad',
                                  costoUnitario: catalogInsumo?.valorUnitarioEstimado || ing.costoUnitario || 0,
                                  proveedor: catalogInsumo?.proveedor || 'Proveedor Bebidas',
                                  origen: `Bebidas (Receta): ${receta.nombre}`,
                                  origenId: ing.id,
                              });
                          }
                      });
                  });
              });
          } else {
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
      }

      // 3. PROCESAR REPOSTERÍA
      if (fiestaData.reposteria?.categorias) {
          fiestaData.reposteria.categorias.filter(c => c.activada).forEach(cat => {
              cat.items.forEach(item => {
                  // Igual que en bebidas: cantidad cero es "no se pide".
                  if (Number(item.cantidad) === 0) return;
                  rawList.push({
                      nombre: item.nombre,
                      cantidadNecesaria: item.cantidad || 1,
                      unit: item.unidad || 'Unidad',
                      costoUnitario: item.costoEstimado || 0,
                      proveedor: item.proveedor || 'Sin especificar',
                      origen: `Repostería: ${cat.nombreDisplay}`,
                      origenId: item.origenId,
                      isOrder: true
                  });
              });
          });
      }

      // 4. CONSOLIDAR
      const consolidated: Record<string, ShoppingListItem> = {};
      rawList.forEach(raw => {
          const matchedInsumo = catalogoInsumos.find(ci => ci.id === raw.origenId);
          const resolvedProvider = matchedInsumo?.proveedor || raw.proveedor || 'Sin especificar';
          const rawProveedorId = toProviderKey(resolvedProvider);
          const key = `${raw.nombre.toLowerCase()}-${rawProveedorId}`;
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
                  proveedor: resolvedProvider,
                  proveedorId: rawProveedorId,
                  origen: raw.origen,
                  origenId: raw.origenId,
                  isOrder: raw.isOrder
              };
          }
      });

      const finalList = Object.values(consolidated).map(item => {
          const faltante = item.isOrder ? item.cantidadNecesaria : Math.max(0, item.cantidadNecesaria - item.stockDisponible);
          
          // ALINEACIÓN CON REGLA DE AUDITORÍA:
          const recipeUnit = (item.unit || '').toLowerCase().trim();
          const catalogItem = catalogoInsumos.find(ci => ci.id === item.origenId);
          const catalogUnit = (catalogItem?.unidad || '').toLowerCase().trim();
          
          const isSmallRecipeUnit = ['g', 'gramos', 'ml', 'cc', 'cc.', 'no definido'].includes(recipeUnit);
          const isSmallCatalogUnit = ['g', 'gramos', 'ml', 'cc', 'cc.'].includes(catalogUnit);

          let factor = 1;
          if (isSmallRecipeUnit && !isSmallCatalogUnit) {
              factor = 1000;
          }

          // Lo que hay que comprar se redondea SIEMPRE para arriba. La receta da
          // numeros con coma (0,25 litros por persona por 83 personas son 20,75
          // litros) y en la practica se compran botellas y paquetes enteros:
          // anotar 20,75 y comprar 20 es quedarse sin bebida en la fiesta. De mas
          // sobra un poco; de menos no hay como resolverlo a las dos de la manana.
          const aComprar = Math.ceil(faltante);

          return {
              ...item,
              cantidadAComprar: aComprar,
              costoTotalFaltante: Math.round(item.costoUnitario * (aComprar / factor))
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
      const pId = item.proveedorId;
      if (!acc[pId]) acc[pId] = { providerName: item.proveedor || 'Sin especificar', items: [], total: 0 };
      acc[pId].items.push(item);
      acc[pId].total += item.costoTotalFaltante;
      return acc;
    }, {} as Record<string, { providerName: string, items: ShoppingListItem[], total: number }>);
  }, [shoppingList]);
  
  const handleStatusChange = async (proveedorId: string, proveedorName: string, field: 'pedido' | 'pagado' | 'entregadoParcial' | 'montoPagado', value: any) => {
    if (!fiestaId) return;
    setIsSavingStatus(proveedorId);
    const updatedEstados = [...estadosCompra];
    let estadoProveedor = updatedEstados.find(e => (e.proveedorId === proveedorId) || (e.proveedor === proveedorName));
    if (estadoProveedor) {
        estadoProveedor.proveedorId = proveedorId; // migración
        (estadoProveedor as any)[field] = value;
    }
    else {
        updatedEstados.push({ 
            proveedor: proveedorName, 
            proveedorId, 
            pedido: field === 'pedido' ? value : false, 
            pagado: field === 'pagado' ? value : false,
            entregadoParcial: field === 'entregadoParcial' ? value : false,
            montoPagado: field === 'montoPagado' ? value : 0
        });
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

  const [copiedProviderId, setCopiedProviderId] = useState<string | null>(null);

  const buildProviderOrderMessage = (providerName: string, items: ShoppingListItem[]) => {
    const nombreEvento = fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.clienteNombre || 'Evento AK Producciones';
    const fechaEvento = fiesta?.configuracion?.fechaEvento || '';

    let msg = `*Pedido de Insumos - AK Producciones*\n`;
    msg += `🎉 *Evento:* ${nombreEvento}${fechaEvento ? ` (${fechaEvento})` : ''}\n`;
    msg += `📦 *Proveedor:* ${providerName}\n\n`;
    msg += `*Detalle del pedido:*\n`;
    items.forEach((item) => {
      const isInteger = item.unit.toLowerCase() === 'u' || item.unit.toLowerCase() === 'un' || item.unit.toLowerCase() === 'unidad' || item.unit.toLowerCase() === 'unidades';
      const qty = isInteger ? Math.round(item.cantidadNecesaria) : Number(item.cantidadNecesaria || 0).toFixed(2);
      msg += `• ${item.nombre}: ${qty} ${item.unit}\n`;
    });
    msg += `\nPor favor confirmar disponibilidad y fecha de entrega. ¡Muchas gracias!`;
    return msg;
  };

  const handleSendWhatsAppOrder = (providerName: string, items: ShoppingListItem[]) => {
    const msg = buildProviderOrderMessage(providerName, items);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyOrderText = async (providerId: string, providerName: string, items: ShoppingListItem[]) => {
    const msg = buildProviderOrderMessage(providerName, items);
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedProviderId(providerId);
      toast({ title: "Pedido copiado al portapapeles", description: `Listo para enviar a ${providerName}.` });
      setTimeout(() => setCopiedProviderId(null), 2500);
    } catch {
      toast({ title: "No se pudo copiar", description: "Copiá el texto manualmente.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 p-4">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-64" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        {/* Stats Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>

        {/* Categories Skeletons */}
        <div className="space-y-4 mt-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-slate-200">
              <CardHeader className="bg-slate-50 border-b flex flex-row items-center gap-3 py-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Compras y Pedidos</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => loadData(true)}><RefreshCw className="w-4 h-4 mr-2"/>Actualizar</Button>
            <Button onClick={() => window.print()} variant="outline"><Printer className="w-4 h-4 mr-2"/>PDF</Button>
            <Button asChild><Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Link></Button>
          </div>
        </div>
        
        {platosSinIngredientes.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="font-bold text-amber-900">
              Ojo: hay platos contratados que no aportan nada a esta lista
            </p>
            <p className="mt-1 text-sm text-amber-800">
              No tienen ingredientes cargados, así que la cocina no va a saber qué comprar para
              ellos. Cargá los ingredientes en el menú y volvé a actualizar.
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-amber-900">
              {platosSinIngredientes.map(nombre => <li key={nombre}>{nombre}</li>)}
            </ul>
          </div>
        )}

        {Object.keys(groupedByProvider).length === 0 ? (
          <Card className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/70 p-10 text-center shadow-none">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4 shadow-sm">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">
              No hay ingredientes ni insumos para comprar aún
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
              Esta pantalla calcula automáticamente las compras según los platos contratados y sus ingredientes. Si el evento aún no tiene menú seleccionado o los platos no tienen ingredientes cargados, la lista queda en cero.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/fiestas/nueva/catering/menu${fiestaId ? `?id=${fiestaId}` : ''}`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm hover:bg-primary/90 transition-colors"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Cargar Menú y Platos
              </Link>
              <Link
                href={`/fiestas/nueva/catering/bebidas${fiestaId ? `?id=${fiestaId}` : ''}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                Configurar Bebidas y Barra
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {Object.keys(groupedByProvider).map(providerId => {
                const { providerName, items, total } = groupedByProvider[providerId];
                const estadoActual = estadosCompra.find(e => e.proveedorId === providerId || e.proveedor === providerName) || { pedido: false, pagado: false, entregadoParcial: false, montoPagado: 0 };
                const isSavingThis = isSavingStatus === providerId;
                
                return (
                    <Card key={providerId} className="shadow-lg border-none rounded-[2rem] overflow-hidden bg-white print:shadow-none print:border">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                    <Truck className="w-6 h-6 text-primary"/>
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tighter text-slate-800">{providerName}</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Total a invertir: {formatCurrency(total)}</CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 bg-white p-3 px-6 rounded-2xl border shadow-sm print:hidden">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Switch id={`pedido-${providerId}`} checked={estadoActual.pedido} onCheckedChange={(val) => handleStatusChange(providerId, providerName, 'pedido', val)} disabled={isSavingThis} />
                                    <Label htmlFor={`pedido-${providerId}`} className="font-black text-[10px] uppercase tracking-widest text-slate-600">PEDIDO</Label>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                    <Switch id={`entregado-${providerId}`} checked={estadoActual.entregadoParcial} onCheckedChange={(val) => handleStatusChange(providerId, providerName, 'entregadoParcial', val)} disabled={isSavingThis} />
                                    <Label htmlFor={`entregado-${providerId}`} className="font-black text-[10px] uppercase tracking-widest text-blue-600">ENTREGADO</Label>
                                </div>
                                <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Switch id={`pagado-${providerId}`} checked={estadoActual.pagado} onCheckedChange={(val) => handleStatusChange(providerId, providerName, 'pagado', val)} disabled={isSavingThis} />
                                    <Label htmlFor={`pagado-${providerId}`} className="font-black text-[10px] uppercase tracking-widest text-emerald-600">PAGADO TOTAL</Label>
                                </div>
                                {!estadoActual.pagado && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Label htmlFor={`monto-${providerId}`} className="font-bold text-[10px] uppercase text-slate-400">A Cuenta:</Label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                                            <Input 
                                                id={`monto-${providerId}`}
                                                type="number"
                                                className="w-24 h-8 text-xs font-bold pl-6 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary"
                                                value={estadoActual.montoPagado || ''}
                                                onChange={(e) => handleStatusChange(providerId, providerName, 'montoPagado', Number(e.target.value))}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                )}
                                {isSavingThis && <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto"/>}

                                <div className="h-6 w-px bg-slate-200 mx-1 hidden xl:block"></div>

                                <div className="flex items-center gap-1.5 ml-auto">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCopyOrderText(providerId, providerName, items)}
                                        className="h-8 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-100"
                                        title="Copiar texto del pedido"
                                    >
                                        {copiedProviderId === providerId ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5 mr-1" />
                                                Copiar
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleSendWhatsAppOrder(providerName, items)}
                                        className="h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                        title="Enviar lista a WhatsApp"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                        WhatsApp
                                    </Button>
                                </div>
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
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {item.isOrder && <Cake className="w-3.5 h-3.5 text-primary opacity-60"/>}
                                                    <p className="font-bold text-slate-700">{item.nombre}</p>
                                                </div>
                                                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">Ref: {item.origen}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-black text-slate-800">{item.cantidadNecesaria.toFixed(2)}</TableCell>
                                            <TableCell className="text-[10px] font-black text-slate-400 uppercase">{item.unit}</TableCell>
                                            <TableCell className="text-right pr-8 font-black text-primary">{item.costoTotalFaltante > 0 ? formatCurrency(item.costoTotalFaltante) : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                );
            })}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 print:hidden">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
                <div className="flex flex-wrap items-center gap-3">
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
