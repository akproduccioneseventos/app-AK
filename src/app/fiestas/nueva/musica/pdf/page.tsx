
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Music, Ban, PartyPopper, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) { return "Fecha inválida"; }
};

const companyName = "AK Producciones";


export default function MusicaPdfPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, templateSettings] = await Promise.all([
        getFiestaActual(),
        getInvoiceTemplateSettings()
      ]);
      setFiesta(fiestaData);
      setLogoUrl(templateSettings.logoUrl);
    } catch (err: any) {
      setError("No se pudieron cargar los datos para el PDF de música.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      console.error("Error loading data for PDF:", err);
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
  
  const handleShare = async () => {
    const shareData = {
      title: `Preferencias Musicales - ${fiesta?.configuracion.nombreEvento}`,
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
        description: "El enlace a esta página ha sido copiado a tu portapapeles.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Skeleton className="h-10 w-40" /> <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-20 w-full mb-6" />
      </div>
    );
  }

  if (error || !fiesta || !fiesta.musica) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white text-center">
         <div className="flex justify-between items-center mb-6 print:hidden">
             <Link href="/fiestas/nueva/musica" passHref>
                <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button>
            </Link>
        </div>
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
        <p className="font-semibold text-lg text-destructive">Error al Cargar</p>
        <p className="text-sm text-muted-foreground">{error || "No se pudieron cargar los datos necesarios."}</p>
      </div>
    );
  }

  const musica = fiesta.musica;

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/fiestas/nueva/musica" passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / Guardar PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
            {logoUrl && (
                <div className="w-24 h-24 mx-auto mb-2 print:w-20 print:h-20">
                    <Image src={logoUrl} alt={`${companyName} Logo`} width={96} height={96} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
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
                <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><PartyPopper className="w-5 h-5"/>Sugerencias de los Invitados</h2>
                <p className="text-sm print:text-xs text-gray-700 whitespace-pre-line bg-blue-50 p-2 rounded-md">{musica.sugerenciasInvitados || 'No hay sugerencias de los invitados.'}</p>
            </section>

             <section>
                <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2">Playlist General / Sugerencias del Cliente</h2>
                <p className="text-sm print:text-xs text-gray-700 whitespace-pre-line bg-gray-50 p-2 rounded-md">{musica.playlistFiesta || 'No hay sugerencias generales.'}</p>
            </section>
            
            <section>
                <h2 className="text-lg font-semibold text-red-600 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><Ban className="w-5 h-5"/>Lista de "NO Reproducir"</h2>
                <p className="text-sm print:text-xs text-gray-700 whitespace-pre-line bg-red-50 p-2 rounded-md">{musica.listaNoReproducir || 'No hay canciones o artistas en la lista de exclusión.'}</p>
            </section>
        </div>

        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300">
          <p>Generado el: {new Date().toLocaleString('es-ES')}</p>
        </footer>
      </div>
    </div>
  );
}
