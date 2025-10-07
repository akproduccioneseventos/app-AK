
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { WatermarkedImage } from '@/components/watermarked-image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

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

export default function ContratoSalonPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, settings] = await Promise.all([
          getFiestaActual(),
          getInvoiceTemplateSettings()
      ]);
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
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = () => {
      const message = `Te comparto el borrador del contrato de arrendamiento del salón para el evento.`;
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
             <Link href="/fiestas/nueva/configuracion" passHref>
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
          <Link href="/fiestas/nueva/gestion-documental" passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir por WhatsApp</Button>
            <Button onClick={handlePrint} size="sm"><Printer className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <div className="prose prose-sm print:prose-xs max-w-none">
          <h1 className="text-center font-bold">CONTRATO DE ARRENDAMIENTO del salón de fiestas del Club Uruguay.-</h1>
          
          <p>
            En la ciudad de Salto el día {today} el Club Uruguay representado por este acto, dan en arrendamiento al <strong>{cliente?.name || '________________________'}</strong> titular de la cédula de identidad Nº <strong>{cliente?.taxId || '_______________________'}</strong>, domiciliado en calle ______________________________________, teléfono <strong>{cliente?.phone || '________________'}</strong> en salón principal de fiestas que queda en la última planta del edificio sito en calle Uruguay Nº 754 que da al Norte sobre calle Uruguay para el día <strong>{formatDate(fiesta.configuracion.fechaEvento)}</strong>, bajo las siguientes términos y cláusulas:
          </p>

          <p><strong>PRIMERO: (Objeto)</strong> el bien que se arrienda es el salón principal de fiestas referido anteriormente, el hall de entrada al mismo, el baño y la pieza destinada a cantina y el mobiliario.-</p>
          <p><strong>SEGUNDO: (precio)</strong> El precio del arrendamiento es de pesos uruguayos diecisiete mil quinientos ($ 17.500) que se abonan en efectivo 30 días antes del evento, al contado y en el momento de suscribir este contrato se realiza el pago de una seña de tres mil pesos uruguayos ($ 5.000), otorgando el Club Uruguay el recibo correspondiente que acredite dicho pago, con ajuste anual del 15% del precio total de arrendamiento.-</p>
          <p><strong>TERCERO: (reparaciones)</strong> sin perjuicio del precio estipulado en la cláusula anterior, la parte arrendataria es responsable y abonará cualquier rotura o desperfecto que se ocasione en los bienes que forman parte de este arrendamiento, siendo  su obligación entre otras usar los bienes según los términos y espíritu del contrato, darles un uso acorde a las normas de buena conducta, empleando en la conservación de la cosa arrendada un cuidado diligente y responsable. Para el caso de deterioros la arrendataria abonará los mismos, aceptando desde ya la tasación que efectúe el Club Uruguay. La obligación de reparación de deterioros referida alcanza a la arrendataria incluso por los daños ocasionados por terceros tales como empresas contratadas para el servicio de lunch, decoradores, orquestas, musicalización, terceros concurrentes y de cualquier otra índole.-</p>
          <p><strong>CUARTO: ( Ruidos molestos)</strong> La arrendataria expresa conocer el decreto municipal vigente sobre ruidos molestos, por lo que para el caso de utilizar aparatos sonoros, amplificación, instrumentos electrónicos, contratación de orquestas se obligan a mantener una intensidad inferior a los 55 decibeles, siendo de cargo de la arrendataria las multas que la Intendencia de Salto pudiera aplicar por violación de dicho decreto, así como cualquier otro perjuicio que se ocasione por no cumplimiento de dicha Ordenanza municipal.-</p>
          <p><strong>QUINTO: (prohibiciones especiales)</strong> Queda expresamente prohibido a la arrendataria o a las personas o empresas que esta contrate colocar clavos, alambres o cualquier elemento que pueda dañar las paredes o instalaciones del salón que se arrienda. Solo podrá usarse las riendas de la araña para la decoración del salón. El incumplimiento de estas obligaciones, faculta a la arrendadora a cobrar a la arrendataria el monto que estime pertinente como reparación de los daños y perjuicios causados.-</p>
          <p><strong>SEXTO:</strong> queda expresamente prohibido a la arrendataria subarrendar o ceder el arriendo, excepto la previa y escrita autorización otorgada por la arrendadora.-</p>
          <p><strong>SEPTIMO:</strong> el Club Uruguay, no aceptará, bajo ninguna circunstancia, la devolución del precio pagado por la arrendataria.-</p>
          <p><strong>OCTAVO:</strong> la arrendataria solo podrá desistir del arrendamiento por motivos graves, fundados y fehacientemente comprobados, dando aviso al Club Uruguay por telegrama colacionado el que deberá ser recibido por la arrendadora con una antelación de 10 días calendario, a la fecha contratada.  Si la intención de desistir se manifiesta fuera del plazo antes indicado, será facultad del Club Uruguay acceder a la petición así como la de devolver la mitad del precio del arriendo. En ambos casos nunca se devolverá más del cincuenta por ciento del precio pactado.-</p>
          <p><strong>NOVENO:</strong> la parte arrendataria declara conocer y aceptar que para el caso de no abonar el precio de las reparaciones de los daños ocasionados por la arrendataria, o terceros concurrentes a la fiesta o evento, o empresas contratadas por la arrendataria, dentro del plazo de 48 horas de comunicadas por telegrama colacionado, deberás además abonar una multa diaria equivalente a una Unidad Reajustable por cada día de atraso en el pago de dichas reparaciones.-</p>
          <p><strong>DECIMO:</strong> la limpieza de los bienes arrendados son cuenta del Club Uruguay.-</p>
          <p><strong>UNDECIMO:</strong> la parte arrendataria es exclusivamente responsable de los aportes a AGADU y los organismos estatales como BPS o DGI u otros por las personas que contraten, o los dependientes de las empresas que contraten para dicha fiesta, quedando totalmente exonerado el Club Uruguay respecto a cualquier reclamo de dicha índole.</p>

          <div className="mt-16 flex justify-between text-center">
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">POR CLUB URUGUAY</p>
            </div>
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">EL ARRENDATARIO</p>
              <p>{cliente?.name || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
