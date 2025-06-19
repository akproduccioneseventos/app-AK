
'use client';

import { useState, useEffect, type FormEvent, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Send, Edit, AlertTriangle, Loader2, PlusCircle, ReceiptText, Banknote, Info, Link as LinkIconLucide, FileText as FileTextIcon } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import type { Invoice as InvoiceType, Payment } from '@/types/invoice';
import { getInvoiceById, addPaymentToInvoice } from '@/app/actions/invoices';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image'; // For company logo

// Placeholder for fetching company/template settings
// In a real app, these would come from a context or a fetched configuration
const getCompanySettings = async () => {
  // Simulate fetching settings
  return {
    companyName: "AK Producciones",
    companyAddress: "Montevideo, Uruguay",
    companyTaxId: "RUT Ejemplo 123456789012",
    invoiceCustomFooter: "Información de pago: Banco X, Cuenta Y, Titular Z.\nConsulte por otros métodos de pago.",
  };
};
const getInvoiceTemplateSettings = async () => {
  return {
    logoUrl: "https://placehold.co/180x70.png?text=Mi+Logo",
    logoPosition: "left" as "left" | "center" | "right",
    primaryColor: "#EF4444", // App default red
    accentColor: "#F97316", // App default orange
  };
};


const formatCurrency = (amount: number, currency: string = 'UYU') => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

type NewPaymentData = Omit<Payment, 'id'>;

export default function ViewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceType | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [errorInvoice, setErrorInvoice] = useState<string | null>(null);

  // Memoize initial notes calculation based on invoice
  const initialNotes = useMemo(() => {
    if (!invoice) return '';
    const paymentNumber = (invoice.payments?.length || 0) + 1;
    return paymentNumber === 1 ? `Pago ${paymentNumber} - Seña` : `Pago ${paymentNumber} - `;
  }, [invoice]);

  const [newPayment, setNewPayment] = useState<NewPaymentData>({
    paymentDate: new Date().toISOString(),
    amount: 0,
    method: 'Transferencia',
    notes: '', // Will be set by useEffect based on initialNotes or when invoice changes
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // State for template settings
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [templateSettings, setTemplateSettings] = useState<any>(null);

  const fetchInvoiceAndSettings = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoadingInvoice(true);
    setErrorInvoice(null);
    try {
      const [fetchedInvoice, compSettings, tmplSettings] = await Promise.all([
        getInvoiceById(invoiceId),
        getCompanySettings(),      // Placeholder fetch
        getInvoiceTemplateSettings() // Placeholder fetch
      ]);
      
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
      } else {
        setErrorInvoice(`Factura con ID ${invoiceId} no encontrada.`);
      }
      setCompanySettings(compSettings);
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

  // Effect to update newPayment.notes when invoice (and thus initialNotes) changes
  useEffect(() => {
    if (initialNotes) { // Only update if initialNotes has been calculated
        // Update notes only if the form is "fresh" (amount is 0) or the current note is empty
        if (newPayment.amount === 0 || newPayment.notes === '') {
             setNewPayment(prev => ({ ...prev, notes: initialNotes }));
        }
    }
  }, [initialNotes, newPayment.amount, newPayment.notes]); // Add newPayment.notes and newPayment.amount to prevent re-triggering if user typed something

  const handlePaymentInputChange = (field: keyof NewPaymentData, value: any) => {
    setNewPayment(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentDateChange = (date?: Date) => {
    if (date) handlePaymentInputChange('paymentDate', date.toISOString());
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
        notes: newPayment.notes.trim(), // Ensure notes are trimmed
        amount: Number(newPayment.amount),
      });
      if (result.success && result.invoice) {
        toast({ title: "¡Pago Añadido!", description: "El pago ha sido registrado correctamente." });
        setInvoice(result.invoice); 
        // Recalculate suggested note for next payment
        const nextPaymentNumber = (result.invoice.payments?.length || 0) + 1;
        const nextSuggestedNote = nextPaymentNumber === 1 ? `Pago ${nextPaymentNumber} - Seña` : `Pago ${nextPaymentNumber} - `;
        setNewPayment({ paymentDate: new Date().toISOString(), amount: 0, method: 'Transferencia', notes: nextSuggestedNote });
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

  const handlePrint = () => {
    const nonPrintable = document.querySelectorAll('.print\\:hidden');
    nonPrintable.forEach(el => el.classList.add('temp-hidden-for-print'));
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.classList.add('print-main-override');
    window.print();
    nonPrintable.forEach(el => el.classList.remove('temp-hidden-for-print'));
    if (mainContent) mainContent.classList.remove('print-main-override');
  };
  
  const getLogoAlignmentClass = () => {
    if (!templateSettings) return 'justify-start'; // Default to left
    switch (templateSettings.logoPosition) {
      case 'center': return 'justify-center';
      case 'right': return 'justify-end';
      case 'left':
      default:
        return 'justify-start';
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

  // Style for elements using template colors
  const primaryColorStyle = { color: templateSettings.primaryColor };
  const accentColorStyle = { backgroundColor: templateSettings.accentColor };

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:space-y-2 print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <Link href="/invoices" passHref><Button variant="outline" disabled={isAddingPayment}><ArrowLeft className="w-4 h-4 mr-2" />Volver a Facturas</Button></Link>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" disabled={isAddingPayment} onClick={() => toast({title: "Funcionalidad Próxima", description: "Enviar por email estará disponible pronto."})}><Send className="w-4 h-4 mr-2" />Enviar</Button>
          <Button onClick={handlePrint} disabled={isAddingPayment}><Download className="w-4 h-4 mr-2" />Imprimir/PDF</Button>
          <Link href={`/invoices/${invoice.id}/edit`} passHref><Button variant="secondary" disabled={isAddingPayment}><Edit className="w-4 h-4 mr-2" />Editar</Button></Link>
        </div>
      </div>

      <Card className="overflow-hidden shadow-lg print:shadow-none print:border-none" id="invoice-to-print">
        <CardHeader className="p-6 bg-muted/30 print:bg-transparent print:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Apply Logo Position */}
            <div className={`flex ${getLogoAlignmentClass()} w-full sm:w-auto mb-2 sm:mb-0`}>
              {templateSettings.logoUrl && <Image src={templateSettings.logoUrl} alt={`${companySettings.companyName} Logo`} width={150} height={60} className="object-contain print:w-36 print:h-14" data-ai-hint="company logo invoice"/>}
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
        {/* Line separator with accent color */}
        <div className="h-1 print:h-[2px] mx-6 print:mx-4" style={accentColorStyle}></div>

        <CardContent className="p-6 space-y-6 print:p-4 print:space-y-3">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2">
            <div>
              <h3 className="mb-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground print:text-[9pt] print:mb-0.5">Facturar a:</h3>
              <p className="font-medium text-foreground print:text-sm">{invoice.customer.companyName || invoice.customer.name}</p>
              {invoice.customer.address && (<p className="text-sm text-muted-foreground print:text-xs">{invoice.customer.address.street}</p>)}
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
          
          <Separator className="my-4 print:hidden" />
          {/* Payments Section */}
          <div className="space-y-3 print:hidden">
            <div className="flex items-center gap-2"><Banknote className="w-6 h-6 text-primary" /><h3 className="font-headline text-lg">Pagos Registrados</h3></div>
            {invoice.payments && invoice.payments.length > 0 ? (
              <div className="overflow-x-auto border rounded-md"><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Importe</TableHead><TableHead>Método</TableHead><TableHead>Notas</TableHead></TableRow></TableHeader><TableBody>{invoice.payments.map(p => (<TableRow key={p.id}><TableCell>{formatDate(p.paymentDate)}</TableCell><TableCell>{formatCurrency(p.amount, invoice.currency)}</TableCell><TableCell>{p.method || 'N/A'}</TableCell><TableCell className="max-w-[150px] truncate" title={p.notes}>{p.notes || '-'}</TableCell></TableRow>))}</TableBody></Table></div>
            ) : (<div className="text-center py-4 text-muted-foreground bg-muted/20 rounded-md text-sm"><Info className="w-5 h-5 mx-auto mb-1 opacity-50" />No hay pagos registrados.</div>)}
          </div>
          
          {/* Add New Payment Form */}
          {invoice.status !== 'Paid' && (
            <div className="mt-6 pt-4 border-t print:hidden">
              <div className="flex items-center gap-2 mb-3"><PlusCircle className="w-6 h-6 text-primary" /><h3 className="font-headline text-lg">Añadir Nuevo Pago</h3></div>
              <form onSubmit={handleAddPaymentSubmit} className="space-y-3 p-3 border rounded-md bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label htmlFor="paymentDate">Fecha Pago</Label><DatePickerDemo selectedDate={newPayment.paymentDate ? new Date(newPayment.paymentDate) : new Date()} onDateChange={handlePaymentDateChange} /></div>
                    <div className="space-y-1"><Label htmlFor="paymentAmount">Importe ({invoice.currency})</Label><Input id="paymentAmount" type="number" value={newPayment.amount} onChange={(e) => handlePaymentInputChange('amount', parseFloat(e.target.value) || 0)} placeholder="0.00" min="0.01" step="any" required /></div>
                  </div>
                  <div className="space-y-1"><Label htmlFor="paymentMethod">Método</Label><Select value={newPayment.method || 'Transferencia'} onValueChange={(value) => handlePaymentInputChange('method', value as Payment['method'])}><SelectTrigger id="paymentMethod"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Transferencia">Transferencia</SelectItem><SelectItem value="Efectivo">Efectivo</SelectItem><SelectItem value="Tarjeta">Tarjeta</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentNotes">Notas del Pago</Label>
                    <Textarea 
                        id="paymentNotes" 
                        value={newPayment.notes || ''} 
                        onChange={(e) => handlePaymentInputChange('notes', e.target.value)} 
                        placeholder="Descripción adicional (Ej: Transferencia Banco X)" 
                        rows={2} 
                    />
                  </div>
                  <Button type="submit" disabled={isAddingPayment} size="sm">{isAddingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ReceiptText className="w-4 h-4 mr-2" />}{isAddingPayment ? 'Registrando...' : 'Registrar Pago'}</Button>
              </form>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 text-center bg-muted/30 print:mt-6 print:pt-3 print:border-t print:border-gray-300">
            {/* Custom Footer from Company Settings */}
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
          .print\\:hidden { display: none !important; }
          .print\\:text-xs { font-size: 0.7rem !important; line-height: 0.9rem !important; }
          .print\\:text-\\[9pt\\] { font-size: 9pt !important; line-height: 1.1 !important; }
          .print\\:text-sm { font-size: 0.8rem !important; line-height: 1.1rem !important; }
          .print\\:text-base { font-size: 0.9rem !important; line-height: 1.3rem !important; }
          .print\\:text-lg { font-size: 1rem !important; line-height: 1.4rem !important; }
          .print\\:text-xl { font-size: 1.1rem !important; line-height: 1.5rem !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:p-1 { padding: 0.15rem !important; }
          .print\\:p-2 { padding: 0.3rem !important; }
          .print\\:p-4 { padding: 0.5rem !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:mb-0\\.5 { margin-bottom: 0.1rem !important; }
          .print\\:mb-1 { margin-bottom: 0.2rem !important; }
          .print\\:mb-1\\.5 { margin-bottom: 0.3rem !important; }
          .print\\:mb-2 { margin-bottom: 0.4rem !important; }
          .print\\:mt-2 { margin-top: 0.4rem !important; }
          .print\\:mt-3 { margin-top: 0.6rem !important; }
          .print\\:mt-4 { margin-top: 0.8rem !important; }
          .print\\:mt-6 { margin-top: 1.2rem !important; }
          .print\\:pt-3 { padding-top: 0.6rem !important; }
          .print\\:space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.2rem !important; margin-bottom: 0.2rem !important; }
          .print\\:space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.4rem !important; margin-bottom: 0.4rem !important; }
          .print\\:space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.6rem !important; margin-bottom: 0.6rem !important; }
          .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .print\\:gap-2 { gap: 0.4rem !important; }
          .print\\:gap-3 { gap: 0.6rem !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:bg-transparent { background-color: transparent !important; }
          .print\\:bg-gray-100 { background-color: #f3f4f6 !important; }
          .print\\:w-36 { width: 9rem !important; }
          .print\\:h-14 { height: 3.5rem !important; }
          main.print-main-override { padding: 0.5in !important; }
           #invoice-to-print {
              width: 100%;
              margin: 0 auto;
              box-shadow: none !important;
              border: none !important;
            }
        }
        .temp-hidden-for-print { display: none !important; }
      `}</style>
    </div>
  );
}

