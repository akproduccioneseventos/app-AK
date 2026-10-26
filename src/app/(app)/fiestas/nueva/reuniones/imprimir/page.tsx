'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Calendar, CheckCircle2, MessageSquare, MapPin } from 'lucide-react';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { useSearchParams } from 'next/navigation';

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Fecha no definida';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (e) {
    return 'Fecha inválida';
  }
};

const companyName = 'AK Producciones';

function ReunionesImprimirContent({ fiestaId }: { fiestaId: string | null }) {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError('Elegí una fiesta para ver e imprimir sus reuniones.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, templateSettings] = await Promise.all([
        getFiestaById(fiestaId),
        getInvoiceTemplateSettings(),
      ]);
      if (!fiestaData) throw new Error('Evento no encontrado en el sistema.');
      setFiesta(fiestaData);
      setLogoUrl(templateSettings.logoUrl || null);
    } catch (err: any) {
      console.error('Error loading printable meetings:', err);
      setError(err.message || 'Ocurrió un error al cargar las reuniones.');
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
      title: `Minutas de Reuniones - ${fiesta.configuracion.nombreEvento}`,
      text: `Resumen de acuerdos y reuniones de ${fiesta.configuracion.nombreEvento}.`,
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
        title: 'Enlace Copiado',
        description: 'El enlace ha sido copiado a tu portapapeles.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white">
        <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  if (error || !fiesta) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white rounded-lg shadow-md my-10 border border-slate-200">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold text-slate-800">Error al Cargar</h2>
        <p className="text-sm text-slate-600">{error || 'No se pudo encontrar la fiesta solicitada.'}</p>
        <Button asChild variant="outline">
          <Link href={fiestaId ? `/fiestas/nueva/reuniones?fiestaId=${fiestaId}` : '/eventos'}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Reuniones
          </Link>
        </Button>
      </div>
    );
  }

  const reuniones = fiesta.reuniones || [];

  return (
    <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Barra de Acciones */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
          <Button asChild variant="outline" size="sm">
            <Link href={`/fiestas/nueva/reuniones?fiestaId=${fiesta.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Reuniones
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" /> Compartir
            </Button>
            <Button onClick={handlePrint} size="sm">
              <PrinterIcon className="mr-2 h-4 w-4" /> Imprimir Hoja
            </Button>
          </div>
        </div>

        {/* Hoja Imprimible */}
        <div className="bg-white p-8 sm:p-12 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 space-y-8">
          {/* Cabecera */}
          <div className="flex justify-between items-start border-b pb-6 border-slate-200">
            <div>
              {logoUrl ? (
                <div className="relative h-14 w-48 mb-2">
                  <NextImage src={logoUrl} alt={companyName} fill className="object-contain object-left" />
                </div>
              ) : (
                <h1 className="text-2xl font-black tracking-tight text-slate-900">{companyName}</h1>
              )}
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Minutas y Acuerdos de Reunión</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-900">{fiesta.configuracion.nombreEvento}</h2>
              <p className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-1">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(fiesta.configuracion.fechaEvento)}
              </p>
              {fiesta.configuracion.nombreLugar && (
                <p className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {fiesta.configuracion.nombreLugar}
                </p>
              )}
            </div>
          </div>

          {/* Listado de Reuniones */}
          {reuniones.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600">No hay reuniones registradas para esta fiesta.</p>
              <p className="text-xs text-slate-400 mt-1">Podés agendarlas desde el panel de reuniones del evento.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reuniones.map((reunion, idx) => (
                <div key={reunion.id || idx} className="border border-slate-200 rounded-xl p-5 space-y-3 break-inside-avoid">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-base text-slate-800">
                        {reunion.titulo || `Reunión #${idx + 1}`}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" /> {formatDate(reunion.fecha)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {(reunion.notas || reunion.acuerdos) && (
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Acuerdos y Minuta:</p>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{reunion.acuerdos || reunion.notas}</p>
                    </div>
                  )}

                  {reunion.checklist && reunion.checklist.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Puntos Tratados:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {reunion.checklist.map((item, itemIdx) => (
                          <div key={item.id || itemIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${item.completed ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span className={item.completed ? 'font-medium' : 'text-slate-400'}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pie de Página */}
          <div className="border-t pt-6 text-center text-xs text-slate-400 print:text-[10px]">
            <p>Documento generado por AK Producciones para la coordinación de eventos.</p>
            <p className="mt-0.5">Montevideo, Uruguay · akproducciones.com.uy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReunionesImprimirPage() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  return (
    <Suspense fallback={<div className="p-8 max-w-3xl mx-auto"><Skeleton className="h-[80vh] w-full" /></div>}>
      <ReunionesImprimirContent fiestaId={fiestaId} />
    </Suspense>
  );
}
