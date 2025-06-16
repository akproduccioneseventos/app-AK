
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePlus2, Loader2, AlertTriangle, Search, Filter, Settings } from 'lucide-react';
import { InvoiceListItem } from '@/components/invoice-list-item';
import type { Invoice, InvoiceStatus } from '@/types/invoice';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getInvoices, deleteInvoice as deleteInvoiceAction } from '@/app/actions/invoices';
import { getFiestaActual, addInvoiceIdToFiestaActual, removeInvoiceIdFromFiestaActual } from '@/app/actions/fiesta-actual';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue'];

export default function InvoicesPage() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assigningInvoiceId, setAssigningInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Record<InvoiceStatus, boolean>>(
    ALL_INVOICE_STATUSES.reduce((acc, status) => ({...acc, [status]: true }), {} as Record<InvoiceStatus, boolean>)
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invoicesData, fiestaData] = await Promise.all([
        getInvoices(),
        getFiestaActual()
      ]);
      setAllInvoices(invoicesData);
      setFiestaActual(fiestaData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("No se pudieron cargar los datos. Intenta de nuevo más tarde.");
      toast({ title: "Error al Cargar Datos", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = allInvoices.filter(invoice => {
      const searchTermMatch = 
        invoice.invoiceNumber.toLowerCase().includes(lowercasedSearchTerm) ||
        (invoice.customer.name && invoice.customer.name.toLowerCase().includes(lowercasedSearchTerm)) ||
        (invoice.customer.companyName && invoice.customer.companyName.toLowerCase().includes(lowercasedSearchTerm));
      const statusMatch = statusFilter[invoice.status];
      return searchTermMatch && statusMatch;
    });
    setFilteredInvoices(filtered);
  }, [searchTerm, allInvoices, statusFilter]);

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber?: string) => {
    setDeletingId(invoiceId);
    try {
      // First, if the invoice is assigned to the current party, unassign it.
      if (fiestaActual?.invoiceIds?.includes(invoiceId)) {
        const unassignResult = await removeInvoiceIdFromFiestaActual(invoiceId);
        if (!unassignResult.success) {
          throw new Error(unassignResult.error || "No se pudo desasignar la factura de la fiesta actual antes de eliminarla.");
        }
      }
      const result = await deleteInvoiceAction(invoiceId);
      if (result.success) {
        toast({ title: "Factura Eliminada", description: `La factura "${invoiceNumber || invoiceId}" ha sido eliminada.` });
        await fetchData(); 
      } else {
        throw new Error(result.error || "Error desconocido al eliminar la factura.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAssignInvoice = async (invoiceId: string) => {
    if (!fiestaActual) return;
    setAssigningInvoiceId(invoiceId);
    const isCurrentlyAssigned = fiestaActual.invoiceIds?.includes(invoiceId);
    try {
      const result = isCurrentlyAssigned 
        ? await removeInvoiceIdFromFiestaActual(invoiceId)
        : await addInvoiceIdToFiestaActual(invoiceId);
      if (result.success) {
        toast({
          title: isCurrentlyAssigned ? "Factura Desasignada" : "Factura Asignada",
          description: `La factura ha sido ${isCurrentlyAssigned ? 'desasignada de' : 'asignada a'} la fiesta actual.`,
        });
        await fetchData();
      } else {
        throw new Error(result.error || "Error al actualizar la asignación.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAssigningInvoiceId(null);
    }
  };

  const handleStatusFilterChange = (status: InvoiceStatus) => {
    setStatusFilter(prev => ({ ...prev, [status]: !prev[status]}));
  };
  const anyStatusFilterActive = ALL_INVOICE_STATUSES.some(status => !statusFilter[status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Facturas
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Link href="/settings/templates" passHref>
            <Button variant="outline"><Settings className="w-4 h-4 mr-2"/>Config. Plantilla</Button>
          </Link>
          <Link href="/invoices/new" passHref>
            <Button>
              <FilePlus2 className="w-5 h-5 mr-2" />
              Nueva Factura
            </Button>
          </Link>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle className="font-headline text-2xl">Listado de Facturas ({filteredInvoices.length})</CardTitle>
                <CardDescription>Visualiza, gestiona y asigna facturas a tu fiesta actual.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                 <div className="relative flex-grow md:min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    type="text"
                    placeholder="Buscar por nº o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                    />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-shrink-0">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrar Estado
                      {anyStatusFilterActive && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Estado de Factura</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_INVOICE_STATUSES.map(status => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilter[status]}
                        onCheckedChange={() => handleStatusFilterChange(status)}
                      >
                        {status === 'Draft' ? 'Borrador' : status === 'Sent' ? 'Enviada' : status === 'Viewed' ? 'Vista' : status === 'Paid' ? 'Pagada' : 'Vencida'}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando facturas...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold text-lg">Error al Cargar Facturas</p>
              <p className="text-sm">{error}</p>
              <Button onClick={fetchData} className="mt-4" variant="outline">Reintentar</Button>
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Nº Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="w-[110px]">Emisión</TableHead>
                    <TableHead className="w-[110px]">Vencimiento</TableHead>
                    <TableHead className="text-right w-[130px]">Total</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="text-center w-[130px]">Asignar</TableHead>
                    <TableHead className="text-right w-[150px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <InvoiceListItem 
                      key={invoice.id} 
                      invoice={invoice} 
                      onDelete={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                      isDeleting={deletingId === invoice.id}
                      isAssignedToCurrentFiesta={fiestaActual?.invoiceIds?.includes(invoice.id)}
                      onToggleAssign={() => handleToggleAssignInvoice(invoice.id)}
                      isAssigning={assigningInvoiceId === invoice.id}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                {allInvoices.length === 0 ? "No has creado ninguna factura todavía." : "No se encontraron facturas con los filtros aplicados."}
              </p>
              {allInvoices.length === 0 && (
                 <Link href="/invoices/new" passHref>
                    <Button className="mt-6">
                    <FilePlus2 className="w-5 h-5 mr-2" />
                    Crear Primera Factura
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
