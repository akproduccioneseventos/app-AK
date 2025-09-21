
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input'; 

const getCustomerStatusBadgeVariant = (status?: CustomerStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "secondary";
  switch (status) {
    case 'Actual': return "default"; 
    case 'Antiguo': return "secondary";
    default: return "secondary";
  }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        // Check if the date is valid. An invalid date might result from parsing 'undefined' or null.
        if (isNaN(date.getTime())) {
            // Check for a specific invalid date pattern from previous bugs, like the Unix epoch start
            if (new Date(dateString).getUTCFullYear() < 1971) return "N/A";
            return "Fecha inválida";
        }
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'numeric', year: '2-digit' });
    } catch(e) {
        return "Fecha inválida";
    }
}

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Record<CustomerStatus, boolean>>(
    ALL_CUSTOMER_STATES.reduce((acc, status) => ({...acc, [status]: true }), {} as Record<CustomerStatus, boolean>)
  );

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

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = customers.filter(customer => {
      const statusMatch = customer.estadoCliente ? statusFilter[customer.estadoCliente] : statusFilter['Actual'];
      const searchTermMatch = lowercasedTerm === '' ||
        customer.name?.toLowerCase().includes(lowercasedTerm) ||
        customer.companyName?.toLowerCase().includes(lowercasedTerm);
      return statusMatch && searchTermMatch;
    });
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter]);

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

  const handleStatusFilterChange = (status: CustomerStatus) => {
    setStatusFilter(prev => ({ ...prev, [status]: !prev[status]}));
  }

  const anyStatusFilterActive = ALL_CUSTOMER_STATES.some(status => !statusFilter[status]);

  const handlePrint = () => {
    window.print();
  };

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
              <CardTitle className="font-headline">Listado de Clientes ({filteredCustomers.length})</CardTitle>
              <CardDescription>Consulta y gestiona la información de tus clientes.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                 <div className="relative flex-grow md:min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    type="text"
                    placeholder="Buscar por nombre o empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                    />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Tag className="w-4 h-4 mr-2" />
                      Filtrar Estado
                      {anyStatusFilterActive && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Mostrar Estado del Cliente</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_CUSTOMER_STATES.map(status => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilter[status]}
                        onCheckedChange={() => handleStatusFilterChange(status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent className="print:p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 print:hidden">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando clientes...</p>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Nombre / Empresa</TableHead>
                    <TableHead className="min-w-[150px] flex items-center gap-1"><CalendarDays className="w-4 h-4"/>Fecha Evento</TableHead>
                    <TableHead className="min-w-[120px]">Estado Cliente</TableHead>
                    <TableHead className="text-right print:hidden min-w-[200px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.companyName || customer.name}</TableCell>
                      <TableCell>{formatDate(customer.partyDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getCustomerStatusBadgeVariant(customer.estadoCliente)} className="text-xs print:border print:border-gray-300 print:text-black print:bg-white">
                          {customer.estadoCliente || 'Actual'}
                        </Badge>
                      </TableCell>
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
                                <AlertDialogAction onClick={() => handleDelete(customer.id, customer.companyName || customer.name)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
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
          ) : (
             <div className="py-10 text-center print:hidden">
              <UsersIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                {customers.length === 0 ? "No tienes clientes confirmados todavía." : "Ningún cliente coincide con los filtros aplicados."}
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
