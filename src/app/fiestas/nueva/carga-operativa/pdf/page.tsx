
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Printer as PrinterIcon, PackageSearch, Share2, KeyRound, AlertTriangle, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ListaDeCargaOperativa } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { Skeleton } from '@/components/ui/skeleton';
import { WatermarkedImage } from '@/components/watermarked-image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

const companyName = "AK Producciones";

function CargaOperativaPdfContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [listaDeCarga, setListaDeCarga] = useState<ListaDeCargaOperativa | null>(null);
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
      
      setFiesta(fiestaData);
      setListaDeCarga(fiestaData.listaDeCargaOperativa || { categorias: [], notasGenerales: '' });
      setLogoUrl(settings.logoUrl);
    } catch (err: any) {
      setError("No se pudieron cargar los datos para el PDF de carga.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      console.error("Error loading data for PDF:", err);
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
  
  const handleShare = async () => {
    const shareData = {
      title: `Lista de Carga - ${fiesta?.configuracion.nombreEvento}`,
      text: `Aquí tienes la lista de carga operativa para el evento.`,
      url: window.location.href,
    };
    if (typeof navigator.share !== 'undefined' && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(err => console.error("Error al compartir:", err));
    } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + '\n' + shareData.url)}`;
        window.open(whatsappUrl, '_blank');
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
        <Skeleton className="h-48 w-full mb-6" />
      </div>
    );
  }

  if (error || !fiesta || !listaDeCarga) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white text-center">
         <div className="flex justify-between items-center mb-6 print:hidden">
             <Link href={fiestaId ? `/fiestas/nueva/carga-operativa?fiestaId=${fiestaId}` : "/eventos"} passHref>
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
      <div className="max-w-3xl mx-auto space-y-4 print:space-y-0">
        {/* Aviso de Acceso Online - Solo pantalla */}
        <Card className="bg-blue-50 border-blue-200 print:hidden shadow-sm">
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
                    <KeyRound className="w-4 h-4"/> ¿Enviar al Jefe de Utileros?
                </CardTitle>
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
                <p className="text-xs text-blue-700 mb-3">
                    Puedes crear un enlace de <strong>Acceso Personal</strong> para que el equipo pueda marcar los ítems desde su celular mientras cargan el camión.
                </p>
                <Link href="/settings/accesos-personal" passHref>
                    <Button size="sm" variant="outline" className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100">
                        Configurar Acceso para Colaboradores
                    </Button>
                </Link>
            </CardContent>
        </Card>

        <div className="bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2 relative min-h-screen">
            <div className="w-full h-24 print:h-20 mb-4 relative">
                <WatermarkedImage src={logoUrl} alt="Marca de agua" containerClassName='w-full h-full'/>
            </div>
            <div className="flex justify-between items-center mb-6 print:hidden">
            <Link href={`/fiestas/nueva/carga-operativa?fiestaId=${fiestaId}`} passHref>
                <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
            </Link>
            <div className="flex gap-2">
                <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
                <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
            </div>
            </div>

            <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
            <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2">
                <PackageSearch className="w-6 h-6 print:w-5 print:h-5" /> Lista de Carga Operativa
            </h1>
            <p className="text-md text-gray-700 print:text-sm mt-1 font-semibold">{fiesta.configuracion.nombreEvento}</p>
            <p className="text-xs text-gray-500 print:text-[8pt]">{formatDate(fiesta.configuracion.fechaEvento)}</p>
            </header>
            
            {(listaDeCarga.categorias || []).length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <Info className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                    <p>y la lista?</p>
                </div>
            )}

            <div className="space-y-6 print:space-y-4">
                {(listaDeCarga.categorias || []).map(categoria => (
                <section key={categoria.id} className="print:break-inside-avoid">
                    <h2 className="text-lg font-bold text-gray-800 print:text-base border-b-2 border-gray-300 pb-1 mb-2 print:pb-0.5 print:mb-1.5 uppercase tracking-wide">
                    {categoria.nombre}
                    </h2>
                    {categoria.items && categoria.items.length > 0 ? (
                    <div className="grid grid-cols-1 gap-1.5 print:gap-1">
                        {categoria.items.map(item => (
                        <div key={item.id} className="flex items-start gap-3 p-2 border border-gray-100 rounded bg-gray-50/30 print:p-1 print:border-gray-200 print:bg-transparent">
                            <div className="w-6 h-6 border-2 border-gray-400 rounded-md flex-shrink-0 mt-0.5 print:w-4 print:h-4 print:border-gray-500 bg-white"></div>
                            <div className="flex-grow">
                            <div className="flex justify-between items-baseline">
                                <p className="text-sm font-bold text-gray-800 print:text-xs">
                                    {item.nombre}
                                </p>
                                <span className="text-sm font-black text-primary print:text-xs bg-primary/5 px-2 rounded print:bg-transparent">
                                    CANT: {item.cantidad} {item.unidad || 'Uds.'}
                                </span>
                            </div>
                            {item.notes && <p className="text-[10px] text-gray-500 italic print:text-[7pt] mt-0.5">Nota: {item.notes}</p>}
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-xs text-gray-400 italic px-1">Sin ítems definidos.</p>
                    )}
                </section>
                ))}
            </div>

            {listaDeCarga.notasGenerales && (
            <section className="mt-8 pt-4 border-t-2 border-gray-200 print:mt-6 print:pt-2 print:border-gray-300 print:break-inside-avoid">
                <h2 className="text-md font-bold text-gray-800 mb-2 print:text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary"/> Notas de Logística:
                </h2>
                <div className="p-3 border rounded bg-yellow-50/30 text-gray-700 print:p-2 print:border-gray-300 print:bg-white print:text-black">
                <p className="text-sm whitespace-pre-line print:text-[9pt]">{listaDeCarga.notasGenerales}</p>
                </div>
            </section>
            )}

            <footer className="mt-12 pt-4 border-t text-center text-[10px] text-gray-400 print:mt-8 print:pt-2 print:border-gray-300">
                <p>Documento Operativo de AK Producciones - Generado el: {new Date().toLocaleString('es-ES')}</p>
            </footer>
        </div>
      </div>
    </div>
  );
}

export default function CargaOperativaPdfPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-3xl mx-auto bg-white flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-primary"/></div>}>
      <CargaOperativaPdfContent />
    </Suspense>
  );
}
