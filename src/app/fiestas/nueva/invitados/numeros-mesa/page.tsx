
'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent, useRef, useMemo } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Printer as PrinterIcon, Save, Loader2, Plus, Minus, Download, Tag, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, NumerosMesaData } from '@/types/fiesta';
import { getFiestaById, updateNumerosMesa as updateNumerosMesaAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultNumerosMesaData } from '@/lib/fiesta-defaults';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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

const companyName = "AK Producciones";

const TableCardFace: React.FC<{
  fiesta: FiestaEnPlanificacion;
  data: NumerosMesaData;
  logoUrl: string | null;
  tableNumber: number;
  customLabel?: string;
  inverted?: boolean;
}> = ({ fiesta, data, logoUrl, tableNumber, customLabel, inverted }) => {
  const protagonistaNombre = data.protagonistaNombre || fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const eventDate = data.fechaEvento || formatDate(fiesta.configuracion.fechaEvento);

  return (
    <div className={cn(
        "w-full h-full relative bg-white overflow-hidden flex flex-col items-center justify-center p-6", 
        inverted && 'transform rotate-180'
    )}>
        {/* Background Image (Floral) */}
        {data.backgroundImageUrl && (
            <div className="absolute inset-0 opacity-100 -z-10">
                <NextImage 
                    src={data.backgroundImageUrl} 
                    layout="fill" 
                    objectFit="cover" 
                    alt="" 
                    data-ai-hint="floral background"
                />
            </div>
        )}

        <div className="text-center z-10 space-y-4">
            <h2 className="font-dancing text-[100px] leading-none mb-2 text-slate-700">
                Mesa {tableNumber}
            </h2>
            {customLabel && (
                <p className="font-headline text-2xl uppercase tracking-widest font-black text-slate-500 -mt-4 mb-4">
                    {customLabel}
                </p>
            )}
            <div className="space-y-1">
                <p className="font-headline text-3xl uppercase tracking-[0.2em] font-bold text-slate-800">
                    {protagonistaNombre}
                </p>
                <p className="font-body text-xl font-semibold italic text-slate-600">
                    {eventDate}
                </p>
            </div>
        </div>

        {logoUrl && (
             <div className={cn("absolute w-16 h-16 z-20", inverted ? 'top-6 left-6' : 'bottom-6 right-6')}>
                <NextImage 
                    src={logoUrl} 
                    alt="logo" 
                    width={64} 
                    height={64} 
                    className="object-contain filter drop-shadow-md brightness-100" 
                />
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

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [data, setData] = useState<NumerosMesaData>(defaultNumerosMesaData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tableCount, setTableCount] = useState(20);

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

      const mergedData = { 
          ...defaultNumerosMesaData, 
          labels: {},
          ...(fiestaData.numerosMesa || {}) 
      };
      if (!mergedData.protagonistaNombre) {
        mergedData.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'Protagonista';
      }
      if (!mergedData.fechaEvento) {
        mergedData.fechaEvento = formatDate(fiestaData.configuracion.fechaEvento);
      }
      setData(mergedData);
      
      const tables = fiestaData.decoracion?.salonElements?.filter(el => el.category?.toLowerCase().includes('mesa')) || [];
      if (tables.length > 0) {
          setTableCount(tables.length);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleUpdate = (field: keyof NumerosMesaData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleLabelChange = (tableNum: number, label: string) => {
      setData(prev => ({
          ...prev,
          labels: {
              ...(prev.labels || {}),
              [tableNum]: label
          }
      }));
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
        toast({ title: "¡Etiquetas y Diseño Guardados!" });
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
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="bg-slate-100 min-h-screen flex flex-col md:flex-row">
        {/* Sidebar Settings (Hidden on print) */}
        <div className="w-full md:w-80 bg-white border-r p-6 space-y-6 overflow-y-auto print:hidden">
            <div className="flex items-center gap-3 mb-2">
                <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5"/></Button></Link>
                <h1 className="font-headline text-xl font-bold">Números de Mesa</h1>
            </div>

            <Separator/>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad de Mesas</Label>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setTableCount(Math.max(1, tableCount - 1))}><Minus className="w-4 h-4"/></Button>
                        <Input type="number" value={tableCount} onChange={e => setTableCount(parseInt(e.target.value) || 1)} className="text-center font-bold text-lg"/>
                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setTableCount(tableCount + 1)}><Plus className="w-4 h-4"/></Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagen de Fondo Floral</Label>
                    <div className="flex flex-col gap-2">
                        <Input type="file" accept="image/*" onChange={handleBackgroundImageUpload} disabled={isUploading} className="text-xs"/>
                        <p className="text-[9px] text-muted-foreground italic">Se recomienda una imagen sutil para no tapar el texto.</p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Tag className="w-3 h-3"/> Etiquetas por Mesa
                    </Label>
                    <ScrollArea className="h-[300px] border rounded-xl p-3 bg-slate-50">
                        <div className="space-y-3">
                            {Array.from({ length: tableCount }).map((_, i) => {
                                const num = i + 1;
                                return (
                                    <div key={num} className="space-y-1">
                                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Mesa {num}</Label>
                                        <Input 
                                            value={data.labels?.[num] || ''} 
                                            onChange={e => handleLabelChange(num, e.target.value)}
                                            placeholder="Ej: Familia, Trabajo..."
                                            className="h-8 text-xs rounded-lg"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <div className="pt-4 space-y-3">
                <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Guardar Configuración
                </Button>
                <Button onClick={handlePrint} variant="secondary" className="w-full rounded-xl h-12 font-bold">
                    <PrinterIcon className="w-4 h-4 mr-2"/> Imprimir PDF (A4)
                </Button>
            </div>
        </div>

        {/* Print Canvas */}
        <div className="flex-1 flex flex-col items-center py-8 gap-12 bg-slate-200 print:bg-white print:gap-0 print:py-0 overflow-y-auto">
            <div className="max-w-4xl w-full p-4 print:hidden">
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="w-4 h-4 text-blue-600"/>
                    <AlertTitle className="text-blue-800 font-bold">Vista Previa de Impresión</AlertTitle>
                    <p className="text-xs text-blue-700">Las tarjetas están diseñadas para imprimirse en A4. Dóblalas por la línea de puntos para armar la carpa.</p>
                </Alert>
            </div>

            {Array.from({ length: Math.ceil(tableCount / 2) }).map((_, pageIndex) => {
                const tableNum1 = pageIndex * 2 + 1;
                const tableNum2 = pageIndex * 2 + 2;

                return (
                    <div key={pageIndex} className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none print:break-after-page flex flex-row p-0 border border-slate-300 print:border-none">
                        {/* Columna Izquierda (Mesa 1) */}
                        <div className="flex-1 border-r border-dashed border-slate-200 print:border-slate-400 relative">
                            {/* Parte superior invertida */}
                            <div className="h-1/2 border-b border-dotted border-slate-300">
                                <TableCardFace tableNumber={tableNum1} customLabel={data.labels?.[tableNum1]} inverted fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                            </div>
                            {/* Parte inferior normal */}
                            <div className="h-1/2">
                                <TableCardFace tableNumber={tableNum1} customLabel={data.labels?.[tableNum1]} fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                            </div>
                            {/* Guía de doblado central */}
                            <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-slate-400 z-30 pointer-events-none"></div>
                        </div>

                        {/* Columna Derecha (Mesa 2) */}
                        <div className="flex-1 relative">
                            {tableNum2 <= tableCount ? (
                                <>
                                    <div className="h-1/2 border-b border-dotted border-slate-300">
                                        <TableCardFace tableNumber={tableNum2} customLabel={data.labels?.[tableNum2]} inverted fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                    </div>
                                    <div className="h-1/2">
                                        <TableCardFace tableNumber={tableNum2} customLabel={data.labels?.[tableNum2]} fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                    </div>
                                    <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-slate-400 z-30 pointer-events-none"></div>
                                </>
                            ) : (
                                <div className="h-full bg-slate-50 flex items-center justify-center opacity-20">
                                    <PrinterIcon className="w-20 h-20 text-slate-300"/>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
            
            @media print {
                body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
                .sidebar, header, nav, button, .no-print, .notifications-hub, .sidebar-inset > header, .fixed-footer, aside { display: none !important ; }
                @page { size: A4 portrait; margin: 0; }
                main { padding: 0 !important; margin: 0 !important; }
                .print-main-override { padding: 0 !important; }
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
