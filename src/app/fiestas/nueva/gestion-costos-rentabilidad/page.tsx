'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, AlertTriangle, BarChart3, PlusCircle, Trash2, DollarSign, ChefHat, RefreshCw, Truck, Info, Layers, Banknote, CheckCircle2, UserCheck, Percent, GlassWater, CakeSlice, Building, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateGestionCostosFiestaActual, updatePagosProveedoresFiestaActual } from '@/app/actions/fiesta-actual';
import { syncAllEventCosts } from '@/app/actions/fiesta/costos.actions';
import { defaultGestionCostos } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSearchParams } from 'next/navigation';
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

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [gestionCostos, setGestionCostos] = useState<GestionCostosData>(defaultGestionCostos);
  const [pagosProveedores, setPagosProveedores] = useState<PagoProveedor[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [newCostoNombre, setNewCostoNombre] = useState('');
  const [newCostoCategoria, setNewCostoCategoria] = useState<CostoCategoria>('Otro Costo Directo');
  const [newCostoMontoEstimado, setNewCostoMontoEstimado] = useState<string>('');
  
  const [newPagoCostoId, setNewPagoCostoId] = useState('');
  const [newPagoFecha, setNewPagoFecha] = useState<Date | undefined>(new Date());
  const [newPagoMonto, setNewPagoMonto] = useState('');

  const loadData = useCallback(async (showLoading = true) => {
    if(!fiestaId) return;
    if (showLoading) setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiesta(fiestaData);
      setGestionCostos(fiestaData.gestionCostos || defaultGestionCostos);
      setPagosProveedores(fiestaData.pagosProveedores || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSyncAll = async () => {
      if (!fiestaId) return;
      setIsSyncing(true);
      try {
          const res = await syncAllEventCosts(fiestaId);
          if (res.success) {
              toast({ title: "¡Sincronización Total!", description: "Se han actualizado los costos basándose en catálogos, presupuesto y personal." });
              await loadData(false);
          } else throw new Error(res.error);
      } catch (e: any) {
          toast({ title: "Error al sincronizar", description: e.message, variant: "destructive" });
      } finally {
          setIsSyncing(false);
      }
  };

  const handleAddCostoItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newCostoNombre.trim() || !newCostoMontoEstimado.trim()) return;
    const newItem: CostoItem = {
      id: `costo_man_${Date.now()}`,
      nombre: newCostoNombre.trim(),
      category: newCostoCategoria,
      montoEstimado: parseFloat(newCostoMontoEstimado),
    };
    setGestionCostos(prev => ({ ...prev, costosItems: [...(prev.costosItems || []), newItem] }));
    setNewCostoNombre(''); setNewCostoMontoEstimado('');
  };

  const handleAddPago = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPagoCostoId || !newPagoMonto || !newPagoFecha || !fiestaId) return;
    const newPago: PagoProveedor = {
        id: `pago_${Date.now()}`,
        costoAsociadoId: newPagoCostoId,
        fecha: newPagoFecha.toISOString(),
        monto: parseFloat(newPagoMonto)
    };
    const updated = [...pagosProveedores, newPago];
    setIsSaving(true);
    try {
        await updatePagosProveedoresFiestaActual(fiestaId, updated);
        toast({ title: "Pago registrado" });
        setNewPagoMonto('');
        await loadData(false);
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const stats = useMemo(() => {
    const projectedCost = (gestionCostos.costosItems || []).reduce((s, i) => s + i.montoEstimado, 0) + 
                         (gestionCostos.others?.totalCateringCost || 0) + 
                         (gestionCostos.others?.totalBebidasCost || 0) + 
                         (gestionCostos.others?.totalReposteriaCost || 0) + 
                         (gestionCostos.others?.totalPersonalCost || 0);

    const realExpenses = pagosProveedores.reduce((s, p) => s + (p.monto || 0), 0);
    const income = gestionCostos.ingresosTotalesEstimados || 0;
    const projectedProfit = income - projectedCost;
    const projectedMargin = income > 0 ? (projectedProfit / income) * 100 : 0;

    return { projectedCost, realExpenses, projectedProfit, projectedMargin };
  }, [gestionCostos, pagosProveedores]);

  const costItemsForSelect = useMemo(() => {
      const automatic = [
          { id: 'cat_catering', label: 'Catering (Automático)' },
          { id: 'cat_bebidas', label: 'Bebidas (Automático)' },
          { id: 'cat_reposteria', label: 'Repostería (Automático)' },
          { id: 'cat_personal', label: 'Personal (Automático)' },
      ];
      const manual = (gestionCostos.costosItems || []).map(i => ({ id: i.id, label: i.nombre }));
      return [...automatic, ...manual];
  }, [gestionCostos]);

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12"/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-100 text-white"><BarChart3 className="w-8 h-8" /></div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase font-headline">Analizador de Rentabilidad</h1>
            <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700 font-bold uppercase text-[9px] tracking-widest">Control de Márgenes Reales</Badge>
          </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleSyncAll} disabled={isSyncing} className="rounded-xl h-12 bg-primary shadow-lg shadow-primary/20 font-bold">
                {isSyncing ? <Loader2 className="animate-spin mr-2"/> : <Zap className="w-4 h-4 mr-2"/>} 
                SINCRONIZAR TODO
            </Button>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline" className="rounded-xl h-12 border-slate-200"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 text-white border-none shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Ingreso Pactado</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-4xl font-black">{formatCurrency(gestionCostos.ingresosTotalesEstimados)}</p>
                  <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-tighter">Sincronizado con Presupuesto</p>
              </CardContent>
          </Card>
          <Card className="bg-primary text-white border-none shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Inversión Proyectada</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-4xl font-black">{formatCurrency(stats.projectedCost)}</p>
                  <p className="text-[9px] font-bold text-primary-foreground/60 mt-2 uppercase tracking-tighter flex items-center gap-2">
                      <RefreshCw className="w-3 h-3"/> Incluye sueldos y aportes
                  </p>
              </CardContent>
          </Card>
          <Card className="bg-emerald-600 text-white border-none shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Ganancia Neta Est.</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-4xl font-black">{formatCurrency(stats.projectedProfit)}</p>
                  <Badge className="mt-2 bg-white/20 text-white border-none font-black text-[10px] tracking-widest uppercase">
                      {stats.projectedMargin.toFixed(1)}% MARGEN
                  </Badge>
              </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="desglose" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-2xl h-14">
              <TabsTrigger value="desglose" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Plan de Costos</TabsTrigger>
              <TabsTrigger value="egresos" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Pagos Reales (Egresos)</TabsTrigger>
          </TabsList>

          <TabsContent value="desglose" className="space-y-6 pt-4 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6">
                      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                          <CardHeader className="bg-slate-50 border-b border-slate-100"><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Inversión Detallada</CardTitle></CardHeader>
                          <CardContent className="p-0">
                              <Table>
                                  <TableHeader className="bg-slate-50/50">
                                      <TableRow className="border-slate-100">
                                          <TableHead className="pl-8 text-[10px] uppercase font-black text-slate-400">Concepto / Categoría</TableHead>
                                          <TableHead className="text-right pr-8 text-[10px] uppercase font-black text-slate-400">Inversión Est.</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {/* CATERING */}
                                      <TableRow className="border-slate-50">
                                          <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><ChefHat className="w-5 h-5 text-primary"/><p className="font-bold text-slate-700">Producción Gastronómica (Recetas)</p></div></TableCell>
                                          <TableCell className="text-right pr-8 font-black">{formatCurrency(gestionCostos.others?.totalCateringCost || 0)}</TableCell>
                                      </TableRow>
                                      {/* BEBIDAS */}
                                      <TableRow className="border-slate-50">
                                          <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><GlassWater className="w-5 h-5 text-primary"/><p className="font-bold text-slate-700">Insumos Bebidas y Barra</p></div></TableCell>
                                          <TableCell className="text-right pr-8 font-black">{formatCurrency(gestionCostos.others?.totalBebidasCost || 0)}</TableCell>
                                      </TableRow>
                                      {/* REPOSTERIA */}
                                      <TableRow className="border-slate-50">
                                          <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><CakeSlice className="w-5 h-5 text-primary"/><p className="font-bold text-slate-700">Repostería y Pedidos</p></div></TableCell>
                                          <TableCell className="text-right pr-8 font-black">{formatCurrency(gestionCostos.others?.totalReposteriaCost || 0)}</TableCell>
                                      </TableRow>
                                      {/* PERSONAL */}
                                      <TableRow className="border-slate-50">
                                          <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><UserCheck className="w-5 h-5 text-primary"/><p className="font-bold text-slate-700">Personal (Sueldos + Aportes)</p></div></TableCell>
                                          <TableCell className="text-right pr-8 font-black">{formatCurrency(gestionCostos.others?.totalPersonalCost || 0)}</TableCell>
                                      </TableRow>
                                      {/* PROVEEDORES PRESUPUESTO */}
                                      {(gestionCostos.others?.totalProveedorCost ?? 0) > 0 && (
                                          <TableRow className="border-slate-50">
                                              <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><Truck className="w-5 h-5 text-primary"/><p className="font-bold text-slate-700">Proveedores Externos (Presupuesto)</p></div></TableCell>
                                              <TableCell className="text-right pr-8 font-black">{formatCurrency(gestionCostos.others?.totalProveedorCost ?? 0)}</TableCell>
                                          </TableRow>
                                      )}
                                      {/* MANUALES */}
                                      {gestionCostos.costosItems?.map(item => (
                                          <TableRow key={item.id} className="group border-slate-50 hover:bg-slate-50 transition-colors">
                                              <TableCell className="pl-8 py-4">
                                                  <div className="flex items-center gap-3">
                                                      {item.category === 'Pago de Salón' ? <Building className="w-5 h-5 text-slate-400"/> : <PlusCircle className="w-5 h-5 text-slate-400"/>}
                                                      <div><p className="font-bold text-slate-700">{item.nombre}</p><p className="text-[9px] uppercase font-black text-slate-400">{item.category}</p></div>
                                                  </div>
                                              </TableCell>
                                              <TableCell className="text-right pr-8">
                                                  <div className="flex items-center justify-end gap-3">
                                                      <span className="font-black">{formatCurrency(item.montoEstimado)}</span>
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
                  </div>

                  <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white h-fit">
                      <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Añadir Gasto Manual</CardTitle></CardHeader>
                      <CardContent>
                          <form onSubmit={handleAddCostoItem} className="space-y-4">
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Concepto</Label><Input value={newCostoNombre} onChange={e => setNewCostoNombre(e.target.value)} placeholder="Ej: Flete adicional" className="rounded-xl h-11 bg-slate-50 border-none shadow-inner" /></div>
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Categoría</Label><Select value={newCostoCategoria} onValueChange={(v) => setNewCostoCategoria(v as any)}><SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none shadow-inner"><SelectValue/></SelectTrigger><SelectContent className="rounded-xl">{COST_CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Monto Estimado</Label><Input type="number" value={newCostoMontoEstimado} onChange={e => setNewCostoMontoEstimado(e.target.value)} className="rounded-xl h-11 bg-slate-50 border-none shadow-inner font-bold text-primary" /></div>
                              <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={!newCostoNombre || !newCostoMontoEstimado}>Añadir al Plan</Button>
                          </form>
                      </CardContent>
                  </Card>
              </div>
          </TabsContent>

          <TabsContent value="egresos" className="pt-4 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                      <CardHeader className="bg-emerald-50 border-b border-emerald-100 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800">Bitácora de Pagos Efectuados</CardTitle>
                          <Badge className="bg-emerald-600 text-white border-none font-black text-[10px] tracking-widest">REAL: {formatCurrency(stats.realExpenses)}</Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                          <Table>
                              <TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100"><TableHead className="pl-8 text-[10px] uppercase font-black text-slate-400">Fecha / Concepto</TableHead><TableHead className="text-right pr-8 text-[10px] uppercase font-black text-slate-400">Monto Pagado</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {pagosProveedores.map(pago => {
                                      const concepto = costItemsForSelect.find(i => i.id === pago.costoAsociadoId)?.label || 'Gasto';
                                      return (
                                          <TableRow key={pago.id} className="group border-slate-50">
                                              <TableCell className="pl-8 py-4">
                                                  <p className="font-bold text-slate-800">{concepto}</p>
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(pago.fecha).toLocaleDateString('es-ES')}</p>
                                              </TableCell>
                                              <TableCell className="text-right pr-8 font-black text-emerald-600">{formatCurrency(pago.monto)}</TableCell>
                                          </TableRow>
                                      );
                                  })}
                                  {pagosProveedores.length === 0 && (
                                      <TableRow><TableCell colSpan={2} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No hay egresos registrados.</TableCell></TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>

                  <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-emerald-600 text-white h-fit">
                      <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Banknote className="w-5 h-5"/> Registrar Pago Real</CardTitle></CardHeader>
                      <CardContent>
                          <form onSubmit={handleAddPago} className="space-y-4">
                              <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black uppercase opacity-60">Concepto de Gasto</Label>
                                  <Select value={newPagoCostoId} onValueChange={setNewPagoCostoId}>
                                      <SelectTrigger className="bg-white/10 border-none text-white h-11 rounded-xl"><SelectValue placeholder="Elegir concepto..." /></SelectTrigger>
                                      <SelectContent className="rounded-xl">{costItemsForSelect.map(i=><SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}</SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase opacity-60">Monto Pagado (UYU)</Label><Input type="number" value={newPagoMonto} onChange={e => setNewPagoMonto(e.target.value)} className="bg-white text-slate-900 rounded-xl h-12 border-none text-lg font-black shadow-inner" /></div>
                              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase opacity-60">Fecha del Pago</Label><DatePickerDemo selectedDate={newPagoFecha} onDateChange={setNewPagoFecha} className="bg-white/10 border-none text-white h-11" /></div>
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
        <div className="max-w-5xl mx-auto flex justify-end">
            <Button onClick={async () => {
                if (!fiestaId) return;
                setIsSaving(true);
                await updateGestionCostosFiestaActual(fiestaId, gestionCostos);
                toast({ title: "Cambios guardados" });
                setIsSaving(false);
            }} disabled={isSaving} size="lg" className="rounded-2xl px-12 h-14 font-black text-base shadow-2xl shadow-primary/30">
                {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
                {isSaving ? 'GUARDANDO...' : 'GUARDAR ANÁLISIS FINANCIERO'}
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
