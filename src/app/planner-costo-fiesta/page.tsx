
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, ChefHat, Cake, GlassWater, Loader2, AlertTriangle, Info, DollarSign, Palette, Settings2, HardHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getMenus } from '@/app/actions/menus-catering';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function PlanificadorGastronomicoPage() {
  const { toast } = useToast();
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(undefined);
  const [numberOfGuests, setNumberOfGuests] = useState<number>(0);
  const [costoOperativoFijo, setCostoOperativoFijo] = useState<number>(0);
  const [margenSugerido, setMargenSugerido] = useState<number>(30); 

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, menusData] = await Promise.all([
        getFiestaActual(),
        getMenus()
      ]);
      setFiestaActual(fiestaData);
      setAllMenus(menusData);

      if (fiestaData) {
        setNumberOfGuests(Number(fiestaData.configuracion.invitadosEstimados) || 0);
        if (fiestaData.menuAsignadoId && menusData.some(m => m.id === fiestaData.menuAsignadoId)) {
          setSelectedMenuId(fiestaData.menuAsignadoId);
        }
      }
    } catch (err: any) {
      console.error("Error loading planner data:", err);
      setError("No se pudieron cargar los datos necesarios para el planificador.");
      toast({ title: "Error de Carga", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectedMenu = useMemo(() => {
    return allMenus.find(menu => menu.id === selectedMenuId);
  }, [selectedMenuId, allMenus]);

  // Costo total del menú SELECCIONADO por persona
  const costoTotalMenuPorPersona = useMemo(() => {
    if (!selectedMenu) return 0;
    // Each item's totalDishCost in selectedMenu.items is already the per-person cost for that dish
    return selectedMenu.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0);
  }, [selectedMenu]);

  // Costo total del catering para TODOS los invitados
  const costoTotalCatering = useMemo(() => {
    return costoTotalMenuPorPersona * numberOfGuests;
  }, [costoTotalMenuPorPersona, numberOfGuests]);

  const costoTotalReposteria = useMemo(() => {
    let total = 0;
    fiestaActual?.reposteria?.categorias.forEach(cat => {
      if (cat.activada) {
        cat.items.forEach(item => {
          total += (item.costoEstimado || 0) * (item.cantidad || 1);
        });
      }
    });
    return total;
  }, [fiestaActual?.reposteria]);

  const costoTotalBebidas = useMemo(() => {
    let total = 0;
    fiestaActual?.bebidas?.categorias.forEach(cat => {
      if (cat.activada) {
        cat.items.forEach(item => {
          total += item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0));
        });
      }
    });
    return total;
  }, [fiestaActual?.bebidas]);

  const costoTotalGastronomia = useMemo(() => {
    return costoTotalCatering + costoTotalReposteria + costoTotalBebidas;
  }, [costoTotalCatering, costoTotalReposteria, costoTotalBebidas]);
  
  const costoTotalEvento = useMemo(() => {
    return costoTotalGastronomia + costoOperativoFijo;
  }, [costoTotalGastronomia, costoOperativoFijo]);

  const precioSugeridoCliente = useMemo(() => {
    return costoTotalEvento * (1 + (margenSugerido / 100));
  }, [costoTotalEvento, margenSugerido]);

  const rentabilidadEstimada = useMemo(() => {
    return precioSugeridoCliente - costoTotalEvento;
  }, [precioSugeridoCliente, costoTotalEvento]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando Planificador Gastronómico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <p className="text-xl font-semibold text-destructive">{error}</p>
        <Button onClick={loadInitialData} variant="outline" className="mt-6">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight font-headline">
            Planificador Gastronómico Integral
          </h1>
        </div>
        <Link href="/eventos" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Gestor de Fiestas
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Settings2 className="text-primary"/> Configuración del Evento</CardTitle>
          <CardDescription>Ajusta los parámetros base para el cálculo de costos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="guest-count-planner" className="text-base">Nº Invitados</Label>
              <Input id="guest-count-planner" type="number" value={numberOfGuests} onChange={(e) => setNumberOfGuests(Number(e.target.value) || 0)} min="0" className="text-lg p-3"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-select-planner" className="text-base">Menú Principal (Catering)</Label>
              <Select value={selectedMenuId} onValueChange={(value) => setSelectedMenuId(value === "none" ? undefined : value)}>
                <SelectTrigger id="menu-select-planner" className="text-lg p-3 h-auto"><SelectValue placeholder="Seleccionar menú..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-muted-foreground">Ninguno</SelectItem>
                  {allMenus.map(menu => (<SelectItem key={menu.id} value={menu.id}>{menu.name} ({menu.templateType || 'Personalizado'})</SelectItem>))}
                </SelectContent>
              </Select>
              {allMenus.length === 0 && <p className="text-xs text-muted-foreground mt-1">No hay menús. <Link href="/fiestas/nueva/catering/nuevo-menu" className="underline">Crear Menús</Link></p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo-operativo" className="text-base">Costo Operativo Fijo (UYU)</Label>
              <Input id="costo-operativo" type="number" value={costoOperativoFijo} onChange={(e) => setCostoOperativoFijo(Number(e.target.value) || 0)} min="0" placeholder="Ej: 5000" className="text-lg p-3"/>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><ChefHat className="text-primary"/>Menús de Catering</CardTitle>
            <CardDescription>Costo total catering ({numberOfGuests} inv.): {formatCurrency(costoTotalCatering)}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMenu ? (
                 <ScrollArea className="h-[120px] pr-3 text-sm">
                    <p className="font-medium mb-1">Platos de "{selectedMenu.name}" (Costo por persona: {formatCurrency(costoTotalMenuPorPersona)}):</p>
                    <ul className="space-y-0.5">
                      {selectedMenu.items.map(item => (
                        <li key={item.id} className="flex justify-between text-xs">
                          <span>{item.name}</span>
                          {/* totalDishCost is already per person for the dish */}
                          <span>{formatCurrency(item.totalDishCost || 0)} c/u</span> 
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
            ) : <p className="text-sm text-muted-foreground">No hay menú de catering seleccionado.</p>}
          </CardContent>
          <CardFooter>
            <Link href="/fiestas/nueva/catering" passHref className="w-full">
              <Button variant="outline" className="w-full">Gestionar Menús</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><Cake className="text-primary"/>Módulo de Repostería</CardTitle>
             <CardDescription>Costo total repostería: {formatCurrency(costoTotalReposteria)}</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Define tortas, candy bar, mesas dulces, etc.</p>
          </CardContent>
          <CardFooter>
            <Link href="/planner-costo-fiesta/reposteria" passHref className="w-full">
              <Button variant="outline" className="w-full">Gestionar Repostería</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><GlassWater className="text-primary"/>Módulo de Bebidas</CardTitle>
            <CardDescription>Costo total bebidas: {formatCurrency(costoTotalBebidas)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Calcula refrescos, jugos, alcohol, barra de tragos.</p>
          </CardContent>
          <CardFooter>
            <Link href="/planner-costo-fiesta/bebidas" passHref className="w-full">
              <Button variant="outline" className="w-full">Gestionar Bebidas</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader><CardTitle className="font-headline text-2xl flex items-center gap-2"><DollarSign className="text-primary w-8 h-8"/>Resumen Final de Costos y Precios</CardTitle><CardDescription>Visualiza el costo total, precio sugerido y margen.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center md:text-left">
          <div className="p-4 bg-muted/30 rounded-lg"><p className="text-sm font-medium text-muted-foreground">Costo Gastronomía Total</p><p className="text-2xl font-bold">{formatCurrency(costoTotalGastronomia)}</p></div>
          <div className="p-4 bg-muted/30 rounded-lg"><p className="text-sm font-medium text-muted-foreground">Costo Op. Fijo</p><p className="text-2xl font-bold">{formatCurrency(costoOperativoFijo)}</p></div>
          <div className="p-4 bg-primary/10 rounded-lg"><p className="text-sm font-medium text-primary/80">COSTO TOTAL EVENTO</p><p className="text-3xl font-bold text-primary">{formatCurrency(costoTotalEvento)}</p></div>
        </CardContent>
        <Separator className="my-4"/>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="margen-sugerido" className="text-base">Margen Ganancia Sugerido (%)</Label>
              <Input id="margen-sugerido" type="number" value={margenSugerido} onChange={(e) => setMargenSugerido(Number(e.target.value) || 0)} min="0" max="200" className="text-lg p-3"/>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center md:text-left"><p className="text-sm font-medium text-green-700">Precio Sugerido al Cliente</p><p className="text-3xl font-bold text-green-600">{formatCurrency(precioSugeridoCliente)}</p></div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center md:text-left"><p className="text-sm font-medium text-blue-700">Rentabilidad Estimada</p><p className="text-3xl font-bold text-blue-600">{formatCurrency(rentabilidadEstimada)}</p></div>
            </div>
        </CardContent>
        <CardFooter><p className="text-xs text-muted-foreground">Ajustes por inflación y más detalles en futuras actualizaciones.</p></CardFooter>
      </Card>
    </div>
  );
}

