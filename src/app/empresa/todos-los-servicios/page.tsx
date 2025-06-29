
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, PackagePlus, Edit, Trash2, Loader2, AlertTriangle, Search, DollarSign, Tag, BarChart3, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { getServiciosEmpresa, deleteServicioEmpresa } from '@/app/actions/servicios-empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
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
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function InventarioGeneralPage() {
  const { toast } = useToast();
  const [allItems, setAllItems] = useState<ServicioEmpresa[]>([]);
  const [filteredItems, setFilteredItems] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServiciosEmpresa();
      setAllItems(data);
      setFilteredItems(data);
    } catch (err: any) {
      setError("No se pudo cargar el inventario.");
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
        toast({ title: "Ítem Eliminado", description: `El ítem "${nombreItem || id}" ha sido eliminado.` });
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

  const itemsAgrupadosPorCategoria = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const categoria = item.categoria || 'Otros';
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(item);
      return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [filteredItems]);

  const categoriasOrdenadas = Object.keys(itemsAgrupadosPorCategoria).sort();

  const capitalPorCategoria = useMemo(() => {
    return categoriasOrdenadas.map(categoria => {
      const totalCategoria = itemsAgrupadosPorCategoria[categoria].reduce((sum, item) => {
        const valorItem = (item.cantidadDisponible || 0) * (item.valorUnitarioEstimado || 0);
        return sum + valorItem;
      }, 0);
      return { nombre: categoria, total: totalCategoria };
    });
  }, [categoriasOrdenadas, itemsAgrupadosPorCategoria]);

  const capitalTotalGeneral = useMemo(() => capitalPorCategoria.reduce((sum, cat) => sum + cat.total, 0), [capitalPorCategoria]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Inventario General y Valor de Activos
          </h1>
        </div>
         <Link href="/empresa/todos-los-servicios/nuevo" passHref>
          <Button variant="default">
            <PackagePlus className="w-4 h-4 mr-2" />
            Añadir Activo
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="font-headline text-xl flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary"/>Valor de Activos de la Empresa</CardTitle>
          <CardDescription>Resumen del capital total de insumos y activos físicos, por servicio/categoría.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {capitalPorCategoria.map(cat => (
            cat.total > 0 && <Card key={cat.nombre} className="bg-muted/50">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="w-3.5 h-3.5 mr-1.5"/> {cat.nombre}</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3"><p className="text-2xl font-bold text-primary">{formatCurrency(cat.total)}</p></CardContent>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="border-t p-4 bg-muted/30">
          <div className="flex justify-end items-center w-full gap-2">
            <BarChart3 className="w-5 h-5 text-primary"/>
            <span className="text-lg font-semibold">Capital Total General:</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(capitalTotalGeneral)}</span>
          </div>
        </CardFooter>
      </Card>
      
      <Separator />

       <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre o categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 text-base"/>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Cargando inventario...</p></div>
      ) : error ? (
         <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p><Button onClick={fetchItems} variant="outline" className="mt-4">Reintentar</Button></div>
      ) : categoriasOrdenadas.length === 0 ? (
        <Card className="shadow-md"><CardContent className="p-6 text-center text-muted-foreground"><Search className="w-16 h-16 mx-auto mb-4 opacity-30" />{searchTerm ? "No se encontraron ítems que coincidan." : "El inventario está vacío."}</CardContent></Card>
      ) : (
        <Accordion type="multiple" defaultValue={categoriasOrdenadas} className="w-full space-y-3">
          {categoriasOrdenadas.map((categoria) => (
            <AccordionItem value={categoria} key={categoria} className="border rounded-lg shadow-md bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><Tag className="w-5 h-5 text-primary/80"/>{categoria} ({itemsAgrupadosPorCategoria[categoria]?.length || 0} ítems)</div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-3">
                <div className="space-y-3 mt-2">
                  {itemsAgrupadosPorCategoria[categoria]?.map((item) => {
                    const itemTotalValue = (item.cantidadDisponible || 0) * (item.valorUnitarioEstimado || 0);
                    return (
                      <Card key={item.id} className="bg-muted/30 hover:shadow-sm transition-shadow">
                        <CardHeader className="pb-2 pt-3 px-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-semibold">{item.nombre}</CardTitle>
                            <div className="flex gap-1">
                                <Link href={`/empresa/todos-los-servicios/${item.id}/editar`} passHref><Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button></Link>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={deletingId === item.id}><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>El ítem "{item.nombre}" será eliminado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deletingId === item.id}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id, item.nombre)} disabled={deletingId === item.id} className="bg-destructive hover:bg-destructive/90">{deletingId === item.id && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/>}Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 text-sm space-y-1">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                            <p><span className="text-muted-foreground">Unidad: </span><span className="font-medium">{item.unidad || 'N/A'}</span></p>
                            <p><span className="text-muted-foreground">Stock: </span><span className="font-medium">{item.cantidadDisponible ?? 'N/A'}</span></p>
                            <p><span className="text-muted-foreground">Costo Unit: </span><span className="font-medium text-primary/90">{formatCurrency(item.valorUnitarioEstimado)}</span></p>
                            <p className="font-semibold col-span-full md:col-span-1 md:text-right"><span className="text-muted-foreground">Valor Total Stock: </span>{formatCurrency(itemTotalValue)}</p>
                          </div>
                          {item.notas && <p className="text-xs mt-2 pt-1 border-t border-dashed flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5 flex-shrink-0"/>{item.notas}</p>}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
