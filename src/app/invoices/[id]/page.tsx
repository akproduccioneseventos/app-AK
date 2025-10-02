
'use client';

import React, { useState, useEffect, type FormEvent, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Send, Edit, AlertTriangle, Loader2, PlusCircle, ReceiptText, Banknote, Info, Link as LinkIconLucide, FileText as FileTextIcon, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import type { Invoice as InvoiceType, Payment } from '@/types/invoice';
import { getInvoiceById, addPaymentToInvoice } from '@/app/actions/invoices';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { InvoiceTemplateSettings } from '@/types/settings';

const formatCurrency = (amount: number, currency: string = 'UYU') => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

type NewPaymentFormState = Omit<Payment, 'id' | 'transactionProofUrl'>;


export default function ViewInvoicePage({ params: paramsProp }: { params: { id: string } }) {
  const params = React.use(paramsProp);
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceType | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [errorInvoice, setErrorInvoice] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  const [newPayment, setNewPayment] = useState<NewPaymentFormState>({
    paymentDate: new Date().toISOString(),
    amount: 0,
    method: 'Transferencia',
    notes: '',
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // State for template settings
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [templateSettings, setTemplateSettings] = useState<InvoiceTemplateSettings | null>(null);
  
  const suggestedNote = useMemo(() => {
    if (!invoice) return '';
    const paymentNumber = (invoice.payments?.length || 0) + 1;
    return paymentNumber === 1 ? `Pago ${paymentNumber} - Seña` : `Pago ${paymentNumber} - `;
  }, [invoice]);

  const fetchInvoiceAndSettings = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoadingInvoice(true);
    setErrorInvoice(null);
    try {
      const [fetchedInvoice, tmplSettings] = await Promise.all([
        getInvoiceById(invoiceId),
        getInvoiceTemplateSettings()
      ]);
      
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
        // Use vendor details from the invoice itself
        setCompanySettings({
            companyName: fetchedInvoice.vendorName,
            companyAddress: fetchedInvoice.vendorAddress,
            companyTaxId: fetchedInvoice.vendorTaxId,
            invoiceCustomFooter: fetchedInvoice.notes
        });
        const paymentNumber = (fetchedInvoice.payments?.length || 0) + 1;
        const initialNote = paymentNumber === 1 ? `Pago ${paymentNumber} - Seña` : `Pago ${paymentNumber} - `;
        setNewPayment(prev => ({...prev, notes: prev.notes || initialNote}));
      } else {
        setErrorInvoice(`Factura con ID ${invoiceId} no encontrada.`);
      }
      setTemplateSettings(tmplSettings);

    } catch (error: any) {
      console.error("Error fetching invoice or settings:", error);
      setErrorInvoice(error.message || "No se pudo cargar la factura o su configuración.");
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoiceAndSettings();
  }, [fetchInvoiceAndSettings]);

  const handlePaymentInputChange = (field: keyof NewPaymentFormState, value: any) => {
    setNewPayment(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentDateChange = (date?: Date) => {
    if (date) handlePaymentInputChange('paymentDate', date.toISOString());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentProofFile(e.target.files?.[0] || null);
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
    const formData = new FormData();
    formData.append('paymentDate', newPayment.paymentDate);
    formData.append('amount', String(newPayment.amount));
    formData.append('method', newPayment.method || 'Transferencia');
    if (newPayment.notes) formData.append('notes', newPayment.notes);
    if (paymentProofFile) formData.append('transactionProof', paymentProofFile);


    try {
      const result = await addPaymentToInvoice(invoice.id, formData);
      if (result.success && result.invoice) {
        toast({ title: "¡Pago Añadido!", description: "El pago ha sido registrado correctamente." });
        setInvoice(result.invoice); 
        const nextPaymentNumber = (result.invoice.payments?.length || 0) + 1;
        const nextSuggestedNote = nextPaymentNumber === 1 ? `Pago ${nextPaymentNumber} - Seña` : `Pago ${nextPaymentNumber} - `;
        setNewPayment({ paymentDate: new Date().toISOString(), amount: 0, method: 'Transferencia', notes: nextSuggestedNote });
        setPaymentProofFile(null);
        const fileInput = document.getElementById('paymentProof') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
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

  const handlePrint = () => { window.print(); };

  const handleShare = async () => {
    if (!invoice) return;
    const shareData = {
      title: `Factura ${invoice.invoiceNumber} de ${companySettings?.companyName}`,
      text: `Ver la factura para ${invoice.customer.name || invoice.customer.companyName}. Monto total: ${formatCurrency(invoice.totalAmount, invoice.currency)}`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error();
      }
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Enlace Copiado",
        description: "El enlace a esta página ha sido copiado a tu portapapeles.",
      });
    }
  };
  
  const getLogoAlignmentClass = () => {
    if (!templateSettings) return 'justify-start';
    switch (templateSettings.logoPosition) {
      case 'center': return 'justify-center';
      case 'right': return 'justify-end';
      case 'left': default: return 'justify-start';
    }
  };


  if (isLoadingInvoice || !invoice || !companySettings || !templateSettings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando factura...</p>
      </div>
    );
  }

  if (errorInvoice) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-center py-10">
        <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Error al Cargar Factura</h1>
        <p className="text-muted-foreground">{errorInvoice}</p>
        <Link href="/invoices" passHref><Button variant="outline" className="mt-6"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>
    );
  }

  const primaryColorStyle = { color: templateSettings.primaryColor };
  const accentColorStyle = { backgroundColor: templateSettings.accentColor };

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:space-y-2 print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <Link href="/invoices" passHref><Button variant="outline" disabled={isAddingPayment}><ArrowLeft className="w-4 h-4 mr-2" />Volver a Facturas</Button></Link>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" disabled={isAddingPayment} onClick={handleShare}><Share2 className="w-4 h-4 mr-2" />Compartir</Button>
          <Button onClick={handlePrint} disabled={isAddingPayment}><Download className="w-4 h-4 mr-2" />Imprimir/PDF</Button>
          <Link href={`/invoices/${invoice.id}/edit`} passHref><Button variant="secondary" disabled={isAddingPayment}><Edit className="w-4 h-4 mr-2" />Editar</Button></Link>
        </div>
      </div>

      <Card className="overflow-hidden shadow-lg print:shadow-none print:border-none" id="invoice-to-print">
        <CardHeader className="p-6 bg-muted/30 print:bg-transparent print:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className={`flex ${getLogoAlignmentClass()} w-full sm:w-auto mb-2 sm:mb-0`}>
              {templateSettings.logoUrl && <Image src={templateSettings.logoUrl} alt={`${companySettings.companyName} Logo`} width={150} height={60} className="object-contain print:w-36 print:h-14" data-ai-hint="company logo"/>}
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <h2 className="text-2xl font-bold print:text-xl" style={primaryColorStyle}>FACTURA</h2>
              <p className="text-md text-muted-foreground print:text-sm">Nº: {invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground print:text-[9pt] sm:text-left">
             <p className="font-semibold text-sm text-foreground">{companySettings.companyName}</p>
             <p>{companySettings.companyAddress}</p>
             <p>RUT/NIF: {companySettings.companyTaxId}</p>
          </div>
        </CardHeader>
        <div className="h-1 print:h-[2px] mx-6 print:mx-4" style={accentColorStyle}></div>

        <CardContent className="p-6 space-y-6 print:p-4 print:space-y-3">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2">
            <div>
              <h3 className="mb-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground print:text-[9pt] print:mb-0.5">Facturar a:</h3>
              <p className="font-medium text-foreground print:text-sm">{invoice.customer.companyName || invoice.customer.name}</p>
              {invoice.customer.address?.street && (<p className="text-sm text-muted-foreground print:text-xs">{invoice.customer.address.street}</p>)}
              {invoice.customer.taxId && <p className="text-sm text-muted-foreground print:text-xs">RUT/NIF: {invoice.customer.taxId}</p>}
              {invoice.customer.email && <p className="text-sm text-muted-foreground print:text-xs">Email: {invoice.customer.email}</p>}
              {invoice.customer.phone && <p className="text-sm text-muted-foreground print:text-xs">Tel: {invoice.customer.phone}</p>}
            </div>
            <div className="md:text-right">
              <div className="mb-2 print:mb-1"><span className="text-xs font-semibold uppercase text-muted-foreground print:text-[9pt]">Emisión: </span><span className="text-foreground print:text-sm">{formatDate(invoice.issueDate)}</span></div>
              <div className="mb-2 print:mb-1"><span className="text-xs font-semibold uppercase text-muted-foreground print:text-[9pt]">Vencimiento: </span><span className="text-foreground print:text-sm">{formatDate(invoice.dueDate)}</span></div>
              <div><span className="text-xs font-semibold uppercase text-muted-foreground print:text-[9pt]">Estado: </span><StatusBadge status={invoice.status} /></div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 print:mt-2">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 print:bg-gray-100">
                <tr className="border-b print:border-gray-300">
                  <th className="px-3 py-2.5 font-semibold text-left text-muted-foreground print:px-1 print:py-1 print:text-xs" style={primaryColorStyle}>Descripción</th>
                  <th className="px-3 py-2.5 font-semibold text-right text-muted-foreground print:px-1 print:py-1 print:text-xs" style={primaryColorStyle}>Cant.</th>
                  <th className="px-3 py-2.5 font-semibold text-right text-muted-foreground print:px-1 print:py-1 print:text-xs" style={primaryColorStyle}>P. Unit.</th>
                  <th className="px-3 py-2.5 font-semibold text-right text-muted-foreground print:px-1 print:py-1 print:text-xs" style={primaryColorStyle}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b print:border-gray-200 last:border-b-0">
                    <td className="px-3 py-2.5 text-foreground print:px-1 print:py-1 print:text-xs">{item.description}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground print:px-1 print:py-1 print:text-xs">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground print:px-1 print:py-1 print:text-xs">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="px-3 py-2.5 text-right text-foreground print:px-1 print:py-1 print:text-xs">{formatCurrency(item.total, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-0 mt-6 print:mt-3">
            <div className="md:col-span-2">
             {invoice.notes && (
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1 print:text-[9pt]">Notas:</h4>
                    <p className="text-sm text-muted-foreground print:text-xs whitespace-pre-line">{invoice.notes}</p>
                </div>
             )}
            </div>
            <div className="space-y-1.5 text-right print:space-y-1">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground print:text-xs">Subtotal:</span><span className="text-sm font-medium text-foreground print:text-xs">{formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
              {invoice.taxAmount !== undefined && invoice.taxRate !== undefined && invoice.taxRate > 0 && (<div className="flex justify-between"><span className="text-sm text-muted-foreground print:text-xs">IVA ({invoice.taxRate}%):</span><span className="text-sm font-medium text-foreground print:text-xs">{formatCurrency(invoice.taxAmount, invoice.currency)}</span></div>)}
              <Separator className="my-1 print:my-0.5"/>
              <div className="flex justify-between text-md font-semibold print:text-sm"><span className="text-foreground">Total Factura:</span><span style={primaryColorStyle}>{formatCurrency(invoice.totalAmount, invoice.currency)}</span></div>
              <div className="flex justify-between text-sm print:text-xs"><span className="text-muted-foreground">Total Pagado:</span><span className="font-medium text-green-600">{formatCurrency(totalPaid, invoice.currency)}</span></div>
              <div className="flex justify-between text-sm font-semibold print:text-xs"><span className="text-foreground">Saldo Pendiente:</span><span className={amountDue <= 0 ? "text-green-600" : "text-destructive"}>{formatCurrency(amountDue, invoice.currency)}</span></div>
            </div>
          </div>
          
          <div className="space-y-3 print:mt-4 print:break-inside-avoid">
            <div className="flex items-center gap-2"><Banknote className="w-5 h-5 text-primary print:w-4 print:h-4" /><h3 className="font-headline text-md print:text-sm">Pagos Registrados</h3></div>
            {invoice.payments && invoice.payments.length > 0 ? (
              <div className="overflow-x-auto border rounded-md print:border-gray-300">
                <table className="w-full text-xs print:text-[9pt]">
                  <thead className="bg-muted/30 print:bg-gray-50">
                    <tr className="border-b print:border-gray-300">
                      <th className="px-2 py-1.5 font-medium text-left text-muted-foreground print:px-1 print:py-1">Fecha</th>
                      <th className="px-2 py-1.5 font-medium text-left text-muted-foreground print:px-1 print:py-1">Importe</th>
                      <th className="px-2 py-1.5 font-medium text-left text-muted-foreground print:px-1 print:py-1">Método</th>
                      <th className="px-2 py-1.5 font-medium text-left text-muted-foreground print:px-1 print:py-1">Notas</th>
                      <th className="px-2 py-1.5 font-medium text-left text-muted-foreground print:px-1 print:py-1">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map(p => (
                      <tr key={p.id} className="border-b print:border-gray-200 last:border-b-0">
                        <td className="px-2 py-1.5 print:px-1 print:py-1">{formatDate(p.paymentDate)}</td>
                        <td className="px-2 py-1.5 print:px-1 print:py-1">{formatCurrency(p.amount, invoice.currency)}</td>
                        <td className="px-2 py-1.5 print:px-1 print:py-1">{p.method || 'N/A'}</td>
                        <td className="px-2 py-1.5 print:px-1 print:py-1 max-w-[150px] print:max-w-[100px] truncate" title={p.notes}>{p.notes || '-'}</td>
                        <td className="px-2 py-1.5 print:px-1 print:py-1">
                          {p.transactionProofUrl ? (
                            <a href={p.transactionProofUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Ver</Button>
                            </a>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (<div className="text-center py-3 text-muted-foreground bg-muted/20 rounded-md text-xs print:text-[9pt]"><Info className="w-4 h-4 mx-auto mb-1 opacity-50 print:hidden" />No hay pagos registrados.</div>)}
          </div>
          
          {invoice.status !== 'Paid' && (
            <div className="mt-6 pt-4 border-t print:hidden">
              <div className="flex items-center gap-2 mb-3"><PlusCircle className="w-6 h-6 text-primary" /><h3 className="font-headline text-lg">Añadir Nuevo Pago</h3></div>
              <form onSubmit={handleAddPaymentSubmit} className="space-y-3 p-3 border rounded-md bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label htmlFor="paymentDate">Fecha Pago</Label><DatePickerDemo selectedDate={newPayment.paymentDate ? new Date(newPayment.paymentDate) : new Date()} onDateChange={handlePaymentDateChange} /></div>
                    <div className="space-y-1"><Label htmlFor="paymentAmount">Importe ({invoice.currency})</Label><Input id="paymentAmount" type="number" value={newPayment.amount || ''} onChange={(e) => handlePaymentInputChange('amount', parseFloat(e.target.value) || 0)} placeholder="0.00" min="0.01" step="any" required /></div>
                  </div>
                  <div className="space-y-1"><Label htmlFor="paymentMethod">Método</Label><Select value={newPayment.method || 'Transferencia'} onValueChange={(value) => handlePaymentInputChange('method', value as Payment['method'])}><SelectTrigger id="paymentMethod"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Transferencia">Transferencia</SelectItem><SelectItem value="Efectivo">Efectivo</SelectItem><SelectItem value="Tarjeta">Tarjeta</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1"><Label htmlFor="paymentNotes">Notas del Pago</Label><Textarea id="paymentNotes" value={newPayment.notes || ''} onChange={(e) => handlePaymentInputChange('notes', e.target.value)} placeholder="Descripción adicional (Ej: Transferencia Banco X)" rows={2} /></div>
                  <div className="space-y-1"><Label htmlFor="paymentProof">Comprobante (Opcional)</Label><Input id="paymentProof" type="file" accept="image/*,application/pdf" onChange={handleFileChange} /></div>
                  <Button type="submit" disabled={isAddingPayment} size="sm">{isAddingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ReceiptText className="w-4 h-4 mr-2" />}{isAddingPayment ? 'Registrando...' : 'Registrar Pago'}</Button>
              </form>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 text-center bg-muted/30 print:mt-6 print:pt-3 print:border-t print:border-gray-300">
            {companySettings?.invoiceCustomFooter ? (
                <p className="text-xs text-muted-foreground print:text-[9pt] whitespace-pre-line">{companySettings.invoiceCustomFooter}</p>
            ) : (
                <p className="text-xs text-muted-foreground print:text-[9pt]">Si tienes alguna pregunta sobre esta factura, por favor contacta con {companySettings.companyName}.</p>
            )}
        </CardFooter>
      </Card>
      
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          .print-main-override { padding: 0.5in !important; }
        }
        .temp-hidden-for-print { display: none !important; }
      `}</style>
    </div>
  );
}
