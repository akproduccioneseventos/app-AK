'use client';

import React, { useState, useEffect, type FormEvent, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Loader2, Banknote, Printer, Share2, CheckCircle2, History, FileText } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import type { Invoice as InvoiceType, Payment } from '@/types/invoice';
import { getInvoiceById, addPaymentToInvoice } from '@/app/actions/invoices';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { InvoiceTemplateSettings } from '@/types/settings';

// Helper to convert numbers to Spanish words
function numberToSpanishWords(n: number): string {
  const words: Record<number, string> = {
    0: 'CERO', 1: 'UN', 2: 'DOS', 3: 'TRES', 4: 'CUATRO', 5: 'CINCO', 6: 'SEIS', 7: 'SIETE', 8: 'OCHO', 9: 'NUEVE',
    10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE', 20: 'VEINTE', 30: 'TREINTA',
    40: 'CUARENTA', 50: 'CINCUENTA', 60: 'SESENTA', 70: 'SETENTA', 80: 'OCHENTA', 90: 'NOVENTA',
    100: 'CIEN', 200: 'DOSCIENTOS', 300: 'TRESCIENTOS', 400: 'CUATROCIENTOS', 500: 'QUINIENTOS',
    600: 'SEISCIENTOS', 700: 'SETECIENTOS', 800: 'OCHOCIENTOS', 900: 'NOVECIENTOS',
    1000: 'MIL', 1000000: 'UN MILLÓN'
  };

  if (n in words) return words[n];
  
  if (n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const units = n % 10;
    return `${words[tens]}${units > 0 ? ' Y ' + words[units] : ''}`;
  }
  
  if (n < 1000) {
    const hundreds = Math.floor(n / 100) * 100;
    const rest = n % 100;
    return `${n === 100 ? 'CIEN' : words[hundreds]}${rest > 0 ? ' ' + numberToSpanishWords(rest) : ''}`;
  }

  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    return `${thousands === 1 ? 'MIL' : numberToSpanishWords(thousands) + ' MIL'}${rest > 0 ? ' ' + numberToSpanishWords(rest) : ''}`;
  }

  return n.toString();
}

const formatCurrency = (amount: number, currency: string = 'UYU') => {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ViewInvoicePage({ params }: { params: { id: string } }) {
  const invoiceId = params.id;
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<InvoiceType | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [ajusteText, setAjusteText] = useState<string | null>(null);
  const [templateSettings, setTemplateSettings] = useState<InvoiceTemplateSettings | null>(null);

  const [newPayment, setNewPayment] = useState<Omit<Payment, 'id' | 'transactionProofUrl'>>({
    paymentDate: new Date().toISOString(),
    amount: 0,
    method: 'Transferencia',
    notes: '',
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const fetchData = useCallback(async () => {
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
        const linkedBudget = allBudgets.find(b => b.invoiceId === fetchedInvoice.id || b.id === fetchedInvoice.id);
        if (linkedBudget?.eventoFecha) {
            const yearCreated = new Date(linkedBudget.timestamp).getFullYear();
            const yearEvent = new Date(linkedBudget.eventoFecha).getFullYear();
            if (yearEvent > yearCreated) {
                setAjusteText(`INCLUYE AJUSTE 15% ANUAL (${yearCreated} A ${yearEvent})`);
            }
        }
      }
      setTemplateSettings(tmplSettings);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [invoiceId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      if (result.success) {
        toast({ title: "Pago Registrado" });
        await fetchData();
        setPaymentProofFile(null);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingPayment(false);
    }
  };
  
  const totalPaid = useMemo(() => invoice?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0, [invoice]);
  const amountDue = invoice ? invoice.totalAmount - totalPaid : 0;
  const lastPayment = useMemo(() => invoice?.payments && invoice.payments.length > 0 ? invoice.payments[invoice.payments.length - 1] : null, [invoice]);

  if (isLoadingInvoice || !invoice || !templateSettings) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8 print:p-0 print:m-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <Link href="/invoices" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Imprimir Todo</Button>
          <Link href={`/invoices/${invoice.id}/edit`} passHref><Button variant="secondary"><Edit className="w-4 h-4 mr-2" />Editar</Button></Link>
        </div>
      </div>

      <div className="space-y-12 print:space-y-8">
        {/* DOCUMENTO 1: ESTADO DE CUENTA */}
        <div className="bg-white p-8 print:p-6 rounded-lg shadow-sm border print:border-none print:shadow-none min-h-[600px] flex flex-col font-sans">
            <div className="flex justify-between items-start mb-8">
                <div className="space-y-1 text-sm">
                    <p className="font-semibold text-lg">Tec. Alexander Knuth</p>
                    <p>Salto, Uruguay</p>
                    <p>akproduccionessalto@gmail.com</p>
                </div>
                <div className="text-right">
                    <h1 className="text-3xl font-bold mb-2 tracking-tighter">Estado de Cuenta</h1>
                    {templateSettings.logoUrl && (
                        <div className="relative w-32 h-20 ml-auto">
                            <Image src={templateSettings.logoUrl} alt="Logo" layout="fill" className="object-contain" />
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-md mb-8 border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground uppercase text-xs font-bold mb-1">Cliente</p>
                        <p className="font-bold text-base">{invoice.customer.name || invoice.customer.companyName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground uppercase text-xs font-bold mb-1">Ajuste Aplicado</p>
                        <p className="font-semibold text-amber-700">{ajusteText || 'Tarifa Base'}</p>
                        <p className="text-xs text-muted-foreground">Factura N° {invoice.invoiceNumber}</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 border-y border-gray-300">
                        <tr>
                            <th className="py-2 px-3 text-left">Fecha / Concepto</th>
                            <th className="py-2 px-3 text-right">Cargo</th>
                            <th className="py-2 px-3 text-right">Entrega</th>
                            <th className="py-2 px-3 text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <tr>
                            <td className="py-3 px-3">
                                <p className="font-bold">SERVICIOS CONTRATADOS</p>
                                <p className="text-xs text-muted-foreground">Monto Total Acordado</p>
                            </td>
                            <td className="py-3 px-3 text-right font-medium">{formatCurrency(invoice.totalAmount)}</td>
                            <td className="py-3 px-3 text-right">-</td>
                            <td className="py-3 px-3 text-right font-bold">{formatCurrency(invoice.totalAmount)}</td>
                        </tr>
                        {invoice.payments?.map((p, idx) => {
                            const balanceAfter = invoice.totalAmount - (invoice.payments?.slice(0, idx + 1).reduce((s, pay) => s + pay.amount, 0) || 0);
                            return (
                                <tr key={p.id}>
                                    <td className="py-3 px-3">
                                        <p className="font-medium">{p.notes || `Entrega ${idx + 1}`}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString('es-ES')}</p>
                                    </td>
                                    <td className="py-3 px-3 text-right">-</td>
                                    <td className="py-3 px-3 text-right text-green-600 font-medium">-{formatCurrency(p.amount)}</td>
                                    <td className="py-3 px-3 text-right text-gray-500">{formatCurrency(balanceAfter)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 border-t-2 border-primary pt-4 flex justify-end">
                <div className="w-full max-w-[280px] space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TOTAL EVENTO:</span>
                        <span className="font-bold">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TOTAL PAGADO:</span>
                        <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-lg bg-primary/5 p-2 rounded">
                        <span className="font-bold text-primary">SALDO PENDIENTE:</span>
                        <span className="font-bold text-primary">{formatCurrency(amountDue)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* DOCUMENTO 2: RECIBO INDIVIDUAL */}
        {lastPayment && (
            <div className="bg-white p-6 print:p-4 rounded-lg shadow-sm border-2 border-dashed border-gray-400 print:shadow-none font-sans relative overflow-hidden print:break-before-page">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        {templateSettings.logoUrl && (
                            <div className="relative w-20 h-20">
                                <Image src={templateSettings.logoUrl} alt="Logo" layout="fill" className="object-contain" />
                            </div>
                        )}
                        <div className="text-[10pt] leading-tight">
                            <p className="font-bold text-lg">AK Producciones</p>
                            <p>Gaboto 3390, Salto</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold tracking-widest text-gray-400">RECIBO</h2>
                        <div className="mt-2 border-2 border-black p-2 rounded-sm inline-block">
                            <span className="text-xl font-bold">$ {new Intl.NumberFormat('es-UY').format(lastPayment.amount)}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 text-sm uppercase italic">
                    <div className="flex items-end gap-2">
                        <span className="not-italic font-bold whitespace-nowrap">RECIBIMOS DE:</span>
                        <span className="flex-grow border-b border-black border-dotted pb-1 font-bold not-italic">
                            {invoice.customer.name || invoice.customer.companyName}
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="not-italic font-bold whitespace-nowrap">LA SUMA DE:</span>
                        <span className="flex-grow border-b border-black border-dotted pb-1 font-bold not-italic">
                            {numberToSpanishWords(lastPayment.amount)} PESOS URUGUAYOS
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="not-italic font-bold whitespace-nowrap">CONCEPTO:</span>
                        <span className="flex-grow border-b border-black border-dotted pb-1">
                            {lastPayment.notes || 'PAGO EVENTO'} ({invoice.invoiceNumber})
                        </span>
                    </div>
                </div>

                <div className="mt-10 flex justify-between items-end">
                    <div className="text-center">
                        <div className="border border-black p-2 w-48 mb-1">
                            <div className="flex justify-between text-[8pt]"><span>TOTAL:</span> <span>{formatCurrency(invoice.totalAmount)}</span></div>
                            <div className="flex justify-between text-[8pt] font-bold"><span>SALDO:</span> <span>{formatCurrency(amountDue)}</span></div>
                        </div>
                        <p className="text-xs">{new Date(lastPayment.paymentDate).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="w-48 border-t border-black text-center pt-1 uppercase font-bold">Firma</div>
                </div>
            </div>
        )}
      </div>

      {invoice.status !== 'Paid' && (
        <Card className="print:hidden border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5"><CardTitle>Registrar Pago</CardTitle></CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Monto</Label><Input type="number" value={newPayment.amount || ''} onChange={e => setNewPayment(p => ({...p, amount: parseFloat(e.target.value)}))} required /></div>
                    <div className="space-y-1"><Label>Fecha</Label><DatePickerDemo selectedDate={new Date(newPayment.paymentDate)} onDateChange={d => d && setNewPayment(p => ({...p, paymentDate: d.toISOString()}))} /></div>
                </div>
                <Button type="submit" className="w-full" disabled={isAddingPayment}>{isAddingPayment ? <Loader2 className="animate-spin mr-2"/> : null}Registrar Pago</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        @media print {
          header, footer, button, .sidebar, .no-print, .notifications-hub { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          @page { size: A4; margin: 1cm; }
        }
      `}</style>
    </div>
  );
}