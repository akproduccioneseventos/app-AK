
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Sparkles, PackagePlus, Edit, Trash2, Loader2, AlertTriangle, Search, DollarSign, Printer, Copy, Percent, Package, Truck, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa, deleteServicioEmpresa, duplicateServicioEmpresa, adjustAllServicePrices, adjustAllServiceCosts } from '@/app/actions/servicios-empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const getCalculationMethodLabel = (method?: string): string => {
    switch (method) {
        case 'fijo': return 'Precio Fijo';
        case 'porPersona': return 'Por Persona';
        case 'ratio': return 'Por Ratio de Invitados';
        case 'tramos': return 'Por Tramos de Invitados';
        default: return 'No definido';
    }
}

export default function CatalogoServiciosPage() {
  const { toast } = useToast();
  const [allItems, setAllItems] = useState<ServicioEmpresa[]>([]);
  const [filteredItems, setFilteredItems] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState(10);
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  const [costAdjustmentPercentage, setCostAdjustmentPercentage] = useState(10);
  const [isAdjustingCost, setIsAdjustingCost] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServiciosEmpresa();
      const services = data.filter(s => s.tipoItem === 'Servicio');
      setAllItems(services);
      setFilteredItems(services);
    } catch (err: any) {
      setError("No se pudo cargar el catálogo de servicios.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allItems.filter(item =>
      (item.nombre.toLowerCase().includes(lowercasedFilter) ||
      (item.categoria && item.categoria.toLowerCase().includes(lowercasedFilter)))
    );
    setFilteredItems(filteredData);
  }, [searchTerm, allItems]);
  
  const handleDelete = async (id: string, nombreItem?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteServicioEmpresa(id);
      if (result.success) {
        toast({ title: "Servicio Eliminado", description: `El servicio "${nombreItem || id}" ha sido eliminado.` });
        fetchItems(); 
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al Eliminar", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };
  
  const handleAdjustPrices = async () => {
    setIsAdjusting(true);
    try {
      const result = await adjustAllServicePrices(adjustmentPercentage);
      if (result.success) {
        toast({ title: "Precios ajustados", description: `Todos los servicios fueron ajustados en un ${adjustmentPercentage}%.` });
        await fetchItems(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al ajustar precios", description: err.message, variant: "destructive" });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleAdjustCosts = async () => {
    setIsAdjustingCost(true);
    try {
      const result = await adjustAllServiceCosts(costAdjustmentPercentage);
      if (result.success) {
        toast({ title: "Costos ajustados", description: `Todos los costos de servicios fueron ajustados en un ${costAdjustmentPercentage}%.` });
        await fetchItems(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al ajustar costos", description: err.message, variant: "destructive" });
    } finally {
      setIsAdjustingCost(false);
    }
  };

  const handleDuplicate = async (id: string, nombreItem?: string) => {
    setDuplicatingId(id);
    try {
      const result = await duplicateServicioEmpresa(id);
      if (result.success) {
        toast({ title: "Servicio Duplicado", description: `Se creó una copia de "${nombreItem}".` });
        fetchItems(); 
      } else {
        throw new Error(result.error || "Error desconocido al duplicar.");
      }
    } catch (err: any) {
      toast({ title: "Error al Duplicar", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDuplicatingId(null);
    }
  };
  
  const getDisplayPrice = (item: ServicioEmpresa): string => {
    switch (item.calculationMethod) {
      case 'porPersona':
        return `${formatCurrency(item.precioPorPersona)} p/p`;
      case 'ratio':
        return `${formatCurrency(item.precioBase)} cada ${item.invitadosPorUnidad || 'N/A'} inv.`;
      case 'tramos':
        return 'Por Tramos';
      case 'fijo':
      default:
        return formatCurrency(item.precioVenta);
    }
  };
  
  const itemsAgrupadosPorCategoria = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const categoria = item.categoria || 'Otros';
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(item);
      return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [filteredItems]);

  const categoriasOrdenadas = Object.keys(itemsAgrupadosPorCategoria).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Catálogo de Servicios
          </h1>
        </div>
         <div className="flex gap-2 flex-wrap">
             <Link href="/empresa/servicios/reporte" passHref>
                <Button variant="secondary">
                    <Printer className="w-4 h-4 mr-2"/>Ver Reporte
                </Button>
            </Link>
            <Link href="/empresa/servicios/nuevo" passHref>
                <Button variant="default">
                    <PackagePlus className="w-4 h-4 mr-2" />
                    Añadir Servicio
                </Button>
            </Link>
             <Link href="/empresa" passHref>
                <Button variant="outline" className="rounded-xl">
                    <ArrowLeft className="w-4 h-4 mr-2"/>
                    Volver
                </Button>
            </Link>
        </div>
      </div>
      <CardDescription className="text-lg">Define los servicios que vendes y sus costos base para la sincronización financiera.</CardDescription>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-lg border-none rounded-[1.5rem]">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary"/>Ajuste de Precios Global</CardTitle>
            <CardDescription>
              Aplica un aumento o disminución porcentual a los precios de VENTA.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-grow">
              <Label htmlFor="percentage-adjust">Porcentaje (%)</Label>
              <Input
                id="percentage-adjust"
                type="number"
                value={adjustmentPercentage}
                onChange={(e) => setAdjustmentPercentage(Number(e.target.value))}
                placeholder="Ej: 10"
                className="h-11 rounded-xl bg-slate-50 border-none shadow-inner"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isAdjusting || adjustmentPercentage === 0} className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
                  {isAdjusting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Percent className="w-4 h-4 mr-2"/>}
                  Ajustar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                <AlertDialogHeader><AlertDialogTitle className="font-headline text-2xl uppercase tracking-tighter">¿Estás seguro?</AlertDialogTitle><AlertDialogDescription className="text-sm font-medium">Esta acción modificará los PRECIOS DE VENTA de TODOS los servicios en un <span className="font-bold">{adjustmentPercentage}%</span>.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter className="gap-2"><AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleAdjustPrices} className="rounded-xl bg-primary">Aplicar ajuste</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-none rounded-[1.5rem] bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><Save className="w-5 h-5 text-primary"/>Ajuste de Costos Global</CardTitle>
            <CardDescription className="text-slate-400">
              Aplica un aumento porcentual a los COSTOS INTERNOS del catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-grow">
              <Label htmlFor="cost-percentage-adjust">Porcentaje (%)</Label>
              <Input
                id="cost-percentage-adjust"
                type="number"
                value={costAdjustmentPercentage}
                onChange={(e) => setCostAdjustmentPercentage(Number(e.target.value))}
                className="h-11 rounded-xl bg-white/10 border-none text-white font-bold"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isAdjustingCost || costAdjustmentPercentage === 0} className="h-11 rounded-xl px-6 font-bold bg-primary hover:bg-primary/90">
                  {isAdjustingCost ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Percent className="w-4 h-4 mr-2"/>}
                  Ajustar Costos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                <AlertDialogHeader><AlertDialogTitle className="font-headline text-2xl uppercase tracking-tighter">¿Actualizar todos los costos?</AlertDialogTitle><AlertDialogDescription className="text-sm font-medium">Esta acción modificará los COSTOS INTERNOS en un <span className="font-bold">{costAdjustmentPercentage}%</span>. Afectará el cálculo de rentabilidad.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter className="gap-2"><AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleAdjustCosts} className="rounded-xl bg-primary">Aplicar ajuste</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
          <CardTitle className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Listado Maestro de Servicios ({filteredItems.length})</CardTitle>
          <div className="relative pt-4">
            <Search className="absolute left-3 top-7 h-4 w-4 text-slate-400" />
            <Input type="text" placeholder="Buscar por nombre o categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 rounded-xl h-12 bg-white border-slate-200 shadow-sm text-base"/>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary/30" /></div>
          ) : error ? (
             <div className="py-20 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-bold uppercase tracking-widest">{error}</p></div>
          ) : categoriasOrdenadas.length === 0 ? (
            <div className="py-20 text-center"><p className="text-slate-400 font-bold uppercase tracking-widest text-sm">{allItems.length === 0 ? "No hay servicios creados." : "No se encontraron resultados."}</p></div>
          ) : (
            <Accordion type="multiple" defaultValue={categoriasOrdenadas} className="w-full space-y-4">
              {categoriasOrdenadas.map((categoria) => (
                <AccordionItem value={categoria} key={categoria} className="border-none shadow-xl rounded-[1.5rem] overflow-hidden bg-white group">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline text-base font-black uppercase tracking-[0.2em] text-slate-800 hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-primary rounded-full"></div>
                        {categoria} 
                        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500 border-none px-3 font-bold text-[10px]">{itemsAgrupadosPorCategoria[categoria]?.length || 0}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {itemsAgrupadosPorCategoria[categoria]?.map((item) => (
                        <Card key={item.id} className="border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all rounded-2xl overflow-hidden bg-white group/item">
                          <CardHeader className="pb-3 pt-4 px-4 bg-slate-50/50">
                            <div className="flex justify-between items-start gap-2">
                              <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight truncate flex-grow" title={item.nombre}>{item.nombre}</CardTitle>
                              <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white" onClick={() => handleDuplicate(item.id, item.nombre)} disabled={!!deletingId || !!duplicatingId} title="Duplicar">
                                      {duplicatingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Copy className="w-3.5 h-3.5"/>}
                                  </Button>
                                  <Link href={`/empresa/servicios/editar/${item.id}`} passHref>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white text-primary"><Edit className="w-3.5 h-3.5"/></Button>
                                  </Link>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 text-destructive" disabled={!!deletingId || !!duplicatingId}><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl border-none shadow-2xl"><AlertDialogHeader><AlertDialogTitle className="font-headline text-2xl uppercase tracking-tighter">¿Eliminar servicio?</AlertDialogTitle><AlertDialogDescription className="text-sm font-medium">Se eliminará "{item.nombre}" del catálogo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="gap-2"><AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id, item.nombre)} disabled={deletingId === item.id} className="bg-destructive hover:bg-destructive/90 rounded-xl">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                  </AlertDialog>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 pb-4 pt-3 text-xs space-y-3">
                             <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase bg-slate-100 text-slate-500 border-none">{getCalculationMethodLabel(item.calculationMethod)}</Badge>
                                {item.tipoCosto === 'Personal' ? (
                                    <Badge className="rounded-lg text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 border-none flex items-center gap-1"><UserCheck className="w-3 h-3"/> Personal</Badge>
                                ) : (
                                    <Badge className="rounded-lg text-[9px] font-black uppercase bg-amber-50 text-amber-600 border-none flex items-center gap-1"><Truck className="w-3 h-3"/> {item.proveedor || 'Proveedor'}</Badge>
                                )}
                             </div>
                             <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-100 pt-3">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio Venta</p>
                                    <p className="text-sm font-black text-primary">{getDisplayPrice(item)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Costo Base</p>
                                    <p className="text-sm font-black text-slate-700">{formatCurrency(item.valorUnitarioEstimado)}</p>
                                </div>
                             </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
