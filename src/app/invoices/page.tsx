
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePlus2, Loader2, AlertTriangle, SearchX, Trash2 } from 'lucide-react';
import { InvoiceListItem } from '@/components/invoice-list-item';
import type { Invoice } from '@/types/invoice';
import { getInvoices, deleteInvoice as deleteInvoiceAction } from '@/app/actions/invoices';
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      setError("No se pudieron cargar las facturas. Intenta de nuevo más tarde.");
      toast({
        title: "Error al Cargar Facturas",
        description: err.message || "Ocurrió un problema inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [toast]); // Removed fetchInvoices from dependency array as it's stable

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber?: string) => {
    setDeletingId(invoiceId);
    try {
      const result = await deleteInvoiceAction(invoiceId);
      if (result.success) {
        toast({ title: "Factura Eliminada", description: `La factura "${invoiceNumber || invoiceId}" ha sido eliminada.` });
        await fetchInvoices(); // Recargar la lista de facturas
      } else {
        throw new Error(result.error || "Error desconocido al eliminar la factura.");
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
          <CardDescription>Gestiona y haz seguimiento de todas tus facturas.</CardDescription>
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
