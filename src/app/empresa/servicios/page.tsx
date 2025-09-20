
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Search, Tag, BarChart3, Info } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

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
  const [allServices, setAllServices] = useState<ServicioEmpresa[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServiciosEmpresa();
      const servicesOnly = data.filter(s => s.tipoItem === 'Servicio');
      setAllServices(servicesOnly);
      setFilteredServices(servicesOnly);
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
    const filteredData = allServices.filter(item =>
      (item.nombre.toLowerCase().includes(lowercasedFilter) ||
      (item.categoria && item.categoria.toLowerCase().includes(lowercasedFilter)))
    );
    setFilteredServices(filteredData);
  }, [searchTerm, allServices]);
  
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

  const servicesByCategory = useMemo(() => {
    return filteredServices.reduce((acc, item) => {
      const categoria = item.categoria || 'Otros';
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(item);
      return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [filteredServices]);

  const orderedCategories = Object.keys(servicesByCategory).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Catálogo de Servicios
          </h1>
        </div>
         <div className="flex gap-2 flex-wrap">
            <Link href="/empresa/todos-los-servicios/nuevo?type=Servicio" passHref>
                <Button variant="default">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Añadir Nuevo Servicio
                </Button>
            </Link>
             <Link href="/empresa/contabilidad" passHref>
                <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2"/>
                    Volver
                </Button>
            </Link>
        </div>
      </div>
      <CardDescription>Gestiona todos los servicios que ofreces en tus presupuestos.</CardDescription>

       <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre o categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 text-base"/>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
      ) : error ? (
         <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p><Button onClick={fetchItems} variant="outline" className="mt-4">Reintentar</Button></div>
      ) : orderedCategories.length === 0 ? (
        <Card className="shadow-md"><CardContent className="p-6 text-center text-muted-foreground"><Search className="w-16 h-16 mx-auto mb-4 opacity-30" />{searchTerm ? "No se encontraron servicios que coincidan." : "Tu catálogo de servicios está vacío."}</CardContent></Card>
      ) : (
        <Accordion type="multiple" defaultValue={orderedCategories} className="w-full space-y-3">
          {orderedCategories.map((categoria) => (
            <AccordionItem value={categoria} key={categoria} className="border rounded-lg shadow-md bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><Tag className="w-5 h-5 text-primary/80"/>{categoria} ({servicesByCategory[categoria]?.length || 0} servicios)</div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-3">
                <div className="space-y-3 mt-2">
                  {servicesByCategory[categoria]?.map((servicio) => {
                    const precioDisplay = getCalculationMethodLabel(servicio.calculationMethod);
                    return (
                      <Card key={servicio.id} className="bg-muted/30 hover:shadow-sm transition-shadow">
                        <CardHeader className="pb-2 pt-3 px-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-semibold">{servicio.nombre}</CardTitle>
                            <div className="flex gap-1">
                                <Link href={`/empresa/todos-los-servicios/${servicio.id}/editar`} passHref><Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button></Link>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={deletingId === servicio.id}><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>El servicio "{servicio.nombre}" será eliminado.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel disabled={deletingId === servicio.id}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(servicio.id, servicio.nombre)} disabled={deletingId === servicio.id} className="bg-destructive hover:bg-destructive/90">{deletingId === servicio.id && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/>}Eliminar</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 text-sm space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <Badge variant="outline">{precioDisplay}</Badge>
                            {servicio.subcategoria && <span className="text-muted-foreground">{servicio.subcategoria}</span>}
                          </div>
                          {servicio.notas && <p className="text-xs mt-2 pt-1 border-t border-dashed">{servicio.notas}</p>}
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
