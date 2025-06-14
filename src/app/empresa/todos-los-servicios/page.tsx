
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Tag, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Search } from 'lucide-react';
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


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function TodosLosServiciosPage() {
  const { toast } = useToast();
  const [allServicios, setAllServicios] = useState<ServicioEmpresa[]>([]);
  const [filteredServicios, setFilteredServicios] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServicios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServiciosEmpresa();
      setAllServicios(data);
      setFilteredServicios(data);
    } catch (err: any) {
      setError("No se pudieron cargar los servicios.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allServicios.filter(servicio =>
      servicio.nombre.toLowerCase().includes(lowercasedFilter) ||
      (servicio.categoria && servicio.categoria.toLowerCase().includes(lowercasedFilter))
      // Descripcion ya no existe en el tipo ServicioEmpresa
    );
    setFilteredServicios(filteredData);
  }, [searchTerm, allServicios]);
  
  const handleDelete = async (id: string, nombreServicio?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteServicioEmpresa(id);
      if (result.success) {
        toast({ title: "Servicio Eliminado", description: `El servicio "${nombreServicio || id}" ha sido eliminado.` });
        fetchServicios(); 
      } else {
        throw new Error(result.error || "Error desconocido al eliminar.");
      }
    } catch (err: any) {
      toast({ title: "Error al Eliminar", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };


  const serviciosAgrupados = filteredServicios.reduce((acc, servicio) => {
    const categoria = servicio.categoria || 'Otros servicios';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(servicio);
    return acc;
  }, {} as Record<CategoriaServicio | 'Otros servicios', ServicioEmpresa[]>);

  const categoriasOrdenadas = Object.keys(serviciosAgrupados).sort() as (CategoriaServicio | 'Otros servicios')[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Catálogo General de Servicios de la Empresa
          </h1>
        </div>
         <Link href="/empresa/todos-los-servicios/nuevo" passHref>
          <Button variant="default">
            <PlusCircle className="w-4 h-4 mr-2" />
            Añadir Nuevo Servicio
          </Button>
        </Link>
      </div>
       <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar servicios por nombre o categoría..."
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
          <p className="ml-3 text-muted-foreground">Cargando servicios...</p>
        </div>
      ) : error ? (
         <div className="py-10 text-center text-destructive">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <p className="font-semibold">Error al cargar servicios</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : categoriasOrdenadas.length === 0 && searchTerm ? (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center text-muted-foreground">
             <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
            No se encontraron servicios que coincidan con "{searchTerm}".
          </CardContent>
        </Card>
      ) : categoriasOrdenadas.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
            No hay servicios definidos para la empresa.
             <Link href="/empresa/todos-los-servicios/nuevo" passHref>
                <Button variant="link" className="block mx-auto mt-2">Añadir primer servicio</Button>
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
                  {categoria} ({serviciosAgrupados[categoria]?.length || 0})
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-3">
                <div className="space-y-3 mt-2">
                  {serviciosAgrupados[categoria]?.map((servicio) => (
                    <Card key={servicio.id} className="bg-muted/30 hover:shadow-sm transition-shadow">
                      <CardHeader className="pb-2 pt-3 px-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-semibold">{servicio.nombre}</CardTitle>
                           <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" disabled> {/* TODO: Link to edit page */}
                                    <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={deletingId === servicio.id}>
                                            {deletingId === servicio.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                El servicio "{servicio.nombre}" será eliminado. Esta acción no se puede deshacer.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={deletingId === servicio.id}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(servicio.id, servicio.nombre)} disabled={deletingId === servicio.id} className="bg-destructive hover:bg-destructive/90">
                                            {deletingId === servicio.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/> : null}
                                            Eliminar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                         {servicio.categoria && <Badge variant="outline" className="text-xs mt-1">{servicio.categoria}</Badge>}
                      </CardHeader>
                      <CardContent className="px-3 pb-3 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                            {servicio.unidad && (
                                <p className="text-xs">
                                    <span className="text-muted-foreground">Unidad: </span> 
                                    <span className="font-medium">{servicio.unidad}</span>
                                </p>
                            )}
                            {servicio.precioVenta !== undefined && (
                                <p className="text-xs">
                                    <span className="text-muted-foreground">P. Venta: </span>
                                    <span className="font-medium text-primary/90">{formatCurrency(servicio.precioVenta)}</span>
                                </p>
                            )}
                            {servicio.costoReal !== undefined && (
                                <p className="text-xs">
                                    <span className="text-muted-foreground">Costo Real: </span>
                                    <span className="font-medium">{formatCurrency(servicio.costoReal)}</span>
                                </p>
                            )}
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
      <CardFooter className="mt-6 text-xs text-muted-foreground">
        La funcionalidad de edición de servicios se habilitará en futuras actualizaciones.
      </CardFooter>
    </div>
  );
}
