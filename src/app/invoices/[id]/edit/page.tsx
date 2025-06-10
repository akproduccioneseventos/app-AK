
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
import { ArrowLeft, Save, Loader2, AlertTriangle, Edit3, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceStatus, Customer } from '@/types/invoice'; // Assume Customer type is within invoice types or imported separately
import { getInvoiceById, saveInvoice as updateInvoiceAction } from '@/app/actions/invoices'; // Assuming saveInvoice handles updates
import { getCustomers } from '@/app/actions/customers'; // To fetch customers

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerNameDisplay, setCustomerNameDisplay] = useState(''); // For display only
  const [issueDate, setIssueDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<InvoiceStatus>('Draft');
  const [notes, setNotes] = useState('');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
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

      setCustomers(fetchedCustomers);

      if (loadedInvoice) {
        setInvoice(loadedInvoice);
        setInvoiceNumber(loadedInvoice.invoiceNumber);
        setSelectedCustomerId(loadedInvoice.customer.id);
        setCustomerNameDisplay(loadedInvoice.customer.companyName || loadedInvoice.customer.name);
        setIssueDate(new Date(loadedInvoice.issueDate));
        setDueDate(new Date(loadedInvoice.dueDate));
        setStatus(loadedInvoice.status);
        setNotes(loadedInvoice.notes || '');
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
    
    const customerForInvoice = customers.find(c => c.id === selectedCustomerId);
    if (!customerForInvoice) {
        toast({ title: "Error de Cliente", description: "El cliente seleccionado no es válido.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const updatedData: Invoice = {
      ...invoice,
      invoiceNumber: invoiceNumber.trim(),
      customer: customerForInvoice, 
      issueDate: issueDate ? issueDate.toISOString() : new Date().toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : new Date().toISOString(),
      status,
      notes: notes.trim(),
      // Items, subtotal, tax, totalAmount are preserved from the original invoice for this simplified edit
    };

    try {
      const result = await updateInvoiceAction(updatedData);
      if (result.success && result.invoice) {
        toast({ title: "¡Factura Actualizada!", description: `La factura "${result.invoice.invoiceNumber}" ha sido actualizada.` });
        setInvoice(result.invoice); 
      } else {
        throw new Error(result.error || "Error desconocido al actualizar la factura.");
      }
    } catch (error: any) {
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="ml-4 text-xl">Cargando datos de la factura...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Factura no Encontrada</h1>
        <p className="text-muted-foreground mb-6">La factura con ID <span className="font-mono bg-muted px-1 rounded">{invoiceId}</span> no pudo ser encontrada.</p>
        <Link href="/invoices" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Volver a Facturas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Edit3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Editar Factura #{invoice?.invoiceNumber}
            </h1>
        </div>
        <Link href={`/invoices/${invoiceId}`} passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver a la Factura</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información de la Factura</CardTitle>
          <CardDescription>Modifica los detalles principales. La edición de ítems se habilitará pronto.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="invoice-customer" className="text-base">Cliente</Label>
                <Input id="invoice-customer" value={customerNameDisplay} readOnly disabled className="text-base p-3 bg-muted/50" />
                 <p className="text-xs text-muted-foreground">La edición de cliente se habilitará pronto.</p>
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
            
            <div className="space-y-2">
                <Label htmlFor="status-select" className="text-base">Estado de la Factura</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as InvoiceStatus)} disabled={isSaving}>
                  <SelectTrigger id="status-select" className="text-base p-3 h-auto"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue'] as InvoiceStatus[]).map(s => (
                        <SelectItem key={s} value={s} className="text-base">{s === 'Draft' ? 'Borrador' : s === 'Sent' ? 'Enviada' : s === 'Viewed' ? 'Vista' : s === 'Paid' ? 'Pagada' : 'Vencida'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base">Notas Adicionales</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="text-base p-3" disabled={isSaving}/>
            </div>
             <p className="text-sm text-muted-foreground">
                Nota: Los ítems de la factura se conservarán como estaban. La edición detallada estará disponible pronto.
            </p>
             <img 
                src="https://placehold.co/600x300.png" 
                alt="Formulario de factura" 
                className="mt-6 rounded-md shadow-md mx-auto"
                data-ai-hint="invoice form document"
            />
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
