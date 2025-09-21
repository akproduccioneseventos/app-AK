
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

export default function ContratoServicioPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      if (fiestaData.configuracion.clienteId) {
        const clienteData = await getCustomerById(fiestaData.configuracion.clienteId);
        setCliente(clienteData);
      }
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
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
      const message = `Hola ${cliente?.name || ''}, te adjunto el contrato para nuestro evento. Por favor, revísalo y quedo a tu disposición por cualquier consulta. Saludos, Alexander.`;
      const url = `${window.location.origin}/fiestas/nueva/gestion-documental/contrato`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message + '\n' + url)}`, '_blank');
  };

  if (isLoading) {
    return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }
  if (!fiesta) {
    return <div className="p-8 text-center text-destructive"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/> No se encontraron datos de la fiesta.</div>;
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/fiestas/nueva/gestion-documental" passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><Printer className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <div className="prose prose-sm print:prose-xs max-w-none">
          <h1 className="text-center font-bold">CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTOS</h1>
          
          <p>
            En la ciudad de Salto, a los {today}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT: 220372680019, Nº de Empresa: 0000008898364, representado en este acto por el Tec. Alexander Knuth, C.I. 46173508, con domicilio en Gaboto 3390, Salto, Uruguay, correo electrónico akproduccionessalto@gmail.com, en adelante el “PRESTADOR DEL SERVICIO”.
            Por otra parte, el/la Sr./Sra. <strong>{cliente?.name || '______________________________'}</strong>, con domicilio en { '____________________________________'}, cédula de identidad N° <strong>{cliente?.taxId || '____________________'}</strong>, número de contacto <strong>{cliente?.phone || '____________________'}</strong>, en adelante el “CLIENTE”.
            Ambas partes acuerdan celebrar el presente contrato, sujeto a los términos y condiciones que se establecen a continuación:
          </p>

          <p><strong>PRIMERA: OBJETO</strong> El presente contrato tiene por objeto la prestación de servicios para la organización y realización de una fiesta o evento en la fecha <strong>{formatDate(fiesta.configuracion.fechaEvento)}</strong>, con una duración aproximada de siete (7) horas desde el inicio del evento como máximo, cobrándose un monto de cinco mil pesos por cada hora extra, conforme a las condiciones establecidas en el presupuesto adjunto, el cual forma parte integral del presente contrato. La prestación de los servicios se llevará a cabo en el salón o local <strong>{fiesta.configuracion.nombreLugar || '_________________'}</strong>, cuyo costo será asumido exclusivamente por el CLIENTE.</p>
          
          <p><strong>SEGUNDA: FORMA DE PAGO:</strong> El CLIENTE abonará el precio total estipulado en el presupuesto adjunto conforme a las siguientes modalidades: a) Seña inicial: al momento de la firma del contrato, el CLIENTE abonará la suma de $ 5.000 (pesos uruguayos cinco mil), la cual se imputará al precio total del servicio contratado. En caso de cancelación, dicha suma se considerará parte integrante de la multa prevista en la cláusula de cancelación y no será reintegrada. b) Pagos parciales: luego de la seña inicial, el CLIENTE podrá realizar pagos parciales en los montos y fechas que disponga, los cuales serán imputados al precio total del servicio. c) Saldo final: el saldo pendiente deberá estar totalmente cancelado con una antelación mínima de quince (15) días corridos a la fecha del evento. El pago podrá realizarse en efectivo, transferencia bancaria a la cuenta designada por el PRESTADOR, o cualquier otro medio válido, entregándose siempre el comprobante correspondiente. El incumplimiento en la cancelación total en el plazo establecido facultará al PRESTADOR a rescindir el contrato, pudiendo exigir al CLIENTE el pago de una multa equivalente al treinta por ciento (30%) del presupuesto total.</p>

          <p><strong>TERCERA: CAMBIO DE FECHA</strong> Si por razones de fuerza mayor o decisión de EL CLIENTE, este debiera solicitar un cambio de fecha, deberá comunicarlo con una antelación mínima de 30 (treinta) días a la fecha establecida para el evento. El cambio quedará sujeto a la disponibilidad del PRESTADOR DEL SERVICIO. Cada cambio de fecha solicitado por EL CLIENTE implicará el pago de una multa equivalente al 10% (diez por ciento) del presupuesto total contratado, la cual deberá abonarse al momento de confirmar la nueva fecha. Si el cambio solicitado corresponde pasa a otro año, además de la multa indicada, se aplicará un ajuste del 15% (quince por ciento) anual correspondiente sobre el presupuesto. De no cumplirse con la antelación establecida o no encontrarse disponibilidad en la agenda de la empresa para la nueva fecha requerida, se aplicarán las condiciones de cancelación establecidas en la Cláusula Cuarta.</p>
          
          <p><strong>CUARTA: CANCELACIÓN</strong> En caso de que EL CLIENTE decida cancelar el evento o desistir de uno o más servicios previamente contratados, sea total o parcialmente, deberá abonar al PRESTADOR DEL SERVICIO una multa equivalente al 30% (treinta por ciento). Cuando la cancelación sea total, la multa se calculará sobre el monto total del presupuesto contratado. Cuando la cancelación sea parcial, ya sea por la eliminación o reducción de uno o más servicios, la multa se calculará sobre el valor correspondiente al o los servicios cancelados o reducidos, tomando como base el presupuesto previamente acordado. Esta penalización tiene por finalidad cubrir los costos de reserva, planificación, logística, tiempo de trabajo y cualquier otro gasto o perjuicio generado por la modificación o cancelación del servicio.</p>

          <p><strong>QUINTA: AJUSTE ANUAL DE PRECIOS</strong> Si el presente contrato se firma con una anticipación igual o superior a un (1) año respecto a la fecha del evento, se aplicará un ajuste del 15% (quince por ciento) anual, el cual se efectuará automáticamente el 1° de enero de cada año, independientemente de la fecha en que se haya suscrito el contrato. En caso de que la fecha del evento sea de más de un año posterior, se aplicará un ajuste adicional del 15% (quince por ciento) sobre el monto ya ajustado del año anterior, de manera acumulativa.</p>

          <p><strong>SEXTA: INVITADOS</strong> El costo del evento se basará en el número total de invitados contratados, independientemente de su asistencia. El CLIENTE podrá reducir hasta un 10% (diez por ciento) del número de invitados contratados sin costo adicional, notificando con al menos 7 días de anticipación. Asimismo, podrá aumentar hasta un 20% (veinte por ciento) del número de invitados contratados, sujeto a la disponibilidad de AK PRODUCCIONES EVENTOS, notificando con al menos 15 días de anticipación.</p>

          <p><strong>SÉPTIMA: PAGO</strong> Al momento de la firma del contrato, el CLIENTE abonará la suma de pesos uruguayos _______________($ __________ ) como seña, recibiendo el comprobante correspondiente. El saldo del precio se abonará conforme al plan de pagos acordado, y una vez cancelado el total, AK PRODUCCIONES EVENTOS emitirá el comprobante correspondiente.</p>
          
          <p><strong>OCTAVA – DAÑOS Y ROTURAS:</strong> Cualquier daño o rotura ocasionada por el Cliente, sus invitados, o terceros contratados por él, a las instalaciones, mobiliario, decoración, equipamiento o cualquier elemento provisto por el Prestador, será responsabilidad exclusiva del Cliente, quien deberá reintegrar el valor total del daño, previa evaluación, teniendo 7 días corridos para hacerlo después de ser notificado por el servicio.</p>
          
          <p><strong>NOVENA – ELEMENTOS PROVISTOS:</strong> Todos los elementos utilizados en la decoración, barra de tragos, discoteca, iluminación, mobiliario, utilería y demás servicios contratados son de uso exclusivo para el evento. Queda expresamente prohibido al Cliente o a sus invitados retirarlos, conservarlos o reclamarlos una vez finalizado el evento. Únicamente se entregará al Cliente la comida sobrante del catering, la porción correspondiente de la torta o postres, y la bebida alcohólica y no alcohólica traída por él.</p>
          
          <p><strong>DÉCIMA – EXONERACIÓN DE RESPONSABILIDAD:</strong> El Prestador no se responsabiliza por accidentes, daños personales, pérdidas u otros perjuicios causados por invitados, terceros o por situaciones fuera de su control. Cualquier incidente ajeno a la ejecución directa del servicio será responsabilidad exclusiva del Cliente.</p>
          
          <p><strong>DÉCIMO PRIMERA – USO DE IMAGEN:</strong> El Cliente autoriza al Prestador a utilizar fotografías y videos del evento con fines promocionales en redes sociales, sitio web y material publicitario. Si el Cliente no autoriza dicho uso, deberá informarlo por escrito antes del evento.</p>
          
          <p><strong>DÉCIMO SEGUNDA – FUERZA MAYOR:</strong> El Prestador no será responsable por incumplimientos ocasionados por fuerza mayor, tales como fenómenos naturales, cortes de energía u otras circunstancias fuera de su control. En tales casos, las partes procurarán reprogramar el evento en la primera fecha disponible sin penalización para ninguna de las partes.</p>
          
          <p><strong>DÉCIMO TERCERA: PRESUPUESTO Y MODIFICACIONES POSTERIORES</strong> Se adjunta a éste contrato el presupuesto final de los servicios contratados, sus costos individuales y el total a pagar por el cliente, el cual será firmado por ambas partes y las mismas reconocen y aceptan éste presupuesto como el acuerdo final de los servicios y costos. Toda modificación, reducción, agregado o ajuste de los servicios contratados deberá realizarse por escrito y con la firma de ambas partes. No se aceptarán modificaciones informales, ya sea de palabra, por mensajes o cualquier otro medio no formalizado. Cualquier modificación que implique un ajuste económico se documentará en una adenda al presente contrato, donde constarán los cambios y el nuevo valor acordado.</p>
          
          <p><strong>DÉCIMO CUARTA: RESPONSABILIDAD DE IMPUESTOS:</strong> El cliente asume la totalidad del pago correspondiente a Agadu el Prestador no asume responsabilidad por el incumplimiento o multa por éste concepto.</p>
          
          <p><strong>DÉCIMO QUINTA: JURISDICCIÓN</strong> Para cualquier conflicto derivado del presente contrato, ambas partes acuerdan someterse a la competencia de los Juzgados Letrados de Salto, constituyendo domicilio en los indicados al inicio del documento.</p>
          
          <p><strong>DÉCIMO SEXTA: DISPOSICIONES FINALES</strong> Las partes declaran haber leído, comprendido y aceptado todas y cada una de las cláusulas del presente contrato, firmando dos ejemplares de un mismo tenor y a un solo efecto. En señal de conformidad, ambas partes firman el presente contrato.</p>
          
          <div className="mt-16 flex justify-between text-center">
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">POR AK PRODUCCIONES EVENTOS</p>
              <p>TEC. ALEXANDER KNUTH</p>
            </div>
            <div className="w-2/5 border-t border-gray-400 pt-2">
              <p className="font-semibold">EL CLIENTE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

    