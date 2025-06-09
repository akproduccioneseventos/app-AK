
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, UserPlus, Users } from 'lucide-react';
import { getEmpleados, deleteEmpleado as deleteEmpleadoAction } from '@/app/actions/empleados';
import type { Empleado } from '@/types/empleado';
import { useToast } from '@/hooks/use-toast';
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

export default function EmpleadosPage() {
  const { toast } = useToast();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEmpleados = async () => {
    setIsLoading(true);
    try {
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los empleados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteEmpleadoAction(id);
      if (result.success) {
        toast({ title: "Empleado Eliminado", description: "El empleado ha sido eliminado correctamente." });
        fetchEmpleados(); // Recargar la lista
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
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Gestión de Personal
            </h1>
        </div>
        <Link href="/empleados/nuevo" passHref>
          <Button>
            <UserPlus className="w-5 h-5 mr-2" />
            Añadir Empleado
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Listado de Empleados</CardTitle>
          <CardDescription>Consulta y gestiona la información de tu personal.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando empleados...</p>
            </div>
          ) : empleados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Sueldo Base</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleados.map((empleado) => (
                    <TableRow key={empleado.id}>
                      <TableCell className="font-medium min-w-[150px]">{empleado.nombre}</TableCell>
                      <TableCell className="min-w-[150px]">{empleado.rol}</TableCell>
                      <TableCell className="text-right min-w-[120px]">{formatCurrency(empleado.sueldoBase)}</TableCell>
                      <TableCell className="text-right min-w-[150px]">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/empleados/${empleado.id}/editar`} passHref>
                            <Button variant="outline" size="icon" aria-label={`Editar ${empleado.nombre}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" aria-label={`Eliminar ${empleado.nombre}`} disabled={deletingId === empleado.id}>
                                {deletingId === empleado.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El empleado "{empleado.nombre}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(empleado.id)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
                                  {deletingId === empleado.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No tienes empleados guardados todavía.</p>
              <Link href="/empleados/nuevo" passHref>
                <Button className="mt-6">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Añadir Primer Empleado
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
