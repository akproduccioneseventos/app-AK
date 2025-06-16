
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, AlertTriangle, Edit3, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceStatus, Customer as InvoiceCustomerType } from '@/types/invoice';
import { getInvoiceById, saveInvoice as updateInvoiceAction } from '@/app/actions/invoices';
import { getCustomers } from '@/app/actions/customers'; // To fetch customers for dropdown
import type { Customer } from '@/types/customer'; // Main Customer type

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  // customerNameDisplay will be derived from selectedCustomerId and customers list
  const [issueDate, setIssueDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<InvoiceStatus>('Draft');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);
  
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadInvoiceAndCustomers = useCallback(async () => {
    if (!invoiceId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setNotFound(false);
    try {
      const [loadedInvoice, fetchedCustomers] = await Promise.all([
        getInvoiceById(invoiceId),
        getCustomers()
      ]);

      setAllCustomers(fetchedCustomers);

      if (loadedInvoice) {
        setInvoice(loadedInvoice);
        setInvoiceNumber(loadedInvoice.invoiceNumber);
        setSelectedCustomerId(loadedInvoice.customer.id);
        setIssueDate(new Date(loadedInvoice.issueDate));
        setDueDate(new Date(loadedInvoice.dueDate));
        setStatus(loadedInvoice.status);
        setNotes(loadedInvoice.notes || '');
        setCurrency(loadedInvoice.currency || 'UYU');
        setTaxRate(loadedInvoice.taxRate || 0);
      } else {
        setNotFound(true);
        toast({ title: 'Error', description: `No se encontró la factura con ID ${invoiceId}.`, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error al cargar la factura o clientes:", error);
      setNotFound(true);
      toast({ title: 'Error al Cargar', description: 'No se pudo obtener la factura o los clientes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, toast]);

  useEffect(() => {
    loadInvoiceAndCustomers();
  }, [loadInvoiceAndCustomers]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    
    const customerForInvoice = allCustomers.find(c => c.id === selectedCustomerId);
    if (!customerForInvoice) {
        toast({ title: "Error de Cliente", description: "El cliente seleccionado no es válido.", variant: "destructive" });
        return;
    }
    if (!invoiceNumber.trim()) {
      toast({ title: "Número de Factura Requerido", variant: "destructive" }); return;
    }
    if (!issueDate) {
      toast({ title: "Fecha de Emisión Requerida", variant: "destructive" }); return;
    }

    setIsSaving(true);
    // Create a new items array with totals recalculated, though items themselves are not editable here
    const recalculatedItems = invoice.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));
    const subtotal = recalculatedItems.reduce((sum, item) => sum + item.total, 0);
    const currentTaxRate = Number(taxRate) || 0;
    const taxAmount = (subtotal * currentTaxRate) / 100;
    const totalAmount = subtotal + taxAmount;


    const updatedData: Invoice = {
      ...invoice, // Spreads original items, payments, vendor details
      invoiceNumber: invoiceNumber.trim(),
      customer: customerForInvoice as InvoiceCustomerType, // Cast if types differ slightly, ensure compatibility
      issueDate: issueDate.toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : issueDate.toISOString(),
      status,
      notes: notes.trim(),
      currency: currency.trim() || 'UYU',
      taxRate: currentTaxRate,
      // These are recalculated based on existing items, as item editing is not part of this form
      items: recalculatedItems, 
      subtotal,
      taxAmount,
      totalAmount,
    };

    try {
      const result = await updateInvoiceAction(updatedData); // saveInvoice also handles updates
      if (result.success && result.invoice) {
        toast({ title: "¡Factura Actualizada!", description: `La factura "${result.invoice.invoiceNumber}" ha sido actualizada.` });
        setInvoice(result.invoice); 
        // Optionally re-fetch or update state more granularly
        loadInvoiceAndCustomers(); // Re-fetch to ensure all data is fresh
      } else {
        throw new Error(result.error || "Error desconocido al actualizar la factura.");
      }
    } catch (error: any) {
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const customerNameDisplay = allCustomers.find(c => c.id === selectedCustomerId)?.companyName || allCustomers.find(c => c.id === selectedCustomerId)?.name || "Cliente no encontrado";


  if (isLoading) {
    return (<div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>);
  }
  if (notFound) {
    return (<div className="flex flex-col items-center justify-center h-screen text-center"><AlertTriangle className="w-16 h-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Factura No Encontrada</h1><Link href="/invoices"><Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link></div>);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Edit3 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Editar Factura #{invoice?.invoiceNumber}</h1></div>
        <Link href={`/invoices/${invoiceId}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver a Factura</Button></Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información Principal</CardTitle>
          <CardDescription>Modifica los detalles generales de la factura. La edición de ítems y pagos se realiza en la vista de factura.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="invoice-customer" className="text-base">Cliente</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} disabled={isSaving || isLoading || (invoice?.payments && invoice.payments.length > 0)}>
                  <SelectTrigger id="invoice-customer" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccionar cliente"/></SelectTrigger>
                  <SelectContent>
                    {allCustomers.map(c=>(<SelectItem key={c.id} value={c.id} className="text-base">{c.companyName || c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                {(invoice?.payments && invoice.payments.length > 0) && <p className="text-xs text-muted-foreground">No se puede cambiar el cliente si existen pagos registrados.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-number" className="text-base">Número de Factura</Label>
                <Input id="invoice-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="text-base p-3" disabled={isSaving}/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="issue-date" className="text-base">Fecha de Emisión</Label>
                <DatePickerDemo selectedDate={issueDate} onDateChange={setIssueDate} className={isSaving ? "disabled:opacity-70" : ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date" className="text-base">Fecha de Vencimiento</Label>
                <DatePickerDemo selectedDate={dueDate} onDateChange={setDueDate} className={isSaving ? "disabled:opacity-70" : ""} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="status-select" className="text-base">Estado</Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as InvoiceStatus)} disabled={isSaving}>
                    <SelectTrigger id="status-select" className="text-base p-3 h-auto"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {(['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue'] as InvoiceStatus[]).map(s => (<SelectItem key={s} value={s} className="text-base">{s === 'Draft' ? 'Borrador' : s === 'Sent' ? 'Enviada' : s === 'Viewed' ? 'Vista' : s === 'Paid' ? 'Pagada' : 'Vencida'}</SelectItem>))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="currency-input">Moneda</Label>
                    <Input id="currency-input" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="Ej: UYU" className="text-base p-3" maxLength={3} disabled={isSaving}/>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="tax-rate-input">Tasa de IVA (%)</Label>
                <Input id="tax-rate-input" type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} placeholder="Ej: 22 para 22%" className="text-base p-3" min="0" max="100" step="any" disabled={isSaving}/>
            </div>


            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base">Notas Adicionales</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="text-base p-3" disabled={isSaving}/>
            </div>
            <div className="p-3 border rounded-md bg-blue-50 border-blue-200 text-blue-700 text-sm">
                <Info className="inline w-4 h-4 mr-2 align-text-bottom"/>
                Los ítems de la factura no se pueden editar desde esta pantalla para mantener la integridad de los montos. Para modificar ítems, considera anular esta factura y crear una nueva si es necesario.
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
