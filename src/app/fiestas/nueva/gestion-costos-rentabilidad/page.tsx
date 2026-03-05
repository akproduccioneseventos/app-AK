
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, AlertTriangle, BarChart3, PlusCircle, Trash2, DollarSign, ShoppingCart, HardHat, ChefHat, Printer, RefreshCw, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, GestionCostosData, CostoItem, CostoCategoria } from '@/types/fiesta';
import { getFiestaById, updateGestionCostosFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultGestionCostos } from '@/lib/fiesta-defaults';
import { getMenuById } from '@/app/actions/menus-catering';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getRoles } from '@/app/actions/roles';
import type { Rol } from '@/types/rol';

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
              // 1. Sincronizar Ingresos
              if (currentGestionCostos.ingresosTotalesEstimados === 0) {
                  currentGestionCostos.ingresosTotalesEstimados = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
              }

              const manualCosts = [...(currentGestionCostos.costosItems || [])];
              let modified = false;

              // 2. Regla Flete de Camión ($2400 si no es Club Uruguay)
              const lugar = (fiesta.configuracion.nombreLugar || '').toLowerCase();
              if (!lugar.includes('club uruguay') && lugar.trim() !== '') {
                  if (!manualCosts.some(c => c.nombre.toLowerCase().includes('flete'))) {
                      manualCosts.push({
                          id: 'auto_flete',
                          nombre: 'Flete de Camión (Fuera de Sede)',
                          category: 'Servicio Proveedor',
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
                      notas: 'Costo de subcontratación (independiente de si es regalo o no)'
                  });
                  modified = true;
              }

              if (hasPlataforma && !manualCosts.some(c => c.id === 'auto_sub_plataforma')) {
                  manualCosts.push({
                      id: 'auto_sub_plataforma',
                      nombre: 'Subcontratación: Plataforma 360',
                      category: 'Servicio Proveedor',
                      montoEstimado: 1500,
                      notas: 'Costo de subcontratación (independiente de si es regalo o no)'
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
                          nombre: 'Costo Torta (Insumos/Subcont.)',
                          category: 'Servicio Proveedor',
                          montoEstimado: costoTorta,
                          notas: `Cálculo automático: $60 x ${invitados} invitados`
                      });
                      modified = true;
                  } else if (existingTorta.montoEstimado !== costoTorta) {
                      // Solo actualizamos si el usuario no lo cambió manualmente? 
                      // Por ahora, lo mantenemos dinámico si cambia el nro de invitados
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

  const personalCost = useMemo(() => {
    return (fiestaActual?.personalAsignado || []).reduce((sum, p) => {
        const rol = allRoles.find(r => r.id === p.rolId);
        const aportes = (p.eventSalary * (rol?.porcentajeAportesPatronales || 0)) / 100;
        return sum + p.eventSalary + aportes;
    }, 0);
  }, [fiestaActual?.personalAsignado, allRoles]);

  const costoTotalEstimadoEvento = useMemo(() => {
    const manualCosts = (gestionCostos.costosItems || []).reduce((sum, item) => sum + item.montoEstimado, 0);
    const decorCost = (fiestaActual?.decoracion?.items || []).reduce((s, i) => s + (i.estimatedCost || 0), 0);
    return manualCosts + costoTotalMenu + costoTotalReposteria + costoTotalBebidas + personalCost + decorCost;
  }, [gestionCostos.costosItems, costoTotalMenu, costoTotalReposteria, costoTotalBebidas, personalCost, fiestaActual]);

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
      const result = await updateGestionCostosFiestaActual(fiestaId, gestionCostos);
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
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
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
            <Button variant="ghost" size="sm" onClick={() => loadData(true)} title="Sincronizar con presupuesto">
                <RefreshCw className="w-4 h-4 mr-2"/> Sincronizar
            </Button>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
        </div>
      </div>

      <Card className="shadow-md border-primary/20">
        <CardHeader><CardTitle className="font-headline text-xl">Resumen Financiero del Evento</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/40"><p className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase">Costo Estimado</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(costoTotalEstimadoEvento)}</p></div>
          <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/40"><p className="text-xs font-medium text-green-700 dark:text-green-300 uppercase">Ingresos (Presupuesto)</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(gestionCostos.ingresosTotalesEstimados)}</p></div>
          <div className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/40"><p className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase">Ganancia Neta</p><p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(gananciaNetaEstimada)}</p></div>
          <div className={`p-3 border rounded-lg ${margenRentabilidad < 30 ? 'bg-red-50 dark:bg-red-900/40' : 'bg-orange-50 dark:bg-orange-900/40'}`}><p className="text-xs font-medium uppercase">Rentabilidad</p><p className={`text-xl font-bold ${margenRentabilidad < 30 ? 'text-red-600' : 'text-orange-600'}`}>{margenRentabilidad.toFixed(1)}%</p></div>
        </CardContent>
        <CardFooter className="border-t pt-4">
            <div className="space-y-2 w-full max-w-sm">
                <Label htmlFor="ingresos-totales" className="text-base font-semibold text-primary">Ingreso Total (Monto Presupuestado)</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="ingresos-totales" type="number" value={gestionCostos.ingresosTotalesEstimados || ''} onChange={handleIngresosChange} placeholder="0.00" min="0" step="any" className="text-lg p-3 pl-7" disabled={isSaving}/>
                </div>
            </div>
        </CardFooter>
      </Card>

      <Accordion type="multiple" defaultValue={['costos-manuales', 'costos-modulos']} className="w-full space-y-4">
        <AccordionItem value="costos-manuales" className="border rounded-lg shadow-md bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-2"><HardHat className="w-5 h-5 text-primary/80"/>Costos Directos Manuales y Subcontrataciones</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t space-y-4">
            <form onSubmit={handleAddCostoItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-3 border rounded-md bg-muted/30">
              <div className="space-y-1 md:col-span-2"><Label htmlFor="costo-nombre">Concepto*</Label><Input id="costo-nombre" value={newCostoNombre} onChange={(e) => setNewCostoNombre(e.target.value)} placeholder="Ej: Pago a DJ Externo, Alquiler de Equipo Especial" required/></div>
              <div className="space-y-1"><Label htmlFor="costo-categoria">Categoría*</Label><Select value={newCostoCategoria} onValueChange={(val) => setNewCostoCategoria(val as CostoCategoria)} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{COST_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label htmlFor="costo-monto">Monto Estimado (UYU)*</Label><Input id="costo-monto" type="number" value={newCostoMontoEstimado} onChange={(e) => setNewCostoMontoEstimado(e.target.value)} placeholder="0.00" min="0" step="any" required/></div>
              <div className="space-y-1 md:col-span-2"><Label htmlFor="costo-notas">Notas</Label><Input id="costo-notas" value={newCostoNotas} onChange={(e) => setNewCostoNotas(e.target.value)} placeholder="Detalles del pago..."/></div>
              <Button type="submit" className="md:col-span-2" disabled={isSaving}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Gasto Directo</Button>
            </form>
            {(gestionCostos.costosItems && gestionCostos.costosItems.length > 0) ? (
              <ScrollArea className="h-auto max-h-[400px] pr-2 mt-3"><ul className="space-y-2">
                {gestionCostos.costosItems.map(item => (
                  <li key={item.id} className="flex justify-between items-center p-2 border rounded bg-card hover:bg-muted/10">
                    <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                            {item.id.startsWith('auto_') ? <RefreshCw className="w-3 h-3 text-blue-500" title="Generado automáticamente"/> : null}
                            {item.nombre} <span className="text-xs text-muted-foreground">({item.category})</span>
                        </p>
                        {item.notas && <p className="text-xs italic text-muted-foreground">{item.notas}</p>}
                    </div>
                    <div className="flex items-center gap-2"><span className="font-semibold text-sm">{formatCurrency(item.montoEstimado)}</span><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCostoItem(item.id)}><Trash2 className="w-4 h-4"/></Button></div>
                  </li>
                ))}
              </ul></ScrollArea>
            ) : (<p className="text-sm text-muted-foreground text-center py-3">Sin gastos manuales.</p>)}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="costos-modulos" className="border rounded-lg shadow-md bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary/80"/>Costos Calculados por el Sistema</div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t space-y-3">
                 <div className="flex justify-between items-center p-2 border-b text-sm"><span>Catering (Menú asignado):</span><span className="font-semibold">{formatCurrency(costoTotalMenu)}</span></div>
                 <div className="flex justify-between items-center p-2 border-b text-sm"><span>Repostería (Tortas y postres activos):</span><span className="font-semibold">{formatCurrency(costoTotalReposteria)}</span></div>
                 <div className="flex justify-between items-center p-2 border-b text-sm"><span>Bebidas (Insumos y barra):</span><span className="font-semibold">{formatCurrency(costoTotalBebidas)}</span></div>
                 <div className="flex justify-between items-center p-2 border-b text-sm"><span>Personal Asignado (incl. Aportes):</span><span className="font-semibold">{formatCurrency(personalCost)}</span></div>
                 <div className="flex justify-between items-center p-2 border-b text-sm"><span>Decoración y Ambientación:</span><span className="font-semibold">{formatCurrency((fiestaActual?.decoracion?.items || []).reduce((s, i) => s + (i.estimatedCost || 0), 0))}</span></div>
                 <p className="text-xs text-muted-foreground italic">Estos valores se actualizan según lo que configures en cada sección del planificador.</p>
            </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Card className="shadow-md">
        <CardHeader><CardTitle className="font-headline">Notas y Observaciones Financieras</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={gestionCostos.notasGeneralesCostos || ''} onChange={handleNotasGeneralesChange} placeholder="Anotaciones sobre la rentabilidad, imprevistos o negociaciones..." rows={3} disabled={isSaving}/>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
          Guardar Gestión de Costos
        </Button>
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
