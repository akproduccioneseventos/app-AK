
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer as PrinterIcon, Palette, CakeSlice, MapPin, StickyNote, Image as ImageIconLucide, Building, PartyPopper, Gift, Camera, Sparkles as SparklesIcon, Share2, AlertTriangle, Info, LayoutDashboard } from 'lucide-react';
import type { FiestaEnPlanificacion, DecoracionData, ZonaContratada, LayoutElement, Invitado, DecorationItem } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try { return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch (e) { return "Fecha inválida"; }
};

const companyName = "AK Producciones";

function DecorationPdfPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const showLayout = searchParams.get('layout') === 'true';

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
      toast({ title: "Error", description: "No se pudieron cargar los datos para el PDF.", variant: "destructive" });
      console.error("Error loading data for PDF:", err);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);
  
  const handlePrint = () => window.print();
  
  const handleShare = async () => {
    if (!fiesta) return;
    const shareData = {
      title: `${showLayout ? 'Plano del Salón' : 'Plan de Decoración'} - ${fiesta.configuracion.nombreEvento}`,
      text: `Aquí tienes el plan de ${showLayout ? 'disposición del salón' : 'decoración'} para el evento.`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) { await navigator.share(shareData); } 
      else { throw new Error('Share API not supported'); }
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      toast({ title: "Enlace Copiado", description: "El enlace ha sido copiado a tu portapapeles." });
    }
  };

  const getZonaIcon = (zonaId: ZonaContratada['id']): React.ElementType => {
    const iconMap: Record<ZonaContratada['id'], React.ElementType> = {
        'atras_torta': CakeSlice, 'frente_salon': Building, 'zona_regalos': Gift,
        'zona_fotografia': Camera, 'centro_salon': SparklesIcon
    };
    return iconMap[zonaId] || Palette;
  };
  
  const itemsAgrupados = React.useMemo(() => 
    (fiesta?.decoracion?.items || []).reduce((acc, item) => {
        const categoria = item.category || 'Otros';
        if (!acc[categoria]) acc[categoria] = [];
        acc[categoria].push(item);
        return acc;
    }, {} as Record<string, DecorationItem[]>), 
  [fiesta?.decoracion?.items]);

  if (isLoading) { return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>; }
  if (!fiesta) { return <div className="p-8 max-w-3xl mx-auto text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold text-lg text-destructive">Error al Cargar</p></div>; }
  
  const { configuracion, decoracion, invitados } = fiesta;

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/fiestas/nueva/decoracion" passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button></Link>
          <div className="flex gap-2"><Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button><Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button></div>
        </div>

        <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2">
            {showLayout ? <LayoutDashboard className="w-6 h-6 print:w-5 print:h-5"/> : <Palette className="w-6 h-6 print:w-5 print:h-5" />}
            {showLayout ? "Plano del Salón" : "Plan de Decoración"}
          </h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{configuracion.nombreEvento}</p>
          <p className="text-xs text-gray-500 print:text-[8pt]">{formatDate(configuracion.fechaEvento)} | {cliente?.name || cliente?.companyName}</p>
        </header>
        
        {showLayout ? (
           <section className="mb-4 print:mb-2 print:break-inside-avoid">
             <div className="relative w-full h-[600px] border rounded-lg bg-muted/30 overflow-hidden canvas-grid-background">
                {decoracion?.salonPlanBackgroundImageUrl && <NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" data-ai-hint="event floor plan"/>}
                {(decoracion?.salonElements || []).map(element => {
                    const assignedGuests = (invitados || []).filter(inv => inv.tableNumber === element.name);
                    const isRound = element.category === 'Mesa Redonda';
                    return (
                        <div key={element.id} 
                             className={`absolute border border-gray-500 bg-white/70 p-1 flex flex-col items-center justify-center ${isRound ? 'rounded-full' : 'rounded-sm'}`}
                             style={{ left: `${element.x}px`, top: `${element.y}px`, width: `${element.width}px`, height: `${element.height}px`, transform: `rotate(${element.rotation}deg)`}}>
                           <p className="text-xs font-bold print:text-[10pt]">{element.name}</p>
                           {assignedGuests.length > 0 && (
                               <ul className="text-[8px] list-disc list-inside mt-1 print:text-[7pt]">
                                   {assignedGuests.map(g => <li key={g.id} className="truncate">{g.nombre}</li>)}
                               </ul>
                           )}
                        </div>
                    )
                })}
            </div>
          </section>
        ) : (
            <div className="space-y-4 print:space-y-2">
              <section className="grid grid-cols-2 gap-4 text-sm print:text-xs">
                <div><span className="font-semibold">Tema:</span> {decoracion?.tema || 'No definido'}</div>
                <div className="flex items-center gap-2"><span className="font-semibold">Paleta:</span>
                  <div className="w-4 h-4 rounded-full border" style={{backgroundColor: decoracion?.paletaColores?.primary}}></div>
                  <div className="w-4 h-4 rounded-full border" style={{backgroundColor: decoracion?.paletaColores?.secondary}}></div>
                  <div className="w-4 h-4 rounded-full border" style={{backgroundColor: decoracion?.paletaColores?.accent}}></div>
                </div>
              </section>
              {decoracion?.moodboardImageUrl && <section className="mb-2 print:break-inside-avoid"><h2 className="font-semibold text-gray-800 text-sm mb-1">Moodboard General</h2><img src={decoracion.moodboardImageUrl} alt="Moodboard" className="max-w-full h-auto rounded-md border" data-ai-hint="event moodboard inspiration"/></section>}
              {Object.entries(itemsAgrupados).map(([categoria, items]) => (
                <section key={categoria} className="mb-2 print:break-inside-avoid"><h2 className="text-lg font-semibold text-gray-800 print:text-base border-b mb-2 pb-1">{categoria}</h2><ul className="space-y-1">{items.map(item => <li key={item.id} className="text-sm print:text-xs">{item.quantity}x {item.name} {item.notes ? `- ${item.notes}` : ''}</li>)}</ul></section>
              ))}
              {(decoracion?.zonasContratadas || []).filter(z => z.activada).length > 0 && <section className="mb-2 print:break-inside-avoid"><h2 className="text-lg font-semibold text-gray-800 print:text-base border-b mb-2 pb-1">Zonas Decorativas Específicas</h2>
                  <div className="space-y-2">{decoracion!.zonasContratadas!.filter(z => z.activada).map(zona => {
                      const Icono = getZonaIcon(zona.id);
                      return (<div key={zona.id}><h3 className="font-medium text-sm flex items-center gap-2"><Icono className="w-4 h-4"/>{zona.nombreDisplay}</h3><p className="text-xs text-muted-foreground pl-6">{zona.descripcion || 'Sin descripción detallada.'}</p></div>)
                  })}</div>
              </section>}
              {decoracion?.decoracionTorta?.descripcion && <section className="mb-2 print:break-inside-avoid"><h2 className="text-lg font-semibold text-gray-800 print:text-base border-b mb-2 pb-1">Decoración de Torta</h2><p className="text-sm print:text-xs">{decoracion.decoracionTorta.descripcion}</p></section>}
              {decoracion?.pdfNotasAdicionales && <section className="mt-4 pt-2 border-t print:break-before-page"><h2 className="text-lg font-semibold text-gray-800 print:text-base mb-1 flex items-center gap-2"><StickyNote className="w-5 h-5"/>Notas Adicionales</h2><p className="text-sm print:text-xs whitespace-pre-wrap">{decoracion.pdfNotasAdicionales}</p></section>}
            </div>
        )}
        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300"><p>Documento generado por {companyName} el: {new Date().toLocaleString('es-ES')}</p></footer>
      </div>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>}><DecorationPdfPageContent /></Suspense>; }
