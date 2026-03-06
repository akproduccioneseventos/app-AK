
'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Save, Loader2, Edit, Upload, Image as ImageIcon, Download, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, NumerosMesaData } from '@/types/fiesta';
import { getFiestaById, updateNumerosMesa as updateNumerosMesaAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultNumerosMesaData } from '@/lib/fiesta-defaults';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';

// Helper formatting date
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
    <div className={cn(
        "w-full h-full relative bg-white overflow-hidden border border-gray-200", 
        inverted && 'transform rotate-180'
    )}>
        {data.backgroundImageUrl && (
            <div className="absolute inset-0 opacity-40">
                <NextImage src={data.backgroundImageUrl} layout="fill" objectFit="cover" alt="" data-ai-hint="floral background decoration"/>
            </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
            <h2 className="font-dancing text-7xl md:text-8xl mb-2" style={{ color: data.colorPrincipal }}>
                {`Mesa ${tableNumber}`}
            </h2>
            <p className="font-headline text-2xl uppercase tracking-widest" style={{ color: data.colorSecundario }}>
                {protagonistaNombre}
            </p>
            <p className="font-body text-lg opacity-70 mt-1" style={{ color: data.colorSecundario }}>
                {eventDate}
            </p>
        </div>
        {logoUrl && (
             <div className={cn("absolute w-12 h-12 z-20", inverted ? 'top-4 left-4' : 'bottom-4 right-4')}>
                <NextImage src={logoUrl} alt="logo" layout="fill" className="object-contain grayscale opacity-50" data-ai-hint="company logo watermark"/>
             </div>
        )}
    </div>
  );
};

function NumerosDeMesaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');
  const printRef = useRef<HTMLDivElement>(null);

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
      const [fiestaData, settings] = await Promise.all([
          getFiestaById(fiestaId), 
          getInvoiceTemplateSettings()
      ]);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl || null);

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
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
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
        toast({ title: "¡Configuración Guardada!" });
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

  const handleDownloadJpg = async () => {
    if (!printRef.current) return;
    toast({ title: "Generando imágenes...", description: "Esto puede tardar unos segundos."});
    try {
        const canvas = await html2canvas(printRef.current, { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = `numeros-mesa-${fiesta?.configuracion.nombreEvento}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        toast({ title: "¡Descarga iniciada!" });
    } catch(e) {
        toast({ title: "Error al generar imagen", variant: "destructive"});
    }
  };

  if (isLoading || !fiesta) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  
  if (error) {
    return <div className="p-8 text-center text-destructive flex flex-col items-center gap-4">
        <AlertTriangle className="w-12 h-12"/>
        <p className="font-semibold">{error}</p>
        <Link href={`/fiestas/nueva/invitados/layout?fiestaId=${fiestaId}`}><Button variant="outline">Volver al Diseñador</Button></Link>
    </div>;
  }

  return (
    <div className="bg-muted/30 min-h-screen">
        <div className="py-3 px-4 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-background border-b sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
                <PrinterIcon className="w-6 h-6 text-primary"/>
                <h1 className="font-headline text-xl font-bold">Impresión de Números de Mesa</h1>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex flex-col">
                <Label htmlFor="bg-image-upload" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Imagen Fondo</Label>
                <Input id="bg-image-upload" type="file" accept="image/*" onChange={handleBackgroundImageUpload} className="text-xs w-40 h-8" disabled={isUploading}/>
              </div>
              <div className="flex flex-col">
                 <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Título</Label>
                 <Input type="color" value={data.colorPrincipal || '#9333ea'} onChange={e => handleUpdate('colorPrincipal', e.target.value)} className="w-10 h-8 p-0.5"/>
              </div>
               <div className="flex flex-col">
                 <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Texto</Label>
                 <Input type="color" value={data.colorSecundario || '#363636'} onChange={e => handleUpdate('colorSecundario', e.target.value)} className="w-10 h-8 p-0.5"/>
              </div>
              <div className="flex flex-col">
                 <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Nombre</Label>
                 <Input value={data.protagonistaNombre} onChange={e => handleUpdate('protagonistaNombre', e.target.value)} className="h-8 w-28 text-xs"/>
              </div>
               <div className="flex items-end gap-2 ml-2">
                 <Button size="sm" onClick={handleSave} disabled={isSaving} title="Guardar cambios">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                 </Button>
                 <Button onClick={handleDownloadJpg} size="sm" variant="outline" title="Descargar JPG"><Download className="w-4 h-4"/></Button>
                 <Button onClick={handlePrint} size="sm" variant="outline" title="Imprimir PDF"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva/invitados/layout?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
               </div>
            </div>
        </div>

        {tableCount === 0 ? (
            <div className="max-w-md mx-auto mt-20 text-center space-y-4 p-8 bg-white rounded-lg shadow-md border-2 border-dashed">
                <Info className="w-12 h-12 text-primary mx-auto opacity-50"/>
                <h3 className="text-xl font-bold font-headline">No se detectaron mesas</h3>
                <p className="text-muted-foreground">Debes añadir mesas en el <strong>Diseñador de Salón</strong> para poder imprimir sus números.</p>
                <Link href={`/fiestas/nueva/invitados/layout?fiestaId=${fiestaId}`}>
                    <Button>Ir al Diseñador de Salón</Button>
                </Link>
            </div>
        ) : (
            <div className="flex flex-col items-center py-8 gap-8 print:gap-0 print:py-0" ref={printRef}>
                {Array.from({ length: Math.ceil(tableCount / 2) }).map((_, pageIndex) => {
                    const tableNum1 = pageIndex * 2 + 1;
                    const tableNum2 = pageIndex * 2 + 2;

                    return (
                        <div key={pageIndex} className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none print:break-after-page flex flex-col p-8 print:p-0">
                            <div className="flex-1 grid grid-cols-2 gap-8 print:gap-0">
                                <div className="flex flex-col h-full border border-dashed border-gray-200 print:border-none">
                                    <div className="flex-1">
                                        <TableNumberComponent tableNumber={tableNum1} inverted fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                    </div>
                                    <div className="flex-1">
                                        <TableNumberComponent tableNumber={tableNum1} fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                    </div>
                                </div>

                                {tableNum2 <= tableCount ? (
                                    <div className="flex flex-col h-full border border-dashed border-gray-200 print:border-none">
                                        <div className="flex-1">
                                            <TableNumberComponent tableNumber={tableNum2} inverted fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                        </div>
                                        <div className="flex-1">
                                            <TableNumberComponent tableNumber={tableNum2} fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 bg-gray-50 flex items-center justify-center text-muted-foreground italic border border-dashed">
                                        Espacio vacío
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
            
            @media print {
                body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
                .sidebar, header, nav, button, .no-print, .notifications-hub { display: none !important ; }
                @page { size: A4 portrait; margin: 0; }
                main { padding: 0 !important; margin: 0 !important; }
            }
        `}</style>
    </div>
  );
}

export default function NumerosMesaPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NumerosDeMesaContent/>
        </Suspense>
    )
}
