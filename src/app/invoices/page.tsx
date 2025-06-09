
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePlus2, Loader2, AlertTriangle, SearchX } from 'lucide-react';
import { InvoiceListItem } from '@/components/invoice-list-item';
import type { Invoice } from '@/types/invoice';
import { getInvoices } from '@/app/actions/invoices'; // Importar la nueva acción
import { useToast } from '@/hooks/use-toast';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
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

    fetchInvoices();
  }, [toast]);

  // Por ahora, la función deleteInvoice no está implementada en actions,
  // así que el botón de eliminar en InvoiceListItem no funcionará completamente.
  // const handleDeleteInvoice = async (invoiceId: string) => {
  //   // Lógica para llamar a deleteInvoice action y actualizar el estado
  //   console.log("Deleting invoice:", invoiceId);
  //   toast({ title: "Función Eliminar Pendiente", description: "La eliminación de facturas se implementará pronto."});
  // };

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
                    <InvoiceListItem key={invoice.id} invoice={invoice} />
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
