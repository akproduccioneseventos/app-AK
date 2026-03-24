
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import type { ServicioEmpresa } from '@/types/empresa';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useToast } from '@/hooks/use-toast';
import { deleteInsumo } from '@/app/actions/insumos';
import Link from 'next/link';

interface InsumosStockListProps {
    insumos: ServicioEmpresa[];
    onUpdate: () => void;
}

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return '$ 0';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const InsumosStockList: React.FC<InsumosStockListProps> = ({ insumos, onUpdate }) => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredInsumos = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return insumos.filter(insumo => 
            insumo.nombre.toLowerCase().includes(lowerCaseSearch) ||
            insumo.categoria?.toLowerCase().includes(lowerCaseSearch) ||
            insumo.proveedor?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [insumos, searchTerm]);

    const insumosPorCategoria = useMemo(() => {
        return filteredInsumos.reduce((acc, insumo) => {
            const categoria = insumo.categoria || 'Otros Insumos';
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(insumo);
            return acc;
        }, {} as Record<string, ServicioEmpresa[]>);
    }, [filteredInsumos]);
    
    const handleDelete = async (id: string, nombre: string) => {
        setDeletingId(id);
        try {
            const result = await deleteInsumo(id);
            if (result.success) {
                toast({ title: "Insumo Eliminado", variant: "destructive" });
                onUpdate();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
             toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };
    
    const categoriasOrdenadas = Object.keys(insumosPorCategoria).sort();

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                    <Package className="text-primary"/>
                    Stock de Insumos e Ingredientes
                </CardTitle>
                <CardDescription>
                    Gestiona tu inventario de insumos. Los cambios se guardan al editar cada ítem.
                </CardDescription>
                <div className="pt-2 flex gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                        <Input 
                            placeholder="Buscar insumo..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                     <Link href="/empresa/insumos/nuevo?from=gastronomia" passHref>
                        <Button variant="outline" className="h-10"><PlusCircle className="w-4 h-4 mr-2"/>Añadir</Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                 <Accordion type="multiple" className="w-full space-y-2" defaultValue={categoriasOrdenadas}>
                    {categoriasOrdenadas.map(categoria => (
                        <AccordionItem key={categoria} value={categoria} className="border rounded-md">
                            <AccordionTrigger className="px-3 text-sm font-medium hover:no-underline">
                                {categoria} ({insumosPorCategoria[categoria].length})
                            </AccordionTrigger>
                            <AccordionContent className="p-2 border-t">
                                <ScrollArea className="h-auto max-h-64">
                                    <div className="space-y-2 pr-3">
                                        {insumosPorCategoria[categoria].map(insumo => (
                                            <div key={insumo.id} className="flex justify-between items-center text-sm p-2 border rounded-md bg-background">
                                                <div>
                                                    <p className="font-medium">{insumo.nombre}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Stock: {insumo.cantidadDisponible ?? 0} {insumo.unidad} | Costo: {formatCurrency(insumo.valorUnitarioEstimado)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                     <Link href={`/empresa/insumos/${insumo.id}/editar`} passHref>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5"/></Button>
                                                     </Link>
                                                      <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={deletingId === insumo.id}>
                                                                {deletingId === insumo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Eliminar Insumo</AlertDialogTitle>
                                                                <AlertDialogDescription>¿Estás seguro de que quieres eliminar "{insumo.nombre}"?</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(insumo.id, insumo.nombre)} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                      </AlertDialog>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                {insumos.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">No hay insumos en tu catálogo.</p>
                )}
            </CardContent>
        </Card>
    );
};
