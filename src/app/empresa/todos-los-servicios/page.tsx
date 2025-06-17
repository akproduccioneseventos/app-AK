
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, PackagePlus, Edit, Trash2, Loader2, AlertTriangle, Search, Tag, DollarSign, Landmark, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { getServiciosEmpresa, deleteServicioEmpresa } from '@/app/actions/servicios-empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
      item.nombre.toLowerCase().includes(lowercasedFilter) ||
      (item.categoria && item.categoria.toLowerCase().includes(lowercasedFilter))
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

  const itemsAgrupados = filteredItems.reduce((acc, item) => {
    const categoria = item.categoria || 'Otros Activos'; // 'Otros Activos' como fallback
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {} as Record<string, ServicioEmpresa[]>);

  const categoriasOrdenadas = Object.keys(itemsAgrupados).sort();

  const capitalPorCategoria = categoriasOrdenadas.map(categoria => {
    const totalCategoria = itemsAgrupados[categoria].reduce((sum, item) => {
      const subtotal = (item.cantidadDisponible || 0) * (item.valorUnitarioEstimado || 0);
      return sum + subtotal;
    }, 0);
    return { nombre: categoria, total: totalCategoria };
  });

  const capitalTotalGeneral = capitalPorCategoria.reduce((sum, cat) => sum + cat.total, 0);

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
            Añadir Nuevo Ítem
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary"/>
            Valor del Inventario
          </CardTitle>
          <CardDescription>Resumen del capital total invertido en activos por categoría.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capitalPorCategoria.map(cat => (
            <Card key={cat.nombre} className="bg-muted/50">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1.5"/> {cat.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-2xl font-bold text-primary">{formatCurrency(cat.total)}</p>
              </CardContent>
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
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar ítems por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Cargando inventario...</p>
        </div>
      ) : error ? (
         <div className="py-10 text-center text-destructive">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <p className="font-semibold">Error al cargar inventario</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : categoriasOrdenadas.length === 0 && searchTerm ? (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center text-muted-foreground">
             <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
            No se encontraron ítems que coincidan con "{searchTerm}".
          </CardContent>
        </Card>
      ) : categoriasOrdenadas.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            No hay ítems definidos en el inventario.
             <Link href="/empresa/todos-los-servicios/nuevo" passHref>
                <Button variant="link" className="block mx-auto mt-2">Añadir primer ítem</Button>
             </Link>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={categoriasOrdenadas} className="w-full space-y-3">
          {categoriasOrdenadas.map((categoria) => (
            <AccordionItem value={categoria} key={categoria} className="border rounded-lg shadow-md bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary/80"/>
                  {categoria} ({itemsAgrupados[categoria]?.length || 0} ítems)
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-3">
                <div className="space-y-3 mt-2">
                  {itemsAgrupados[categoria]?.map((item) => {
                    const subtotalItem = (item.cantidadDisponible || 0) * (item.valorUnitarioEstimado || 0);
                    return (
                    <Card key={item.id} className="bg-muted/30 hover:shadow-sm transition-shadow">
                      <CardHeader className="pb-2 pt-3 px-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-semibold">{item.nombre}</CardTitle>
                           <div className="flex gap-1">
                                {/* El botón de editar se elimina temporalmente hasta que se implemente la página de edición */}
                                {/* <Button variant="ghost" size="icon" className="h-7 w-7" disabled> <Edit className="w-3.5 h-3.5" /> </Button> */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={deletingId === item.id}>
                                            {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                El ítem "{item.nombre}" será eliminado. Esta acción no se puede deshacer.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={deletingId === item.id}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(item.id, item.nombre)} disabled={deletingId === item.id} className="bg-destructive hover:bg-destructive/90">
                                            {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/> : null}
                                            Eliminar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                         {item.categoria && <Badge variant="outline" className="text-xs mt-1">{item.categoria}</Badge>}
                      </CardHeader>
                      <CardContent className="px-3 pb-3 text-sm space-y-1">
                        <p className="text-xs"><span className="text-muted-foreground">Unidad: </span><span className="font-medium">{item.unidad || 'N/A'}</span></p>
                        <p className="text-xs"><span className="text-muted-foreground">Cant. Disponible: </span><span className="font-medium">{item.cantidadDisponible ?? 'N/A'}</span></p>
                        <p className="text-xs"><span className="text-muted-foreground">Valor Unit. Est.: </span><span className="font-medium text-primary/90">{formatCurrency(item.valorUnitarioEstimado)}</span></p>
                        {item.precioVenta !== undefined && <p className="text-xs"><span className="text-muted-foreground">P.Venta (Servicio): </span><span className="font-medium text-green-600">{formatCurrency(item.precioVenta)}</span></p>}
                        <Separator className="my-1.5"/>
                        <p className="text-sm font-semibold"><span className="text-muted-foreground">Subtotal Ítem: </span><span className="text-primary">{formatCurrency(subtotalItem)}</span></p>
                      </CardContent>
                    </Card>
                  )})}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      <CardFooter className="mt-6 text-xs text-muted-foreground">
        La funcionalidad de edición detallada de ítems y cálculo de depreciación se habilitará en futuras actualizaciones.
      </CardFooter>
    </div>
  );
}
