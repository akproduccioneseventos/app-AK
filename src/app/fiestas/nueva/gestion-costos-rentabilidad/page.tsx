
'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, AlertTriangle, BarChart3, PlusCircle, Trash2, DollarSign, ShoppingCart, HardHat, ChefHat } from 'lucide-react'; // Added ChefHat, HardHat, ShoppingCart
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, GestionCostosData, CostoItem, CostoCategoria } from '@/types/fiesta';
import { getFiestaActual, updateGestionCostosFiestaActual } from '@/app/actions/fiesta-actual';
import { initialGestionCostosData } from '@/lib/fiesta-defaults';
import { getMenuById } from '@/app/actions/menus-catering';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';

const COST_CATEGORIES: CostoCategoria[] = [
  'Servicio Proveedor', 
  'Personal Evento', 
  'Compra General', 
  'Marketing y Publicidad',
  'Imprevistos',
  'Otro Costo Directo'
];

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || isNaN(amount)) return "N/A";
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function GestionCostosRentabilidadPage() {
  const { toast } = useToast();
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [gestionCostos, setGestionCostos] = useState<GestionCostosData>(initialGestionCostosData);
  const [costoTotalMenu, setCostoTotalMenu] = useState<number>(0);
  const [costoTotalReposteria, setCostoTotalReposteria] = useState<number>(0);
  const [costoTotalBebidas, setCostoTotalBebidas] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for new manual cost item
  const [newCostoNombre, setNewCostoNombre] = useState('');
  const [newCostoCategoria, setNewCostoCategoria] = useState<CostoCategoria>('Otro Costo Directo');
  const [newCostoMontoEstimado, setNewCostoMontoEstimado] = useState<string>('');
  const [newCostoNotas, setNewCostoNotas] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiesta = await getFiestaActual();
      setFiestaActual(fiesta);
      setGestionCostos(fiesta.gestionCostos || initialGestionCostosData);

      // Calculate Gastronomic Costs
      if (fiesta.menuAsignadoId) {
        const menuData = await getMenuById(fiesta.menuAsignadoId);
        if (menuData && typeof fiesta.configuracion.invitadosEstimados === 'number') {
          const costoPorPersona = menuData.items.reduce((sum, item) => {
             const costPerPortion = item.costPerPortion ?? (item.totalDishCost / (item.basePortions || 1));
             return sum + (costPerPortion || 0);
          }, 0);
          setCostoTotalMenu(costoPorPersona * fiesta.configuracion.invitadosEstimados);
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
        if(cat.activada) cat.items.forEach(item => tempCostoBebidas += item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0)));
      });
      setCostoTotalBebidas(tempCostoBebidas);

    } catch (err: any) {
      console.error("Error loading data:", err);
      setError("No se pudieron cargar los datos de costos y rentabilidad.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
      toast({ title: "Datos Inválidos", description: "Nombre y monto estimado válido son requeridos.", variant: "destructive" });
      return;
    }
    const newItem: CostoItem = {
      id: `costo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: newCostoNombre.trim(),
      categoria: newCostoCategoria,
      montoEstimado: parseFloat(newCostoMontoEstimado),
      notas: newCostoNotas.trim() || undefined,
    };
    setGestionCostos(prev => ({ ...prev, costosItems: [...prev.costosItems, newItem] }));
    setNewCostoNombre('');
    setNewCostoMontoEstimado('');
    setNewCostoNotas('');
    toast({ title: "Ítem de Costo Añadido" });
  };

  const handleDeleteCostoItem = (itemId: string) => {
    setGestionCostos(prev => ({ ...prev, costosItems: prev.costosItems.filter(item => item.id !== itemId) }));
    toast({ title: "Ítem de Costo Eliminado", variant: "destructive" });
  };

  const costoManualItems = useMemo(() => {
    return gestionCostos.costosItems.reduce((sum, item) => sum + item.montoEstimado, 0);
  }, [gestionCostos.costosItems]);

  const costoTotalEstimadoEvento = useMemo(() => {
    const personalCost = fiestaActual?.personalAsignado?.reduce((sum, p) => sum + p.eventSalary, 0) || 0;
    const decorCost = fiestaActual?.decoracion?.items?.reduce((s, i) => s + (i.estimatedCost || 0), 0) || 0;
    return costoManualItems + costoTotalMenu + costoTotalReposteria + costoTotalBebidas + personalCost + decorCost;
  }, [costoManualItems, costoTotalMenu, costoTotalReposteria, costoTotalBebidas, fiestaActual]);

  const gananciaNetaEstimada = useMemo(() => {
    return gestionCostos.ingresosTotalesEstimados - costoTotalEstimadoEvento;
  }, [gestionCostos.ingresosTotalesEstimados, costoTotalEstimadoEvento]);

  const margenRentabilidad = useMemo(() => {
    if (gestionCostos.ingresosTotalesEstimados === 0) return 0;
    return (gananciaNetaEstimada / gestionCostos.ingresosTotalesEstimados) * 100;
  }, [gananciaNetaEstimada, gestionCostos.ingresosTotalesEstimados]);


  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateGestionCostosFiestaActual(gestionCostos);
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
    return <div className="text-center py-10"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold text-lg text-destructive">{error}</p><Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button></div>;
  }
  if (!fiestaActual) {
    return <div className="text-center py-10"><p className="text-muted-foreground">No hay datos de fiesta actual.</p></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Costos y Rentabilidad del Evento</h1>
        </div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button></Link>
      </div>

      <Card className="shadow-md">
        <CardHeader><CardTitle className="font-headline text-xl">Resumen Financiero del Evento</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 border rounded-md bg-blue-50"><p className="text-xs font-medium text-blue-700">COSTO TOTAL ESTIMADO</p><p className="text-xl font-bold text-blue-600">{formatCurrency(costoTotalEstimadoEvento)}</p></div>
          <div className="p-3 border rounded-md bg-green-50"><p className="text-xs font-medium text-green-700">INGRESOS TOTALES</p><p className="text-xl font-bold text-green-600">{formatCurrency(gestionCostos.ingresosTotalesEstimados)}</p></div>
          <div className="p-3 border rounded-md bg-purple-50"><p className="text-xs font-medium text-purple-700">GANANCIA NETA ESTIMADA</p><p className="text-xl font-bold text-purple-600">{formatCurrency(gananciaNetaEstimada)}</p></div>
          <div className="p-3 border rounded-md bg-orange-50"><p className="text-xs font-medium text-orange-700">MARGEN RENTABILIDAD</p><p className="text-xl font-bold text-orange-600">{margenRentabilidad.toFixed(1)}%</p></div>
        </CardContent>
        <CardFooter className="border-t pt-4">
            <div className="space-y-2 w-full max-w-sm">
                <Label htmlFor="ingresos-totales" className="text-base">Ingresos Totales Estimados / Cobrados (Manual)</Label>
                <Input id="ingresos-totales" type="number" value={gestionCostos.ingresosTotalesEstimados} onChange={handleIngresosChange} placeholder="0.00" min="0" step="any" className="text-lg p-3" disabled={isSaving}/>
            </div>
        </CardFooter>
      </Card>

      <Accordion type="multiple" defaultValue={['costos-manuales', 'costos-gastronomicos', 'otros-modulos']} className="w-full space-y-4">
        <AccordionItem value="costos-manuales" className="border rounded-lg shadow-md bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-2"><HardHat className="w-5 h-5 text-primary/80"/>Costos Directos Manuales</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t space-y-4">
            <p className="text-sm text-muted-foreground">Añade aquí gastos varios como servicios de proveedores no detallados en otros módulos, compras generales, marketing, etc.</p>
            <form onSubmit={handleAddCostoItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-3 border rounded-md bg-muted/30">
              <div className="space-y-1 md:col-span-2"><Label htmlFor="costo-nombre">Nombre del Costo*</Label><Input id="costo-nombre" value={newCostoNombre} onChange={(e) => setNewCostoNombre(e.target.value)} placeholder="Ej: Alquiler Sonido Adicional" required/></div>
              <div className="space-y-1"><Label htmlFor="costo-categoria">Categoría*</Label><Select value={newCostoCategoria} onValueChange={(val) => setNewCostoCategoria(val as CostoCategoria)} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{COST_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label htmlFor="costo-monto">Monto Estimado (UYU)*</Label><Input id="costo-monto" type="number" value={newCostoMontoEstimado} onChange={(e) => setNewCostoMontoEstimado(e.target.value)} placeholder="0.00" min="0" step="any" required/></div>
              <div className="space-y-1 md:col-span-2"><Label htmlFor="costo-notas">Notas (Opcional)</Label><Input id="costo-notas" value={newCostoNotas} onChange={(e) => setNewCostoNotas(e.target.value)} placeholder="Detalles adicionales"/></div>
              <Button type="submit" className="md:col-span-2" disabled={isSaving}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Costo Manual</Button>
            </form>
            {gestionCostos.costosItems.length > 0 ? (
              <ScrollArea className="h-auto max-h-[300px] pr-2 mt-3"><ul className="space-y-2">
                {gestionCostos.costosItems.map(item => (
                  <li key={item.id} className="flex justify-between items-center p-2 border rounded bg-card hover:bg-muted/10">
                    <div><p className="font-medium text-sm">{item.nombre} <span className="text-xs text-muted-foreground">({item.categoria})</span></p>{item.notas && <p className="text-xs italic text-muted-foreground">{item.notas}</p>}</div>
                    <div className="flex items-center gap-2"><span className="font-semibold text-sm">{formatCurrency(item.montoEstimado)}</span><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCostoItem(item.id)}><Trash2 className="w-4 h-4"/></Button></div>
                  </li>
                ))}
              </ul></ScrollArea>
            ) : (<p className="text-sm text-muted-foreground text-center py-3">No hay costos manuales añadidos.</p>)}
            <p className="text-right font-semibold mt-2">Subtotal Costos Manuales: {formatCurrency(costoManualItems)}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="costos-gastronomicos" className="border rounded-lg shadow-md bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary/80"/>Resumen Costos Gastronómicos</div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t space-y-3">
                <div className="flex justify-between items-center p-2 border-b"><span>Costo Catering (Menú Principal):</span><span className="font-semibold">{formatCurrency(costoTotalMenu)}</span></div>
                <div className="flex justify-between items-center p-2 border-b"><span>Costo Repostería:</span><span className="font-semibold">{formatCurrency(costoTotalReposteria)}</span></div>
                <div className="flex justify-between items-center p-2"><span>Costo Bebidas:</span><span className="font-semibold">{formatCurrency(costoTotalBebidas)}</span></div>
                <p className="text-xs text-muted-foreground">Estos costos se calculan y gestionan en los módulos de <Link href="/planner-costo-fiesta" className="underline">Planificador Gastronómico</Link>, <Link href="/fiestas/nueva/catering" className="underline">Catering</Link>, <Link href="/planner-costo-fiesta/reposteria" className="underline">Repostería</Link> y <Link href="/planner-costo-fiesta/bebidas" className="underline">Bebidas</Link>.</p>
            </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="otros-modulos" className="border rounded-lg shadow-md bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary/80"/>Costos de Otros Módulos (Resumen)</div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t space-y-3">
                 <div className="flex justify-between items-center p-2 border-b"><span>Costo Personal Asignado:</span><span className="font-semibold">{formatCurrency(fiestaActual.personalAsignado.reduce((sum, p) => sum + p.eventSalary, 0))}</span></div>
                 <div className="flex justify-between items-center p-2 border-b"><span>Costo Decoración (Ítems Específicos):</span><span className="font-semibold">{formatCurrency(fiestaActual.decoracion?.items?.reduce((s, i) => s + (i.estimatedCost || 0), 0) || 0)}</span></div>
                 <p className="text-xs text-muted-foreground">Estos costos se gestionan en sus respectivos módulos (<Link href="/fiestas/nueva/personal" className="underline">Personal</Link>, <Link href="/fiestas/nueva/decoracion" className="underline">Decoración</Link>, etc.).</p>
            </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Card className="shadow-md">
        <CardHeader><CardTitle className="font-headline">Notas Generales de Costos y Rentabilidad</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={gestionCostos.notasGeneralesCostos || ''} onChange={handleNotasGeneralesChange} placeholder="Observaciones sobre la rentabilidad, estrategias de precios, acuerdos especiales, etc." rows={3} disabled={isSaving}/>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-muted/20 border-dashed">
          <CardHeader><CardTitle className="font-headline text-xl">Futuras Funcionalidades</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary/70"/>Lista de Compras Inteligente (Generación automática basada en menús y necesidades).</p>
              <p className="flex items-center gap-2"><HardHat className="w-4 h-4 text-primary/70"/>Plantillas de Costos Reutilizables (Para tipos de evento comunes).</p>
              <p className="text-xs">Integración más profunda con Inventario y Proveedores para un seguimiento de costos aún más preciso.</p>
          </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
          {isSaving ? 'Guardando...' : 'Guardar Gestión de Costos'}
        </Button>
      </div>
    </div>
  );
}
