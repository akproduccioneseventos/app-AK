
'use client';

import React, { useState, useEffect, useCallback, useMemo, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, PackagePlus, Edit, Trash2, Loader2, AlertTriangle, Search, DollarSign, Tag, BarChart3, StickyNote, Printer, Share2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServicioEmpresa } from '@/types/empresa';
import { getInsumos, deleteInsumo } from '@/app/actions/insumos';
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

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export default function DynamicCatalogPage({ params: paramsProp }: { params: { slugs: string[] } }) {
  const params = use(paramsProp);
  const { toast } = useToast();
  const [categoria, subcategoria] = params.slugs.map(s => decodeURIComponent(s));

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
      const data = await getInsumos();
      const relevantItems = data.filter(s => 
        s.subcategoria === subcategoria
      );
      setAllItems(relevantItems);
      setFilteredItems(relevantItems);
    } catch (err: any) {
      setError("No se pudo cargar el catálogo de insumos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, categoria, subcategoria]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allItems.filter(item =>
      (item.nombre.toLowerCase().includes(lowercasedFilter))
    );
    setFilteredItems(filteredData);
  }, [searchTerm, allItems]);
  
  const handleDelete = async (id: string, nombreItem?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteInsumo(id);
      if (result.success) {
        toast({ title: "Insumo Eliminado", description: `El ítem "${nombreItem || id}" ha sido eliminado.` });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Catálogo: {subcategoria}
            </h1>
            <p className="text-muted-foreground">{categoria}</p>
          </div>
        </div>
         <div className="flex gap-2 flex-wrap">
            <Link href={`/empresa/insumos/nuevo?categoria=${encodeURIComponent(categoria)}&subcategoria=${encodeURIComponent(subcategoria)}`} passHref>
                <Button variant="default">
                    <PackagePlus className="w-4 h-4 mr-2" />
                    Añadir a {subcategoria}
                </Button>
            </Link>
             <Link href="/empresa/menus" passHref>
                <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2"/>
                    Volver al Planificador
                </Button>
            </Link>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 text-base"/>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : error ? (
             <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p><Button onClick={fetchItems} variant="outline" className="mt-4">Reintentar</Button></div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-3">
                {filteredItems.map((item) => (
                    <Card key={item.id} className="bg-muted/30 hover:shadow-sm transition-shadow">
                      <CardHeader className="pb-2 pt-3 px-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-semibold">{item.nombre}</CardTitle>
                          <div className="flex gap-1">
                              <Link href={`/empresa/insumos/${item.id}/editar`} passHref><Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5"/></Button></Link>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={deletingId === item.id}><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>El insumo "{item.nombre}" será eliminado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id, item.nombre)} disabled={deletingId === item.id} className="bg-destructive hover:bg-destructive/90">{deletingId === item.id && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/>}Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                              </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 text-sm space-y-1">
                         <p><span className="text-muted-foreground">Unidad: </span><Badge variant="secondary">{item.unidad}</Badge></p>
                         <p><span className="text-muted-foreground">Costo: </span><span className="font-semibold text-primary/90">{formatCurrency(item.valorUnitarioEstimado)}</span></p>
                      </CardContent>
                    </Card>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay insumos en esta categoría.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
