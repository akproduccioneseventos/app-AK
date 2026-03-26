
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, FileX } from 'lucide-react';
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
import { WatermarkedImage } from '@/components/watermarked-image';

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
      setLogoUrl(settingsData.logoUrl);

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
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`}>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-4">
            {logoUrl && (
                <div className="w-full h-24 print:h-20 mb-4 relative">
                    <WatermarkedImage src={logoUrl} alt="Marca de agua" containerClassName='w-full h-full'/>
                </div>
            )}
            <h1 className="text-xl font-bold text-center">CONSTANCIA DE CANCELACIÓN DE CONTRATO DE SERVICIOS</h1>
        </header>
        
        <div className="prose prose-sm print:prose-xs max-w-none text-justify">
          <p>En la ciudad de Salto, a los {today}, se deja constancia que, a solicitud del/la Sr./Sra. <strong>{cliente.name || cliente.companyName}</strong>, cédula de identidad N° <strong>{cliente.taxId || '_______________________'}</strong>, quien contratara los servicios de <strong>{companyInfo.companyName}</strong>, representada por su titular el Sr. Alexander Knuth, para la organización de un evento previsto para el día <strong>{formatDate(fiesta.configuracion.fechaEvento)}</strong>, según contrato firmado con fecha <strong>{formatDate(presupuesto.timestamp)}</strong>, se procede a la cancelación del mencionado contrato por parte del cliente.</p>

          <p>De acuerdo con la cláusula cuarta del contrato suscrito, en caso de cancelación por parte del cliente, se establece una multa del 30% del presupuesto total como penalización. El presupuesto acordado fue de <strong>{formatCurrency(presupuestoTotal)}</strong>, por lo tanto, la multa correspondiente asciende a <strong>{formatCurrency(multa)}</strong>.</p>
          
          <p>No obstante lo anterior, {companyInfo.companyName}, en un gesto comercial de común acuerdo entre las partes, acepta reducir el costo de la multa, estableciendo como monto total y definitivo de la penalización la suma ya abonada por el cliente, correspondiente a <strong>{formatCurrency(totalPagado)}</strong>, monto que el/la Sr./Sra. {cliente.name} declara haber abonado en su totalidad.</p>
          
          <p>En consecuencia, no existe saldo pendiente ni importe alguno a devolver entre las partes, dándose por totalmente canceladas y saldadas las obligaciones emergentes del contrato mencionado. Ambas partes manifiestan su conformidad con lo expuesto, firmando la presente constancia en dos ejemplares del mismo tenor, en la ciudad de Salto, en la fecha indicada ut-supra.</p>

          <div className="mt-16 flex justify-between text-center">
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">{companyInfo.companyName}</p>
              <p className="text-xs">Por la Empresa</p>
            </div>
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">{cliente.name || ''}</p>
              {cliente.taxId && <p className="text-xs">C.I.: {cliente.taxId}</p>}
              <p className="text-xs text-muted-foreground mt-1">Por el Cliente</p>
            </div>
          </div>
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
