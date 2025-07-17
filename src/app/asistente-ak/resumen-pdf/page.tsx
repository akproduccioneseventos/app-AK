
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, CalendarDays, Users, Info, ArrowLeft } from 'lucide-react';
import type { AsistenteData } from '@/app/asistente-ak/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import NextImage from 'next/image';
import Link from 'next/link';

const formatCurrency = (amount: number, includeSymbol = true) => {
  if (isNaN(amount)) return 'N/A';
  const options = { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const formatted = new Intl.NumberFormat('es-UY', options).format(amount);
  return includeSymbol ? `$ ${formatted}` : formatted;
};

const formatDate = (date: Date) => {
  if (!date) return "Fecha no especificada";
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
};

const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_LOGO_URL = "https://placehold.co/120x60/EF4444/FFFFFF.png?text=AK&font=montserrat";
const COMPANY_LOGO_AI_HINT = "company logo AK simple";
const BUDGET_VALIDITY_DAYS = 30;

export default function ResumenAsistentePdfPage() {
  const [data, setData] = useState<AsistenteData | null>(null);
  const [presupuestoEstimado, setPresupuestoEstimado] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This component runs only on the client-side
    const storedData = localStorage.getItem('asistenteData');
    if (storedData) {
      const parsedData: AsistenteData = JSON.parse(storedData);
      setData(parsedData);

      // Recalculate budget to ensure consistency
      let base = parsedData.tipoFiesta?.costoBase || 0;
      const totalInvitados = parsedData.invitados.adultos + parsedData.invitados.adolescentes + parsedData.invitados.ninos;
      if (totalInvitados > 0) {
        base += (parsedData.catering?.costoPorPersona || 0) * totalInvitados;
        base += (parsedData.bebidas?.costoPorPersona || 0) * totalInvitados;
        base += (parsedData.reposteria?.costoPorPersona || 0) * totalInvitados;
      }
      if (parsedData.estiloDecoracion?.multiplicadorCosto) {
        base *= parsedData.estiloDecoracion.multiplicadorCosto;
      }
      base += parsedData.fotoVideo?.costoBase || 0;
      base += parsedData.musica?.costoBase || 0;
      base += parsedData.reposteria?.costoBase || 0;
      base += parsedData.entretenimiento?.costoBase || 0;
      setPresupuestoEstimado(base);
    }
    setIsLoading(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white">
        <Skeleton className="h-10 w-40 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <p>No se encontraron datos del presupuesto.</p>
        <Link href="/asistente-ak" passHref>
          <Button variant="link">Volver al Asistente</Button>
        </Link>
      </div>
    );
  }

  const fechaValidoHasta = new Date();
  fechaValidoHasta.setDate(fechaValidoHasta.getDate() + BUDGET_VALIDITY_DAYS);

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
            <Link href="/asistente-ak" passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver al Asistente</Button></Link>
            <Button onClick={handlePrint} size="sm"><Printer className="w-4 h-4 mr-1.5" />Imprimir / Guardar PDF</Button>
        </div>
        
        <header className="mb-6 print:mb-3 flex justify-between items-center border-b pb-3 print:pb-2">
            <div>
              <h1 className="text-xl font-bold text-primary print:text-lg">Presupuesto Estimado</h1>
              <p className="text-sm text-gray-700 print:text-xs mt-1">{COMPANY_NAME_BRAND}</p>
            </div>
            <div className="w-24 h-12 print:w-20 print:h-10 flex-shrink-0">
                <NextImage src={COMPANY_LOGO_URL} alt={`${COMPANY_NAME_BRAND} Logo`} width={100} height={50} className="object-contain" data-ai-hint={COMPANY_LOGO_AI_HINT} />
            </div>
        </header>

        <section className="grid grid-cols-2 gap-4 text-sm print:text-xs mb-4">
            <div>
                <h3 className="font-semibold text-gray-600">CLIENTE:</h3>
                <p>{data.tipoFiesta?.nombre || 'Evento'} para Cliente</p>
            </div>
             <div className="text-right">
                <h3 className="font-semibold text-gray-600">FECHA PRESUPUESTO:</h3>
                <p>{formatDate(new Date())}</p>
            </div>
        </section>
        
        <Separator className="my-4"/>

         <section className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm print:text-xs mb-4">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"><CalendarDays className="w-4 h-4 text-primary"/><span>Fecha Evento: {formatDate(new Date())}</span></div>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"><Users className="w-4 h-4 text-primary"/><span>{data.invitados.adultos + data.invitados.adolescentes + data.invitados.ninos} Invitados</span></div>
        </section>


        <section className="mb-6 print:mb-3">
          <table className="w-full text-sm print:text-[9pt] border-collapse">
            <thead className="print:bg-gray-100">
              <tr>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50 w-3/5">Concepto</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-right font-medium bg-gray-50 w-2/5">Importe Estimado</th>
              </tr>
            </thead>
            <tbody>
              {data.tipoFiesta && <tr><td className="border border-gray-300 px-2 py-1">Servicio Base: {data.tipoFiesta.nombre}</td><td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(data.tipoFiesta.costoBase)}</td></tr>}
              {data.estiloDecoracion && <tr><td className="border border-gray-300 px-2 py-1">Decoración: {data.estiloDecoracion.nombre}</td><td className="border border-gray-300 px-2 py-1 text-right">Incluido</td></tr>}
              {data.catering && <tr><td className="border border-gray-300 px-2 py-1">Catering: {data.catering.nombre}</td><td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency((data.catering.costoPorPersona || 0) * (data.invitados.adultos + data.invitados.adolescentes + data.invitados.ninos))}</td></tr>}
              {data.bebidas && <tr><td className="border border-gray-300 px-2 py-1">Bebidas: {data.bebidas.nombre}</td><td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency((data.bebidas.costoPorPersona || 0) * (data.invitados.adultos + data.invitados.adolescentes + data.invitados.ninos))}</td></tr>}
              {data.fotoVideo && <tr><td className="border border-gray-300 px-2 py-1">Foto/Video: {data.fotoVideo.nombre}</td><td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(data.fotoVideo.costoBase)}</td></tr>}
              {data.musica && <tr><td className="border border-gray-300 px-2 py-1">Música: {data.musica.nombre}</td><td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(data.musica.costoBase)}</td></tr>}
              {data.reposteria && <tr><td className="border border-gray-300 px-2 py-1">Repostería: {data.reposteria.nombre}</td><td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency((data.reposteria.costoBase || 0) + (data.reposteria.costoPorPersona || 0) * (data.invitados.adultos + data.invitados.adolescentes + data.invitados.ninos))}</td></tr>}
              {data.entretenimiento && <tr><td className="border border-gray-300 px-2 py-1">Entretenimiento: {data.entretenimiento.nombre}</td><td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(data.entretenimiento.costoBase)}</td></tr>}
              {data.listaRegalos !== null && <tr><td className="border border-gray-300 px-2 py-1">Gestión Lista de Regalos</td><td className="border border-gray-300 px-2 py-1 text-right">{data.listaRegalos ? 'Incluido' : 'No incluido'}</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end mb-6 print:mb-3 text-base print:text-sm">
          <div className="w-full max-w-[280px] print:max-w-[220px] space-y-1">
            <div className="flex justify-between font-bold pt-1 border-t-2 border-gray-500">
              <span>Importe total estimado</span>
              <span>{formatCurrency(presupuestoEstimado)}</span>
            </div>
          </div>
        </section>

         <footer className="mt-8 pt-4 text-xs print:text-[8pt] text-gray-600 print:text-black">
          <p className="font-semibold">Notas y Condiciones:</p>
          <p>Este documento es una estimación basada en las opciones seleccionadas y puede variar. No incluye impuestos. Válido por {BUDGET_VALIDITY_DAYS} días. Para asegurar el presupuesto debe abonar el 20% del total como seña.</p>
        </footer>
      </div>
    </div>
  );
}
