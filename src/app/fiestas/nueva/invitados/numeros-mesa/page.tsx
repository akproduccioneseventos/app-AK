
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Loader2, AlertTriangle } from 'lucide-react';
import NextImage from 'next/image';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch (e) { return "Fecha inválida"; }
};

export default function NumerosDeMesaPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([getFiestaActual(), getInvoiceTemplateSettings()]);
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl);
      const tables = fiestaData.decoracion?.salonElements?.filter(el => el.category?.toLowerCase().includes('mesa')) || [];
      setTableCount(tables.length);
    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => window.print();

  if (isLoading) {
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error || !fiesta) {
    return <div className="p-8 max-w-4xl mx-auto text-center"><AlertTriangle className="mx-auto w-10" /> {error}</div>;
  }
  
  const protagonistName = fiesta.configuracion.protagonista1Nombre || 'Luciana';

  return (
    <div className="bg-gray-100 print:bg-white">
        <div className="py-4 px-8 print:hidden flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
            <h1 className="font-headline text-xl">Imprimir Números de Mesa</h1>
            <div className="flex gap-2">
                <Link href={`/fiestas/nueva/invitados?fiestaId=${fiesta.id}`} passHref>
                    <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Invitados</Button>
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
                                <NextImage src="https://picsum.photos/seed/flowers-bg/800/400" layout="fill" objectFit="cover" className="opacity-40" alt="" data-ai-hint="floral background"/>
                                {logoUrl && <NextImage src={logoUrl} width={50} height={20} alt="logo" className="absolute top-2 left-2 object-contain" data-ai-hint="company logo"/>}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <h2 className="font-['Dancing_Script',_cursive] text-6xl text-purple-600">Mesa {tableNum1}</h2>
                                    <p className="font-['Belleza',_serif] text-xl mt-1 text-purple-700">{protagonistName}</p>
                                    <p className="font-['Belleza',_serif] text-lg text-purple-600/80">{formatDate(fiesta.configuracion.fechaEvento)}</p>
                                </div>
                             </div>
                        </div>
                        {tableNum2 <= tableCount && (
                             <div className="border border-black relative bg-gray-100 overflow-hidden">
                                <div className="absolute inset-0 transform rotate-180">
                                    <NextImage src="https://picsum.photos/seed/flowers-bg/800/400" layout="fill" objectFit="cover" className="opacity-40" alt="" data-ai-hint="floral background"/>
                                    {logoUrl && <NextImage src={logoUrl} width={50} height={20} alt="logo" className="absolute top-2 left-2 object-contain" data-ai-hint="company logo"/>}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <h2 className="font-['Dancing_Script',_cursive] text-6xl text-purple-600">Mesa {tableNum2}</h2>
                                        <p className="font-['Belleza',_serif] text-xl mt-1 text-purple-700">{protagonistName}</p>
                                        <p className="font-['Belleza',_serif] text-lg text-purple-600/80">{formatDate(fiesta.configuracion.fechaEvento)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                     <div className="flex-1 grid grid-cols-2 gap-4 mt-4">
                        {/* Content cells - upright */}
                        <div className="border border-black relative bg-gray-100 overflow-hidden">
                            <NextImage src="https://picsum.photos/seed/flowers-bg/800/400" layout="fill" objectFit="cover" className="opacity-40" alt="" data-ai-hint="floral background"/>
                            {logoUrl && <NextImage src={logoUrl} width={50} height={20} alt="logo" className="absolute bottom-2 right-2 object-contain" data-ai-hint="company logo"/>}
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <h2 className="font-['Dancing_Script',_cursive] text-6xl text-purple-600">Mesa {tableNum1}</h2>
                                <p className="font-['Belleza',_serif] text-xl mt-1 text-purple-700">{protagonistName}</p>
                                <p className="font-['Belleza',_serif] text-lg text-purple-600/80">{formatDate(fiesta.configuracion.fechaEvento)}</p>
                            </div>
                        </div>
                        {tableNum2 <= tableCount && (
                            <div className="border border-black relative bg-gray-100 overflow-hidden">
                                <NextImage src="https://picsum.photos/seed/flowers-bg/800/400" layout="fill" objectFit="cover" className="opacity-40" alt="" data-ai-hint="floral background"/>
                                {logoUrl && <NextImage src={logoUrl} width={50} height={20} alt="logo" className="absolute bottom-2 right-2 object-contain" data-ai-hint="company logo"/>}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <h2 className="font-['Dancing_Script',_cursive] text-6xl text-purple-600">Mesa {tableNum2}</h2>
                                    <p className="font-['Belleza',_serif] text-xl mt-1 text-purple-700">{protagonistName}</p>
                                    <p className="font-['Belleza',_serif] text-lg text-purple-600/80">{formatDate(fiesta.configuracion.fechaEvento)}</p>
                                </div>
                            </div>
                        )}
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
            }
        `}</style>
    </div>
  );
}
