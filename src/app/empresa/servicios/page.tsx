
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Sparkles, PackagePlus, Edit, Trash2, Loader2, AlertTriangle, Search, DollarSign, Printer, Copy, Percent } from 'lucide-react';
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
        throw new Error(result.error || "Error desconocido al eliminar.");
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
                <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2"/>
                    Volver a Empresa
                </Button>
            </Link>
        </div>
      </div>
      <CardDescription>Define los servicios que vendes, sus precios y cómo se calculan para incluirlos en los presupuestos.</CardDescription>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Ajuste de Precios Global</CardTitle>
            <CardDescription>
              Aplica un aumento o disminución porcentual a los precios de VENTA de todos los servicios.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-grow">
              <Label htmlFor="percentage-adjust">Porcentaje de Ajuste (%)</Label>
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
                  Ajustar Precios
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción modificará los PRECIOS DE VENTA de TODOS los servicios en un 
                    <span className="font-bold"> {adjustmentPercentage}%</span>. El cambio es irreversible.
                    Los costos internos no serán modificados. ¿Deseas continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAdjustPrices}>
                    Aplicar ajuste del {adjustmentPercentage > 0 ? `+${adjustmentPercentage}`: adjustmentPercentage}%
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Ajuste de Costos Global</CardTitle>
            <CardDescription>
              Aplica un aumento o disminución porcentual a los COSTOS INTERNOS de todos los servicios.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-grow">
              <Label htmlFor="cost-percentage-adjust">Porcentaje de Ajuste (%)</Label>
              <Input
                id="cost-percentage-adjust"
                type="number"
                value={costAdjustmentPercentage}
                onChange={(e) => setCostAdjustmentPercentage(Number(e.target.value))}
                placeholder="Ej: 10 para aumentar, -5 para disminuir"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isAdjustingCost || costAdjustmentPercentage === 0} variant="secondary">
                  {isAdjustingCost ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Percent className="w-4 h-4 mr-2"/>}
                  Ajustar Costos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción modificará los COSTOS INTERNOS de TODOS los servicios en un 
                    <span className="font-bold"> {costAdjustmentPercentage}%</span>. El cambio es irreversible.
                    Los precios de venta no serán modificados automáticamente. ¿Deseas continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAdjustCosts}>
                    Aplicar ajuste del {costAdjustmentPercentage > 0 ? `+${costAdjustmentPercentage}`: costAdjustmentPercentage}%
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Listado de Servicios ({filteredItems.length})</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre o categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 text-base"/>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : error ? (
             <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p></div>
          ) : categoriasOrdenadas.length === 0 ? (
            <div className="py-10 text-center"><p className="text-muted-foreground text-lg">{allItems.length === 0 ? "No hay servicios creados." : "No se encontraron servicios con los filtros aplicados."}</p></div>
          ) : (
            <Accordion type="multiple" defaultValue={categoriasOrdenadas} className="w-full space-y-3">
              {categoriasOrdenadas.map((categoria) => (
                <AccordionItem value={categoria} key={categoria} className="border rounded-lg shadow-sm bg-card">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                    <div className="flex items-center gap-2">{categoria} ({itemsAgrupadosPorCategoria[categoria]?.length || 0})</div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-0 pb-3">
                    <div className="space-y-3 mt-2">
                      {itemsAgrupadosPorCategoria[categoria]?.map((item) => (
                        <Card key={item.id} className="bg-muted/30 hover:shadow-sm transition-shadow">
                          <CardHeader className="pb-2 pt-3 px-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base font-semibold">{item.nombre}</CardTitle>
                              <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(item.id, item.nombre)} disabled={!!deletingId || !!duplicatingId} title="Duplicar Servicio">
                                      {duplicatingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Copy className="w-3.5 h-3.5"/>}
                                  </Button>
                                  <Link href={`/empresa/servicios/editar/${item.id}`} passHref>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!!deletingId || !!duplicatingId}><Edit className="w-3.5 h-3.5"/></Button>
                                  </Link>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={!!deletingId || !!duplicatingId}><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>El servicio "{item.nombre}" será eliminado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id, item.nombre)} disabled={deletingId === item.id} className="bg-destructive hover:bg-destructive/90">{deletingId === item.id && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/>}Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                  </AlertDialog>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="px-3 pb-3 text-sm space-y-1">
                             <div><span className="text-muted-foreground">Cálculo: </span><Badge variant="secondary">{getCalculationMethodLabel(item.calculationMethod)}</Badge></div>
                             <p><span className="text-muted-foreground">Precio Venta: </span><span className="font-semibold text-primary/90">{getDisplayPrice(item)}</span></p>
                             <p><span className="text-muted-foreground">Costo Est.: </span><span className="font-semibold">{formatCurrency(item.valorUnitarioEstimado)}</span></p>
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
