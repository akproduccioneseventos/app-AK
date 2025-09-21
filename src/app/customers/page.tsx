
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit, Trash2, Loader2, Users as UsersIcon, Filter, Tag, Printer, Eye, Search, CalendarDays } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import type { Customer, CustomerStatus } from '@/types/customer';
import { ALL_CUSTOMER_STATES } from '@/types/customer';
import { getCustomers, deleteCustomer as deleteCustomerAction } from '@/app/actions/customers';
import { getAllFiestas } from '@/app/actions/fiesta-actual';
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
import { Input } from '@/components/ui/input'; 
import { Separator } from '@/components/ui/separator';

const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            if (new Date(dateString).getUTCFullYear() < 1971) return "N/A";
            return "Fecha inválida";
        }
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'numeric', year: '2-digit' });
    } catch(e) {
        return "Fecha inválida";
    }
}

const CustomerTable = ({ title, customers, deletingId, onDelete }: { title: string, customers: Customer[], deletingId: string | null, onDelete: (id: string, name?: string) => void }) => {
    if (customers.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold font-headline mb-3">{title} ({customers.length})</h2>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Nombre / Empresa</TableHead>
                    <TableHead className="min-w-[150px] flex items-center gap-1"><CalendarDays className="w-4 h-4"/>Fecha Evento</TableHead>
                    <TableHead className="text-right print:hidden min-w-[200px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.companyName || customer.name}</TableCell>
                      <TableCell>{formatDate(customer.partyDate)}</TableCell>
                      <TableCell className="text-right print:hidden">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/customers/${customer.id}`} passHref>
                            <Button variant="outline" size="icon" aria-label={`Ver Detalles de ${customer.companyName || customer.name}`} title="Ver Detalles">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/customers/${customer.id}/edit`} passHref>
                            <Button variant="outline" size="icon" aria-label={`Editar Cliente ${customer.companyName || customer.name}`} title="Editar Cliente">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" aria-label={`Eliminar Cliente ${customer.companyName || customer.name}`} title="Eliminar Cliente" disabled={deletingId === customer.id}>
                                {deletingId === customer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El cliente "{customer.companyName || customer.name}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(customer.id, customer.companyName || customer.name)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
                                  {deletingId === customer.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
        </div>
    );
};


export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [customersData, fiestasData] = await Promise.all([
        getCustomers(),
        getAllFiestas()
      ]);
      const now = new Date();
      
      const customersWithStatus = customersData.map(customer => {
          const customerFiestas = fiestasData.filter(f => f.configuracion.clienteId === customer.id);
          const hasFutureEvent = customerFiestas.some(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= now);
          const calculatedStatus: CustomerStatus = hasFutureEvent ? 'Actual' : 'Antiguo';
          const finalStatus = customerFiestas.length > 0 ? calculatedStatus : (customer.estadoCliente || 'Antiguo');
          
          const upcomingEvents = customerFiestas
            .filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= now)
            .sort((a, b) => new Date(a.configuracion.fechaEvento!).getTime() - new Date(b.configuracion.fechaEvento!).getTime());

          return { 
            ...customer, 
            estadoCliente: finalStatus,
            partyDate: upcomingEvents.length > 0 ? upcomingEvents[0].configuracion.fechaEvento : customer.partyDate
          };
      });
      
      const sortedData = customersWithStatus.sort((a, b) => {
          const dateA = a.partyDate ? new Date(a.partyDate).getTime() : Infinity;
          const dateB = b.partyDate ? new Date(b.partyDate).getTime() : Infinity;
          if (dateA === Infinity && dateB === Infinity) return 0;
          return dateA - dateB;
      });
      setCustomers(sortedData);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (id: string, customerName?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteCustomerAction(id);
      if (result.success) {
        toast({ title: "Cliente Eliminado", description: `El cliente "${customerName || id}" ha sido eliminado.` });
        fetchCustomers(); 
      } else {
        throw new Error(result.error || "Error desconocido al eliminar.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCustomers = customers.filter(customer => {
      const lowercasedTerm = searchTerm.toLowerCase();
      return lowercasedTerm === '' ||
        customer.name?.toLowerCase().includes(lowercasedTerm) ||
        customer.companyName?.toLowerCase().includes(lowercasedTerm);
  });

  const activeCustomers = filteredCustomers.filter(c => c.estadoCliente === 'Actual');
  const oldCustomers = filteredCustomers.filter(c => c.estadoCliente === 'Antiguo');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestión de Clientes
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/customers/new" passHref>
            <Button>
              <UserPlus className="w-5 h-5 mr-2" />
              Añadir Cliente
            </Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Listado de Clientes ({customers.length})</CardTitle>
              <CardDescription>Consulta y gestiona la información de tus clientes.</CardDescription>
            </div>
            <div className="relative flex-grow md:max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                type="text"
                placeholder="Buscar por nombre o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
                />
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 print:hidden">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando clientes...</p>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <>
                <CustomerTable title="Clientes con Eventos Futuros" customers={activeCustomers} deletingId={deletingId} onDelete={handleDelete} />
                <Separator />
                <CustomerTable title="Clientes Antiguos" customers={oldCustomers} deletingId={deletingId} onDelete={handleDelete} />
            </>
          ) : (
             <div className="py-10 text-center print:hidden">
              <UsersIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                {customers.length === 0 ? "No tienes clientes confirmados todavía." : "Ningún cliente coincide con tu búsqueda."}
              </p>
              {customers.length === 0 && (
                <Link href="/customers/new" passHref>
                    <Button className="mt-6">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Añadir Primer Cliente
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

