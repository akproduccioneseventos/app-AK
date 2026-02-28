
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, FileArchive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { CompanyInfo } from '@/types/settings';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getCompanyInfo, getInvoiceTemplateSettings } from '@/app/actions/settings';
import { WatermarkedImage } from '@/components/watermarked-image';

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

function CambioFechaContent({ fiestaId }: { fiestaId: string | null }) {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
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
        setError("El evento debe tener un cliente y un presupuesto asignados para generar este documento.");
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
      title: `Constancia de Cambio de Fecha - ${fiesta?.configuracion.nombreEvento}`,
      text: `Documento de cambio de fecha para el evento.`,
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

  if (isLoading) {
    return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }
  
  if (error || !fiesta || !cliente || !presupuesto || !companyInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Error al Generar Documento</h1>
          <p className="text-muted-foreground mt-2">{error || "No se encontró la información necesaria."}</p>
          <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`} passHref>
            <Button variant="outline" className="mt-4">Volver</Button>
          </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
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
            <h1 className="text-xl font-bold text-center">CONSTANCIA DE CAMBIO DE FECHA DE CONTRATO DE SERVICIOS</h1>
        </header>
        
        <div className="prose prose-sm print:prose-xs max-w-none text-justify">
          <p>En la ciudad de Salto, a los {today}, comparecen por una parte <strong>{companyInfo.companyName}</strong>, representada por su titular Sr. Alexander Knuth, y por la otra el/la Sr./Sra. <strong>{cliente.name || cliente.companyName}</strong>, cédula de identidad Nº <strong>{cliente.taxId || '____________________'}</strong>, en adelante “EL CLIENTE”, quienes acuerdan lo siguiente:</p>

          <p><strong>PRIMERO:</strong> Que con fecha {formatDate(presupuesto.timestamp)} las partes celebraron un Contrato de Servicios para la organización de un evento previsto originalmente para el día <strong>{formatDate(fiesta.configuracion.fechaEvento)}</strong>, en el salón <strong>{fiesta.configuracion.nombreLugar || '______________________________'}</strong>.</p>
          
          <p><strong>SEGUNDO:</strong> Que a solicitud expresa del CLIENTE, y sujeto a disponibilidad de agenda, las partes acuerdan modificar la fecha del evento, fijándose como nueva fecha de realización el día ___ de __________________ de ________.</p>
          
          <p><strong>TERCERO:</strong> Que el cambio de fecha genera una penalización equivalente al DIEZ POR CIENTO (10%) del presupuesto total vigente al momento de la solicitud de modificación, entendiéndose como presupuesto vigente aquel que incluya los ajustes anuales del QUINCE POR CIENTO (15%) aplicables por cada año calendario transcurrido desde el mes de enero inmediato posterior a la firma del contrato original.</p>
          
          <p><strong>CUARTO: El importe correspondiente a la penalización deberá ser abonado dentro de los QUINCE (15) días corridos de firmada la presente constancia. En caso de incumplimiento, {companyInfo.companyName} podrá considerar sin efecto el cambio de fecha solicitado, manteniéndose la fecha original o aplicándose las disposiciones de cancelación previstas en el contrato principal.</strong></p>
          
          <p><strong>QUINTO:</strong> El presente cambio de fecha no implica novación del contrato original, el cual continúa vigente en todas sus demás cláusulas, condiciones y obligaciones, manteniéndose plenamente válidas las disposiciones relativas a forma de pago, ajustes, cancelación y penalidades.</p>

          <p><strong>SEXTO:</strong> En caso de que el cambio de fecha implique variaciones de costos por actualización de precios de proveedores o servicios, dichas diferencias deberán ser abonadas por el CLIENTE antes de la realización del evento.</p>
          
          <p>Leída la presente, las partes firman en dos ejemplares de un mismo tenor, en el lugar y fecha arriba indicados.</p>

          <div className="mt-16 flex justify-between text-center">
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">{companyInfo.companyName}</p>
              <p className="text-xs">Firma: __________________________</p>
              <p className="text-xs">Nombre: Alexander Knuth</p>
              <p className="text-xs">C.I.: 4.617.350-8</p>
            </div>
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">{cliente.name || ''}</p>
              <p className="text-xs">Firma: __________________________</p>
              <p className="text-xs">Nombre: {cliente.name || '_________________________'}</p>
              {cliente.taxId && <p className="text-xs">C.I.: {cliente.taxId}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CambioFechaPage() {
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
            <CambioFechaContent fiestaId={fiestaId} />
        </Suspense>
    );
}
