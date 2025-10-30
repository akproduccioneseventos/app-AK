
'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getCustomerById } from '@/app/actions/customers';
import { Skeleton } from '@/components/ui/skeleton';
import { WatermarkedImage } from '@/components/watermarked-image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';


const formatDate = (dateString?: string) => {
  if (!dateString) return "____________";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return "Fecha inválida";
  }
};

const today = new Date().toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

function ContratoServicioContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
        setError("Falta el ID del evento.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, settings] = await Promise.all([
          getFiestaById(fiestaId),
          getInvoiceTemplateSettings()
      ]);
      if (!fiestaData) throw new Error("Evento no encontrado.");
      if (!fiestaData.configuracion.clienteId) {
        setError("Para generar este contrato, primero asigna un cliente al evento en la sección de 'Configuración del Evento'.");
        setIsLoading(false);
        return;
      }
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl);
      const clienteData = await getCustomerById(fiestaData.configuracion.clienteId);
      if (!clienteData) {
        setError(`No se encontraron los datos para el cliente ID: ${fiestaData.configuracion.clienteId}`);
      }
      setCliente(clienteData);
    } catch (err: any) {
      setError("No se pudieron cargar los datos para generar el contrato.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
      const message = `Te comparto el borrador del contrato de servicio para nuestro evento.`;
      const url = window.location.href;
      window.open(`https://wa.me/?text=${encodeURIComponent(message + '\n' + url)}`, '_blank');
  };

  if (isLoading) {
    return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }
  
  if (error || !fiesta) {
    return (
        <div className="max-w-xl mx-auto mt-10 text-center p-6 border-l-4 border-destructive bg-destructive/10">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
            <h2 className="font-semibold text-lg text-destructive">Datos Incompletos</h2>
            <p className="text-sm text-muted-foreground mt-2">{error || "No se encontró un evento activo."}</p>
             <Link href={`/fiestas/nueva/configuracion?fiestaId=${fiestaId}`} passHref>
                <Button variant="secondary" className="mt-4">Ir a Configuración</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2 relative">
        <div className="w-full h-24 print:h-20 mb-4 relative">
            <WatermarkedImage src={logoUrl} alt="Marca de agua" containerClassName='w-full h-full'/>
        </div>
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir por WhatsApp</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <div className="prose prose-sm print:prose-xs max-w-none">
          <h1 className="text-center font-bold">CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTO</h1>
          
          <p>En la ciudad de Salto, a los {today}, entre: Por una parte, <strong>AK PRODUCCIONES</strong>, representada en este acto por Alexander Knuth, en adelante "EL PRESTADOR", y por otra parte, <strong>{cliente?.name || '________________________'}</strong>, C.I. Nº <strong>{cliente?.taxId || '_______________________'}</strong>, con domicilio en ________________________, en adelante "EL CLIENTE", convienen en celebrar el presente contrato de prestación de servicios bajo las siguientes cláusulas:</p>

          <p><strong>PRIMERO: (Objeto)</strong> EL PRESTADOR se obliga a prestar para EL CLIENTE los servicios de organización y ejecución del evento denominado "{fiesta.configuracion.nombreEvento}", de tipo "{fiesta.configuracion.eventoTipo}", a realizarse el día <strong>{formatDate(fiesta.configuracion.fechaEvento)}</strong> en <strong>{fiesta.configuracion.nombreLugar}</strong>, para una cantidad estimada de <strong>{fiesta.configuracion.invitadosEstimados}</strong> invitados.</p>

          <p><strong>SEGUNDO: (Servicios Incluidos)</strong> Los servicios a ser prestados son los detallados en el presupuesto Nº ___________ de fecha ___________, el cual, firmado por ambas partes, forma parte integrante del presente contrato.</p>
          
          <p><strong>TERCERO: (Precio y Forma de Pago)</strong> El precio total por los servicios contratados asciende a la suma de <strong>$ {new Intl.NumberFormat('es-UY').format(Number(fiesta.configuracion.presupuestoEstimado))} (Pesos Uruguayos)</strong>. Este monto será abonado de la siguiente manera:
            <ul className="list-disc pl-5">
              <li>Una seña del 20% al momento de la firma del presente contrato para reserva de fecha y servicios.</li>
              <li>El saldo restante deberá ser abonado con una antelación no menor a 72 horas hábiles previas a la fecha del evento.</li>
            </ul>
            El no cumplimiento de los plazos de pago podrá dar lugar a la suspensión de los servicios por parte de EL PRESTADOR.
          </p>

          <p><strong>CUARTO: (Ajuste Anual)</strong> Las partes acuerdan que en caso de que la fecha del evento sea en un año calendario posterior a la fecha de la firma del presente contrato, el saldo pendiente de pago será ajustado anualmente en un 15% (quince por ciento).</p>
          
          <p><strong>QUINTO: (Obligaciones de las Partes)</strong> EL PRESTADOR se compromete a ejecutar los servicios con la debida diligencia y profesionalismo. EL CLIENTE se compromete a proveer toda la información necesaria y a cumplir con los pagos en los plazos estipulados.</p>

          <p><strong>SEXTO: (Cancelación y Modificaciones)</strong> En caso de cancelación por parte de EL CLIENTE, la seña abonada no será reembolsable. Cualquier modificación sustancial a los servicios contratados deberá ser acordada por escrito y podrá generar costos adicionales.</p>
          
          <p><strong>SÉPTIMO: (Fuerza Mayor)</strong> Ninguna de las partes será responsable por el incumplimiento de sus obligaciones si este se debe a causas de fuerza mayor o caso fortuito debidamente comprobadas.</p>
          
          <p><strong>OCTAVO: (Domicilios y Jurisdicción)</strong> Las partes constituyen domicilios especiales en los indicados como suyos en la comparecencia y se someten a la jurisdicción de los tribunales de la ciudad de Salto para cualquier controversia derivada del presente contrato.</p>
          
          <p>Y para constancia, se firman dos ejemplares de un mismo tenor en el lugar y fecha arriba indicados.</p>

          <div className="mt-16 flex justify-between text-center">
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">EL PRESTADOR</p>
              <p>AK PRODUCCIONES</p>
            </div>
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">EL CLIENTE</p>
              <p>{cliente?.name || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContratoServicioPage() {
    return (
        <Suspense fallback={<div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>}>
            <ContratoServicioContent />
        </Suspense>
    );
}
