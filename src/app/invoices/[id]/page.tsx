
'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Send, Edit, AlertTriangle, Loader2, PlusCircle, ReceiptText, Banknote, Info, Link as LinkIconLucide } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import type { Invoice as InvoiceType, Payment, Customer } from '@/types/invoice';
import { getInvoiceById, addPaymentToInvoice } from '@/app/actions/invoices';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Helper function for formatting currency
const formatCurrency = (amount: number, currency: string = 'UYU') => {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency }).format(amount);
};

// Helper function for formatting date
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

type NewPaymentData = Omit<Payment, 'id'>; // Now includes receiptImageUrl

export default function ViewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceType | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [errorInvoice, setErrorInvoice] = useState<string | null>(null);

  const [newPayment, setNewPayment] = useState<NewPaymentData>({
    paymentDate: new Date().toISOString(),
    amount: 0,
    method: 'Transferencia',
    notes: '',
    receiptImageUrl: '', // Initialize receiptImageUrl
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoadingInvoice(true);
    setErrorInvoice(null);
    try {
      const fetchedInvoice = await getInvoiceById(invoiceId);
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
      } else {
        setErrorInvoice(`Factura con ID ${invoiceId} no encontrada.`);
      }
    } catch (error: any) {
      console.error("Error fetching invoice:", error);
      setErrorInvoice(error.message || "No se pudo cargar la factura.");
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePaymentInputChange = (field: keyof NewPaymentData, value: any) => {
    setNewPayment(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentDateChange = (date?: Date) => {
    if (date) {
      handlePaymentInputChange('paymentDate', date.toISOString());
    }
  };

  const handleAddPaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice || !newPayment.amount || newPayment.amount <= 0) {
      toast({ title: "Error", description: "El importe del pago debe ser mayor que cero.", variant: "destructive" });
      return;
    }
    if (!newPayment.paymentDate) {
        toast({ title: "Error", description: "Por favor, selecciona una fecha para el pago.", variant: "destructive"});
        return;
    }

    setIsAddingPayment(true);
    try {
      const result = await addPaymentToInvoice(invoice.id, {
        ...newPayment,
        amount: Number(newPayment.amount), // Ensure amount is number
        receiptImageUrl: newPayment.receiptImageUrl?.trim() || undefined, // Ensure it's undefined if empty
      });
      if (result.success && result.invoice) {
        toast({ title: "¡Pago Añadido!", description: "El pago ha sido registrado correctamente." });
        setInvoice(result.invoice); // Actualizar la factura con el nuevo pago y estado
        setNewPayment({ // Reset form
          paymentDate: new Date().toISOString(),
          amount: 0,
          method: 'Transferencia',
          notes: '',
          receiptImageUrl: '',
        });
      } else {
        throw new Error(result.error || "Error desconocido al añadir el pago.");
      }
    } catch (error: any) {
      toast({ title: "Error al Añadir Pago", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingPayment(false);
    }
  };
  
  const totalPaid = invoice?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const amountDue = invoice ? invoice.totalAmount - totalPaid : 0;

  if (isLoadingInvoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="ml-4 text-xl">Cargando factura...</p>
      </div>
    );
  }

  if (errorInvoice || !invoice) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-center py-10">
        <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Error al Cargar Factura</h1>
        <p className="text-muted-foreground">{errorInvoice || "La factura no pudo ser encontrada."}</p>
        <Link href="/invoices" passHref>
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Todas las Facturas
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <Link href="/invoices" passHref>
          <Button variant="outline" disabled={isAddingPayment}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Facturas
          </Button>
        </Link>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" disabled={isAddingPayment}>
            <Send className="w-4 h-4 mr-2" />
            Enviar por Email
          </Button>
          <Button onClick={() => window.print()} disabled={isAddingPayment}>
            <Download className="w-4 h-4 mr-2" />
            Descargar/Imprimir
          </Button>
          <Link href={`/invoices/${invoice.id}/edit`} passHref>
            <Button variant="secondary" disabled={isAddingPayment}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Invoice Details Card */}
      <Card className="overflow-hidden shadow-lg print:shadow-none">
        <CardHeader className="p-6 bg-muted/30 print:bg-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline text-primary">{invoice.vendorName}</h1>
              {invoice.vendorAddress && <p className="text-sm text-muted-foreground">{invoice.vendorAddress}</p>}
              {invoice.vendorTaxId && <p className="text-sm text-muted-foreground">NIF: {invoice.vendorTaxId}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-semibold font-headline text-foreground">FACTURA</h2>
              <p className="text-lg text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold tracking-wider uppercase text-muted-foreground">Facturar a:</h3>
              <p className="font-medium text-foreground">{invoice.customer.companyName || invoice.customer.name}</p>
              {invoice.customer.address && (
                <>
                  <p className="text-sm text-muted-foreground">{invoice.customer.address.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.customer.address.zipCode} {invoice.customer.address.city}
                  </p>
                  <p className="text-sm text-muted-foreground">{invoice.customer.address.country}</p>
                </>
              )}
              {invoice.customer.email && <p className="text-sm text-muted-foreground">Email: {invoice.customer.email}</p>}
              {invoice.customer.taxId && <p className="text-sm text-muted-foreground">NIF/CIF: {invoice.customer.taxId}</p>}
            </div>
            <div className="md:text-right">
              <h3 className="mb-1 text-sm font-semibold tracking-wider uppercase text-muted-foreground">Fecha Emisión:</h3>
              <p className="mb-3 text-foreground">{formatDate(invoice.issueDate)}</p>
              <h3 className="mb-1 text-sm font-semibold tracking-wider uppercase text-muted-foreground">Fecha Vencimiento:</h3>
              <p className="mb-3 text-foreground">{formatDate(invoice.dueDate)}</p>
              <h3 className="mb-1 text-sm font-semibold tracking-wider uppercase text-muted-foreground">Estado:</h3>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 text-lg font-semibold font-headline text-foreground">Conceptos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-3 font-semibold text-left text-muted-foreground">Descripción</th>
                    <th className="px-2 py-3 font-semibold text-right text-muted-foreground">Cant.</th>
                    <th className="px-2 py-3 font-semibold text-right text-muted-foreground">Precio Unit.</th>
                    <th className="px-2 py-3 font-semibold text-right text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-2 py-3 text-foreground">{item.description}</td>
                      <td className="px-2 py-3 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="px-2 py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                      <td className="px-2 py-3 text-right text-foreground">{formatCurrency(item.total, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <Separator />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-0">
            <div className="md:col-span-2">
             {invoice.notes && (
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Notas:</h4>
                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
             )}
            </div>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.taxAmount !== undefined && invoice.taxRate !== undefined && (
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA ({invoice.taxRate}%):</span>
                    <span className="font-medium text-foreground">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-foreground">Total Factura:</span>
                <span className="text-primary">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
              </div>
               <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Pagado:</span>
                <span className="font-medium text-green-600">{formatCurrency(totalPaid, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-md font-semibold">
                <span className="text-foreground">Saldo Pendiente:</span>
                <span className={amountDue <= 0 ? "text-green-600" : "text-destructive"}>
                  {formatCurrency(amountDue, invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 text-center bg-muted/30 print:hidden">
            <p className="text-xs text-muted-foreground">
                Si tienes alguna pregunta sobre esta factura, por favor contacta con {invoice.vendorName}.
            </p>
        </CardFooter>
      </Card>

      {/* Payments Section */}
      <div className="space-y-6 print:hidden">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <Banknote className="w-7 h-7 text-primary" />
                <CardTitle className="font-headline text-xl">Pagos Registrados</CardTitle>
            </div>
            <CardDescription>Historial de pagos recibidos para esta factura.</CardDescription>
          </CardHeader>
          <CardContent>
            {invoice.payments && invoice.payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount, invoice.currency)}</TableCell>
                      <TableCell>{payment.method || 'N/A'}</TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                      <TableCell>
                        {payment.receiptImageUrl ? (
                          <a href={payment.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                            <LinkIconLucide className="w-3 h-3"/> Ver
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-md">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No hay pagos registrados para esta factura.
              </div>
            )}
          </CardContent>
        </Card>

        {invoice.status !== 'Paid' && (
          <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <PlusCircle className="w-7 h-7 text-primary" />
                    <CardTitle className="font-headline text-xl">Añadir Nuevo Pago</CardTitle>
                </div>
              <CardDescription>Registra un nuevo pago para esta factura.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAddPaymentSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Fecha del Pago</Label>
                    <DatePickerDemo 
                        selectedDate={newPayment.paymentDate ? new Date(newPayment.paymentDate) : new Date()} 
                        onDateChange={handlePaymentDateChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">Importe ({invoice.currency})</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => handlePaymentInputChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0.01"
                      step="any"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select
                    value={newPayment.method || 'Transferencia'}
                    onValueChange={(value) => handlePaymentInputChange('method', value as Payment['method'])}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentReceiptUrl">URL de Comprobante (Opcional)</Label>
                  <Input
                    id="paymentReceiptUrl"
                    type="text" 
                    value={newPayment.receiptImageUrl || ''}
                    onChange={(e) => handlePaymentInputChange('receiptImageUrl', e.target.value)}
                    placeholder="https://ejemplo.com/comprobante.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentNotes">Tipo de Pago / Notas (Opcional)</Label>
                  <Textarea
                    id="paymentNotes"
                    value={newPayment.notes || ''}
                    onChange={(e) => handlePaymentInputChange('notes', e.target.value)}
                    placeholder="Ej: Seña, Entrega 2, Pago Final, Nro. de referencia"
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isAddingPayment} className="w-full sm:w-auto">
                  {isAddingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ReceiptText className="w-4 h-4 mr-2" />}
                  {isAddingPayment ? 'Registrando Pago...' : 'Registrar Pago'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

