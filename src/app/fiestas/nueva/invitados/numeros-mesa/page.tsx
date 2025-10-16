
'use client';

import React, { useState, useEffect, useCallback, use, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Loader2, AlertTriangle, Edit } from 'lucide-react';
import NextImage from 'next/image';
import { EditableText } from '@/components/invitacion/edit/EditableText';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UploadButton } from '@/components/invitacion/edit/UploadButton';
import { useSearchParams } from 'next/navigation';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch (e) { return "Fecha inválida"; }
};

interface TableNumberData {
  protagonistName: string;
  eventDate: string;
  backgroundImageUrl: string;
  logoUrl: string;
}

function NumerosDeMesaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(0);

  const [data, setData] = useState<TableNumberData>({
    protagonistName: 'La Agasajada',
    eventDate: formatDate(new Date().toISOString()),
    backgroundImageUrl: 'https://picsum.photos/seed/flowers-bg/800/400',
    logoUrl: ''
  });

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([getFiestaById(fiestaId), getInvoiceTemplateSettings()]);
      if (!fiestaData) throw new Error("Fiesta no encontrada");

      setData({
        protagonistName: fiestaData.configuracion.protagonista1Nombre || 'La Agasajada',
        eventDate: formatDate(fiestaData.configuracion.fechaEvento),
        backgroundImageUrl: data.backgroundImageUrl, // Keep local changes unless explicitly reloaded
        logoUrl: settings.logoUrl || data.logoUrl,
      });

      const tables = fiestaData.decoracion?.salonElements?.filter(el => el.category?.toLowerCase().includes('mesa')) || [];
      setTableCount(tables.length);
    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId, data.backgroundImageUrl, data.logoUrl]);

  useEffect(() => {
    loadData();
  }, [fiestaId]); // Depend on fiestaId, loadData is stable

  const handleUpdate = (field: keyof TableNumberData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-8 max-w-4xl mx-auto text-center"><AlertTriangle className="mx-auto w-10" /> {error}</div>;
  }
  
  const TableNumberCard: React.FC<{ tableNumber: number }> = ({ tableNumber }) => (
    <div className="border border-black relative bg-gray-100 overflow-hidden">
        <NextImage src={data.backgroundImageUrl} layout="fill" objectFit="cover" className="opacity-40" alt="" data-ai-hint="floral background"/>
        {data.logoUrl && <NextImage src={data.logoUrl} width={50} height={20} alt="logo" className="absolute bottom-2 right-2 object-contain" data-ai-hint="company logo"/>}
         <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <h2 className="font-['Dancing_Script',_cursive] text-6xl text-purple-600">Mesa {tableNumber}</h2>
            <p className="font-['Belleza',_serif] text-xl mt-1 text-purple-700">{data.protagonistName}</p>
            <p className="font-['Belleza',_serif] text-lg text-purple-600/80">{data.eventDate}</p>
        </div>
    </div>
  );

  return (
    <div className="bg-gray-100 print:bg-white">
        <div className="py-4 px-8 print:hidden flex justify-between items-center bg-white shadow-sm sticky top-0 z-50">
            <div className='flex items-center gap-4'>
                <h1 className="font-headline text-xl">Imprimir Números de Mesa</h1>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>Editar Contenido</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Editar Contenido</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1"><Label>Nombre Agasajada</Label><Input value={data.protagonistName} onChange={e => handleUpdate('protagonistName', e.target.value)} /></div>
                            <div className="space-y-1"><Label>Fecha del Evento</Label><Input value={data.eventDate} onChange={e => handleUpdate('eventDate', e.target.value)} /></div>
                            <div className="space-y-1"><Label>Imagen de Fondo</Label><UploadButton fiestaId={fiestaId || undefined} currentUrl={data.backgroundImageUrl} onUrlChange={url => handleUpdate('backgroundImageUrl', url)}/></div>
                            <div className="space-y-1"><Label>Logo</Label><UploadButton fiestaId={fiestaId || undefined} currentUrl={data.logoUrl} onUrlChange={url => handleUpdate('logoUrl', url)}/></div>
                        </div>
                        <DialogFooter><DialogClose asChild><Button>Cerrar</Button></DialogClose></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex gap-2">
                <Link href={`/fiestas/nueva/invitados/layout?fiestaId=${fiestaId}`} passHref>
                    <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Diseño</Button>
                </Link>
                <Button onClick={handlePrint}><PrinterIcon className="w-4 h-4 mr-2"/>Imprimir</Button>
            </div>
        </div>

        {Array.from({ length: Math.ceil(tableCount / 2) }).map((_, pageIndex) => {
            const tableNum1 = pageIndex * 2 + 1;
            const tableNum2 = pageIndex * 2 + 2;

            return (
                <div key={pageIndex} className="w-[210mm] h-[297mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto print:break-after-page p-4 flex flex-col">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        {/* Empty top cells */}
                        <div className="border border-black"></div>
                        <div className="border border-black"></div>
                    </div>
                     <div className="flex-1 grid grid-cols-2 gap-4 mt-4">
                        {/* Content cells - upside down */}
                        <div className="border border-black relative bg-gray-100 overflow-hidden">
                             <div className="absolute inset-0 transform rotate-180">
                                <TableNumberCard tableNumber={tableNum1} />
                             </div>
                        </div>
                        {tableNum2 <= tableCount && (
                             <div className="border border-black relative bg-gray-100 overflow-hidden">
                                <div className="absolute inset-0 transform rotate-180">
                                    <TableNumberCard tableNumber={tableNum2} />
                                </div>
                            </div>
                        )}
                    </div>
                     <div className="flex-1 grid grid-cols-2 gap-4 mt-4">
                        {/* Content cells - upright */}
                        <TableNumberCard tableNumber={tableNum1} />
                        {tableNum2 <= tableCount && <TableNumberCard tableNumber={tableNum2} />}
                    </div>
                </div>
            );
        })}
        <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
             @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                 @page {
                    size: A4 portrait;
                    margin: 0;
                }
            }
        `}</style>
    </div>
  );
}

export default function NumerosDeMesaPageWrapper() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NumerosDeMesaContent/>
        </Suspense>
    )
}
