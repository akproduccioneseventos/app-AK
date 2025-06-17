
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, PackagePlus, Edit, Trash2, Loader2, AlertTriangle, Search, Tag, DollarSign, Landmark, BarChart3, ListFilter } from 'lucide-react'; // Added ListFilter
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { ServicioEmpresa, CategoriaServicio, TipoItemEmpresa } from '@/types/empresa'; // Added TipoItemEmpresa
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
} from "@/components/ui/alert-dialog"; // Removed AlertDialogTrigger as it's used via asChild
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ALL_TIPOS_ITEM_EMPRESA } from '@/types/empresa'; // Import ALL_TIPOS_ITEM_EMPRESA


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
  const [tipoItemFilter, setTipoItemFilter] = useState<Set<TipoItemEmpresa>>(new Set());

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServiciosEmpresa();
      setAllItems(data);
      setFilteredItems(data); // Initial filter state
    } catch (err: any) {
      setError("No se pudo cargar el catálogo maestro.");
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
      (item.categoria && item.categoria.toLowerCase().includes(lowercasedFilter))) &&
      (tipoItemFilter.size === 0 || (item.tipoItem && tipoItemFilter.has(item.tipoItem)))
    );
    setFilteredItems(filteredData);
  }, [searchTerm, allItems, tipoItemFilter]);
  
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

  const handleTipoItemFilterToggle = (tipo: TipoItemEmpresa) => {
    setTipoItemFilter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tipo)) newSet.delete(tipo);
      else newSet.add(tipo);
      return newSet;
    });
  };

  const itemsAgrupadosPorCategoria = filteredItems.reduce((acc, item) => {
    const categoria = item.categoria || 'Otros';
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(item);
    return acc;
  }, {} as Record<string, ServicioEmpresa[]>);

  const categoriasOrdenadas = Object.keys(itemsAgrupadosPorCategoria).sort();

  const capitalPorCategoria = categoriasOrdenadas.map(categoria => {
    const totalCategoria = itemsAgrupadosPorCategoria[categoria].reduce((sum, item) => {
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
            Catálogo Maestro de Ítems y Servicios
          </h1>
        </div>
         <Link href="/empresa/todos-los-servicios/nuevo" passHref>
          <Button variant="default">
            <PackagePlus className="w-4 h-4 mr-2" />
            Añadir Ítem/Servicio
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Landmark className="w-6 h-6 text-primary"/>Valor de Activos (Insumos)</CardTitle>
          <CardDescription>Resumen del capital total de insumos y activos físicos, por categoría.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capitalPorCategoria.filter(cat => itemsAgrupadosPorCategoria[cat.nombre]?.some(item => item.tipoItem === 'Insumo/Ingrediente' || item.tipoItem === 'Activo Fijo')).map(cat => (
            <Card key={cat.nombre} className="bg-muted/50">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><Tag className="w-3.5 h-3.5 mr-1.5"/> {cat.nombre}</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3"><p className="text-2xl font-bold text-primary">{formatCurrency(cat.total)}</p></CardContent>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="border-t p-4 bg-muted/30">
          <div className="flex justify-end items-center w-full gap-2">
            <BarChart3 className="w-5 h-5 text-primary"/>
            <span className="text-lg font-semibold">Capital Total Activos Físicos:</span>
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
          <Accordion type="single" collapsible className="w-full md:w-auto md:min-w-[250px] border rounded-md">
            <AccordionItem value="filter-tipo" className="border-b-0">
              <AccordionTrigger className="px-3 py-2.5 text-sm hover:no-underline h-auto [&[data-state=open]>svg]:text-primary">
                <ListFilter className="w-4 h-4 mr-2"/>
                {tipoItemFilter.size === 0 ? "Filtrar por Tipo" : `${tipoItemFilter.size} Tipo(s) Seleccionado(s)`}
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="p-2 border-t">
                  {ALL_TIPOS_ITEM_EMPRESA.map(tipo => (
                    <div key={tipo} className="flex items-center space-x-2 py-1.5 px-1 hover:bg-muted/50 rounded-sm">
                      <Checkbox id={`tipo-${tipo}`} checked={tipoItemFilter.has(tipo)} onCheckedChange={() => handleTipoItemFilterToggle(tipo)} />
                      <Label htmlFor={`tipo-${tipo}`} className="text-sm font-normal cursor-pointer flex-grow">{tipo}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Cargando catálogo...</p></div>
      ) : error ? (
         <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p><Button onClick={fetchItems} variant="outline" className="mt-4">Reintentar</Button></div>
      ) : categoriasOrdenadas.length === 0 && (searchTerm || tipoItemFilter.size > 0) ? (
        <Card className="shadow-md"><CardContent className="p-6 text-center text-muted-foreground"><Search className="w-16 h-16 mx-auto mb-4 opacity-30" />No se encontraron ítems que coincidan con los filtros.</CardContent></Card>
      ) : categoriasOrdenadas.length === 0 ? (
        <Card className="shadow-md"><CardContent className="p-6 text-center text-muted-foreground"><Package className="w-16 h-16 mx-auto mb-4 opacity-30" />El catálogo maestro está vacío.<Link href="/empresa/todos-los-servicios/nuevo" passHref><Button variant="link" className="block mx-auto mt-2">Añadir primer ítem</Button></Link></CardContent></Card>
      ) : (
        <Accordion type="multiple" defaultValue={categoriasOrdenadas} className="w-full space-y-3">
          {categoriasOrdenadas.map((categoria) => (
            <AccordionItem value={categoria} key={categoria} className="border rounded-lg shadow-md bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><Tag className="w-5 h-5 text-primary/80"/>{categoria} ({itemsAgrupadosPorCategoria[categoria]?.length || 0} ítems)</div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-3">
                <div className="space-y-3 mt-2">
                  {itemsAgrupadosPorCategoria[categoria]?.map((item) => (
                    <Card key={item.id} className="bg-muted/30 hover:shadow-sm transition-shadow">
                      <CardHeader className="pb-2 pt-3 px-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-semibold">{item.nombre}</CardTitle>
                           <div className="flex gap-1">
                                {/* El botón de editar se elimina hasta que se implemente /editar/[id]/page.tsx */}
                                {/* <Link href={`/empresa/todos-los-servicios/editar/${item.id}`} passHref><Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button></Link> */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={deletingId === item.id}><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>El ítem "{item.nombre}" será eliminado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deletingId === item.id}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id, item.nombre)} disabled={deletingId === item.id} className="bg-destructive hover:bg-destructive/90">{deletingId === item.id && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/>}Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">{item.tipoItem || 'No especificado'}</Badge>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 text-sm space-y-1">
                        <p className="text-xs"><span className="text-muted-foreground">Unidad: </span><span className="font-medium">{item.unidad || 'N/A'}</span></p>
                        {item.tipoItem !== 'Prestador de Servicio' && <p className="text-xs"><span className="text-muted-foreground">Cant. Disponible: </span><span className="font-medium">{item.cantidadDisponible ?? 'N/A'}</span></p>}
                        {item.tipoItem !== 'Prestador de Servicio' && <p className="text-xs"><span className="text-muted-foreground">Valor Unit. (Costo): </span><span className="font-medium text-primary/90">{formatCurrency(item.valorUnitarioEstimado)}</span></p>}
                        {item.precioVenta !== undefined && <p className="text-xs"><span className="text-muted-foreground">P.Venta (Servicio): </span><span className="font-medium text-green-600">{formatCurrency(item.precioVenta)}</span></p>}
                        {item.tipoItem === 'Prestador de Servicio' && item.contactoPrincipal && <p className="text-xs"><span className="text-muted-foreground">Contacto: </span>{item.contactoPrincipal} {item.telefonoContacto && `(${item.telefonoContacto})`}</p>}
                        {item.tipoItem === 'Prestador de Servicio' && item.descripcionServicio && <p className="text-xs mt-1"><span className="text-muted-foreground">Descripción: </span>{item.descripcionServicio}</p>}
                        {item.productosOfrecidos && <p className="text-xs mt-1"><span className="text-muted-foreground">Ofrece: </span>{item.productosOfrecidos}</p>}
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
        Este catálogo maestro sirve como base para la "Lista de Carga Operativa" de cada fiesta (funcionalidad en desarrollo).
      </CardFooter>
    </div>
  );
}
