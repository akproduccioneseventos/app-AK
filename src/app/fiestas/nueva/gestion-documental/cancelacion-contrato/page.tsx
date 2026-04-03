
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';
import type { CompanyInfo } from '@/types/settings';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import { getCompanyInfo, getInvoiceTemplateSettings } from '@/app/actions/settings';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return '____________';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "____________";
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return "Fecha inválida";
  }
};

const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

function CancelacionContratoContent({ fiestaId }: { fiestaId: string | null }) {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [totalPagado, setTotalPagado] = useState(0);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("Falta el ID del evento.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, companyData, settingsData] = await Promise.all([
        getFiestaById(fiestaId),
        getCompanyInfo(),
        getInvoiceTemplateSettings()
      ]);
      
      if (!fiestaData) throw new Error("Evento no encontrado.");
      if (!fiestaData.configuracion.clienteId || !fiestaData.presupuestoId) {
        setError("El evento debe tener un cliente y un presupuesto asignados para generar la cancelación.");
        setIsLoading(false);
        return;
      }
      setFiesta(fiestaData);
      setCompanyInfo(companyData);
      setLogoUrl(settingsData.logoUrl ?? null);

      const [clienteData, presupuestoData] = await Promise.all([
        getCustomerById(fiestaData.configuracion.clienteId),
        getPresupuestoById(fiestaData.presupuestoId)
      ]);
      
      setCliente(clienteData);
      setPresupuesto(presupuestoData);

      if (fiestaData.invoiceIds && fiestaData.invoiceIds.length > 0) {
        const invoices = await Promise.all(fiestaData.invoiceIds.map(id => getInvoiceById(id)));
        const total = invoices.reduce((sum, inv) => {
          return sum + (inv?.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0);
        }, 0);
        setTotalPagado(total);
      }

    } catch (err: any) {
      setError("No se pudieron cargar todos los datos para generar el documento.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => window.print();

  const handleShare = async () => {
    const shareData = {
      title: `Constancia de Cancelación - ${fiesta?.configuracion.nombreEvento}`,
      text: `Documento de cancelación de contrato para el evento.`,
      url: window.location.href,
    };
     try {
      if (navigator.share && navigator.canShare(shareData)) { await navigator.share(shareData); } 
      else { throw new Error('Share API not supported'); }
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      toast({ title: "Enlace Copiado", description: "El enlace ha sido copiado a tu portapapeles." });
    }
  };

  const presupuestoTotal = presupuesto?.totalConDescuento ?? presupuesto?.costoTotalEstimado ?? 0;
  const multa = presupuestoTotal * 0.30;

  if (isLoading) {
    return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Error al Generar Documento</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`}>
            <Button variant="outline" className="mt-4">Volver</Button>
          </Link>
      </div>
    );
  }
  
  if (!fiesta || !cliente || !presupuesto || !companyInfo) {
    return <div className="flex items-center justify-center h-screen"><p>Faltan datos para continuar.</p></div>;
  }

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
            <h1 className="text-sm font-black tracking-tight text-slate-900">Constancia de Cancelación</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {fiesta.configuracion.nombreEvento}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1.5" /> Compartir
          </Button>
          <Button onClick={handlePrint} size="sm" className="bg-primary hover:bg-primary/90 text-white">
            <PrinterIcon className="w-4 h-4 mr-1.5" /> Descargar PDF
          </Button>
        </div>
      </div>

      {/* ─── DOCUMENT ─── */}
      <div className="max-w-2xl mx-auto mt-6 print:mt-0 print:max-w-none">
        <div className="bg-white shadow-2xl print:shadow-none rounded-3xl print:rounded-none overflow-hidden">

          {/* TOP ACCENT BAR */}
          <div className="h-2 bg-gradient-to-r from-[#0f172a] to-[#ef4444]" />

          {/* HEADER */}
          <div className="px-8 pt-8 pb-6 print:px-6 print:pt-6 print:pb-4">
            <div className="flex items-start justify-between gap-4">
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
              <div className="text-right shrink-0">
                <div className="inline-block bg-[#0f172a] text-white px-3 py-1 rounded-lg mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest">CANCELACIÓN</p>
                </div>
                <p className="text-[10px] text-slate-400">Emitido: {today}</p>
              </div>
            </div>
          </div>

          {/* TITLE */}
          <div className="px-8 print:px-6 pb-4 text-center">
            <h1 className="text-lg print:text-sm font-black uppercase tracking-tight text-slate-900 border-b-2 border-[#ef4444] pb-3 inline-block">
              Constancia de Cancelación de Contrato de Servicios
            </h1>
          </div>

          {/* DOCUMENT BODY */}
          <div className="px-8 print:px-6 py-4 print:py-3 space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className="bg-slate-50 print:bg-gray-50 rounded-2xl print:rounded-lg p-3 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Presupuesto Total</p>
                <p className="font-black text-slate-900 text-sm print:text-xs">{formatCurrency(presupuestoTotal)}</p>
              </div>
              <div className="bg-amber-50 print:bg-yellow-50 rounded-2xl print:rounded-lg p-3 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 mb-1">Multa 30% (Contractual)</p>
                <p className="font-black text-amber-700 text-sm print:text-xs">{formatCurrency(multa)}</p>
              </div>
              <div className="bg-emerald-50 print:bg-green-50 rounded-2xl print:rounded-lg p-3 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-1">Ya Abonado</p>
                <p className="font-black text-emerald-700 text-sm print:text-xs">{formatCurrency(totalPagado)}</p>
              </div>
            </div>

            {/* Legal text */}
            <div className="prose prose-sm print:prose-xs max-w-none text-justify font-serif text-slate-800 print:text-black leading-relaxed">
              <p>
                En la ciudad de Salto, a los <strong>{today}</strong>, se deja constancia que, a solicitud del/la
                Sr./Sra. <strong>{cliente.name || cliente.companyName}</strong>, cédula de identidad N°{' '}
                <strong>{cliente.taxId || '_______________________'}</strong>, quien contratara los servicios de{' '}
                <strong>{companyInfo.companyName}</strong>, representada por su titular el Sr. Alexander Knuth, para la
                organización de un evento previsto para el día{' '}
                <strong>{formatDate(fiesta.configuracion.fechaEvento)}</strong>, según contrato firmado con fecha{' '}
                <strong>{formatDate(presupuesto.timestamp)}</strong>, se procede a la cancelación del mencionado
                contrato por parte del cliente.
              </p>

              <p>
                De acuerdo con la cláusula cuarta del contrato suscrito, en caso de cancelación por parte del cliente,
                se establece una multa del 30% del presupuesto total como penalización. El presupuesto acordado fue de{' '}
                <strong>{formatCurrency(presupuestoTotal)}</strong>, por lo tanto, la multa correspondiente asciende a{' '}
                <strong>{formatCurrency(multa)}</strong>.
              </p>

              <p>
                No obstante lo anterior, <strong>{companyInfo.companyName}</strong>, en un gesto comercial de común
                acuerdo entre las partes, acepta reducir el costo de la multa, estableciendo como monto total y
                definitivo de la penalización la suma ya abonada por el cliente, correspondiente a{' '}
                <strong>{formatCurrency(totalPagado)}</strong>, monto que el/la Sr./Sra.{' '}
                <strong>{cliente.name}</strong> declara haber abonado en su totalidad.
              </p>

              <p>
                En consecuencia, no existe saldo pendiente ni importe alguno a devolver entre las partes, dándose por
                totalmente canceladas y saldadas las obligaciones emergentes del contrato mencionado. Ambas partes
                manifiestan su conformidad con lo expuesto, firmando la presente constancia en dos ejemplares del mismo
                tenor, en la ciudad de Salto, en la fecha indicada ut-supra.
              </p>
            </div>
          </div>

          {/* SIGNATURE LINES */}
          <div className="px-8 print:px-6 pt-8 print:pt-6 pb-10 print:pb-8 grid grid-cols-2 gap-16">
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
              {cliente.taxId && <p className="text-xs text-slate-500 font-sans">C.I.: {cliente.taxId}</p>}
              <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest mt-1">Por el Cliente</p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mx-8 print:mx-6 border-t border-slate-100 pt-3 pb-5 print:pt-2 print:pb-4">
            <p className="text-[9px] text-slate-400 text-center font-medium">
              {companyInfo.companyName}
              {companyInfo.companyContact ? ` · ${companyInfo.companyContact}` : ''}
              {' · '}Generado el {today}
            </p>
          </div>

          {/* BOTTOM ACCENT BAR */}
          <div className="h-1.5 bg-gradient-to-r from-[#ef4444] to-[#0f172a]" />
        </div>
      </div>
    </div>
  );
}

export default function CancelacionContratoPage() {
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
            <CancelacionContratoContent fiestaId={fiestaId} />
        </Suspense>
    );
}
