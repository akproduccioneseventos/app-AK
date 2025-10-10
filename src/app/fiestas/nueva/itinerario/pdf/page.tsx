
'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Clock, Utensils, GlassWater, Music, CakeSlice, Camera, Diamond, PartyPopper } from 'lucide-react';
import type { FiestaEnPlanificacion, ProgramaEventoItem } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

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

const iconMap: Record<string, React.ElementType> = {
  Utensils, GlassWater, Music, CakeSlice, Camera, Diamond, PartyPopper, Clock,
};

export default function ItinerarioPdfPage() {
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
      setError("No se pudieron cargar los datos para el PDF.");
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
  
  const handleShare = async () => {
    const shareData = {
      title: `Cronograma - ${fiesta?.configuracion.nombreEvento}`,
      text: `Te comparto el cronograma para el evento.`,
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
    return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }

  if (error || !fiesta) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white text-center">
         <div className="flex justify-between items-center mb-6 print:hidden">
             <Link href="/fiestas/nueva/itinerario" passHref>
                <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
            </Link>
        </div>
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
        <p className="font-semibold text-lg text-destructive">Error al Cargar</p>
        <p className="text-sm text-muted-foreground">{error || "No se pudieron cargar los datos necesarios."}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/fiestas/nueva/itinerario" passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / Guardar PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
            {logoUrl && (
                <div className="w-24 h-24 mx-auto mb-2 print:w-20 print:h-20">
                    <Image src={logoUrl} alt={`${companyName} Logo`} width={96} height={96} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
          <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2">
            <Clock className="w-6 h-6 print:w-5 print:h-5" /> Cronograma del Evento
          </h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{fiesta.configuracion.nombreEvento}</p>
          <p className="text-xs text-gray-500 print:text-[8pt]">{formatDate(fiesta.configuracion.fechaEvento)}</p>
        </header>
        
        {fiesta.programa && fiesta.programa.length > 0 ? (
          <div className="relative max-w-xl mx-auto pl-8">
            <div className="absolute left-8 h-full w-0.5 bg-gray-200 -z-10 print:left-4" style={{left: '32px'}}></div>
            {fiesta.programa.map((item) => {
                const Icon = item.icono && iconMap[item.icono] ? iconMap[item.icono] : Clock;
                return (
                    <div key={item.id} className="relative flex items-start gap-6 pb-6 print:pb-4 print:gap-4">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 border-2 border-primary print:h-12 print:w-12">
                                <Icon className="h-7 w-7 text-primary print:h-5 print:w-5" />
                            </div>
                            <span className="mt-1 text-sm font-bold text-primary print:text-xs">{item.hora}</span>
                        </div>
                        <div className="pt-2 print:pt-1">
                            <p className="font-semibold text-base print:text-sm">{item.titulo}</p>
                            <p className="text-sm text-muted-foreground print:text-xs">{item.descripcion}</p>
                        </div>
                    </div>
                )
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground p-8">No hay un cronograma definido para este evento.</p>
        )}

        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300">
          <p>Generado por {companyName} el: {new Date().toLocaleString('es-ES')}</p>
        </footer>
      </div>
    </div>
  );
}
