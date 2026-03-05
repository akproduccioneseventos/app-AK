
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, AlertTriangle, BarChart3, PlusCircle, Trash2, DollarSign, ShoppingCart, HardHat, ChefHat, Printer, RefreshCw, Truck, Info, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, GestionCostosData, CostoItem, CostoCategoria } from '@/types/fiesta';
import { getFiestaById, updateGestionCostosFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultGestionCostos } from '@/lib/fiesta-defaults';
import { getMenuById } from '@/app/actions/menus-catering';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useSearchParams } from 'next/navigation';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getRoles } from '@/app/actions/roles';
import type { Rol } from '@/types/rol';
import type { Presupuesto } from '@/types/presupuesto';
import { cn } from '@/lib/utils';

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
  if (amount === undefined || isNaN(amount)) return 'N/A';
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
  const [costoTotalMenu, setCostoTotalMenu] = useState<number>(0);
  const [costoTotalReposteria, setCostoTotalReposteria] = useState<number>(0);
  const [costoTotalBebidas, setCostoTotalBebidas] = useState<number>(0);
  const [allRoles, setAllRoles] = useState<Rol[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCostoNombre, setNewCostoNombre] = useState('');
  const [newCostoCategoria, setNewCostoCategoria] = useState<CostoCategoria>('Otro Costo Directo');
  const [newCostoMontoEstimado, setNewCostoMontoEstimado] = useState<string>('');
  const [newCostoNotas, setNewCostoNotas] = useState('');

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
      
      let currentGestionCostos = fiesta.gestionCostos || { ...defaultGestionCostos };
      const invitados = (Number(fiesta.configuracion.invitadosEstimados) || 0);

      // --- LOGICA DE SINCRONIZACIÓN AUTOMÁTICA ---
      if (fiesta.presupuestoId) {
          const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
          if (presupuesto) {
              setPresupuestoActual(presupuesto);
              // 1. Sincronizar Ingresos si están en 0
              if (currentGestionCostos.ingresosTotalesEstimados === 0) {
                  currentGestionCostos.ingresosTotalesEstimados = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
              }

              const manualCosts = [...(currentGestionCostos.costosItems || [])];
              let modified = false;

              // 2. Regla Flete de Camión ($2400 si no es Club Uruguay)
              const lugar = (fiesta.configuracion.nombreLugar || '').toLowerCase();
              if (!lugar.includes('club uruguay') && lugar.trim() !== '') {
                  if (!manualCosts.some(c => c.id === 'auto_flete')) {
                      manualCosts.push({
                          id: 'auto_flete',
                          nombre: 'Flete de Camión (Fuera de Sede)',
                          category: 'Otro Costo Directo',
                          montoEstimado: 2400,
                          notas: 'Carga automática por salón fuera de Club Uruguay'
                      });
                      modified = true;
                  }
              }

              // 3. Regla Fotocabina y Plataforma 360 ($1500 cada una)
              const budgetItems = presupuesto.itemsPresupuestados;
              const hasFotocabina = budgetItems.some(i => i.nombreServicio.toLowerCase().includes('fotocabina'));
              const hasPlataforma = budgetItems.some(i => i.nombreServicio.toLowerCase().includes('plataforma 360'));

              if (hasFotocabina && !manualCosts.some(c => c.id === 'auto_sub_fotocabina')) {
                  manualCosts.push({
                      id: 'auto_sub_fotocabina',
                      nombre: 'Subcontratación: Fotocabina',
                      category: 'Servicio Proveedor',
                      montoEstimado: 1500,
                      notas: 'Costo de subcontratación'
                  });
                  modified = true;
              }

              if (hasPlataforma && !manualCosts.some(c => c.id === 'auto_sub_plataforma')) {
                  manualCosts.push({
                      id: 'auto_sub_plataforma',
                      nombre: 'Subcontratación: Plataforma 360',
                      category: 'Servicio Proveedor',
                      montoEstimado: 1500,
                      notas: 'Costo de subcontratación'
                  });
                  modified = true;
              }

              // 4. Regla Costo Torta ($60 por persona)
              const hasTorta = budgetItems.some(i => i.nombreServicio.toLowerCase().includes('torta'));
              if (hasTorta) {
                  const costoTorta = invitados * 60;
                  const existingTorta = manualCosts.find(c => c.id === 'auto_costo_torta');
                  if (!existingTorta) {
                      manualCosts.push({
                          id: 'auto_costo_torta',
                          nombre: 'Costo Torta (Insumos)',
                          category: 'Servicio Proveedor',
                          montoEstimado: costoTorta,
                          notas: `Cálculo automático: $60 x ${invitados} invitados`
                      });
                      modified = true;
                  } else if (existingTorta.montoEstimado !== costoTorta) {
                      existingTorta.montoEstimado = costoTorta;
                      existingTorta.notas = `Cálculo automático actualizado: $60 x ${invitados} invitados`;
                      modified = true;
                  }
              }

              if (modified) {
                  currentGestionCostos.costosItems = manualCosts;
              }
          }
      }

      setGestionCostos(currentGestionCostos);

      if (fiesta.menuAsignadoId) {
        const menuData = await getMenuById(fiesta.menuAsignadoId);
        if (menuData) {
          const costoPorPersona = menuData.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0);
          setCostoTotalMenu(costoPorPersona * invitados);
        } else {
          setCostoTotalMenu(0);
        }
      } else {
        setCostoTotalMenu(0);
      }
      
      let tempCostoReposteria = 0;
      fiesta.reposteria?.categorias.forEach(cat => {
        if(cat.activada) cat.items.forEach(item => tempCostoReposteria += (item.costoEstimado || 0) * (item.cantidad || 1));
      });
      setCostoTotalReposteria(tempCostoReposteria);

      let tempCostoBebidas = 0;
      fiesta.bebidas?.categorias.forEach(cat => {
        if(cat.activada) {
            cat.items.forEach(item => tempCostoBebidas += item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0)));
            cat.recetas?.forEach(receta => {
                 const factorEscala = invitados / (receta.porcionesBase || 1); 
                 tempCostoBebidas += (receta.costoTotalReceta || 0) * (isNaN(factorEscala) ? 0 : factorEscala);
            });
        }
      });
      setCostoTotalBebidas(tempCostoBebidas);

    } catch (err: any) {
      console.error("Error loading data:", err);
      setError("No se pudieron cargar los datos de costos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleIngresosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGestionCostos(prev => ({ ...prev, ingresosTotalesEstimados: parseFloat(e.target.value) || 0 }));
  };

  const handleNotasGeneralesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGestionCostos(prev => ({ ...prev, notasGeneralesCostos: e.target.value }));
  };

  const handleAddCostoItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newCostoNombre.trim() || !newCostoMontoEstimado.trim() || isNaN(parseFloat(newCostoMontoEstimado))) {
      toast({ title: "Datos Inválidos", description: "Nombre y monto son requeridos.", variant: "destructive" });
      return;
    }
    const newItem: CostoItem = {
      id: `costo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: newCostoNombre.trim(),
      category: newCostoCategoria,
      montoEstimado: parseFloat(newCostoMontoEstimado),
      notas: newCostoNotas.trim() || undefined,
    };
    setGestionCostos(prev => ({ ...prev, costosItems: [...prev.costosItems, newItem] }));
    setNewCostoNombre('');
    setNewCostoMontoEstimado('');
    setNewCostoNotas('');
  };

  const handleDeleteCostoItem = (itemId: string) => {
    setGestionCostos(prev => ({ ...prev, costosItems: prev.costosItems.filter(item => item.id !== itemId) }));
  };

  // --- CALCULO DE COSTO DE PERSONAL PROYECTADO (Replica lógica de Personal page) ---
  const personalCostCalculated = useMemo(() => {
    if (!presupuestoActual) return 0;
    
    let total = 0;
    const totalGuests = (presupuestoActual.invitadosAdultos || 0) + (presupuestoActual.invitadosNinos || 0) + (presupuestoActual.invitadosAdolescentes || 0);

    const getRoleCost = (search: string, qty: number) => {
        const rol = allRoles.find(r => r.nombre.toLowerCase().includes(search.toLowerCase()));
        if (rol) {
            const aportes = (rol.sueldoPorEvento * (rol.porcentajeAportesPatronales || 0)) / 100;
            return (rol.sueldoPorEvento + aportes) * qty;
        }
        return 0;
    };

    // 1. Utileros
    total += getRoleCost('Utilero', Math.ceil(totalGuests / 25));

    // 2. Barmen
    const hasBarra = presupuestoActual.itemsPresupuestados.some(item => 
        item.nombreServicio.toLowerCase().includes('barra') || 
        item.nombreServicio.toLowerCase().includes('trago') ||
        item.nombreServicio.toLowerCase().includes('licuado')
    );
    if (hasBarra) {
        let numBarmen = 1;
        if (totalGuests > 150) numBarmen = 3;
        else if (totalGuests > 60) numBarmen = 2;
        total += getRoleCost('Barman', numBarmen);
    }

    // 3. Otros roles del presupuesto
    presupuestoActual.itemsPresupuestados.forEach(item => {
        const name = item.nombreServicio.toLowerCase();
        if (name.includes('discoteca') || name.includes(' dj')) total += getRoleCost('DJ', 1);
        if (name.includes('decoración')) {
            total += getRoleCost('Decoradora', 1);
            total += getRoleCost('Ayudante de Decoración', 1);
        }
        if (name.includes('mozo')) total += getRoleCost('Mozo', item.cantidad || 1);
        if (name.includes('asado')) total += getRoleCost('Asador', 1);
        if (name.includes('fotografía')) total += getRoleCost('Fotógrafo', 1);
        if (name.includes('filmación')) total += getRoleCost('Camarógrafo', 1);
        if (name.includes('cocina')) total += getRoleCost('Cocinero', 1);
        if (name.includes('portero')) total += getRoleCost('Portero', 1);
    });

    return total;
  }, [presupuestoActual, allRoles]);

  const decorCost = useMemo(() => {
    return (fiestaActual?.decoracion?.items || []).reduce((s, i) => s + (i.estimatedCost || 0), 0);
  }, [fiestaActual?.decoracion?.items]);

  // --- LOGICA DE AGRUPACIÓN POR CATEGORÍA ---
  const groupedAllCosts = useMemo(() => {
    const groups: Record<string, { items: { name: string, amount: number, notes?: string, isSystem?: boolean, id?: string }[], subtotal: number }> = {};

    const add = (cat: string, name: string, amount: number, notes?: string, isSystem = false, id?: string) => {
      if (amount <= 0 && isSystem) return;
      if (!groups[cat]) groups[cat] = { items: [], subtotal: 0 };
      groups[cat].items.push({ name, amount, notes, isSystem, id });
      groups[cat].subtotal += amount;
    };

    // 1. Agregar Costos del Sistema (Calculados dinámicamente)
    add('Catering', 'Insumos de Menú (Receta)', costoTotalMenu, 'Costo ingredientes p/persona x invitados', true);
    add('Repostería', 'Tortas y Postres', costoTotalReposteria, 'Costo directo ingredientes', true);
    add('Bebidas', 'Insumos y Barra', costoTotalBebidas, 'Insumos barra y recetas', true);
    add('Personal', 'Sueldos + Aportes Proyectados', personalCostCalculated, 'Proyección automática por roles y reglas', true);
    add('Decoración', 'Elementos Decorativos', decorCost, 'Items añadidos en diseño de evento', true);

    // 2. Agregar Costos Manuales mapeándolos a categorías lógicas
    (gestionCostos.costosItems || []).forEach(item => {
      let cat = item.category;
      if (cat === 'Personal Evento') cat = 'Personal';
      if (cat === 'Pago de Salón') cat = 'Salón';
      
      add(cat, item.nombre, item.montoEstimado, item.notes, false, item.id);
    });

    return groups;
  }, [costoTotalMenu, costoTotalReposteria, costoTotalBebidas, personalCostCalculated, decorCost, gestionCostos.costosItems]);

  const costoTotalEstimadoEvento = useMemo(() => {
    return Object.values(groupedAllCosts).reduce((sum, group) => sum + group.subtotal, 0);
  }, [groupedAllCosts]);

  const gananciaNetaEstimada = useMemo(() => {
    return (gestionCostos.ingresosTotalesEstimados || 0) - costoTotalEstimadoEvento;
  }, [gestionCostos.ingresosTotalesEstimados, costoTotalEstimadoEvento]);

  const margenRentabilidad = useMemo(() => {
    if (!gestionCostos.ingresosTotalesEstimados || gestionCostos.ingresosTotalesEstimados === 0) return 0;
    return (gananciaNetaEstimada / gestionCostos.ingresosTotalesEstimados) * 100;
  }, [gananciaNetaEstimada, gestionCostos.ingresosTotalesEstimados]);


  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateGestionCostosFiestaActual(fiestaId, { ...gestionCostos });
      if (result.success) {
        toast({ title: "¡Datos Guardados!", description: "La información de costos y rentabilidad ha sido actualizada." });
        if (result.updatedData) setGestionCostos(result.updatedData);
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Calculando rentabilidad...</p></div>;
  }
  if (error) {
    return <div className="text-center py-10"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold text-lg text-destructive">{error}</p><Button onClick={() => loadData()} className="mt-4" variant="outline">Reintentar</Button></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Costos y Rentabilidad</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => loadData(true)} title="Sincronizar con presupuesto e invitados">
                <RefreshCw className="w-4 h-4 mr-2"/> Sincronizar Todo
            </Button>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
        </div>
      </div>

      <Card className="shadow-md border-primary/20 overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <CardTitle className="font-headline text-xl">Resumen Financiero Consolidado</CardTitle>
                    <CardDescription>Análisis de ingresos proyectados vs. costos directos del sistema y manuales.</CardDescription>
                </div>
                <div className="space-y-1 w-full md:w-auto">
                    <Label htmlFor="ingresos-totales" className="text-xs uppercase font-bold text-muted-foreground">Ingreso por Presupuesto</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                        <Input id="ingresos-totales" type="number" value={gestionCostos.ingresosTotalesEstimados || ''} onChange={handleIngresosChange} className="text-xl font-bold p-3 pl-7 bg-white h-12" disabled={isSaving}/>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/40 text-center">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-1">Costo Total Evento</p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(costoTotalEstimadoEvento)}</p>
          </div>
          <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/40 text-center">
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-1">Ganancia Neta</p>
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{formatCurrency(gananciaNetaEstimada)}</p>
          </div>
          <div className={cn("p-4 border rounded-lg text-center", margenRentabilidad < 30 ? 'bg-red-50' : 'bg-green-50')}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1">Rentabilidad</p>
              <p className={cn("text-3xl font-black", margenRentabilidad < 30 ? 'text-red-600' : 'text-green-600')}>{margenRentabilidad.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b mb-4">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary"/>
                        <CardTitle className="text-lg">Desglose de Gastos por Categoría</CardTitle>
                    </div>
                    <Badge variant="outline" className="font-bold">Total: {formatCurrency(costoTotalEstimadoEvento)}</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[300px]">Categoría / Concepto</TableHead>
                                <TableHead className="text-right">Importe</TableHead>
                                <TableHead className="w-[50px] print:hidden"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(groupedAllCosts).map(([cat, data]) => (
                                <React.Fragment key={cat}>
                                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                                        <TableCell className="font-bold text-primary py-2">{cat.toUpperCase()}</TableCell>
                                        <TableCell className="text-right font-bold py-2">{formatCurrency(data.subtotal)}</TableCell>
                                        <TableCell className="print:hidden"></TableCell>
                                    </TableRow>
                                    {data.items.map((item, idx) => (
                                        <TableRow key={item.id || idx} className="text-sm">
                                            <TableCell className="pl-8">
                                                <div className="flex flex-col">
                                                    <span className="font-medium flex items-center gap-2">
                                                        {item.isSystem && <RefreshCw className="w-3 h-3 text-blue-500" title="Calculado automáticamente por el sistema"/>}
                                                        {item.name}
                                                    </span>
                                                    {item.notes && <span className="text-[10px] text-muted-foreground italic">{item.notes}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(item.amount)}</TableCell>
                                            <TableCell className="text-right print:hidden">
                                                {!item.isSystem && item.id && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCostoItem(item.id!)}>
                                                        <Trash2 className="w-3.5 h-3.5"/>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-primary/5">
                                <TableCell className="font-bold text-lg">COSTO TOTAL ESTIMADO</TableCell>
                                <TableCell className="text-right font-bold text-lg text-primary">{formatCurrency(costoTotalEstimadoEvento)}</TableCell>
                                <TableCell className="print:hidden"></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-md font-headline flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-primary"/> Añadir Gasto Manual
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddCostoItem} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="costo-nombre">Concepto</Label>
                            <Input id="costo-nombre" value={newCostoNombre} onChange={(e) => setNewCostoNombre(e.target.value)} placeholder="Ej: Taxi equipo nocturno" required/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="costo-categoria">Categoría</Label>
                            <Select value={newCostoCategoria} onValueChange={(val) => setNewCostoCategoria(val as CostoCategoria)} required>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{COST_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="costo-monto">Monto (UYU)</Label>
                            <Input id="costo-monto" type="number" value={newCostoMontoEstimado} onChange={(e) => setNewCostoMontoEstimado(e.target.value)} placeholder="0.00" min="0" step="any" required/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="costo-notas">Notas</Label>
                            <Input id="costo-notas" value={newCostoNotas} onChange={(e) => setNewCostoNotas(e.target.value)} placeholder="Detalles extra..."/>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSaving}>Añadir Gasto</Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader><CardTitle className="text-md font-headline">Notas Financieras</CardTitle></CardHeader>
                <CardContent>
                    <Textarea value={gestionCostos.notasGeneralesCostos || ''} onChange={handleNotasGeneralesChange} placeholder="Anotaciones sobre rentabilidad, imprevistos..." rows={4} disabled={isSaving}/>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t gap-3 print:hidden">
        <Button onClick={handleSave} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
          Guardar Análisis de Costos
        </Button>
      </div>
    </div>
  );
}

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'outline', className?: string }) => (
    <span className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === 'default' ? "bg-primary/10 text-primary" : "border border-muted-foreground/30 text-muted-foreground",
        className
    )}>
        {children}
    </span>
);

export default function GestionCostosPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <GestionCostosRentabilidadContent />
        </Suspense>
    )
}
