'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ChefHat, PlusCircle, Copy, Edit, Trash2, Loader2, DollarSign, Info, Percent, GlassWater, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMenus, deleteMenu, duplicateMenu, adjustAllDishMargins } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const BARRA_TRAGOS_BREAKDOWN = [
    { producto: "Licor de Frutilla", unidad: "Litros", cantPP: 0.02, costoKL: 300, costoUn: 6, cantTotal: 2, costoTotal: 600 },
    { producto: "Licor de Durazno", unidad: "Litros", cantPP: 0.02, costoKL: 300, costoUn: 6, cantTotal: 2, costoTotal: 600 },
    { producto: "Jugo de Durazno", unidad: "Litros", cantPP: 0.02, costoKL: 50, costoUn: 1, cantTotal: 2, costoTotal: 100 },
    { producto: "Licor blue", unidad: "Litros", cantPP: 0.02, costoKL: 300, costoUn: 6, cantTotal: 2, costoTotal: 600 },
    { producto: "Fernet", unidad: "Litros", cantPP: 0.04, costoKL: 400, costoUn: 16, cantTotal: 4, costoTotal: 1600 },
    { producto: "Granadina", unidad: "Litros", cantPP: 0.01, costoKL: 220, costoUn: 2.2, cantTotal: 1, costoTotal: 220 },
    { producto: "Lata durazno", unidad: "Unidades", cantPP: 0.03, costoKL: 80, costoUn: 2.4, cantTotal: 3, costoTotal: 240 },
    { producto: "lata anana", unidad: "Unidades", cantPP: 0.05, costoKL: 117, costoUn: 5.85, cantTotal: 5, costoTotal: 585 },
    { producto: "Pepsi", unidad: "Litros", cantPP: 0.14, costoKL: 90, costoUn: 12.6, cantTotal: 14, costoTotal: 1260 },
    { producto: "vasos y sorvitos", unidad: "Unidades", cantPP: 3, costoKL: 2, costoUn: 6, cantTotal: 300, costoTotal: 600 },
    { producto: "Refresco lima barato", unidad: "Litros", cantPP: 0.02, costoKL: 65, costoUn: 1.3, cantTotal: 2, costoTotal: 130 },
    { producto: "Vodka", unidad: "Litros", cantPP: 0.03, costoKL: 280, costoUn: 8.4, cantTotal: 3, costoTotal: 840 },
    { producto: "Ron", unidad: "Litros", cantPP: 0.02, costoKL: 300, costoUn: 6, cantTotal: 2, costoTotal: 600 },
    { producto: "Limon", unidad: "Gramos", cantPP: 20, costoKL: 70, costoUn: 1.4, cantTotal: 2000, costoTotal: 140 },
    { producto: "Frutilla", unidad: "Gramos", cantPP: 20, costoKL: 120, costoUn: 2.4, cantTotal: 2000, costoTotal: 240 },
    { producto: "Azucar", unidad: "Gramos", cantPP: 20, costoKL: 70, costoUn: 1.4, cantTotal: 2000, costoTotal: 140 },
    { producto: "Caña", unidad: "Litros", cantPP: 0.02, costoKL: 300, costoUn: 6, cantTotal: 2, costoTotal: 600 },
    { producto: "Jugo de naranja", unidad: "Litros", cantPP: 0.1, costoKL: 35, costoUn: 3.5, cantTotal: 10, costoTotal: 350 },
];

export default function GestionMenusPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<FullMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [adjustmentPercentage, setAdjustmentPercentage] = useState(10);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchMenus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMenus();
      setMenus(data);
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar los menús.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleDelete = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const result = await deleteMenu(id);
      if (result.success) {
        toast({ title: 'Menú Eliminado', description: `Se eliminó "${name}".` });
        fetchMenus();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al Eliminar', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleAdjustMargins = async () => {
    setIsAdjusting(true);
    try {
      const result = await adjustAllDishMargins(adjustmentPercentage);
      if (result.success) {
        toast({ title: "Márgenes ajustados", description: `Los márgenes de todos los platos fueron ajustados.` });
        await fetchMenus();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al ajustar márgenes", description: err.message, variant: "destructive" });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const result = await duplicateMenu(id);
      if (result.success) {
        toast({ title: 'Menú Duplicado', description: `Se creó una copia de "${name}".` });
        fetchMenus();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al Duplicar', description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };
  
  const calculateTotalCostPerPerson = (items: MenuItem[]) => {
    return items.reduce((total, item) => total + (item.totalDishCost || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador Gastronómico Maestro</h1>
        </div>
         <div className="flex gap-2">
            <Link href="/empresa/menus/catalogo" passHref><Button variant="secondary">Catálogo de Platos</Button></Link>
            <Link href="/empresa/menus/nuevo" passHref><Button><PlusCircle className="w-4 h-4 mr-2"/>Crear Menú</Button></Link>
            <Link href="/empresa" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Button></Link>
        </div>
      </div>

      <Card className="border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5">
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle className="font-headline text-2xl flex items-center gap-2">
                          <GlassWater className="text-primary" /> BARRA DE TRAGOS
                      </CardTitle>
                      <CardDescription>Análisis de rentabilidad y costos (Base 100 invitados)</CardDescription>
                  </div>
                  <Link href="/empresa/insumos?subcategoria=Barra+de+Tragos" passHref>
                      <Button variant="outline" size="sm">
                          <Package className="w-4 h-4 mr-2"/> Ver Insumos en Stock
                      </Button>
                  </Link>
              </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 border rounded-md bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Costo por Persona</p>
                      <p className="text-xl font-bold text-primary">$ 125,45</p>
                  </div>
                  <div className="p-3 border rounded-md bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Rentabilidad</p>
                      <p className="text-xl font-bold text-green-600">100%</p>
                  </div>
                  <div className="p-3 border rounded-md bg-primary/10 border-primary/20">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Precio de Venta</p>
                      <p className="text-xl font-bold text-primary">$ 251,00</p>
                  </div>
                  <div className="p-3 border rounded-md bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Costo Total (100 inv)</p>
                      <p className="text-xl font-bold">$ 12.545</p>
                  </div>
              </div>

              <div className="overflow-x-auto rounded-md border">
                  <Table>
                      <TableHeader className="bg-muted/50">
                          <TableRow>
                              <TableHead className="text-xs">Producto</TableHead>
                              <TableHead className="text-xs">Unidad</TableHead>
                              <TableHead className="text-xs text-right">Cant p/p</TableHead>
                              <TableHead className="text-xs text-right">Costo kl/lt</TableHead>
                              <TableHead className="text-xs text-right">Costo p/p</TableHead>
                              <TableHead className="text-xs text-right font-bold">Costo Total (100)</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {BARRA_TRAGOS_BREAKDOWN.map((row, i) => (
                              <TableRow key={i} className="text-xs">
                                  <TableCell className="font-medium">{row.producto}</TableCell>
                                  <TableCell>{row.unidad}</TableCell>
                                  <TableCell className="text-right">{row.cantPP}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(row.costoKL)}</TableCell>
                                  <TableCell className="text-right font-medium">{formatCurrency(row.costoUn)}</TableCell>
                                  <TableCell className="text-right font-bold">{formatCurrency(row.costoTotal)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          </CardContent>
      </Card>

       <Card>
        <CardHeader>
            <CardTitle className="font-headline text-lg">Ajuste de Márgenes Global</CardTitle>
            <CardDescription>
                Aplica un aumento o disminución a los márgenes de ganancia de **todos los platos** en **todos los menús**. El precio de venta se recalculará automáticamente.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-grow">
                <Label htmlFor="percentage-adjust">Puntos Porcentuales a Ajustar</Label>
                <Input
                id="percentage-adjust"
                type="number"
                value={adjustmentPercentage}
                onChange={(e) => setAdjustmentPercentage(Number(e.target.value))}
                placeholder="Ej: 10 para aumentar, -5 para disminuir"
                />
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button disabled={isAdjusting || adjustmentPercentage === 0}>
                    {isAdjusting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Percent className="w-4 h-4 mr-2"/>}
                    Aplicar Ajuste de Margen
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción modificará los márgenes de ganancia de TODOS los platos en un 
                      <span className="font-bold"> {adjustmentPercentage} puntos porcentuales</span>. Esta acción es irreversible.
                      ¿Deseas continuar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAdjustMargins}>
                    Aplicar ajuste del {adjustmentPercentage > 0 ? `+${adjustmentPercentage}`: adjustmentPercentage}%
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
    </Card>
       <Card>
        <CardHeader>
          <CardTitle>Menús Guardados</CardTitle>
          <CardDescription>Crea, edita y gestiona tus plantillas de menús para reutilizar en presupuestos y eventos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
          ) : menus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map(menu => (
              <Card key={menu.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">{menu.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 h-8">{menu.description || 'Sin descripción.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                   <div className="flex items-center gap-2 text-sm font-semibold">
                      <DollarSign className="w-4 h-4 text-green-600"/>
                      Costo p/p: {formatCurrency(calculateTotalCostPerPerson(menu.items))}
                   </div>
                   <div className="text-xs text-muted-foreground">{menu.items.length} plato(s)</div>
                </CardContent>
                <CardFooter className="flex justify-end gap-1 border-t pt-2 p-2">
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(menu.id, menu.name)} disabled={!!processingId} title="Duplicar">
                      {processingId === menu.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                   </Button>
                   <Link href={`/empresa/menus/${menu.id}/editar`} passHref>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"><Edit className="w-4 h-4"/></Button>
                   </Link>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={!!processingId} title="Eliminar">
                          {processingId === menu.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar Menú?</AlertDialogTitle><AlertDialogDescription>Se eliminará la plantilla "{menu.name}".</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(menu.id, menu.name)} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                </CardFooter>
              </Card>
            ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
                <p>No has creado ninguna plantilla de menú todavía.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
