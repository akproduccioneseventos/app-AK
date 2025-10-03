
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, UserPlus, Users, Settings2, AlertTriangle } from 'lucide-react';
import { getEmpleados, deleteEmpleado as deleteEmpleadoAction } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles'; // Para obtener nombres de roles
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
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
import { Badge } from '@/components/ui/badge';

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch (e) { return "Fecha Inválida"; }
};

export default function EmpleadosPage() {
  const { toast } = useToast();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empleadosData, rolesData] = await Promise.all([
        getEmpleados(),
        getRoles()
      ]);
      setEmpleados(empleadosData);
      setRoles(rolesData);
    } catch (err: any) {
      setError("No se pudieron cargar los datos de empleados o roles.");
      toast({ title: "Error de Carga", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string, nombre?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteEmpleadoAction(id);
      if (result.success) {
        toast({ title: "Empleado Eliminado", description: `El empleado "${nombre || id}" ha sido eliminado.` });
        await fetchData();
      } else {
        throw new Error(result.error || "Error desconocido al eliminar.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const getRolNames = (rolIds?: string[]): string => {
    if (!rolIds || rolIds.length === 0) return 'Sin Rol Asignado';
    return rolIds
      .map(rolId => roles.find(r => r.id === rolId)?.nombre)
      .filter(Boolean)
      .join(', ');
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
        <div className="flex gap-2 flex-wrap">
            <Link href="/empleados/roles" passHref>
                <Button variant="outline">
                    <Settings2 className="w-5 h-5 mr-2" />
                    Configurar Roles
                </Button>
            </Link>
            <Link href="/empleados/nuevo" passHref>
              <Button>
                <UserPlus className="w-5 h-5 mr-2" />
                Añadir Empleado
              </Button>
            </Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Listado de Empleados ({empleados.length})</CardTitle>
          <CardDescription>Consulta y gestiona la información de tu personal.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando empleados...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Error al Cargar Empleados</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : empleados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Roles Asignados</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleados.map((empleado) => (
                    <TableRow key={empleado.id}>
                      <TableCell className="font-medium min-w-[180px]">{empleado.nombre}</TableCell>
                      <TableCell className="min-w-[120px]">{empleado.cedula}</TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex flex-wrap gap-1">
                           {(empleado.rolIds && empleado.rolIds.length > 0) ? empleado.rolIds.map(rolId => {
                               const rol = roles.find(r => r.id === rolId);
                               return rol ? <Badge key={rolId} variant="secondary">{rol.nombre}</Badge> : null;
                           }) : <span className="text-xs text-muted-foreground">Sin Rol</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right min-w-[120px]">
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
                                <AlertDialogAction onClick={() => handleDelete(empleado.id, empleado.nombre)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
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
