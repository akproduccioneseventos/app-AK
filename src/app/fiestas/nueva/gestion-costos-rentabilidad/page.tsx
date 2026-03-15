
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, AlertTriangle, BarChart3, PlusCircle, Trash2, DollarSign, ShoppingCart, HardHat, ChefHat, Printer, RefreshCw, Truck, Info, Layers, Banknote, CheckCircle2, UserCheck, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateGestionCostosFiestaActual, updatePagosProveedoresFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultGestionCostos } from '@/lib/fiesta-defaults';
import { getMenuById } from '@/app/actions/menus-catering';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useSearchParams } from 'next/navigation';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getRoles } from '@/app/actions/roles';
import type { Rol } from '@/types/rol';
import type { Presupuesto } from '@/types/presupuesto';
import type { PagoProveedor, CostoItem, CostoCategoria, GestionCostosData, FiestaEnPlanificacion } from '@/types/fiesta';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Badge } from '@/components/ui/badge';

const COST_CATEGORIES: CostoCategoria[] = [
  'Servicio Proveedor',
  'Pago de Salón',
  'Personal Evento', 
  'Compra General', 
  'Marketing y Publicidad',
  'Imprevistos',
  'Otro Costo Directo'
];

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || isNaN(amount)) return '$ 0';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

function GestionCostosRentabilidadContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [presupuestoActual, setPresupuestoActual] = useState<Presupuesto | null>(null);
  const [gestionCostos, setGestionCostos] = useState<GestionCostosData>(defaultGestionCostos);
  const [pagosProveedores, setPagosProveedores] = useState<PagoProveedor[]>([]);
  
  const [costoTotalMenu, setCostoTotalMenu] = useState<number>(0);
  const [costoTotalReposteria, setCostoTotalReposteria] = useState<number>(0);
  const [costoTotalBebidas, setCostoTotalBebidas] = useState<number>(0);
  const [costoTotalPersonal, setCostoTotalPersonal] = useState<number>(0);
  
  const [allRoles, setAllRoles] = useState<Rol[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newCostoNombre, setNewCostoNombre] = useState('');
  const [newCostoCategoria, setNewCostoCategoria] = useState<CostoCategoria>('Otro Costo Directo');
  const [newCostoMontoEstimado, setNewCostoMontoEstimado] = useState<string>('');
  const [newCostoNotas, setNewCostoNotas] = useState('');

  const [newPagoCostoId, setNewPagoCostoId] = useState('');
  const [newPagoFecha, setNewPagoFecha] = useState<Date | undefined>(new Date());
  const [newPagoMonto, setNewPagoMonto] = useState('');
  const [newPagoMetodo, setNewPagoMetodo] = useState('Transferencia');

  const loadData = useCallback(async (showLoading = true) => {
    if(!fiestaId) {
        setError("Falta el ID del evento.");
        setIsLoading(false);
        return;
    }
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const [fiesta, rolesData] = await Promise.all([
        getFiestaById(fiestaId),
        getRoles()
      ]);
      
      if (!fiesta) throw new Error("Fiesta no encontrada.");

      setFiestaActual(fiesta);
      setAllRoles(rolesData);
      setPagosProveedores(fiesta.pagosProveedores || []);
      
      let currentGestionCostos = fiesta.gestionCostos || { ...defaultGestionCostos };
      const invitados = (Number(fiesta.configuracion.invitadosEstimados) || 0);

      // 1. Sincronizar Ingresos desde Presupuesto
      if (fiesta.presupuestoId) {
          const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
          if (presupuesto) {
              setPresupuestoActual(presupuesto);
              // Solo actualizar si no hay un ingreso manual ya definido o si es cero
              if (currentGestionCostos.ingresosTotalesEstimados === 0) {
                  currentGestionCostos.ingresosTotalesEstimados = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
              }
          }
      }

      setGestionCostos(currentGestionCostos);

      // 2. Calcular Costo de Catering (Menú asignado)
      if (fiesta.menuAsignadoId) {
        const menuData = await getMenuById(fiesta.menuAsignadoId);
        if (menuData) {
          const costoPorPersona = menuData.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0);
          setCostoTotalMenu(costoPorPersona * invitados);
        }
      } else {
          setCostoTotalMenu(0);
      }
      
      // 3. Calcular Costo de Repostería
      let tempCostoReposteria = 0;
      fiesta.reposteria?.categorias.forEach(cat => {
        if(cat.activada) cat.items.forEach(item => tempCostoReposteria += (item.costoEstimado || 0) * (item.cantidad || 1));
      });
      setCostoTotalReposteria(tempCostoReposteria);

      // 4. Calcular Costo de Bebidas
      let tempCostoBebidas = 0;
      fiesta.bebidas?.categorias.forEach(cat => {
        if(cat.activada) {
            cat.items.forEach(item => tempCostoBebidas += item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0)));
        }
      });
      setCostoTotalBebidas(tempCostoBebidas);

      // 5. Calcular Costo de Personal (Sueldos + Aportes)
      let tempCostoPersonal = 0;
      fiesta.personalAsignado?.forEach(pa => {
          const rol = rolesData.find(r => r.id === pa.rolId);
          const aportes = (pa.eventSalary * (rol?.porcentajeAportesPatronales || 0)) / 100;
          tempCostoPersonal += pa.eventSalary + aportes;
      });
      setCostoTotalPersonal(tempCostoPersonal);

    } catch (err: any) {
      setError("No se pudieron cargar los datos de costos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCostoItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newCostoNombre.trim() || !newCostoMontoEstimado.trim()) return;
    const newItem: CostoItem = {
      id: `costo_${Date.now()}`,
      nombre: newCostoNombre.trim(),
      category: newCostoCategoria,
      montoEstimado: parseFloat(newCostoMontoEstimado),
      notes: newCostoNotas.trim() || undefined,
    };
    const updated = { ...gestionCostos, costosItems: [...(gestionCostos.costosItems || []), newItem] };
    setGestionCostos(updated);
    setNewCostoNombre(''); setNewCostoMontoEstimado('');
  };

  const handleAddPago = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPagoCostoId || !newPagoMonto || !newPagoFecha || !fiestaId) return;
    
    const newPago: PagoProveedor = {
        id: `pago_${Date.now()}`,
        costoAsociadoId: newPagoCostoId,
        fecha: newPagoFecha.toISOString(),
        monto: parseFloat(newPagoMonto),
        metodoPago: newPagoMetodo
    };

    const updatedPagos = [...pagosProveedores, newPago];
    setPagosProveedores(updatedPagos);
    setIsSaving(true);
    try {
        const result = await updatePagosProveedoresFiestaActual(fiestaId, updatedPagos);
        if (result.success) {
            toast({ title: "Pago registrado", description: "El egreso real ha sido contabilizado." });
            setNewPagoMonto('');
        }
    } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const deletePago = async (pagoId: string) => {
      const updated = pagosProveedores.filter(p => p.id !== pagoId);
      setPagosProveedores(updated);
      if (fiestaId) await updatePagosProveedoresFiestaActual(fiestaId, updated);
  };

  const costItemsForSelect = useMemo(() => {
      const manual = (gestionCostos.costosItems || []).map(i => ({ id: i.id, label: i.nombre }));
      return [
          { id: 'cat_catering', label: 'Catering / Insumos' },
          { id: 'cat_bebidas', label: 'Bebidas y Barra' },
          { id: 'cat_reposteria', label: 'Repostería' },
          { id: 'cat_personal', label: 'Personal (Total)' },
          ...manual
      ];
  }, [gestionCostos.costosItems]);

  const stats = useMemo(() => {
    const totalCostosManuales = (gestionCostos.costosItems || []).reduce((s, i) => s + i.montoEstimado, 0);
    const totalCostosProyectados = totalCostosManuales + costoTotalMenu + costoTotalReposteria + costoTotalBebidas + costoTotalPersonal;
    
    const totalPagosRealizados = pagosProveedores.reduce((s, p) => s + p.monto, 0);
    const balanceReal = (gestionCostos.ingresosTotalesEstimados || 0) - totalPagosRealizados;
    const rentabilidadReal = (gestionCostos.ingresosTotalesEstimados || 0) > 0 ? (balanceReal / gestionCostos.ingresosTotalesEstimados) * 100 : 0;

    return { totalCostosProyectados, totalPagosRealizados, balanceReal, rentabilidadReal };
  }, [gestionCostos, pagosProveedores, costoTotalMenu, costoTotalReposteria, costoTotalBebidas, costoTotalPersonal]);

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      await updateGestionCostosFiestaActual(fiestaId, gestionCostos);
      toast({ title: "Análisis Financiero Guardado" });
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline uppercase">Análisis de Rentabilidad</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => loadData(true)} className="rounded-xl"><RefreshCw className="w-4 h-4 mr-2"/> Sincronizar</Button>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 text-white border-none shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Ingreso Pactado</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-3xl font-black">{formatCurrency(gestionCostos.ingresosTotalesEstimados)}</p>
                  <div className="mt-4 flex gap-2">
                    <Input 
                        type="number" 
                        value={gestionCostos.ingresosTotalesEstimados} 
                        onChange={e => setGestionCostos(p => ({...p, ingresosTotalesEstimados: parseFloat(e.target.value) || 0}))}
                        className="bg-white/10 border-white/10 h-9 text-white font-bold text-xs"
                    />
                    <Badge variant="outline" className="text-white border-white/20">PRESUPUESTO</Badge>
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-primary text-white border-none shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Inversión Real (Egresos)</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-3xl font-black">{formatCurrency(stats.totalPagosRealizados)}</p>
                  <div className="mt-2 text-[10px] font-bold uppercase opacity-80 flex items-center gap-2">
                      <Layers className="w-3 h-3"/> Proyectado: {formatCurrency(stats.totalCostosProyectados)}
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-emerald-600 text-white border-none shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Ganancia Neta Proyectada</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-3xl font-black">{formatCurrency(stats.balanceReal)}</p>
                  <Badge className="mt-2 bg-white/20 text-white border-none font-black text-[10px] tracking-widest">
                      {stats.rentabilidadReal.toFixed(1)}% MARGEN
                  </Badge>
              </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="proyeccion" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-2xl h-14">
              <TabsTrigger value="proyeccion" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Planificación de Costos</TabsTrigger>
              <TabsTrigger value="pagos" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Pagos y Egresos (Real)</TabsTrigger>
          </TabsList>

          <TabsContent value="proyeccion" className="space-y-6 pt-4 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                      <CardHeader className="bg-slate-50 border-b border-slate-100"><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Desglose de Inversión por Área</CardTitle></CardHeader>
                      <CardContent className="p-0">
                          <Table>
                              <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100">
                                    <TableHead className="pl-8 text-[10px] uppercase font-black">Área / Concepto</TableHead>
                                    <TableHead className="text-right pr-8 text-[10px] uppercase font-black">Monto Proyectado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                  <TableRow className="group">
                                      <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><ChefHat className="w-5 h-5 text-primary"/><div><p className="font-bold text-slate-700">Catering / Insumos</p><p className="text-[9px] uppercase font-black text-slate-400">Según receta y menú asignado</p></div></div></TableCell>
                                      <TableCell className="text-right pr-8 font-black text-slate-800">{formatCurrency(costoTotalMenu)}</TableCell>
                                  </TableRow>
                                  <TableRow className="group">
                                      <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><ShoppingCart className="w-5 h-5 text-primary"/><div><p className="font-bold text-slate-700">Bebidas y Barra</p><p className="text-[9px] uppercase font-black text-slate-400">Consumo estimado por invitado</p></div></div></TableCell>
                                      <TableCell className="text-right pr-8 font-black text-slate-800">{formatCurrency(costoTotalBebidas)}</TableCell>
                                  </TableRow>
                                  <TableRow className="group">
                                      <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><PlusCircle className="w-5 h-5 text-primary"/><div><p className="font-bold text-slate-700">Repostería</p><p className="text-[9px] uppercase font-black text-slate-400">Tortas y mesas dulces contratadas</p></div></div></TableCell>
                                      <TableCell className="text-right pr-8 font-black text-slate-800">{formatCurrency(costoTotalReposteria)}</TableCell>
                                  </TableRow>
                                  <TableRow className="group">
                                      <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><UserCheck className="w-5 h-5 text-primary"/><div><p className="font-bold text-slate-700">Personal del Evento</p><p className="text-[9px] uppercase font-black text-slate-400">Sueldos + Aportes patronales</p></div></div></TableCell>
                                      <TableCell className="text-right pr-8 font-black text-slate-800">{formatCurrency(costoTotalPersonal)}</TableCell>
                                  </TableRow>
                                  {gestionCostos.costosItems?.map(item => (
                                      <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors border-slate-50">
                                          <TableCell className="pl-8 py-4">
                                              <div className="flex items-center gap-3">
                                                  <Truck className="w-5 h-5 text-slate-400"/>
                                                  <div>
                                                      <p className="font-bold text-slate-700">{item.nombre}</p>
                                                      <p className="text-[9px] uppercase font-black text-slate-400">{item.category}</p>
                                                  </div>
                                              </div>
                                          </TableCell>
                                          <TableCell className="text-right pr-8">
                                              <div className="flex items-center justify-end gap-3">
                                                  <span className="font-black text-slate-800">{formatCurrency(item.montoEstimado)}</span>
                                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                                      const updated = (gestionCostos.costosItems || []).filter(i => i.id !== item.id);
                                                      setGestionCostos({...gestionCostos, costosItems: updated});
                                                  }}><Trash2 className="w-4 h-4"/></Button>
                                              </div>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>

                  <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                      <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Añadir Costo Directo</CardTitle></CardHeader>
                      <CardContent>
                          <form onSubmit={handleAddCostoItem} className="space-y-4">
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Concepto / Proveedor</Label><Input value={newCostoNombre} onChange={e => setNewCostoNombre(e.target.value)} placeholder="Ej: Pago de Salón" className="rounded-xl h-11 bg-slate-50 border-none shadow-inner" /></div>
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Categoría</Label><Select value={newCostoCategoria} onValueChange={(v) => setNewCostoCategoria(v as any)}><SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none shadow-inner"><SelectValue/></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl">{COST_CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Monto Estimado</Label><Input type="number" value={newCostoMontoEstimado} onChange={e => setNewCostoMontoEstimado(e.target.value)} className="rounded-xl h-11 bg-slate-50 border-none shadow-inner font-bold" /></div>
                              <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={!newCostoNombre || !newCostoMontoEstimado}>Añadir al Plan</Button>
                          </form>
                      </CardContent>
                  </Card>
              </div>
          </TabsContent>

          <TabsContent value="pagos" className="space-y-6 pt-4 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                      <CardHeader className="bg-emerald-50 border-b border-emerald-100"><CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800">Bitácora de Egresos Reales</CardTitle></CardHeader>
                      <CardContent className="p-0">
                          <Table>
                              <TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100"><TableHead className="pl-8 text-[10px] uppercase font-black">Fecha / Concepto</TableHead><TableHead className="text-[10px] uppercase font-black">Método</TableHead><TableHead className="text-right pr-8 text-[10px] uppercase font-black">Monto Pagado</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {pagosProveedores.map(pago => {
                                      const costo = costItemsForSelect.find(i => i.id === pago.costoAsociadoId);
                                      return (
                                          <TableRow key={pago.id} className="group border-slate-50">
                                              <TableCell className="pl-8 py-4">
                                                  <p className="font-bold text-slate-800">{costo?.label || 'Gasto'}</p>
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(pago.fecha).toLocaleDateString('es-ES')}</p>
                                              </TableCell>
                                              <TableCell><Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase bg-slate-100 text-slate-500 border-none">{pago.metodoPago}</Badge></TableCell>
                                              <TableCell className="text-right pr-8">
                                                  <div className="flex items-center justify-end gap-3">
                                                      <span className="font-black text-emerald-600">{formatCurrency(pago.monto)}</span>
                                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deletePago(pago.id)}><Trash2 className="w-4 h-4"/></Button>
                                                  </div>
                                              </TableCell>
                                          </TableRow>
                                      );
                                  })}
                                  {pagosProveedores.length === 0 && (
                                      <TableRow><TableCell colSpan={3} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No se han registrado pagos aún.</TableCell></TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>

                  <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-emerald-600 text-white">
                      <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Banknote className="w-5 h-5"/> Registrar Egreso Real</CardTitle></CardHeader>
                      <CardContent>
                          <form onSubmit={handleAddPago} className="space-y-4">
                              <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black uppercase opacity-60">Vincular a Concepto</Label>
                                  <Select value={newPagoCostoId} onValueChange={setNewPagoCostoId}>
                                      <SelectTrigger className="bg-white/10 border-none text-white h-11 rounded-xl"><SelectValue placeholder="Elegir concepto..." /></SelectTrigger>
                                      <SelectContent className="rounded-xl border-none shadow-2xl">{costItemsForSelect.map(i=><SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}</SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase opacity-60">Monto del Pago</Label><Input type="number" value={newPagoMonto} onChange={e => setNewPagoMonto(e.target.value)} className="bg-white text-slate-900 rounded-xl h-12 border-none text-lg font-black shadow-inner" /></div>
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase opacity-60">Fecha</Label><DatePickerDemo selectedDate={newPagoFecha} onDateChange={setNewPagoFecha} className="bg-white/10 border-none text-white h-11" /></div>
                              <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-emerald-600 hover:bg-slate-50 font-black shadow-xl mt-2 transition-transform active:scale-95" disabled={isSaving || !newPagoCostoId || !newPagoMonto}>
                                  {isSaving ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="w-5 h-5 mr-2"/>} REGISTRAR PAGO
                              </Button>
                          </form>
                      </CardContent>
                  </Card>
              </div>
          </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-4 md:px-0">
            <div className="flex items-center gap-2 text-slate-400">
                <Info className="w-4 h-4"/>
                <p className="text-[10px] font-bold uppercase tracking-widest">Los costos se sincronizan desde el planificador y el presupuesto.</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} size="lg" className="rounded-2xl px-12 h-14 font-black text-base shadow-2xl shadow-primary/30">
                {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
                {isSaving ? 'PROCESANDO...' : 'GUARDAR ANÁLISIS'}
            </Button>
        </div>
      </div>
    </div>
  );
}

export default function GestionCostosPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <GestionCostosRentabilidadContent />
        </Suspense>
    )
}
