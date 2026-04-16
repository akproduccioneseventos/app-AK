
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
import { updateContratoFiestaActual } from '@/app/actions/fiesta-actual';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import { getCompanyInfo, getInvoiceTemplateSettings, getContractTemplates } from '@/app/actions/settings';

/** Allow only http/https/relative URLs to prevent javascript: or data: URI injection */
const sanitizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    // Parse and reconstruct to break taint chain – prevents javascript:/data: injection
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    // Relative path: only allow /path (not //host or other forms)
    if (/^\/[^/]/.test(url) || url === '/') return url;
    return null;
  }
};

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
  const [contractText, setContractText] = useState('');

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
      const [fiestaData, companyData, settingsData, templates] = await Promise.all([
        getFiestaById(fiestaId),
        getCompanyInfo(),
        getInvoiceTemplateSettings(),
        getContractTemplates(),
      ]);
      
      if (!fiestaData) throw new Error("Evento no encontrado.");
      if (!fiestaData.configuracion.clienteId || !fiestaData.presupuestoId) {
        setError("El evento debe tener un cliente y un presupuesto asignados para generar la cancelación.");
        setIsLoading(false);
        return;
      }
      setFiesta(fiestaData);
      setCompanyInfo(companyData);
      setLogoUrl(sanitizeImageUrl(settingsData.logoUrl));

      const [clienteData, presupuestoData] = await Promise.all([
        getCustomerById(fiestaData.configuracion.clienteId),
        getPresupuestoById(fiestaData.presupuestoId)
      ]);
      
      setCliente(clienteData);
      setPresupuesto(presupuestoData);

      let total = 0;
      if (fiestaData.invoiceIds && fiestaData.invoiceIds.length > 0) {
        const invoices = await Promise.all(fiestaData.invoiceIds.map(id => getInvoiceById(id)));
        total = invoices.reduce((sum, inv) => {
          return sum + (inv?.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0);
        }, 0);
        setTotalPagado(total);
      }

      const presupuestoTotal = presupuestoData?.totalConDescuento ?? presupuestoData?.costoTotalEstimado ?? 0;
      const cancelacionTemplate = templates.find(t => t.type === 'cancelacion') || templates[0];
      let generated = cancelacionTemplate?.template || '';
      const replacements: Record<string, string> = {
        '{{FECHA_HOY}}': today,
        '{{EMPRESA_NOMBRE}}': companyData.companyName,
        '{{EMPRESA_RUT}}': companyData.companyTaxId,
        '{{EMPRESA_DIRECCION}}': companyData.companyAddress,
        '{{EMPRESA_EMAIL}}': companyData.companyContact,
        '{{CLIENTE_NOMBRE}}': clienteData?.name || clienteData?.companyName || '________________________',
        '{{CLIENTE_DIRECCION}}': clienteData?.address || '________________________',
        '{{CLIENTE_CI}}': clienteData?.taxId || '_______________________',
        '{{CLIENTE_TELEFONO}}': clienteData?.phone || '_______________________',
        '{{EVENTO_FECHA}}': formatDate(fiestaData.configuracion.fechaEvento),
        '{{EVENTO_SALON}}': fiestaData.configuracion.nombreLugar || '____________',
        '{{PRESUPUESTO_TOTAL}}': formatCurrency(presupuestoTotal),
        '{{SENIA}}': formatCurrency(total),
        '{{MOTIVO_CANCELACION}}': 'Cancelación solicitada por el cliente',
        '{{NUEVA_FECHA}}': '________________________',
        '{{PENALIZACION_PORCENTAJE}}': '30%',
        '{{NOMBRE_SALON}}': fiestaData.configuracion.nombreLugar || '____________',
      };
      Object.entries(replacements).forEach(([key, val]) => {
        generated = generated.replaceAll(key, val);
      });
      setContractText(generated);
      await updateContratoFiestaActual(fiestaId, generated, 'cancelacion', cancelacionTemplate?.id || 'default-cancelacion');

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
            <div className="prose prose-sm print:prose-xs max-w-none text-justify font-serif text-slate-800 print:text-black leading-relaxed whitespace-pre-wrap">
              {contractText}
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
