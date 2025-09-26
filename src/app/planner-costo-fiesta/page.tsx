
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, ChefHat, Cake, GlassWater, Loader2, AlertTriangle, Info, DollarSign, Settings2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ReposteriaData, BebidasData } from '@/types/fiesta';
import type { FullMenu } from '@/types/catering';
import { getMenus } from '@/app/actions/menus-catering';
import { getReposteriaDataForPlanner, getBebidasDataForPlanner } from '@/app/actions/planner-actions';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function PlanificadorGastronomicoPage() {
  const { toast } = useToast();
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [reposteriaData, setReposteriaData] = useState<ReposteriaData | null>(null);
  const [bebidasData, setBebidasData] = useState<BebidasData | null>(null);

  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(undefined);
  const [numberOfGuests, setNumberOfGuests] = useState<number>(100); // Default to 100 for general planning
  const [costoOperativoFijo, setCostoOperativoFijo] = useState<number>(0);
  const [margenSugerido, setMargenSugerido] = useState<number>(30); 

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [menusData, fetchedReposteria, fetchedBebidas] = await Promise.all([
        getMenus(),
        getReposteriaDataForPlanner(),
        getBebidasDataForPlanner(),
      ]);
      setAllMenus(menusData);
      setReposteriaData(fetchedReposteria);
      setBebidasData(fetchedBebidas);

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

  const costoTotalMenuPorPersona = useMemo(() => {
    if (!selectedMenu) return 0;
    return selectedMenu.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0);
  }, [selectedMenu]);

  const costoTotalCatering = useMemo(() => {
    return costoTotalMenuPorPersona * numberOfGuests;
  }, [costoTotalMenuPorPersona, numberOfGuests]);

  const costoTotalReposteria = useMemo(() => {
    let total = 0;
    reposteriaData?.categorias.forEach(cat => {
      if (cat.activada) {
        cat.items.forEach(item => {
          total += (item.costoEstimado || 0) * (item.cantidad || 1);
        });
      }
    });
    return total;
  }, [reposteriaData]);

  const costoTotalBebidas = useMemo(() => {
    let total = 0;
    bebidasData?.categorias.forEach(cat => {
      if (cat.activada) {
        cat.items.forEach(item => {
          total += item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0));
        });
      }
    });
    return total;
  }, [bebidasData]);

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
            Planificador Gastronómico General
          </h1>
        </div>
        <Link href="/empresa" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Gestión Empresa
          </Button>
        </Link>
      </div>
      <CardDescription className="text-lg">
        Utiliza esta herramienta como una calculadora general para estimar costos y precios de cualquier evento.
      </CardDescription>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Settings2 className="text-primary"/> Parámetros de Simulación</CardTitle>
          <CardDescription>Ajusta los parámetros base para el cálculo de costos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="guest-count-planner" className="text-base">Nº Invitados a simular</Label>
              <Input id="guest-count-planner" type="number" value={numberOfGuests} onChange={(e) => setNumberOfGuests(Number(e.target.value) || 0)} min="0" className="text-lg p-3"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-select-planner" className="text-base">Menú Principal (Catering)</Label>
              <Select value={selectedMenuId} onValueChange={(value) => setSelectedMenuId(value === "none" ? undefined : value)}>
                <SelectTrigger id="menu-select-planner" className="text-lg p-3 h-auto"><SelectValue placeholder="Seleccionar menú..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-muted-foreground">Ninguno</SelectItem>
                  {allMenus.map(menu => (<SelectItem key={menu.id} value={menu.id}>{menu.name}</SelectItem>))}
                </SelectContent>
              </Select>
              {allMenus.length === 0 && <p className="text-xs text-muted-foreground mt-1">No hay menús. <Link href="/empresa/menus/nuevo" className="underline">Crear Menús</Link></p>}
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
                          <span>{formatCurrency(item.totalDishCost || 0)} c/u</span> 
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
            ) : <p className="text-sm text-muted-foreground">No hay menú de catering seleccionado.</p>}
          </CardContent>
          <CardFooter>
            <Link href="/empresa/menus" passHref className="w-full">
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
             <p className="text-sm text-muted-foreground">Define tortas, candy bar, mesas dulces, etc. Los costos se basan en los ítems activados en la configuración.</p>
          </CardContent>
          <CardFooter>
            <Link href="/planner-costo-fiesta/reposteria" passHref className="w-full">
              <Button variant="outline" className="w-full">Configurar Repostería</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><GlassWater className="text-primary"/>Módulo de Bebidas</CardTitle>
            <CardDescription>Costo total bebidas: {formatCurrency(costoTotalBebidas)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Calcula refrescos, jugos, alcohol, barra de tragos. Los costos se basan en los ítems activados.</p>
          </CardContent>
          <CardFooter>
            <Link href="/planner-costo-fiesta/bebidas" passHref className="w-full">
              <Button variant="outline" className="w-full">Configurar Bebidas</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-xl border-t-4 border-primary">
            <CardHeader><CardTitle className="font-headline text-2xl flex items-center gap-2"><DollarSign className="text-primary w-8 h-8"/>Resumen Final de Costos y Precios</CardTitle><CardDescription>Visualiza el costo total, precio sugerido y margen.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center md:text-left">
              <div className="p-4 bg-muted/30 rounded-lg"><p className="text-sm font-medium text-muted-foreground">Costo Gastronomía Total</p><p className="text-2xl font-bold">{formatCurrency(costoTotalGastronomia)}</p></div>
              <div className="p-4 bg-muted/30 rounded-lg"><p className="text-sm font-medium text-muted-foreground">Costo Op. Fijo</p><p className="text-2xl font-bold">{formatCurrency(costoOperativoFijo)}</p></div>
              <div className="p-4 bg-primary/10 rounded-lg md:col-span-2"><p className="text-sm font-medium text-primary/80">COSTO TOTAL EVENTO</p><p className="text-3xl font-bold text-primary">{formatCurrency(costoTotalEvento)}</p></div>
            </CardContent>
            <Separator className="my-4"/>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="margen-sugerido" className="text-base">Margen Ganancia Sugerido (%)</Label>
                  <Input id="margen-sugerido" type="number" value={margenSugerido} onChange={(e) => setMargenSugerido(Number(e.target.value) || 0)} min="0" max="200" className="text-lg p-3"/>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center md:text-left"><p className="text-sm font-medium text-green-700">Precio Sugerido al Cliente</p><p className="text-3xl font-bold text-green-600">{formatCurrency(precioSugeridoCliente)}</p></div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center md:text-left"><p className="text-sm font-medium text-blue-700">Rentabilidad Estimada</p><p className="text-3xl font-bold text-blue-600">{formatCurrency(rentabilidadEstimada)}</p></div>
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2"><ShoppingCart className="text-primary"/>Lista de Compras</CardTitle>
                <CardDescription>Genera una lista consolidada con todos los insumos necesarios para la parte gastronómica de tu evento.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Esta herramienta te ayudará a saber qué necesitas comprar basado en tu menú, repostería y plan de bebidas.</p>
            </CardContent>
            <CardFooter>
                 <Link href="/fiestas/nueva/catering/lista-compras" passHref className="w-full">
                    <Button className="w-full">Generar Lista de Compras</Button>
                </Link>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
