
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    ArrowLeft, Loader2, AlertTriangle, ClipboardCheck, Printer, ChefHat, 
    Music2, Palette, Clock, GlassWater, CakeSlice, Users, MapPin, 
    CalendarDays, Edit3, Camera, UserCheck, FileText, CheckCircle2, 
    Info, Package, Sparkles, Archive, Wallet, Gift, Download, ShoppingCart, Truck,
    Layers, PackageSearch, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateModulosContratadosFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getMenuById, getMenus } from '@/app/actions/menus-catering';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { getInsumos } from '@/app/actions/insumos';
import { getInvoiceById } from '@/app/actions/invoices';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// --- HELPERS ---
const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "No definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Inválida"; }
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

// --- TYPES ---
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
  isOrder?: boolean;
}

function ResumenPlanificacionContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const [fiestaData, emps, rolesData, allMenus, catalogoInsumos] = await Promise.all([
        getFiestaById(fiestaId),
        getEmpleados(),
        getRoles(),
        getMenus(),
        getInsumos()
      ]);
      
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      setFiesta(fiestaData);
      setEmpleados(emps);
      setRoles(rolesData);

      let presupuestoData = null;
      if (fiestaData.presupuestoId) {
          presupuestoData = await getPresupuestoById(fiestaData.presupuestoId);
          setPresupuesto(presupuestoData);
      }

      if (fiestaData.menuAsignadoId) {
        const menuData = await getMenuById(fiestaData.menuAsignadoId);
        setMenu(menuData);
      }

      // --- GENERACIÓN DE LISTA DE COMPRAS PARA CONSOLIDADO ---
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
                      const qtyPerPerson = parseSafeNumber(ing.quantityPerPerson);
                      if (qtyPerPerson > 0) {
                          const catalogInsumo = catalogoInsumos.find(ci => ci.id === ing.origenId);
                          rawList.push({
                              nombre: ing.name,
                              cantidadNecesaria: qtyPerPerson * targetGuests,
                              unit: ing.unit,
                              costoUnitario: catalogInsumo?.valorUnitarioEstimado || ing.costoUnitario,
                              proveedor: ing.proveedor || catalogInsumo?.proveedor || 'Sin especificar',
                              origen: catalogDish.name,
                              origenId: ing.origenId,
                          });
                      }
                  });
              }
          });
      }

      // Repostería y Bebidas
      if (fiestaData.reposteria?.categorias) {
          fiestaData.reposteria.categorias.filter(c => c.activada).forEach(cat => {
              cat.items.forEach(item => {
                  rawList.push({
                      nombre: item.nombre,
                      cantidadNecesaria: item.cantidad || 1,
                      unit: item.unidad || 'Unidad',
                      costoUnitario: item.costoEstimado || 0,
                      proveedor: item.proveedor || 'Sin especificar',
                      origen: cat.nombreDisplay,
                      origenId: item.origenId,
                      isOrder: true
                  });
              });
          });
      }

      const consolidated: Record<string, ShoppingListItem> = {};
      rawList.forEach(raw => {
          const key = `${raw.nombre.toLowerCase()}-${raw.proveedor.toLowerCase()}`;
          if (consolidated[key]) {
              consolidated[key].cantidadNecesaria += raw.cantidadNecesaria;
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
          return {
              ...item,
              cantidadAComprar: faltante,
              costoTotalFaltante: item.costoUnitario * faltante
          };
      });

      setShoppingList(finalList);

    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error al cargar consolidado", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => window.print();

  const gastronomiaFallback = useMemo(() => {
    if (menu) return null;
    if (!presupuesto) return null;

    const items = presupuesto.itemsPresupuestados.filter(i => 
        ['Entrada', 'Plato Principal', 'Postre', 'Menú Infantil/Adolescente'].includes(i.categoriaServicio || '') ||
        i.nombreServicio.toLowerCase().includes('entrada') ||
        i.nombreServicio.toLowerCase().includes('principal') ||
        i.nombreServicio.toLowerCase().includes('postre')
    );

    if (items.length === 0) return null;

    return {
        entradas: items.filter(i => i.categoriaServicio === 'Entrada' || i.nombreServicio.toLowerCase().includes('entrada')),
        principales: items.filter(i => i.categoriaServicio === 'Plato Principal' || i.nombreServicio.toLowerCase().includes('principal')),
        postres: items.filter(i => i.categoriaServicio === 'Postre' || i.nombreServicio.toLowerCase().includes('postre')),
        infantiles: items.filter(i => i.categoriaServicio === 'Menú Infantil/Adolescente' || i.nombreServicio.toLowerCase().includes('niño'))
    };
  }, [menu, presupuesto]);

  if (isLoading) return <div className="flex flex-col items-center justify-center h-screen space-y-4"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="font-bold uppercase tracking-widest text-slate-400">Generando Consolidado...</p></div>;
  if (error || !fiesta) return <div className="text-center p-8 text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-4" />{error}</div>;

  const totalInvitados = (presupuesto?.invitadosAdultos || 0) + (presupuesto?.invitadosNinos || 0) + (presupuesto?.invitadosAdolescentes || 0) || Number(fiesta.configuracion.invitadosEstimados) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20"><ClipboardCheck className="w-6 h-6" /></div>
          <h1 className="text-3xl font-bold tracking-tighter font-headline text-primary uppercase">Consolidado del Evento</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="secondary" className="rounded-xl font-bold"><Printer className="w-4 h-4 mr-2"/>Imprimir / PDF</Button>
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      {/* CABECERA MAESTRA */}
      <Card className="shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
        <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-6">
                    <div>
                        <Badge className="bg-primary text-white border-none font-black text-[10px] tracking-widest uppercase mb-3 px-4 py-1 rounded-full">
                            {fiesta.configuracion.tipoCelebracion || 'Evento Social'}
                        </Badge>
                        <h2 className="text-4xl md:text-6xl font-black font-headline uppercase leading-none">{fiesta.configuracion.nombreEvento}</h2>
                        <p className="text-slate-400 font-bold flex items-center gap-2 mt-3 uppercase tracking-widest text-sm"><MapPin className="w-4 h-4 text-primary"/> {fiesta.configuracion.nombreLugar}</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fecha</span>
                            <span className="text-lg font-bold">{formatDate(fiesta.configuracion.fechaEvento)}</span>
                        </div>
                        <div className="w-px bg-white/10 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Horario</span>
                            <span className="text-lg font-bold">{fiesta.configuracion.horaInicio} - {fiesta.configuracion.horaFin || 'Fin'}</span>
                        </div>
                        <div className="w-px bg-white/10 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Capacidad</span>
                            <span className="text-lg font-bold">{totalInvitados} Personas</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center items-center md:items-end gap-4">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl text-center md:text-right min-w-[200px]">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Inversión Pactada</p>
                        <p className="text-4xl font-black text-primary">{formatCurrency(Number(fiesta.configuracion.presupuestoEstimado))}</p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
            
            {/* LOGÍSTICA DE CARGA (VISUALIZACIÓN DIRECTA) */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-900 text-white p-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                            <PackageSearch className="w-5 h-5 text-primary"/> Logística de Carga
                        </CardTitle>
                        <Link href={`/fiestas/nueva/carga-operativa/pdf?fiestaId=${fiestaId}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black border border-white/20 text-white hover:bg-white/10">VER HOJA DE CARGA</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-80">
                        <div className="p-6 space-y-6">
                            {fiesta.listaDeCargaOperativa?.categorias.map(cat => (
                                <div key={cat.id} className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60 border-b pb-1">{cat.nombre}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {cat.items.map(item => (
                                            <div key={item.id} className={cn("p-2 rounded-lg flex justify-between items-center text-xs border", item.hasConflict ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100")}>
                                                <span className={cn("font-bold", item.hasConflict ? "text-rose-700" : "text-slate-700")}>{item.nombre}</span>
                                                <Badge variant="outline" className={cn("font-black", item.hasConflict ? "border-rose-300 text-rose-600" : "border-slate-200")}>{item.cantidad} {item.unidad}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {(!fiesta.listaDeCargaOperativa?.categorias || fiesta.listaDeCargaOperativa.categorias.length === 0) && (
                                <p className="text-center py-10 text-slate-400 italic text-sm">No hay una lista de carga generada.</p>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* LISTA DE COMPRAS (VISUALIZACIÓN DIRECTA) */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-emerald-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                            <ShoppingCart className="w-5 h-5"/> Insumos a Comprar
                        </CardTitle>
                        <Link href={`/fiestas/nueva/catering/lista-compras?fiestaId=${fiestaId}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black border border-white/20 text-white hover:bg-white/10">GESTIONAR COMPRAS</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-80">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="border-slate-100">
                                    <TableHead className="pl-8 text-[10px] font-black uppercase">Insumo</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase">Cantidad</TableHead>
                                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Proveedor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shoppingList.map(item => (
                                    <TableRow key={item.id} className="border-slate-50">
                                        <TableCell className="pl-8 py-3">
                                            <p className="font-bold text-slate-700 text-xs">{item.nombre}</p>
                                            <p className="text-[9px] text-slate-400 uppercase font-medium">Ref: {item.origen}</p>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-xs">{item.cantidadAComprar.toFixed(1)} {item.unit}</TableCell>
                                        <TableCell className="text-right pr-8"><Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-500 border-none font-black uppercase">{item.proveedor}</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {shoppingList.length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="py-10 text-center text-slate-400 italic text-sm">No se han detectado insumos para comprar.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="bg-emerald-50 p-4 flex justify-between items-center border-t border-emerald-100">
                    <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Inversión Total Proyectada</p>
                    <p className="text-xl font-black text-emerald-700">{formatCurrency(shoppingList.reduce((s,i) => s + i.costoTotalFaltante, 0))}</p>
                </CardFooter>
            </Card>

            {/* PLAN GASTRONÓMICO */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-primary/5 border-b border-primary/10 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <ChefHat className="w-5 h-5"/> Detalle Gastronómico
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    {menu ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {['Entrada', 'Plato Principal', 'Postre', 'Menú Infantil/Adolescente'].map(tipo => {
                                const items = menu.items.filter(i => i.type === tipo);
                                if (items.length === 0) return null;
                                return (
                                    <div key={tipo} className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {tipo}
                                        </h4>
                                        <div className="space-y-2">
                                            {items.map(i => (
                                                <div key={i.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs text-slate-700">
                                                    {i.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : gastronomiaFallback ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {Object.entries(gastronomiaFallback).map(([tipo, items]) => {
                                if (items.length === 0) return null;
                                return (
                                    <div key={tipo} className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {tipo.toUpperCase()}
                                        </h4>
                                        <div className="space-y-2">
                                            {items.map((i, idx) => (
                                                <div key={idx} className="p-3 bg-amber-50/30 rounded-xl border border-amber-100 font-bold text-xs text-slate-700">
                                                    {i.nombreServicio}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-center py-10 text-slate-400 italic">No hay platos definidos.</p>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-4 space-y-8">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary"/> Personal
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {fiesta.personalAsignado?.map((pa, idx) => {
                            const emp = empleados.find(e => e.id === pa.empleadoId);
                            const rol = roles.find(r => r.id === pa.rolId);
                            return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="min-w-0">
                                        <p className="font-bold text-xs text-slate-800 truncate">{emp?.nombre || 'VACANTE'}</p>
                                        <p className="text-[8px] font-black text-primary uppercase tracking-tighter">{rol?.nombre}</p>
                                    </div>
                                    <Badge className={cn("h-5 text-[8px] font-black border-none", emp ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-600")}>
                                        {emp ? "OK" : "PEND"}
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-slate-900 text-white">
                <CardHeader className="p-6 border-b border-white/5">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <Clock className="w-5 h-5 text-primary"/> Itinerario
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-64">
                        <div className="divide-y divide-white/5">
                            {fiesta.programa?.map(item => (
                                <div key={item.id} className="p-4 flex items-start gap-4">
                                    <span className="text-primary font-black font-mono text-xs">{item.hora}</span>
                                    <p className="font-bold text-xs leading-tight">{item.titulo}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>

      <footer className="text-center py-12 border-t border-slate-100 space-y-2 print:mt-10">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Sistema de Planificación Consolidada AK Producciones</p>
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Generado el {new Date().toLocaleDateString('es-ES')}</p>
      </footer>
    </div>
  );
}

export default function ResumenPlanificacionPage() {
  return (
    <Suspense fallback={null}>
        <ResumenPlanificacionContent />
    </Suspense>
  )
}
