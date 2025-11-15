
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft, Printer as PrinterIcon, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { WatermarkedImage } from '@/components/watermarked-image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

const formatDate = (dateString?: string, withTime = false) => {
  if (!dateString) return "Fecha no especificada";
  try {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    if (withTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString('es-ES', options) + (withTime ? ` hs.` : '');
  } catch (e) {
    return "Fecha inválida";
  }
};

function ImprimirReunionContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const reunionId = searchParams.get('reunionId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [reunion, setReunion] = useState<Reunion | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId || !reunionId) {
      setError("Faltan datos de evento o reunión.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([
        getFiestaById(fiestaId),
        getInvoiceTemplateSettings()
      ]);
      
      if (!fiestaData) throw new Error("Evento no encontrado.");
      const reunionData = fiestaData.reuniones?.find(r => r.id === reunionId);
      if (!reunionData) throw new Error("Reunión no encontrada.");

      setFiesta(fiestaData);
      setReunion(reunionData);
      setLogoUrl(settings.logoUrl);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar los datos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, reunionId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => window.print();
  const handleShare = () => {
    if (!reunion) return;
    const message = `Detalles de la reunión: *${reunion.titulo}* para el evento *${fiesta?.configuracion.nombreEvento}*.\n\n*Fecha:* ${formatDate(reunion.fecha, true)}\n\n*Temas:*\n${reunion.notas}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
  }
  
  if (error || !fiesta || !reunion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Error al Generar Minuta</h1>
          <p className="text-muted-foreground mt-2">{error || "No se encontró información del evento o reunión."}</p>
          <Link href={`/fiestas/nueva/reuniones?fiestaId=${fiestaId}`} passHref>
            <Button variant="outline" className="mt-4">Volver</Button>
          </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-2xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="w-full h-20 mb-4 relative print:h-16">
            <WatermarkedImage src={logoUrl} alt="Marca de agua" />
        </div>
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva/reuniones?fiestaId=${fiestaId}`} passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Reuniones</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg">Minuta de Reunión</h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{fiesta.configuracion.nombreEvento}</p>
          <p className="text-xs text-gray-500 print:text-[9pt]">Reunión del: {formatDate(reunion.fecha, true)}</p>
        </header>

        <section className="space-y-4 print:space-y-3">
          <div>
            <h2 className="text-md font-semibold text-gray-800 print:text-base border-b pb-1 mb-2">Título de la Reunión</h2>
            <p className="text-lg print:text-md">{reunion.titulo}</p>
          </div>
          <div>
            <h2 className="text-md font-semibold text-gray-800 print:text-base border-b pb-1 mb-2">Temas a Tratar / Notas</h2>
            <p className="text-sm print:text-xs text-gray-700 whitespace-pre-wrap">{reunion.notas || 'No se especificaron temas.'}</p>
          </div>
        </section>

        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300">
          <p>Generado el: {new Date().toLocaleString('es-ES')}</p>
        </footer>
      </div>
    </div>
  );
}

export default function ImprimirReunionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
            <ImprimirReunionContent />
        </Suspense>
    );
}

