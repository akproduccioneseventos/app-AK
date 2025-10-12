
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit, Trash2, Loader2, Users as UsersIcon, Briefcase, AlertTriangle, Filter, Printer, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Proveedor, TipoRegistroProveedor } from '@/types/proveedor';
import { getProveedores, deleteProveedor as deleteProveedorAction } from '@/app/actions/proveedores';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const ALL_TIPOS: TipoRegistroProveedor[] = ['Proveedor', 'Servicio Subcontratado'];
  const [tipoFilter, setTipoFilter] = useState<Record<TipoRegistroProveedor, boolean>>({
    'Proveedor': true,
    'Servicio Subcontratado': true,
  });


  const fetchProveedores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProveedores();
      setProveedores(data);
      setFilteredProveedores(data);
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

  useEffect(() => {
    const filtered = proveedores.filter(p => tipoFilter[p.tipo]);
    setFilteredProveedores(filtered);
  }, [tipoFilter, proveedores]);


  const handleDelete = async (id: string, name?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteProveedorAction(id);
      if (result.success) {
        toast({ title: "Registro Eliminado", description: `El registro "${name || id}" ha sido eliminado.` });
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

  const handleTipoFilterChange = (tipo: TipoRegistroProveedor) => {
    setTipoFilter(prev => ({ ...prev, [tipo]: !prev[tipo]}));
  }

  const anyTipoFilterActive = ALL_TIPOS.some(tipo => !tipoFilter[tipo]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestión de Proveedores y Servicios Subcontratados
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar por Tipo
                {anyTipoFilterActive && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Mostrar por Tipo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_TIPOS.map(tipo => (
                <DropdownMenuCheckboxItem
                  key={tipo}
                  checked={tipoFilter[tipo]}
                  onCheckedChange={() => handleTipoFilterChange(tipo)}
                >
                  {tipo}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/proveedores/reporte" passHref>
             <Button variant="secondary"><Printer className="w-4 h-4 mr-2"/>Ver Reporte</Button>
          </Link>
          <Link href="/proveedores/new" passHref>
            <Button>
              <UserPlus className="w-5 h-5 mr-2" />
              Añadir Registro
            </Button>
          </Link>
           <Link href="/empresa" passHref>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Listado ({filteredProveedores.length})</CardTitle>
          <CardDescription>Consulta y gestiona la información de tus proveedores y colaboradores.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando...</p>
            </div>
          ) : error ? (
             <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : filteredProveedores.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre / Empresa / Servicio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Servicio Principal/Categoría</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProveedores.map((proveedor) => (
                    <TableRow key={proveedor.id}>
                      <TableCell className="font-medium min-w-[200px]">{proveedor.nombreEmpresa || proveedor.nombre}</TableCell>
                      <TableCell><Badge variant={proveedor.tipo === 'Proveedor' ? 'secondary' : 'outline'}>{proveedor.tipo}</Badge></TableCell>
                      <TableCell className="min-w-[180px]">{proveedor.servicioPrincipal}</TableCell>
                      <TableCell className="min-w-[130px]">{proveedor.telefono || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/proveedores/${proveedor.id}/edit`} passHref>
                            <Button variant="outline" size="icon" aria-label={`Editar ${proveedor.nombreEmpresa || proveedor.nombre}`} title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" aria-label={`Eliminar ${proveedor.nombreEmpresa || proveedor.nombre}`} title="Eliminar" disabled={deletingId === proveedor.id}>
                                {deletingId === proveedor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El registro "{proveedor.nombreEmpresa || proveedor.nombre}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(proveedor.id, proveedor.nombreEmpresa || proveedor.nombre)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
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
                 {proveedores.length === 0 ? "No tienes registros guardados todavía." : "Ningún registro coincide con los filtros aplicados."}
              </p>
              {proveedores.length === 0 && (
                <Link href="/proveedores/new" passHref>
                    <Button className="mt-6">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Añadir Primer Registro
                    </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
