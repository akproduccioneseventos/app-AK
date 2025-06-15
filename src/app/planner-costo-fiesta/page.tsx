
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, ChefHat, Cake, GlassWater, Loader2, AlertTriangle, Info, DollarSign, Palette, Settings2 } from 'lucide-react';
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
  const [margenSugerido, setMargenSugerido] = useState<number>(30); // Ejemplo 30%

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
        } else if (menusData.length > 0 && menusData[0].id) {
          // setSelectedMenuId(menusData[0].id); // Opcional: seleccionar el primero si no hay ninguno asignado
        }
      } else if (menusData.length > 0 && menusData[0].id) {
        // setSelectedMenuId(menusData[0].id);
      }

    } catch (err: any) {
      console.error("Error loading planner data:", err);
      setError("No se pudieron cargar los datos necesarios para el planificador.");
      toast({ title: "Error de Carga", description: err.message, variant: "destructive" });
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
    // Simplified calculation: sum of totalDishCost for each item.
    // Assumes each item's totalDishCost is for one person or the entire group if basePortions is not 1.
    // For a more accurate per-person cost, this logic needs refinement based on how totalDishCost and basePortions are defined.
    // If totalDishCost is for `basePortions` people, then costPerPortion = totalDishCost / basePortions.
    // If totalDishCost is already per person, then costPerPortion = totalDishCost.
    // The current `MenuItem` type has `costPerPortion` which should ideally be used if available.
    
    return selectedMenu.items.reduce((sum, item) => {
      let costForItemPerPerson = 0;
      if (typeof item.costPerPortion === 'number') { // Ideal case
        costForItemPerPerson = item.costPerPortion;
      } else if (typeof item.totalDishCost === 'number' && typeof item.basePortions === 'number' && item.basePortions > 0) {
        costForItemPerPerson = item.totalDishCost / item.basePortions; // Calculate if not pre-calculated
      } else if (typeof item.totalDishCost === 'number') { // Fallback if basePortions is not set or invalid
        costForItemPerPerson = item.totalDishCost; // Assume totalDishCost is per person
      }
      return sum + costForItemPerPerson;
    }, 0);
  }, [selectedMenu]);


  const costoTotalCatering = useMemo(() => {
    return costoTotalMenuPorPersona * numberOfGuests;
  }, [costoTotalMenuPorPersona, numberOfGuests]);

  // Placeholders para costos de repostería y bebidas
  const costoTotalReposteria = 0; // TODO: Implementar lógica
  const costoTotalBebidas = 0;    // TODO: Implementar lógica

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

      {/* Sección de Configuración General */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <Settings2 className="text-primary"/> Configuración del Evento
          </CardTitle>
          <CardDescription>
            Ajusta los parámetros base para el cálculo de costos. El número de invitados y el menú seleccionado se cargan desde la fiesta actual si están definidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="guest-count-planner" className="text-base">Cantidad de Invitados</Label>
              <Input
                id="guest-count-planner"
                type="number"
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(Number(e.target.value) || 0)}
                min="0"
                placeholder="Ej: 100"
                className="text-lg p-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-select-planner" className="text-base">Menú de Catering Principal</Label>
              <Select
                value={selectedMenuId}
                onValueChange={(value) => setSelectedMenuId(value === "none" ? undefined : value)}
              >
                <SelectTrigger id="menu-select-planner" className="text-lg p-3 h-auto">
                  <SelectValue placeholder="Seleccionar un menú..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-muted-foreground">Ningún menú seleccionado</SelectItem>
                  {allMenus.map(menu => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name} ({menu.templateType || 'Personalizado'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allMenus.length === 0 && <p className="text-xs text-muted-foreground mt-1">No hay menús creados. <Link href="/fiestas/nueva/catering/modificar-menu" className="underline">Crear Menús</Link></p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo-operativo" className="text-base">Costo Operativo Fijo (Ej: Transporte)</Label>
              <Input
                id="costo-operativo"
                type="number"
                value={costoOperativoFijo}
                onChange={(e) => setCostoOperativoFijo(Number(e.target.value) || 0)}
                min="0"
                placeholder="Ej: 5000"
                className="text-lg p-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalle del Menú Seleccionado */}
      {selectedMenu && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <ChefHat className="text-primary"/> Detalle del Menú: {selectedMenu.name}
            </CardTitle>
            <CardDescription>
              Costo por persona para este menú: {formatCurrency(costoTotalMenuPorPersona)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-3 text-sm">
              <ul className="space-y-1">
              {selectedMenu.items.map(item => (
                <li key={item.id} className="flex justify-between p-1.5 rounded hover:bg-muted/50">
                  <div>
                    <span className="font-medium">{item.name}</span> <span className="text-xs text-muted-foreground">({item.type})</span>
                    {item.notes && <p className="text-xs text-muted-foreground italic pl-2">{item.notes}</p>}
                  </div>
                  {/* Display costPerPortion if available, otherwise fallback to totalDishCost (assuming it's per person or needs basePortions to calculate) */}
                  <span className="font-medium">{formatCurrency(item.costPerPortion ?? (item.basePortions && item.basePortions > 0 ? item.totalDishCost / item.basePortions : item.totalDishCost) ?? 0)} c/u</span>
                </li>
              ))}
              </ul>
            </ScrollArea>
          </CardContent>
           <CardFooter>
             <Link href="/fiestas/nueva/catering/modificar-menu" passHref className="w-full">
                <Button variant="outline" className="w-full">
                    Gestionar y Editar Menús Detalladamente
                </Button>
            </Link>
           </CardFooter>
        </Card>
      )}

      {/* Módulos Detallados: Repostería y Bebidas (Placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><Cake className="text-primary"/>Módulo de Repostería</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-32">
            <Info className="w-8 h-8 text-muted-foreground mb-2"/>
            <p className="text-sm text-muted-foreground">Funcionalidad detallada en desarrollo.</p>
            <p className="text-xs text-muted-foreground">Costo Repostería Actual: {formatCurrency(costoTotalReposteria)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><GlassWater className="text-primary"/>Módulo de Bebidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-32">
             <Info className="w-8 h-8 text-muted-foreground mb-2"/>
            <p className="text-sm text-muted-foreground">Funcionalidad detallada en desarrollo.</p>
            <p className="text-xs text-muted-foreground">Costo Bebidas Actual: {formatCurrency(costoTotalBebidas)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Final de Costos y Precios */}
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2"><DollarSign className="text-primary w-8 h-8"/>Métricas y Totales Finales</CardTitle>
          <CardDescription>Visualiza el costo total del evento, precio sugerido al cliente y margen de ganancia.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center md:text-left">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Costo Gastronomía</p>
            <p className="text-2xl font-bold">{formatCurrency(costoTotalGastronomia)}</p>
            <p className="text-xs text-muted-foreground">(Menú + Repostería + Bebidas)</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Costo Operativo Fijo</p>
            <p className="text-2xl font-bold">{formatCurrency(costoOperativoFijo)}</p>
          </div>
           <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium text-primary/80">COSTO TOTAL EVENTO</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(costoTotalEvento)}</p>
          </div>
        </CardContent>
        <Separator className="my-4"/>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="margen-sugerido" className="text-base">Margen de Ganancia Sugerido (%)</Label>
              <Input
                id="margen-sugerido"
                type="number"
                value={margenSugerido}
                onChange={(e) => setMargenSugerido(Number(e.target.value) || 0)}
                min="0"
                max="200" // Un límite razonable
                placeholder="Ej: 30 para 30%"
                className="text-lg p-3"
              />
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center md:text-left">
                  <p className="text-sm font-medium text-green-700">Precio Sugerido al Cliente</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(precioSugeridoCliente)}</p>
              </div>
               <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center md:text-left">
                  <p className="text-sm font-medium text-blue-700">Rentabilidad Estimada</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(rentabilidadEstimada)}</p>
              </div>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Funcionalidades como ajuste por inflación y desglose más detallado se añadirán próximamente.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
