
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
import { ArrowLeft, Download, Send, Edit, AlertTriangle, Loader2, ReceiptText, Banknote, Info, Printer, Share2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import type { Invoice as InvoiceType, Payment } from '@/types/invoice';
import { getInvoiceById, addPaymentToInvoice } from '@/app/actions/invoices';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { InvoiceTemplateSettings } from '@/types/settings';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number, currency: string = 'UYU') => {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

export default function ViewInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const invoiceId = params.id;
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<InvoiceType | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [errorInvoice, setErrorInvoice] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [ajusteText, setAjusteText] = useState<string | null>(null);

  const [newPayment, setNewPayment] = useState<Omit<Payment, 'id' | 'transactionProofUrl'>>({
    paymentDate: new Date().toISOString(),
    amount: 0,
    method: 'Transferencia',
    notes: '',
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [templateSettings, setTemplateSettings] = useState<InvoiceTemplateSettings | null>(null);

  const fetchInvoiceAndSettings = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoadingInvoice(true);
    try {
      const [fetchedInvoice, tmplSettings, allBudgets] = await Promise.all([
        getInvoiceById(invoiceId),
        getInvoiceTemplateSettings(),
        getPresupuestos()
      ]);
      
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
        
        // Determinar si hay ajuste anual buscando el presupuesto origen
        const linkedBudget = allBudgets.find(b => b.invoiceId === fetchedInvoice.id);
        if (linkedBudget?.ajusteAnualActivo && linkedBudget.eventoFecha) {
            const anioCreacion = new Date(linkedBudget.timestamp).getFullYear();
            const anioEvento = new Date(linkedBudget.eventoFecha).getFullYear();
            if (anioEvento > anioCreacion) {
                let anos = [];
                for(let i = anioCreacion + 1; i <= anioEvento; i++) anos.push(i);
                setAjusteText(`INCLUYE AJUSTE 15% ${anos.join(' Y ')}`);
            }
        }

        const paymentNumber = (fetchedInvoice.payments?.length || 0) + 1;
        const initialNote = paymentNumber === 1 ? `Seña - Entrega 1` : `Entrega ${paymentNumber}`;
        setNewPayment(prev => ({...prev, notes: initialNote}));
      }
      setTemplateSettings(tmplSettings);
    } catch (error: any) {
      setErrorInvoice(error.message || "Error al cargar los datos.");
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoiceAndSettings();
  }, [fetchInvoiceAndSettings]);

  const handleAddPaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice || !newPayment.amount || newPayment.amount <= 0) return;
    
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
        toast({ title: "Pago Registrado" });
        await fetchInvoiceAndSettings();
        setPaymentProofFile(null);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingPayment(false);
    }
  };
  
  const totalPaid = invoice?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const amountDue = invoice ? invoice.totalAmount - totalPaid : 0;

  if (isLoadingInvoice || !invoice || !templateSettings) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8 print:p-0 print:m-0 bg-background">
      {/* Botones de acción (No se imprimen) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <Link href="/invoices" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Imprimir / PDF</Button>
          <Button variant="outline" onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              toast({title: "Enlace copiado"});
          }}><Share2 className="w-4 h-4 mr-2" />Compartir Enlace</Button>
          <Link href={`/invoices/${invoice.id}/edit`} passHref><Button variant="secondary"><Edit className="w-4 h-4 mr-2" />Editar Datos</Button></Link>
        </div>
      </div>

      {/* DOCUMENTO RECIBO (Se imprime) */}
      <div className="bg-white p-8 print:p-4 rounded-lg shadow-sm border print:border-none print:shadow-none min-h-[1050px] flex flex-col font-sans">
        
        {/* Cabecera */}
        <div className="flex justify-between items-start mb-12">
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-lg">SR. Alexander Knuth</p>
            <p>Salto</p>
            <p>50000 Salto</p>
            <p>akproduccionessalto@gmail.com</p>
            <p>www.akproduccioneseventos.com</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold mb-4 tracking-tighter">Recibo</h1>
            {templateSettings.logoUrl && (
                <div className="relative w-32 h-32 ml-auto">
                    <Image src={templateSettings.logoUrl} alt="Logo" layout="fill" className="object-contain" />
                </div>
            )}
          </div>
        </div>

        {/* Subtítulo dinámico con ajuste */}
        <div className="text-center mb-12">
            <p className="text-lg font-medium">
                {formatDate(invoice.issueDate)} - {invoice.customer.name || invoice.customer.companyName} {ajusteText && <span className="font-bold ml-2">{ajusteText}</span>}
            </p>
        </div>

        {/* Tabla de Datos de Facturación */}
        <div className="mb-12 overflow-hidden border border-gray-300 rounded-sm">
            <table className="w-full text-center text-sm border-collapse">
                <thead className="bg-gray-200 border-b border-gray-300">
                    <tr>
                        <th className="py-2 border-r border-gray-300 font-semibold px-2">Número de cliente</th>
                        <th className="py-2 border-r border-gray-300 font-semibold px-2">Número de factura</th>
                        <th className="py-2 border-r border-gray-300 font-semibold px-2">Página</th>
                        <th className="py-2 border-r border-gray-300 font-semibold px-2">Fecha de factura</th>
                        <th className="py-2 font-semibold px-2">Vencimiento</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-2 border-r border-gray-300">{invoice.customer.id.split('_').pop()?.substring(0,5)}</td>
                        <td className="py-2 border-r border-gray-300">{invoice.invoiceNumber}</td>
                        <td className="py-2 border-r border-gray-300">1 / 1</td>
                        <td className="py-2 border-r border-gray-300">{formatDate(invoice.issueDate)}</td>
                        <td className="py-2">{formatDate(invoice.dueDate)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Tabla Principal de Artículos y Pagos */}
        <div className="flex-grow border border-gray-300 rounded-sm overflow-hidden mb-6">
            <table className="w-full text-sm border-collapse h-full">
                <thead className="bg-gray-200 border-b border-gray-300">
                    <tr>
                        <th className="py-2 px-3 text-left border-r border-gray-300 w-1/2">Artículo</th>
                        <th className="py-2 px-3 text-right border-r border-gray-300">Cantidad</th>
                        <th className="py-2 px-3 text-center border-r border-gray-300">Unidad</th>
                        <th className="py-2 px-3 text-right border-r border-gray-300">Precio</th>
                        <th className="py-2 px-3 text-right">Importe total</th>
                    </tr>
                </thead>
                <tbody className="align-top">
                    {/* El servicio principal */}
                    {invoice.items.map((item, idx) => (
                        <tr key={item.id} className={idx === 0 ? "" : "border-t border-gray-100"}>
                            <td className="py-3 px-3 border-r border-gray-300 font-medium uppercase">{item.description}</td>
                            <td className="py-3 px-3 text-right border-r border-gray-300">{item.quantity}</td>
                            <td className="py-3 px-3 text-center border-r border-gray-300">$</td>
                            <td className="py-3 px-3 text-right border-r border-gray-300">{formatCurrency(item.unitPrice).replace('$', '')}</td>
                            <td className="py-3 px-3 text-right font-medium">{formatCurrency(item.total).replace('$', '')}</td>
                        </tr>
                    ))}
                    
                    {/* Los pagos como deducciones */}
                    {invoice.payments?.map(p => (
                        <tr key={p.id}>
                            <td className="py-2 px-3 border-r border-gray-300">
                                <p className="text-xs text-gray-600">{formatDate(p.paymentDate)} Pago: {formatCurrency(p.amount)}</p>
                                <p className="font-medium text-xs">{p.notes || 'Entrega de pago'}</p>
                            </td>
                            <td className="py-2 px-3 border-r border-gray-300"></td>
                            <td className="py-2 px-3 border-r border-gray-300"></td>
                            <td className="py-2 px-3 border-r border-gray-300"></td>
                            <td className="py-2 px-3 text-right text-gray-600">- {formatCurrency(p.amount).replace('$', '')}</td>
                        </tr>
                    ))}
                    
                    {/* Espacio en blanco para completar la altura del recibo */}
                    <tr className="flex-grow">
                        <td className="border-r border-gray-300 h-full"></td>
                        <td className="border-r border-gray-300"></td>
                        <td className="border-r border-gray-300"></td>
                        <td className="border-r border-gray-300"></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Totales Finales */}
        <div className="flex justify-end mb-12">
            <div className="w-full max-w-[300px] space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="font-semibold">Importe total</span>
                    <span className="font-bold">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-semibold">Pagos</span>
                    <span className="font-bold">{formatCurrency(totalPaid)}</span>
                </div>
                <Separator className="bg-gray-400" />
                <div className="flex justify-between text-base">
                    <span className="font-bold uppercase">Importe pendiente</span>
                    <span className="font-bold">{formatCurrency(amountDue)}</span>
                </div>
            </div>
        </div>

        {/* Pie de página */}
        <div className="mt-auto pt-8">
            <p className="text-sm font-medium">Gracias por tu pago</p>
        </div>
      </div>

      {/* Formulario para añadir pagos (No se imprime) */}
      {invoice.status !== 'Paid' && (
        <Card className="print:hidden border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
                <Banknote className="text-primary"/> Registrar Nueva Entrega de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Monto a entregar (UYU)</Label>
                        <Input type="number" value={newPayment.amount || ''} onChange={e => handlePaymentInputChange('amount', parseFloat(e.target.value))} placeholder="0.00" required />
                    </div>
                    <div className="space-y-1">
                        <Label>Fecha del pago</Label>
                        <DatePickerDemo selectedDate={new Date(newPayment.paymentDate)} onDateChange={handlePaymentDateChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Método</Label>
                        <Select value={newPayment.method} onValueChange={v => handlePaymentInputChange('method', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Transferencia">Transferencia</SelectItem>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>Referencia / Detalle (Ej: Seña, Entrega 2)</Label>
                        <Input value={newPayment.notes} onChange={e => handlePaymentInputChange('notes', e.target.value)} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label>Comprobante (Imagen/PDF)</Label>
                    <Input type="file" onChange={e => setPaymentProofFile(e.target.files?.[0] || null)} />
                </div>
                <Button type="submit" className="w-full" disabled={isAddingPayment}>
                    {isAddingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>}
                    Registrar Pago y Actualizar Recibo
                </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        @media print {
          header, footer, .print-hidden, button, .sidebar, .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-m-0 { margin: 0 !important; padding: 0 !important; }
          @page { size: A4; margin: 1cm; }
        }
      `}</style>
    </div>
  );

  function handlePaymentInputChange(field: string, value: any) {
    setNewPayment(prev => ({ ...prev, [field]: value }));
  }

  function handlePaymentDateChange(date?: Date) {
    if (date) handlePaymentInputChange('paymentDate', date.toISOString());
  }
}
