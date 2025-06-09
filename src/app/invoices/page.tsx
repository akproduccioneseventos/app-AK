
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePlus2, Loader2, AlertTriangle, SearchX } from 'lucide-react';
import { InvoiceListItem } from '@/components/invoice-list-item';
import type { Invoice } from '@/types/invoice';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getInvoices, deleteInvoice as deleteInvoiceAction } from '@/app/actions/invoices';
import { getFiestaActual, addInvoiceIdToFiestaActual, removeInvoiceIdFromFiestaActual } from '@/app/actions/fiesta-actual';
import { useToast } from '@/hooks/use-toast';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assigningInvoiceId, setAssigningInvoiceId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invoicesData, fiestaData] = await Promise.all([
        getInvoices(),
        getFiestaActual()
      ]);
      setInvoices(invoicesData);
      setFiestaActual(fiestaData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("No se pudieron cargar los datos. Intenta de nuevo más tarde.");
      toast({
        title: "Error al Cargar Datos",
        description: err.message || "Ocurrió un problema inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber?: string) => {
    setDeletingId(invoiceId);
    try {
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
        await fetchData(); // Recargar datos para reflejar el cambio
      } else {
        throw new Error(result.error || "Error al actualizar la asignación de la factura.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAssigningInvoiceId(null);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Todas las Facturas
        </h1>
        <Link href="/invoices/new" passHref>
          <Button>
            <FilePlus2 className="w-5 h-5 mr-2" />
            Nueva Factura
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Listado de Facturas</CardTitle>
          <CardDescription>Gestiona, haz seguimiento y asigna facturas a tu fiesta actual.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando facturas...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Error al cargar facturas</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Asignar</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
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
              <SearchX className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No has creado ninguna factura todavía.</p>
              <Link href="/invoices/new" passHref>
                <Button className="mt-6">
                  <FilePlus2 className="w-5 h-5 mr-2" />
                  Crear Primera Factura
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
