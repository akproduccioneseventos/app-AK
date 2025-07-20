
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Server, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa, deleteServicioEmpresa } from '@/app/actions/servicios-empresa';
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

export default function ServiciosPage() {
  const { toast } = useToast();
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchServicios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServiciosEmpresa();
      const serviciosDeVenta = data.filter(s => s.tipoItem === 'Servicio');
      setServicios(serviciosDeVenta);
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

  const handleDelete = async (id: string, nombreServicio?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteServicioEmpresa(id);
      if (result.success) {
        toast({ title: "Servicio Eliminado", description: `El servicio "${nombreServicio || id}" ha sido eliminado.` });
        await fetchServicios(); 
      } else {
        throw new Error(result.error || "Error desconocido al eliminar.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Server className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Catálogo de Servicios para Venta
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/empresa/todos-los-servicios/nuevo?tipo=Servicio" passHref>
            <Button>
              <PlusCircle className="w-5 h-5 mr-2" />
              Añadir Nuevo Servicio
            </Button>
          </Link>
           <Link href="/empresa" passHref>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Empresa
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Servicios Ofrecidos ({servicios.length})</CardTitle>
          <CardDescription>
            Gestiona los servicios que se mostrarán en el creador de presupuestos. El precio de venta es el precio base que se sugerirá.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando servicios...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : servicios.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Servicio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Precio de Venta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicios.map((servicio) => (
                    <TableRow key={servicio.id}>
                      <TableCell className="font-medium min-w-[200px]">{servicio.nombre}</TableCell>
                      <TableCell><Badge variant="outline">{servicio.categoria}</Badge></TableCell>
                      <TableCell>{servicio.unidad}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{formatCurrency(servicio.precioVenta)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/empresa/todos-los-servicios/${servicio.id}/editar`} passHref>
                            <Button variant="outline" size="icon" aria-label={`Editar ${servicio.nombre}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" aria-label={`Eliminar ${servicio.nombre}`} disabled={deletingId === servicio.id}>
                                {deletingId === servicio.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  El servicio "{servicio.nombre}" será eliminado del catálogo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(servicio.id, servicio.nombre)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
                                  {deletingId === servicio.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <Server className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No has definido ningún servicio para la venta.</p>
              <Link href="/empresa/todos-los-servicios/nuevo?tipo=Servicio" passHref>
                <Button className="mt-6">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Añadir Primer Servicio
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
