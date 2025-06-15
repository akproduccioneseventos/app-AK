
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, ChefHat, Cake, GlassWater, Loader2, AlertTriangle, Info, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getMenus } from '@/app/actions/menus-catering';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function PlannerCostoFiestaPage() {
  const { toast } = useToast();
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(undefined);
  const [numberOfGuests, setNumberOfGuests] = useState<number>(0);

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
        } else if (menusData.length > 0) {
          // setSelectedMenuId(menusData[0].id); // Optionally select the first menu if none assigned
        }
      } else if (menusData.length > 0) {
        // setSelectedMenuId(menusData[0].id);
      }

    } catch (err: any) {
      console.error("Error loading planner data:", err);
      setError("No se pudieron cargar los datos necesarios para el planner.");
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

  const calculatedTotalCost = useMemo(() => {
    if (!selectedMenu || numberOfGuests <= 0) {
      return 0;
    }
    // Simplificado: Suma totalDishCost de cada item y multiplica por invitados.
    // Esto asume que totalDishCost es por persona o que la estructura de items es tal que esta suma tiene sentido.
    // Una lógica más precisa requeriría costo por porción de cada item.
    const costPerMenu = selectedMenu.items.reduce((sum, item) => {
      // Si item.costPerPortion está disponible y es numérico, usarlo.
      // Si no, y totalDishCost y basePortions están disponibles, calcularlo.
      // Si no, usar totalDishCost asumiendo que es por persona para esta suma.
      let costForItemPerPerson = 0;
      if (typeof item.costPerPortion === 'number') {
        costForItemPerPerson = item.costPerPortion;
      } else if (typeof item.totalDishCost === 'number' && typeof item.basePortions === 'number' && item.basePortions > 0) {
        costForItemPerPerson = item.totalDishCost / item.basePortions;
      } else if (typeof item.totalDishCost === 'number') {
        // Fallback si no hay info de porciones: asumir totalDishCost es por persona
        costForItemPerPerson = item.totalDishCost;
      }
      return sum + costForItemPerPerson;
    }, 0);
    
    return costPerMenu * numberOfGuests;
  }, [selectedMenu, numberOfGuests]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando Planner...</p>
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Planner Costo-Fiesta
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
          <CardTitle className="font-headline text-xl">Configuración y Cálculo de Costos</CardTitle>
          <CardDescription>
            Selecciona un menú, ajusta la cantidad de invitados y visualiza el costo estimado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
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
              <Label htmlFor="menu-select-planner" className="text-base">Menú Seleccionado</Label>
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
            </div>
          </div>
          
          {selectedMenu && (
            <Card className="bg-muted/30 p-4 mt-4">
              <CardTitle className="text-md font-medium mb-2">Detalle del Menú: {selectedMenu.name}</CardTitle>
              <ScrollArea className="h-[150px] pr-3 text-sm">
                <ul className="space-y-1">
                {selectedMenu.items.map(item => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.name} ({item.type})</span>
                    {/* Idealmente usar item.costPerPortion aquí si estuviera bien definido */}
                    <span>{formatCurrency(item.costPerPortion || item.totalDishCost || 0)} c/u</span>
                  </li>
                ))}
                </ul>
              </ScrollArea>
            </Card>
          )}

          <Separator className="my-6" />

          <div className="text-center space-y-2">
            <Label className="text-lg font-medium text-muted-foreground">Costo Total Estimado del Menú para {numberOfGuests} invitados:</Label>
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(calculatedTotalCost)}
            </p>
             <p className="text-xs text-muted-foreground">(Basado en costos de platos individuales. No incluye servicios adicionales, repostería, bebidas aún.)</p>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-sm text-muted-foreground">
                Este es un cálculo preliminar. Ajusta los detalles en los módulos específicos.
            </p>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Módulos de Planificación Detallada</CardTitle>
            <CardDescription>Accede a cada módulo para refinar los costos y detalles.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/fiestas/nueva/catering/modificar-menu" passHref>
                <Button variant="outline" className="w-full h-20 flex-col items-center justify-center">
                    <ChefHat className="w-7 h-7 mb-1 text-primary"/>
                    Diseñador de Menús
                </Button>
            </Link>
             <Card className="h-20 flex flex-col items-center justify-center p-4 text-center bg-muted/50 border-dashed">
                <Cake className="w-7 h-7 mb-1 text-muted-foreground/70"/>
                <span className="text-sm text-muted-foreground">Repostería</span>
                <span className="text-xs text-muted-foreground/70">(Próximamente)</span>
            </Card>
            <Card className="h-20 flex flex-col items-center justify-center p-4 text-center bg-muted/50 border-dashed">
                <GlassWater className="w-7 h-7 mb-1 text-muted-foreground/70"/>
                <span className="text-sm text-muted-foreground">Bebidas</span>
                <span className="text-xs text-muted-foreground/70">(Próximamente)</span>
            </Card>
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">
                Los módulos de Repostería y Bebidas permitirán una gestión detallada de estos ítems.
            </p>
        </CardFooter>
      </Card>
       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><DollarSign className="text-primary"/>Métricas y Totales Finales</CardTitle>
            <CardDescription>Visualiza el costo total del evento, precio sugerido al cliente y margen de ganancia.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">Costo Total del Evento</p>
                <p className="text-2xl font-bold">{formatCurrency(calculatedTotalCost)}</p>
                <p className="text-xs text-muted-foreground">(Menú + Repostería + Bebidas + Operativos)</p>
            </Card>
             <Card className="p-4 bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">Precio Sugerido al Cliente</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculatedTotalCost * 1.5)}</p> {/* Ejemplo de margen */}
                <p className="text-xs text-muted-foreground">(Definir margen objetivo)</p>
            </Card>
             <Card className="p-4 bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">Margen de Ganancia Bruto</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculatedTotalCost * 0.5)}</p> {/* Ejemplo */}
                 <p className="text-xs text-muted-foreground">(Precio Cliente - Costo Total)</p>
            </Card>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Funcionalidades como ajuste por inflación y costos operativos fijos se añadirán próximamente.
            </p>
        </CardFooter>
      </Card>

    </div>
  );
}
