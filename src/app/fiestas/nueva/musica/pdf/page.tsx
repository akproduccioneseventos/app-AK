
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Music, Ban, PartyPopper, Loader2 } from 'lucide-react';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { WatermarkedImage } from '@/components/watermarked-image';
import { useSearchParams } from 'next/navigation';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

const companyName = "AK Producciones";

function MusicaPdfContent({ fiestaId }: { fiestaId: string | null }) {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("No se especificó un identificador de evento válido.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, templateSettings] = await Promise.all([
        getFiestaById(fiestaId),
        getInvoiceTemplateSettings()
      ]);
      if (!fiestaData) throw new Error("Evento no encontrado en el sistema.");
      setFiesta(fiestaData);
      setLogoUrl(templateSettings.logoUrl || null);
    } catch (err: any) {
      console.error("Error loading PDF data:", err);
      setError(err.message || "Ocurrió un error al cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = async () => {
    if (!fiesta) return;
    const shareData = {
      title: `Preferencias Musicales - ${fiesta.configuracion.nombreEvento}`,
      text: `Aquí tienes las preferencias musicales para el DJ del evento.`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error();
      }
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Enlace Copiado",
        description: "El enlace ha sido copiado a tu portapapeles.",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }

  if (error || !fiesta || !fiesta.musica) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white text-center flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold text-destructive">Error al Generar Reporte</h2>
        <p className="text-muted-foreground">{error || "No hay preferencias musicales definidas."}</p>
        <Link href={`/fiestas/nueva/musica?fiestaId=${fiestaId || ''}`} passHref>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a la Planificación</Button>
        </Link>
      </div>
    );
  }

  const musica = fiesta.musica;

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2 relative">
        <div className="w-full h-24 print:h-20 mb-4 relative">
            <WatermarkedImage src={logoUrl} alt="Logo" containerClassName='w-full h-full'/>
        </div>
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva/musica?fiestaId=${fiestaId}`} passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / Guardar PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2">
            <Music className="w-6 h-6 print:w-5 print:h-5" /> Preferencias Musicales para el DJ
          </h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{fiesta.configuracion.nombreEvento}</p>
          <p className="text-xs text-gray-500 print:text-[8pt]">{formatDate(fiesta.configuracion.fechaEvento)}</p>
        </header>
        
        <div className="space-y-6 print:space-y-3">
            <section>
                <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2">Canciones Clave</h2>
                <div className="space-y-1 text-sm print:text-xs">
                    <p><span className="font-semibold">Entrada:</span> {musica.cancionEntrada || 'No especificada'}</p>
                    <p><span className="font-semibold">Vals / Momento especial:</span> {musica.cancionVals || 'No especificada'}</p>
                    <div>
                        <p className="font-semibold">Torta y Brindis:</p>
                        {musica.cancionesTortaBrindis && musica.cancionesTortaBrindis.length > 0 ? (
                            <ul className="list-disc list-inside pl-4 text-gray-700">
                                {musica.cancionesTortaBrindis.map((song, i) => <li key={i}>{song}</li>)}
                            </ul>
                        ) : <p className="text-gray-500 italic">No especificadas</p>}
                    </div>
                </div>
            </section>

             <section>
                <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2">Playlist y Sugerencias</h2>
                <p className="text-sm print:text-xs text-gray-700 whitespace-pre-line bg-gray-50 p-2 rounded-md">{musica.playlistFiesta || 'No hay sugerencias generales.'}</p>
            </section>
            
            <section>
                <h2 className="text-lg font-semibold text-red-600 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><Ban className="w-5 h-5"/>Lista de "NO Reproducir"</h2>
                <p className="text-sm print:text-xs text-gray-700 whitespace-pre-line bg-red-50 p-2 rounded-md">{musica.listaNoReproducir || 'No hay canciones o artistas en la lista de exclusión.'}</p>
            </section>
        </div>

        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300">
          <p>Generado por {companyName} el: {new Date().toLocaleString('es-ES')}</p>
        </footer>
      </div>
    </div>
  );
}

function MusicaPdfPage() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  return <MusicaPdfContent fiestaId={fiestaId} />;
}

export default function MusicaPdfPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8 h-screen items-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
        <MusicaPdfPage />
    </Suspense>
  )
}
