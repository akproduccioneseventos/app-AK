'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, Edit, Upload, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, NumerosMesaData } from '@/types/fiesta';
import { getFiestaById, updateNumerosMesa as updateNumerosMesaAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultNumerosMesaData } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';

const formatDate = (dateString?: string) => {
  if (!dateString) return "____________";
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return "Fecha inválida";
  }
};

const TableNumberComponent: React.FC<{
  fiesta: FiestaEnPlanificacion;
  data: NumerosMesaData;
  logoUrl: string | null;
  tableNumber: number;
  inverted?: boolean;
}> = ({ fiesta, data, logoUrl, tableNumber, inverted }) => {
  
  const protagonistaNombre = data.protagonistaNombre || fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const eventDate = data.fechaEvento || formatDate(fiesta.configuracion.fechaEvento);

  return (
    <div className={`border border-black relative bg-gray-100 overflow-hidden ${inverted ? 'transform rotate-180' : ''} h-full`}>
        {data.backgroundImageUrl && <NextImage src={data.backgroundImageUrl} layout="fill" objectFit="cover" className="opacity-40" alt="" data-ai-hint="floral background"/>}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
            <h2 className="font-['Dancing_Script',_cursive] text-6xl" style={{color: data.colorPrincipal}}>{`Mesa ${tableNumber}`}</h2>
            <p className="font-['Belleza',_serif] text-xl mt-1" style={{color: data.colorSecundario}}>{protagonistaNombre}</p>
            <p className="font-['Belleza',_serif] text-lg opacity-80" style={{color: data.colorSecundario}}>{eventDate}</p>
        </div>
        {logoUrl && (
             <div className={`absolute w-10 h-10 ${inverted ? 'bottom-2 left-2' : 'bottom-2 right-2'}`}>
                <NextImage src={logoUrl} alt="logo" layout="fill" className="object-contain" data-ai-hint="company logo"/>
             </div>
        )}
    </div>
  );
};


function NumerosDeMesaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [data, setData] = useState<NumerosMesaData>(defaultNumerosMesaData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(0);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([getFiestaById(fiestaId), getInvoiceTemplateSettings()]);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl);

      const mergedData = { ...defaultNumerosMesaData, ...(fiestaData.numerosMesa || {}) };
      if (!mergedData.protagonistaNombre) {
        mergedData.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'La Agasajada';
      }
      if (!mergedData.fechaEvento) {
        mergedData.fechaEvento = formatDate(fiestaData.configuracion.fechaEvento);
      }
      setData(mergedData);
      
      const tables = fiestaData.decoracion?.salonElements?.filter(el => el.category?.toLowerCase().includes('mesa')) || [];
      setTableCount(tables.length);
    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [fiestaId, loadData]);
  
  const handleUpdate = (field: keyof NumerosMesaData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleBackgroundImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
      if(result.success && result.url) {
        setData(prev => ({ ...prev, backgroundImageUrl: result.url }));
        toast({title: "Imagen de fondo actualizada"});
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al subir", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateNumerosMesaAction(fiestaId, data);
      if (result.success) {
        toast({ title: "Guardado!", description: "La configuración se ha guardado." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
       toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  const handlePrint = () => window.print();
  
  if (isLoading || !fiesta) {
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-8 max-w-4xl mx-auto text-center">{error}</div>;
  }
  
  return (
    <div className="bg-gray-100 print:bg-white">
        <div className="py-4 px-8 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-white shadow-sm sticky top-0 z-50">
            <h1 className="font-headline text-xl">Editor de Números de Mesa</h1>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="space-y-1">
                <Label htmlFor="bg-image-upload" className="text-xs">Fondo</Label>
                <Input id="bg-image-upload" type="file" accept="image/*" onChange={handleBackgroundImageUpload} className="text-xs w-48" disabled={isUploading}/>
              </div>
              <div className="space-y-1">
                 <Label className="text-xs">Color Título</Label>
                 <Input type="color" value={data.colorPrincipal || '#9333ea'} onChange={e => handleUpdate('colorPrincipal', e.target.value)} className="w-10 h-9 p-0.5"/>
              </div>
               <div className="space-y-1">
                 <Label className="text-xs">Color Texto</Label>
                 <Input type="color" value={data.colorSecundario || '#363636'} onChange={e => handleUpdate('colorSecundario', e.target.value)} className="w-10 h-9 p-0.5"/>
              </div>
              <div className="space-y-1">
                 <Label className="text-xs">Nombre</Label>
                 <Input value={data.protagonistaNombre} onChange={e => handleUpdate('protagonistaNombre', e.target.value)} className="h-9 w-32"/>
              </div>
               <Separator orientation="vertical" className="h-10 mx-2"/>
               <div className="flex items-end gap-2">
                 <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}</Button>
                 <Button onClick={handlePrint} size="sm" variant="outline"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva/invitados?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
               </div>
            </div>
        </div>

        {Array.from({ length: Math.ceil(tableCount / 2) }).map((_, pageIndex) => {
            const tableNum1 = pageIndex * 2 + 1;
            const tableNum2 = pageIndex * 2 + 2;

            return (
                <div key={pageIndex} className="w-[210mm] h-[297mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto print:break-after-page p-4 flex flex-col">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="border border-black"></div>
                        <div className="border border-black"></div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4 mt-4">
                        <TableNumberComponent tableNumber={tableNum1} inverted fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                        {tableNum2 <= tableCount && (
                            <TableNumberComponent tableNumber={tableNum2} inverted fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                        )}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4 mt-4">
                        <TableNumberComponent tableNumber={tableNum1} fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                        {tableNum2 <= tableCount && <TableNumberComponent tableNumber={tableNum2} fiesta={fiesta} data={data} logoUrl={logoUrl}/>}
                    </div>
                </div>
            );
        })}
        <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
             @media print {
                body { -webkit-print-color-adjust: exact; color-adjust: exact; }
                @page { size: A4 portrait; margin: 0; }
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
