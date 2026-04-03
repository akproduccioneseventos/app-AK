'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Loader2, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice, Payment } from '@/types/invoice';
import type { CompanyInfo } from '@/types/settings';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import { getCompanyInfo, getInvoiceTemplateSettings, getContractTemplate } from '@/app/actions/settings';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$ -';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
};

const formatDateLong = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Transferencia: 'Transferencia',
  Efectivo: 'Efectivo',
  Tarjeta: 'Tarjeta',
  Otro: 'Otro',
};

interface PageData {
  fiesta: FiestaEnPlanificacion;
  cliente: Customer;
  presupuesto: Presupuesto | null;
  invoices: Invoice[];
  companyInfo: CompanyInfo;
  logoUrl: string | null;
  contractText: string | null;
}

function ReciboPagoContent({ fiestaId }: { fiestaId: string | null }) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const includeContrato = searchParams.get('includeContrato') === 'true';

  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError('Falta el ID del evento.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, companyData, settingsData] = await Promise.all([
        getFiestaById(fiestaId),
        getCompanyInfo(),
        getInvoiceTemplateSettings(),
      ]);

      if (!fiestaData) throw new Error('Evento no encontrado.');
      if (!fiestaData.configuracion.clienteId) {
        setError('El evento debe tener un cliente asignado para generar el recibo.');
        setIsLoading(false);
        return;
      }

      const [clienteData, presupuestoData] = await Promise.all([
        getCustomerById(fiestaData.configuracion.clienteId),
        fiestaData.presupuestoId ? getPresupuestoById(fiestaData.presupuestoId) : Promise.resolve(null),
      ]);

      if (!clienteData) throw new Error('Cliente no encontrado.');

      const loadedInvoices: Invoice[] = [];
      if (fiestaData.invoiceIds && fiestaData.invoiceIds.length > 0) {
        const results = await Promise.all(fiestaData.invoiceIds.map((id) => getInvoiceById(id)));
        results.forEach((inv) => { if (inv) loadedInvoices.push(inv); });
      }

      let contractText: string | null = null;
      if (includeContrato) {
        const masterTemplate = await getContractTemplate();
        let text = fiestaData.contratoServicioTexto || masterTemplate;
        if (!fiestaData.contratoServicioTexto) {
          const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          let seniaValue = '__________________________';
          if (loadedInvoices.length > 0) {
            const firstPayment = loadedInvoices[0]?.payments?.[0];
            if (firstPayment?.amount) {
              seniaValue = formatCurrency(firstPayment.amount);
            }
          }
          const replacements: Record<string, string> = {
            '{{FECHA_HOY}}': today,
            '{{EMPRESA_NOMBRE}}': companyData.companyName,
            '{{EMPRESA_RUT}}': companyData.companyTaxId || '',
            '{{EMPRESA_DIRECCION}}': companyData.companyAddress || '',
            '{{EMPRESA_EMAIL}}': companyData.companyContact || '',
            '{{CLIENTE_NOMBRE}}': clienteData?.name || clienteData?.companyName || '________________________',
            '{{CLIENTE_DIRECCION}}': clienteData?.address || '________________________',
            '{{CLIENTE_CI}}': clienteData?.taxId || '_______________________',
            '{{CLIENTE_TELEFONO}}': clienteData?.phone || '_______________________',
            '{{EVENTO_FECHA}}': formatDate(fiestaData.configuracion.fechaEvento),
            '{{EVENTO_SALON}}': fiestaData.configuracion.nombreLugar || '____________',
            '{{PRESUPUESTO_TOTAL}}': formatCurrency(presupuestoData?.totalConDescuento ?? presupuestoData?.costoTotalEstimado),
            '{{SENIA}}': seniaValue,
          };
          Object.entries(replacements).forEach(([key, val]) => {
            text = text.replaceAll(key, val);
          });
        }
        contractText = text;
      }

      setData({
        fiesta: fiestaData,
        cliente: clienteData,
        presupuesto: presupuestoData,
        invoices: loadedInvoices,
        companyInfo: companyData,
        logoUrl: settingsData.logoUrl || null,
        contractText,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError('No se pudieron cargar todos los datos para generar el recibo.');
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, includeContrato, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const shareData = {
      title: `Recibo de Pago – ${data?.fiesta?.configuracion?.nombreEvento ?? ''}`,
      text: 'Recibo de pago generado por AK Producciones Eventos.',
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('Share API not supported');
      }
    } catch {
      navigator.clipboard.writeText(shareData.url);
      toast({ title: 'Enlace Copiado', description: 'El enlace fue copiado al portapapeles.' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white">
        <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Error al Generar Recibo</h1>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
          </Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Faltan datos para continuar.</p>
      </div>
    );
  }

  const { fiesta, cliente, presupuesto, invoices, companyInfo, logoUrl, contractText } = data;

  // Aggregate all payments from all invoices, sorted by date
  const allPayments: (Payment & { invoiceNumber: string })[] = [];
  invoices.forEach((inv) => {
    (inv.payments || []).forEach((p) => {
      allPayments.push({ ...p, invoiceNumber: inv.invoiceNumber });
    });
  });
  allPayments.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());

  const costoTotal = presupuesto?.totalConDescuento ?? presupuesto?.costoTotalEstimado ?? 0;
  const totalPagado = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const saldoPendiente = costoTotal - totalPagado;
  const lastPayment = allPayments.length > 0 ? allPayments[allPayments.length - 1] : null;

  const receiptNumber = invoices[0]?.invoiceNumber
    ? `REC-${invoices[0].invoiceNumber}`
    : `REC-${fiestaId?.slice(-6).toUpperCase() ?? '000000'}`;

  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  const isPaid = saldoPendiente <= 0;

  return (
    <div className="bg-slate-100 print:bg-white min-h-screen pb-20 print:pb-0">
      {/* TOOLBAR – hidden on print */}
      <div className="print:hidden sticky top-0 z-50 flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 bg-white shadow-sm border-b">
        <div className="flex items-center gap-3">
          <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900">Recibo de Pago</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {fiesta.configuracion.nombreEvento}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/fiestas/nueva/gestion-documental/recibo-pago?fiestaId=${fiestaId}${includeContrato ? '' : '&includeContrato=true'}`}
          >
            <Button
              variant={includeContrato ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'text-[10px] font-black uppercase tracking-widest rounded-xl',
                includeContrato && 'bg-slate-900 text-white'
              )}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              {includeContrato ? 'Contrato Adjunto ✓' : 'Adjuntar Contrato'}
            </Button>
          </Link>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1.5" /> Compartir
          </Button>
          <Button onClick={handlePrint} size="sm" className="bg-primary hover:bg-primary/90 text-white">
            <PrinterIcon className="w-4 h-4 mr-1.5" /> Descargar PDF
          </Button>
        </div>
      </div>

      {/* ─── RECEIPT DOCUMENT ─── */}
      <div className="max-w-2xl mx-auto mt-6 print:mt-0 print:max-w-none">
        <div className="bg-white shadow-2xl print:shadow-none rounded-3xl print:rounded-none overflow-hidden">

          {/* TOP ACCENT BAR */}
          <div className="h-2 bg-gradient-to-r from-[#ef4444] to-[#0f172a]" />

          {/* HEADER */}
          <div className="px-8 pt-8 pb-6 print:px-6 print:pt-6 print:pb-4">
            <div className="flex items-start justify-between gap-4">
              {/* Logo / Brand */}
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={companyInfo.companyName}
                    className="h-14 print:h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="w-14 h-14 print:w-10 print:h-10 rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#0f172a] flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-xl print:text-base">AK</span>
                  </div>
                )}
                <div>
                  <p className="font-black text-[#0f172a] text-base print:text-sm leading-tight">
                    {companyInfo.companyName}
                  </p>
                  {companyInfo.companyTaxId && (
                    <p className="text-[10px] text-slate-400 font-mono">RUT: {companyInfo.companyTaxId}</p>
                  )}
                  {companyInfo.companyAddress && (
                    <p className="text-[10px] text-slate-400">{companyInfo.companyAddress}</p>
                  )}
                </div>
              </div>

              {/* Receipt metadata */}
              <div className="text-right shrink-0">
                <div className="inline-block bg-[#ef4444] text-white px-3 py-1 rounded-lg mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest">RECIBO DE PAGO</p>
                </div>
                <p className="font-black text-slate-900 text-sm">{receiptNumber}</p>
                <p className="text-[10px] text-slate-400">Emitido: {today}</p>
                {isPaid ? (
                  <Badge className="mt-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> SALDADO
                  </Badge>
                ) : (
                  <Badge className="mt-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest border-0">
                    <Clock className="w-3 h-3 mr-1" /> EN PROCESO
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="mx-8 print:mx-6 border-t border-slate-100" />

          {/* CLIENT + EVENT INFO */}
          <div className="px-8 py-5 print:px-6 print:py-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 print:bg-gray-50 rounded-2xl print:rounded-lg p-4 print:p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Cliente</p>
              <p className="font-black text-slate-900 text-sm print:text-xs leading-tight">
                {cliente.name || cliente.companyName}
              </p>
              {cliente.taxId && (
                <p className="text-xs print:text-[9pt] text-slate-500 mt-0.5">C.I.: {cliente.taxId}</p>
              )}
              {cliente.address && (
                <p className="text-xs print:text-[9pt] text-slate-500 mt-0.5">{cliente.address}</p>
              )}
              {cliente.phone && (
                <p className="text-xs print:text-[9pt] text-slate-500 mt-0.5">{cliente.phone}</p>
              )}
            </div>

            <div className="bg-slate-50 print:bg-gray-50 rounded-2xl print:rounded-lg p-4 print:p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Evento</p>
              <p className="font-black text-slate-900 text-sm print:text-xs leading-tight">
                {fiesta.configuracion.nombreEvento}
              </p>
              {fiesta.configuracion.fechaEvento && (
                <p className="text-xs print:text-[9pt] text-slate-500 mt-0.5">
                  Fecha: {formatDateLong(fiesta.configuracion.fechaEvento)}
                </p>
              )}
              {fiesta.configuracion.nombreLugar && (
                <p className="text-xs print:text-[9pt] text-slate-500 mt-0.5">
                  Lugar: {fiesta.configuracion.nombreLugar}
                </p>
              )}
            </div>
          </div>

          {/* PAYMENT HISTORY TABLE */}
          {allPayments.length > 0 && (
            <div className="px-8 print:px-6 pb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Historial de Pagos
              </p>
              <div className="rounded-2xl print:rounded-lg overflow-hidden border border-slate-100">
                <table className="w-full text-sm print:text-xs">
                  <thead>
                    <tr className="bg-[#0f172a] text-white">
                      <th className="text-left px-4 print:px-3 py-2.5 print:py-2 text-[9px] font-black uppercase tracking-widest">
                        #
                      </th>
                      <th className="text-left px-4 print:px-3 py-2.5 print:py-2 text-[9px] font-black uppercase tracking-widest">
                        Fecha
                      </th>
                      <th className="text-left px-4 print:px-3 py-2.5 print:py-2 text-[9px] font-black uppercase tracking-widest">
                        Método
                      </th>
                      {allPayments.some((p) => p.notes) && (
                        <th className="text-left px-4 print:px-3 py-2.5 print:py-2 text-[9px] font-black uppercase tracking-widest hidden sm:table-cell print:table-cell">
                          Nota
                        </th>
                      )}
                      <th className="text-right px-4 print:px-3 py-2.5 print:py-2 text-[9px] font-black uppercase tracking-widest">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.map((payment, idx) => (
                      <tr
                        key={payment.id}
                        className={cn(
                          'border-t border-slate-50',
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 print:bg-gray-50'
                        )}
                      >
                        <td className="px-4 print:px-3 py-3 print:py-2 text-slate-400 font-mono text-[10px]">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 print:px-3 py-3 print:py-2 text-slate-700 font-medium">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-4 print:px-3 py-3 print:py-2">
                          <span className="inline-block bg-slate-100 print:bg-gray-100 text-slate-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {PAYMENT_METHOD_LABELS[payment.method ?? ''] ?? payment.method ?? '—'}
                          </span>
                        </td>
                        {allPayments.some((p) => p.notes) && (
                          <td className="px-4 print:px-3 py-3 print:py-2 text-slate-400 text-xs hidden sm:table-cell print:table-cell">
                            {payment.notes ?? '—'}
                          </td>
                        )}
                        <td className="px-4 print:px-3 py-3 print:py-2 text-right font-black text-slate-900">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {allPayments.length === 0 && (
            <div className="px-8 print:px-6 pb-4">
              <div className="bg-amber-50 print:bg-yellow-50 border border-amber-100 rounded-2xl print:rounded-lg p-4 text-center">
                <p className="text-sm text-amber-700 font-medium">
                  No se han registrado pagos para este evento.
                </p>
              </div>
            </div>
          )}

          {/* FINANCIAL SUMMARY */}
          <div className="px-8 print:px-6 pb-8 print:pb-6">
            <div className="rounded-2xl print:rounded-lg overflow-hidden border border-slate-100">
              <div className="flex justify-between items-center px-5 print:px-4 py-3 print:py-2 bg-slate-50 print:bg-gray-50 border-b border-slate-100">
                <span className="text-xs print:text-[9pt] font-bold text-slate-500 uppercase tracking-widest">
                  Costo Total del Evento
                </span>
                <span className="font-black text-slate-800 text-sm print:text-xs">
                  {formatCurrency(costoTotal)}
                </span>
              </div>
              {lastPayment && (
                <div className="flex justify-between items-center px-5 print:px-4 py-3 print:py-2 bg-blue-50 print:bg-blue-50 border-b border-blue-100">
                  <span className="text-xs print:text-[9pt] font-bold text-blue-600 uppercase tracking-widest">
                    Último Pago ({formatDate(lastPayment.paymentDate)})
                  </span>
                  <span className="font-black text-blue-700 text-sm print:text-xs">
                    {formatCurrency(lastPayment.amount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center px-5 print:px-4 py-3 print:py-2 bg-emerald-50 print:bg-green-50 border-b border-emerald-100">
                <span className="text-xs print:text-[9pt] font-bold text-emerald-600 uppercase tracking-widest">
                  Total Abonado
                </span>
                <span className="font-black text-emerald-700 text-sm print:text-xs">
                  {formatCurrency(totalPagado)}
                </span>
              </div>
              <div
                className={cn(
                  'flex justify-between items-center px-5 print:px-4 py-4 print:py-3',
                  isPaid ? 'bg-emerald-600' : 'bg-[#ef4444]'
                )}
              >
                <span className="text-sm print:text-xs font-black text-white uppercase tracking-widest">
                  {isPaid ? '✓ TOTALMENTE SALDADO' : 'SALDO PENDIENTE'}
                </span>
                <span className="font-black text-white text-xl print:text-base">
                  {isPaid ? formatCurrency(0) : formatCurrency(saldoPendiente)}
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mx-8 print:mx-6 border-t border-slate-100 pt-4 pb-6 print:pt-3 print:pb-4">
            <p className="text-[9px] text-slate-400 text-center font-medium">
              {companyInfo.companyName}
              {companyInfo.companyContact ? ` · ${companyInfo.companyContact}` : ''}
              {' · '}Generado el {today}
            </p>
            <p className="text-[8px] text-slate-300 text-center mt-0.5">
              Este documento es un comprobante de pago. Conserve este recibo.
            </p>
          </div>

          {/* BOTTOM ACCENT BAR */}
          <div className="h-1.5 bg-gradient-to-r from-[#0f172a] to-[#ef4444]" />
        </div>

        {/* ── CONTRATO ADJUNTO (página 2+) ── */}
        {includeContrato && contractText && (
          <>
            {/* Print page break */}
            <div className="print:break-before-page" />

            <div className="mt-8 print:mt-0 bg-white shadow-2xl print:shadow-none rounded-3xl print:rounded-none overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#ef4444] to-[#0f172a]" />

              {/* Contract Header */}
              <div className="px-8 pt-8 pb-6 print:px-6 print:pt-6 print:pb-4 text-center">
                {logoUrl ? (
                  <div className="flex justify-center mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt={companyInfo.companyName} className="h-16 print:h-12 w-auto object-contain" />
                  </div>
                ) : (
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 print:w-12 print:h-12 rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#0f172a] flex items-center justify-center">
                      <span className="text-white font-black text-2xl print:text-xl">AK</span>
                    </div>
                  </div>
                )}
                <h1 className="text-xl print:text-base font-black font-headline uppercase tracking-tight text-slate-900">
                  Contrato de Prestación de Servicios
                </h1>
                <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase mt-1">
                  Documento de Validez Legal — Anexo al Recibo {receiptNumber}
                </p>
              </div>

              <div className="mx-8 print:mx-6 border-t border-slate-100" />

              <div className="px-10 print:px-8 py-6 print:py-4 prose prose-sm print:prose-xs max-w-none text-justify whitespace-pre-wrap font-serif text-slate-800 print:text-black leading-relaxed">
                {contractText}
              </div>

              {/* Signature Lines */}
              <div className="px-10 print:px-8 pb-10 print:pb-8 mt-10 print:mt-6 grid grid-cols-2 gap-16">
                <div className="border-t-2 border-slate-300 pt-4 text-center">
                  <p className="font-black text-sm uppercase tracking-tighter text-slate-900">
                    Tec. Alexander Knuth
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest mt-1">
                    Por {companyInfo.companyName}
                  </p>
                </div>
                <div className="border-t-2 border-slate-300 pt-4 text-center">
                  <p className="font-black text-sm uppercase tracking-tighter text-slate-900">
                    {cliente.name || '___________________'}
                  </p>
                  {cliente.taxId && (
                    <p className="text-xs text-slate-500 font-sans">C.I.: {cliente.taxId}</p>
                  )}
                  <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest mt-1">
                    Por el Cliente
                  </p>
                </div>
              </div>

              <div className="h-1.5 bg-gradient-to-r from-[#0f172a] to-[#ef4444]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReciboPagoPageWrapper() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  return <ReciboPagoContent fiestaId={fiestaId} />;
}

export default function ReciboPagoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }
    >
      <ReciboPagoPageWrapper />
    </Suspense>
  );
}
