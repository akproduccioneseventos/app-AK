
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, SearchX, Banknote, CalendarDays } from 'lucide-react';
import type { Invoice, Payment } from '@/types/invoice';
import { getInvoices } from '@/app/actions/invoices';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ConsolidatedPayment extends Payment {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  invoiceCurrency: string;
}

const formatCurrency = (amount: number, currency: string = 'UYU') => {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch (e) { return "Fecha inválida"; }
};

export default function TodosLosPagosPage() {
  const [allPayments, setAllPayments] = useState<ConsolidatedPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAllPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const invoices = await getInvoices();
      const consolidated: ConsolidatedPayment[] = [];
      invoices.forEach(invoice => {
        if (invoice.payments && invoice.payments.length > 0) {
          invoice.payments.forEach(payment => {
            consolidated.push({
              ...payment,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              customerName: invoice.customer.companyName || invoice.customer.name,
              invoiceCurrency: invoice.currency,
            });
          });
        }
      });
      // Sort by payment date, most recent first
      consolidated.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      setAllPayments(consolidated);
    } catch (err: any) {
      setError("No se pudieron cargar los pagos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllPayments();
  }, [fetchAllPayments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Banknote className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Registro General de Pagos
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Todos los Pagos Registrados ({allPayments.length})</CardTitle>
          <CardDescription>Vista consolidada de todos los pagos recibidos a través de las facturas.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando pagos...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Error al cargar pagos</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : allPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead>Factura Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="min-w-[100px]">{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="font-medium min-w-[120px]">
                        <Button variant="link" asChild className="p-0 h-auto text-primary">
                            <Link href={`/invoices/${payment.invoiceId}`}>
                                {payment.invoiceNumber}
                            </Link>
                        </Button>
                      </TableCell>
                      <TableCell className="min-w-[180px]">{payment.customerName}</TableCell>
                      <TableCell className="text-right min-w-[120px] font-medium text-green-600">
                        {formatCurrency(payment.amount, payment.invoiceCurrency)}
                      </TableCell>
                      <TableCell className="min-w-[120px]">{payment.method || 'N/A'}</TableCell>
                      <TableCell className="min-w-[150px] max-w-xs truncate">{payment.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="py-10 text-center">
              <SearchX className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                No hay pagos registrados en el sistema.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
