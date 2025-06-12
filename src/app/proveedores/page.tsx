
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit, Trash2, Loader2, Users as UsersIcon, Briefcase, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/customer';
import { getCustomers, deleteCustomer as deleteCustomerAction } from '@/app/actions/customers';
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


export default function ProveedoresPage() {
  const { toast } = useToast();
  const [proveedores, setProveedores] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProveedores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomers(); // Usamos getCustomers por ahora
      setProveedores(data);
    } catch (err: any) {
      setError("No se pudieron cargar los proveedores.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const handleDelete = async (id: string, customerName?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteCustomerAction(id); // Usamos deleteCustomer por ahora
      if (result.success) {
        toast({ title: "Proveedor Eliminado", description: `El proveedor "${customerName || id}" ha sido eliminado.` });
        fetchProveedores(); 
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
          <Briefcase className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestión de Proveedores
          </h1>
        </div>
        <Link href="/proveedores/new" passHref> {/* Actualizado el enlace aquí */}
          <Button>
            <UserPlus className="w-5 h-5 mr-2" />
            Añadir Nuevo Proveedor
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Listado de Proveedores ({proveedores.length})</CardTitle>
          <CardDescription>Consulta y gestiona la información de tus proveedores y colaboradores.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando proveedores...</p>
            </div>
          ) : error ? (
             <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Error al cargar proveedores</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : proveedores.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre / Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proveedores.map((proveedor) => (
                    <TableRow key={proveedor.id}>
                      <TableCell className="font-medium min-w-[200px]">{proveedor.companyName || proveedor.name}</TableCell>
                      <TableCell className="min-w-[180px]">{proveedor.email || '-'}</TableCell>
                      <TableCell className="min-w-[130px]">{proveedor.phone || '-'}</TableCell>
                      <TableCell className="min-w-[130px]">{proveedor.address?.city || '-'}</TableCell>
                      <TableCell className="text-right min-w-[150px]">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/customers/${proveedor.id}/edit`} passHref> {/* Edita como cliente */}
                            <Button variant="outline" size="icon" aria-label={`Editar Proveedor ${proveedor.companyName || proveedor.name}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" aria-label={`Eliminar Proveedor ${proveedor.companyName || proveedor.name}`} disabled={deletingId === proveedor.id}>
                                {deletingId === proveedor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El proveedor "{proveedor.companyName || proveedor.name}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(proveedor.id, proveedor.companyName || proveedor.name)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
                                  {deletingId === proveedor.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
              <UsersIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                No tienes proveedores guardados todavía.
              </p>
              <Link href="/proveedores/new" passHref> {/* Enlaza a nuevo proveedor */}
                    <Button className="mt-6">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Añadir Primer Proveedor
                    </Button>
                </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
